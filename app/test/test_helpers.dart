import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/providers/biometric_provider.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/router.dart';

/// Provider overrides that stub out Supabase and biometric dependencies
/// so widget tests can pump [ZipminatorApp] without real backend services.
final testOverrides = [
  // Stub auth: unauthenticated, no Supabase call.
  authProvider.overrideWith(_StubAuthNotifier.new),
  // Stub signaling: no-op (depends on auth).
  signalingInitProvider.overrideWithValue(null),
  // Stub biometric: unlocked, not available.
  biometricProvider.overrideWith(_StubBiometricNotifier.new),
];

/// Call in setUp or at the top of main() to bypass auth redirects in tests.
void setUpTestEnvironment() {
  skipAuthRedirectForTests = true;
}

/// Tap a tab on the shell's NavigationBar (mobile) or NavigationRail (desktop)
/// by its label, scoping to the nav widget so duplicate labels (e.g. in the
/// home grid) don't cause "ambiguously found multiple matching widgets" errors.
///
/// On mobile, tabs 5-10 (VPN, Browser, Email, Q-AI, Anonymizer, Q-Mesh) live
/// behind the "More" overflow bottom sheet; this helper opens that sheet and
/// taps the matching ListTile automatically.
Future<void> tapNavTab(WidgetTester tester, String label) async {
  final bar = find.byType(NavigationBar);
  final rail = find.byType(NavigationRail);
  final isMobile = bar.evaluate().isNotEmpty;
  final parent = isMobile ? bar : rail;

  final direct = find.descendant(of: parent, matching: find.text(label));
  if (direct.evaluate().isNotEmpty) {
    await tester.tap(direct);
  } else if (isMobile) {
    // Overflow tab. Open the "More" bottom sheet, then tap the label there.
    await tester.tap(find.descendant(of: bar, matching: find.text('More')));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));
    // The sheet's ListTile has `title: Text(label)`.
    await tester.tap(find.widgetWithText(ListTile, label).last);
  } else {
    // Shouldn't happen on desktop — rail has all tabs. Surface a clearer error.
    throw StateError('Nav tab "$label" not found in rail or bar');
  }
  await tester.pump(const Duration(seconds: 1));
  await tester.pump(const Duration(milliseconds: 100));
}

class _StubAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState();
}

class _StubBiometricNotifier extends BiometricNotifier {
  @override
  Future<BiometricState> build() async => const BiometricState();
}
