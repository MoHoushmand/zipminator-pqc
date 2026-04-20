// Dart-side wrapper for the Tauri 2.x mobile PQC proxy bridge (Pillar 8).
//
// The Rust backend at `browser/src-tauri/src/mobile/mod.rs` exposes a
// single command `pqc_proxy_command` over Tauri IPC. This file is the
// minimum Flutter-side surface needed to call it:
//
//   - `PqcProxyClient.wrap(url:, peerPublicKeyB64:)` shapes the args
//     snake_case to match the Rust serde `Deserialize`, forwards to
//     the injected `invoker`, and decodes the response into a typed
//     record the UI can bind directly.
//   - Errors from the Rust side use `#[serde(tag = "kind")]`, so we
//     expose `PqcProxyException.kind` as a `PqcProxyErrorKind` enum
//     instead of raw strings. Drift in the tag (rename of a variant)
//     fails the contract test.
//
// The `invoker` is injected rather than hard-wired to
// `flutter_rust_bridge` or `MethodChannel` so:
//   - Unit tests can stub the IPC without spinning up a Tauri runtime.
//   - The actual wiring (flutter_rust_bridge vs Tauri 2 invoke) can be
//     swapped without rewriting call sites across the app.
//
// The real invoker is out of scope for this iteration; shipping the
// typed client and contract test first means the wiring PR is pure
// plumbing with no behavior risk.

import 'dart:async';

/// Typed error raised by `PqcProxyClient.wrap` when the backend returns
/// a tagged-enum failure or the client rejects input up front.
class PqcProxyException implements Exception {
  const PqcProxyException({
    required this.kind,
    required this.message,
  });

  final PqcProxyErrorKind kind;
  final String message;

  @override
  String toString() => 'PqcProxyException($kind): $message';
}

/// Variants that mirror `PqcProxyError` on the Rust side.
///
/// Keeping the names in one-to-one correspondence with the serde tag
/// lets a tiny decoder map `{"kind":"InvalidUrl"}` to an enum value
/// without reflection. If a Rust variant is renamed, the contract test
/// fails before the mobile build ships.
enum PqcProxyErrorKind {
  invalidUrl,
  invalidBase64,
  invalidKeyLength,
  encapsulationFailed,
  unknown,
}

PqcProxyErrorKind _kindFromTag(String tag) {
  switch (tag) {
    case 'InvalidUrl':
      return PqcProxyErrorKind.invalidUrl;
    case 'InvalidBase64':
      return PqcProxyErrorKind.invalidBase64;
    case 'InvalidKeyLength':
      return PqcProxyErrorKind.invalidKeyLength;
    case 'EncapsulationFailed':
      return PqcProxyErrorKind.encapsulationFailed;
    default:
      return PqcProxyErrorKind.unknown;
  }
}

/// Raw payload shape the IPC layer throws when the Rust side returns
/// `Err(PqcProxyError)`. Exposed so test stubs can synthesize it.
class PqcProxyErrorPayload implements Exception {
  const PqcProxyErrorPayload({
    required this.kind,
    required this.message,
  });

  final String kind;
  final String message;
}

/// Typed response shape matching the Rust `PqcProxyResponse` with
/// serde-default snake_case field names.
class PqcProxyResponse {
  const PqcProxyResponse({
    required this.url,
    required this.ciphertextB64,
    required this.sharedSecretBytes,
    required this.nistLevel,
    required this.algorithm,
  });

  final String url;
  final String ciphertextB64;
  final int sharedSecretBytes;
  final int nistLevel;
  final String algorithm;

  factory PqcProxyResponse.fromJson(Map<String, dynamic> json) {
    return PqcProxyResponse(
      url: json['url'] as String,
      ciphertextB64: json['ciphertext_b64'] as String,
      sharedSecretBytes: (json['shared_secret_bytes'] as num).toInt(),
      nistLevel: (json['nist_level'] as num).toInt(),
      algorithm: json['algorithm'] as String,
    );
  }
}

/// IPC invoker signature. The production wiring substitutes a function
/// that calls into flutter_rust_bridge or Tauri 2 mobile invoke; the
/// tests substitute a stub.
typedef PqcProxyInvoker = Future<Map<String, dynamic>> Function(
  String command,
  Map<String, dynamic> args,
);

/// Client for the mobile PQC proxy command.
class PqcProxyClient {
  PqcProxyClient({required PqcProxyInvoker invoker}) : _invoker = invoker;

  final PqcProxyInvoker _invoker;

  /// Command name pinned to the Rust `#[tauri::command]` function.
  /// Changing this is a breaking change across platforms.
  static const String commandName = 'pqc_proxy_command';

  /// Wraps a WebView target in an ML-KEM-768 encapsulated session by
  /// calling the Rust PQC proxy bridge.
  Future<PqcProxyResponse> wrap({
    required String url,
    required String peerPublicKeyB64,
  }) async {
    // Up-front guard so the common "wrong scheme" case does not pay an
    // IPC round trip. The Rust side repeats the same check; we just
    // fail faster on the client.
    final trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw PqcProxyException(
        kind: PqcProxyErrorKind.invalidUrl,
        message: 'scheme must be http or https, got: ${trimmed.isEmpty ? "<empty>" : trimmed}',
      );
    }

    try {
      final raw = await _invoker(commandName, <String, dynamic>{
        'url': trimmed,
        'peer_public_key_b64': peerPublicKeyB64,
      });
      return PqcProxyResponse.fromJson(raw);
    } on PqcProxyErrorPayload catch (e) {
      throw PqcProxyException(
        kind: _kindFromTag(e.kind),
        message: e.message,
      );
    }
  }
}
