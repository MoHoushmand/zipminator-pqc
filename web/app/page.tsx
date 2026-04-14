import { Hero } from '@/components/Hero'
import { Problem } from '@/components/Problem'
import { PillarsGrid } from '@/components/PillarsGrid'
import { Architecture } from '@/components/Architecture'
import { Proof } from '@/components/Proof'
import { TrustAndUse } from '@/components/TrustAndUse'
import { FinalCTA } from '@/components/FinalCTA'

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <PillarsGrid />
      <Architecture />
      <Proof />
      <TrustAndUse />
      <FinalCTA />
    </>
  )
}
