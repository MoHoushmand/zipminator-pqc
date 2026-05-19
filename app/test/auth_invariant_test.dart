import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/providers/auth_provider.dart';

/// Pins the OAuth username policy documented in project CLAUDE.md
/// under "Authentication & Onboarding".
///
/// Policy (current, 2026-05-19):
///   - Default @handle is the OAuth EMAIL PREFIX
///     (mo@qdaria.com -> "mo", dmo.houshmand@gmail.com -> "dmo.houshmand").
///   - It is NEVER derived from full_name (the user's legal name).
///     full_name -> @handle was the f099ff5 regression that produced
///     "@daniel.mo.houshmand" on May 1.
///   - The user can rename via Profile -> Change at any time.
void main() {
  group('OAuth username policy', () {
    test('auth_provider.dart never slugifies full_name into username', () {
      final source =
          File('lib/core/providers/auth_provider.dart').readAsStringSync();

      // The literal source must not contain a derivation that reads
      // user_metadata['full_name'] and writes it into username.
      // Conservative check: the strings 'full_name' and 'username'
      // must not both appear inside the auto-default helper region.
      final autoDefault = _extractRegion(
        source,
        '_ensureUsernameFromEmail(User user)',
      );
      expect(autoDefault, isNotNull,
          reason: 'helper _ensureUsernameFromEmail(User user) must exist');

      expect(autoDefault!.contains("'full_name'"), isFalse,
          reason: 'auto-default helper must NOT read full_name. '
              'See f099ff5 regression: slugifying full_name produced '
              '@daniel.mo.houshmand for users named "Daniel Mo Houshmand".');

      expect(autoDefault.contains('user.email'), isTrue,
          reason: 'auto-default helper must derive from user.email.');
    });

    test('auth_provider.dart carries the policy comment', () {
      final source =
          File('lib/core/providers/auth_provider.dart').readAsStringSync();
      expect(
        source,
        contains('Default username is the EMAIL PREFIX'),
        reason: 'In-file policy comment is the load-bearing reminder. '
            'If a future contributor removes it, the next "fix" will '
            'drift back to full_name derivation.',
      );
    });

    test('signInWithOAuthBrowser does not directly write username', () {
      final source =
          File('lib/core/services/supabase_service.dart').readAsStringSync();
      final start = source.indexOf('signInWithOAuthBrowser');
      expect(start, greaterThan(-1));
      final window =
          source.substring(start, (start + 1500).clamp(0, source.length));
      // The OAuth service layer only authenticates. Setting the default
      // @handle is the provider's job (auth_provider._ensureUsernameFromEmail).
      expect(window.contains('updateProfile'), isFalse);
      expect(window.contains("'username'"), isFalse);
    });

    test('AuthState.needsOnboarding is false when not authenticated', () {
      const state = AuthState();
      expect(state.isAuthenticated, isFalse);
      expect(state.needsOnboarding, isFalse);
      expect(state.username, isNull);
    });

    test('AuthState.displayName falls back gracefully with no user', () {
      const state = AuthState();
      expect(state.displayName, isEmpty);
    });
  });
}

/// Returns the source of the first function whose signature contains
/// [needle], up to its matching closing brace. Brace-balanced.
String? _extractRegion(String source, String needle) {
  final start = source.indexOf(needle);
  if (start < 0) return null;
  // Find the opening { after the signature.
  final openIdx = source.indexOf('{', start);
  if (openIdx < 0) return null;
  var depth = 0;
  for (var i = openIdx; i < source.length; i++) {
    final c = source[i];
    if (c == '{') depth++;
    if (c == '}') {
      depth--;
      if (depth == 0) return source.substring(start, i + 1);
    }
  }
  return null;
}
