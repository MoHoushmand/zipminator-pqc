'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BlueprintSidebar } from '@/components/blueprint/BlueprintSidebar'
import { BlueprintSection } from '@/components/blueprint/BlueprintSection'
import { type BpScenario } from '@/components/blueprint/BlueprintScenarioToggle'
import { SECTION_LIST } from '@/lib/portfolio-data'

import { Section1Stack } from '@/components/portfolio/sections/Section1Stack'
import { Section2ValueFlow } from '@/components/portfolio/sections/Section2ValueFlow'
import { Section3RiskVsCapture } from '@/components/portfolio/sections/Section3RiskVsCapture'
import { Section4ScenarioWaterfall } from '@/components/portfolio/sections/Section4ScenarioWaterfall'
import { Section5RegulatoryRadar } from '@/components/portfolio/sections/Section5RegulatoryRadar'
import { Section6TamTreemap } from '@/components/portfolio/sections/Section6TamTreemap'
import { Section7Comparables } from '@/components/portfolio/sections/Section7Comparables'
import { Section8RevenueArea } from '@/components/portfolio/sections/Section8RevenueArea'
import { Section9ActionTimeline } from '@/components/portfolio/sections/Section9ActionTimeline'
import { Section10Highlights } from '@/components/portfolio/sections/Section10Highlights'

const HERO_KPIS: { label: string; value: string; sub: string; accent: string }[] = [
  { label: 'Patents Filed', value: '3', sub: 'P1 + P2 + P3 at Patentstyret', accent: '#22D3EE' },
  { label: 'Bundled NOK Range', value: '1.29-4.70B', sub: 'NO + US + EP, 10-yr base case', accent: '#F59E0B' },
  { label: 'USD Range', value: '$120-445M', sub: 'Bundled, base case', accent: '#34D399' },
  { label: 'Strategic Ceiling', value: 'NOK 15B', sub: 'Reference + Tier-1 + T1 closure', accent: '#A78BFA' },
  { label: 'Sections', value: '10', sub: 'Source to action timeline', accent: '#FB7185' },
  { label: 'Total Claims', value: '46', sub: 'P1 15 + P2 14 + P3 17', accent: '#6366f1' },
  { label: 'Comparable', value: '$5.6B', sub: 'SandboxAQ Apr 2024 round', accent: '#22c55e' },
  { label: 'Risk Surface', value: '$2-3.3T', sub: 'Citi 2026 single-bank scenario', accent: '#ef4444' },
]

export default function PortfolioPage() {
  const [scenario, setScenario] = useState<BpScenario>('moderate')
  const [activeId, setActiveId] = useState(SECTION_LIST[0].id)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id)
        break
      }
    }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    })

    SECTION_LIST.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [handleIntersect])

  return (
    <>
      <BlueprintSidebar
        sections={SECTION_LIST}
        activeId={activeId}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      <main className="lg:ml-60">
        {/* Hero */}
        <header className="relative px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 max-w-6xl mx-auto text-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.15), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167,139,250,0.1), transparent 60%)',
            }}
          />

          <p
            className="relative text-xs font-mono tracking-[0.25em] uppercase mb-4"
            style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}
          >
            QDaria AS  ·  Portfolio Synthesis  ·  May 2026
          </p>
          <h1
            className="relative text-4xl lg:text-6xl font-bold text-slate-50 mb-6"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            Three-Patent PQC Portfolio
          </h1>
          <p
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-4"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Source, audit, and application layers of a post-quantum data-protection stack.
            Filed at Patentstyret, March to April 2026, on Paris-Convention priority.
          </p>
          <p
            className="text-sm text-slate-500 max-w-xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            46 claims across three filings. 156 qubits IBM Quantum entropy. 6.8 MB harvested.
            Bundled NOK 1.29 to 4.70B over 10 years; strategic ceiling NOK 5 to 15B [unverified upper bound].
          </p>

          {/* Hero KPI grid: 4x2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
            {HERO_KPIS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: `linear-gradient(135deg, ${s.accent}12, rgba(15,23,42,0.8))`,
                  border: `1px solid ${s.accent}40`,
                  boxShadow: `0 0 24px ${s.accent}18, 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p
                  className="text-3xl font-bold text-slate-50 mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains)', textShadow: `0 0 20px ${s.accent}40` }}
                >
                  {s.value}
                </p>
                <p className="text-xs font-medium text-slate-300 mt-1">{s.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Sections */}
        <BlueprintSection id="stack" number={1} title="Source-Audit-Application Stack">
          <Section1Stack scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="value-flow" number={2} title="Inter-Patent Value Flow">
          <Section2ValueFlow scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="risk-vs-capture" number={3} title="Risk Mitigated vs Value Captured">
          <Section3RiskVsCapture scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="scenario-waterfall" number={4} title="Portfolio Value Waterfall">
          <Section4ScenarioWaterfall scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="regulatory-radar" number={5} title="Regulatory Coverage Radar">
          <Section5RegulatoryRadar scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="tam-treemap" number={6} title="PQC TAM by Segment">
          <Section6TamTreemap scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="comparables" number={7} title="Comparable PQC Plays">
          <Section7Comparables scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="revenue-area" number={8} title="Cumulative Revenue 2026 to 2036">
          <Section8RevenueArea scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="action-timeline" number={9} title="12-Month Action Timeline">
          <Section9ActionTimeline scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="highlights" number={10} title="Twelve Portfolio Highlights">
          <Section10Highlights scenario={scenario} />
        </BlueprintSection>

        {/* Footer */}
        <footer className="px-6 py-16 max-w-6xl mx-auto text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            QDaria AS  ·  Oslo, Norway  ·  mo@qdaria.com  ·  2026-05-18 synthesis
          </p>
          <p className="text-[10px] text-slate-600 mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Source: docs/ip/PORTFOLIO_SIGNIFICANCE.md. Patent applications filed at Patentstyret on Paris-Convention priority.
            Numbers carrying [unverified] tags are explicit; all other figures derive from cited TAM anchors and per-patent claim analyses.
            Implements NIST FIPS 203 (ML-KEM-768); verified against NIST KAT test vectors.
          </p>
        </footer>
      </main>
    </>
  )
}
