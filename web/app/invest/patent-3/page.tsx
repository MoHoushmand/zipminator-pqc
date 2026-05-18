'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BlueprintSidebar } from '@/components/blueprint/BlueprintSidebar'
import { BlueprintSection } from '@/components/blueprint/BlueprintSection'
import { BlueprintScenarioToggle, type BpScenario } from '@/components/blueprint/BlueprintScenarioToggle'
import { SECTION_LIST, HERO_KPIS } from '@/lib/patent-3-data'

import { Section1HeterogeneousMixing } from '@/components/patent-3/sections/Section1HeterogeneousMixing'
import { Section2MerkleProvenance } from '@/components/patent-3/sections/Section2MerkleProvenance'
import { Section3AreNineDomains } from '@/components/patent-3/sections/Section3AreNineDomains'
import { Section4GracefulDegradation } from '@/components/patent-3/sections/Section4GracefulDegradation'
import { Section5NistSp80090BGauges } from '@/components/patent-3/sections/Section5NistSp80090BGauges'
import { Section6T1GapRoadmap } from '@/components/patent-3/sections/Section6T1GapRoadmap'
import { Section7RegulatedBuyerSunburst } from '@/components/patent-3/sections/Section7RegulatedBuyerSunburst'
import { Section8ConditionerEfficiency } from '@/components/patent-3/sections/Section8ConditionerEfficiency'
import { Section9CertificateRoyalty } from '@/components/patent-3/sections/Section9CertificateRoyalty'
import { Section10PrecedentTimeline } from '@/components/patent-3/sections/Section10PrecedentTimeline'

export default function Patent3Page() {
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
    <div className="h-screen overflow-y-auto">
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
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(167,139,250,0.18), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(34,211,238,0.10), transparent 60%)',
            }}
          />

          <p
            className="relative text-xs font-mono tracking-[0.25em] uppercase mb-4"
            style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}
          >
            QDaria AS · Patent 3 · Filed 2026-04-05
          </p>
          <h1
            className="relative text-4xl lg:text-6xl font-bold text-slate-50 mb-6"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            Certified Heterogeneous Entropy
          </h1>
          <p
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-4"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Algebraic Randomness Extraction over nine number domains, three-source quantum mixing,
            and Merkle-rooted provenance certificates designed to support DORA Art. 7 alignment.
          </p>
          <p
            className="text-sm text-slate-500 max-w-xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            17 claims · 3 quantum sources · 6.8 MB IBM Quantum entropy harvested · Merkle audit chain
            aligned with NIST SP 800-90B health monitoring patterns.
          </p>

          <div className="lg:hidden flex justify-center">
            <BlueprintScenarioToggle value={scenario} onChange={setScenario} />
          </div>

          {/* Hero KPI grid 4x2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
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
                  className="text-xl lg:text-2xl font-bold text-slate-50 mb-1"
                  style={{
                    fontFamily: 'var(--font-jetbrains)',
                    textShadow: `0 0 20px ${s.accent}40`,
                  }}
                >
                  {s.value}
                </p>
                <p className="text-[11px] font-medium text-slate-300 mt-1 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Sections */}
        <BlueprintSection id="mixing" number={1} title="Heterogeneous 3-Source Mixing">
          <Section1HeterogeneousMixing scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="merkle" number={2} title="Merkle Provenance Certificate">
          <Section2MerkleProvenance scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="domains" number={3} title="ARE: Nine Number Domains">
          <Section3AreNineDomains scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="degradation" number={4} title="Graceful Degradation">
          <Section4GracefulDegradation scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="gauges" number={5} title="NIST SP 800-90B Health Gauges">
          <Section5NistSp80090BGauges scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="gaps" number={6} title="T1-T5 + M1-M3 Publication Roadmap">
          <Section6T1GapRoadmap scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="buyers" number={7} title="Regulated Buyer Sunburst">
          <Section7RegulatedBuyerSunburst scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="conditioner" number={8} title="ARE Conditioner Efficiency">
          <Section8ConditionerEfficiency scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="royalty" number={9} title="Per-Key Certificate Royalty">
          <Section9CertificateRoyalty scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="precedent" number={10} title="Precedent Timeline">
          <Section10PrecedentTimeline scenario={scenario} />
        </BlueprintSection>

        <footer className="px-6 py-16 max-w-6xl mx-auto text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-mono">
            QDaria AS · Oslo, Norway · mo@qdaria.com · 2026
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            Patent 3 of three. Filed at Norwegian Patentstyret 2026-04-05.
            PCT deadline 2027-04-05 (Paris Convention window).
          </p>
        </footer>
      </main>
    </div>
  )
}
