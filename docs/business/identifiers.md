# QDaria AS — Business Identifiers (single source of truth)

> Use these in Apple Developer enrolment, Google Play Console signup, banking, procurement forms, and tax filings.

## Norwegian registry

| Identifier | Value | Issuer | Notes |
|---|---|---|---|
| Organisasjonsnummer | _to fill_ | Brønnøysund Register Centre | 9-digit Norwegian company number; check at https://www.brreg.no |
| MVA / VAT | _to fill_ | Skatteetaten | Add `MVA` suffix to org number once VAT-registered |

## International identifiers

| Identifier | Value | Issuer | Notes |
|---|---|---|---|
| **D-U-N-S Number** | **347103005** | Dun & Bradstreet (Bisnode Norway) | Required by Apple Developer Program, used by federal procurement systems, supplier diversity programs, and most Fortune-500 vendor onboarding |
| LEI (Legal Entity Identifier) | _to fill_ | GLEIF | Only needed if you transact in regulated financial markets |

## Apple ecosystem identifiers

| Identifier | Value | Source |
|---|---|---|
| Apple ID (Developer) | _to fill at enrolment_ | Apple Developer Program |
| Team ID | _to fill at enrolment_ | https://developer.apple.com/account |
| App Store Connect Team ID | _to fill at enrolment_ | App Store Connect |
| Bundle ID | `com.qdaria.zipminator` | Reserved in `app/android/app/build.gradle.kts` and Flutter pubspec |

## Google ecosystem identifiers

| Identifier | Value | Source |
|---|---|---|
| Play Console developer account | _to fill at signup_ | https://play.google.com/console |
| Play Console publisher ID | _to fill at signup_ | shows under My account after signup |
| Package name | `com.qdaria.zipminator` | matches Apple bundle ID |
| Google Cloud project ID | _to fill_ | needed for OAuth client + future Play Billing |

## OAuth client IDs (per environment)

| Provider | Dev (`localhost:3099`) | Production (`zipminator.zip`) |
|---|---|---|
| Google OAuth client ID | _to fill_ | _to fill_ |
| GitHub OAuth client ID | _to fill_ | _to fill_ |
| LinkedIn OIDC client ID | _to fill_ | _to fill_ |

## Stripe (when billing ships)

| Identifier | Value |
|---|---|
| Stripe account ID | _to fill_ |
| Public key (test) | _to fill_ |
| Public key (live) | _to fill_ |

## Microsoft Partner Center (when Windows MSIX ships)

| Identifier | Value |
|---|---|
| Seller ID | _to fill_ |
| Publisher display name | `QDaria AS` |

---

**File status**: live document, update inline as enrolments complete. The D-U-N-S above (347103005) is verified 2026-04-29 by Mo Houshmand.
