# Terms of Service — Zipminator

**DRAFT — Counsel review required before publication or enforcement.**  
Version: 0.1-DRAFT | Date: 2026-06-03 | QDaria AS, Norway

These Terms govern access to and use of the Zipminator platform, including web services at `zipminator.zip`, the mobile application ("App"), the API, and related cloud infrastructure operated by QDaria AS ("QDaria", "we", "us").

---

## 1. Acceptance

By creating an account, installing the App, or calling the API, you agree to these Terms and our Privacy Policy. If you act on behalf of a legal entity, you represent that you have authority to bind that entity.

---

## 2. Service Description

Zipminator provides post-quantum cryptographic services, including:

- Encrypted file vault and sharing (ML-KEM-768 / FIPS 203)
- End-to-end encrypted messaging and VoIP
- Q-VPN with PQ-WireGuard handshake
- Anonymous identity layer (Certified Anonymization, Patent Application 1)
- QRNG-derived entropy for key generation
- Q-AI assistant with privacy-preserving inference
- Encrypted email routing
- ZipBrowser with PQC HTTPS proxy
- Q-Mesh key distribution for IoT/hardware

---

## 3. Accounts

**3.1 Registration.** You must provide accurate registration information. Accounts may not be shared or transferred without written consent from QDaria.

**3.2 Security.** You are responsible for maintaining the confidentiality of your credentials and hardware keys. QDaria cannot recover end-to-end encrypted data for which you have lost keys.

**3.3 Age.** The Service is not directed at persons under 16 years of age (or the applicable minimum age in your jurisdiction).

---

## 4. Acceptable Use

You must not use the Service to:

(a) violate applicable laws or regulations, including export control laws (ITAR, EAR, Norwegian eksportkontrolloven);

(b) transmit malware, ransomware, or other malicious code;

(c) conduct denial-of-service attacks, credential stuffing, or other automated abuse;

(d) bypass the Service's privacy or anonymization mechanisms to de-anonymize other users;

(e) use the Service for unlawful mass surveillance or interception;

(f) circumvent API rate limits, API key requirements, or access controls.

Violation of these restrictions may result in immediate account suspension and, where applicable, notification of competent authorities.

---

## 5. Intellectual Property

All Software, documentation, branding, and platform infrastructure are the property of QDaria AS or its licensors. The Open-Source Tier is licensed under Apache-2.0 (see `LICENSE`). Platform services, Enterprise Tier features, and trademarks are not licensed under Apache-2.0.

---

## 6. API Usage

API access above the free tier (Level 1–3) requires an active ZIPMINATOR_API_KEY under a paid plan. Rate limits are documented at `https://docs.zipminator.zip/api/rate-limits`. QDaria reserves the right to throttle or suspend API access that degrades service quality for other users.

---

## 7. Fees and Billing

Enterprise and paid plans are governed by the order form or Commercial Agreement. Fees are exclusive of applicable taxes (Norwegian MVA, or equivalent VAT in the user's jurisdiction). Overdue invoices accrue interest at the statutory Norwegian rate.

---

## 8. Privacy and Data

QDaria processes personal data as described in the Privacy Policy. For services involving server-side components, QDaria acts as a data processor under GDPR Art. 28. End-to-end encrypted data is not accessible to QDaria.

**Data residency:** Server infrastructure is hosted in the EU/EEA unless otherwise agreed in a Commercial Agreement.

---

## 9. Security

QDaria implements technical and organisational measures consistent with DORA (for EU/Norwegian regulated entities) and GDPR Art. 32. Security incidents will be notified as required by GDPR Art. 33/34. Users are encouraged to report vulnerabilities via `security@qdaria.com` per `SECURITY.md`.

---

## 10. Service Levels and Availability

QDaria targets 99.5% uptime for production services. Maintenance windows will be announced with at least 24 hours' notice where feasible. Zipminator signalling infrastructure (`wss://zipminator-signaling.fly.dev`) availability is provided on a best-effort basis unless covered by a Service Level Agreement.

---

## 11. Disclaimers

**THE SERVICE IS PROVIDED "AS IS". QDARIA MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE SERVICE'S SUITABILITY FOR ANY PARTICULAR PURPOSE, FREEDOM FROM VULNERABILITIES, OR COMPLIANCE WITH YOUR JURISDICTION'S REGULATORY REQUIREMENTS.**

**The Software implements NIST FIPS 203, 204, and 205 algorithms. It is not FIPS certified (CMVP) unless explicitly stated in a separate compliance attachment.**

---

## 12. Limitation of Liability

To the extent permitted by Norwegian law, QDaria's aggregate liability for any claim arising from the Service is limited to the fees paid by the Licensee in the 12 months preceding the claim. QDaria is not liable for indirect, special, or consequential damages.

---

## 13. Termination

Either party may terminate an account with 30 days' written notice. QDaria may suspend accounts immediately for material breach of Section 4. Upon termination, you may export your data for 30 days; after that, data is deleted per the retention policy.

---

## 14. Governing Law

These Terms are governed by Norwegian law. Disputes are subject to the jurisdiction of Oslo District Court, subject to mandatory consumer protection provisions.

---

## 15. Changes to These Terms

QDaria may update these Terms. Material changes will be notified 30 days before taking effect via the email address on file. Continued use after the notice period constitutes acceptance.

---

## Contact

QDaria AS  
Email: legal@qdaria.com  
Web: https://www.qdaria.com

---

*This document is a DRAFT. It has not been reviewed by qualified legal counsel and does not constitute legal advice.*
