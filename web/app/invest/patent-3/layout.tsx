import { Fraunces, JetBrains_Mono, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata = {
  title: 'Patent 3 · CHE + ARE Provenance | QDaria',
  description: 'Certified Heterogeneous Entropy with Algebraic Randomness Extraction and Merkle provenance. Norwegian Patent 3, filed 2026-04-05.',
}

export default function Patent3Layout({
  children,
}: {
  children: React.ReactNode
}) {
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
