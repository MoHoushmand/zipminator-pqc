'use client'

import { motion } from 'framer-motion'
import { CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { HIGHLIGHTS, type BpScenario } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

// Scenario controls weighting tag on each card
const SCENARIO_TAG: Record<BpScenario, string> = {
  conservative: 'Floor case',
  moderate: 'Base case',
  optimistic: 'Ceiling case',
}

const SCENARIO_COLOR: Record<BpScenario, string> = {
  conservative: '#22D3EE',
  moderate: '#F59E0B',
  optimistic: '#34D399',
}

export const Section10Highlights = ({ scenario }: Props) => (
  <div className="space-y-10">
    <p
      className="text-[15px] leading-relaxed text-slate-300"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      Twelve deck-ready highlights pulled verbatim from the portfolio brief. Use any subset
      in pitch decks, regulator briefings, or licensing conversations; each card cites its
      source so the underlying claim or measurement can be checked.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {HIGHLIGHTS.map((h, i) => (
        <motion.div
          key={h.n}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: (i % 6) * 0.06 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${h.accent}10, rgba(15,23,42,0.6))`,
            border: `1px solid ${h.accent}35`,
            boxShadow: `0 0 24px ${h.accent}15, 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Number badge */}
          <div className="flex items-start justify-between mb-3">
            <span
              className="flex-none w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: `${h.accent}22`,
                color: h.accent,
                border: `1px solid ${h.accent}55`,
                fontFamily: 'var(--font-jetbrains)',
              }}
            >
              {String(h.n).padStart(2, '0')}
            </span>
            <span
              className="text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded"
              style={{
                background: `${SCENARIO_COLOR[scenario]}15`,
                color: SCENARIO_COLOR[scenario],
                border: `1px solid ${SCENARIO_COLOR[scenario]}30`,
              }}
            >
              {SCENARIO_TAG[scenario]}
            </span>
          </div>

          <h3
            className="text-base font-semibold text-slate-50 mb-2"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {h.title}
          </h3>
          <p
            className="text-[13px] leading-relaxed text-slate-300 mb-4"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {h.body}
          </p>
          <p
            className="text-[10px] text-slate-500"
            style={{ fontFamily: 'var(--font-jetbrains)' }}
          >
            {h.citation}
          </p>

          {/* Decorative corner glow */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{
              background: `radial-gradient(circle, ${h.accent}25, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
        </motion.div>
      ))}
    </div>

    <CalloutBlock
      type="insight"
      title="How to use these"
      text="Highlights 1, 2, 3 and 4 are the four 'firsts' the portfolio claims; pair them with the prior-art analysis in each per-patent dossier when defending the novelty position. Highlights 5, 6 and 7 are the hardware / standards anchors; use them in regulator briefings. Highlights 9 and 10 are the bundle thesis; use them in licensing conversations. Highlights 11 and 12 are the valuation envelope; use them in fundraising. Pick the subset that matches the audience."
    />

    <p
      className="text-[10px] text-gray-500"
      style={{ fontFamily: 'var(--font-jetbrains)' }}
    >
      Source: PORTFOLIO_SIGNIFICANCE.md Section 10 top twelve portfolio highlights (deck-ready), verified verbatim against the master brief.
    </p>
  </div>
)
