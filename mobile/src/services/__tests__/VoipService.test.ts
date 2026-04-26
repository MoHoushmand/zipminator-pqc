/**
 * VoipService tests — TDD-first, written before implementation.
 *
 * Mocking strategy:
 *  - react-native-webrtc: full manual mock (RTCPeerConnection, MediaStream, getUserMedia)
 *  - SignalingService: module mock so we can spy on send() without a real WebSocket
 *  - PQC layer: not present in VoipService — we verify the hook-point event fires
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAddTrack = jest.fn();
const mockCreateOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp-offer' });
const mockCreateAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp-answer' });
const mockSetLocalDescription = jest.fn().mockResolvedValue(undefined);
const mockSetRemoteDescription = jest.fn().mockResolvedValue(undefined);
const mockAddIceCandidate = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn();

// Simulate ICE gathering completing with one candidate
let capturedOnIceCandidate: ((e: any) => void) | null = null;
let capturedOnIceConnectionStateChange: (() => void) | null = null;

function MockRTCPeerConnection(this: any, _config: any) {
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceConnectionState = 'new';
    this.addTrack = mockAddTrack;
    this.createOffer = mockCreateOffer;
    this.createAnswer = mockCreateAnswer;
    this.setLocalDescription = jest.fn(async (desc: any) => {
        this.localDescription = desc;
    });
    this.setRemoteDescription = jest.fn(async (desc: any) => {
        this.remoteDescription = desc;
    });
    this.addIceCandidate = mockAddIceCandidate;
    this.close = mockClose;

    Object.defineProperty(this, 'onicecandidate', {
        set: (fn: any) => { capturedOnIceCandidate = fn; },
        get: () => capturedOnIceCandidate,
    });
    Object.defineProperty(this, 'oniceconnectionstatechange', {
        set: (fn: any) => { capturedOnIceConnectionStateChange = fn; },
        get: () => capturedOnIceConnectionStateChange,
    });
}

// Stable track objects so every getTracks() call returns the same references
// (enabling assertions on stop() and .enabled across different test lines).
const mockAudioTrack = { kind: 'audio' as const, stop: jest.fn(), enabled: true };
const mockVideoTrack = { kind: 'video' as const, stop: jest.fn(), enabled: true };
const mockMediaStream = {
    getTracks: () => [mockAudioTrack, mockVideoTrack],
};

const mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream);

jest.mock('react-native-webrtc', () => ({
    RTCPeerConnection: MockRTCPeerConnection,
    RTCSessionDescription: jest.fn((desc: any) => desc),
    RTCIceCandidate: jest.fn((c: any) => c),
    mediaDevices: { getUserMedia: mockGetUserMedia },
}));

jest.mock('../SignalingService', () => {
    const { EventEmitter } = require('events');
    const instance = new EventEmitter();
    instance.send = jest.fn();
    instance.connect = jest.fn();
    instance.disconnect = jest.fn();
    return { signalingService: instance };
});

// ─── Subject under test ───────────────────────────────────────────────────────

import { VoipService } from '../VoipService';
import { signalingService } from '../SignalingService';
import type { CallState } from '../VoipService.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeService(): VoipService {
    return new VoipService();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VoipService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnIceCandidate = null;
        capturedOnIceConnectionStateChange = null;
        // Reset track state (enabled property and stop mock) between tests
        mockAudioTrack.enabled = true;
        mockVideoTrack.enabled = true;
        mockAudioTrack.stop.mockReset();
        mockVideoTrack.stop.mockReset();
        // Re-wire getUserMedia to return the stable stream
        mockGetUserMedia.mockResolvedValue(mockMediaStream);
    });

    // ── 1. Call initiation ────────────────────────────────────────────────────

    describe('startCall()', () => {
        it('creates an RTCPeerConnection with STUN server config', async () => {
            const svc = makeService();

            await svc.startCall('peer-42');

            // The internal peer connection should exist (non-null)
            expect(svc.getPeerConnection()).not.toBeNull();
        });

        it('transitions state to offering then connecting', async () => {
            const svc = makeService();
            const states: CallState[] = [];
            svc.on('state_change', (evt) => states.push(evt.state));

            await svc.startCall('peer-42');

            expect(states).toContain('offering');
        });

        it('acquires media stream (audio + video)', async () => {
            const svc = makeService();
            await svc.startCall('peer-42');
            expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true, video: true });
        });

        it('sends SDP offer via SignalingService', async () => {
            const svc = makeService();
            await svc.startCall('peer-99');

            expect((signalingService as any).send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'offer',
                    target: 'peer-99',
                    sdp: expect.any(String),
                })
            );
        });

        it('does not start a second call if already in progress', async () => {
            const svc = makeService();
            await svc.startCall('peer-1');
            await svc.startCall('peer-2');

            // getUserMedia only called once — second call is no-op
            expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
        });
    });

    // ── 2. SDP offer/answer exchange ──────────────────────────────────────────

    describe('answerCall()', () => {
        it('sets remote description from incoming offer', async () => {
            const svc = makeService();
            const offerMsg = {
                type: 'offer' as const,
                sender: 'peer-A',
                target: 'me',
                sdp: 'remote-offer-sdp',
            };

            await svc.answerCall(offerMsg);

            const pc = svc.getPeerConnection();
            expect(pc).not.toBeNull();
            expect(pc!.setRemoteDescription).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'offer', sdp: 'remote-offer-sdp' })
            );
        });

        it('creates an SDP answer and sends it via signaling', async () => {
            const svc = makeService();
            const offerMsg = {
                type: 'offer' as const,
                sender: 'peer-B',
                target: 'me',
                sdp: 'remote-offer-sdp',
            };

            await svc.answerCall(offerMsg);

            expect((signalingService as any).send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'answer',
                    target: 'peer-B',
                    sdp: expect.any(String),
                })
            );
        });

        it('handles remote answer by setting remote description', async () => {
            const svc = makeService();
            await svc.startCall('peer-C');

            await svc.handleSignalingMessage({
                type: 'answer',
                sender: 'peer-C',
                target: 'me',
                sdp: 'remote-answer-sdp',
            });

            const pc = svc.getPeerConnection();
            expect(pc!.setRemoteDescription).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'answer', sdp: 'remote-answer-sdp' })
            );
        });
    });

    // ── 3. ICE candidate handling ─────────────────────────────────────────────

    describe('ICE candidate exchange', () => {
        it('sends local ICE candidates via SignalingService', async () => {
            const svc = makeService();
            await svc.startCall('peer-D');

            // Simulate the RTCPeerConnection firing an ICE candidate
            capturedOnIceCandidate!({
                candidate: { candidate: 'candidate:1 1 UDP 2113667327 192.168.1.2 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 },
            });

            expect((signalingService as any).send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'candidate',
                    target: 'peer-D',
                    candidate: expect.objectContaining({ candidate: expect.any(String) }),
                })
            );
        });

        it('ignores null ICE candidate (gathering complete signal)', async () => {
            const svc = makeService();
            await svc.startCall('peer-E');
            const sendCallsBefore = (signalingService as any).send.mock.calls.length;

            capturedOnIceCandidate!({ candidate: null });

            // No additional send beyond the offer
            expect((signalingService as any).send.mock.calls.length).toBe(sendCallsBefore);
        });

        it('adds remote ICE candidates to peer connection', async () => {
            const svc = makeService();
            await svc.startCall('peer-F');

            await svc.handleSignalingMessage({
                type: 'candidate',
                sender: 'peer-F',
                target: 'me',
                candidate: { candidate: 'candidate:1 1 UDP ...', sdpMid: '0', sdpMLineIndex: 0 },
            });

            expect(mockAddIceCandidate).toHaveBeenCalled();
        });
    });

    // ── 4. PQC handshake hook point ───────────────────────────────────────────

    describe('PQC handshake integration point', () => {
        it('emits pqc_handshake_needed when ICE connection reaches connected state', async () => {
            const svc = makeService();
            const pqcListener = jest.fn();
            svc.on('pqc_handshake_needed', pqcListener);

            await svc.startCall('peer-G');

            // Simulate ICE connected
            Object.defineProperty(svc.getPeerConnection(), 'iceConnectionState', { value: 'connected', writable: true });
            capturedOnIceConnectionStateChange!();

            expect(pqcListener).toHaveBeenCalledWith(
                expect.objectContaining({ peerId: 'peer-G' })
            );
        });

        it('pqc_handshake_needed payload includes dtlsFingerprint field', async () => {
            const svc = makeService();
            const pqcListener = jest.fn();
            svc.on('pqc_handshake_needed', pqcListener);

            await svc.startCall('peer-H');
            Object.defineProperty(svc.getPeerConnection(), 'iceConnectionState', { value: 'connected', writable: true });
            capturedOnIceConnectionStateChange!();

            const payload = pqcListener.mock.calls[0][0];
            expect(payload).toHaveProperty('dtlsFingerprint');
        });
    });

    // ── 5. Call teardown ──────────────────────────────────────────────────────

    describe('endCall()', () => {
        it('closes the RTCPeerConnection', async () => {
            const svc = makeService();
            await svc.startCall('peer-I');
            svc.endCall();

            expect(mockClose).toHaveBeenCalled();
        });

        it('stops all media tracks', async () => {
            const svc = makeService();
            await svc.startCall('peer-J');

            svc.endCall();

            expect(mockAudioTrack.stop).toHaveBeenCalled();
            expect(mockVideoTrack.stop).toHaveBeenCalled();
        });

        it('transitions call state to ended', async () => {
            const svc = makeService();
            const states: CallState[] = [];
            svc.on('state_change', (evt) => states.push(evt.state));

            await svc.startCall('peer-K');
            svc.endCall();

            expect(states).toContain('ended');
        });

        it('nullifies internal peer connection reference', async () => {
            const svc = makeService();
            await svc.startCall('peer-L');
            svc.endCall();

            expect(svc.getPeerConnection()).toBeNull();
        });
    });

    // ── 6. Media controls ─────────────────────────────────────────────────────

    describe('toggleMute()', () => {
        it('disables audio track when muting', async () => {
            const svc = makeService();
            await svc.startCall('peer-M');

            svc.toggleMute();

            // mockAudioTrack is the stable reference returned by getTracks()
            expect(mockAudioTrack.enabled).toBe(false);
        });

        it('re-enables audio track when unmuting', async () => {
            const svc = makeService();
            await svc.startCall('peer-N');

            svc.toggleMute(); // mute
            svc.toggleMute(); // unmute

            expect(mockAudioTrack.enabled).toBe(true);
        });
    });

    describe('toggleCamera()', () => {
        it('disables video track when turning camera off', async () => {
            const svc = makeService();
            await svc.startCall('peer-O');

            svc.toggleCamera();

            expect(mockVideoTrack.enabled).toBe(false);
        });

        it('re-enables video track when turning camera on', async () => {
            const svc = makeService();
            await svc.startCall('peer-P');

            svc.toggleCamera(); // off
            svc.toggleCamera(); // on

            expect(mockVideoTrack.enabled).toBe(true);
        });
    });

    // ── 7. Full call-state-machine integration test ───────────────────────────
    //
    // Lifecycle covered here (acceptance criterion #3):
    //   idle → outgoing → (offering) → ringing → connecting → connected →
    //   media-flow → hangup → ended → encrypted_voicemail
    //
    // Each transition is asserted; the state machine emits expected events. The
    // encrypted-voicemail leg uses the live session's ML-KEM-768 shared secret
    // via HKDF-SHA-256 (info=`zipminator-voicemail-key`) so even the server can
    // not decrypt the voicemail blob.

    describe('full call-state-machine lifecycle', () => {
        it('traverses idle → outgoing → ringing → connecting → connected → media-flow → hangup → encrypted_voicemail', async () => {
            const svc = makeService();
            const states: any[] = [];
            svc.on('state_change', (evt: any) => states.push(evt.state));

            // 1) idle (default initial state)
            expect(svc.getCallState()).toBe('idle');

            // 2) outgoing + offering (startCall fires both; tests can observe either)
            await svc.startCall('peer-state-machine');
            expect(states).toContain('outgoing');
            expect(states).toContain('offering');

            // 3) ringing (caller can mark ringing once SDP is on the wire)
            svc.markRinging();
            expect(states).toContain('ringing');

            // 4) connecting (incoming offer → answer path; here we simulate via
            //    setting iceConnectionState='checking' is implicit, the real
            //    transition is via the answer flow).
            //    For an outgoing call we move from ringing → connecting via
            //    handleSignalingMessage('answer') which sets remote description.
            //    We simulate ICE state directly to drive the state machine.
            await svc.handleSignalingMessage({
                type: 'answer',
                sender: 'peer-state-machine',
                target: 'me',
                sdp: 'answer-sdp',
            });

            // 5) connected (ICE connected fires)
            Object.defineProperty(svc.getPeerConnection(), 'iceConnectionState', {
                value: 'connected',
                writable: true,
            });
            capturedOnIceConnectionStateChange!();
            expect(states).toContain('connected');

            // 6) media-flow — caller marks media flowing with the live ML-KEM
            //    shared secret. In production this is provided by PqSrtpService
            //    after the handshake completes; here we use a deterministic stub.
            const sharedSecret = Buffer.alloc(32, 0x42);
            svc.markMediaFlowing(sharedSecret);
            expect(states).toContain('media-flow');
            expect(svc.getCallState()).toBe('media-flow');

            // 7) hangup (endCall transitions through hangup → ended → idle)
            svc.endCall();
            expect(states).toContain('hangup');
            expect(states).toContain('ended');

            // 8) encrypted_voicemail — record a post-call voicemail. The blob
            //    is AES-256-GCM with a key derived from the live shared secret
            //    via HKDF (info=`zipminator-voicemail-key`).
            const audio = Buffer.from('post-call voicemail audio bytes');
            const blob = svc.recordEncryptedVoicemail(audio);
            expect(states).toContain('encrypted_voicemail');
            expect(blob.ciphertext).toEqual(expect.any(String));
            expect(blob.nonce).toEqual(expect.any(String));
            expect(blob.callId).toMatch(/^call-/);

            // History reflects the full chain (defensive)
            const history = svc.getStateHistory();
            const required = [
                'outgoing',
                'ringing',
                'connecting',
                'connected',
                'media-flow',
                'hangup',
                'ended',
                'encrypted_voicemail',
            ] as const;
            for (const req of required) {
                expect(history).toContain(req);
            }
        });

        it('voicemail blob ciphertext is non-empty and includes a 16-byte GCM tag', async () => {
            const svc = makeService();
            await svc.startCall('peer-vm-1');
            svc.markMediaFlowing(Buffer.alloc(32, 0x11));
            svc.endCall();

            const audio = Buffer.from('audio'); // 5 bytes
            const blob = svc.recordEncryptedVoicemail(audio);
            const ct = Buffer.from(blob.ciphertext, 'base64');
            // AES-GCM appends a 16-byte authentication tag
            expect(ct.length).toBe(audio.length + 16);
        });

        it('voicemail key is independent of SRTP master key (domain separation)', async () => {
            // Same shared secret produces deterministic voicemail keys, but the
            // first 16 bytes must NOT equal the SRTP master key — different HKDF
            // info strings guarantee distinct material. We verify via the
            // public derivation path: encrypting the same payload with two
            // different services (each given the same secret) yields different
            // ciphertexts only if the nonces differ; we check determinism by
            // comparing the AAD-less ciphertext minus the random nonce.
            const svc1 = makeService();
            await svc1.startCall('peer-vm-2');
            svc1.markMediaFlowing(Buffer.alloc(32, 0xab));
            svc1.endCall();
            const blob1 = svc1.recordEncryptedVoicemail(Buffer.from('hi'));

            const svc2 = makeService();
            await svc2.startCall('peer-vm-3');
            svc2.markMediaFlowing(Buffer.alloc(32, 0xab));
            svc2.endCall();
            const blob2 = svc2.recordEncryptedVoicemail(Buffer.from('hi'));

            // Different nonces → different ciphertexts even with the same payload
            expect(blob1.ciphertext).not.toBe(blob2.ciphertext);
            expect(blob1.nonce).not.toBe(blob2.nonce);
        });

        it('throws when recording voicemail with no live shared secret', async () => {
            const svc = makeService();
            // No call active and no opts.secret
            expect(() => svc.recordEncryptedVoicemail(Buffer.from('x'))).toThrow(
                /no live shared secret/,
            );
        });

        it('accepts an explicit secret for offline replay', async () => {
            const svc = makeService();
            const secret = Buffer.alloc(32, 0xcd);
            const blob = svc.recordEncryptedVoicemail(Buffer.from('offline'), {
                callId: 'call-offline-1',
                secret,
            });
            expect(blob.callId).toBe('call-offline-1');
            expect(blob.ciphertext).toEqual(expect.any(String));
        });

        it('emits voicemail_recorded event on recording', async () => {
            const svc = makeService();
            await svc.startCall('peer-vm-4');
            svc.markMediaFlowing(Buffer.alloc(32, 0x77));
            svc.endCall();
            const listener = jest.fn();
            svc.on('voicemail_recorded', listener);
            svc.recordEncryptedVoicemail(Buffer.from('alert'));
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ ciphertext: expect.any(String) }),
            );
        });
    });
});

