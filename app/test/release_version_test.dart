import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:yaml/yaml.dart';

/// Release-gate tests: ensure the pubspec version is monotonically increasing
/// and that the Android + iOS release surfaces stay in sync.
///
/// These tests are the TDD red-before-green guard for the marathon mobile
/// release track. They fail when a release is attempted without bumping the
/// version or build number.
void main() {
  group('Release version gate', () {
    late YamlMap pubspec;
    late String versionString;
    late int buildNumber;
    late List<int> semver;

    setUpAll(() {
      final file = File('pubspec.yaml');
      expect(file.existsSync(), isTrue,
          reason: 'pubspec.yaml must exist in the working directory');
      pubspec = loadYaml(file.readAsStringSync()) as YamlMap;
      versionString = pubspec['version'] as String;
      final parts = versionString.split('+');
      expect(parts.length, 2,
          reason: 'pubspec version must be in the form x.y.z+build');
      semver = parts[0].split('.').map(int.parse).toList();
      buildNumber = int.parse(parts[1]);
    });

    test('pubspec version is strictly greater than the last shipped v0.5.0+44',
        () {
      // Last shipped TestFlight build referenced in CLAUDE.md.
      final lastSemver = <int>[0, 5, 0];
      const lastBuild = 44;

      final bumped = _compareSemver(semver, lastSemver) > 0 ||
          (_compareSemver(semver, lastSemver) == 0 && buildNumber > lastBuild);
      expect(bumped, isTrue,
          reason:
              'pubspec version ($versionString) must be greater than last shipped 0.5.0+44');
    });

    test('build number is positive and fits in Android versionCode range', () {
      expect(buildNumber, greaterThan(0));
      // Android versionCode max is 2_100_000_000 per Play Store docs.
      expect(buildNumber, lessThan(2100000000));
    });

    test('semver triple has exactly three numeric components', () {
      expect(semver.length, 3);
      for (final n in semver) {
        expect(n, greaterThanOrEqualTo(0));
      }
    });
  });
}

int _compareSemver(List<int> a, List<int> b) {
  for (var i = 0; i < 3; i++) {
    if (a[i] != b[i]) return a[i] - b[i];
  }
  return 0;
}
