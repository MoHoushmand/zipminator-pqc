/// PQ-WireGuard Flutter bridge.
///
/// Iter 5 scope: pure-Dart wire-format (de)serializer matching
/// `crates/pq-wireguard/src/wire.rs`, plus the `VpnTunnel` interface and the
/// Android MethodChannel contract. No actual packet I/O, opening a Linux
/// kernel tun or Android `VpnService` is a later iter.
///
/// The on-wire layout is the single source of truth and comes from the
/// committed hex fixture at `tests/vpn/fixtures/initiation.hex`. If Rust
/// encoder output changes, regenerate the fixture and this decoder keeps
/// working by virtue of being a straight little-endian byte layout.
library;

import 'dart:typed_data';

/// Message type on the wire. Numeric values match the Rust enum discriminants
/// (`#[repr(u8)]` in `crates/pq-wireguard/src/wire.rs`), which is why we keep
/// raw ints here rather than inventing a Dart enum with unrelated ordinals.
class MessageType {
  static const int initiation = 1;
  static const int response = 2;

  static bool isKnown(int v) => v == initiation || v == response;
}

/// ML-KEM-768 ciphertext size (NIST FIPS 203). Matches
/// `pqcrypto_kyber::kyber768::ciphertext_bytes()` on the Rust side.
const int kKemCiphertextLen = 1088;

/// Header size in bytes (message_type + reserved + sender_index +
/// receiver_index).
const int kHeaderLen = 12;

/// Total bytes in a serialized initiation (header + KEM ciphertext).
const int kInitiationWireLen = kHeaderLen + kKemCiphertextLen;

/// Total bytes in a serialized response.
const int kResponseWireLen = kHeaderLen;

/// Parsed / encodable PQ-WireGuard wire message. Equivalent of Rust
/// `wire::WireMessage`.
class WireMessage {
  final int messageType;
  final int senderIndex;
  final int receiverIndex;

  /// 1088 bytes for `initiation`; empty for `response`.
  final Uint8List kemCiphertext;

  WireMessage({
    required this.messageType,
    required this.senderIndex,
    required this.receiverIndex,
    required this.kemCiphertext,
  });

  /// Serialize to the canonical little-endian on-wire layout.
  Uint8List toBytes() {
    final int expected = messageType == MessageType.initiation
        ? kInitiationWireLen
        : kResponseWireLen;
    final bytes = BytesBuilder(copy: false);
    bytes.addByte(messageType);
    bytes.add(const [0, 0, 0]); // reserved
    final hdr = ByteData(8)
      ..setUint32(0, senderIndex, Endian.little)
      ..setUint32(4, receiverIndex, Endian.little);
    bytes.add(hdr.buffer.asUint8List());
    if (messageType == MessageType.initiation) {
      assert(kemCiphertext.length == kKemCiphertextLen,
          'initiation requires $kKemCiphertextLen-byte KEM ciphertext');
      bytes.add(kemCiphertext);
    } else {
      assert(kemCiphertext.isEmpty,
          'response carries no KEM ciphertext in iter 2+');
    }
    final out = bytes.toBytes();
    assert(out.length == expected,
        'encoded length ${out.length} does not match expected $expected');
    return out;
  }

  /// Parse the canonical on-wire layout. Throws `FormatException` on any
  /// length mismatch, unknown message type, or non-zero reserved byte.
  /// Mirrors the validation logic in `wire::WireMessage::from_bytes`.
  factory WireMessage.fromBytes(Uint8List bytes) {
    if (bytes.length < kHeaderLen) {
      throw const FormatException('frame shorter than header');
    }
    final msgType = bytes[0];
    if (!MessageType.isKnown(msgType)) {
      throw FormatException('unknown message type: $msgType');
    }
    if (bytes[1] != 0 || bytes[2] != 0 || bytes[3] != 0) {
      throw const FormatException('reserved bytes must be zero');
    }
    final view = ByteData.sublistView(bytes, 4, 12);
    final senderIndex = view.getUint32(0, Endian.little);
    final receiverIndex = view.getUint32(4, Endian.little);
    Uint8List ct;
    if (msgType == MessageType.initiation) {
      if (bytes.length != kInitiationWireLen) {
        throw FormatException(
            'initiation wrong length: got ${bytes.length}, want $kInitiationWireLen');
      }
      ct = Uint8List.fromList(bytes.sublist(kHeaderLen));
    } else {
      if (bytes.length != kResponseWireLen) {
        throw FormatException(
            'response wrong length: got ${bytes.length}, want $kResponseWireLen');
      }
      ct = Uint8List(0);
    }
    return WireMessage(
      messageType: msgType,
      senderIndex: senderIndex,
      receiverIndex: receiverIndex,
      kemCiphertext: ct,
    );
  }
}

/// Abstract tunnel surface that a platform backend (Android, Linux, macOS)
/// implements. Kept deliberately tiny in iter 5 so tests exercise the wire
/// format without dragging in a platform-channel dependency.
abstract class VpnTunnel {
  /// Serialize a handshake initiation. The caller provides a KEM ciphertext
  /// already produced by the Rust pq-wireguard core (via FFI or the
  /// PQC-mesh bridge, not yet wired in).
  Uint8List encodeInitiation({
    required int senderIndex,
    required Uint8List kemCiphertext,
  });

  /// Decode an on-wire response. Returns the parsed `WireMessage` or
  /// throws `FormatException` on malformed input.
  WireMessage decodeResponse(Uint8List bytes);
}

/// Default implementation. Pure-Dart; suitable for unit and widget tests.
/// The Android-specific platform channel is a thin wrapper around this that
/// forwards the `encode*` outputs to native code for packet I/O.
class PureDartVpnTunnel implements VpnTunnel {
  @override
  Uint8List encodeInitiation({
    required int senderIndex,
    required Uint8List kemCiphertext,
  }) {
    return WireMessage(
      messageType: MessageType.initiation,
      senderIndex: senderIndex,
      receiverIndex: 0,
      kemCiphertext: kemCiphertext,
    ).toBytes();
  }

  @override
  WireMessage decodeResponse(Uint8List bytes) => WireMessage.fromBytes(bytes);
}

/// Named constants for the Android platform channel. The actual native-side
/// VpnService glue is deferred; this declares the contract so the mobile
/// app can start wiring UI against stable names today.
class AndroidVpnChannel {
  /// Channel name. Matches the JVM-side counterpart in
  /// `android/app/src/main/kotlin/.../VpnChannel.kt` (future iter).
  static const String channelName = 'zip.qdaria.vpn/tunnel';

  /// Method names. Keep in sync with native handlers.
  static const String methodStart = 'start';
  static const String methodStop = 'stop';
  static const String methodSendHandshake = 'sendHandshake';
}
