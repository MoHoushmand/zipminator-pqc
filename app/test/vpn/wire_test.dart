/// Dart side of the PQ-WireGuard wire-format contract.
///
/// Loads `tests/vpn/fixtures/initiation.hex` verbatim (the same file the
/// Rust iter-2 test `wire_initiation_matches_committed_fixture` loads via
/// `include_str!`) and asserts the Dart encoder and decoder agree with the
/// Rust encoder byte for byte.
///
/// The fixture path is repo-root-relative. Flutter test harness runs with
/// CWD at `app/`, so we walk up one component.
library;

import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/vpn/tunnel.dart';

Uint8List _hexDecode(String s) {
  final clean = s.replaceAll(RegExp(r'\s'), '');
  if (clean.length.isOdd) {
    throw FormatException('odd-length hex string (len=${clean.length})');
  }
  final out = Uint8List(clean.length ~/ 2);
  for (var i = 0; i < out.length; i++) {
    out[i] = int.parse(clean.substring(i * 2, i * 2 + 2), radix: 16);
  }
  return out;
}

/// Reconstructs the same deterministic ciphertext filler the Rust test uses
/// (`(i % 251) as u8`). Pure function, no randomness, so the Dart encoder
/// output is byte-for-byte reproducible against the committed fixture.
Uint8List _deterministicCiphertext() {
  final out = Uint8List(kKemCiphertextLen);
  for (var i = 0; i < out.length; i++) {
    out[i] = i % 251;
  }
  return out;
}

File _fixtureFile() {
  // Flutter tests run with CWD at the Flutter package root (app/). The hex
  // fixture lives at <vpn-worktree>/tests/vpn/fixtures/initiation.hex.
  final cwd = Directory.current.path;
  return File('$cwd/../tests/vpn/fixtures/initiation.hex');
}

void main() {
  group('wire format', () {
    test('decoder round-trips the Rust-committed fixture', () {
      final hexPath = _fixtureFile();
      expect(hexPath.existsSync(), isTrue,
          reason: 'missing fixture at ${hexPath.path}');
      final expected = _hexDecode(hexPath.readAsStringSync());
      expect(expected.length, kInitiationWireLen,
          reason: 'fixture length drift: got ${expected.length}');

      final decoded = WireMessage.fromBytes(expected);
      expect(decoded.messageType, MessageType.initiation);
      expect(decoded.senderIndex, 0x11223344,
          reason: 'fixture was generated with sender_index=0x11223344');
      expect(decoded.receiverIndex, 0);
      expect(decoded.kemCiphertext.length, kKemCiphertextLen);

      // Re-encoding must yield the same bytes we read in: the Dart encoder
      // and the Rust encoder are wire-compatible.
      final reencoded = decoded.toBytes();
      expect(reencoded, equals(expected),
          reason: 'Dart encoder diverged from Rust fixture');
    });

    test('encoder matches the Rust-committed fixture byte for byte', () {
      // Build the message from first principles (no decode round-trip) and
      // verify the Dart encoder produces identical bytes to the fixture.
      final msg = WireMessage(
        messageType: MessageType.initiation,
        senderIndex: 0x11223344,
        receiverIndex: 0,
        kemCiphertext: _deterministicCiphertext(),
      );
      final encoded = msg.toBytes();
      final expected = _hexDecode(_fixtureFile().readAsStringSync());
      expect(encoded, equals(expected),
          reason:
              'Dart encoder must match Rust fixture byte-for-byte; wire drift');
    });

    test('decoder rejects truncated initiation', () {
      final full = _hexDecode(_fixtureFile().readAsStringSync());
      final truncated = Uint8List.fromList(full.sublist(0, full.length - 1));
      expect(() => WireMessage.fromBytes(truncated),
          throwsA(isA<FormatException>()));
    });

    test('decoder rejects non-zero reserved bytes', () {
      final full = _hexDecode(_fixtureFile().readAsStringSync());
      final tampered = Uint8List.fromList(full);
      tampered[1] = 0xFF; // flip a reserved byte
      expect(() => WireMessage.fromBytes(tampered),
          throwsA(isA<FormatException>()));
    });

    test('response encodes to exactly 12 bytes with empty KEM ciphertext', () {
      final msg = WireMessage(
        messageType: MessageType.response,
        senderIndex: 0xDEADBEEF,
        receiverIndex: 0x11223344,
        kemCiphertext: Uint8List(0),
      );
      final bytes = msg.toBytes();
      expect(bytes.length, kResponseWireLen);
      expect(bytes[0], MessageType.response);
    });
  });

  group('tunnel surface', () {
    test('PureDartVpnTunnel.encodeInitiation matches fixture', () {
      final tunnel = PureDartVpnTunnel();
      final bytes = tunnel.encodeInitiation(
        senderIndex: 0x11223344,
        kemCiphertext: _deterministicCiphertext(),
      );
      final expected = _hexDecode(_fixtureFile().readAsStringSync());
      expect(bytes, equals(expected),
          reason: 'tunnel encoder must agree with fixture');
    });

    test('AndroidVpnChannel names are the publication contract', () {
      // These constants are what the JVM side will bind to. Changing them
      // silently would break the native glue in a later iter.
      expect(AndroidVpnChannel.channelName, 'zip.qdaria.vpn/tunnel');
      expect(AndroidVpnChannel.methodStart, 'start');
      expect(AndroidVpnChannel.methodStop, 'stop');
      expect(AndroidVpnChannel.methodSendHandshake, 'sendHandshake');
    });
  });
}
