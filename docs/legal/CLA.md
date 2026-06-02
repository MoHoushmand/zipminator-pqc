# Contributor License Agreement — Zipminator

**DRAFT — Counsel review required before enforcement.**  
Version: 0.1-DRAFT | Date: 2026-06-03 | QDaria AS, Norway

This Contributor License Agreement ("CLA") applies to contributions made to the Zipminator project repositories under the QDaria organisation on GitHub (`github.com/QDaria/`).

The project's root license is **Apache License 2.0**. This CLA supplements that license by ensuring QDaria AS has the rights needed to maintain, relicense for Enterprise Tier products, and sublicense contributions under the open-core model described in the Enterprise Addendum to the `LICENSE` file.

---

## 1. Definitions

**"Contribution"** means any code, documentation, test, configuration, or other material submitted via pull request, issue, patch, or direct push to a Zipminator repository.

**"Contributor"** means the individual or legal entity submitting a Contribution.

**"Project"** means the Zipminator repositories operated by QDaria AS.

---

## 2. Copyright License Grant

Subject to the terms below, each Contributor grants to QDaria AS a perpetual, worldwide, non-exclusive, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute their Contributions and such derivative works.

This grant covers use in both the Open-Source Tier (Apache-2.0) and the Enterprise Tier (commercial). The Contributor retains copyright ownership; this is a license, not an assignment.

---

## 3. Patent License Grant

Each Contributor grants to QDaria AS and to recipients of software distributed by QDaria AS a perpetual, worldwide, non-exclusive, royalty-free, irrevocable (subject to Section 3.1) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer their Contributions, where such license applies only to those patent claims licensable by the Contributor that are necessarily infringed by their Contributions alone or by combination of their Contributions with the Project.

**3.1 Patent Retaliation.** If the Contributor initiates patent litigation against QDaria AS or any Project recipient alleging that any Contribution constitutes direct or contributory patent infringement, the patent license granted under this Section 3 terminates as of the date litigation is filed.

---

## 4. Representations and Warranties

By submitting a Contribution, the Contributor represents that:

(a) they are legally entitled to grant the rights under Sections 2 and 3;

(b) if employed, their employer has authorised them to contribute on behalf of the employer, or the Contribution is a personal contribution not in the scope of employment;

(c) the Contribution does not include material that is subject to third-party intellectual property rights without appropriate permission;

(d) the Contribution does not contain private cryptographic keys, passwords, personal data, or other sensitive material that should not be public;

(e) the Contribution complies with export control regulations applicable to cryptographic software (Norwegian eksportkontrolloven, EU dual-use regulations, US EAR).

---

## 5. Cryptographic Contributions

Contributions that modify or add cryptographic primitives (files under `crates/`, `browser/src-tauri/src/vpn/`, `browser/src-tauri/src/proxy/`) are subject to additional review:

- They must implement algorithms from the NIST PQC standards (FIPS 203, 204, 205) or well-established classical standards.
- They must not introduce timing side-channels or use non-constant-time operations for secret-dependent branching.
- They must include test vectors (NIST KAT where applicable).
- They will be reviewed at `--effort max` reasoning tier per `.claude/rules/tdd-ralph.md`.

---

## 6. Open-Core Model

Contributors acknowledge that the Project uses an open-core model:

- **Open-Source Tier** components (Apache-2.0) will remain open-source.
- **Enterprise Tier** features may be built on top of or alongside open-source contributions and offered commercially under separate terms.
- The CLA grant (Sections 2–3) is necessary to permit this model.

Contributors who wish to restrict their Contribution to Open-Source Tier use only must state this explicitly in the pull request. QDaria may decline such restricted contributions.

---

## 7. No Obligation to Include

QDaria AS has no obligation to accept, review, include, or use any Contribution. Acceptance of a Contribution does not waive any of QDaria's rights.

---

## 8. Governing Law

This CLA is governed by Norwegian law. Disputes are subject to Oslo District Court jurisdiction.

---

## 9. How to Sign

**Individuals:** Add the following declaration to your pull request description:

> I have read and agree to the Zipminator CLA at `docs/legal/CLA.md` (version 0.1-DRAFT).  
> Legal name: [Your Name]  
> GitHub username: [@handle]  
> Date: [YYYY-MM-DD]

**Organisations:** Contact `legal@qdaria.com` to execute a Corporate CLA before submitting contributions on behalf of your organisation.

---

## 10. Contact

QDaria AS  
Email: legal@qdaria.com  
Web: https://www.qdaria.com

---

*This document is a DRAFT. It has not been reviewed by qualified legal counsel. Do not enforce or publish this CLA until counsel review is complete.*
