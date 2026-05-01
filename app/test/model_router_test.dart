import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/services/llm_provider.dart';
import 'package:zipminator/core/services/model_router.dart';

/// Tests for [ModelRouter.recommendModel].
///
/// Pillar: Q-AI. Surface: privacy-sensitive routing.
///
/// REAL BUGS PINNED BY THESE TESTS (audit 2026-05-01 v26 G1):
///
/// 1. Privacy-vs-speed precedence is broken. When `preferSpeed=true` AND no
///    on-device model is downloaded, a query containing privacy keywords
///    ("password", "ssn", "medical") routes to cloud Groq Llama 3.3 70B,
///    bypassing the privacy intent entirely. Expected: privacy must win or
///    refuse to route, never silently downgrade.
///
/// 2. Substring contains() drives soft false positives. The keyword "secret"
///    in `_privacyKeywords` matches "secretly", "secretary", "secrete". Any
///    query about an executive secretary triggers privacy routing. Probably
///    fine for safety but should be acknowledged or fixed with word boundary.
///
/// 3. Catalog drift surface. `_modelById('gemini-2.5-flash')` falls back to
///    `kAvailableModels.first` if the ID is removed. If catalog is reordered
///    so first is on-device-only, default routing breaks for users without
///    on-device.
///
/// 4. CATALOG DRIFT BUG (discovered while writing this test):
///    `_bestOnDeviceModel` preference list at model_router.dart:117-123
///    references model IDs that DO NOT EXIST in `kAvailableModels`:
///       'gemma-4-e4b-it'           ← catalog has 'gemma-4-e4b' (no -it)
///       'gemma-4-e2b-it'           ← catalog has 'gemma-4-e2b' (no -it)
///       'gemma-3n-e2b-it'          ← not in catalog at all
///       'deepseek-r1-distill-qwen-1.5b'  ← not in catalog at all
///       'gemma-3-1b-it-q4'         ← not in catalog at all
///    Result: every `_modelById` lookup in the privacy path misses and
///    silently falls back to `kAvailableModels.first` (currently 'gemma-4-e4b').
///    Users who download "the wrong ID" think they have on-device privacy
///    routing but actually get whatever happens to be first in catalog.
///
/// User A/B (audit v26 G1):
///   Shape A: Make privacy STRICTLY win over preferSpeed. Privacy keyword +
///            no on-device should refuse to route (return null) or use a
///            sealed allowlist of cloud providers with TLS+audit.
///   Shape B: Add `policyMode: enum { strict, balanced, fast }` parameter.
///            Strict = current behavior + null-on-no-on-device.
///   Shape C: Replace contains() with `RegExp(r'\b' + kw + r'\b')` for word
///            boundary. Eliminates false-positives.
///   Shape D (CATALOG DRIFT): Add static assertion in ModelRouter that every
///            ID in the preference list also exists in `kAvailableModels`.
///            Run as a unit test or a debug-mode assert at app startup.
void main() {
  group('ModelRouter.recommendModel — happy paths', () {
    test('default query returns Gemini 2.5 Flash when no on-device available', () {
      final model = ModelRouter.recommendModel('What is the weather today?');
      expect(model.id, equals('gemini-2.5-flash'));
    });

    test('code keyword routes to DeepSeek Chat (cloud)', () {
      for (final kw in ['code', 'function', 'implement', 'debug', 'regex',
                         'sql', 'api', 'refactor', 'compile', 'syntax']) {
        final model = ModelRouter.recommendModel('Help me $kw this');
        expect(model.id, equals('deepseek-chat'),
            reason: 'keyword "$kw" should route to deepseek-chat');
      }
    });

    test('reasoning keyword routes to DeepSeek Reasoner (cloud)', () {
      for (final kw in ['prove', 'calculate', 'reason', 'analyze',
                         'step by step', 'theorem', 'derive', 'equation',
                         'logic', 'math']) {
        final model = ModelRouter.recommendModel('Please $kw the result');
        expect(model.id, equals('deepseek-reasoner'),
            reason: 'keyword "$kw" should route to deepseek-reasoner');
      }
    });

    test('preferSpeed routes to Groq Llama 3.3 70B for non-privacy', () {
      final model = ModelRouter.recommendModel(
        'Tell me a joke',
        preferSpeed: true,
      );
      expect(model.id, equals('llama-3.3-70b-versatile'));
    });
  });

  group('ModelRouter.recommendModel — privacy precedence (G1 BUG)', () {
    test('privacy keyword + on-device available → routes on-device', () {
      final model = ModelRouter.recommendModel(
        'My password is hunter2',
        downloadedOnDeviceModels: const {'gemma-4-e4b-it'},
      );
      expect(model.provider.isLocal, isTrue,
          reason: 'privacy must route on-device when available');
      expect(model.id, equals('gemma-4-e4b-it'));
    });

    test('privacy keyword + on-device DeepSeek R1 picks Gemma 4 first', () {
      // Preference order: Gemma 4 > 3n > 3 1B > DeepSeek R1.
      final model = ModelRouter.recommendModel(
        'Show me my medical record',
        downloadedOnDeviceModels: const {
          'gemma-4-e4b-it',
          'deepseek-r1-distill-qwen-1.5b',
        },
      );
      expect(model.id, equals('gemma-4-e4b-it'));
    });

    // BUG PIN: privacy + preferSpeed + no on-device = silent fallthrough to Groq.
    // This test should FAIL until the user picks Shape A/B/C.
    test('REGRESSION: privacy + preferSpeed + no on-device must NOT silently '
        'route to cloud Groq', () {
      final model = ModelRouter.recommendModel(
        'My SSN is 123-45-6789',
        preferSpeed: true,
        downloadedOnDeviceModels: const {},
      );
      // CURRENT (buggy) behavior: routes to llama-3.3-70b-versatile.
      // EXPECTED: refuse, return null-equivalent, or use sealed-cloud allowlist.
      expect(model.id, isNot(equals('llama-3.3-70b-versatile')),
          reason: 'privacy must win over speed; current code has silent '
                  'fallthrough to Groq cloud (audit v26 G1)');
    }, skip: 'Awaiting user A/B/C pick on privacy precedence (see file header)');

    test('privacy fallthrough when no on-device → currently picks default', () {
      // Without preferSpeed, privacy keyword + no on-device falls through
      // through the chain. Final landing depends on whether other keywords
      // are present. Pin current behavior so any change is intentional.
      final model = ModelRouter.recommendModel(
        'Save my secret token',
        downloadedOnDeviceModels: const {},
      );
      // 'token' is in privacy list AND not in code/reasoning. Falls through
      // to default branch (line 99): gemini-2.5-flash.
      expect(model.id, equals('gemini-2.5-flash'));
    });
  });

  group('ModelRouter.recommendModel — keyword false positives', () {
    test('"secretary" matches privacy "secret" via contains() — soft FP', () {
      final model = ModelRouter.recommendModel(
        'Email my secretary about the meeting',
        downloadedOnDeviceModels: const {'gemma-4-e4b-it'},
      );
      // CURRENT behavior: routes on-device because contains('secret') is true.
      // This is a soft FP, conservative for privacy but routes harmless
      // queries through the local model. Pin so any change is intentional.
      expect(model.provider.isLocal, isTrue);
    });

    test('"keyword" matches privacy "key" — soft FP', () {
      final model = ModelRouter.recommendModel(
        'What is a keyword?',
        downloadedOnDeviceModels: const {'gemma-4-e4b-it'},
      );
      expect(model.provider.isLocal, isTrue);
    });
  });

  group('ModelRouter.recommendModel — case insensitivity', () {
    test('uppercase privacy keyword matches', () {
      final model = ModelRouter.recommendModel(
        'My PASSWORD is hunter2',
        downloadedOnDeviceModels: const {'gemma-4-e4b-it'},
      );
      expect(model.provider.isLocal, isTrue);
    });

    test('mixed-case code keyword matches', () {
      final model = ModelRouter.recommendModel('Help me ReFaCtOr this');
      expect(model.id, equals('deepseek-chat'));
    });
  });

  group('ModelRouter._bestOnDeviceModel — preference order', () {
    test('prefers Gemma 4 e4b over 3n', () {
      final model = ModelRouter.recommendModel(
        'sensitive: medical',
        downloadedOnDeviceModels: const {
          'gemma-4-e4b-it',
          'gemma-3n-e2b-it',
        },
      );
      expect(model.id, equals('gemma-4-e4b-it'));
    });

    test('falls through Gemma 4 → 3n → 3-1b → DeepSeek R1', () {
      final model = ModelRouter.recommendModel(
        'sensitive: bank',
        downloadedOnDeviceModels: const {
          'deepseek-r1-distill-qwen-1.5b',
          'gemma-3-1b-it-q4',
        },
      );
      expect(model.id, equals('gemma-3-1b-it-q4'));
    });

    test('only DeepSeek R1 available → picks it', () {
      final model = ModelRouter.recommendModel(
        'private: account',
        downloadedOnDeviceModels: const {'deepseek-r1-distill-qwen-1.5b'},
      );
      expect(model.id, equals('deepseek-r1-distill-qwen-1.5b'));
    });
  });

  group('ModelRouter.availableFreeModels', () {
    test('empty apiKeys + empty downloads → empty list', () {
      final models = ModelRouter.availableFreeModels(const {});
      expect(models, isEmpty);
    });

    test('on-device model in catalog requires download to be available', () {
      final models = ModelRouter.availableFreeModels(
        const {},
        downloadedOnDeviceModels: const {'gemma-4-e4b-it'},
      );
      expect(models.any((m) => m.id == 'gemma-4-e4b-it'), isTrue);
    });

    test('cloud free-tier model requires non-empty API key', () {
      final models = ModelRouter.availableFreeModels(
        const {LLMProvider.gemini: ''},
      );
      expect(models.any((m) => m.provider == LLMProvider.gemini), isFalse);
    });

    test('catalog filter: only freeTier models are candidates', () {
      final models = ModelRouter.availableFreeModels(
        const {LLMProvider.gemini: 'fake-key'},
      );
      expect(models.every((m) => m.freeTier), isTrue);
    });
  });
}
