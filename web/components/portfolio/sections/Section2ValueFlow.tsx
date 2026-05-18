'use client'

import { motion } from 'framer-motion'
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { SANKEY_DATA, SANKEY_TABLE, type BpScenario } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

// Scenario-driven flow magnification
const FLOW_MULTIPLIER: Record<BpScenario, number> = {
  conservative: 1.0,
  moderate: 1.4,
  optimistic: 1.9,
}

const NODE_COLORS: Record<number, string> = {
  0: '#F59E0B', // CSI P2
  1: '#34D399', // IBM Quantum P3
  2: '#34D399', // Rigetti / qBraid P3
  3: '#A78BFA', // Entropy pool
  4: '#A78BFA', // ARE
  5: '#A78BFA', // Merkle
  6: '#22D3EE', // OTP P1
  7: '#22D3EE', // Anonymized P1
  8: '#FB7185', // Buyer
}

interface CustomNodeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  payload?: { name: string }
}

const CustomNode = ({ x = 0, y = 0, width = 0, height = 0, index = 0, payload }: CustomNodeProps) => {
  const color = NODE_COLORS[index] ?? '#22D3EE'
  return (
    <Layer>
      <Rectangle x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.7} stroke={color} />
      <text
        x={x + width + 8}
        y={y + height / 2}
        fontFamily="var(--font-jetbrains)"
        fontSize={11}
        fill="#e2e8f0"
        textAnchor="start"
        alignmentBaseline="middle"
      >
        {payload?.name ?? ''}
      </text>
    </Layer>
  )
}

interface CustomLinkProps {
  sourceX?: number
  sourceY?: number
  sourceControlX?: number
  targetControlX?: number
  targetX?: number
  targetY?: number
  linkWidth?: number
  index?: number
  payload?: { source: { name: string }; target: { name: string }; value: number }
}

const CustomLink = (props: CustomLinkProps) => {
  const { sourceX = 0, sourceY = 0, sourceControlX = 0, targetControlX = 0, targetX = 0, targetY = 0, linkWidth = 0 } = props
  return (
    <path
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      stroke="url(#sankey-grad)"
      strokeWidth={linkWidth}
      strokeOpacity={0.4}
      fill="none"
    />
  )
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export const Section2ValueFlow = ({ scenario }: Props) => {
  const mult = FLOW_MULTIPLIER[scenario]
  const scaledData = {
    nodes: SANKEY_DATA.nodes,
    links: SANKEY_DATA.links.map((l) => ({ ...l, value: Math.round(l.value * mult) })),
  }
  // Final value into "Buyer" node = procurement size proxy in USDm
  const buyerFlow = scaledData.links[scaledData.links.length - 1].value

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        The bundled portfolio derives its value from the chain of custody from ambient signal to
        regulator-defensible record. Each stage is bound to a specific claim in one of the three
        filings; a buyer who picks up the triad inherits the chain end-to-end and does not have
        to integrate three vendors.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Inter-Patent Value Flow
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Sankey: ambient sources to regulator-defensible buyer outcome. Scenario amplifies procurement size.
        </p>

        <ResponsiveContainer width="100%" height={420}>
          <Sankey
            data={scaledData}
            nodePadding={20}
            nodeWidth={14}
            linkCurvature={0.5}
            iterations={64}
            node={<CustomNode />}
            link={<CustomLink />}
            margin={{ top: 10, right: 180, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="sankey-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </Sankey>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              {scaledData.links[0].value + scaledData.links[1].value + scaledData.links[2].value}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Entropy inflow</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)', color: '#34D399' }}>
              {scaledData.links[3].value}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">ARE composition</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)', color: '#22D3EE' }}>
              {scaledData.links[5].value}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">P1 mapping</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)', color: '#FB7185' }}>
              ${buyerFlow}M
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Procurement proxy</p>
          </div>
        </div>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Why the chain is licensable"
        text="Each stage is bound to a specific claim. Stage 2 to 4 sit inside P3 (Claims 1, 2, 3), stage 5 to 6 sit inside P1 (Claim 1 plus Claim 15 certificate). Stage 1 sits inside P2 (Claims 1, 2). A licensee picking the bundle inherits the full chain; a licensee picking only one patent must construct an alternative for the other layers from open prior art."
      />

      <DataTable
        headers={SANKEY_TABLE.headers}
        rows={SANKEY_TABLE.rows}
        accent="#34D399"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 4 layered defense; Patent claims P1 Claim 1 + 15, P2 Claims 1 + 2, P3 Claims 1 + 2 + 3.
      </p>
    </div>
  )
}
