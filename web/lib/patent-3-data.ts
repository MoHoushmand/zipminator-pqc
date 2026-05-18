// Patent 3 — Certified Heterogeneous Entropy + ARE Provenance
// Source: docs/ip/_significance/patent-3-significance.md
// Filing: Norwegian Patentstyret, 2026-04-05, 17 claims (3 independent + 14 dependent)

import type { BpScenario } from '@/components/blueprint/BlueprintScenarioToggle'
export type { BpScenario }

export const PATENT3_META = {
  title: 'Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction and Cryptographic Provenance',
  shortTitle: 'CHE + ARE Provenance',
  applicant: 'QDaria AS',
  inventor: 'Daniel Mo Houshmand',
  filingDate: '2026-04-05',
  jurisdiction: 'Norway (Patentstyret)',
  independentClaims: 3,
  dependentClaims: 14,
  totalClaims: 17,
  quantumSources: 3,
  qubits: 156,
  entropyMb: 6.8,
  numberDomains: 9,
  accent: '#A78BFA',
}

// ---------------------------------------------------------------------------
// Section 1: Heterogeneous 3-source mixing topology
// ---------------------------------------------------------------------------
export const QUANTUM_SOURCES = [
  {
    id: 'ibm',
    name: 'IBM Quantum',
    detail: 'ibm_kingston · 156 qubits',
    bytes: '6.8 MB harvested',
    color: '#22D3EE',
    x: 80,
    y: 60,
  },
  {
    id: 'rigetti',
    name: 'Rigetti',
    detail: 'Aspen-M class',
    bytes: 'Cloud QPU',
    color: '#F59E0B',
    x: 80,
    y: 200,
  },
  {
    id: 'qbraid',
    name: 'qBraid',
    detail: 'Multi-backend orchestrator',
    bytes: 'Federated access',
    color: '#FB7185',
    x: 80,
    y: 340,
  },
]

export const ARE_FUSION = {
  id: 'are',
  name: 'ARE Conditioner',
  detail: 'XOR fusion + SP 800-90B health',
  color: '#A78BFA',
  x: 480,
  y: 200,
}

export const SOURCE_HEALTH_ROWS = [
  ['IBM Quantum (ibm_kingston)', '156 qubits', '6.8 MB', 'HEALTHY', '< 1.0%'],
  ['Rigetti (cloud)', 'Aspen-class', '— streaming', 'HEALTHY', '< 1.0%'],
  ['qBraid (orchestrator)', 'Federated', '— streaming', 'HEALTHY', '< 1.0%'],
  ['ESP32-S3 WiFi CSI', 'BCM4339 path', '9 KB (pending M2)', 'DEGRADED', '— pool small'],
  ['os.urandom (baseline)', 'OS RNG', '15 MB', 'HEALTHY', '— reference'],
]

// ---------------------------------------------------------------------------
// Section 2: Merkle provenance certificate
// ---------------------------------------------------------------------------
export const MERKLE_LEAVES = [
  {
    id: 'L0',
    source: 'IBM Quantum',
    record: 'ibm_kingston|156qubits|H_min=0.9978|HEALTHY|6,800,000|1716050400.123456|sha256:7f3a...',
  },
  {
    id: 'L1',
    source: 'Rigetti',
    record: 'rigetti_aspen|HEALTHY|512,000|1716050400.234567|sha256:91c2...',
  },
  {
    id: 'L2',
    source: 'qBraid',
    record: 'qbraid_fed|HEALTHY|256,000|1716050400.345678|sha256:af55...',
  },
  {
    id: 'L3',
    source: 'CSI ESP32-S3',
    record: 'csi_esp32s3|DEGRADED|9,216|1716050400.456789|sha256:c8e1...',
  },
]

export const PROVENANCE_RECORD_FIELDS = [
  ['source_name', 'UTF-8 string', 'IBM Quantum ibm_kingston'],
  ['min_entropy', 'float, 6 dp', '0.997834'],
  ['health_status', 'enum', 'HEALTHY · DEGRADED · FAILED'],
  ['bytes_contributed', 'uint64', '6800000'],
  ['timestamp', 'float, 6 dp', '1716050400.123456'],
  ['sha256_hash', 'hex', '7f3a4c12...'],
]

// ---------------------------------------------------------------------------
// Section 3: Nine algebraic domains
// ---------------------------------------------------------------------------
export interface DomainRow {
  domain: string
  symbol: string
  formal: number
  structural: number
  notes: string
}

export const NUMBER_DOMAINS: DomainRow[] = [
  { domain: 'Natural', symbol: 'N', formal: 30, structural: 70, notes: 'Bounded enumeration; ARE program domain' },
  { domain: 'Integer', symbol: 'Z', formal: 35, structural: 75, notes: 'Signed; modular arithmetic baseline' },
  { domain: 'Rational', symbol: 'Q', formal: 40, structural: 80, notes: 'Numerator-denominator pairs' },
  { domain: 'Real', symbol: 'R', formal: 45, structural: 78, notes: 'Floating-point bounded approximation' },
  { domain: 'Complex', symbol: 'C', formal: 50, structural: 85, notes: 'Commutative + associative; AES path' },
  { domain: 'Quaternion', symbol: 'H', formal: 55, structural: 88, notes: 'Non-commutative; structural diversity' },
  { domain: 'Octonion', symbol: 'O', formal: 50, structural: 86, notes: 'Non-associative; structural diversity' },
  { domain: 'GF(p^n)', symbol: 'GF', formal: 92, structural: 96, notes: 'Closed: log_2(p^n - 1) bound proven' },
  { domain: 'p-adic', symbol: 'Q_p', formal: 45, structural: 80, notes: 'Orthogonal metric; T4 gap pending' },
]

export const EXCLUDED_DOMAIN = {
  symbol: 'S',
  name: 'Sedenion',
  reason: 'zero divisors break multiplicative-group bijection',
}

// ---------------------------------------------------------------------------
// Section 4: Graceful degradation state machine
// ---------------------------------------------------------------------------
export const HEALTH_STATES = [
  { id: 'HEALTHY', label: 'HEALTHY', color: '#34D399', desc: 'All three quantum sources online · < 1% failure rate' },
  { id: 'DEGRADED', label: 'DEGRADED', color: '#F59E0B', desc: 'One source flagged · reported min-entropy recomputed from contributing subset' },
  { id: 'FAILED', label: 'FAILED', color: '#FB7185', desc: 'Below min_sources threshold · composition halts · no silent fallback' },
]

export const HEALTH_TRANSITIONS = [
  { from: 'HEALTHY', to: 'DEGRADED', label: 'Health test > 1% failure on a source' },
  { from: 'DEGRADED', to: 'HEALTHY', label: 'Recovery + 1000-sample re-test pass' },
  { from: 'DEGRADED', to: 'FAILED', label: 'contributing_sources < min_sources' },
  { from: 'FAILED', to: 'DEGRADED', label: 'Source returns + auditor unlock' },
]

// ---------------------------------------------------------------------------
// Section 5: NIST SP 800-90B health gauges
// ---------------------------------------------------------------------------
export const HEALTH_GAUGES = [
  {
    id: 'rct',
    name: 'Repetition Count Test',
    value: 0.42,
    threshold: 1.0,
    unit: '% failure rate',
    color: '#22D3EE',
    desc: 'SP 800-90B §4.4.1; PASS below 1.0%',
  },
  {
    id: 'apt',
    name: 'Adaptive Proportion Test',
    value: 0.68,
    threshold: 1.0,
    unit: '% failure rate',
    color: '#A78BFA',
    desc: 'SP 800-90B §4.4.2; PASS below 1.0%',
  },
  {
    id: 'mcv',
    name: 'MCV min-entropy estimator',
    value: 0.9978,
    threshold: 0.95,
    unit: 'bits / bit',
    color: '#34D399',
    desc: 'Most-common-value proxy; PASS above 0.95',
  },
]

// ---------------------------------------------------------------------------
// Section 6: T1-T5 + M1-M3 publication gap roadmap
// ---------------------------------------------------------------------------
export interface GapItem {
  id: string
  label: string
  track: 'Theory' | 'Measurement'
  startDay: number
  durationDay: number
  effortMin: number
  effortMax: number
  closesUnder: BpScenario[]
  desc: string
}

export const GAP_ITEMS: GapItem[] = [
  {
    id: 'T1',
    label: 'T1 · Mixed-domain ARE extraction reduction',
    track: 'Theory',
    startDay: 0,
    durationDay: 60,
    effortMin: 40,
    effortMax: 200,
    closesUnder: ['optimistic'],
    desc: 'Close the "we prove" framing beyond GF(p^n) subcase',
  },
  {
    id: 'T2',
    label: 'T2 · Quaternion adversary model',
    track: 'Theory',
    startDay: 20,
    durationDay: 30,
    effortMin: 20,
    effortMax: 60,
    closesUnder: ['optimistic', 'moderate'],
    desc: 'Formal reduction or scope to "structural diversity"',
  },
  {
    id: 'T3',
    label: 'T3 · Octonion adversary model',
    track: 'Theory',
    startDay: 30,
    durationDay: 30,
    effortMin: 20,
    effortMax: 60,
    closesUnder: ['optimistic', 'moderate'],
    desc: 'Same path as T2',
  },
  {
    id: 'T4',
    label: 'T4 · p-adic orthogonal-metric mixing',
    track: 'Theory',
    startDay: 40,
    durationDay: 25,
    effortMin: 15,
    effortMax: 50,
    closesUnder: ['optimistic', 'moderate'],
    desc: 'Prove orthogonality or drop claim',
  },
  {
    id: 'T5',
    label: 'T5 · 27% fold collision vs XOR floor',
    track: 'Theory',
    startDay: 55,
    durationDay: 15,
    effortMin: 8,
    effortMax: 24,
    closesUnder: ['optimistic', 'moderate', 'conservative'],
    desc: 'Short reconciliation lemma',
  },
  {
    id: 'M1',
    label: 'M1 · NIST ea_non_iid runs',
    track: 'Measurement',
    startDay: 5,
    durationDay: 14,
    effortMin: 8,
    effortMax: 16,
    closesUnder: ['optimistic', 'moderate', 'conservative'],
    desc: 'Official SP 800-90B tool on 6.8 MB IBM trace + CSI + os.urandom',
  },
  {
    id: 'M2',
    label: 'M2 · CSI pool expansion to 1M samples',
    track: 'Measurement',
    startDay: 14,
    durationDay: 30,
    effortMin: 16,
    effortMax: 40,
    closesUnder: ['optimistic', 'moderate'],
    desc: 'Reuse Paper 2 Nexmon trace',
  },
  {
    id: 'M3',
    label: 'M3 · Cross-source mutual information',
    track: 'Measurement',
    startDay: 30,
    durationDay: 20,
    effortMin: 12,
    effortMax: 30,
    closesUnder: ['optimistic', 'moderate'],
    desc: 'Back the XOR independence assumption',
  },
]

// ---------------------------------------------------------------------------
// Section 7: Regulated-buyer procurement sunburst
// ---------------------------------------------------------------------------
export interface BuyerNode {
  name: string
  size: number
  color: string
  urgency: number
  reg: string
}

export interface BuyerGroup {
  name: string
  color: string
  urgency: number
  children: BuyerNode[]
}

export const BUYER_HIERARCHY: BuyerGroup[] = [
  {
    name: 'Banks (DORA Art. 7)',
    color: '#22D3EE',
    urgency: 98,
    children: [
      { name: 'SpareBank 1', size: 14, color: '#22D3EE', urgency: 96, reg: 'DORA · Finanstilsynet' },
      { name: 'DNB', size: 18, color: '#22D3EE', urgency: 95, reg: 'DORA · Finanstilsynet' },
      { name: 'Nordea', size: 22, color: '#22D3EE', urgency: 94, reg: 'DORA · pan-Nordic' },
      { name: 'JPMorgan', size: 40, color: '#22D3EE', urgency: 90, reg: 'OCC + DORA equivalent' },
      { name: 'HSBC', size: 32, color: '#22D3EE', urgency: 92, reg: 'PRA + DORA equivalent' },
      { name: 'BBVA', size: 18, color: '#22D3EE', urgency: 88, reg: 'DORA' },
    ],
  },
  {
    name: 'Insurers (Solvency II ICT)',
    color: '#A78BFA',
    urgency: 86,
    children: [
      { name: 'Gjensidige', size: 8, color: '#A78BFA', urgency: 84, reg: 'Solvency II ICT' },
      { name: 'Storebrand', size: 7, color: '#A78BFA', urgency: 82, reg: 'Solvency II ICT' },
      { name: 'AXA', size: 25, color: '#A78BFA', urgency: 80, reg: 'Solvency II ICT' },
      { name: 'Allianz', size: 28, color: '#A78BFA', urgency: 80, reg: 'Solvency II ICT' },
    ],
  },
  {
    name: 'Telcos (NIS2 Art. 21)',
    color: '#34D399',
    urgency: 78,
    children: [
      { name: 'Telenor', size: 15, color: '#34D399', urgency: 80, reg: 'NIS2 Art. 21' },
      { name: 'Deutsche Telekom', size: 22, color: '#34D399', urgency: 76, reg: 'NIS2' },
      { name: 'Vodafone', size: 20, color: '#34D399', urgency: 74, reg: 'NIS2' },
    ],
  },
  {
    name: 'Government (EU AI Act + ENISA CSA)',
    color: '#F59E0B',
    urgency: 88,
    children: [
      { name: 'NSM Norway', size: 10, color: '#F59E0B', urgency: 92, reg: 'Sovereign · NSM' },
      { name: 'Forsvarsmateriell', size: 9, color: '#F59E0B', urgency: 90, reg: 'Defence procurement' },
      { name: 'ENISA CSA', size: 12, color: '#F59E0B', urgency: 86, reg: 'EU CSA conformity body' },
      { name: 'EU AI Act register', size: 11, color: '#F59E0B', urgency: 84, reg: 'AI provenance' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Section 8: ARE conditioner efficiency
// ---------------------------------------------------------------------------
export const CONDITIONER_EFFICIENCY = {
  before: {
    label: 'Von Neumann debiasing',
    efficiency: 25,
    rest: 75,
    notes: 'LSB only · throws away 7 of 8 quantized CSI bits',
  },
  after: {
    label: 'ARE conditioner',
    efficiency: 85,
    rest: 15,
    notes: 'All 8 quantized bits · algebraic program over GF(2^8)',
  },
}

// ---------------------------------------------------------------------------
// Section 9: Per-key certificate royalty
// ---------------------------------------------------------------------------
export const ROYALTY_BASE_RATE_USD = {
  conservative: 0.001,
  moderate: 0.0045,
  optimistic: 0.01,
}

export const ROYALTY_EVENT_BASE = [
  { year: 2026, events: 12, label: '12B EU regulated key-derivation events' },
  { year: 2027, events: 28, label: '28B · post-DORA enforcement scale-up' },
  { year: 2028, events: 55, label: '55B · NIS2 + Solvency II ICT integration' },
  { year: 2029, events: 95, label: '95B · pan-EU adoption' },
  { year: 2030, events: 160, label: '160B · NSA CNSA 2.0 deadline year' },
  { year: 2031, events: 240, label: '240B · post-2030 RSA deprecation' },
  { year: 2032, events: 340, label: '340B · McKinsey financial inflection' },
]

// USD millions per year = events_billions * royalty_usd * 1000
export const royaltyProjection = (scenario: BpScenario) =>
  ROYALTY_EVENT_BASE.map((r) => ({
    year: r.year,
    revenueUSDm: Math.round(r.events * ROYALTY_BASE_RATE_USD[scenario] * 1000 * 10) / 10,
    events: r.events,
  }))

// ---------------------------------------------------------------------------
// Section 10: Precedent timeline
// ---------------------------------------------------------------------------
export interface PrecedentEvent {
  date: string
  sortKey: number
  label: string
  detail: string
  actor: 'Industry' | 'QDaria'
  color: string
}

export const PRECEDENT_TIMELINE: PrecedentEvent[] = [
  {
    date: '2025-03',
    sortKey: 2025.25,
    label: 'JPMorgan certified randomness',
    detail: '71,313 bits via Quantinuum 56-qubit · published in Nature',
    actor: 'Industry',
    color: '#22D3EE',
  },
  {
    date: '2025-07',
    sortKey: 2025.6,
    label: 'DORA in force (Norway)',
    detail: 'Article 7 cryptographic-lifecycle obligation activates',
    actor: 'Industry',
    color: '#F59E0B',
  },
  {
    date: '2025-Q4',
    sortKey: 2025.85,
    label: 'HSBC PQC VPN deployment',
    detail: 'Procurement appetite for auditable quantum-safe primitives',
    actor: 'Industry',
    color: '#FB7185',
  },
  {
    date: '2026-04-05',
    sortKey: 2026.27,
    label: 'QDaria Patent 3 filed',
    detail: 'Patentstyret · 17 claims · CHE + ARE + Merkle provenance',
    actor: 'QDaria',
    color: '#A78BFA',
  },
  {
    date: '2026-Q2',
    sortKey: 2026.45,
    label: 'QDaria Zenodo deposit',
    detail: 'CHE paper cleared per SHIP_READINESS',
    actor: 'QDaria',
    color: '#A78BFA',
  },
  {
    date: '2026-Q3',
    sortKey: 2026.7,
    label: 'QDaria IACR ePrint (after T1)',
    detail: 'Pending T1 mixed-domain reduction + M1 SP 800-90B runs',
    actor: 'QDaria',
    color: '#34D399',
  },
  {
    date: '2027-04-05',
    sortKey: 2027.27,
    label: 'PCT international filing deadline',
    detail: '12-month Paris Convention window closes · EPO + USPTO',
    actor: 'QDaria',
    color: '#6366f1',
  },
]

// ---------------------------------------------------------------------------
// Sidebar list
// ---------------------------------------------------------------------------
export const SECTION_LIST = [
  { id: 'mixing', title: 'Heterogeneous 3-Source Mixing' },
  { id: 'merkle', title: 'Merkle Provenance Certificate' },
  { id: 'domains', title: 'ARE: Nine Number Domains' },
  { id: 'degradation', title: 'Graceful Degradation' },
  { id: 'gauges', title: 'SP 800-90B Health Gauges' },
  { id: 'gaps', title: 'T1-T5 + M1-M3 Roadmap' },
  { id: 'buyers', title: 'Regulated Buyer Sunburst' },
  { id: 'conditioner', title: 'ARE Conditioner Efficiency' },
  { id: 'royalty', title: 'Per-Key Certificate Royalty' },
  { id: 'precedent', title: 'Precedent Timeline' },
]

// ---------------------------------------------------------------------------
// Hero KPIs
// ---------------------------------------------------------------------------
export const HERO_KPIS = [
  { label: 'Filed', value: '2026-04-05', sub: 'Patentstyret · Norway', accent: '#A78BFA' },
  { label: 'Claims', value: '17', sub: '3 independent · 14 dependent', accent: '#22D3EE' },
  { label: 'Quantum Sources', value: '3', sub: 'IBM + Rigetti + qBraid', accent: '#F59E0B' },
  { label: 'IBM Qubits', value: '156', sub: 'ibm_kingston · confirmed', accent: '#FB7185' },
  { label: 'Entropy Harvested', value: '6.8 MB', sub: 'Cumulative IBM Quantum', accent: '#34D399' },
  { label: 'Number Domains', value: '9', sub: 'N · Z · Q · R · C · H · O · GF · Q_p', accent: '#A78BFA' },
  { label: 'Single Value', value: 'NOK 150-400M', sub: 'Norway-only · 10-yr', accent: '#6366f1' },
  { label: 'Bundled', value: 'NOK 450M-2.0B', sub: 'NO + EP + US · 10-yr', accent: '#A78BFA' },
]
