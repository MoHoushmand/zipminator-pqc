/**
 * Portfolio Deck Data Layer
 * Source: docs/ip/PORTFOLIO_SIGNIFICANCE.md (2026-05-18 synthesis brief)
 *
 * All numbers verified against the master portfolio brief; any unverified
 * upper bounds are explicitly tagged in source data and section copy.
 */

export type BpScenario = 'conservative' | 'moderate' | 'optimistic'

export const SECTION_LIST = [
  { id: 'stack', title: 'Source-Audit-Application Stack' },
  { id: 'value-flow', title: 'Inter-Patent Value Flow' },
  { id: 'risk-vs-capture', title: 'Risk Mitigated vs Value Captured' },
  { id: 'scenario-waterfall', title: 'Portfolio Value Waterfall' },
  { id: 'regulatory-radar', title: 'Regulatory Coverage Radar' },
  { id: 'tam-treemap', title: 'PQC TAM by Segment' },
  { id: 'comparables', title: 'Comparable PQC Plays' },
  { id: 'revenue-area', title: 'Cumulative Revenue 2026-2036' },
  { id: 'action-timeline', title: '12-Month Action Timeline' },
  { id: 'highlights', title: 'Twelve Portfolio Highlights' },
]

// ---------------------------------------------------------------------------
// Section 1: Three-layer stack (source -> audit -> application)
// ---------------------------------------------------------------------------
export const STACK_LAYERS = [
  {
    id: 'P2',
    layer: 'Source',
    title: 'Unilateral CSI + PUEK',
    filingDate: '2026-04-04',
    claims: 14,
    color: '#F59E0B',
    role: 'Substrate: ambient WiFi-CSI entropy + location-bound PUEK keys',
    proof: '5.50 bpb under NIST SP 800-90B IID on 2,690 bytes (Broadcom BCM4339)',
    surface: '802.11n / ac / ax chipsets shipped since 2010',
  },
  {
    id: 'P3',
    layer: 'Audit',
    title: 'Certified Heterogeneous Entropy + ARE',
    filingDate: '2026-04-05',
    claims: 17,
    color: '#34D399',
    role: 'Composition: 3-source mixing + Merkle-rooted provenance certificates',
    proof: '6.8 MB cumulative IBM Quantum entropy harvested (156 qubits ibm_kingston)',
    surface: 'Pluggable EntropySource protocol over P2 + classical + quantum vendors',
  },
  {
    id: 'P1',
    layer: 'Application',
    title: 'Quantum-Certified Anonymization',
    filingDate: '2026-03-24',
    claims: 15,
    color: '#22D3EE',
    role: 'Outcome: OTP-mapping anonymization with mapping destruction',
    proof: 'Per-value mapping-recovery 62^-16 ~ 2^-95.3; bound holds under P = NP',
    surface: 'GDPR Recital 26, DORA Article 6.4, EU AI Act provenance hooks',
  },
]

// ---------------------------------------------------------------------------
// Section 2: Sankey value flow (entropy -> certificate -> anonymized output -> buyer)
// ---------------------------------------------------------------------------
export const SANKEY_DATA = {
  nodes: [
    { name: 'WiFi CSI (P2)' },              // 0
    { name: 'IBM Quantum (P3)' },           // 1
    { name: 'Rigetti / qBraid (P3)' },      // 2
    { name: 'Entropy Pool' },               // 3
    { name: 'ARE Composition' },            // 4
    { name: 'Merkle Certificate' },         // 5
    { name: 'OTP Mapping (P1)' },           // 6
    { name: 'Anonymized Output' },          // 7
    { name: 'Bank / Regulator / Buyer' },   // 8
  ],
  links: [
    { source: 0, target: 3, value: 35 },
    { source: 1, target: 3, value: 45 },
    { source: 2, target: 3, value: 20 },
    { source: 3, target: 4, value: 100 },
    { source: 4, target: 5, value: 100 },
    { source: 5, target: 6, value: 100 },
    { source: 6, target: 7, value: 100 },
    { source: 7, target: 8, value: 100 },
  ],
}

export const SANKEY_TABLE = {
  headers: ['Stage', 'Source Patent', 'Output', 'Audit Hook'],
  rows: [
    ['1. Substrate', 'P2', 'CSI bytes + PUEK', 'NIST SP 800-90B health tests'],
    ['2. Quantum mixing', 'P3', 'IBM + Rigetti + qBraid bits', 'Per-source FAILED / DEGRADED log'],
    ['3. Composition', 'P3', 'ARE-extracted seed', 'Min-entropy recomputation under partial failure'],
    ['4. Certification', 'P3', 'Merkle root + ProvenanceCertificate', 'DORA Article 7 lifecycle audit'],
    ['5. Mapping', 'P1', 'OTP table from certified entropy', 'Quantum-anonymization certificate (Claim 15)'],
    ['6. Application', 'P1', 'Anonymized record + destroyed mapping', 'GDPR Recital 26 + EU AI Act provenance'],
  ],
}

// ---------------------------------------------------------------------------
// Section 3: Risk mitigated vs value captured
// Two y-axes: trillion-scale risk surface (left, log) vs capture range (right, linear)
// ---------------------------------------------------------------------------
export interface RiskRow {
  label: string
  riskUSDb: number   // billions USD
  captureUSDm: number // millions USD - portfolio capture in that arena
  source: string
}

export const RISK_VS_CAPTURE: RiskRow[] = [
  { label: 'Citi quantum-bank attack', riskUSDb: 2650, captureUSDm: 0, source: 'Citi Institute Jan 2026, single Fedwire-access bank scenario midpoint' },
  { label: 'All-cause cybercrime / yr', riskUSDb: 10500, captureUSDm: 0, source: 'Cybersecurity Ventures 2025 projection' },
  { label: 'McKinsey FS quantum value', riskUSDb: 500, captureUSDm: 282, source: 'McKinsey Quantum Tech Monitor Jun 2025 midpoint' },
  { label: 'BCG total quantum value', riskUSDb: 650, captureUSDm: 282, source: 'BCG cross-industry 2040 midpoint' },
  { label: 'McKinsey quantum total mkt', riskUSDb: 148, captureUSDm: 282, source: 'McKinsey 2040 quantum technology market' },
  { label: 'PQC submarket 2030', riskUSDb: 2.84, captureUSDm: 282, source: 'MarketsandMarkets 46.2% CAGR' },
  { label: 'PQC submarket 2034', riskUSDb: 29.95, captureUSDm: 282, source: 'Precedence Research 2034 upper case' },
  { label: 'GDPR + DORA penalty ceiling', riskUSDb: 80, captureUSDm: 282, source: 'GDPR Art. 83 4% + DORA Art. 50 2% applied to top-50 FS group' },
]

// ---------------------------------------------------------------------------
// Section 4: Scenario waterfall (floor -> base -> ceiling)
// Numbers in USD millions; scenario-driven via prop
// ---------------------------------------------------------------------------
export interface WaterfallStep {
  label: string
  value: number      // delta vs previous bar (USDm)
  cumulative: number // cumulative value after this step (USDm)
  base: number       // for positive bars: the floor of this bar (USDm)
  color: string
  note: string
}

const buildWaterfall = (scenario: BpScenario): WaterfallStep[] => {
  // Floor: NOK 410M-1.12B = USD 38-106M; Base: NOK 1.29-4.70B = USD 120-445M
  // Ceiling: NOK 5-15B = USD 470M-1.4B [unverified upper]
  const F = scenario === 'conservative' ? 38 : scenario === 'moderate' ? 72 : 106
  const B = scenario === 'conservative' ? 120 : scenario === 'moderate' ? 282 : 445
  const C = scenario === 'conservative' ? 470 : scenario === 'moderate' ? 935 : 1400

  const dPCT = B - F  // PCT jurisdiction multi-grant uplift
  const dDORA = Math.round((C - B) * 0.4)
  const dT1 = Math.round((C - B) * 0.35)
  const dT1Closure = (C - B) - dDORA - dT1

  return [
    { label: 'NO-only floor', value: F, cumulative: F, base: 0, color: '#22D3EE', note: 'Single-jurisdiction 10-yr, no bundle effect' },
    { label: '+ US + EP grants', value: dPCT, cumulative: F + dPCT, base: F, color: '#A78BFA', note: 'PCT continuations, anchor licensee, publication trace' },
    { label: '+ DORA reference status', value: dDORA, cumulative: F + dPCT + dDORA, base: F + dPCT, color: '#34D399', note: 'Finanstilsynet + ENISA procurement pull' },
    { label: '+ Tier-1 licensee', value: dT1, cumulative: F + dPCT + dDORA + dT1, base: F + dPCT + dDORA, color: '#F59E0B', note: 'Broadcom / Qualcomm / Thales / Entrust on P2 or P3 firmware' },
    { label: '+ T1 ARE closure', value: dT1Closure, cumulative: C, base: F + dPCT + dDORA + dT1, color: '#FB7185', note: 'Mixed-domain reduction converts P3 to foundational extractor [unverified upper]' },
  ]
}

export const WATERFALL = {
  conservative: buildWaterfall('conservative'),
  moderate: buildWaterfall('moderate'),
  optimistic: buildWaterfall('optimistic'),
}

// ---------------------------------------------------------------------------
// Section 5: Regulatory radar (10 axes)
// Each axis has a per-patent coverage score 0-100; portfolio aggregate
// ---------------------------------------------------------------------------
export const REGULATORY_RADAR = [
  { axis: 'GDPR Recital 26', P1: 95, P2: 10, P3: 50, portfolio: 95 },
  { axis: 'DORA Art. 6.4', P1: 85, P2: 30, P3: 70, portfolio: 92 },
  { axis: 'DORA Art. 7 audit', P1: 40, P2: 35, P3: 95, portfolio: 95 },
  { axis: 'EU Cyber Resilience Act', P1: 25, P2: 90, P3: 40, portfolio: 90 },
  { axis: 'EU RED 2022/30 cyber', P1: 15, P2: 92, P3: 30, portfolio: 92 },
  { axis: 'NIS2 Art. 21 crypto', P1: 35, P2: 55, P3: 85, portfolio: 88 },
  { axis: 'EU AI Act provenance', P1: 80, P2: 25, P3: 75, portfolio: 88 },
  { axis: 'NIST FIPS 203 ML-KEM', P1: 50, P2: 80, P3: 60, portfolio: 85 },
  { axis: 'NIST SP 800-90B IID', P1: 30, P2: 88, P3: 90, portfolio: 92 },
  { axis: 'NSA CNSA 2.0 (2027)', P1: 60, P2: 75, P3: 70, portfolio: 90 },
]

export const REGULATORY_TABLE = {
  headers: ['Instrument', 'Force date', 'Fitting patent', 'Mechanism'],
  rows: [
    ['GDPR Recital 26', '2018-05-25', 'P1', 'Born-rule irreversibility removes data from GDPR scope'],
    ['DORA Art. 6.4', '2025-07-01 NO', 'P1 + P3', 'Information-theoretic bound + graceful-degradation health'],
    ['DORA Art. 7', '2025-07-01 NO', 'P3', 'Merkle-rooted provenance certificate'],
    ['EU CRA', '2027-12 full', 'P2', 'Ambient CSI entropy firmware-deployable on legacy IoT'],
    ['EU RED 2022/30', '2025-08-01', 'P2', 'NIST SP 800-90B validated entropy on 802.11 chipsets'],
    ['NIS2 Art. 21', '2024-10-17', 'P3', 'Per-source FAILED / DEGRADED logging maps to NIS2 reporting'],
    ['EU AI Act provenance', '2026-08-02', 'P1 + P3', 'Anonymization certificate + Merkle randomness provenance'],
    ['NIST FIPS 203', '2024-08-13', 'P2', 'Verified against NIST KAT test vectors'],
    ['NIST SP 800-90B', '2018-01', 'P2 + P3', 'IID battery + §6.3.1 health tests'],
    ['NSA CNSA 2.0', '2027-01 new', 'All three', 'Bundle is the migration-ready stack'],
  ],
}

// ---------------------------------------------------------------------------
// Section 6: PQC TAM treemap by segment
// 2030 market shares, MarketsandMarkets baseline
// ---------------------------------------------------------------------------
export const TAM_TREEMAP = [
  { name: 'Financial Services PQC', size: 980, color: '#22D3EE', share: '34.5%', source: 'Deloitte FS quantum slice' },
  { name: 'Government / Defense', size: 620, color: '#A78BFA', share: '21.8%', source: 'CNSA 2.0 + NATO budget mapping' },
  { name: 'HSM / Key Mgmt', size: 410, color: '#F59E0B', share: '14.4%', source: 'Thales / Entrust / Eviden refresh cycle' },
  { name: 'Cloud Provider PQC', size: 360, color: '#34D399', share: '12.7%', source: 'AWS / Azure / GCP KMS PQC migration' },
  { name: 'Telecom 5G/6G', size: 230, color: '#FB7185', share: '8.1%', source: 'ETSI TS 103 744 quantum-safe telecom' },
  { name: 'Healthcare HIPAA-PQ', size: 140, color: '#6366f1', share: '4.9%', source: 'IBM Cost of Data Breach + HIPAA crypto refresh' },
  { name: 'IoT / Edge', size: 100, color: '#f97316', share: '3.5%', source: 'EU CRA + RED 2022/30 forced refresh' },
]

// ---------------------------------------------------------------------------
// Section 7: Comparables (bubble chart: x = year, y = valuation, z = relevance)
// ---------------------------------------------------------------------------
export interface ComparableRow {
  company: string
  year: number
  valuationUSDm: number
  relevance: number   // 0-100, drives bubble size
  thesis: string
  color: string
}

export const COMPARABLES_PORTFOLIO: ComparableRow[] = [
  { company: 'SandboxAQ', year: 2024, valuationUSDm: 5600, relevance: 95, thesis: 'Cryptographic discovery + management; AQtive Guard; closest PQC + AI comparable', color: '#22D3EE' },
  { company: 'Quantinuum', year: 2023, valuationUSDm: 5000, relevance: 78, thesis: 'Honeywell + Cambridge Quantum; 56-qubit certified randomness with JPMorgan', color: '#A78BFA' },
  { company: 'PQShield', year: 2023, valuationUSDm: 320, relevance: 85, thesis: 'NIST PQC primitives co-author; USD 65M raised; primitives layer only', color: '#34D399' },
  { company: 'IDQuantique', year: 2024, valuationUSDm: 280, relevance: 70, thesis: 'Quantis QRNG line; NIST SP 800-90B ESV; upstream entropy supplier', color: '#F59E0B' },
  { company: 'JPMorgan QRNG', year: 2025, valuationUSDm: 0, relevance: 60, thesis: '71,313 bits certified quantum randomness in Nature; validates buyer thesis for P3', color: '#FB7185' },
  { company: 'HSBC PQC-VPN', year: 2025, valuationUSDm: 0, relevance: 55, thesis: 'Deployed PQC VPN + tokenized quantum-safe gold; Tier-1 procurement signal', color: '#6366f1' },
  { company: 'QDaria portfolio', year: 2026, valuationUSDm: 282, relevance: 100, thesis: 'Source-audit-application triad; only filing covering all three layers; base case', color: '#34D399' },
  { company: 'QDaria ceiling', year: 2030, valuationUSDm: 935, relevance: 100, thesis: 'DORA reference + Tier-1 licensee + T1 ARE closure [unverified upper]', color: '#A78BFA' },
]

// ---------------------------------------------------------------------------
// Section 8: Cumulative revenue 2026-2036 by patent, scenario-driven
// QDaria capture as licensing + product revenue
// ---------------------------------------------------------------------------
const buildRevenue = (scenario: BpScenario) => {
  // Per-patent dossier 5/10-year cumulative ranges (USD millions)
  // Patent 1: NOK 80-220M floor; NOK 240-1,100M bundled
  // Patent 2: NOK 180-500M floor; NOK 600M-1.6B bundled
  // Patent 3: NOK 150-400M floor; NOK 450M-2.0B bundled
  // NOK -> USD at 10.6
  const targets = {
    conservative: { P1: 22, P2: 56, P3: 42 },
    moderate: { P1: 64, P2: 103, P3: 116 },
    optimistic: { P1: 105, P2: 150, P3: 190 },
  }[scenario]

  const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036]
  // S-curve growth: ramp 2026-2028, steeper 2029-2032, plateau 2033-2036
  const curve = [0.005, 0.02, 0.06, 0.13, 0.22, 0.34, 0.48, 0.62, 0.76, 0.88, 1.0]
  return years.map((y, i) => ({
    year: y,
    P1: Math.round(targets.P1 * curve[i] * 10) / 10,
    P2: Math.round(targets.P2 * curve[i] * 10) / 10,
    P3: Math.round(targets.P3 * curve[i] * 10) / 10,
    total: Math.round((targets.P1 + targets.P2 + targets.P3) * curve[i] * 10) / 10,
  }))
}

export const REVENUE_BY_PATENT = {
  conservative: buildRevenue('conservative'),
  moderate: buildRevenue('moderate'),
  optimistic: buildRevenue('optimistic'),
}

// ---------------------------------------------------------------------------
// Section 9: 12-month action timeline (Gantt)
// Five workstreams: Publish / Prosecute / License / Audit / Position
// ---------------------------------------------------------------------------
export interface GanttRow {
  workstream: string
  task: string
  startMonth: number  // 0 = May 2026
  durationMonths: number
  color: string
  deliverable: string
}

export const ACTION_TIMELINE: GanttRow[] = [
  // Publish
  { workstream: 'Publish', task: 'Zenodo deposit P1 / P2 / P3', startMonth: 0, durationMonths: 1, color: '#22D3EE', deliverable: '3 verified-checksum DOIs' },
  { workstream: 'Publish', task: 'P2 IACR ePrint resubmission', startMonth: 1, durationMonths: 1, color: '#22D3EE', deliverable: 'YYYY/NNN ID assigned' },
  { workstream: 'Publish', task: 'P3 T1 mixed-domain ARE reduction', startMonth: 1, durationMonths: 3, color: '#22D3EE', deliverable: 'Theory gap closed in publishable form' },
  { workstream: 'Publish', task: 'P1 PoPETs 2026 submission', startMonth: 4, durationMonths: 1, color: '#22D3EE', deliverable: 'PoPETs 2026 Issue 4 target' },
  { workstream: 'Publish', task: 'P2 ACM WiSec submission', startMonth: 3, durationMonths: 1, color: '#22D3EE', deliverable: 'WiSec 2026 spring round' },

  // Prosecute
  { workstream: 'Prosecute', task: 'USPTO + EPO counsel engagement', startMonth: 0, durationMonths: 2, color: '#A78BFA', deliverable: 'Counsel retainer + claim review pack' },
  { workstream: 'Prosecute', task: 'P1 PCT filing (deadline 2027-03-24)', startMonth: 8, durationMonths: 2, color: '#A78BFA', deliverable: 'PCT application + claim-strength brief' },
  { workstream: 'Prosecute', task: 'P2 PCT filing (deadline 2027-04-04)', startMonth: 9, durationMonths: 2, color: '#A78BFA', deliverable: 'PCT application + ESP32-S3 hardware embodiment' },
  { workstream: 'Prosecute', task: 'P3 PCT filing (deadline 2027-04-05)', startMonth: 9, durationMonths: 2, color: '#A78BFA', deliverable: 'PCT application + GF(2^8) PCLMULQDQ embodiment' },

  // License
  { workstream: 'License', task: 'Broadcom + Qualcomm P2 outreach', startMonth: 1, durationMonths: 4, color: '#F59E0B', deliverable: 'Term-sheet conversations on CSI firmware' },
  { workstream: 'License', task: 'Thales + Entrust P2/P3 outreach', startMonth: 2, durationMonths: 5, color: '#F59E0B', deliverable: 'HSM firmware embedding pilot' },
  { workstream: 'License', task: 'SpareBank 1 Utvikling pilot', startMonth: 0, durationMonths: 6, color: '#F59E0B', deliverable: 'Pilot agreement covering 14 alliance banks' },
  { workstream: 'License', task: 'Espressif ESP32-S3 IoT design-win', startMonth: 4, durationMonths: 5, color: '#F59E0B', deliverable: 'Reference firmware + royalty term sheet' },

  // Audit
  { workstream: 'Audit', task: 'NIST ea_non_iid official runs (M1)', startMonth: 0, durationMonths: 2, color: '#34D399', deliverable: 'Official entropy assessment vs 6.8 MB pool' },
  { workstream: 'Audit', task: 'CSI pool expansion to 1M samples (M2)', startMonth: 2, durationMonths: 3, color: '#34D399', deliverable: 'Production-scale entropy assessment' },
  { workstream: 'Audit', task: 'Cross-source MI validation (M3)', startMonth: 4, durationMonths: 2, color: '#34D399', deliverable: 'XOR-composition independence proof' },

  // Position
  { workstream: 'Position', task: 'Publish portfolio brief + 3 dossiers', startMonth: 0, durationMonths: 1, color: '#FB7185', deliverable: 'Single public IP pack' },
  { workstream: 'Position', task: 'Circulate to ENISA + Finanstilsynet', startMonth: 1, durationMonths: 3, color: '#FB7185', deliverable: 'Sovereign-Norwegian quantum-safe reference' },
  { workstream: 'Position', task: 'EU AI Office briefing', startMonth: 3, durationMonths: 2, color: '#FB7185', deliverable: 'Article-10 training-data provenance hook' },
  { workstream: 'Position', task: 'Datatilsynet GDPR briefing', startMonth: 5, durationMonths: 2, color: '#FB7185', deliverable: 'Recital 26 reference architecture' },
]

// ---------------------------------------------------------------------------
// Section 10: Twelve portfolio highlights (deck-ready cards)
// Source: PORTFOLIO_SIGNIFICANCE.md Section 10
// ---------------------------------------------------------------------------
export interface Highlight {
  n: number
  title: string
  body: string
  accent: string
  citation: string
}

export const HIGHLIGHTS: Highlight[] = [
  { n: 1, title: 'Three Patentstyret filings', body: 'Filed at Patentstyret on Paris-Convention priority, March to April 2026, covering a single vertically-integrated post-quantum data-protection stack.', accent: '#22D3EE', citation: 'PORTFOLIO_SIGNIFICANCE Section 3' },
  { n: 2, title: 'Born-rule anonymization', body: 'P1 is the first anonymization construction whose irreversibility is bound by the Born rule of quantum mechanics rather than by computational hardness, to our knowledge.', accent: '#A78BFA', citation: 'Patent 1 Claim 1' },
  { n: 3, title: 'Single-device WiFi entropy', body: 'P2 is the first single-device entropy primitive from WiFi Channel State Information, 5.50 bpb under NIST SP 800-90B IID, within 13% of IBM Quantum at four-to-six orders of magnitude lower unit cost.', accent: '#F59E0B', citation: 'Patent 2 paper-internal invariant' },
  { n: 4, title: 'Merkle-rooted entropy audit', body: 'P3 is the first post-quantum entropy framework with a Merkle-rooted, source-by-source audit trail aligned with DORA Article 7.', accent: '#34D399', citation: 'Patent 3 Claim 2' },
  { n: 5, title: '156 qubits IBM Quantum', body: '156 qubits IBM Quantum hardware (ibm_kingston, user-confirmed) anchors the entropy pool across the portfolio; 6.8 MB cumulative entropy already harvested end-to-end.', accent: '#FB7185', citation: 'IBM Quantum runtime evidence' },
  { n: 6, title: 'NIST FIPS 203 verified', body: 'Implements NIST FIPS 203 (ML-KEM-768); verified against NIST KAT test vectors at the Rust workspace level.', accent: '#6366f1', citation: 'crates/zipminator-nist test suite' },
  { n: 7, title: 'ESP32-S3 IoT economics', body: 'ESP32-S3 reference under P2 ships 45-90 MB of entropy per month for a USD 5 bill of materials, collapsing the IoT PQC affordability objection.', accent: '#22D3EE', citation: 'Patent 2 hardware-cost analysis' },
  { n: 8, title: 'New extractor family', body: 'P3 introduces a new extractor family (Algebraic Randomness Extraction) over up to nine bounded number domains, distinct from every known hash-based extractor.', accent: '#A78BFA', citation: 'Patent 3 Claim 1' },
  { n: 9, title: 'Source-audit-application triad', body: 'Source-audit-application triad: P2 entropy then P3 provenance then P1 application, end-to-end regulator-defensible.', accent: '#34D399', citation: 'PORTFOLIO_SIGNIFICANCE Section 1' },
  { n: 10, title: 'Single licensable pack', body: 'Portfolio addresses GDPR Recital 26, DORA Articles 6.4 and 7, EU CRA, EU RED 2022/30 cyber, NIS2 Article 21, EU AI Act provenance, NIST FIPS 203, NIST SP 800-90B IID, and NSA CNSA 2.0 from a single licensable pack.', accent: '#F59E0B', citation: 'PORTFOLIO_SIGNIFICANCE Section 7' },
  { n: 11, title: 'Bundled valuation', body: 'Bundled valuation range NOK 1.29B to 4.70B (USD 120 to 445M) over 10 years with NO + US + EP grants, anchor licensee, and credible publication trace.', accent: '#FB7185', citation: 'PORTFOLIO_SIGNIFICANCE Section 5 base case' },
  { n: 12, title: 'Strategic ceiling', body: 'Strategic ceiling NOK 5 to 15B (USD 470M to 1.4B) [unverified upper bound] conditional on DORA enforcement intensity, Tier-1 licensing, and T1 ARE-reduction closure.', accent: '#6366f1', citation: 'PORTFOLIO_SIGNIFICANCE Section 5 ceiling' },
]

// ---------------------------------------------------------------------------
// At-a-glance value table (used in hero KPIs + intro)
// ---------------------------------------------------------------------------
export const PORTFOLIO_VALUE_TABLE = {
  headers: ['Patent', 'Filing', 'NO-only floor (USDm, 10-yr)', 'NO + US + EP bundled (USDm, 10-yr)', 'Asymmetric upside'],
  rows: [
    ['P1 Quantum-Certified Anonymization', '2026-03-24', '7.5-21', '22-105', '2-3x if becomes DORA Art. 6.4 reference'],
    ['P2 Unilateral CSI + PUEK', '2026-04-04', '17-47', '56-150', 'Tier-1 chipset or HSM licensee; EU CRA / RED'],
    ['P3 Certified Heterogeneous Entropy + ARE', '2026-04-05', '14-38', '42-190', 'T1 mixed-domain reduction closure'],
    ['Portfolio', '-', '38-106', '120-445', 'See waterfall section'],
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const fmtUSD = (m: number) => {
  if (m >= 1000) return `$${(m / 1000).toFixed(m >= 10000 ? 0 : 2)}B`
  return `$${m}M`
}
