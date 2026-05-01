/**
 * Coverage gap G4: PqcBridge.ts contract tests.
 *
 * The bridge exposes 4 cryptographic methods to the React Native mobile
 * client. Existing tests cover the *services* that consume the bridge
 * (PqSrtpService, KmsService, etc.) but never test the bridge itself.
 *
 * Three failure modes this suite catches:
 *
 *   1. Stub-shape drift — if a native dev changes the real module's return
 *      shape (e.g., renames `sharedSecret` → `secret`) but forgets to
 *      update the JS stub, the web/test bundle silently breaks.
 *   2. Length contract drift — Kyber-768 sizes are fixed by FIPS 203.
 *      A stub returning the wrong byte count masquerades as working in
 *      Jest but breaks the moment the real module is wired up.
 *   3. setPqcNativeModule + Proxy delegation — if the Proxy's `get` trap
 *      caches `_module` instead of resolving it lazily, swapping the
 *      module in a test won't take effect, and tests pass for the wrong
 *      reason.
 *
 * Discovered: 2026-05-01 v22 audit, never tested in 21 prior passes.
 */

import { PqcBridge, setPqcNativeModule, PqcNativeModule } from '../bridges/PqcBridge';

// ─── Length constants from FIPS 203 (ML-KEM-768) ──────────────────────────
const KYBER768_PK_BYTES = 1184;
const KYBER768_SK_BYTES = 2400;
const KYBER768_CT_BYTES = 1088;
const KYBER768_SS_BYTES = 32;
const SRTP_MASTER_KEY_BYTES = 16;
const SRTP_MASTER_SALT_BYTES = 14;

function b64Length(b64: string): number {
  return Buffer.from(b64, 'base64').length;
}

// ─── Default stub returns FIPS-203-shaped values ─────────────────────────

describe('PqcBridge default JS stub', () => {
  // Reset to the default stub before each test by re-requiring the module.
  beforeEach(() => {
    jest.resetModules();
  });

  test('kyberKeypair returns 1184-byte pubkey + 2400-byte secret', async () => {
    const { PqcBridge: fresh } = await import('../bridges/PqcBridge');
    const { publicKey, secretKey } = await fresh.kyberKeypair();
    expect(b64Length(publicKey)).toBe(KYBER768_PK_BYTES);
    expect(b64Length(secretKey)).toBe(KYBER768_SK_BYTES);
  });

  test('kyberEncapsulate returns 1088-byte ct + 32-byte sharedSecret', async () => {
    const { PqcBridge: fresh } = await import('../bridges/PqcBridge');
    const { ciphertext, sharedSecret } = await fresh.kyberEncapsulate('AAAA');
    expect(b64Length(ciphertext)).toBe(KYBER768_CT_BYTES);
    expect(b64Length(sharedSecret)).toBe(KYBER768_SS_BYTES);
  });

  test('kyberDecapsulate returns 32-byte sharedSecret', async () => {
    const { PqcBridge: fresh } = await import('../bridges/PqcBridge');
    const ss = await fresh.kyberDecapsulate('AAAA', 'BBBB');
    expect(b64Length(ss)).toBe(KYBER768_SS_BYTES);
  });

  test('deriveSrtpKeys returns 16-byte masterKey + 14-byte masterSalt', async () => {
    const { PqcBridge: fresh } = await import('../bridges/PqcBridge');
    const ss = Buffer.alloc(32, 0x42).toString('base64');
    const { masterKey, masterSalt } = await fresh.deriveSrtpKeys(ss);
    expect(b64Length(masterKey)).toBe(SRTP_MASTER_KEY_BYTES);
    expect(b64Length(masterSalt)).toBe(SRTP_MASTER_SALT_BYTES);
  });
});

// ─── HKDF determinism (RFC 5869 contract) ────────────────────────────────

describe('PqcBridge.deriveSrtpKeys is deterministic', () => {
  test('same sharedSecret yields identical masterKey + masterSalt', async () => {
    const ss = Buffer.alloc(32, 0x42).toString('base64');
    const a = await PqcBridge.deriveSrtpKeys(ss);
    const b = await PqcBridge.deriveSrtpKeys(ss);
    expect(a.masterKey).toBe(b.masterKey);
    expect(a.masterSalt).toBe(b.masterSalt);
  });

  test('different sharedSecrets yield different masterKey', async () => {
    const ss1 = Buffer.alloc(32, 0x42).toString('base64');
    const ss2 = Buffer.alloc(32, 0xab).toString('base64');
    const a = await PqcBridge.deriveSrtpKeys(ss1);
    const b = await PqcBridge.deriveSrtpKeys(ss2);
    expect(a.masterKey).not.toBe(b.masterKey);
    expect(a.masterSalt).not.toBe(b.masterSalt);
  });

  test('masterKey and masterSalt domain-separate (different info strings)', async () => {
    // The stub uses 'zipminator-srtp-master-key' and 'zipminator-srtp-master-salt'
    // as HKDF info strings. Even after truncating to 14 bytes, the salt must
    // not be a prefix of the key (which would mean info-string collision).
    const ss = Buffer.alloc(32, 0x42).toString('base64');
    const { masterKey, masterSalt } = await PqcBridge.deriveSrtpKeys(ss);
    const keyBytes = Buffer.from(masterKey, 'base64');
    const saltBytes = Buffer.from(masterSalt, 'base64');
    expect(keyBytes.subarray(0, SRTP_MASTER_SALT_BYTES).equals(saltBytes)).toBe(false);
  });
});

// ─── setPqcNativeModule swaps the active implementation ──────────────────

describe('setPqcNativeModule + Proxy delegation', () => {
  // Restore default stub after each test via module re-import.
  afterEach(() => {
    jest.resetModules();
  });

  test('swapped module receives bridge calls', async () => {
    const fakeKeypair = jest.fn().mockResolvedValue({
      publicKey: 'FAKE_PK',
      secretKey: 'FAKE_SK',
    });
    const fake: PqcNativeModule = {
      kyberKeypair: fakeKeypair,
      kyberEncapsulate: jest.fn(),
      kyberDecapsulate: jest.fn(),
      deriveSrtpKeys: jest.fn(),
    };

    setPqcNativeModule(fake);
    const result = await PqcBridge.kyberKeypair();

    expect(fakeKeypair).toHaveBeenCalledTimes(1);
    expect(result.publicKey).toBe('FAKE_PK');
    expect(result.secretKey).toBe('FAKE_SK');
  });

  test('Proxy resolves _module lazily — swap mid-run takes effect', async () => {
    const first = jest.fn().mockResolvedValue('FIRST');
    const second = jest.fn().mockResolvedValue('SECOND');

    setPqcNativeModule({
      kyberKeypair: jest.fn(),
      kyberEncapsulate: jest.fn(),
      kyberDecapsulate: first,
      deriveSrtpKeys: jest.fn(),
    });
    const a = await PqcBridge.kyberDecapsulate('x', 'y');

    setPqcNativeModule({
      kyberKeypair: jest.fn(),
      kyberEncapsulate: jest.fn(),
      kyberDecapsulate: second,
      deriveSrtpKeys: jest.fn(),
    });
    const b = await PqcBridge.kyberDecapsulate('x', 'y');

    expect(a).toBe('FIRST');
    expect(b).toBe('SECOND');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

// ─── Method binding (Proxy `.bind(_module)`) preserves `this` ───────────

describe('PqcBridge methods are bound to their module', () => {
  test('detached method reference still resolves correctly', async () => {
    // Some callers do `const fn = PqcBridge.kyberKeypair; fn();` and expect
    // it to work without `this`. The Proxy uses `.bind(_module)` to ensure
    // this contract.
    const fn = PqcBridge.kyberKeypair;
    const result = await fn();
    expect(result).toHaveProperty('publicKey');
    expect(result).toHaveProperty('secretKey');
  });
});

// ─── TODO (user A/B): KAT vectors vs structural tests ───────────────────
//
// The tests above exercise structure (lengths, determinism, swap). They do
// not pin specific output bytes for given inputs. Two options:
//
//   Shape A — STRUCTURAL ONLY: keep this skeleton as-is. Cheap to maintain;
//             survives intentional HKDF info-string changes.
//   Shape B — KAT-PINNED: add 2-3 known-answer vectors (sharedSecret →
//             expected masterKey base64). Catches accidental info-string
//             changes that break wire compatibility with deployed clients.
//             Cost: regenerating the vectors when info strings change
//             intentionally.
//
// Mo: pick A or B. B is stronger for crypto wire compatibility; A is
// lighter-weight for a stub.
