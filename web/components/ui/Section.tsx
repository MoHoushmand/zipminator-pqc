import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

type SectionVariant = "default" | "elevated" | "inverted"
type SectionDensity = "compact" | "normal" | "loose"

interface SectionProps extends ComponentProps<"section"> {
  variant?: SectionVariant
  density?: SectionDensity
  container?: boolean
}

const variantClass: Record<SectionVariant, string> = {
  default: "bg-transparent",
  elevated: "bg-[color:var(--bg-elevated)]/40 backdrop-blur-sm",
  inverted: "bg-[color:var(--bg-inverted)]/60 backdrop-blur-sm",
}

const densityClass: Record<SectionDensity, string> = {
  compact: "py-16 md:py-20",
  normal: "py-24 md:py-32",
  loose: "py-28 md:py-40",
}

export const Section = ({
  variant = "default",
  density = "normal",
  container = true,
  className,
  children,
  ...rest
}: SectionProps) => (
  <section
    className={cn("relative", variantClass[variant], densityClass[density], className)}
    {...rest}
  >
    {container ? <div className="container-custom relative">{children}</div> : children}
  </section>
)
