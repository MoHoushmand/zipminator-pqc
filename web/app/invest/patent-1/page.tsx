'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BlueprintSidebar } from '@/components/blueprint/BlueprintSidebar'
import { BlueprintSection } from '@/components/blueprint/BlueprintSection'
import {
  BlueprintScenarioToggle,
  type BpScenario,
} from '@/components/blueprint/BlueprintScenarioToggle'
import { SECTION_LIST, HERO_KPIS } from '@/lib/patent-1-data'

import { Section1IrreversibilityPyramid } from '@/components/patent-1/sections/Section1IrreversibilityPyramid'
import { Section2OtpDestroyFlow } from '@/components/patent-1/sections/Section2OtpDestroyFlow'
import { Section3SecurityBound } from '@/components/patent-1/sections/Section3SecurityBound'
import { Section4ClaimHeatmap } from '@/components/patent-1/sections/Section4ClaimHeatmap'
import { Section5EntropyHarvest } from '@/components/patent-1/sections/Section5EntropyHarvest'
import { Section6CompetitiveRadar } from '@/components/patent-1/sections/Section6CompetitiveRadar'
import { Section7RegulatoryGantt } from '@/components/patent-1/sections/Section7RegulatoryGantt'
import { Section8MarketFunnel } from '@/components/patent-1/sections/Section8MarketFunnel'
import { Section9ValueWaterfall } from '@/components/patent-1/sections/Section9ValueWaterfall'
import { Section10RevenueArea } from '@/components/patent-1/sections/Section10RevenueArea'

export default function Patent1Page() {
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

      <main className="lg:ml-60 h-screen overflow-y-auto">
        {/* Hero */}
        <header className="relative px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 max-w-6xl mx-auto text-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.20), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167,139,250,0.10), transparent 60%)',
            }}
          />

          <p
            className="relative text-xs font-mono tracking-[0.25em] uppercase mb-4"
            style={{ color: '#22D3EE', fontFamily: 'var(--font-jetbrains)' }}
          >
            QDaria AS · Patent 1 · Confidential · May 2026
          </p>
          <h1
            className="relative text-4xl lg:text-6xl font-bold text-slate-50 mb-6"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            Quantum-Certified Anonymization
          </h1>
          <p
            className="text-lg text-slate-300 max-w-3xl mx-auto mb-4"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Norwegian Patent Application 20260384. QRNG-OTP-Destroy:
            information-theoretically irreversible anonymization via the Born rule. Holds even
            if P equals NP.
          </p>
          <p
            className="text-sm text-slate-500 max-w-2xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            15 claims (3 independent, 12 dependent). 17-page companion paper at internal score
            0.97/1.0. 6.8 MB Born-rule entropy from IBM Quantum (156 qubits) ibm_kingston and
            ibm_fez.
          </p>

          {/* Mobile scenario toggle */}
          <div className="lg:hidden flex justify-center">
            <BlueprintScenarioToggle value={scenario} onChange={setScenario} />
          </div>

          {/* 4x2 KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
            {HERO_KPIS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: `linear-gradient(135deg, ${s.accent}14, rgba(15,23,42,0.8))`,
                  border: `1px solid ${s.accent}40`,
                  boxShadow: `0 0 24px ${s.accent}18, 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p
                  className="text-2xl lg:text-3xl font-bold text-slate-50 mb-1"
                  style={{
                    fontFamily: 'var(--font-jetbrains)',
                    textShadow: `0 0 20px ${s.accent}40`,
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs font-medium text-slate-300 mt-1">{s.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </header>

        <BlueprintSection
          id="irreversibility-pyramid"
          number={1}
          title="Irreversibility Pyramid"
        >
          <Section1IrreversibilityPyramid scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="otp-destroy-flow" number={2} title="QRNG-OTP-Destroy Flow">
          <Section2OtpDestroyFlow scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="security-bound" number={3} title="Security Bound">
          <Section3SecurityBound scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="claim-heatmap" number={4} title="Claim Heatmap">
          <Section4ClaimHeatmap scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="entropy-harvest" number={5} title="Entropy Harvest">
          <Section5EntropyHarvest scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="competitive-radar" number={6} title="Competitive Radar">
          <Section6CompetitiveRadar scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="regulatory-gantt" number={7} title="Regulatory Timeline">
          <Section7RegulatoryGantt scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="market-funnel" number={8} title="Market Funnel">
          <Section8MarketFunnel scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="value-waterfall" number={9} title="Value Waterfall">
          <Section9ValueWaterfall scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="revenue-area" number={10} title="Revenue Contribution">
          <Section10RevenueArea scenario={scenario} />
        </BlueprintSection>

        <footer className="px-6 py-16 max-w-6xl mx-auto text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-mono">
            QDaria AS · Oslo, Norway · mo@qdaria.com · 2026
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            Patent application 20260384 filed at Patentstyret 2026-03-24. This document is
            confidential and intended for authorized recipients only. Implements NIST FIPS 203
            (ML-KEM-768) at the transport layer; verified against NIST KAT test vectors.
          </p>
        </footer>
      </main>
    </>
  )
}
