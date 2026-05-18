'use client'

import { motion } from 'framer-motion'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { ACTION_TIMELINE, type BpScenario } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

const WORKSTREAMS = ['Publish', 'Prosecute', 'License', 'Audit', 'Position']
const MONTH_LABELS = ['May 26', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan 27', 'Feb', 'Mar', 'Apr']

// Scenario shifts execution speed via duration multiplier (visible)
const SPEEDUP: Record<BpScenario, number> = {
  conservative: 1.0,
  moderate: 0.85,
  optimistic: 0.7,
}

const WORKSTREAM_ACCENT: Record<string, string> = {
  Publish: '#22D3EE',
  Prosecute: '#A78BFA',
  License: '#F59E0B',
  Audit: '#34D399',
  Position: '#FB7185',
}

export const Section9ActionTimeline = ({ scenario }: Props) => {
  const speedup = SPEEDUP[scenario]
  const totalMonths = 12
  const colW = 100 / totalMonths

  // Adjust durations per scenario
  const rows = ACTION_TIMELINE.map((row) => ({
    ...row,
    durationMonths: Math.max(1, Math.round(row.durationMonths * speedup)),
  }))

  const tasksByWorkstream = WORKSTREAMS.map((ws) => ({
    workstream: ws,
    accent: WORKSTREAM_ACCENT[ws],
    tasks: rows.filter((r) => r.workstream === ws),
  }))

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        Twelve-month action plan that converts the floor valuation into the bundled range.
        Five workstreams run in parallel: publication closure, prosecution against the
        Paris-Convention windows, licensee outreach, regulatory audit, and positioning.
        Optimistic scenario shrinks every task to 70% of conservative duration.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-baseline justify-between mb-6">
          <h3
            className="text-lg font-semibold text-slate-100"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            12-Month Action Timeline
          </h3>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#A78BFA' }}>
            Scenario speedup: {Math.round((1 - speedup) * 100)}%
          </p>
        </div>

        {/* Month header */}
        <div className="flex items-center gap-2 mb-4 pl-32">
          <div className="flex-1 grid grid-cols-12 gap-0">
            {MONTH_LABELS.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-center text-slate-500 border-l border-white/5 py-1"
                style={{ fontFamily: 'var(--font-jetbrains)' }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Workstreams */}
        <div className="space-y-6">
          {tasksByWorkstream.map((ws) => (
            <div key={ws.workstream}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: ws.accent, boxShadow: `0 0 8px ${ws.accent}` }}
                />
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: ws.accent, fontFamily: 'var(--font-jetbrains)' }}
                >
                  {ws.workstream}
                </p>
              </div>
              <div className="space-y-1.5">
                {ws.tasks.map((task, ti) => {
                  const leftPct = (task.startMonth / totalMonths) * 100
                  const widthPct = Math.min((task.durationMonths / totalMonths) * 100, 100 - leftPct)
                  return (
                    <div key={ti} className="flex items-center gap-2">
                      <div
                        className="w-32 text-[11px] text-slate-400 truncate text-right pr-2"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                        title={task.task}
                      >
                        {task.task}
                      </div>
                      <div className="flex-1 relative h-6 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {/* Gridlines */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                          <div
                            key={g}
                            className="absolute top-0 bottom-0 w-px"
                            style={{ left: `${g * colW}%`, background: 'rgba(255,255,255,0.04)' }}
                          />
                        ))}
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${widthPct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: ti * 0.04 }}
                          className="absolute top-1 bottom-1 rounded flex items-center px-2"
                          style={{
                            left: `${leftPct}%`,
                            background: `linear-gradient(90deg, ${task.color}88, ${task.color}55)`,
                            border: `1px solid ${task.color}`,
                            boxShadow: `0 0 12px ${task.color}40`,
                          }}
                          title={task.deliverable}
                        >
                          <span
                            className="text-[9px] font-mono whitespace-nowrap text-slate-100 truncate"
                            style={{ fontFamily: 'var(--font-jetbrains)' }}
                          >
                            {task.deliverable}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <CalloutBlock
        type="warning"
        title="Paris-Convention deadlines"
        text="The PCT-filing deadlines are absolute: P1 by 2027-03-24, P2 by 2027-04-04, P3 by 2027-04-05. The Prosecute row above is sized against those windows in calendar weeks, not estimation; missing any deadline drops the corresponding bundled valuation toward the single-jurisdiction floor."
      />

      <DataTable
        headers={['Workstream', 'Task', 'Start', 'Months', 'Deliverable']}
        rows={rows.map((r) => [
          r.workstream,
          r.task,
          MONTH_LABELS[r.startMonth] ?? 'TBD',
          String(r.durationMonths),
          r.deliverable,
        ])}
        accent="#FB7185"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 12 next-twelve-months action list. Paris-Convention deadlines per Norwegian Patents Act and WIPO PCT.
      </p>
    </div>
  )
}
