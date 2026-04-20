# SkatteFUNN-søknad, utkast

**Søknadsportal:** https://www.skattefunn.no/
**Sats 2026:** 19% fradrag for FoU-kostnader, maks 25 M NOK FoU-grunnlag per år
**Kontant utbetaling:** Ja, for selskap i underskudd (før skatt). Dette er hovedpoenget for et pre-revenue AS.
**Frist:** Løpende. Søknaden bør inne INNEN kalenderåret kostnaden påløper for å få kredit samme år.

---

## Forutsetninger

1. QDaria AS må være registrert med org.nr.
2. Prosjektbeskrivelse må argumentere for "systematisk og målrettet aktivitet" som gir ny kunnskap eller nye ferdigheter. Rent implementasjonsarbeid uten nyhetsverdi godkjennes ikke.
3. Prosjektet må forhåndsgodkjennes av Forskningsrådet før utgiftene kan inngå i fradragsgrunnlaget.

## Søknadsskjema, utkast-innhold

### 1. Prosjektnavn
Zipminator QP-Core, kvante-målt informasjonsteoretisk irreversibilitet i post-kvante kryptografisk infrastruktur

### 2. Forskningsmål (maks 500 ord)

Prosjektet tar for seg tre åpne problemer i post-kvante kryptografi (PQC) som ikke løses av NIST FIPS 203/204/205 alene:

**(a) Informasjonsteoretisk irreversibilitet via kvante-tilfeldighet.** Dagens anonymiseringsmetoder (tokenization, k-anonymitet, differensiell privathet) er enten reversible gitt nøkkel, eller støyer data på måter som forringer nytteverdien. Vi undersøker om målt kvante-tilfeldighet (Born-regelen, 2^-128 per 16-byte identifikator) kan gi dokumenterbar ikke-reversibilitet som overlever både klassiske og kvante-angripere. Hypotese: en protokoll som binder klientdata til QRNG-avledet identifikator via én-veis funksjon med kvante-vitnet entropi, kan bevises irreversibel uten pålitelig nøkkellagring.

**(b) Provenance under Entropy Key (PUEK).** Kryptografisk nøkkelledelse i distribuerte systemer krever bevis på at en nøkkel er generert med spesifikk entropikilde. Vi utvikler en Channel State Information (CSI)-basert nøkkelavledningsmetode med formell attestation-protokoll.

**(c) Chain Hash Entropy Attested Randomness Evidence (CHE-ARE).** Forensisk sporbarhet i hendelsesdata krever uforfalskbar tidsstemping med kvante-vitnet entropi. Vi designer en hash-lenket protokoll som binder hver loggrad til målt kvante-tilfeldighet fra anerkjent kilde (Rigetti, IBM Q, eller QBraid).

### 3. Kunnskapsbehov, hva er nytt?

Dette er ny kunnskap fordi:

- Eksisterende PQC-litteratur (Kyber, Dilithium, SPHINCS+) fokuserer på komputasjonell sikkerhet mot kvante-motstander. Informasjonsteoretisk irreversibilitet mot kvante-motstander er underutforsket, særlig for anvendt krypto.
- Ingen kommersiell løsning kombinerer disse tre metodene i en enhetlig produkt-arkitektur.
- Tre patentsøknader er inngitt hos Patentstyret (20260384 samt to påfølgende) som dekker hovedmetodene. Forskningsartikler publiseres etter PCT-inngivelse (2027).

### 4. Aktiviteter og milepæler (24 måneder)

| Milepæl | Måned | Leveranse |
|---|---|---|
| M1: QRNG-integrasjonslag | 3 | Rust-krate med Rigetti + IBM Q + QBraid + OS-fallback |
| M2: Irreversibilitetsbevis | 6 | Formell tredjeparts-gjennomgang (ekstern kryptograf) |
| M3: PUEK-prototype | 9 | CSI-basert nøkkelavledning med attestation |
| M4: CHE-ARE-protokoll | 12 | Hash-lenket loggformat med kvante-signatur |
| M5: Integrasjonstest | 15 | Alle tre metoder fungerer sammen i Zipminator-kjernen |
| M6: Benchmark-rapport | 18 | Publisert Zenodo-preprint etter PCT |
| M7: Pilot-uttesting | 21 | To finansforetak kjører i test-miljø |
| M8: Fagfellevurdert artikkel | 24 | Akseptert i IEEE Trans. Inf. Theory eller tilsv. |

### 5. Budsjett (kostnadsposter som gir SkatteFUNN-grunnlag)

| Kostnad | År 1 (NOK) | År 2 (NOK) |
|---|---|---|
| Lønn grunnlegger (hvis AS utbetaler lønn), 50% FoU-tid | 400 000 | 450 000 |
| Ekstern kryptograf-konsulent (200 t á 1 800 NOK) | 360 000 | 360 000 |
| Kvante-hardware tilgang (Rigetti + IBM Q kreditter) | 60 000 | 80 000 |
| Rust-utvikler innleid (500 t á 1 400 NOK) | 700 000 | 700 000 |
| Publikasjonskostnader (open-access gebyrer) | 20 000 | 40 000 |
| **FoU-grunnlag totalt** | **1 540 000** | **1 630 000** |
| **SkatteFUNN-fradrag 19%** | **292 600** | **309 700** |

**Sum over prosjektperioden:** 602 300 NOK (kontantrefusjon siden selskapet er i underskudd).

### 6. Søker
QDaria AS (org.nr. følger)
mo@qdaria.com
+47 (telefonnummer)

### 7. Forsknings- og utviklingssamarbeid
- **UiO**, Department of Informatics (potensielt samarbeid om irreversibilitetsbevis, ta kontakt med prof. Jon Nygaard eller tilsvarende kryptograf)
- **SINTEF Digital**, kvante-avdelingen (QRNG-validering)
- **Kristine Aarflot / Bryn Aarflot** (IP-rådgivning)

---

## Klar-til-send status

**IKKE send-klar.** Krever:

1. QDaria AS registrert med org.nr.
2. Prosjektbeskrivelse forhåndsgodkjent av Forskningsrådet (uten forhåndsgodkjenning kan ikke kostnader fradragsføres)
3. Fyll inn telefonnummer
4. Bekreft kryptograf-konsulent (ekstern kontakt)
5. Verifiser UiO/SINTEF-kontaktpunkter før du nevner dem

Send forhåndsgodkjennings-forespørsel først (Forskningsrådet svarer normalt innen 4 uker). Formell SkatteFUNN-søknad sendes deretter gjennom regnskapsfører eller direkte via www.skattefunn.no.
