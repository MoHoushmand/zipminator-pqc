import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:zipminator/core/providers/anonymizer_provider.dart';

/// Helper that builds an [AnonymizerApiService] backed by an in-memory
/// [MockClient]. Tests assert by introspecting the request that flowed.
AnonymizerApiService _serviceWithMock(MockClient client) {
  return AnonymizerApiService(
    baseUrl: 'http://test.invalid',
    httpClient: client,
    timeout: const Duration(seconds: 1),
  );
}

void main() {
  group('AnonymizerApiService', () {
    test('POSTs {level, text} JSON body to /api/anonymize', () async {
      late http.Request capturedRequest;
      final client = MockClient((req) async {
        capturedRequest = req;
        return http.Response(
          jsonEncode({
            'level': 7,
            'original_text': 'hello',
            'anonymized_text': '#####',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final svc = _serviceWithMock(client);

      final result = await svc.anonymize(level: 7, text: 'hello');

      expect(result, '#####');
      expect(capturedRequest.method, 'POST');
      expect(capturedRequest.url.path, '/api/anonymize');
      expect(capturedRequest.headers['content-type'], 'application/json');
      final decoded = jsonDecode(capturedRequest.body) as Map<String, dynamic>;
      expect(decoded['level'], 7);
      expect(decoded['text'], 'hello');
    });

    test('non-200 status throws AnonymizerApiException', () async {
      final client = MockClient((req) async => http.Response('boom', 500));
      final svc = _serviceWithMock(client);

      expect(
        () => svc.anonymize(level: 5, text: 'x'),
        throwsA(isA<AnonymizerApiException>()),
      );
    });

    test('malformed body throws AnonymizerApiException', () async {
      final client = MockClient(
        (req) async => http.Response('{"oops":1}', 200),
      );
      final svc = _serviceWithMock(client);

      expect(
        () => svc.anonymize(level: 5, text: 'x'),
        throwsA(isA<AnonymizerApiException>()),
      );
    });

    test('network failure throws AnonymizerApiException', () async {
      final client = MockClient(
        (req) async => throw Exception('connection refused'),
      );
      final svc = _serviceWithMock(client);

      expect(
        () => svc.anonymize(level: 1, text: 'x'),
        throwsA(isA<AnonymizerApiException>()),
      );
    });

    test('timeout throws AnonymizerApiException', () async {
      final client = MockClient((req) async {
        // Delay longer than the configured 1s timeout below.
        await Future<void>.delayed(const Duration(seconds: 3));
        return http.Response('{}', 200);
      });
      final svc = AnonymizerApiService(
        baseUrl: 'http://test.invalid',
        httpClient: client,
        timeout: const Duration(milliseconds: 50),
      );

      expect(
        () => svc.anonymize(level: 1, text: 'x'),
        throwsA(isA<AnonymizerApiException>()),
      );
    });
  });

  group('AnonymizerNotifier', () {
    test('initial state has selectedLevel=5 and no result', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final state = container.read(anonymizerProvider);
      expect(state.selectedLevel, 5);
      expect(state.result, isNull);
    });

    test('setLevel clamps to [1, 10]', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(anonymizerProvider.notifier);

      notifier.setLevel(0);
      expect(container.read(anonymizerProvider).selectedLevel, 1);

      notifier.setLevel(11);
      expect(container.read(anonymizerProvider).selectedLevel, 10);

      notifier.setLevel(7);
      expect(container.read(anonymizerProvider).selectedLevel, 7);
    });

    test('anonymize(empty) is a no-op', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(anonymizerProvider.notifier).anonymize('');
      expect(container.read(anonymizerProvider).result, isNull);
    });

    test('anonymize uses API result when call succeeds', () async {
      final apiClient = MockClient((req) async {
        final body = jsonDecode(req.body) as Map<String, dynamic>;
        return http.Response(
          jsonEncode({
            'level': body['level'],
            'original_text': body['text'],
            'anonymized_text': '<<API_REDACTED L${body['level']}>>',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final fakeApi = AnonymizerApiService(
        baseUrl: 'http://test.invalid',
        httpClient: apiClient,
      );
      final container = ProviderContainer(overrides: [
        anonymizerApiServiceProvider.overrideWithValue(fakeApi),
      ]);
      addTearDown(container.dispose);

      final notifier = container.read(anonymizerProvider.notifier);
      notifier.setLevel(8);
      await notifier.anonymize('John Smith SSN 123-45-6789');

      final state = container.read(anonymizerProvider);
      expect(state.result, isNotNull);
      expect(state.result!.level, 8);
      expect(state.result!.anonymizedText, '<<API_REDACTED L8>>');
      expect(state.error, isNull);
    });

    test('anonymize falls back to local logic when API fails', () async {
      final apiClient = MockClient(
        (req) async => http.Response('upstream down', 500),
      );
      final fakeApi = AnonymizerApiService(
        baseUrl: 'http://test.invalid',
        httpClient: apiClient,
      );
      final container = ProviderContainer(overrides: [
        anonymizerApiServiceProvider.overrideWithValue(fakeApi),
      ]);
      addTearDown(container.dispose);

      final notifier = container.read(anonymizerProvider.notifier);
      notifier.setLevel(3);
      await notifier.anonymize('John Smith SSN 123-45-6789');

      final state = container.read(anonymizerProvider);
      // The fallback path always produces a result so the UI keeps working.
      expect(state.result, isNotNull);
      expect(state.result!.level, 3);
      expect(state.result!.anonymizedText, isNotEmpty);
      // The error field surfaces the API failure reason.
      expect(state.error, isNotNull);
      expect(state.error, contains('500'));
    });
  });
}
