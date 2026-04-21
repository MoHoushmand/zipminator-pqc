/// Placeholder PQC envelope wrapper; flutter_rust_bridge will wire this to
/// zipminator-core Kyber768 / ML-KEM-768 encapsulation in a later iteration.
class PqcEnvelope {
  final String algorithm;
  final String recipientKid;
  final List<int> ciphertext;

  PqcEnvelope._({
    required this.algorithm,
    required this.recipientKid,
    required this.ciphertext,
  });

  factory PqcEnvelope.wrap({
    required List<int> plaintext,
    required String recipientKid,
  }) {
    if (plaintext.isEmpty) {
      throw ArgumentError('plaintext must not be empty');
    }
    final ciphertext = List<int>.generate(
      plaintext.length + 32,
      (i) => i < plaintext.length ? plaintext[i] ^ 0x5A : 0xAA,
    );
    return PqcEnvelope._(
      algorithm: 'ML-KEM-768',
      recipientKid: recipientKid,
      ciphertext: ciphertext,
    );
  }
}
