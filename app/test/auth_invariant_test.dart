import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/providers/auth_provider.dart';

/// Pins the OAuth username invariant documented in project CLAUDE.md
/// under "Authentication & Onboarding".
///
/// History: commit f099ff5 (2026-05-01 16:52) re-introduced an
/// `_ensureUsername` helper that slugified `full_name` into `username`,
/// producing "@daniel.mo.houshmand" for users signed in as
/// mo@qdaria.com. Commit 742846c (17:10 same day) removed it again.
/// This test exists so the next "restore" attempt fails CI loudly.
void main() {
  group('OAuth username invariant', () {
    test('auth_provider.dart contains no auto-derivation helper', () {
      final source =
          File('lib/core/providers/auth_provider.dart').readAsStringSync();

      const forbidden = <String>[
        '_ensureUsername',
        'ensureUsername',
        'deriveUsername',
        'slugFromName',
      ];

      for (final symbol in forbidden) {
        expect(
          source.contains(symbol),
          isFalse,
          reason:
              'CLAUDE.md auth invariant: $symbol must not exist. '
              'Username is user-chosen via /onboarding, never derived '
              'from OAuth profile fields. See commit f099ff5 for the '
              'last regression.',
        );
      }
    });

    test('auth_provider.dart carries the invariant comment', () {
      final source =
          File('lib/core/providers/auth_provider.dart').readAsStringSync();
      expect(
        source,
        contains('Username MUST be picked by the user via /onboarding'),
        reason: 'The invariant comment is the in-file reminder; if it is '
            'removed the next contributor loses the load-bearing context.',
      );
    });

    test('supabase_service.signInWithOAuthBrowser does not write username',
        () {
      final source =
          File('lib/core/services/supabase_service.dart').readAsStringSync();

      // Extract the signInWithOAuthBrowser method body.
      final start = source.indexOf('signInWithOAuthBrowser');
      expect(start, greaterThan(-1),
          reason: 'signInWithOAuthBrowser must exist');
      // Take a generous window forward (method body + a little).
      final window =
          source.substring(start, (start + 1500).clamp(0, source.length));

      // The OAuth flow must not call updateProfile or write to user_metadata.
      expect(window.contains('updateProfile'), isFalse,
          reason: 'OAuth sign-in path must not call updateProfile; '
              'username is set only via the /onboarding screen.');
      expect(window.contains("'username'"), isFalse,
          reason: 'OAuth sign-in path must not reference username.');
    });

    test('AuthState.needsOnboarding is false when not authenticated', () {
      const state = AuthState();
      expect(state.isAuthenticated, isFalse);
      expect(state.needsOnboarding, isFalse,
          reason: 'A logged-out user does not need onboarding; the router '
              'sends them to /login instead.');
      expect(state.username, isNull);
    });

    test('AuthState.displayName falls back gracefully with no user', () {
      const state = AuthState();
      expect(state.displayName, isEmpty);
    });
  });
}
