/**
 * VoipService — Real WebRTC implementation using react-native-webrtc.
 *
 * Responsibilities:
 *  - Manage RTCPeerConnection lifecycle (offer/answer/ICE)
 *  - Acquire local media via getUserMedia
 *  - Coordinate SDP and ICE exchange through SignalingService
 *  - Emit 'pqc_handshake_needed' when ICE connects (PqSrtpService listens)
 *  - Expose toggleMute / toggleCamera for UI controls
 *
 * NOT responsible for PQ-SRTP key negotiation — that is PqSrtpService's domain.
 */

import { EventEmitter } from 'events';
import {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    mediaDevices,
} from 'react-native-webrtc';
import { createCipheriv, randomBytes, createHmac } from 'crypto';
import { signalingService, SignalingMessage } from './SignalingService';
import type {
    CallState,
    CallEvent,
    MediaConfig,
    PqcHandshakePayload,
    EncryptedVoicemail,
} from './VoipService.types';

/**
 * HKDF-SHA-256 helper — keeps the encrypted-voicemail leg independent of the
 * SRTP master key by deriving a separate 32-byte AES-GCM key with a distinct
 * info string. Mirrors the Rust `derive_voicemail_key` impl in srtp.rs so a
 * voicemail recorded on one peer is readable on the other.
 */
function hkdfExpand(prk: Buffer, info: Buffer, length: number): Buffer {
    const out = Buffer.alloc(length);
    let prev = Buffer.alloc(0);
    let pos = 0;
    let counter = 1;
    while (pos < length) {
        const h = createHmac('sha256', prk);
        h.update(prev);
        h.update(info);
        h.update(Buffer.from([counter]));
        prev = h.digest();
        const toCopy = Math.min(prev.length, length - pos);
        prev.copy(out, pos, 0, toCopy);
        pos += toCopy;
        counter++;
    }
    return out;
}

function deriveVoicemailKey(sharedSecret: Buffer): Buffer {
    // HKDF-Extract with empty salt
    const prk = createHmac('sha256', Buffer.alloc(32, 0)).update(sharedSecret).digest();
    return hkdfExpand(prk, Buffer.from('zipminator-voicemail-key'), 32);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const DEFAULT_MEDIA_CONFIG: MediaConfig = { audio: true, video: true };

// Sentinel value: PqSrtpService should extract the real fingerprint from localDescription.sdp
const DTLS_FINGERPRINT_FROM_SDP = 'sdp-derived';

// ─── VoipService ─────────────────────────────────────────────────────────────

export class VoipService extends EventEmitter {
    // Using 'any' for pc to remain compatible with both real react-native-webrtc
    // and the constructor-style mock used in tests.
    private pc: any | null = null;
    private localStream: any | null = null;
    private targetPeerId: string | null = null;
    private callState: CallState = 'idle';
    private muted = false;
    private cameraOff = false;
    /** Live shared secret used for the voicemail key derivation. */
    private liveSharedSecret: Buffer | null = null;
    /** History of all states traversed in the current call (for diagnostics + tests). */
    private stateHistory: CallState[] = [];
    /** Per-call identifier set on outgoing/incoming. */
    private currentCallId: string | null = null;

    // ── Public API ────────────────────────────────────────────────────────────

    /** Initiate an outgoing call to targetId. No-op if a call is already active. */
    async startCall(targetId: string, config: MediaConfig = DEFAULT_MEDIA_CONFIG): Promise<void> {
        if (this.callState !== 'idle') {
            console.warn('VoipService: startCall() called while call is already in progress');
            return;
        }

        this.targetPeerId = targetId;
        this.currentCallId = `call-${Date.now()}-${targetId}`;
        this.stateHistory = []; // fresh history for the new call
        this.liveSharedSecret = null; // discard prior call's secret
        // Two-phase emission: outgoing (UI dialling) → offering (SDP ready).
        // Tests assert 'offering'; new state-machine consumers can observe 'outgoing'.
        this._setState('outgoing');
        this._setState('offering');

        try {
            await this._acquireMedia(config);
            this._createPeerConnection();

            const offer = await this.pc.createOffer({});
            await this.pc.setLocalDescription(new RTCSessionDescription(offer));

            signalingService.send({
                type: 'offer',
                target: targetId,
                sdp: offer.sdp,
            });
        } catch (err) {
            console.error('VoipService: startCall failed', err);
            this._teardown();
        }
    }

    /** Accept an incoming offer message. */
    async answerCall(msg: Pick<SignalingMessage, 'type' | 'sender' | 'sdp'>): Promise<void> {
        this.targetPeerId = msg.sender;
        this._setState('connecting');

        try {
            await this._acquireMedia(DEFAULT_MEDIA_CONFIG);
            this._createPeerConnection();

            await this.pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: msg.sdp ?? '' })
            );

            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(new RTCSessionDescription(answer));

            signalingService.send({
                type: 'answer',
                target: msg.sender,
                sdp: answer.sdp,
            });
        } catch (err) {
            console.error('VoipService: answerCall failed', err);
            this._teardown();
        }
    }

    /** Handle any incoming signaling message (answer / candidate / hangup). */
    async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
        switch (msg.type) {
            case 'offer':
                await this.answerCall(msg);
                break;

            case 'answer':
                if (!this.pc) {
                    console.warn('VoipService: received answer but no peer connection exists');
                    return;
                }
                await this.pc.setRemoteDescription(
                    new RTCSessionDescription({ type: 'answer', sdp: msg.sdp ?? '' })
                );
                // Caller-side: receiving the answer means ICE will start checking.
                // Mark 'connecting' so the state machine reflects the handshake-in-progress
                // window between SDP exchange and ICE connected.
                if (this.callState === 'ringing' || this.callState === 'offering') {
                    this._setState('connecting');
                }
                break;

            case 'candidate':
                await this._addIceCandidate(msg.candidate);
                break;

            default:
                // pqc_handshake messages are handled by PqSrtpService, not here
                break;
        }
    }

    /** End the current call and release all resources. */
    endCall(): void {
        // Distinct hangup state for observers that want to know teardown started.
        if (this.callState !== 'idle' && this.callState !== 'ended') {
            this._setState('hangup');
        }
        this._teardown('ended');
    }

    /**
     * Toggle audio mute. Returns new muted state.
     * Safe to call before/after call — silently no-ops when no stream.
     */
    toggleMute(): boolean {
        this.muted = !this.muted;
        this._applyAudioEnabled(!this.muted);
        return this.muted;
    }

    /**
     * Toggle camera on/off. Returns new cameraOff state.
     * Safe to call before/after call — silently no-ops when no stream.
     */
    toggleCamera(): boolean {
        this.cameraOff = !this.cameraOff;
        this._applyVideoEnabled(!this.cameraOff);
        return this.cameraOff;
    }

    /** Expose peer connection for testing / PqSrtpService integration. */
    getPeerConnection(): any | null {
        return this.pc;
    }

    getCallState(): CallState {
        return this.callState;
    }

    /** Full ordered list of states the current/last call has traversed. */
    getStateHistory(): CallState[] {
        return [...this.stateHistory];
    }

    /**
     * Mark the call as ringing on the wire — signals to the UI that the remote
     * side has accepted the offer and is alerting the user. Pure state-machine
     * transition; does not interact with the peer connection.
     */
    markRinging(): void {
        if (this.callState === 'outgoing' || this.callState === 'offering') {
            this._setState('ringing');
        }
    }

    /**
     * Mark the call as actively flowing media. Should be called by the PQC
     * handshake completion handler after SRTP keys are injected.
     */
    markMediaFlowing(sharedSecret?: Buffer | Uint8Array): void {
        if (this.callState === 'connected') {
            if (sharedSecret) {
                this.liveSharedSecret = Buffer.from(sharedSecret);
            }
            this._setState('media-flow');
        }
    }

    /**
     * Record an encrypted voicemail leg using the live session's shared secret.
     *
     * The voicemail is encrypted with AES-256-GCM under a key derived via
     * HKDF-SHA-256 (info=`zipminator-voicemail-key`) from the live ML-KEM-768
     * shared secret. Server cannot decrypt — only the recipient holding the
     * same shared secret can.
     *
     * Caller is expected to invoke this *after* `endCall()` while the secret
     * is still in scope, OR to pass an explicit `secret` for offline replay.
     */
    recordEncryptedVoicemail(
        audioPayload: Buffer | Uint8Array,
        opts?: { callId?: string; secret?: Buffer | Uint8Array },
    ): EncryptedVoicemail {
        const secret = opts?.secret ? Buffer.from(opts.secret) : this.liveSharedSecret;
        if (!secret) {
            throw new Error(
                'recordEncryptedVoicemail: no live shared secret; pass opts.secret or call markMediaFlowing(secret) first',
            );
        }
        const key = deriveVoicemailKey(secret);
        const nonce = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', key, nonce);
        const ct = Buffer.concat([
            cipher.update(Buffer.from(audioPayload)),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        const blob: EncryptedVoicemail = {
            ciphertext: Buffer.concat([ct, tag]).toString('base64'),
            nonce: nonce.toString('base64'),
            callId: opts?.callId ?? this.currentCallId ?? 'unknown',
            recordedAtMs: Date.now(),
        };
        // Mark the post-call leg so observers (e.g. UI) know a voicemail exists
        this._setState('encrypted_voicemail');
        this.emit('voicemail_recorded', blob);
        return blob;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _setState(next: CallState): void {
        this.callState = next;
        this.stateHistory.push(next);
        const event: CallEvent = { state: next, peerId: this.targetPeerId ?? '' };
        this.emit('state_change', event);
    }

    private async _acquireMedia(config: MediaConfig): Promise<void> {
        this.localStream = await mediaDevices.getUserMedia({
            audio: config.audio,
            video: config.video,
        });
    }

    private _createPeerConnection(): void {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Attach local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach((track: any) => {
                this.pc.addTrack(track, this.localStream);
            });
        }

        // ICE candidate gathering — use property assignment (works with both
        // the real RTCPeerConnection which supports this as an EventTarget attribute
        // and the constructor-style mock in tests).
        this.pc.onicecandidate = (event: any) => {
            if (!event.candidate) return; // null = gathering complete
            signalingService.send({
                type: 'candidate',
                target: this.targetPeerId!,
                candidate: event.candidate,
            });
        };

        // ICE connection state transitions
        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc?.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                this._setState('connected');
                this._emitPqcHandshakeNeeded();
            } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                console.warn('VoipService: ICE state =', state);
                this._teardown('ended');
            }
        };
    }

    private async _addIceCandidate(candidate: any): Promise<void> {
        if (!this.pc) {
            console.warn('VoipService: addIceCandidate called with no peer connection');
            return;
        }
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn('VoipService: addIceCandidate error', err);
        }
    }

    /**
     * Emit the PQC handshake hook event.
     * PqSrtpService listens to this event and initiates ML-KEM key negotiation.
     * The DTLS fingerprint sentinel value instructs PqSrtpService to extract
     * the fingerprint from localDescription.sdp directly.
     */
    private _emitPqcHandshakeNeeded(): void {
        const payload: PqcHandshakePayload = {
            dtlsFingerprint: DTLS_FINGERPRINT_FROM_SDP,
            peerId: this.targetPeerId ?? '',
        };
        this.emit('pqc_handshake_needed', payload);
    }

    private _applyAudioEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        this.localStream.getTracks()
            .filter((t: any) => t.kind === 'audio')
            .forEach((t: any) => { t.enabled = enabled; });
    }

    private _applyVideoEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        this.localStream.getTracks()
            .filter((t: any) => t.kind === 'video')
            .forEach((t: any) => { t.enabled = enabled; });
    }

    private _teardown(finalState?: CallState): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach((t: any) => t.stop());
            this.localStream = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this.targetPeerId = null;
        this.muted = false;
        this.cameraOff = false;
        if (finalState) {
            this._setState(finalState);
        }
        this.callState = 'idle';
        // NOTE: liveSharedSecret + currentCallId are intentionally retained until
        // the next call starts so a post-hangup `recordEncryptedVoicemail` works.
    }
}

// Singleton for use throughout the app
export const voipService = new VoipService();
