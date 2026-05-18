export type BpScenario = 'conservative' | 'moderate' | 'optimistic'

// ---------------------------------------------------------------------------
// Section list for sidebar nav
// ---------------------------------------------------------------------------
export const SECTION_LIST = [
  { id: 'csi-pipeline', title: 'CSI Extraction Pipeline' },
  { id: 'entropy-triple', title: 'Min-Entropy Triple' },
  { id: 'puek-gauges', title: 'PUEK Security Profiles' },
  { id: 'device-sunburst', title: '802.11 Device Universe' },
  { id: 'cost-scatter', title: 'Cost vs Entropy' },
  { id: 'hardware-compare', title: 'Reference Hardware' },
  { id: 'iot-timeline', title: 'IoT Bubble Timeline' },
  { id: 'license-flow', title: 'License Revenue Flow' },
  { id: 'royalty-heatmap', title: 'Royalty Heatmap' },
  { id: 'moat-radar', title: 'Competitive Moat' },
]

// ---------------------------------------------------------------------------
// Hero KPIs (4x2)
// ---------------------------------------------------------------------------
export const HERO_KPIS: {
  label: string
  value: string
  sub: string
  accent: string
}[] = [
  { label: 'Filed', value: '2026-04-04', sub: 'Patentstyret · 12-month PCT window', accent: '#34D399' },
  { label: 'Claims', value: '14', sub: '3 independent · 11 dependent', accent: '#22D3EE' },
  { label: 'CSI Min-Entropy', value: '5.50 bpb', sub: 'NIST SP 800-90B ea_non_iid', accent: '#34D399' },
  { label: 'vs IBM Quantum', value: '6.35 bpb', sub: 'within 13% bpb of best-in-class', accent: '#A78BFA' },
  { label: 'Hardware', value: 'ESP32-S3', sub: '$5 BOM · 56 subcarriers · 802.11n', accent: '#F59E0B' },
  { label: 'Per-Month Entropy', value: '45-90 MB', sub: 'extrapolated from Nexmon baseline', accent: '#22D3EE' },
  { label: 'Single Value', value: 'NOK 180-500M', sub: 'NO+US prosecution · USD 17-47M', accent: '#FB7185' },
  { label: 'Bundled', value: 'NOK 600M-1.6B', sub: 'NO+US+EP+JP+KR · USD 56-150M [unverified upper bound]', accent: '#A78BFA' },
]

// ---------------------------------------------------------------------------
// S1: CSI Extraction Pipeline stages
// ---------------------------------------------------------------------------
export const PIPELINE_STAGES = [
  { id: 'rx', label: 'Receive Frames', detail: '343 Nexmon frames · BCM4339 · 802.11n HT20', accent: '#22D3EE' },
  { id: 'phase', label: 'Compute Phase', detail: 'per-subcarrier complex CSI · 56 subcarriers', accent: '#22D3EE' },
  { id: 'quantize', label: 'Quantize', detail: 'discretize phase into uniform levels', accent: '#34D399' },
  { id: 'lsb', label: 'Extract LSB', detail: 'lowest significant bit per subcarrier', accent: '#34D399' },
  { id: 'debias', label: 'Von Neumann Debias', detail: '(0,1) -> 0 · (1,0) -> 1 · matched pairs discarded', accent: '#F59E0B' },
  { id: 'bytes', label: 'Output Bytes', detail: '2,690 bytes · 24.5% extraction ratio · ready for HKDF', accent: '#FB7185' },
]

// ---------------------------------------------------------------------------
// S2: Min-Entropy Triple (the paper-internal invariant)
// ---------------------------------------------------------------------------
export const ENTROPY_TRIPLE = [
  { source: 'CSI (BCM4339)', bpb: 5.50, color: '#34D399', sample: '343 Nexmon frames · 2,690 B', note: 'NIST SP 800-90B ea_non_iid MCV · 99% CI' },
  { source: 'IBM Quantum', bpb: 6.35, color: '#A78BFA', sample: 'ibm_kingston · 156 qubits', note: 'best-in-class hardware reference' },
  { source: 'os.urandom', bpb: 6.36, color: '#22D3EE', sample: 'Linux getrandom()', note: 'kernel CSPRNG baseline' },
]

export const ENTROPY_DELTAS = [
  { from: 'CSI (BCM4339)', to: 'IBM Quantum', delta: 0.85, ratio: '13.4% bpb' },
  { from: 'IBM Quantum', to: 'os.urandom', delta: 0.01, ratio: '0.16% bpb' },
]

// ---------------------------------------------------------------------------
// S3: PUEK Security Profiles (4 subspace-similarity thresholds)
// ---------------------------------------------------------------------------
export const PUEK_PROFILES = [
  { name: 'Standard', threshold: 0.75, percent: 75, color: '#22D3EE', use: 'home routers, consumer IoT, smart-home', falseAccept: '~1e-3' },
  { name: 'Elevated', threshold: 0.85, percent: 85, color: '#34D399', use: 'enterprise endpoints, branch offices', falseAccept: '~1e-5' },
  { name: 'High', threshold: 0.95, percent: 95, color: '#F59E0B', use: 'financial services, regulated industries', falseAccept: '~1e-8' },
  { name: 'Military', threshold: 0.98, percent: 98, color: '#FB7185', use: 'classified comms, defense, intelligence', falseAccept: '~1e-12' },
]

// ---------------------------------------------------------------------------
// S4: 802.11 Device Universe (sunburst)
// ---------------------------------------------------------------------------
export const DEVICE_FAMILIES = [
  {
    family: '802.11n',
    color: '#22D3EE',
    installedBaseM: 8200,
    description: 'WiFi 4 · HT20/40 · 2.4 GHz + 5 GHz · 2009',
    children: [
      { name: 'ESP32-S3 / S2', share: 600, note: '$5 reference platform' },
      { name: 'BCM4339 / 43xx', share: 1400, note: 'Nexmon baseline chipset' },
      { name: 'Routers · IoT · legacy laptops', share: 6200, note: 'enormous installed base' },
    ],
  },
  {
    family: '802.11ac',
    color: '#34D399',
    installedBaseM: 5600,
    description: 'WiFi 5 · VHT80/160 · 5 GHz · 2014',
    children: [
      { name: 'Smartphones (mid-range)', share: 2400, note: 'Qualcomm WCN36xx, Broadcom' },
      { name: 'Laptops · tablets', share: 1900, note: 'Intel AX/AC, MediaTek' },
      { name: 'Consumer routers · APs', share: 1300, note: 'OEMs: Asus, Netgear, TP-Link' },
    ],
  },
  {
    family: '802.11ax',
    color: '#F59E0B',
    installedBaseM: 3800,
    description: 'WiFi 6 / 6E · OFDMA · 2.4/5/6 GHz · 2019',
    children: [
      { name: 'Flagship smartphones', share: 1500, note: 'iPhone 11+, Pixel 5+, Galaxy S20+' },
      { name: 'Enterprise APs', share: 800, note: 'Cisco, Aruba, Ruckus' },
      { name: 'Modern laptops · gaming', share: 1500, note: 'Intel AX2xx series' },
    ],
  },
  {
    family: '802.11be',
    color: '#A78BFA',
    installedBaseM: 600,
    description: 'WiFi 7 · multi-link · 6 GHz · 2024+',
    children: [
      { name: 'Premium routers', share: 200, note: 'Asus ROG, Netgear Nighthawk' },
      { name: '2026+ flagship phones', share: 250, note: 'forecast tier' },
      { name: 'Industrial · enterprise tier', share: 150, note: 'early industrial pilots' },
    ],
  },
]

// ---------------------------------------------------------------------------
// S5: Cost vs Entropy scatter (log-log)
// ---------------------------------------------------------------------------
export interface CostScatterPoint {
  name: string
  costUsdPerByte: number
  bpb: number
  color: string
  category: 'csi' | 'quantum' | 'usb' | 'puf' | 'trng'
  note: string
}

export const COST_SCATTER: CostScatterPoint[] = [
  { name: 'CSI ESP32-S3', costUsdPerByte: 1.2e-9, bpb: 5.50, color: '#34D399', category: 'csi', note: '$5 BOM amortised over 45-90 MB/month' },
  { name: 'IBM Quantum', costUsdPerByte: 1.6, bpb: 6.35, color: '#A78BFA', category: 'quantum', note: 'USD 1.60 per second of QRNG access' },
  { name: 'ID Quantique Quantis USB-4M', costUsdPerByte: 1.5e-5, bpb: 6.30, color: '#22D3EE', category: 'usb', note: '~15,000 NOK BOM, 4 Mbps photonic TRNG' },
  { name: 'RF-PUF (Chatterjee 2018)', costUsdPerByte: 8.0e-7, bpb: 5.10, color: '#F59E0B', category: 'puf', note: 'silicon area + characterization burden' },
  { name: 'Ring-Oscillator TRNG', costUsdPerByte: 1.0e-7, bpb: 5.40, color: '#FB7185', category: 'trng', note: 'silicon area, NIST cert per-design' },
]

// ---------------------------------------------------------------------------
// S6: Reference Hardware compare (ESP32-S3 vs BCM4339)
// ---------------------------------------------------------------------------
export const HARDWARE_REFERENCE = [
  {
    name: 'Espressif ESP32-S3',
    role: 'Reference platform (forward)',
    accent: '#34D399',
    cost: 5,
    maxBpb: 5.5,
    frameRateHz: 200,
    powerMw: 240,
    subcarriers: 56,
    standard: '802.11n HT20',
    note: 'Current, shipping, open SDK · primary licensing target for IoT OEMs',
  },
  {
    name: 'Broadcom BCM4339',
    role: 'Empirical baseline (Nexmon)',
    accent: '#22D3EE',
    cost: 12,
    maxBpb: 5.50,
    frameRateHz: 250,
    powerMw: 480,
    subcarriers: 56,
    standard: '802.11ac VHT80',
    note: 'Legacy chipset, Gi-z corpus origin · 343-frame anchor for the paper',
  },
]

// ---------------------------------------------------------------------------
// S7: IoT Bubble Timeline 2024-2034
// ---------------------------------------------------------------------------
export const IOT_BUBBLES = [
  { year: 2024, installedBaseB: 15.1, entropyEligible: 0.55, color: '#22D3EE' },
  { year: 2025, installedBaseB: 17.0, entropyEligible: 0.62, color: '#22D3EE' },
  { year: 2026, installedBaseB: 18.2, entropyEligible: 0.68, color: '#34D399' },
  { year: 2027, installedBaseB: 20.4, entropyEligible: 0.74, color: '#34D399' },
  { year: 2028, installedBaseB: 22.6, entropyEligible: 0.80, color: '#F59E0B' },
  { year: 2029, installedBaseB: 24.8, entropyEligible: 0.85, color: '#F59E0B' },
  { year: 2030, installedBaseB: 27.0, entropyEligible: 0.89, color: '#FB7185' },
  { year: 2031, installedBaseB: 29.0, entropyEligible: 0.91, color: '#FB7185' },
  { year: 2032, installedBaseB: 31.0, entropyEligible: 0.93, color: '#A78BFA' },
  { year: 2033, installedBaseB: 33.0, entropyEligible: 0.94, color: '#A78BFA' },
  { year: 2034, installedBaseB: 35.0, entropyEligible: 0.95, color: '#A78BFA' },
]

// ---------------------------------------------------------------------------
// S8: License Revenue Sankey (device tier -> rate -> annual revenue)
// ---------------------------------------------------------------------------
export interface LicenseScenarioBundle {
  conservative: number
  moderate: number
  optimistic: number
}

// Annual licensed device volumes (millions) per tier per scenario
export const TIER_VOLUMES_M: Record<string, LicenseScenarioBundle> = {
  'Tier 1: Chipmaker silicon': { conservative: 50, moderate: 180, optimistic: 600 },
  'Tier 2: OEM endpoints': { conservative: 30, moderate: 120, optimistic: 350 },
  'Tier 3: Defense / regulated': { conservative: 4, moderate: 12, optimistic: 30 },
}

// License rate USD per device
export const TIER_RATES_USD = {
  'Tier 1: Chipmaker silicon': 0.02,
  'Tier 2: OEM endpoints': 0.05,
  'Tier 3: Defense / regulated': 0.10,
}

// ---------------------------------------------------------------------------
// S9: Royalty Heatmap (license rate rows x annual volume columns)
// ---------------------------------------------------------------------------
export const HEATMAP_RATES = [0.01, 0.02, 0.05, 0.10, 0.25]  // USD per device per year
export const HEATMAP_VOLUMES_M = [5, 20, 80, 300, 800]  // million devices/year

// ---------------------------------------------------------------------------
// S10: Competitive Moat Radar
// ---------------------------------------------------------------------------
export const MOAT_RADAR = [
  { dimension: 'Unit Cost', P2_CSI: 95, RF_PUF: 60, SRAM_PUF: 65, Ring_Osc: 70, IDQ_Quantis: 35, Quantinuum: 25 },
  { dimension: 'Horizontal Scope', P2_CSI: 99, RF_PUF: 30, SRAM_PUF: 35, Ring_Osc: 40, IDQ_Quantis: 20, Quantinuum: 25 },
  { dimension: 'SP 800-90B Validated', P2_CSI: 90, RF_PUF: 45, SRAM_PUF: 50, Ring_Osc: 65, IDQ_Quantis: 80, Quantinuum: 75 },
  { dimension: 'Legacy Silicon Reach', P2_CSI: 98, RF_PUF: 5, SRAM_PUF: 10, Ring_Osc: 15, IDQ_Quantis: 0, Quantinuum: 0 },
  { dimension: 'Regulatory Fit (DORA/CRA)', P2_CSI: 92, RF_PUF: 50, SRAM_PUF: 55, Ring_Osc: 60, IDQ_Quantis: 78, Quantinuum: 70 },
  { dimension: 'Openness / On-Ramp', P2_CSI: 88, RF_PUF: 40, SRAM_PUF: 35, Ring_Osc: 55, IDQ_Quantis: 30, Quantinuum: 20 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const fmtUsd = (n: number, unit: 'M' | 'B' = 'M') => {
  if (unit === 'B') return `$${n.toFixed(2)}B`
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}B`
  return `$${n.toFixed(1)}M`
}

export const fmtNok = (low: number, high: number) => `NOK ${low}-${high}M`

// Compute annual revenue per tier for a scenario
export const tierRevenueUsdM = (tier: keyof typeof TIER_RATES_USD, scenario: BpScenario): number => {
  const volumeM = TIER_VOLUMES_M[tier][scenario]
  const ratePerDevice = TIER_RATES_USD[tier]
  return volumeM * ratePerDevice  // M devices * $ per device = $M
}
