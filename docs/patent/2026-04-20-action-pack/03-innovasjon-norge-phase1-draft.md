# Innovasjon Norge Oppstartstilskudd 1 (markedsavklaring), utkast

**Søknadsportal:** https://www.innovasjonnorge.no/tjeneste/oppstartstilskudd-1
**Maksbeløp 2026 (uten ansatte):** 100 000 NOK
**Maksbeløp 2026 (med ansatte):** 200 000 NOK
**Krav:** AS registrert, mindre enn 5 år gammelt, innovativt produkt eller tjeneste med markedspotensiale

---

## Forhåndsarbeid før søknad

1. Registrer QDaria AS i Brønnøysundregistrene via Altinn (BankID). Aksjekapital minimum 30 000 NOK. Uten AS blir søknaden avvist.
2. Opprett bedriftskonto (DNB eller Nordea tilbyr rask åpning for AS med BankID).
3. Registrer bedriften hos Innovasjon Norge med organisasjonsnummer.
4. Les retningslinjene nøye på søknadsportalen, Innovasjon Norge har oppdaterte krav i 2026 etter overføring fra fylkeskommunene til Nærings- og fiskeridepartementet.

## Søknadsskjema, utkast-innhold

### 1. Bedriftsnavn og organisasjonsnummer
QDaria AS (org.nr. følger etter Altinn-registrering)

### 2. Kontaktperson
Daniel Mo Houshmand, Grunnlegger og CEO
mo@qdaria.com
+47 (telefon)

### 3. Prosjektets navn
Zipminator, verdens første Post-Kvante-Kryptografi (PQC) super-app

### 4. Kort beskrivelse av forretningsideen (inntil 500 tegn)
Zipminator er en kryptografisk infrastrukturplattform som beskytter enheter, lagrede legitimasjoner og data i hvile mot både klassiske og kvante-angripere. Plattformen implementerer NIST FIPS 203 (ML-KEM-768), FIPS 204 (ML-DSA) og FIPS 205 (SLH-DSA), bygget rundt ni søyler: kvante-hvelv, PQC messenger, kvante-VoIP/video, Q-VPN (PQ-WireGuard), 10-nivå anonymiseringssuite, Q-AI PQC AI-assistent, kvante-sikker e-post, ZipBrowser, Q-Mesh kvante-sikret WiFi-sensing.

### 5. Problem og markedsmulighet
DORA trådte i kraft 1. juli 2025 i Norge (artikkel 6.4 krever periodisk kryptografisk oppdatering basert på kryptanalytiske utviklinger, dvs. kvante-klargjøring) og stiller krav til alle finansielle foretak om dokumentert kvante-klargjøring. Gidney (arXiv:2505.15917, mai 2025) viste at RSA-2048 kan brytes med under 1 million støyende qubits. Google offentliggjorde 31. mars 2026 at deres kvante-maskin nærmer seg Bitcoin-relevant trusselnivå. EU, USA og NATO krever migrering innen 2030 (NIST deprecation) og forbyr bruk etter 2035. Europeisk PQC-markedet anslås å nå 12 mrd USD innen 2030 (kilde: Fortune Business Insights, 2025).

### 6. Teknologi og immateriell rett
Tre norske patentsøknader inngitt hos Patentstyret:
- 20260384 (irreversibel kvante-anonymisering, 2026-03-24)
- Søknad av 2026-04-04 (CSI Entropy PUEK)
- Søknad av 2026-04-05 (CHE-ARE provenance)

PCT-inngivelse planlagt innen 2027-03-24. Rust-kjerne implementerer NIST FIPS 203/204/205, verifisert mot NIST KAT-testvektorer. Koden er delvis åpen (benchmarks, KAT-tester) og delvis proprietær (integrasjonslag, ni-søylet arkitektur).

### 7. Markedsavklaring, hva skal tilskuddet brukes til?
**Mål:** Validere betalingsvillighet hos 20 norske finansforetak underlagt DORA, og 10 europeiske forsvars-adjacent SMB. Levere Product-Market Fit-rapport som grunnlag for Oppstartstilskudd 2-søknad og EIC Accelerator.

**Aktiviteter (12 uker):**
- Uke 1-2: Kartlegging av DORA-kontaktpunkter i 30 norske banker, forsikringsselskaper og betalingsforetak
- Uke 3-6: 25 intervjuer med CISO / DPO / kvante-klargjøringsansvarlige om kjøpskriterier, nåværende migreringsplaner, budsjettrammer
- Uke 7-8: Prisvaliderings-workshops med 10 utvalgte kandidater
- Uke 9-10: Letter of Intent-innsamling (mål: 5 LoIs, 2 pilotavtaler)
- Uke 11-12: Rapport, oppdatert forretningsmodell, go-to-market strategi

**Budsjett 100 000 NOK (uten ansatte-variant):**
- Reise og intervjuer (Oslo-Bergen-Trondheim), 25 000 NOK
- Ekstern markedsundersøkelse/CRM-verktøy (Hubspot/Salesloft abonnement), 15 000 NOK
- Regnskap og AS-oppstart (advokat), 20 000 NOK
- IP-rådgivning innledende (fullmektig 30 min + oppfølging), 10 000 NOK
- Webprofil, pitch-materiale, designer, 15 000 NOK
- Kommersiell juridisk gjennomgang av pilotavtaler, 15 000 NOK

### 8. Grunnlegger-team
Daniel Mo Houshmand (solo-grunnlegger)
- MSc (teoretisk fysikk, hvis riktig, eller annen relevant bakgrunn)
- 3 patent-søknader som hovedoppfinner
- 3 forskningsartikler publisert eller under fagfellevurdering
- Tidligere rolle: (fyll inn fra CV)

Plan for oppbygging: 2 CTOs og 1 GTM Lead rekrutteres etter vellykket Oppstartstilskudd 2 og EIC Accelerator.

### 9. Risiko og mitigering
- **Teknisk risiko:** Lav. NIST-algoritmer er standardiserte, Rust-kjernen er testdekket mot KAT.
- **Konkurrentrisiko:** IBM, PQShield, SandboxAQ jobber med PQC. QDarias diffrensiator er (a) ni-søylet super-app (ikke bare bibliotek), (b) kvante-QRNG integrasjon, (c) tre patentsøknader på metoder konkurrentene ikke dekker.
- **Regulatorisk risiko:** FIPS-sertifisering koster 80 000 til 150 000 USD per modul. Vi bruker formuleringen "implementerer NIST FIPS 203/204/205" og "verifisert mot NIST KAT-testvektorer", ikke "FIPS-sertifisert", frem til CMVP-sertifikat foreligger.

### 10. Videre planer etter markedsavklaring
- Q4 2026: Søke Oppstartstilskudd 2 (inntil 1 M NOK)
- Q1 2027: Søke EIC Accelerator Step 1 (EUR 2,5 M tilskudd + inntil EUR 10 M egenkapital)
- Q2 2027: PCT-inngivelse for alle tre prioritetspatentene
- Q3-Q4 2027: Nasjonale faser i EP, US, JP, KR

---

## Klar-til-send status

**IKKE send-klar uten videre arbeid.** Krever følgende før innsending:

1. QDaria AS må være registrert (BankID + Altinn)
2. Innovasjon Norge-portal-registrering med org.nr.
3. Fyll inn telefonnummer (punkt 2)
4. Verifiser CV-punkter under "Grunnlegger-team" (punkt 8)
5. Oppdater antall forskningsartikler basert på faktisk status (Zenodo + ePrint)

Etter at AS er registrert: kopier seksjonene over direkte inn i Innovasjon Norge-skjemaet (feltene er navngitt likt, 2026-skjemastruktur).
