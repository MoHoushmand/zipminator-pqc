# End-User License Agreement — Zipminator

**DRAFT — Counsel review required before publication or enforcement.**  
Version: 0.1-DRAFT | Date: 2026-06-03 | QDaria AS, Norway

---

## 1. Definitions

**"Software"** means the Zipminator application, including the Flutter super-app, Rust cryptographic core, web dashboard, browser extension, API service, and associated documentation, as distributed by QDaria AS.

**"Open-Source Tier"** means the components of the Software published under the Apache License 2.0 (SPDX: Apache-2.0), as identified in the root `LICENSE` file and SBOM under `docs/compliance/sbom/`.

**"Enterprise Tier"** means the commercial super-app features — including Q-VPN server provisioning, Q-Mesh key management, enterprise policy enforcement, and priority support — governed by a separate Enterprise Addendum or Commercial Agreement with QDaria AS.

**"Licensee"** or **"You"** means the individual or legal entity accepting these terms.

**"Post-Quantum Cryptography" (PQC)** means cryptographic algorithms conforming to NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA).

---

## 2. License Grant

### 2.1 Open-Source Tier
Subject to the Apache License 2.0 terms, QDaria AS grants You a perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute the Open-Source Tier components. The full Apache 2.0 text is in the root `LICENSE` file.

### 2.2 Enterprise Tier
Use of Enterprise Tier features requires execution of a separate written Commercial Agreement with QDaria AS. Without such an agreement, Enterprise Tier features may not be used in a production environment.

### 2.3 No Implied Rights
No license is granted by implication, estoppel, or otherwise. All rights not expressly granted are reserved by QDaria AS.

---

## 3. Restrictions

You may not:

(a) remove or alter any proprietary notices, copyright notices, or SPDX license headers;

(b) use the Software to facilitate criminal activity, including unlawful surveillance, extortion, or evasion of lawful court orders;

(c) reverse-engineer the entropy pool architecture, hardware security module integrations, or QRNG interfaces for purposes other than interoperability research permitted by applicable law;

(d) claim that the Software is "FIPS certified" — the Software implements NIST FIPS 203, 204, and 205 algorithms but does not hold a CMVP certificate unless explicitly stated in a separate compliance attachment;

(e) sub-license Enterprise Tier features without a signed reseller agreement with QDaria AS.

---

## 4. Intellectual Property

The QDaria name, logo, and "Zipminator" mark are trademarks of QDaria AS. The Software incorporates technology covered by patent applications filed with the Norwegian Industrial Property Office (Patentstyret) and the USPTO, including:

- Patent application 1: Quantum-Certified Anonymization
- Patent application 2: Unilateral CSI Entropy Public-Key Scheme
- Patent application 3: Certified Heterogeneous Entropy with Provenance

This EULA does not grant any patent license beyond the scope of the Apache 2.0 grant clause (Section 3 of Apache-2.0).

---

## 5. Privacy and Data Processing

The Software processes cryptographic keys, personal communication data, and network metadata. QDaria AS acts as a data processor under GDPR (Regulation EU 2016/679) where it operates server-side components. Refer to the Privacy Policy at `https://www.zipminator.zip/privacy` for full details. Where Norwegian law applies, processing is subject to the Norwegian Personal Data Act (Personopplysningsloven).

---

## 6. Security Disclosure

Responsible disclosure: security vulnerabilities must be reported to `security@qdaria.com` per the process defined in `SECURITY.md`. Public disclosure prior to a reasonable remediation window (90 days) may constitute a breach of this agreement.

---

## 7. Disclaimer of Warranties

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. QDARIA AS DOES NOT WARRANT THAT THE SOFTWARE IS FREE OF VULNERABILITIES OR THAT IT WILL MEET ALL REGULATORY REQUIREMENTS IN YOUR JURISDICTION.**

---

## 8. Limitation of Liability

**TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL QDARIA AS OR ITS CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF DATA, LOSS OF PROFITS, OR BUSINESS INTERRUPTION, ARISING FROM USE OF THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.**

---

## 9. DORA Compliance (Norwegian Financial Entities)

For use by entities regulated under the EU Digital Operational Resilience Act (DORA), as implemented in Norwegian law effective 1 July 2025: the Software's cryptographic key management features are designed to support auditability under DORA Art. 6.1, 6.4, and 7. The Licensee remains solely responsible for regulatory compliance in its own operations.

---

## 10. Governing Law and Jurisdiction

This EULA is governed by Norwegian law. Disputes shall be submitted to the Oslo District Court (Oslo tingrett) as first instance, unless mandatory consumer protection laws require otherwise.

---

## 11. Contact

QDaria AS  
c/o Mo Houshmand  
Norway  
Email: legal@qdaria.com  
Web: https://www.qdaria.com

---

*This document is a DRAFT. It has not been reviewed by qualified legal counsel and does not constitute legal advice. Do not publish or rely on this document until counsel review is complete.*
