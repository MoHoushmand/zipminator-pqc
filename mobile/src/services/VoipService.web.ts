/**
 * VoipService — Web platform stub.
 *
 * On web, react-native-webrtc cannot be imported (it uses requireNativeComponent
 * which doesn't exist in React Native Web). This stub exports the same API
 * surface using browser-native WebRTC APIs.
 *
 * Metro automatically resolves .web.ts over .ts for the web platform.
 */

import { EventEmitter } from 'events';
import { signalingService, SignalingMessage } from './SignalingService';
import type {
    CallState,
    CallEvent,
    MediaConfig,
    PqcHandshakePayload,
    EncryptedVoicemail,
} from './VoipService.types';

/**
 * HKDF-SHA-256 helper for the encrypted-voicemail leg. WebCrypto is async and
 * not available in some test envs; we use Node's crypto when available
 * (jsdom-bun, jest), and fall back to Web Crypto in the actual browser.
 */
async function deriveVoicemailKey(sharedSecret: Uint8Array): Promise<Uint8Array> {
    if (typeof globalThis.crypto?.subtle !== 'undefined') {
        const baseKey = await globalThis.crypto.subtle.importKey(
            'raw',
            sharedSecret as BufferSource,
            { name: 'HKDF' },
            false,
            ['deriveBits'],
        );
        const bits = await globalThis.crypto.subtle.deriveBits(
            {
                name: 'HKDF',
                hash: 'SHA-256',
                salt: new Uint8Array(0),
                info: new TextEncoder().encode('zipminator-voicemail-key'),
            },
            baseKey,
            256,
        );
        return new Uint8Array(bits);
    }
    // Node fallback (tests via ts-jest)
    const { createHmac } = await import('crypto');
    const prk = createHmac('sha256', Buffer.alloc(32, 0))
        .update(Buffer.from(sharedSecret))
        .digest();
    const info = Buffer.from('zipminator-voicemail-key');
    const out = Buffer.alloc(32);
    let prev = Buffer.alloc(0);
    let pos = 0;
    let counter = 1;
    while (pos < 32) {
        const h = createHmac('sha256', prk);
        h.update(prev);
        h.update(info);
        h.update(Buffer.from([counter]));
        prev = h.digest();
        const toCopy = Math.min(prev.length, 32 - pos);
        prev.copy(out, pos, 0, toCopy);
        pos += toCopy;
        counter++;
    }
    return new Uint8Array(out);
}

// ── Constants ────────────────────────────────────────────────────────────────

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const DEFAULT_MEDIA_CONFIG: MediaConfig = { audio: true, video: true };

const DTLS_FINGERPRINT_FROM_SDP = 'sdp-derived';

// ── VoipService (Web) ────────────────────────────────────────────────────────

export class VoipService extends EventEmitter {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private targetPeerId: string | null = null;
    private callState: CallState = 'idle';
    private muted = false;
    private cameraOff = false;
    private liveSharedSecret: Uint8Array | null = null;
    private stateHistory: CallState[] = [];
    private currentCallId: string | null = null;

    async startCall(targetId: string, config: MediaConfig = DEFAULT_MEDIA_CONFIG): Promise<void> {
        if (this.callState !== 'idle') return;

        this.targetPeerId = targetId;
        this.currentCallId = `call-${Date.now()}-${targetId}`;
        this.stateHistory = [];
        this.liveSharedSecret = null;
        this._setState('outgoing');
        this._setState('offering');

        try {
            await this._acquireMedia(config);
            this._createPeerConnection();

            const offer = await this.pc!.createOffer();
            await this.pc!.setLocalDescription(offer);

            signalingService.send({
                type: 'offer',
                target: targetId,
                sdp: offer.sdp,
            });
        } catch (err) {
            console.error('VoipService(web): startCall failed', err);
            this._teardown();
        }
    }

    async answerCall(msg: Pick<SignalingMessage, 'type' | 'sender' | 'sdp'>): Promise<void> {
        this.targetPeerId = msg.sender;
        this._setState('connecting');

        try {
            await this._acquireMedia(DEFAULT_MEDIA_CONFIG);
            this._createPeerConnection();

            await this.pc!.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: msg.sdp ?? '' })
            );

            const answer = await this.pc!.createAnswer();
            await this.pc!.setLocalDescription(answer);

            signalingService.send({
                type: 'answer',
                target: msg.sender,
                sdp: answer.sdp,
            });
        } catch (err) {
            console.error('VoipService(web): answerCall failed', err);
            this._teardown();
        }
    }

    async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
        switch (msg.type) {
            case 'offer':
                await this.answerCall(msg);
                break;
            case 'answer':
                if (!this.pc) return;
                await this.pc.setRemoteDescription(
                    new RTCSessionDescription({ type: 'answer', sdp: msg.sdp ?? '' })
                );
                if (this.callState === 'ringing' || this.callState === 'offering') {
                    this._setState('connecting');
                }
                break;
            case 'candidate':
                await this._addIceCandidate(msg.candidate);
                break;
            default:
                break;
        }
    }

    endCall(): void {
        if (this.callState !== 'idle' && this.callState !== 'ended') {
            this._setState('hangup');
        }
        this._teardown('ended');
    }

    getStateHistory(): CallState[] {
        return [...this.stateHistory];
    }

    markRinging(): void {
        if (this.callState === 'outgoing' || this.callState === 'offering') {
            this._setState('ringing');
        }
    }

    markMediaFlowing(sharedSecret?: Uint8Array): void {
        if (this.callState === 'connected') {
            if (sharedSecret) this.liveSharedSecret = new Uint8Array(sharedSecret);
            this._setState('media-flow');
        }
    }

    /**
     * Record an encrypted voicemail. Web variant uses WebCrypto AES-GCM (with
     * Node fallback for tests). The blob is encrypted under a key derived from
     * the live shared secret so the relay server cannot decrypt.
     */
    async recordEncryptedVoicemail(
        audio: Uint8Array,
        opts?: { callId?: string; secret?: Uint8Array },
    ): Promise<EncryptedVoicemail> {
        const secret = opts?.secret ? new Uint8Array(opts.secret) : this.liveSharedSecret;
        if (!secret) {
            throw new Error('recordEncryptedVoicemail: no live shared secret');
        }
        const key = await deriveVoicemailKey(secret);
        const nonce = (typeof globalThis.crypto?.getRandomValues === 'function')
            ? globalThis.crypto.getRandomValues(new Uint8Array(12))
            : new Uint8Array(12); // tests use a deterministic zero nonce
        let ciphertext: Uint8Array;
        if (typeof globalThis.crypto?.subtle !== 'undefined') {
            const cryptoKey = await globalThis.crypto.subtle.importKey(
                'raw',
                key as BufferSource,
                'AES-GCM',
                false,
                ['encrypt'],
            );
            const ct = await globalThis.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonce },
                cryptoKey,
                audio as BufferSource,
            );
            ciphertext = new Uint8Array(ct);
        } else {
            const { createCipheriv } = await import('crypto');
            const cipher = createCipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(nonce));
            const enc = Buffer.concat([cipher.update(Buffer.from(audio)), cipher.final()]);
            const tag = cipher.getAuthTag();
            ciphertext = new Uint8Array(Buffer.concat([enc, tag]));
        }
        const blob: EncryptedVoicemail = {
            ciphertext: Buffer.from(ciphertext).toString('base64'),
            nonce: Buffer.from(nonce).toString('base64'),
            callId: opts?.callId ?? this.currentCallId ?? 'unknown',
            recordedAtMs: Date.now(),
        };
        this._setState('encrypted_voicemail');
        this.emit('voicemail_recorded', blob);
        return blob;
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        this._applyAudioEnabled(!this.muted);
        return this.muted;
    }

    toggleCamera(): boolean {
        this.cameraOff = !this.cameraOff;
        this._applyVideoEnabled(!this.cameraOff);
        return this.cameraOff;
    }

    getPeerConnection(): RTCPeerConnection | null {
        return this.pc;
    }

    getCallState(): CallState {
        return this.callState;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _setState(next: CallState): void {
        this.callState = next;
        this.stateHistory.push(next);
        const event: CallEvent = { state: next, peerId: this.targetPeerId ?? '' };
        this.emit('state_change', event);
    }

    private async _acquireMedia(config: MediaConfig): Promise<void> {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: config.audio,
            video: config.video,
        });
    }

    private _createPeerConnection(): void {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.pc!.addTrack(track, this.localStream!);
            });
        }

        this.pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            signalingService.send({
                type: 'candidate',
                target: this.targetPeerId!,
                candidate: event.candidate,
            });
        };

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc?.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                this._setState('connected');
                this._emitPqcHandshakeNeeded();
            } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                this._teardown('ended');
            }
        };
    }

    private async _addIceCandidate(candidate: any): Promise<void> {
        if (!this.pc) return;
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn('VoipService(web): addIceCandidate error', err);
        }
    }

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
            .filter((t) => t.kind === 'audio')
            .forEach((t) => { t.enabled = enabled; });
    }

    private _applyVideoEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        this.localStream.getTracks()
            .filter((t) => t.kind === 'video')
            .forEach((t) => { t.enabled = enabled; });
    }

    private _teardown(finalState?: CallState): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach((t) => t.stop());
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
    }
}

export const voipService = new VoipService();
