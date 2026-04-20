// Track B Dart-side contract test for the mobile WebView PQC proxy bridge.
//
// Purpose: pin the Tauri IPC shape the Rust side exposes as
// `pqc_proxy_command`. If someone renames a field or the command name
// we catch the drift in `flutter test` before the mobile build ships.
//
// Scope: these tests do not spawn a Tauri runtime. They exercise the
// Dart-side `PqcProxyClient` by passing a mock `invoker` function so
// the assertions are: command name, argument shape, response decoding,
// and typed error decoding. The live Tauri harness is covered by the
// Rust-side integration test in `tests/browser-mobile/`.

import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/browser/webview.dart';

void main() {
  group('PqcProxyClient IPC contract', () {
    test('invokes the pqc_proxy_command with snake_case args', () async {
      String? capturedCommand;
      Map<String, dynamic>? capturedArgs;

      final client = PqcProxyClient(
        invoker: (command, args) async {
          capturedCommand = command;
          capturedArgs = args;
          // Minimal valid response so happy-path path returns.
          return <String, dynamic>{
            'url': args['url'],
            'ciphertext_b64': 'AAAA',
            'shared_secret_bytes': 32,
            'nist_level': 3,
            'algorithm': 'ML-KEM-768 (NIST FIPS 203)',
          };
        },
      );

      await client.wrap(
        url: 'https://example.com/wallet',
        peerPublicKeyB64: 'cGs=',
      );

      expect(capturedCommand, 'pqc_proxy_command');
      expect(capturedArgs, isNotNull);
      expect(capturedArgs!['url'], 'https://example.com/wallet');
      expect(capturedArgs!['peer_public_key_b64'], 'cGs=');
      // Make sure we do not leak camelCase that the Rust serde Deserialize
      // impl does not expect.
      expect(capturedArgs!.containsKey('peerPublicKeyB64'), isFalse);
    });

    test('decodes a happy-path response into PqcProxyResponse', () async {
      final client = PqcProxyClient(
        invoker: (_, __) async => <String, dynamic>{
          'url': 'https://example.com',
          'ciphertext_b64': 'Y2lwaGVydGV4dA==',
          'shared_secret_bytes': 32,
          'nist_level': 3,
          'algorithm': 'ML-KEM-768 (NIST FIPS 203)',
        },
      );

      final resp = await client.wrap(
        url: 'https://example.com',
        peerPublicKeyB64: 'cGs=',
      );

      expect(resp.url, 'https://example.com');
      expect(resp.ciphertextB64, 'Y2lwaGVydGV4dA==');
      expect(resp.sharedSecretBytes, 32);
      expect(resp.nistLevel, 3);
      expect(resp.algorithm, 'ML-KEM-768 (NIST FIPS 203)');
    });

    test('decodes a typed InvalidUrl error from the tagged-enum surface',
        () async {
      // Use a URL that passes the Dart-side scheme guard so the invoker
      // actually runs and gets a chance to throw the backend payload.
      // This verifies the tagged-enum decoder path end-to-end.
      final client = PqcProxyClient(
        invoker: (_, __) async => throw const PqcProxyErrorPayload(
          kind: 'InvalidUrl',
          message: 'missing host',
        ),
      );

      try {
        await client.wrap(
          url: 'https://example.com',
          peerPublicKeyB64: 'cGs=',
        );
        fail('expected PqcProxyException');
      } on PqcProxyException catch (e) {
        expect(e.kind, PqcProxyErrorKind.invalidUrl);
        expect(e.message, 'missing host');
      }
    });

    test('decodes a typed InvalidKeyLength error with expected/got fields',
        () async {
      final client = PqcProxyClient(
        invoker: (_, __) async => throw const PqcProxyErrorPayload(
          kind: 'InvalidKeyLength',
          message: 'invalid key length: expected 1184, got 64',
        ),
      );

      try {
        await client.wrap(
          url: 'https://example.com',
          peerPublicKeyB64: 'AAAA',
        );
        fail('expected PqcProxyException');
      } on PqcProxyException catch (e) {
        expect(e.kind, PqcProxyErrorKind.invalidKeyLength);
        expect(e.message.contains('1184'), isTrue);
        expect(e.message.contains('64'), isTrue);
      }
    });

    test('rejects a non-http scheme before even calling the invoker',
        () async {
      var invokerCalled = false;
      final client = PqcProxyClient(
        invoker: (_, __) async {
          invokerCalled = true;
          return const <String, dynamic>{};
        },
      );

      expect(
        () => client.wrap(
          url: 'ftp://example.com',
          peerPublicKeyB64: 'cGs=',
        ),
        throwsA(
          isA<PqcProxyException>().having(
            (e) => e.kind,
            'kind',
            PqcProxyErrorKind.invalidUrl,
          ),
        ),
      );
      expect(invokerCalled, isFalse);
    });
  });
}
