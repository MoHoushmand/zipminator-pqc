'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BlueprintSidebar } from '@/components/blueprint/BlueprintSidebar'
import { BlueprintSection } from '@/components/blueprint/BlueprintSection'
import { BlueprintScenarioToggle, type BpScenario } from '@/components/blueprint/BlueprintScenarioToggle'
import { SECTION_LIST, HERO_KPIS } from '@/lib/patent-2-data'

import { Section1CsiPipeline } from '@/components/patent-2/sections/Section1CsiPipeline'
import { Section2EntropyTriple } from '@/components/patent-2/sections/Section2EntropyTriple'
import { Section3PuekGauges } from '@/components/patent-2/sections/Section3PuekGauges'
import { Section4DeviceSunburst } from '@/components/patent-2/sections/Section4DeviceSunburst'
import { Section5CostScatter } from '@/components/patent-2/sections/Section5CostScatter'
import { Section6HardwareCompare } from '@/components/patent-2/sections/Section6HardwareCompare'
import { Section7IoTBubbleTimeline } from '@/components/patent-2/sections/Section7IoTBubbleTimeline'
import { Section8LicenseFlow } from '@/components/patent-2/sections/Section8LicenseFlow'
import { Section9RoyaltyHeatmap } from '@/components/patent-2/sections/Section9RoyaltyHeatmap'
import { Section10MoatRadar } from '@/components/patent-2/sections/Section10MoatRadar'

export default function Patent2Page() {
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
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(52,211,153,0.18), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(34,211,238,0.12), transparent 60%)',
            }}
          />

          <p
            className="relative text-xs font-mono tracking-[0.25em] uppercase mb-4"
            style={{ color: '#34D399', fontFamily: 'var(--font-jetbrains)' }}
          >
            QDaria AS · Patent 2 · Filed 2026-04-04 · Confidential
          </p>
          <h1
            className="relative text-4xl lg:text-6xl font-bold text-slate-50 mb-6"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            Unilateral CSI Entropy <span style={{ color: '#34D399' }}>+ PUEK</span>
          </h1>
          <p
            className="text-lg text-slate-300 max-w-3xl mx-auto mb-4"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            First single-device entropy primitive from WiFi Channel State Information. Fifteen years
            of bilateral CSI work re-framed unilaterally, validated against the NIST SP 800-90B IID
            battery, and tied to post-quantum key derivation through HKDF-SHA256.
          </p>
          <p
            className="text-sm text-slate-500 max-w-2xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            5.50 bits/byte from 343 Nexmon frames on commodity Broadcom BCM4339. Within 13% bpb of
            IBM Quantum at four to six orders of magnitude lower unit cost. Reads on every 802.11n,
            ac, ax, and be chip already in the field.
          </p>

          {/* Mobile scenario toggle */}
          <div className="lg:hidden flex justify-center">
            <BlueprintScenarioToggle value={scenario} onChange={setScenario} />
          </div>

          {/* Hero stats: 4x2 KPI grid */}
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

        {/* Sections */}
        <BlueprintSection id="csi-pipeline" number={1} title="CSI Extraction Pipeline">
          <Section1CsiPipeline scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="entropy-triple" number={2} title="Min-Entropy Triple">
          <Section2EntropyTriple scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="puek-gauges" number={3} title="PUEK Security Profiles">
          <Section3PuekGauges scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="device-sunburst" number={4} title="802.11 Device Universe">
          <Section4DeviceSunburst scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="cost-scatter" number={5} title="Cost vs Entropy">
          <Section5CostScatter scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="hardware-compare" number={6} title="Reference Hardware">
          <Section6HardwareCompare scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="iot-timeline" number={7} title="IoT Bubble Timeline">
          <Section7IoTBubbleTimeline scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="license-flow" number={8} title="License Revenue Flow">
          <Section8LicenseFlow scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="royalty-heatmap" number={9} title="Royalty Heatmap">
          <Section9RoyaltyHeatmap scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="moat-radar" number={10} title="Competitive Moat">
          <Section10MoatRadar scenario={scenario} />
        </BlueprintSection>

        {/* Footer */}
        <footer className="px-6 py-16 max-w-6xl mx-auto text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-mono">
            QDaria AS · Oslo, Norway · mo@qdaria.com · Patent 2 filed 2026-04-04 at Patentstyret
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            This document is confidential and intended for authorized recipients only. The CSI
            extraction pipeline and PUEK derivation are patent-pending. Implements NIST FIPS 203
            (ML-KEM-768) at the platform layer; validated against the NIST SP 800-90B IID battery
            at the entropy-source layer.
          </p>
        </footer>
      </main>
    </>
  )
}
