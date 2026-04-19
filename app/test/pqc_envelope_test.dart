import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/pqc/envelope.dart';

void main() {
  group('PqcEnvelope', () {
    test('wraps plaintext with ML-KEM-768 algorithm label', () {
      final env = PqcEnvelope.wrap(
        plaintext: 'hello'.codeUnits,
        recipientKid: 'alice@example.com',
      );
      expect(env.algorithm, 'ML-KEM-768');
      expect(env.recipientKid, 'alice@example.com');
      expect(env.ciphertext.isNotEmpty, isTrue);
    });

    test('rejects empty plaintext', () {
      expect(
        () => PqcEnvelope.wrap(plaintext: const [], recipientKid: 'x'),
        throwsArgumentError,
      );
    });
  });
}
