import Image from 'next/image'
import type { PillarSlug } from '@/lib/blueprint-data'

interface PillarIconProps {
  slug: PillarSlug
  color: string
  size?: number
  className?: string
}

export const PillarIcon = ({ slug, color, size = 40, className }: PillarIconProps) => {
  const src = `/logos/pillars/${slug}.svg`
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${color}1a, transparent 70%)`,
        border: `1px solid ${color}33`,
        overflow: 'hidden',
      }}
      aria-label={slug}
      role="img"
      data-slug={slug}
    >
      <Image
        src={src}
        alt={slug}
        width={size - 12}
        height={size - 12}
        style={{
          filter: 'brightness(0) invert(1)',
          opacity: 0.9,
        }}
        unoptimized
      />
    </span>
  )
}
