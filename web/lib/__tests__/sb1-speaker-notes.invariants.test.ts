/**
 * Coverage skeleton for web/lib/sb1-speaker-notes.ts (audit v20 G1).
 *
 * `SPEAKER_NOTES` is `Record<number, string>`. The keys silently drifted to
 * a sparse set: 0..11 plus 100..103. Meanwhile `SLIDE_TITLES` in
 * `pitch-data.ts` is a 22-entry array, so the canonical slide index range
 * is 0..21. Two consequences nothing currently catches:
 *
 *   1) Slides 12..21 have no speaker notes (presenter has no script for the
 *      back half of the deck).
 *   2) Notes 100..103 reference indices that are out of range for
 *      `SLIDE_TITLES` (orphan notes, never read).
 *
 * This skeleton pins the contract: every key is an integer, no duplicates,
 * every key is *either* a valid SLIDE_TITLES index *or* a documented
 * extension range (>= 100), and there is at least one note per critical
 * slide index that the deck owner names below.
 *
 * Design call (TODO user): which slides MUST have a note? Title slides
 * arguably do not need one. Investor-facing money slides (BC01..BC05,
 * Financial Projections, The Ask) almost certainly do. Fill in
 * `MANDATORY_NOTE_INDICES` from your domain knowledge.
 */
import { describe, it, expect } from "vitest";
import { SPEAKER_NOTES } from "../sb1-speaker-notes";
import { SLIDE_TITLES } from "../pitch-data";

const NOTE_KEYS = Object.keys(SPEAKER_NOTES).map(Number);
const CANONICAL_RANGE_END = SLIDE_TITLES.length; // exclusive
const EXTENSION_RANGE_START = 100; // sb1-speaker-notes.ts:74 documents this

// TODO(user): replace with the indices that REQUIRE a presenter note.
// Suggestion based on file inspection: business cases (BC01..BC05) live at
// 4..8, financials at 15, ask at 20. Adjust to your deck.
const MANDATORY_NOTE_INDICES: readonly number[] = [
  // 0,  // title
  // 4, 5, 6, 7, 8,  // BC01..BC05
  // 15,  // financial projections
  // 20,  // the ask
];

describe("SPEAKER_NOTES: key shape", () => {
  it("every key is a non-negative integer", () => {
    for (const k of NOTE_KEYS) {
      expect(Number.isInteger(k)).toBe(true);
      expect(k).toBeGreaterThanOrEqual(0);
    }
  });

  it("no duplicate keys (Object.keys + numeric coercion)", () => {
    expect(new Set(NOTE_KEYS).size).toBe(NOTE_KEYS.length);
  });

  it("every key is either a valid SLIDE_TITLES index or in extension range >= 100", () => {
    const orphans: number[] = [];
    for (const k of NOTE_KEYS) {
      const inCanonical = k >= 0 && k < CANONICAL_RANGE_END;
      const inExtension = k >= EXTENSION_RANGE_START;
      if (!inCanonical && !inExtension) orphans.push(k);
    }
    expect(orphans, `orphan keys outside [0,${CANONICAL_RANGE_END}) and >=${EXTENSION_RANGE_START}: ${orphans.join(", ")}`).toEqual([]);
  });
});

describe("SPEAKER_NOTES: content shape", () => {
  it("every value is a non-empty trimmed string", () => {
    for (const k of NOTE_KEYS) {
      const note = SPEAKER_NOTES[k];
      expect(typeof note).toBe("string");
      expect(note.trim().length).toBeGreaterThan(0);
    }
  });

  it("no note exceeds 4000 characters (presenter readability ceiling)", () => {
    for (const k of NOTE_KEYS) {
      expect(SPEAKER_NOTES[k].length, `note ${k} exceeds 4000 chars`).toBeLessThan(4000);
    }
  });
});

describe.each(MANDATORY_NOTE_INDICES)(
  "SPEAKER_NOTES: mandatory coverage of slide %i",
  (idx) => {
    it("has a note", () => {
      expect(SPEAKER_NOTES[idx], `slide ${idx} (${SLIDE_TITLES[idx]}) has no speaker note`).toBeDefined();
    });
  },
);
