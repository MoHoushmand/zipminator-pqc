export type BpScenario = 'conservative' | 'moderate' | 'optimistic'

export const SECTION_LIST = [
  { id: 'irreversibility-pyramid', title: 'Irreversibility Pyramid' },
  { id: 'otp-destroy-flow', title: 'QRNG-OTP-Destroy Flow' },
  { id: 'security-bound', title: 'Security Bound' },
  { id: 'claim-heatmap', title: 'Claim Heatmap' },
  { id: 'entropy-harvest', title: 'Entropy Harvest' },
  { id: 'competitive-radar', title: 'Competitive Radar' },
  { id: 'regulatory-gantt', title: 'Regulatory Timeline' },
  { id: 'market-funnel', title: 'Market Funnel' },
  { id: 'value-waterfall', title: 'Value Waterfall' },
  { id: 'revenue-area', title: 'Revenue Contribution' },
]

export const HERO_KPIS = [
  { label: 'Application No', value: '20260384', sub: 'Patentstyret, Oslo', accent: '#22D3EE' },
  { label: 'Filing Date', value: '2026-03-24', sub: 'Paris Convention priority', accent: '#A78BFA' },
  { label: 'Claims', value: '15', sub: '3 independent, 12 dependent', accent: '#34D399' },
  { label: 'Security Bound', value: '2^-95.3', sub: '62^-16 per-value mapping', accent: '#F59E0B' },
  { label: 'Internal Score', value: '0.97 / 1.0', sub: '10 RALPH iterations', accent: '#FB7185' },
  { label: 'Companion Paper', value: 'PoPETs 2026', sub: '17 pages, 47 citations', accent: '#6366f1' },
  { label: 'Single Value', value: 'NOK 80-220M', sub: 'USD 7.5-21M, NO+US grant', accent: '#22D3EE' },
  { label: 'Bundled', value: 'NOK 240-1100M', sub: 'USD 22-105M, NO+US+EP bundle', accent: '#f97316' },
]

// ---------------------------------------------------------------------------
// Section 1: Irreversibility Pyramid (custom SVG)
// ---------------------------------------------------------------------------
export const IRREVERSIBILITY_TIERS = [
  {
    tier: 'Computational',
    accent: '#FB7185',
    description: 'Hash, pseudonymization, CSPRNG tokenization. Reversible if P=NP or seed leaks.',
    examples: 'ARX, sdcMicro, Privitar, Microsoft Presidio, OpenDP',
    survives: 'P!=NP assumption + key custody',
  },
  {
    tier: 'Information-theoretic',
    accent: '#F59E0B',
    description: 'OTP with secret key. Reversible if key compromise. Bounded by Shannon entropy.',
    examples: 'Vernam cipher, classical OTP',
    survives: 'Key secrecy only; not key destruction',
  },
  {
    tier: 'Physics-guaranteed',
    accent: '#22D3EE',
    description: 'QRNG-OTP-Destroy. Mapping never existed deterministically and is physically destroyed. Holds even if P=NP.',
    examples: 'Patent 1 (Norway 20260384), only known construction',
    survives: 'Born rule + DoD 5220.22-M three-pass overwrite',
  },
]

// ---------------------------------------------------------------------------
// Section 2: OTP-Destroy Flow stages
// ---------------------------------------------------------------------------
export const FLOW_STAGES = [
  { id: 'qrng', label: 'QRNG Harvest', accent: '#22D3EE', detail: '156 qubits, IBM ibm_kingston / ibm_fez, Rigetti Ankaa, qBraid gateway' },
  { id: 'pool', label: 'Entropy Pool', accent: '#A78BFA', detail: 'Thread-safe append-only file, provenance per byte (Claim 9, Claim 13)' },
  { id: 'otp', label: 'OTP Construction', accent: '#34D399', detail: 'Rejection-sampled 16-char base-62 tokens; one-time-pad per unique PII value' },
  { id: 'apply', label: 'Anonymize Dataset', accent: '#F59E0B', detail: 'Column-selective (Claim 14): k-anon + OTP + pass-through; DP Laplace from QRNG (Claim 7)' },
  { id: 'destroy', label: 'Destroy Mapping', accent: '#FB7185', detail: 'DoD 5220.22-M three-pass overwrite (Claim 5); SGX/TrustZone enclave option (Claim 8)' },
  { id: 'certificate', label: 'Certificate', accent: '#6366f1', detail: 'Timestamp, provider IDs, entropy bytes consumed, dataset hash (Claim 15)' },
]

// ---------------------------------------------------------------------------
// Section 3: Security Bound comparison (log scale)
// ---------------------------------------------------------------------------
export const SECURITY_BOUNDS = [
  { name: 'Industry baseline (CSPRNG token)', exponent: 80, probability: 8.27e-25, accent: '#FB7185', label: '2^-80' },
  { name: 'Patent 1 (revised, 62^-16 base-62 token)', exponent: 95.3, probability: 2.49e-29, accent: '#22D3EE', label: '2^-95.3' },
  { name: 'Patent 1 (prior hand-waved estimate)', exponent: 128, probability: 2.94e-39, accent: '#A78BFA', label: '2^-128' },
]

// ---------------------------------------------------------------------------
// Section 4: Claim Heatmap (15 claims x 6 embodiments)
// ---------------------------------------------------------------------------
export const EMBODIMENTS = [
  'Method',
  'System',
  'Medium',
  'Hardware',
  'Audit',
  'Composition',
]

export interface ClaimCell {
  claim: number
  embodiment: string
  strength: number // 0-4
  note: string
}

export const CLAIMS_HEATMAP: ClaimCell[] = [
  // Claim 1, independent method
  { claim: 1, embodiment: 'Method', strength: 4, note: 'Independent: QRNG -> OTP -> Apply -> Destroy' },
  { claim: 1, embodiment: 'System', strength: 2, note: 'Referenced by Claim 2 system' },
  { claim: 1, embodiment: 'Medium', strength: 2, note: 'Referenced by Claim 3 medium' },
  { claim: 1, embodiment: 'Hardware', strength: 3, note: 'Quantum source required' },
  { claim: 1, embodiment: 'Audit', strength: 2, note: 'Optional certificate path' },
  { claim: 1, embodiment: 'Composition', strength: 3, note: 'Anchors all dependents' },
  // Claim 2, system
  { claim: 2, embodiment: 'Method', strength: 2, note: 'Mirrors Claim 1 steps' },
  { claim: 2, embodiment: 'System', strength: 4, note: 'Independent: QRNG + pool + processor + destruction module' },
  { claim: 2, embodiment: 'Medium', strength: 2, note: 'System carries firmware' },
  { claim: 2, embodiment: 'Hardware', strength: 4, note: 'Physical apparatus' },
  { claim: 2, embodiment: 'Audit', strength: 3, note: 'Ties to GDPR Recital 26' },
  { claim: 2, embodiment: 'Composition', strength: 3, note: 'Multi-stage subsystems' },
  // Claim 3, medium
  { claim: 3, embodiment: 'Method', strength: 2, note: 'Encodes Claim 1' },
  { claim: 3, embodiment: 'System', strength: 2, note: 'Embeds in Claim 2' },
  { claim: 3, embodiment: 'Medium', strength: 4, note: 'Independent: non-transitory CRM' },
  { claim: 3, embodiment: 'Hardware', strength: 2, note: 'Storage class' },
  { claim: 3, embodiment: 'Audit', strength: 1, note: 'Indirect' },
  { claim: 3, embodiment: 'Composition', strength: 2, note: 'Loads into system' },
  // Claim 4
  { claim: 4, embodiment: 'Method', strength: 1, note: '' },
  { claim: 4, embodiment: 'System', strength: 1, note: '' },
  { claim: 4, embodiment: 'Medium', strength: 0, note: '' },
  { claim: 4, embodiment: 'Hardware', strength: 4, note: 'At-least 100-qubit QRNG' },
  { claim: 4, embodiment: 'Audit', strength: 1, note: '' },
  { claim: 4, embodiment: 'Composition', strength: 2, note: '' },
  // Claim 5
  { claim: 5, embodiment: 'Method', strength: 3, note: 'DoD 5220.22-M 3-pass' },
  { claim: 5, embodiment: 'System', strength: 2, note: '' },
  { claim: 5, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 5, embodiment: 'Hardware', strength: 2, note: '' },
  { claim: 5, embodiment: 'Audit', strength: 3, note: 'Destruction logged' },
  { claim: 5, embodiment: 'Composition', strength: 2, note: '' },
  // Claim 6
  { claim: 6, embodiment: 'Method', strength: 3, note: 'k-anonymity pre-processing' },
  { claim: 6, embodiment: 'System', strength: 2, note: '' },
  { claim: 6, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 6, embodiment: 'Hardware', strength: 1, note: '' },
  { claim: 6, embodiment: 'Audit', strength: 2, note: '' },
  { claim: 6, embodiment: 'Composition', strength: 3, note: 'Combines with OTP' },
  // Claim 7
  { claim: 7, embodiment: 'Method', strength: 3, note: 'QRNG-sourced DP Laplace noise' },
  { claim: 7, embodiment: 'System', strength: 2, note: '' },
  { claim: 7, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 7, embodiment: 'Hardware', strength: 2, note: '' },
  { claim: 7, embodiment: 'Audit', strength: 2, note: '' },
  { claim: 7, embodiment: 'Composition', strength: 3, note: 'DP + OTP stack' },
  // Claim 8
  { claim: 8, embodiment: 'Method', strength: 2, note: '' },
  { claim: 8, embodiment: 'System', strength: 3, note: '' },
  { claim: 8, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 8, embodiment: 'Hardware', strength: 4, note: 'SGX / TrustZone enclave' },
  { claim: 8, embodiment: 'Audit', strength: 3, note: '' },
  { claim: 8, embodiment: 'Composition', strength: 2, note: '' },
  // Claim 9
  { claim: 9, embodiment: 'Method', strength: 2, note: '' },
  { claim: 9, embodiment: 'System', strength: 2, note: '' },
  { claim: 9, embodiment: 'Medium', strength: 2, note: '' },
  { claim: 9, embodiment: 'Hardware', strength: 2, note: '' },
  { claim: 9, embodiment: 'Audit', strength: 4, note: 'Per-byte provenance log' },
  { claim: 9, embodiment: 'Composition', strength: 3, note: '' },
  // Claim 10
  { claim: 10, embodiment: 'Method', strength: 2, note: '' },
  { claim: 10, embodiment: 'System', strength: 3, note: 'Multi-provider failover chain' },
  { claim: 10, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 10, embodiment: 'Hardware', strength: 3, note: 'IBM + Rigetti + qBraid' },
  { claim: 10, embodiment: 'Audit', strength: 2, note: '' },
  { claim: 10, embodiment: 'Composition', strength: 3, note: '' },
  // Claim 11
  { claim: 11, embodiment: 'Method', strength: 3, note: 'Consistent-within-run mapping' },
  { claim: 11, embodiment: 'System', strength: 2, note: '' },
  { claim: 11, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 11, embodiment: 'Hardware', strength: 1, note: '' },
  { claim: 11, embodiment: 'Audit', strength: 2, note: '' },
  { claim: 11, embodiment: 'Composition', strength: 3, note: '' },
  // Claim 12
  { claim: 12, embodiment: 'Method', strength: 2, note: '' },
  { claim: 12, embodiment: 'System', strength: 3, note: '"Classically anonymized" label fallback' },
  { claim: 12, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 12, embodiment: 'Hardware', strength: 2, note: 'OS-entropy degraded mode' },
  { claim: 12, embodiment: 'Audit', strength: 3, note: 'Explicit fallback labeling' },
  { claim: 12, embodiment: 'Composition', strength: 2, note: '' },
  // Claim 13
  { claim: 13, embodiment: 'Method', strength: 2, note: '' },
  { claim: 13, embodiment: 'System', strength: 3, note: 'Append-only entropy-pool daemon' },
  { claim: 13, embodiment: 'Medium', strength: 2, note: '' },
  { claim: 13, embodiment: 'Hardware', strength: 2, note: '' },
  { claim: 13, embodiment: 'Audit', strength: 3, note: '' },
  { claim: 13, embodiment: 'Composition', strength: 2, note: '' },
  // Claim 14
  { claim: 14, embodiment: 'Method', strength: 3, note: 'Column-selective application' },
  { claim: 14, embodiment: 'System', strength: 2, note: '' },
  { claim: 14, embodiment: 'Medium', strength: 1, note: '' },
  { claim: 14, embodiment: 'Hardware', strength: 1, note: '' },
  { claim: 14, embodiment: 'Audit', strength: 2, note: '' },
  { claim: 14, embodiment: 'Composition', strength: 4, note: 'k-anon + OTP + pass-through' },
  // Claim 15
  { claim: 15, embodiment: 'Method', strength: 2, note: '' },
  { claim: 15, embodiment: 'System', strength: 3, note: 'Certificate issuance' },
  { claim: 15, embodiment: 'Medium', strength: 2, note: '' },
  { claim: 15, embodiment: 'Hardware', strength: 2, note: '' },
  { claim: 15, embodiment: 'Audit', strength: 4, note: 'Timestamp + provider + bytes + dataset hash' },
  { claim: 15, embodiment: 'Composition', strength: 3, note: '' },
]

// ---------------------------------------------------------------------------
// Section 5: Entropy Harvest (cumulative MB over time + daily harvest bars)
// ---------------------------------------------------------------------------
export const ENTROPY_TIMELINE = [
  { date: 'Jan 2026', daily: 0.18, cumulative: 0.18, label: 'ibm_kingston cycle 1' },
  { date: 'Feb 2026', daily: 0.41, cumulative: 0.59, label: 'ibm_kingston scale-up' },
  { date: 'Mar 2026', daily: 0.62, cumulative: 1.21, label: 'qBraid gateway online' },
  { date: 'Apr 2026', daily: 1.49, cumulative: 2.70, label: 'Pre-filing harvest' },
  { date: 'May 2026', daily: 0.96, cumulative: 3.66, label: 'ibm_fez job d76hr068' },
  { date: 'Jun 2026', daily: 0.84, cumulative: 4.50, label: 'Rigetti Ankaa' },
  { date: 'Jul 2026', daily: 0.72, cumulative: 5.22, label: 'Multi-provider failover' },
  { date: 'Aug 2026', daily: 0.58, cumulative: 5.80, label: 'PoPETs camera-ready' },
  { date: 'Sep 2026', daily: 0.51, cumulative: 6.31, label: 'Reproducibility batch' },
  { date: 'Oct 2026', daily: 0.49, cumulative: 6.80, label: '6.8 MB milestone' },
]

// ---------------------------------------------------------------------------
// Section 6: Competitive Radar (6 dimensions, 6 competitors)
// ---------------------------------------------------------------------------
export const COMPETITIVE_RADAR = [
  { dimension: 'Irreversibility', QDaria: 100, ARX: 30, sdcMicro: 25, Privitar: 40, OpenDP: 55, AppleLDP: 50 },
  { dimension: 'Audit Trail', QDaria: 95, ARX: 20, sdcMicro: 15, Privitar: 60, OpenDP: 35, AppleLDP: 25 },
  { dimension: 'Performance', QDaria: 75, ARX: 70, sdcMicro: 65, Privitar: 80, OpenDP: 60, AppleLDP: 90 },
  { dimension: 'Regulatory Fit', QDaria: 92, ARX: 60, sdcMicro: 55, Privitar: 70, OpenDP: 50, AppleLDP: 45 },
  { dimension: 'Openness', QDaria: 80, ARX: 90, sdcMicro: 85, Privitar: 20, OpenDP: 95, AppleLDP: 30 },
  { dimension: 'Hardware Anchor', QDaria: 100, ARX: 0, sdcMicro: 0, Privitar: 0, OpenDP: 0, AppleLDP: 5 },
]

export const COMPETITORS_META = [
  { key: 'QDaria', color: '#22D3EE', kind: 'QRNG-OTP-Destroy (Patent 1)' },
  { key: 'ARX', color: '#FB7185', kind: 'Open-source k-anonymity (Prasser et al.)' },
  { key: 'sdcMicro', color: '#F59E0B', kind: 'R package, statistical disclosure control' },
  { key: 'Privitar', color: '#A78BFA', kind: 'Commercial PETs platform (Informatica)' },
  { key: 'OpenDP', color: '#34D399', kind: 'Harvard/Microsoft DP library' },
  { key: 'AppleLDP', color: '#6366f1', kind: 'Apple local differential privacy' },
]

// ---------------------------------------------------------------------------
// Section 7: Regulatory Gantt (scenario-driven dates)
// ---------------------------------------------------------------------------
export interface GanttItem {
  id: string
  label: string
  startYear: number
  endYear: Record<BpScenario, number>
  accent: string
  category: 'regulation' | 'priority' | 'grant'
  detail: string
}

export const REGULATORY_GANTT: GanttItem[] = [
  { id: 'gdpr', label: 'GDPR Recital 26', startYear: 2018, endYear: { conservative: 2030, moderate: 2032, optimistic: 2035 }, accent: '#6366f1', category: 'regulation', detail: 'Anonymous-information standard; output outside GDPR scope' },
  { id: 'dora', label: 'DORA Art. 6.4', startYear: 2025, endYear: { conservative: 2030, moderate: 2032, optimistic: 2035 }, accent: '#22D3EE', category: 'regulation', detail: 'Periodic crypto update vs cryptanalysis; 2% turnover penalty' },
  { id: 'no-priority', label: 'NO 20260384 Priority', startYear: 2026, endYear: { conservative: 2026.8, moderate: 2027.0, optimistic: 2027.2 }, accent: '#F59E0B', category: 'priority', detail: 'Paris Convention 12-month window from 2026-03-24' },
  { id: 'pct', label: 'PCT Filing', startYear: 2027, endYear: { conservative: 2029, moderate: 2029, optimistic: 2029 }, accent: '#FB7185', category: 'priority', detail: 'International phase, 30 months to national entry' },
  { id: 'no-grant', label: 'NO Patent Grant', startYear: 2027, endYear: { conservative: 2030, moderate: 2029, optimistic: 2028 }, accent: '#22D3EE', category: 'grant', detail: 'Norwegian Patentstyret prosecution' },
  { id: 'epo-grant', label: 'EPO Grant', startYear: 2029, endYear: { conservative: 2032, moderate: 2031, optimistic: 2030 }, accent: '#34D399', category: 'grant', detail: 'European Patent Office; multi-jurisdictional moat' },
  { id: 'uspto-grant', label: 'USPTO Grant', startYear: 2029, endYear: { conservative: 2033, moderate: 2031, optimistic: 2030 }, accent: '#A78BFA', category: 'grant', detail: 'US continuation; SandboxAQ-style buyer trigger' },
]

// ---------------------------------------------------------------------------
// Section 8: Market Funnel (TAM -> SAM -> SOM -> captured)
// ---------------------------------------------------------------------------
export const MARKET_FUNNEL: Record<BpScenario, { stage: string; value: number; unit: string; detail: string }[]> = {
  conservative: [
    { stage: 'PQC TAM (2030)', value: 2840, unit: 'M USD', detail: 'MarketsandMarkets PQC submarket' },
    { stage: 'Anonymization SAM', value: 170, unit: 'M USD', detail: '6% slice, lower bound' },
    { stage: 'Reachable SOM', value: 0.85, unit: 'M USD / yr', detail: '0.5% capture, Norway grant only' },
    { stage: 'Captured (NOK)', value: 80, unit: 'M NOK', detail: '10-year cumulative, single jurisdiction' },
  ],
  moderate: [
    { stage: 'PQC TAM (2030)', value: 2840, unit: 'M USD', detail: 'MarketsandMarkets PQC submarket' },
    { stage: 'Anonymization SAM', value: 240, unit: 'M USD', detail: '8.5% slice, midpoint' },
    { stage: 'Reachable SOM', value: 2.0, unit: 'M USD / yr', detail: '0.8% capture, NO+US grants' },
    { stage: 'Captured (NOK)', value: 150, unit: 'M NOK', detail: '10-year cumulative, single+US' },
  ],
  optimistic: [
    { stage: 'PQC TAM (2030)', value: 2840, unit: 'M USD', detail: 'MarketsandMarkets PQC submarket' },
    { stage: 'Anonymization SAM', value: 280, unit: 'M USD', detail: '10% slice, upper bound' },
    { stage: 'Reachable SOM', value: 4.2, unit: 'M USD / yr', detail: '1.5% capture, NO+US+EP bundled' },
    { stage: 'Captured (NOK)', value: 220, unit: 'M NOK', detail: '10-year cumulative, NO+US grant ceiling' },
  ],
}

// ---------------------------------------------------------------------------
// Section 9: Value Waterfall (NO floor -> +US -> +EP -> bundle -> ceiling)
// ---------------------------------------------------------------------------
export const VALUE_WATERFALL: Record<BpScenario, { stage: string; delta: number; running: number; accent: string; detail: string }[]> = {
  conservative: [
    { stage: 'NO grant floor', delta: 80, running: 80, accent: '#22D3EE', detail: 'Norway-only, no US continuation' },
    { stage: '+ US continuation', delta: 30, running: 110, accent: '#A78BFA', detail: 'USPTO grant, SandboxAQ buyer trigger' },
    { stage: '+ EPO grant', delta: 25, running: 135, accent: '#34D399', detail: 'European multi-jurisdiction add-on' },
    { stage: 'x Bundle (P1+P2+P3)', delta: 105, running: 240, accent: '#F59E0B', detail: '3-5x multiplier; lower bound applied here' },
    { stage: 'Strategic ceiling', delta: 0, running: 240, accent: '#FB7185', detail: 'No DORA reference, conservative case' },
  ],
  moderate: [
    { stage: 'NO grant floor', delta: 130, running: 130, accent: '#22D3EE', detail: 'Norway grant with credible PoPETs publication' },
    { stage: '+ US continuation', delta: 60, running: 190, accent: '#A78BFA', detail: 'USPTO grant + provisional in place' },
    { stage: '+ EPO grant', delta: 60, running: 250, accent: '#34D399', detail: 'European grant, mid-cycle' },
    { stage: 'x Bundle (P1+P2+P3)', delta: 350, running: 600, accent: '#F59E0B', detail: '4x multiplier on bundled stack' },
    { stage: 'Strategic ceiling', delta: 200, running: 800, accent: '#FB7185', detail: 'Partial DORA Art. 6.4 reference' },
  ],
  optimistic: [
    { stage: 'NO grant floor', delta: 220, running: 220, accent: '#22D3EE', detail: 'Top-of-range NO+US single' },
    { stage: '+ US continuation', delta: 120, running: 340, accent: '#A78BFA', detail: 'Granted USPTO + active licensing program' },
    { stage: '+ EPO grant', delta: 160, running: 500, accent: '#34D399', detail: 'EPO grant + Nordic banking reference' },
    { stage: 'x Bundle (P1+P2+P3)', delta: 600, running: 1100, accent: '#F59E0B', detail: '5x multiplier; full bundled valuation' },
    { stage: 'Strategic ceiling', delta: 1100, running: 2200, accent: '#FB7185', detail: '2x DORA reference uplift [unverified]' },
  ],
}

// ---------------------------------------------------------------------------
// Section 10: 10-year cumulative revenue contribution (stacked area)
// ---------------------------------------------------------------------------
export const REVENUE_AREA: Record<BpScenario, { year: number; licensing: number; saas: number; defensive: number }[]> = {
  conservative: [
    { year: 2026, licensing: 0, saas: 0, defensive: 1 },
    { year: 2027, licensing: 1, saas: 1, defensive: 2 },
    { year: 2028, licensing: 3, saas: 3, defensive: 3 },
    { year: 2029, licensing: 5, saas: 5, defensive: 4 },
    { year: 2030, licensing: 8, saas: 7, defensive: 5 },
    { year: 2031, licensing: 10, saas: 8, defensive: 6 },
    { year: 2032, licensing: 12, saas: 9, defensive: 7 },
    { year: 2033, licensing: 14, saas: 10, defensive: 7 },
    { year: 2034, licensing: 15, saas: 11, defensive: 8 },
    { year: 2035, licensing: 16, saas: 12, defensive: 8 },
  ],
  moderate: [
    { year: 2026, licensing: 0, saas: 0, defensive: 2 },
    { year: 2027, licensing: 4, saas: 3, defensive: 3 },
    { year: 2028, licensing: 10, saas: 7, defensive: 4 },
    { year: 2029, licensing: 18, saas: 12, defensive: 5 },
    { year: 2030, licensing: 28, saas: 18, defensive: 6 },
    { year: 2031, licensing: 38, saas: 24, defensive: 7 },
    { year: 2032, licensing: 48, saas: 30, defensive: 8 },
    { year: 2033, licensing: 58, saas: 36, defensive: 8 },
    { year: 2034, licensing: 68, saas: 42, defensive: 9 },
    { year: 2035, licensing: 78, saas: 48, defensive: 10 },
  ],
  optimistic: [
    { year: 2026, licensing: 0, saas: 0, defensive: 3 },
    { year: 2027, licensing: 8, saas: 6, defensive: 4 },
    { year: 2028, licensing: 22, saas: 16, defensive: 6 },
    { year: 2029, licensing: 42, saas: 28, defensive: 8 },
    { year: 2030, licensing: 68, saas: 44, defensive: 10 },
    { year: 2031, licensing: 95, saas: 60, defensive: 12 },
    { year: 2032, licensing: 125, saas: 78, defensive: 14 },
    { year: 2033, licensing: 155, saas: 96, defensive: 16 },
    { year: 2034, licensing: 185, saas: 114, defensive: 18 },
    { year: 2035, licensing: 215, saas: 132, defensive: 20 },
  ],
}

// Tooltip style shared across charts
export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}
