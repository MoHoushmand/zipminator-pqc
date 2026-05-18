'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  MERKLE_LEAVES,
  PROVENANCE_RECORD_FIELDS,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

export const Section2MerkleProvenance = ({ scenario: _scenario }: Props) => {
  const [openLeaf, setOpenLeaf] = useState<string | null>(null)
  const accent = '#A78BFA'

  // Tree layout: 4 leaves -> 2 internal -> 1 root
  const W = 720
  const H = 360
  const leafY = 280
  const internalY = 170
  const rootY = 50

  const leafXs = [120, 320, 480, 640]
  const internalXs = [(leafXs[0] + leafXs[1]) / 2, (leafXs[2] + leafXs[3]) / 2]
  const rootX = (internalXs[0] + internalXs[1]) / 2

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Each composition emits a ProvenanceCertificate whose leaves are canonically serialized ProvenanceRecord blobs. The root hash is independently verifiable by an auditor who does not have access to the underlying entropy.',
          'The construction binds source identity, contributed byte count, per-source min-entropy, and the SP 800-90B health status to a single SHA-256 leaf hash. An auditor recomputes the Merkle root from the leaves; if any source record was altered, the root changes.',
        ]}
      />

      <GlowCard accent={accent}>
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Merkle Provenance Tree
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Click any leaf to expand the canonical ProvenanceRecord serialization.
        </p>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 640 }}>
            <defs>
              <linearGradient id="p3-merkle-edge" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.15} />
              </linearGradient>
            </defs>

            {/* Edges from leaves to internal */}
            {[0, 1, 2, 3].map((i) => (
              <motion.line
                key={`edge-li-${i}`}
                x1={leafXs[i]}
                y1={leafY - 22}
                x2={internalXs[Math.floor(i / 2)]}
                y2={internalY + 22}
                stroke="url(#p3-merkle-edge)"
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              />
            ))}

            {/* Edges from internal to root */}
            {[0, 1].map((i) => (
              <motion.line
                key={`edge-ir-${i}`}
                x1={internalXs[i]}
                y1={internalY - 22}
                x2={rootX}
                y2={rootY + 22}
                stroke={accent}
                strokeWidth={2}
                strokeOpacity={0.6}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.85 + i * 0.1 }}
              />
            ))}

            {/* Root */}
            <motion.g
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 1.15 }}
            >
              <rect
                x={rootX - 90}
                y={rootY - 22}
                width={180}
                height={44}
                rx={10}
                fill={accent}
                fillOpacity={0.18}
                stroke={accent}
                strokeWidth={2}
              />
              <text
                x={rootX}
                y={rootY - 4}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={12}
                fontWeight={700}
                fontFamily="var(--font-dm-sans)"
              >
                Merkle Root
              </text>
              <text
                x={rootX}
                y={rootY + 12}
                textAnchor="middle"
                fill={accent}
                fontSize={10}
                fontFamily="var(--font-jetbrains)"
              >
                sha256:b7e2...
              </text>
            </motion.g>

            {/* Internal nodes */}
            {internalXs.map((cx, i) => (
              <motion.g
                key={`int-${i}`}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
              >
                <rect
                  x={cx - 70}
                  y={internalY - 22}
                  width={140}
                  height={44}
                  rx={8}
                  fill={accent}
                  fillOpacity={0.10}
                  stroke={accent}
                  strokeWidth={1.4}
                />
                <text
                  x={cx}
                  y={internalY - 4}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize={11}
                  fontFamily="var(--font-dm-sans)"
                >
                  H{i + 1}
                </text>
                <text
                  x={cx}
                  y={internalY + 12}
                  textAnchor="middle"
                  fill={accent}
                  fontSize={9}
                  fontFamily="var(--font-jetbrains)"
                >
                  sha256(L{2 * i} || L{2 * i + 1})
                </text>
              </motion.g>
            ))}

            {/* Leaves (clickable) */}
            {MERKLE_LEAVES.map((leaf, i) => {
              const isOpen = openLeaf === leaf.id
              return (
                <motion.g
                  key={leaf.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setOpenLeaf(isOpen ? null : leaf.id)}
                >
                  <rect
                    x={leafXs[i] - 70}
                    y={leafY - 22}
                    width={140}
                    height={44}
                    rx={8}
                    fill={isOpen ? accent : accent}
                    fillOpacity={isOpen ? 0.32 : 0.08}
                    stroke={accent}
                    strokeWidth={isOpen ? 2 : 1.2}
                  />
                  <text
                    x={leafXs[i]}
                    y={leafY - 4}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="var(--font-dm-sans)"
                  >
                    {leaf.id} · {leaf.source.split(' ')[0]}
                  </text>
                  <text
                    x={leafXs[i]}
                    y={leafY + 12}
                    textAnchor="middle"
                    fill={accent}
                    fontSize={9}
                    fontFamily="var(--font-jetbrains)"
                  >
                    {isOpen ? 'expanded ↓' : 'click to expand'}
                  </text>
                </motion.g>
              )
            })}
          </svg>
        </div>

        <AnimatePresence>
          {openLeaf && (
            <motion.div
              key={openLeaf}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg p-4 mt-4 overflow-hidden"
              style={{
                background: 'rgba(15,23,42,0.85)',
                border: `1px solid ${accent}40`,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: accent, fontFamily: 'var(--font-jetbrains)' }}
              >
                Canonical ProvenanceRecord (leaf {openLeaf})
              </p>
              <pre
                className="text-xs text-slate-200 whitespace-pre-wrap break-all"
                style={{ fontFamily: 'var(--font-jetbrains)' }}
              >
                {MERKLE_LEAVES.find((l) => l.id === openLeaf)?.record}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        <p
          className="text-[10px] text-slate-500 mt-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/patent-3-che-are-provenance/beskrivelse.md · ProvenanceRecord serialization.
        </p>
      </GlowCard>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent={accent}
          headers={['Field', 'Type', 'Example']}
          rows={PROVENANCE_RECORD_FIELDS}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/patent-3-che-are-provenance/patentkrav.md Claim 2.
        </p>
      </motion.div>

      <CalloutBlock
        type="citation"
        title="Audit-grade lineage"
        text="The Merkle root is the artefact a Finanstilsynet examiner or an ENISA CSA conformity-assessment body actually requests. Patent 3 is the only construction in the QDaria portfolio that emits a per-key auditable lineage trail; it is designed to support DORA Art. 7 alignment."
      />
    </div>
  )
}
