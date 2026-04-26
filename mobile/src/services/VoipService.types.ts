/**
 * Full PQ-SRTP call state machine, expanded from the original 5-state model
 * to cover the complete lifecycle: idle → outgoing → ringing → connecting →
 * connected → media-flow → hangup → encrypted_voicemail.
 *
 * Backward compatibility: 'offering', 'connecting', 'connected', 'ended' are
 * preserved (existing tests + signalling code). New states extend the enum;
 * the service emits both classic and extended states where relevant.
 */
export type CallState =
    | 'idle'
    | 'outgoing'   // local user has dialled; ringing on the wire
    | 'offering'   // SDP offer sent (legacy alias retained)
    | 'ringing'    // remote side is ringing the callee
    | 'connecting' // ICE/DTLS handshake in progress
    | 'connected'  // ICE complete, PQC handshake about to fire
    | 'media-flow' // PQC handshake complete, SRTP frames flowing
    | 'hangup'     // teardown initiated, media stopping
    | 'encrypted_voicemail' // recipient missed the call; voicemail leg recorded
    | 'ended';

export interface CallEvent {
    state: CallState;
    peerId: string;
}

export interface MediaConfig {
    audio: boolean;
    video: boolean;
}

export interface PqcHandshakePayload {
    dtlsFingerprint: string;
    peerId: string;
}

/**
 * An encrypted voicemail blob. Encrypted with AES-256-GCM under a key derived
 * via HKDF-SHA-256 (info=`zipminator-voicemail-key`) from the live session's
 * ML-KEM-768 shared secret. Server cannot decrypt — only the recipient holding
 * the same shared secret can.
 */
export interface EncryptedVoicemail {
    /** Ciphertext bytes (payload + 16-byte GCM tag). Base64. */
    ciphertext: string;
    /** 12-byte AES-GCM nonce. Base64. */
    nonce: string;
    /** ID of the call this voicemail belongs to. */
    callId: string;
    /** UNIX millis of the recording. */
    recordedAtMs: number;
}
