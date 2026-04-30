# Apple Developer Program — Account Holder Transfer Letter

> Template for transferring the Account Holder role on the QDaria AS Apple Developer account from `houshmand.81@gmail.com` (personal Apple ID) to `mo@qdaria.com` (corporate Apple ID).
>
> **Do not file yet.** This transfer should happen after v1.0.0 ships and TestFlight builds are stable. Apple's review takes 1-2 weeks; do not initiate during a release window.

## When to send

After all of:

- v1.0.0 production release on App Store + TestFlight stable
- `mo@qdaria.com` has been a verified Apple ID with 2FA for at least 30 days
- `mo@qdaria.com` has been an Admin team member on the developer account for at least 30 days
- No active App Store review submissions in flight

## How to initiate

1. Sign into https://developer.apple.com/contact/topic/select as `houshmand.81@gmail.com` (current Account Holder).
2. Choose **Membership and Account** → **Transfer the Account Holder role**.
3. Apple replies within 3-5 business days with their formal transfer form (a PDF or DocuSign link).
4. Complete Apple's form. Attach the letter below on QDaria AS letterhead, signed.
5. Apple verifies, transfers, and notifies both Apple IDs by email. Existing apps, certs, provisioning profiles, and team memberships are preserved intact.

## Required attachments

- QDaria AS firmaattest (Brønnøysund extract; download fresh from https://www.brreg.no/enhet/925030244)
- Government-issued photo ID for Mo Houshmand
- Screenshot showing `mo@qdaria.com` as a verified Apple ID with 2FA enabled
- Apple's signed Account Holder Transfer Authorisation form

---

## Letter template (paste onto QDaria AS letterhead, sign, scan)

```
QDaria AS
Colletts gate 60F
0456 Oslo, Norway
Org. nr. 925030244

[Date]

Apple Developer Program Support
Apple Distribution International Ltd.
Hollyhill Industrial Estate
Hollyhill, Cork, Ireland

Re: Apple Developer Program — Account Holder Transfer Request
    Account: QDaria AS
    D-U-N-S Number: 347103005
    Apple Team ID: 5EK49H64WB

To Apple Developer Program Support,

I, Mo Houshmand, in my capacity as founder and authorised signatory of
QDaria AS (Norwegian organisation number 925030244), hereby request
the transfer of the Account Holder role on the above Apple Developer
Program account to the following corporate Apple ID:

    Current Account Holder Apple ID: houshmand.81@gmail.com
    New Account Holder Apple ID:     mo@qdaria.com

This change reflects QDaria AS's standard practice of operating
business systems under domain-bound corporate credentials rather than
personal email addresses. The transfer does not change ownership of the
account: the legal entity (QDaria AS) remains the same, the D-U-N-S
remains 347103005, and all existing apps, certificates, provisioning
profiles, and team memberships are to be preserved intact.

I confirm that:

1. The new Apple ID (mo@qdaria.com) has been created and is active.
2. The new Apple ID has two-factor authentication enabled.
3. I retain access to both Apple IDs during the transfer.
4. I am authorised under QDaria AS's articles of association to bind
   the company in this matter.

I have completed the transfer form provided by Apple Developer Program
Support and attached supporting documentation:

    - QDaria AS firmaattest (Brønnøysund Register Centre extract)
    - Government-issued photo ID for Mo Houshmand
    - Confirmation that mo@qdaria.com is a verified Apple ID with 2FA
    - Signed Account Holder Transfer Authorisation form

Please contact me at mo@qdaria.com or by phone at [your number] if any
additional information is required.

Sincerely,


_________________________
Mo Houshmand
Founder, QDaria AS
mo@qdaria.com
```

---

## Pre-transfer checklist (do these BEFORE filing)

- [ ] Create `mo@qdaria.com` Apple ID at https://appleid.apple.com if not done
- [ ] Enable 2FA on `mo@qdaria.com` Apple ID
- [ ] Verify `mo@qdaria.com` mailbox can receive Apple notification emails
- [ ] Add `mo@qdaria.com` to QDaria AS developer account as Admin
- [ ] Confirm Mo Houshmand has been Admin for at least 30 days
- [ ] Pull fresh firmaattest from Brønnøysund (max 3 months old per Apple)
- [ ] Renew Apple Developer Program membership if it expires within 60 days (avoid mid-renewal transfer)

## What does NOT change

- Team ID `5EK49H64WB`
- D-U-N-S `347103005`
- Apple Team Name `QDaria AS`
- App bundle IDs (e.g. `com.qdaria.zipminator`)
- Existing certificates, provisioning profiles, push certs
- App Store Connect API keys
- Existing TestFlight builds and beta tester groups
- Existing App Store listings, screenshots, ratings, reviews
- Other team members and their roles

## What DOES change

- The "Account Holder" badge moves from `houshmand.81@gmail.com` to `mo@qdaria.com`
- Apple billing receipts go to `mo@qdaria.com`
- Apple Developer Forum posts under the Account Holder identity now show `mo@qdaria.com`
- Push and security notifications go to `mo@qdaria.com`
- The "Master" key rotation responsibility (annual cert renewals, etc.) moves to `mo@qdaria.com`

`houshmand.81@gmail.com` remains an Admin team member after transfer (or can be removed entirely; that is a separate action).

---

**Last updated**: 2026-04-30 by Mo Houshmand. Ready to file post-v1.0.0 GA.
