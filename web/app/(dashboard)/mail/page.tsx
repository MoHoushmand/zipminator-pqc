import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quantum-Secure Mail | Zipminator",
  description:
    "Post-quantum email dashboard backed by ML-KEM-768 transport TLS and PQC envelope encryption.",
};

interface PillarStatus {
  label: string;
  value: string;
}

const TRANSPORT_STATUS: PillarStatus[] = [
  { label: "Transport TLS curve", value: "X25519MLKEM768 (hybrid)" },
  { label: "Envelope KEM", value: "ML-KEM-768" },
  { label: "Payload cipher", value: "AES-256-GCM" },
  { label: "Standard", value: "NIST FIPS 203" },
];

export default async function MailDashboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl tracking-tight">
          Quantum-Secure Mail
        </h1>
        <p className="text-muted-foreground">
          Pillar 7 of Zipminator. Implements NIST FIPS 203 (ML-KEM-768)
          via X25519MLKEM768 hybrid TLS and a PQC envelope at the
          application layer.
        </p>
      </header>

      <section aria-labelledby="pqc-stack-heading" className="space-y-3">
        <h2 id="pqc-stack-heading" className="text-xl font-medium">
          PQC stack
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TRANSPORT_STATUS.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-border/50 bg-card/40 p-4"
            >
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="font-mono text-base">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="inbox-heading" className="space-y-3">
        <h2 id="inbox-heading" className="text-xl font-medium">
          Inbox
        </h2>
        <p className="text-sm text-muted-foreground">
          The live mailbox view is served by the non-dashboard mail route
          at <code>/mail</code>. This route group page is the entry point
          under the authenticated dashboard layout.
        </p>
      </section>
    </div>
  );
}
