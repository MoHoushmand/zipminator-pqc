import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/router.dart';

/// Tests for the auth-bypass escape hatch in [appRouter].
///
/// Pillar: cross-cutting (auth + every feature route). Surface: security.
///
/// REAL BUGS PINNED BY THESE TESTS (audit 2026-05-01 v26 G2):
///
/// 1. `skipAuthRedirectForTests` is a top-level `bool` with no production
///    guard. A release build with this flipped to `true` would let any
///    user reach Vault/Messenger/VPN screens without authenticating. There
///    is no `assert(kDebugMode)` or `if (kReleaseMode) skipAuthRedirectForTests = false`
///    anywhere in the binary.
///
/// 2. Test bleed risk: any test that flips this flag and forgets to reset
///    it in `tearDown` corrupts every subsequent widget test in the same
///    Dart isolate. Pin the default and require explicit reset hygiene.
///
/// 3. The flag's name is plural ("ForTests") and its docstring says "only
///    test harnesses should set this", but nothing enforces this. A future
///    PR that imports `router.dart` and toggles the flag to bypass auth in
///    production code would compile and pass review.
///
/// User A/B (audit v26 G2):
///   Shape A: Wrap with `if (kReleaseMode) skipAuthRedirectForTests = false;`
///            at app startup in `main.dart`. Cheapest fix, leaves the flag
///            mutable but defangs it for releases.
///   Shape B: Refactor to private constant and inject via a Provider that
///            tests can override. Cleanest, requires more change.
///   Shape C: Use an environment variable / build-flavor check
///            (`bool.fromEnvironment('FLUTTER_TEST')`) to derive the bool
///            instead of mutable state. Eliminates test-bleed risk.
void main() {
  group('appRouter auth-bypass flag — security defaults', () {
    test('skipAuthRedirectForTests defaults to false', () {
      // If this fails, either someone changed the default (security regression)
      // or a previous test in the same isolate forgot tearDown. Both are bugs.
      expect(skipAuthRedirectForTests, isFalse,
          reason: 'auth redirect must be ENABLED by default; only test '
                  'harnesses should set the bypass to true');
    });

    test('flag is settable to true (test harness contract)', () {
      // This is the contract: tests need to be able to flip it.
      skipAuthRedirectForTests = true;
      expect(skipAuthRedirectForTests, isTrue);
      // Reset so we don't bleed.
      skipAuthRedirectForTests = false;
    });

    test('tearDown discipline: flag is false at end of every test', () {
      // Pin this test as a regression target. If this fails, a sibling test
      // in this file (or any other file using the global) leaked state.
      addTearDown(() {
        skipAuthRedirectForTests = false;
      });
      skipAuthRedirectForTests = true;
      // Tear-down runs after the test; cannot assert false here, but the
      // addTearDown callback restores invariant for the next test.
      expect(skipAuthRedirectForTests, isTrue,
          reason: 'flag accepted true within test scope');
    });

    test('post-tearDown invariant: flag is false', () {
      // Runs after the previous test's tearDown. If state bled, this fails.
      expect(skipAuthRedirectForTests, isFalse,
          reason: 'previous test must have reset the flag in tearDown');
    });
  });

  // TODO(v26 G2): When user picks Shape A (kReleaseMode guard), add:
  //   test('skipAuthRedirectForTests is force-false in release mode', () {
  //     // Cannot run kReleaseMode in unit tests, but can assert that
  //     // main.dart contains the guard line. Static-grep test:
  //     final main = File('lib/main.dart').readAsStringSync();
  //     expect(main, contains('if (kReleaseMode) skipAuthRedirectForTests'));
  //   });
}
