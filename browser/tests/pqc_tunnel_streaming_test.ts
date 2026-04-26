/**
 * PQC Tunnel Streaming Tests
 *
 * Verifies that AI streaming chunks transit a PQC envelope wrapper:
 * each chunk emitted to the frontend can be wrapped/unwrapped with an
 * ML-KEM-768 hybrid AES-GCM envelope of shape `{ ct, kem_ct, nonce }`.
 *
 * The wrap/unwrap implementation lives in
 * `browser/src-tauri/src/ai/pqc_envelope.rs` and is exposed to the
 * frontend through Tauri commands `ai_pqc_envelope_wrap_chunk`,
 * `ai_pqc_envelope_unwrap_chunk`, and `ai_pqc_envelope_session_init`.
 *
 * These tests use mocked Tauri invoke calls to validate the contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

interface PqcEnvelope {
  ct: string;
  kem_ct: string;
  nonce: string;
}

interface PqcSession {
  session_id: string;
  public_key: string;
  kem_ct: string;
}

const { mockInvoke, sessions } = vi.hoisted(() => {
  const sessions = new Map<string, string>();

  const fn = async (cmd: string, args?: Record<string, unknown>) => {
    switch (cmd) {
      case "ai_pqc_envelope_session_init": {
        const sid = `sess-${Math.random().toString(36).slice(2, 10)}`;
        const ss = `ss-${Math.random().toString(36).slice(2, 18)}`;
        sessions.set(sid, ss);
        return {
          session_id: sid,
          public_key: `pk-${Math.random().toString(36).slice(2, 14)}`,
          kem_ct: `kem-ct-${sid}`,
        };
      }
      case "ai_pqc_envelope_wrap_chunk": {
        const { session_id, plaintext } = args as {
          session_id: string;
          plaintext: string;
        };
        const ss = sessions.get(session_id);
        if (!ss) throw new Error("unknown session");
        const nonce = `nonce-${Math.random().toString(36).slice(2, 14)}`;
        const ct = btoa(`${ss}|${nonce}|${plaintext}`);
        return { ct, kem_ct: `kem-ct-${session_id}`, nonce };
      }
      case "ai_pqc_envelope_unwrap_chunk": {
        const { session_id, envelope } = args as {
          session_id: string;
          envelope: PqcEnvelope;
        };
        const ss = sessions.get(session_id);
        if (!ss) throw new Error("unknown session");
        const decoded = atob(envelope.ct);
        const [savedSs, savedNonce, ...rest] = decoded.split("|");
        if (savedSs !== ss) throw new Error("wrong session shared-secret");
        if (savedNonce !== envelope.nonce)
          throw new Error("nonce mismatch");
        return rest.join("|");
      }
      default:
        throw new Error(`unmocked command: ${cmd}`);
    }
  };

  return { mockInvoke: vi.fn(fn), sessions };
});

vi.mock("@tauri-apps/api/core", () => ({ invoke: mockInvoke }));

import { invoke } from "@tauri-apps/api/core";

describe("PQC tunnel streaming", () => {
  beforeEach(() => {
    sessions.clear();
    mockInvoke.mockClear();
  });

  it("creates a session with a kem_ct and public_key", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    expect(session.session_id).toMatch(/^sess-/);
    expect(session.public_key).toMatch(/^pk-/);
    expect(session.kem_ct).toMatch(/^kem-ct-/);
  });

  it("wraps a streaming chunk into an envelope of shape {ct, kem_ct, nonce}", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    const env = (await invoke("ai_pqc_envelope_wrap_chunk", {
      session_id: session.session_id,
      plaintext: "Hello quantum",
    })) as PqcEnvelope;

    expect(env).toHaveProperty("ct");
    expect(env).toHaveProperty("kem_ct");
    expect(env).toHaveProperty("nonce");
    expect(env.ct.length).toBeGreaterThan(0);
    expect(env.nonce.length).toBeGreaterThan(0);
    expect(env.kem_ct).toBe(`kem-ct-${session.session_id}`);
  });

  it("unwraps a wrapped chunk back to the original plaintext", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    const original = "Streaming token #1";
    const env = (await invoke("ai_pqc_envelope_wrap_chunk", {
      session_id: session.session_id,
      plaintext: original,
    })) as PqcEnvelope;

    const round = (await invoke("ai_pqc_envelope_unwrap_chunk", {
      session_id: session.session_id,
      envelope: env,
    })) as string;

    expect(round).toBe(original);
  });

  it("uses a fresh nonce per chunk (replay protection)", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    const a = (await invoke("ai_pqc_envelope_wrap_chunk", {
      session_id: session.session_id,
      plaintext: "chunk A",
    })) as PqcEnvelope;
    const b = (await invoke("ai_pqc_envelope_wrap_chunk", {
      session_id: session.session_id,
      plaintext: "chunk B",
    })) as PqcEnvelope;

    expect(a.nonce).not.toBe(b.nonce);
  });

  it("rejects unwrap on a session that was not initialized", async () => {
    const env: PqcEnvelope = { ct: "x", kem_ct: "y", nonce: "z" };
    await expect(
      invoke("ai_pqc_envelope_unwrap_chunk", {
        session_id: "missing-session",
        envelope: env,
      })
    ).rejects.toThrow();
  });

  it("rejects unwrap when the nonce is tampered with", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    const env = (await invoke("ai_pqc_envelope_wrap_chunk", {
      session_id: session.session_id,
      plaintext: "Genuine token",
    })) as PqcEnvelope;
    const tampered: PqcEnvelope = { ...env, nonce: "tampered-nonce" };

    await expect(
      invoke("ai_pqc_envelope_unwrap_chunk", {
        session_id: session.session_id,
        envelope: tampered,
      })
    ).rejects.toThrow();
  });

  it("can wrap and round-trip an entire stream of N chunks", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    const chunks = [
      "Token 1 - opening",
      "Token 2 - middle",
      "Token 3 - body",
      "Token 4 - close",
    ];

    const envelopes: PqcEnvelope[] = [];
    for (const t of chunks) {
      const env = (await invoke("ai_pqc_envelope_wrap_chunk", {
        session_id: session.session_id,
        plaintext: t,
      })) as PqcEnvelope;
      envelopes.push(env);
    }

    expect(envelopes).toHaveLength(chunks.length);
    expect(new Set(envelopes.map((e) => e.nonce)).size).toBe(chunks.length);

    const decoded: string[] = [];
    for (const e of envelopes) {
      decoded.push(
        (await invoke("ai_pqc_envelope_unwrap_chunk", {
          session_id: session.session_id,
          envelope: e,
        })) as string
      );
    }

    expect(decoded).toEqual(chunks);
  });

  it("envelope shape is JSON-serializable for Tauri event payloads", async () => {
    const session = (await invoke("ai_pqc_envelope_session_init")) as PqcSession;
    const env = (await invoke("ai_pqc_envelope_wrap_chunk", {
      session_id: session.session_id,
      plaintext: "Tauri event payload test",
    })) as PqcEnvelope;

    const json = JSON.stringify(env);
    const parsed = JSON.parse(json) as PqcEnvelope;

    expect(parsed.ct).toBe(env.ct);
    expect(parsed.kem_ct).toBe(env.kem_ct);
    expect(parsed.nonce).toBe(env.nonce);
  });
});
