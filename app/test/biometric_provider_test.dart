// Coverage skeleton — v25 G2: app/lib/core/providers/biometric_provider.dart
// Currently 0 tests. 15 of 17 Riverpod providers in app/lib/core/providers/
// are untested; biometric_provider is the highest-risk because it gates the
// vault unlock flow and a missed `lock()` on backgrounding leaks the vault
// across app switches (FaceID-skip regression).
//
// Place at:  app/test/biometric_provider_test.dart  (collected by `flutter test`)
//
// SHAPE A (this file): channel-mock biometric_service via local_auth's
// MethodChannel handler. Pros: no source change to lib/. Cons: brittle if
// local_auth bumps its channel name; requires re-mocking on every test.
//
// SHAPE B (USER DESIGN PICK — needed before this skeleton ships):
//   Refactor BiometricService to take an injectable `LocalAuthentication`
//   (or expose `BiometricService.testInstance(...)`). Then provider tests
//   override the service via Riverpod and these tests get 5 lines shorter.
//   Pros: idiomatic. Cons: touches lib/ source for a test concern.
//
// Until Mo picks A vs B, the body below is structured so the assertions
// remain valid under either path; only the setUp swap differs.

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zipminator/core/providers/biometric_provider.dart';

const _kBiometricEnabledKey = 'biometric_lock_enabled';

// local_auth channel name (verified against pubspec local_auth ^2.x).
// If this rotates, the failure mode is "all biometric tests skip silently",
// so the channel-name pin below is itself a regression guard.
const _kLocalAuthChannel = MethodChannel('plugins.flutter.io/local_auth');

void _stubBiometricChannel({
  required bool canCheck,
  required bool isSupported,
  required bool authenticateResult,
  bool authenticateThrows = false,
}) {
  TestDefaultBinaryMessengerBinding.instance!.defaultBinaryMessenger
      .setMockMethodCallHandler(_kLocalAuthChannel, (call) async {
    switch (call.method) {
      case 'canCheckBiometrics':
        return canCheck;
      case 'isDeviceSupported':
        return isSupported;
      case 'authenticate':
        if (authenticateThrows) {
          throw PlatformException(code: 'NotEnrolled', message: 'no biometrics');
        }
        return authenticateResult;
      case 'getAvailableBiometrics':
        return <String>[];
      default:
        return null;
    }
  });
}

void _clearBiometricChannel() {
  TestDefaultBinaryMessengerBinding.instance!.defaultBinaryMessenger
      .setMockMethodCallHandler(_kLocalAuthChannel, null);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(_clearBiometricChannel);

  group('BiometricNotifier.build', () {
    test('build() with no stored pref + no hardware: enabled=false available=false locked=false', () async {
      _stubBiometricChannel(canCheck: false, isSupported: false, authenticateResult: false);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = await container.read(biometricProvider.future);
      expect(state.enabled, isFalse, reason: 'fresh install must default OFF');
      expect(state.available, isFalse);
      expect(state.locked, isFalse);
    });

    test('build() with stored pref=true + hardware available: locked=true on launch', () async {
      // Locked-on-launch is the security invariant. If the user enabled
      // biometric lock and then quit the app, reopening must require a re-auth.
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: true);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = await container.read(biometricProvider.future);
      expect(state.enabled, isTrue);
      expect(state.available, isTrue);
      expect(state.locked, isTrue, reason: 'enabled+available implies locked at build');
    });

    test('build() with stored pref=true but hardware unavailable: locked=false (graceful)', () async {
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: false, isSupported: false, authenticateResult: false);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = await container.read(biometricProvider.future);
      expect(state.enabled, isTrue);
      expect(state.available, isFalse);
      expect(state.locked, isFalse,
          reason: 'no hardware must not strand the user behind a lock screen');
    });
  });

  group('BiometricNotifier.toggle', () {
    test('toggle no-ops when hardware unavailable', () async {
      _stubBiometricChannel(canCheck: false, isSupported: false, authenticateResult: false);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      await container.read(biometricProvider.notifier).toggle();

      final state = container.read(biometricProvider).value!;
      expect(state.enabled, isFalse, reason: 'must not flip pref without hardware');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool(_kBiometricEnabledKey), isNull,
          reason: 'pref must not be written when hardware missing');
    });

    test('toggle ON requires successful biometric auth (auth fails -> stays off)', () async {
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: false);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      await container.read(biometricProvider.notifier).toggle();

      final state = container.read(biometricProvider).value!;
      expect(state.enabled, isFalse,
          reason: 'failed identity proof must not enable lock');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool(_kBiometricEnabledKey) ?? false, isFalse);
    });

    test('toggle ON persists pref when biometric auth succeeds', () async {
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: true);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      await container.read(biometricProvider.notifier).toggle();

      final state = container.read(biometricProvider).value!;
      expect(state.enabled, isTrue);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool(_kBiometricEnabledKey), isTrue,
          reason: 'pref must persist across cold launches');
    });

    test('toggle OFF does NOT require biometric auth (UX: cant-be-locked-out)', () async {
      // Spec call this is a deliberate design choice to avoid lockout when a
      // user loses access to their biometric (broken sensor, finger injury).
      // If Mo decides toggle-OFF should also require auth, flip the assertion
      // and update biometric_provider.dart toggle() to gate both directions.
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: false);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      await container.read(biometricProvider.notifier).toggle();

      final state = container.read(biometricProvider).value!;
      expect(state.enabled, isFalse,
          reason: 'OFF path should not be auth-gated under current policy');
    });
  });

  group('BiometricNotifier.unlock', () {
    test('unlock with successful auth clears locked flag', () async {
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: true);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      expect(container.read(biometricProvider).value!.locked, isTrue);

      final ok = await container.read(biometricProvider.notifier).unlock();
      expect(ok, isTrue);
      expect(container.read(biometricProvider).value!.locked, isFalse);
    });

    test('unlock with failed auth returns false and keeps locked', () async {
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: false);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      final ok = await container.read(biometricProvider.notifier).unlock();
      expect(ok, isFalse);
      expect(container.read(biometricProvider).value!.locked, isTrue,
          reason: 'failed auth must NOT silently unlock');
    });

    test('unlock when PlatformException thrown returns false', () async {
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(
        canCheck: true,
        isSupported: true,
        authenticateResult: false,
        authenticateThrows: true,
      );
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      final ok = await container.read(biometricProvider.notifier).unlock();
      expect(ok, isFalse);
      expect(container.read(biometricProvider).value!.locked, isTrue);
    });
  });

  group('BiometricNotifier.lock (background invariant)', () {
    test('lock() flips locked=true when enabled+available', () async {
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: true);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Build, then unlock so locked starts false.
      await container.read(biometricProvider.future);
      await container.read(biometricProvider.notifier).unlock();
      expect(container.read(biometricProvider).value!.locked, isFalse);

      // Backgrounding should re-lock.
      container.read(biometricProvider.notifier).lock();
      expect(container.read(biometricProvider).value!.locked, isTrue,
          reason: 'app-backgrounded vault must re-lock to prevent over-shoulder leak');
    });

    test('lock() is a no-op when biometric is disabled', () async {
      _stubBiometricChannel(canCheck: true, isSupported: true, authenticateResult: true);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      container.read(biometricProvider.notifier).lock();
      expect(container.read(biometricProvider).value!.locked, isFalse,
          reason: 'opt-out users must not see a phantom lock screen');
    });

    test('lock() is a no-op when hardware unavailable', () async {
      SharedPreferences.setMockInitialValues({_kBiometricEnabledKey: true});
      _stubBiometricChannel(canCheck: false, isSupported: false, authenticateResult: false);
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(biometricProvider.future);
      container.read(biometricProvider.notifier).lock();
      expect(container.read(biometricProvider).value!.locked, isFalse,
          reason: 'cannot lock without an unlock path');
    });
  });
}
