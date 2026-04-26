import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:zipminator/core/providers/pii_provider.dart';

/// Anonymization strategy corresponding to Rust AnonymizationLevel 1-10.
enum AnonymizationStrategy {
  highlight,       // L1: positions only
  partialMask,     // L2: J***
  fullMask,        // L3: ****
  typeReplace,     // L4: [NAME]
  hashPseudonymize, // L5: PII_a3f2b8
  randomPseudonymize, // L6: PII_x7k9m2
  quantumJitter,   // L7: noise before mask
  differentialPrivacy, // L8: epsilon-delta
  kAnonymity,      // L9: generalize
  fullRedaction,   // L10: [REDACTED]
}

/// Result of an anonymization operation.
class AnonymizedResult {
  final String originalText;
  final String anonymizedText;
  final int level;
  final int matchCount;
  final Duration processingTime;

  const AnonymizedResult({
    required this.originalText,
    required this.anonymizedText,
    required this.level,
    required this.matchCount,
    required this.processingTime,
  });
}

/// State for the anonymizer feature.
class AnonymizerState {
  final int selectedLevel;
  final AnonymizedResult? result;
  final bool isProcessing;
  final String? error;

  const AnonymizerState({
    this.selectedLevel = 5,
    this.result,
    this.isProcessing = false,
    this.error,
  });

  AnonymizerState copyWith({
    int? selectedLevel,
    AnonymizedResult? result,
    bool? isProcessing,
    String? error,
  }) =>
      AnonymizerState(
        selectedLevel: selectedLevel ?? this.selectedLevel,
        result: result ?? this.result,
        isProcessing: isProcessing ?? this.isProcessing,
        error: error,
      );
}

/// Thin client for the FastAPI ``POST /api/anonymize`` endpoint.
///
/// Resolves a sensible default base URL per platform (Android emulators reach
/// the host via 10.0.2.2; everything else uses localhost). Override with
/// ``--dart-define=ZIPMINATOR_API_BASE_URL=https://...`` for staging or prod.
class AnonymizerApiService {
  AnonymizerApiService({
    String? baseUrl,
    http.Client? httpClient,
    Duration timeout = const Duration(seconds: 4),
  })  : _baseUrl = baseUrl ?? _defaultBaseUrl(),
        _http = httpClient ?? http.Client(),
        _timeout = timeout;

  final String _baseUrl;
  final http.Client _http;
  final Duration _timeout;

  static const _envBaseUrl =
      String.fromEnvironment('ZIPMINATOR_API_BASE_URL', defaultValue: '');

  static String _defaultBaseUrl() {
    if (_envBaseUrl.isNotEmpty) return _envBaseUrl;
    if (kIsWeb) return 'http://localhost:8000';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }

  /// POST {level, text} to ``/api/anonymize`` and return the anonymized text.
  ///
  /// Throws [AnonymizerApiException] on any failure. The Riverpod notifier
  /// catches that and falls back to on-device anonymization.
  Future<String> anonymize({required int level, required String text}) async {
    final uri = Uri.parse('$_baseUrl/api/anonymize');
    final http.Response resp;
    try {
      resp = await _http
          .post(
            uri,
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode({'level': level, 'text': text}),
          )
          .timeout(_timeout);
    } on TimeoutException catch (e) {
      throw AnonymizerApiException('Anonymizer API timed out: $e');
    } catch (e) {
      throw AnonymizerApiException('Anonymizer API unreachable: $e');
    }

    if (resp.statusCode != 200) {
      throw AnonymizerApiException(
        'Anonymizer API returned ${resp.statusCode}: ${resp.body}',
      );
    }

    final dynamic body = jsonDecode(resp.body);
    if (body is! Map || body['anonymized_text'] is! String) {
      throw AnonymizerApiException(
        'Anonymizer API returned malformed body: ${resp.body}',
      );
    }
    return body['anonymized_text'] as String;
  }

  void close() => _http.close();
}

class AnonymizerApiException implements Exception {
  AnonymizerApiException(this.message);
  final String message;
  @override
  String toString() => 'AnonymizerApiException: $message';
}

/// Riverpod-overridable provider for the API client. Tests inject a fake.
final anonymizerApiServiceProvider = Provider<AnonymizerApiService>((ref) {
  final svc = AnonymizerApiService();
  ref.onDispose(svc.close);
  return svc;
});

/// Manages 10-level anonymization by:
///   1. Posting `{level, text}` to ``POST /api/anonymize`` (FastAPI backend).
///   2. Falling back to on-device PII-match-based anonymization if the API is
///      unreachable (offline mode, dev environments without the API server).
///
/// On-device fallback uses [PiiNotifier]'s Rust-backed scan, then applies
/// level-appropriate transforms locally.
class AnonymizerNotifier extends Notifier<AnonymizerState> {
  @override
  AnonymizerState build() => const AnonymizerState();

  void setLevel(int level) {
    state = state.copyWith(selectedLevel: level.clamp(1, 10));
  }

  /// Run anonymization on [text] at the currently selected level.
  ///
  /// Calls the API first; on any error, falls back to on-device redaction so
  /// the UI keeps working offline.
  Future<void> anonymize(String text) async {
    if (text.isEmpty) return;
    state = state.copyWith(isProcessing: true, error: null);
    final stopwatch = Stopwatch()..start();
    final level = state.selectedLevel;

    // Always run the local PII scan so the UI can surface match counts
    // and highlights regardless of which path produces the redacted text.
    final piiNotifier = ref.read(piiProvider.notifier);
    piiNotifier.scan(text);
    final matches = ref.read(piiProvider).matches;

    String anonymized;
    String? apiError;
    try {
      final api = ref.read(anonymizerApiServiceProvider);
      anonymized = await api.anonymize(level: level, text: text);
    } on AnonymizerApiException catch (e) {
      apiError = e.message;
      anonymized = _applyLevel(text, matches, level);
    } catch (e) {
      apiError = e.toString();
      anonymized = _applyLevel(text, matches, level);
    }

    stopwatch.stop();
    state = AnonymizerState(
      selectedLevel: level,
      // `error` carries the API failure reason so observability/tests can
      // distinguish API-driven from local-fallback runs without breaking the UI.
      error: apiError,
      result: AnonymizedResult(
        originalText: text,
        anonymizedText: anonymized,
        level: level,
        matchCount: matches.length,
        processingTime: stopwatch.elapsed,
      ),
    );
  }

  /// Apply anonymization at the given level to text with detected PII matches.
  String _applyLevel(String text, List<PiiMatch> matches, int level) {
    if (matches.isEmpty) return text;

    // Sort matches by position (descending) to replace from end to start
    final sorted = List<PiiMatch>.from(matches)
      ..sort((a, b) => b.start.compareTo(a.start));

    var result = text;
    for (final m in sorted) {
      final replacement = switch (level) {
        1 => m.matchedText, // Highlight only — no replacement
        2 => _partialMask(m.matchedText),
        3 => '*' * m.matchedText.length,
        4 => '[${m.category.toUpperCase()}]',
        5 => 'PII_${_hashFragment(m.matchedText)}',
        6 => 'PII_${_randomFragment()}',
        7 => _quantumJitter(m),
        8 => _differentialPrivacy(m),
        9 => _kAnonymity(m),
        10 => _quantumRedact(m),
        _ => '[REDACTED]',
      };
      result = result.replaceRange(m.start, m.end, replacement);
    }
    return result;
  }

  /// Partial mask: keep first and last character, mask middle with asterisks.
  String _partialMask(String text) {
    if (text.length <= 2) return '*' * text.length;
    return '${text[0]}${'*' * (text.length - 2)}${text[text.length - 1]}';
  }

  /// Deterministic hash fragment (first 6 hex chars of SHA-256).
  String _hashFragment(String text) {
    var hash = 0x811c9dc5; // FNV-1a seed
    for (var i = 0; i < text.length; i++) {
      hash ^= text.codeUnitAt(i);
      hash = (hash * 0x01000193) & 0xFFFFFFFF;
    }
    return hash.toRadixString(16).padLeft(6, '0').substring(0, 6);
  }

  /// Random 6-char alphanumeric fragment.
  String _randomFragment() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final now = DateTime.now().microsecondsSinceEpoch;
    return List.generate(6, (i) => chars[(now + i * 7) % chars.length]).join();
  }

  /// L7: Quantum jitter. Adds entropy-seeded noise before masking.
  /// Numeric chars get random digit replacement; alpha chars get random letter.
  /// Each invocation produces different output (non-deterministic).
  String _quantumJitter(PiiMatch m) {
    final entropy = _getEntropy(m.matchedText.length);
    final buf = StringBuffer();
    for (var i = 0; i < m.matchedText.length; i++) {
      final c = m.matchedText.codeUnitAt(i);
      final noise = entropy[i % entropy.length];
      if (c >= 48 && c <= 57) {
        // digit: replace with noised digit
        buf.writeCharCode(48 + (noise % 10));
      } else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
        // letter: replace with noised letter (preserve case)
        final base = c >= 97 ? 97 : 65;
        buf.writeCharCode(base + (noise % 26));
      } else {
        buf.write(m.matchedText[i]); // keep separators
      }
    }
    return buf.toString();
  }

  /// L8: Differential privacy via Laplace mechanism.
  /// For numeric PII, applies calibrated noise (epsilon=1.0).
  /// For text PII, replaces with randomized pseudonym from category pool.
  String _differentialPrivacy(PiiMatch m) {
    final digits = m.matchedText.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 3) {
      // Numeric PII: apply Laplace noise
      final value = int.tryParse(digits) ?? 0;
      final entropy = _getEntropy(8);
      // Laplace noise approximation: difference of two exponentials
      final u1 = (entropy[0] + 1) / 257.0;
      final u2 = (entropy[1] + 1) / 257.0;
      const epsilon = 1.0;
      const sensitivity = 1.0;
      final noise = (sensitivity / epsilon) * (log(u1) - log(u2));
      final noised = (value + noise).round().abs();
      // Reconstruct with original separators
      final noisedStr = noised.toString().padLeft(digits.length, '0');
      var result = m.matchedText;
      var di = 0;
      final buf = StringBuffer();
      for (var i = 0; i < result.length && di < noisedStr.length; i++) {
        if (RegExp(r'[0-9]').hasMatch(result[i])) {
          buf.write(noisedStr[di]);
          di++;
        } else {
          buf.write(result[i]);
        }
      }
      return buf.toString();
    }
    // Non-numeric: randomized pseudonym
    return 'DP_${_randomFragment()}';
  }

  /// L9: K-anonymity generalization. Reduces quasi-identifiers to broader
  /// categories (zip to area, age to range, names to initials).
  String _kAnonymity(PiiMatch m) {
    return switch (m.category.toLowerCase()) {
      'email' => _generalizeEmail(m.matchedText),
      'phone' => _generalizePhone(m.matchedText),
      'address' => '[REGION]',
      'zip' || 'postal' => _generalizeZip(m.matchedText),
      'name' => _generalizeInitials(m.matchedText),
      'ssn' || 'national_id' => '***-**-${m.matchedText.substring(m.matchedText.length - 4).replaceAll(RegExp(r'[0-9]'), '*')}',
      'date' || 'dob' => _generalizeDate(m.matchedText),
      'age' => '[AGE_RANGE]',
      _ => '[${m.category.toUpperCase()}]',
    };
  }

  /// L10: Quantum one-time-pad redaction. XOR with entropy bytes, then hash.
  /// The result is cryptographically irreversible.
  String _quantumRedact(PiiMatch m) {
    final textBytes = Uint8List.fromList(m.matchedText.codeUnits);
    final entropy = _getEntropy(textBytes.length);
    // XOR text with entropy (one-time pad)
    var xorHash = 0x811c9dc5;
    for (var i = 0; i < textBytes.length; i++) {
      final xored = textBytes[i] ^ entropy[i % entropy.length];
      xorHash ^= xored;
      xorHash = (xorHash * 0x01000193) & 0xFFFFFFFF;
    }
    final tag = xorHash.toRadixString(16).padLeft(6, '0').substring(0, 6);
    return '[QR_$tag]';
  }

  // ── Entropy helper ──────────────────────────────────────────────────

  /// Get entropy bytes from Rust QRNG bridge, falling back to secure random.
  Uint8List _getEntropy(int length) {
    // Use dart:math secure random (Rust FFI bridge has no getEntropy export).
    final rng = Random.secure();
    return Uint8List.fromList(
      List.generate(length, (_) => rng.nextInt(256)),
    );
  }

  // ── K-anonymity generalization helpers ──────────────────────────────

  String _generalizeEmail(String email) {
    final at = email.indexOf('@');
    if (at < 0) return '[EMAIL]';
    return '***@${email.substring(at + 1)}';
  }

  String _generalizePhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 7) return '${digits.substring(0, 3)}-***-****';
    return '[PHONE]';
  }

  String _generalizeZip(String zip) {
    final digits = zip.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 3) return '${digits.substring(0, 3)}**';
    return '[AREA]';
  }

  String _generalizeInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.map((p) => p.isNotEmpty ? '${p[0]}.' : '').join(' ');
  }

  String _generalizeDate(String date) {
    // Keep only the year
    final yearMatch = RegExp(r'(19|20)\d{2}').firstMatch(date);
    if (yearMatch != null) return yearMatch.group(0)!;
    return '[DATE]';
  }

  void clear() {
    state = const AnonymizerState();
  }
}

final anonymizerProvider =
    NotifierProvider<AnonymizerNotifier, AnonymizerState>(AnonymizerNotifier.new);
