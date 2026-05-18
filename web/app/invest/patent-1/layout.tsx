import { Fraunces, JetBrains_Mono, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata = {
  title: 'Patent 1 — Quantum-Certified Anonymization | QDaria',
  description: 'Norwegian Patent Application 20260384 (filed 2026-03-24). Information-theoretic anonymization via QRNG-OTP-Destroy with Born-rule irreversibility.',
}

export default function Patent1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`h-screen overflow-hidden ${fraunces.variable} ${jetbrains.variable} ${dmSans.variable}`}
      style={{ background: '#020817' }}
    >
      <style>{`
        #site-nav, #site-footer { display: none !important; }
      `}</style>
      {children}
    </div>
  )
}
