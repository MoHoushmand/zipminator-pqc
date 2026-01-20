//! Kyber-768 constants and parameters
//! Based on NIST FIPS 203 (ML-KEM) specification

/// Kyber parameter n (polynomial degree)
pub const KYBER_N: usize = 256;

/// Kyber-768 parameter k (matrix dimension)
pub const KYBER_K: usize = 3;

/// Modulus q = 3329
pub const KYBER_Q: i16 = 3329;

/// Eta for Kyber-768 (noise distribution parameter)
pub const KYBER_ETA1: usize = 2;
pub const KYBER_ETA2: usize = 2;

/// Sizes in bytes
pub const KYBER_SYMBYTES: usize = 32; // SHA3-256 output
pub const KYBER_POLYBYTES: usize = 384;
pub const KYBER_POLYVECBYTES: usize = KYBER_K * KYBER_POLYBYTES;

pub const KYBER768_PUBLICKEYBYTES: usize = KYBER_POLYVECBYTES + KYBER_SYMBYTES;
pub const KYBER768_SECRETKEYBYTES: usize = KYBER_POLYVECBYTES + KYBER768_PUBLICKEYBYTES + 2 * KYBER_SYMBYTES;
pub const KYBER768_CIPHERTEXTBYTES: usize = KYBER_POLYVECBYTES + 128;
pub const KYBER768_SHAREDSECRETBYTES: usize = KYBER_SYMBYTES;

/// NTT constants
pub const ZETAS: [i16; 128] = [
    -1044, -758, -359, -1517, 1493, 1422, 287, 202,
    -171, 622, 1577, 182, 962, -1202, -1474, 1468,
    573, -1325, 264, 383, -829, 1458, -1602, -130,
    -681, 1017, 732, 608, -1542, 411, -205, -1571,
    1223, 652, -552, 1015, -1293, 1491, -282, -1544,
    516, -8, -320, -666, -1618, -1162, 126, 1469,
    -853, -90, -271, 830, 107, -1421, -247, -951,
    -398, 961, -1508, -725, 448, -1065, 677, -1275,
    -1103, 430, 555, 843, -1251, 871, 1550, 105,
    422, 587, 177, -235, -291, -460, 1574, 1653,
    -246, 778, 1159, -147, -777, 1483, -602, 1119,
    -1590, 644, -872, 349, 418, 329, -156, -75,
    817, 1097, 603, 610, 1322, -1285, -1465, 384,
    -1215, -136, 1218, -1335, -874, 220, -1187, -1659,
    -1185, -1530, -1278, 794, -1510, -854, -870, 478,
    -108, -308, 996, 991, 958, -1460, 1522, 1628
];

/// ZETAS_INV: Inverse NTT twiddle factors in Montgomery form
/// Must use positive values in [0, q-1] for correct Montgomery arithmetic
pub const ZETAS_INV: [i16; 128] = [
    1701, 1807, 1460, 2371, 2338, 2333,  308,  108,
    2851,  870,  854, 1510, 2535, 1278, 1530, 1185,
    1659, 1187, 3109,  874, 1335, 2111,  136, 1215,
    2945, 1465, 1285, 2007, 2719, 2726, 2232, 2512,
      75,  156, 3000, 2911, 2980,  872, 2685, 1590,
    2210,  602, 1846,  777,  147, 2170, 2551,  246,
    1676, 1755,  460,  291,  235, 3152, 2742, 2907,
    3224, 1779, 2458, 1251, 2486, 2774, 2899, 1103,
    1275, 2652, 1065, 2881,  725, 1508, 2368,  398,
     951,  247, 1421, 3222, 2499,  271,   90,  853,
    1860, 3203, 1162, 1618,  666,  320,    8, 2813,
    1544,  282, 1838, 1293, 2314,  552, 2677, 2106,
    1571,  205, 2918, 1542, 2721, 2597, 2312,  681,
     130, 1602, 1871,  829, 2946, 3065, 1325, 2756,
    1861, 1474, 1202, 2367, 3147, 1752, 2707,  171,
    3127, 3042, 1907, 1836, 1517,  359,  758, 1044
];

/// Montgomery reduction constant
pub const QINV: i32 = -3327; // -q^(-1) mod 2^16

/// Multiplication by 2^(-32) mod q
pub const MONT: i16 = -1044; // 2^16 mod q
