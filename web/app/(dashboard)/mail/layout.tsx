import type { ReactNode } from "react";

interface MailDashboardLayoutProps {
  children: ReactNode;
}

export default async function MailDashboardLayout({
  children,
}: MailDashboardLayoutProps) {
  return (
    <section
      aria-label="Quantum-secure mail dashboard"
      className="flex h-full w-full flex-col"
    >
      {children}
    </section>
  );
}
