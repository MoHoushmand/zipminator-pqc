# Zipminator Originality Brief

Decision-ready competitive analysis and originality direction for the world's first PQC super-app. Inherits the QDaria design system from `.claude/rules/01-stack.md` and the 9-pillar production spec from `.marathon/specs/9-pillars.md`. The brief picks paths and justifies them in one sentence; "it depends" is not a design output.

Scope: messenger-first patterns that radiate outward to the other eight pillars. Every recommendation respects: cyan/amber/rose/emerald/violet OKLCH; Fraunces + DM Sans + JetBrains Mono; ML-KEM-768 visible-by-default; DORA Article 7 audit-first.

---

## 1. Competitive analysis

One short line per app. Then: core promise, the one pattern they nailed, the one pattern that is dated or wrong for a PQC-first app. Specific UI moments, not abstractions.

### 1.1 Matrix

| App | Core promise | Pattern they nailed | Pattern that is dated or wrong for PQC-first |
|-----|--------------|---------------------|----------------------------------------------|
| Signal | Private by default; same UI for every user | The verification-numbers screen at the moment-of-add: 60-digit safety number plus per-pair QR code, tappable "Mark as verified", banner on the conversation thread when keys change | Crypto state collapsed to a single padlock; ML-KEM-768 status, ratchet step, and entropy provenance are invisible by design, which leaks no info today and is wrong for a PQC-first product where visible PQC IS the differentiator |
| WhatsApp | Ubiquity; "the SMS replacement" | The unified composer (one input bar handles text, voice, attachment, location, contact, document) and the press-and-hold voice message with slide-to-cancel | The "encrypted by default but never named" framing; the lock screen shows a generic shield with no algorithm, no key fingerprint, no audit hook, which is fine for a billion users but unsellable to DORA-regulated tenants |
| Telegram | Speed; multi-device sync; "channels" | Chat folders with custom filters, in-thread message-pin, and the `/` command palette in groups | Two-tier security model where regular chats are not E2E; the "Secret Chat" toggle is buried in the new-chat menu and the visual treatment is identical to a normal chat once it is open, which makes the security state ambiguous |
| Threema | Pseudonymous identity; Swiss data sovereignty | The 8-character Threema ID instead of phone-number identity, and the QR-code verification that produces a green/orange/red trust dot per contact | The trust-dot color spec uses red for "unverified", which conflicts with conventions where red equals "broken or compromised"; on a PQC product red must mean "key tampered or downgrade detected", not "we have not met yet" |
| Wickr | Federal-grade ephemeral messaging | Per-room TTL plus burn-on-read where the recipient sees a countdown before the message wipes; the burn animation is a fade plus particle dissolve that visually communicates destruction | Heavy classified-network look (charcoal grays, thin sans, no warmth); Mo's product audience includes Norwegian healthcare and elder care, where charcoal-bunker styling reads as cold; warmth via amber glow is needed |

Pick five. Skipping iMessage and Session intentionally: iMessage's PQ3 rollout is closed-source on the UI side and Session's onion-routing-first identity model conflicts with our DORA audit requirement.

### 1.2 What each got right (specific moments)

**Signal: the conversation-level "safety number changed" banner.** Yellow background, in-thread, dismissible only after viewing the new safety number. We copy this pattern wholesale; we add the ML-KEM-768 KEM ciphertext-hash delta beside the safety number so the user knows what changed and why.

**WhatsApp: the one-tap forward with selection caret.** Long-press a message, the caret appears in the column gutter, then the bottom action bar slides up with forward, copy, star, delete. We adopt the gutter-caret pattern but replace "star" with "audit-pin" (pin a message into the DORA audit log).

**Telegram: chat folders.** A horizontal scrollable strip above the chat list with custom filters (Personal, Work, Channels, Unread). We adopt this for pillar navigation: a horizontal strip above the messenger view that switches between "Direct", "Vault-shared", "VoIP voicemail", "Mesh attestations", treating the 9 pillars as a coherent surface, not a hamburger drawer.

**Threema: per-contact trust dot.** Green = key verified in person, orange = TOFU, red = mismatch. Color semantics shift: we use emerald for verified, amber for TOFU, rose for downgrade detected, and reserve violet for "third-party PQC bridge active" (e.g., classical TLS plus PQC KEM hybrid).

**Wickr: burn animation.** A two-stage destruction (UI fade then particle dissolve) tied to actual file overwrite. We tie ours to the DoD 5220.22-M three-pass overwrite from the Vault pillar; the particle dissolve fires once the third pass completes, not on UI fade alone, so the animation matches the actual destruction event.

### 1.3 What each got wrong for a PQC-first app

**Signal: invisible-by-design crypto.** The padlock is the only crypto signal. For a product where the differentiation IS post-quantum, hiding the algorithm is anti-marketing and anti-trust. Zipminator must show the algorithm name, the KEM step, and the audit pill on every encrypted surface.

**WhatsApp: phone number as identity.** The PQC threat model includes adversaries who can correlate metadata; phone-number-as-identity leaks the social graph. Zipminator uses ML-KEM-768 fingerprint as primary identity; phone or email is recovery-only.

**Telegram: opt-in E2E.** A two-tier model is cognitive overhead and a regulatory liability under DORA Article 7 (every cryptographic operation must be audit-logged). Zipminator is single-tier: every message is PQ-double-ratcheted, no "Secret Chat" toggle.

**Threema: red-as-unverified.** Conflates "we have not met yet" with "compromise detected". Zipminator uses three-state semantics: emerald (verified), amber (TOFU/awaiting verification), rose (key change or downgrade detected, requires user attention).

**Wickr: federal-charcoal aesthetic.** Reads as cold to civilian users. Zipminator borrows Wickr's destruction discipline but pairs it with the warm quantum-cyan plus amber glow palette so the product reads as protective, not punitive.

### 1.4 Negative space (patterns nobody owns)

Five competitive negative-space areas where Zipminator has no incumbent to benchmark against:

1. Visible cryptographic state during the negotiation handshake (the "we are exchanging ML-KEM-768 keys right now" moment lasts 50-300ms; nobody renders it).
2. Quantum entropy provenance (which IBM Quantum job seeded which key).
3. Cross-pillar audit pill (the same audit visualization across vault, mail, voip, mesh).
4. Self-destruct as a first-class composer primitive (per-message TTL slider, not a chat-wide setting buried in chat info).
5. Threat-level indicator from physical-layer sensing (Q-Mesh EM canary, VPN kill-switch, fingerprint-spoofing strength) presented as a single composite gauge.

These five become Zipminator's signature interactions in section 3.

---

## 2. What zipminator inherits without thinking

Patterns that are now baseline expectations from any 2026-era messaging or super-app. Match competently; do not try to be original. Doing these poorly destroys trust faster than any single missing PQC feature.

### 2.1 Inherited patterns

| Pattern | What "competent" means | How we render it in the QDaria system |
|---------|------------------------|---------------------------------------|
| Delivery indicators | Three-state at minimum: sent, delivered, read | Single check (cyan 0.4 alpha) for sent; double check (cyan 0.7) for delivered; double check (emerald) for read; the third check fills with emerald, not blue |
| Typing indicators | Animated three-dot, debounced to avoid flicker | Three small cyan dots with a 600ms wave animation, anchored bottom-left of the chat thread, never a separate row |
| Message reactions | Long-press menu with six default emoji plus "more" | Six reactions (heart, thumb, laugh, surprise, sad, fire); long-press opens a popover with the emoji-as-fingerprint set used for verification (see 3.8) so reactions and verification share visual vocabulary |
| Voice messages | Press-and-hold to record; slide left to cancel; waveform on playback | Waveform rendered in cyan with amber accent at the playhead; PQ-SRTP indicator (small key glyph) sits beside the duration; per-frame encryption is implied, not narrated |
| Quoted reply | Tap message, swipe left to reply with quoted preview | Swipe-left gesture on iOS and Android; on macOS desktop and Tauri browser, hover-action button in the message gutter; quoted preview bubble has a vertical cyan bar on the leading edge |
| Edited message badge | Small "edited" tag with timestamp on hover | "edited" in DM Sans 11px, OKLCH at 0.6 lightness, beside the timestamp; tapping shows the edit history ledger (audit-pinned) |
| Read receipts toggle | Per-thread or global setting | Per-thread is mandatory; global toggle in Settings; the toggle UI states "When off, you also stop seeing other people's read receipts" so the symmetry is explicit |
| Online presence | Last-seen timestamp, with "online" green dot when active | We use emerald for online, amber for "active in last 5 minutes", absent otherwise; never red for offline |
| Search | In-thread search with result-count and prev/next | Top-of-thread search bar slides down on cmd-F or tap-search; results highlight with amber 0.3 alpha background; the search is local-only on the device, never server-relayed |
| Attachments | Inline preview for images, video, audio; badge for documents | Image preview at full bubble width with rounded 16px corners; document badge shows file extension in JetBrains Mono and a downward chevron; the file-type icon is replaced by a quantum-cyan filename pill; never a generic gray rectangle |
| Mute and pin | Standard chat-list affordances | Pin: cyan thumbtack glyph anchored top-right of the chat-list cell; mute: a small bell-with-slash glyph in amber, never grayed out (gray reads as broken) |
| Drafts | Auto-save unsent text; shown in chat list as "Draft: ..." | "Draft" prefix in italic Fraunces (the only italic appearance in the chat list, used as a visual signpost); the draft text is rendered in body color but with 0.7 alpha |

### 2.2 Where to spend the originality budget

Inherited patterns get exactly enough effort to pass usability testing on a fifth user. Not more. The originality budget goes to the eight primitives in section 3.

---

## 3. Where zipminator originates

PQC-first UX primitives that no competitor has. Each is designed concretely, not as a concept. These are the signature interactions.

### 3.1 Visible cryptographic state (PQC negotiation status)

The 50-300ms KEM handshake is currently invisible across every messenger. We render it.

**Trigger.** First-message-to-peer, post-rekey (every 100 messages or 24h), and key-change events.

**Visual.** A three-state pill anchored to the top of the conversation: "Negotiating ML-KEM-768", "Established (ratchet step N)", "Re-keyed (delta verified)". The pill background is cyan at 0.15 alpha; text is JetBrains Mono 12px with the algorithm name. During negotiation, two small dots oscillate between the pill ends in a 400ms loop; the oscillation is the visual proof that the handshake is happening, not a generic spinner.

**Microcopy.** "ML-KEM-768 with X25519 hybrid" stays in the pill the entire session. The ratchet step counter increments in real time as messages are encrypted; tap-and-hold shows the chain-key fingerprint (4 hex bytes plus emoji-as-fingerprint, see 3.8).

**Failure case.** If KEM fails to negotiate, the pill turns rose, text changes to "Downgrade detected. Tap to inspect.", and the composer is disabled. The user must tap and acknowledge before the conversation can continue in a degraded state (we never silently fall back).

**Justification.** The PQC negotiation is the product. Hiding it is hiding the differentiator.

### 3.2 Self-destruct as first-class composer primitive

Self-destruct is not a setting; it is part of writing the message.

**Composer layout.** Below the text input, a horizontal slider labeled "Lifespan" with stops at 5s, 1min, 5min, 1h, 24h, 7d, "permanent". Default position is "permanent" (do not surprise the user). Slider track is cyan with an amber glow that intensifies as the user moves toward shorter TTLs. The selected TTL renders in JetBrains Mono beside the send button.

**Bubble treatment.** Outgoing messages with TTL set show a thin amber bar on the trailing edge of the bubble; the bar shrinks linearly as the TTL counts down. Once the bar reaches zero, the bubble fades over 200ms and the particle-dissolve animation fires (matched to the actual three-pass overwrite from the Vault pillar's `self_destruct.py`).

**Server-side TTL.** The `X-Zipminator-TTL` header propagates through the messaging server; the bubble's amber bar reflects the server's countdown, not just the local clock, so a peer who closes the app and reopens it sees the correct remaining time.

**Vault-level destruction.** A separate gesture: long-press a conversation in the chat list, "Self-destruct conversation". This triggers the DoD 5220.22-M three-pass overwrite on local storage and broadcasts a destruction beacon to peers. The two-step confirmation copies the Vault pillar's existing pattern.

**Justification.** TTL is a daily decision, not a settings-screen decision; promoting it to the composer changes how often it gets used.

### 3.3 Anonymization tier dial (10 levels)

The 10-level anonymizer is Zipminator's most differentiated feature; the UI must make all 10 tiers tangible.

**Visual.** A vertical dial on the left edge of the composer when an attachment is staged. Levels 1-3 are emerald (low intensity), 4-6 amber (medium), 7-10 rose-into-violet (high to maximum). The dial position name renders in Fraunces beside the dial (Fraunces because the level name is content, not chrome).

**Live preview.** As the user drags the dial, a preview pane shows what gets masked at each level. At L1 the user sees regex-redacted phone numbers; at L4 they see tokenized values; at L7 they see jittered numerical fields; at L10 they see a fully QRNG-anonymized snapshot. The preview pane updates within 80ms; if it cannot update in 80ms, it shows a "Computing..." pulse rather than a stale preview.

**Per-message vs. attachment-only.** The dial only appears when an attachment is staged; per-message text content uses the lifespan slider in 3.2 plus the visible-PQC pill in 3.1. Mixing them in the same UI creates ambiguity.

**Microcopy.** Each level has a one-sentence description on hover or long-press: "L7: Quantum noise jitter. Numerical fields perturbed using IBM Quantum entropy. Reversible only with the original entropy seed." We avoid the word "anonymized" in level descriptions; the level number plus the noun phrase is the explanation.

**Justification.** The 10-level anonymizer is patent-pending and the feature most likely to be quoted in sales conversations; the UI must make all 10 tiers exist as visual states, not as a number in a dropdown.

### 3.4 Threat-level indicator (mesh canary, VPN kill-switch, downgrade)

A single composite gauge surfaces the cross-pillar threat state.

**Layout.** A small gauge anchored top-left of every screen across all pillars. Four states: emerald (Normal), amber (Elevated), rose (High), violet (Critical). The gauge is a 12-segment ring (one segment per 8.3% of the threat-level scale).

**Inputs.** Q-Mesh EM canary (`em_canary.rs` 4-level escalation), VPN kill-switch state (Connected, Reconnecting, Killed), PQC negotiation downgrade events (see 3.1), fingerprinting attempts blocked by ZipBrowser, password-vault access attempts. Each input contributes a weighted segment.

**Tap behavior.** Tap the gauge to drill into a threat dashboard listing the contributing inputs with timestamps and the recommended action. The drill-in dashboard is the primary surface for the 9-pillar coherent map (see 3.7).

**No false alarms.** The threshold for "Elevated" is two distinct inputs, not one; the threshold for "Critical" requires either a confirmed downgrade or a vital-auth liveness failure (`vital_auth.rs`). Single-input alerts sit at "Normal" with a footnote rather than promoting to "Elevated".

**Justification.** Cross-pillar threat surfacing is what makes the 9 pillars feel like one product; without a unifying gauge, they feel like nine separate apps in a folder.

### 3.5 Quantum entropy provenance UI

Show which IBM Quantum job seeded a given key. This is the trust-receipt for the PQC claim.

**Where.** On the message-info long-press popover (the same one that shows ratchet step). A line reads "Seeded by IBM Quantum 156q (Marrakesh), job_id 3a7c..., 2026-04-22T14:23Z". The job_id is tappable; tapping copies it to clipboard for audit purposes.

**How often.** The job_id refreshes per-rekey (every 100 messages or 24h). Between rekeys, the same job_id is shown.

**Fallback states.** If the entropy was sourced from the local pool (`quantum_entropy_pool.bin`) rather than a live job, we show "Pool-derived (HKDF from job 3a7c...)" with the original job_id linked. If the OS fallback fired (entropy provider crashed), we show amber "OS RNG fallback: <reason>" so the user knows the quantum claim is degraded.

**Audit chain.** Each entropy event is appended to a per-conversation audit ledger viewable in Settings -> Conversation -> Audit. The ledger uses the JetBrains Mono 11px monospace style with line numbers; this is the DORA-compliant view enterprise tenants will request.

**Justification.** "Quantum-secured" is a marketing claim until we show the trust receipt. The provenance UI converts the claim into a verifiable artifact.

### 3.6 DORA-compliance audit pill (visible audit trail per crypto op)

Every crypto operation has an audit row. The audit pill is the user-facing surface of that row.

**Pill design.** A small pill on the right edge of every encrypted bubble: a single circle (cyan) with a tap target. Tap opens a side-sheet showing the bubble's audit row: timestamp, operation (encrypt, decrypt, ratchet-advance, key-rotate), algorithm, ciphertext hash (first 8 hex), entropy provenance (linked to 3.5), audit ledger entry ID.

**Side-sheet treatment.** The side-sheet is JetBrains Mono with line numbers. Each row is a single line of monospace; the audit feels like reading a Rust crate's `cargo test` output, which is the trust signal we want for a security product.

**Per-pillar.** The audit pill appears on Vault file rows, Mail message rows, VoIP call rows (post-call), Mesh attestation rows. Across all pillars, the side-sheet has the same shape and the same line-numbered monospace treatment so audit feels like a single feature, not nine.

**Export.** A "Copy to clipboard" or "Export JSON" affordance at the bottom of the side-sheet exports the audit ledger entry; this is the artifact a DORA auditor would request.

**Justification.** DORA Article 7 requires per-op audit; turning that requirement into a visible product surface, not a buried log file, becomes a sales differentiator with regulated tenants.

### 3.7 9-pillar nav as a coherent map (constellation, not hamburger)

The 9 pillars are not menu items; they are nodes in a connected map.

**Layout (web).** On the dashboard route, the 9 pillars render as a constellation: each pillar is a node positioned on a 3x3 grid with subtle elliptical orbits in the background (cyan strokes at 0.15 alpha). Nodes connect by edges when they share a session: Messenger-VoIP shares signaling; Vault-Mail shares the encryption backend; Mesh-VPN share entropy. The edges pulse cyan when there is active cross-pillar traffic.

**Layout (mobile).** Bottom-bar with the four most-used pillars (Messenger, Vault, Mail, Mesh-status) plus a center "constellation" button that expands the full 9-pillar map. The map uses force-directed layout with the active pillar centered and the others orbiting at distances proportional to recent use frequency.

**Layout (desktop Tauri).** The constellation lives in a left rail (collapsible to a 64px icon strip). When collapsed, the strip shows the four most-used pillars plus a chevron; expand restores the full map.

**Layout (Flutter macOS).** Menubar tray icon shows the threat gauge from 3.4; clicking opens a 320x440 popover with the constellation map plus the threat dashboard. This is the "ambient" surface; the full app is opened only when the user clicks into a pillar.

**Constellation, not graph.** We say "constellation" because the visual metaphor is celestial: nodes have soft glows, edges are dotted not solid, the background has a subtle starfield rendered with CSS gradient noise (no PNG). The metaphor matches the quantum brand without being literal-quantum-particles cliche.

**Justification.** The hamburger menu is the worst possible affordance for a 9-feature product; refining the existing nav into a constellation map keeps the 9 pillars legible without introducing a new top-level pattern that the user has to learn.

### 3.8 Identity-as-key-fingerprint (memorable verification)

ML-KEM-768 fingerprints are 256-bit; rendering them as 64 hex characters is unmemorable. We render them as 16 emoji from a curated 64-emoji set, plus the full hex available on tap.

**Curated emoji set.** 64 emoji chosen for visual distinctness, multi-platform consistency (pre-iOS-17 fallback safe), and cultural neutrality. Examples: anchor, key, lock, atom, telescope, bell, cube, leaf, mountain, river, seed, comet, ring, mask, lighthouse, mirror. Avoid: faces (cultural variability), flags (political), gendered objects.

**Verification screen.** When two peers add each other for the first time, both phones show a 16-emoji string drawn from the same fingerprint. The peers verbally compare: "anchor, key, mountain, telescope, ..." Tapping any emoji highlights the corresponding 16 hex bits below; this gives the security-conscious user the option to verify hex while letting the casual user verify emoji.

**Why emoji, not Lorem-Ipsum-style English words.** Emoji are language-neutral (verifiable across Norwegian, English, Arabic) and memorable. The Threema-style 8-character ID is alphanumeric, which is harder to verbalize and harder to remember.

**Where else fingerprints appear.** In the conversation header (smaller, four-emoji preview); in the audit ledger (full 16-emoji plus full hex); in the entropy provenance UI (3.5) as part of the seeded-by line; in the chat list cell as a four-emoji peer-identity glyph.

**Justification.** Identity verification is the moment most users skip; making fingerprints memorable raises the verification rate, which is the security metric that actually matters.

### 3.9 Originality summary (the eight primitives)

| # | Primitive | Pillar(s) it lives in | Status (current code) |
|---|-----------|------------------------|------------------------|
| 3.1 | Visible PQC negotiation pill | Messenger, Mail, VoIP, Browser | Not yet built; spec ready |
| 3.2 | Composer-level lifespan slider | Messenger, Mail | Mail has SelfDestructTimer; Messenger composer needs slider |
| 3.3 | Anonymization tier dial (10 levels) | Anonymizer, Mail compose, Vault | Slider exists in `mobile/src/components/mail/AnonymizationSlider.tsx`; not yet on Flutter app |
| 3.4 | Threat-level composite gauge | Cross-pillar (top-left every screen) | Mesh `em_canary.rs` exists; gauge UI not yet built |
| 3.5 | Quantum entropy provenance UI | Messenger, Mail, Vault, Mesh | Backend exists (`qrng/`); UI not built |
| 3.6 | DORA audit pill | All encrypted bubbles | Backend logging exists; user-facing pill not built |
| 3.7 | 9-pillar constellation nav | Web dashboard, Tauri left rail, Flutter bottom-bar | `web/components/SuperAppShowcase.tsx` is the closest current component; needs replacement |
| 3.8 | Emoji-as-fingerprint identity | Messenger verification, audit, conversation header | Not yet built; depends on curated 64-emoji set |

---

## 4. Cross-platform adaptations

The same mental model on every platform; the mechanical specifics differ. The QDaria token system stays binding everywhere.

### 4.1 Adaptation grid

| Platform | Motion language | Primary gesture | OS-native affordance to use | Anti-pattern to avoid |
|----------|-----------------|-----------------|-----------------------------|------------------------|
| Flutter iOS | Cupertino spring (mass=1, stiffness=180, damping=20) | Edge-swipe back | Dynamic Island for self-destruct timers; Lock Screen widget for vault and threat gauge; Haptics on encrypt-success (notificationFeedback.success) | Material rubber-band on iOS; do not let Material You cyan get overwritten by iOS system blue |
| Flutter Android | Material You motion (250ms standard, easeInOutCubicEmphasized) | Predictive back gesture (Android 14+) | MD3 dynamic color extracted from QDaria tokens (not from system wallpaper); foreground-service notification for VPN status | Letting OS theme color extraction override quantum-cyan; do not show monochrome white-on-gray on a phone with a teal wallpaper |
| Flutter macOS | macOS spring (250ms with ease-out) | Two-finger swipe back; cmd-bracket | NSWindow vibrancy on the constellation panel; menubar tray for threat gauge plus vault status; cmd-K palette for global navigation | Web-style hover-only affordances on macOS; every hover state needs a keyboard equivalent |
| Tauri 2.x browser | 200ms ease-in-out | Tab-drag, cmd-T new tab | Native window controls (red-yellow-green on macOS, min-max-close on Win); per-tab process isolation; multi-tab UX studied (not copied) from Arc and Brave | Custom titlebar that does not respect platform window-button order; copying Arc's command bar wholesale; copying Brave's wallet UI |
| Next.js 16 web | 180ms ease-out (CSS keyframes) | Hover, click | Server Components for the 9-pillar dashboard; App Router only; Cache Components with `"use cache"` directive | `pages/` router; client-component-everywhere; hydration-blocked dashboards |

### 4.2 Flutter mobile (iOS)

**Cupertino motion.** All transitions on iOS use the Cupertino curve from Flutter's `cupertino_animation_curves.dart` equivalents. The conversation push transition is the platform `MaterialPageRoute.iOS` with `fullscreenDialog: false`. Quantum-themed motion sits inside the platform motion, not on top of it: the message bubble appears with a 200ms cyan glow that decays after the bubble lands, but the bubble itself follows iOS motion physics.

**Haptics.**
- Encrypt-success: `HapticFeedback.notificationFeedback(.success)` on send.
- KEM downgrade: `HapticFeedback.notificationFeedback(.warning)` plus the rose pill from 3.1.
- Self-destruct fire: `HapticFeedback.impactFeedback(.heavy)` once at the moment the message dissolves.
- Verification match: `HapticFeedback.notificationFeedback(.success)` plus a 600ms emerald glow on the matched emoji.

**Edge-swipe.** Default iOS edge-swipe-back works on conversation view. We extend it: a two-finger edge swipe opens the audit side-sheet (3.6) for the focused bubble. The two-finger gesture is reserved because single-finger is the platform back gesture; do not steal it.

**Dynamic Island and Live Activities.**
- Self-destruct countdowns over 1 minute live in Dynamic Island when the app is backgrounded; the island shows the conversation peer avatar plus the amber TTL bar from 3.2.
- Active VoIP call: standard Live Activity treatment (peer name, duration, mute toggle). The PQC indicator is a small key glyph beside the duration.
- Active mesh threat: when the gauge from 3.4 is amber or higher, a Live Activity surfaces the threat level on the Lock Screen.

**Lock Screen widget.** A 2x2 widget renders the threat gauge plus vault encryption-key health (last rotation, pending rotations). The widget is glanceable; tapping deeplinks into the threat dashboard.

**Stay native, stay quantum.** The cyan glow, the amber TTL bar, the emoji fingerprints all sit inside iOS conventions. We do not invent custom navigation, custom modal presentations, or custom keyboard accessories. The originality budget is on the eight primitives, not on platform invention.

### 4.3 Flutter mobile (Android)

**Material You and dynamic color.** Android's Material You wants to extract dynamic colors from the user's wallpaper. We do not let it override quantum-cyan. The QDaria tokens are pinned via `ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFF22D3EE)))` with `dynamicColor: false` on the theme provider. Result: a phone with a magenta wallpaper still shows quantum-cyan as primary; the brand survives the OS preference.

**Predictive back.** Android 14+ predictive back is enabled; the conversation view shrinks 80% as the user starts the back gesture, revealing the chat list underneath. This is the platform expectation; we use it.

**MD3 motion.** Standard MD3 emphasized motion (`durations.medium2 = 300ms`, `easings.emphasized`). Composer-to-attached-file transitions use the shared-element transition pattern; the file thumbnail flies from the attachment picker into the composer's attachment slot in 250ms.

**Foreground-service.** Q-VPN's connect state, Mesh-as-host state, and active VoIP call all use foreground services with persistent notifications. The notification icon is a key glyph in cyan. The notification's expanded view shows the threat gauge.

**Notification channels.** Three channels: "Messages" (default importance, sound), "Threats" (high importance, vibration on amber-or-higher), "Audit" (low importance, no sound; this is where DORA audit summaries go). Users can mute Messages without losing Threats.

### 4.4 Flutter desktop (macOS)

**NSWindow chrome.** Use the standard macOS title-bar with red-yellow-green window buttons in their canonical position. Do not draw a custom title bar; macOS power-users hate it. The window background uses NSWindow vibrancy (`.sidebar` material) for the left-rail constellation panel; the conversation view uses `.contentBackground`.

**Vibrancy.** The left rail and the audit side-sheet are the only surfaces with vibrancy. The conversation view is opaque so message contents stay legible against an arbitrary desktop wallpaper.

**Keyboard-first navigation.**
- cmd-K: global palette (jump to any pillar, any conversation, any audit entry)
- cmd-1 through cmd-9: switch to pillar N
- cmd-T: new conversation (Messenger), new tab (Browser)
- cmd-shift-A: open audit side-sheet for focused item
- cmd-shift-D: deep-link to threat dashboard
- cmd-bracket: back and forward in pillar history

Every action that has a UI affordance also has a keyboard equivalent. Discoverability lives in the cmd-K palette.

**Menubar tray.** A 320x440 popover anchored to the menubar icon. Top section: threat gauge (3.4). Middle section: most-recent encrypted item (last message, last vault file, last call). Bottom section: vault state (locked or unlocked, key health, last entropy harvest). The popover is intentionally read-only; click any row to open the full app at the relevant pillar.

**No web-style affordances.** Hover-only tooltips are forbidden; every tooltip-discoverable action also surfaces in the cmd-K palette. The desktop is keyboard-first.

### 4.5 Tauri 2.x browser

**Native window controls.** Use the platform's native window controls (Tauri 2.x supports this via `tauri.conf.json` `decorations: true` plus per-platform overrides). On macOS the controls are red-yellow-green at top-left; on Windows they are min-max-close at top-right. Do not draw custom controls.

**Multi-tab UX (study Arc and Brave; do not copy).**
- Arc's command bar at the top of every tab is too aggressive for a security product; we keep a conventional address bar.
- Arc's left-rail tab grouping is good but is overkill for a browser whose primary use case is privacy-respecting browsing, not knowledge-management.
- Brave's wallet sidebar is too dominant; we relegate the AI sidebar (3.6 from FEATURES.md) to a 360px right panel that collapses to a 32px strip when the user wants screen real estate.

**Address bar.** Conventional address bar at the top with a cyan PQC indicator on the leading edge. The indicator turns emerald when the visited site supports PQC TLS hybrid; amber when classical-only; rose when downgraded. Tap the indicator to open the privacy dashboard for the current tab.

**AI sidebar slot.** Right panel; toggle via cmd-shift-A or the keyboard shortcut configured in Tauri. Inside: chat with Q-AI, summary of current page, writing-assist for the current input field. The sidebar uses the same PQC pill as 3.1 because the Q-AI chat uses the PQCTunnel.

**Privacy dashboard.** A modal that opens from the address-bar PQC indicator. Shows: per-tab cookie state, fingerprint-spoofing strength, telemetry blocked count, audit log for the tab. The dashboard uses the same line-numbered JetBrains Mono treatment as the audit side-sheet from 3.6.

### 4.6 Next.js 16 web

**Stack.** shadcn v4 plus Tailwind v4 with the QDaria tokens from `01-stack.md`. App Router only; no `pages/` router. React 19 with React Compiler enabled (`reactCompiler: true` in `next.config.ts`).

**Server Components.** The 9-pillar dashboard at `web/app/dashboard/page.tsx` is a Server Component; it fetches per-pillar status and renders the constellation map server-side. Interactive nodes (hover, click) are client islands. The constellation pulse animation is a CSS keyframe (no JS).

**Cache Components.** The dashboard uses `"use cache"` directive on the per-pillar status fetch with a 30s stale-while-revalidate. The threat gauge is uncached (it must be live).

**App Router routes (proposed structure).**
```
web/app/
  layout.tsx                    # Constellation rail + threat gauge slot
  page.tsx                      # Marketing landing (out of scope here)
  (dashboard)/
    layout.tsx                  # Authenticated layout
    page.tsx                    # Constellation map
    messenger/
      page.tsx                  # Chat list
      [conversationId]/page.tsx # Conversation view
    vault/page.tsx
    mail/
      page.tsx                  # Inbox
      compose/page.tsx
      [id]/page.tsx
    voip/page.tsx
    vpn/page.tsx
    anonymizer/page.tsx
    qai/page.tsx
    browser/page.tsx            # Web preview of ZipBrowser
    mesh/page.tsx
    audit/page.tsx              # DORA audit ledger
```

**Form fields.** Use the shadcn v4 Field component for every form field. The composer's lifespan slider, the anonymization tier dial, and the verification screen all use Field as the primitive. Field replaces the legacy custom form wrappers.

---

## 5. Design tokens beyond what is already in 01-stack.md

The QDaria design system defines colors and fonts. It does not define motion, elevation, glow intensities, encryption-indicator microanimations, or threat-color gradients. The rest of this section fills those gaps.

### 5.1 Motion language (quantum-themed)

```css
@theme {
  /* Timing (quantum-themed names; concrete millisecond values) */
  --motion-superposition:    180ms;  /* default UI transitions */
  --motion-collapse:         120ms;  /* state collapse: hover off, focus loss */
  --motion-entanglement:     320ms;  /* cross-element coordinated motion */
  --motion-decoherence:      640ms;  /* fade-out, dissolve, destruction */
  --motion-coherence:        1200ms; /* extended animations: KEM negotiation */

  /* Curves */
  --ease-quantum:            cubic-bezier(0.16, 1, 0.3, 1);   /* primary */
  --ease-collapse:           cubic-bezier(0.4, 0, 1, 1);      /* fast end */
  --ease-coherence:          cubic-bezier(0.65, 0, 0.35, 1);  /* breathing */
  --ease-entanglement:       cubic-bezier(0.83, 0, 0.17, 1);  /* coordinated */
}
```

**Naming policy.** Quantum-themed names because they make the motion palette memorable for engineers and unique to Zipminator. The millisecond values are conventional (180ms for UI, 320ms for coordinated, 640ms for dissolve); the names are the only quantum-flavored part. We do not invent novel timing values.

**Application.**
- Bubble appear: `var(--motion-superposition) var(--ease-quantum)`
- Pill state change (negotiating to established): `var(--motion-entanglement) var(--ease-entanglement)`
- Self-destruct dissolve: `var(--motion-decoherence) var(--ease-collapse)`
- KEM negotiation oscillation: `var(--motion-coherence) var(--ease-coherence) infinite alternate`
- Threat-level gauge ring fill: `var(--motion-entanglement) var(--ease-entanglement)`

### 5.2 Elevation

Five levels. Lower than typical Material because the QDaria dark background absorbs shadow; over-elevating reads as muddy.

```css
@theme {
  --elevation-0: none;                                                         /* base */
  --elevation-1: 0 1px 2px 0 oklch(0 0 0 / 0.20),
                 0 1px 3px 0 oklch(0 0 0 / 0.10);                               /* card */
  --elevation-2: 0 4px 6px -1px oklch(0 0 0 / 0.25),
                 0 2px 4px -1px oklch(0 0 0 / 0.15);                            /* popover */
  --elevation-3: 0 10px 15px -3px oklch(0 0 0 / 0.30),
                 0 4px 6px -2px oklch(0 0 0 / 0.18);                            /* modal */
  --elevation-4: 0 20px 25px -5px oklch(0 0 0 / 0.35),
                 0 10px 10px -5px oklch(0 0 0 / 0.20);                          /* sheet */
}
```

### 5.3 Glow intensities (encryption indicators)

Glows are how we signal cryptographic state without adding chrome.

```css
@theme {
  --glow-cyan-soft:    0 0 16px oklch(0.82 0.15 200 / 0.20);   /* idle PQC */
  --glow-cyan-active:  0 0 24px oklch(0.82 0.15 200 / 0.45);   /* during KEM negotiation */
  --glow-emerald-ok:   0 0 20px oklch(0.79 0.17 155 / 0.35);   /* verified state */
  --glow-amber-warn:   0 0 24px oklch(0.77 0.18 85  / 0.40);   /* TOFU, low-threat */
  --glow-rose-alert:   0 0 28px oklch(0.72 0.19 10  / 0.50);   /* downgrade, high-threat */
  --glow-violet-crit:  0 0 32px oklch(0.72 0.17 290 / 0.55);   /* critical threat */
}
```

**Application.**
- The PQC pill (3.1) uses `--glow-cyan-soft` when established, `--glow-cyan-active` during negotiation.
- Verified emoji-fingerprint matches (3.8) flash `--glow-emerald-ok` for 600ms.
- Self-destruct bubbles glow `--glow-amber-warn` while counting down.
- Downgrade pill uses `--glow-rose-alert`.
- Critical threat gauge uses `--glow-violet-crit`.

### 5.4 Encryption-indicator microanimations

```css
@keyframes kem-pulse {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50%      { transform: translateX(8px); opacity: 0.6; }
}

@keyframes ratchet-tick {
  0%   { transform: scale(1);   }
  50%  { transform: scale(1.08);}
  100% { transform: scale(1);   }
}

@keyframes audit-spark {
  0%   { box-shadow: var(--glow-cyan-soft); }
  10%  { box-shadow: var(--glow-cyan-active); }
  100% { box-shadow: var(--glow-cyan-soft); }
}

@keyframes self-destruct-dissolve {
  0%   { opacity: 1; filter: blur(0);    transform: scale(1);    }
  60%  { opacity: 0.8; filter: blur(2px); transform: scale(0.98); }
  100% { opacity: 0; filter: blur(8px); transform: scale(0.94); }
}
```

**Application.**
- KEM-pulse drives the two-dot oscillation in the PQC pill during negotiation.
- Ratchet-tick fires once per ratchet step on the chain-key indicator.
- Audit-spark fires on the audit pill (3.6) when a new audit row is appended.
- Self-destruct-dissolve drives the bubble's destruction animation.

### 5.5 Threat-color gradients

The threat gauge (3.4) uses gradients, not solid colors, so the segments transition smoothly as the threat level changes. Critical is violet, not red, because red is overloaded with system errors and brand emergencies; violet is reserved exclusively for "PQ adversary detected" state.

```css
@theme {
  --gradient-threat-normal:   linear-gradient(90deg,
                                oklch(0.79 0.17 155) 0%,
                                oklch(0.82 0.15 200) 100%);   /* emerald to cyan */
  --gradient-threat-elevated: linear-gradient(90deg,
                                oklch(0.82 0.15 200) 0%,
                                oklch(0.77 0.18 85)  100%);   /* cyan to amber */
  --gradient-threat-high:     linear-gradient(90deg,
                                oklch(0.77 0.18 85)  0%,
                                oklch(0.72 0.19 10)  100%);   /* amber to rose */
  --gradient-threat-critical: linear-gradient(90deg,
                                oklch(0.72 0.19 10)  0%,
                                oklch(0.72 0.17 290) 100%);   /* rose to violet */
}
```

### 5.6 Spacing rhythm (8pt with 4pt accent)

```css
@theme {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}
```

Conventional 8pt base with a 4pt accent for tight UI (PQC pill internal padding, audit-pill diameter, fingerprint emoji spacing). Do not invent additional values; if a layout needs 18px, the layout is wrong.

---

## 6. Concrete component specs (Messenger pillar)

The Messenger pillar is at 85% per FEATURES.md and is the marathon's current focus. The components below are spec'd at the level a Flutter or Next.js engineer can implement directly.

### 6.1 Chat list cell

```
+------------------------------------------------------------+
| [Avatar]   Name (Fraunces 16, weight 500)        2:14 PM   |
| 4 emojis   Last message preview (DM Sans 14, 0.7 alpha)    |
|            [single|double check]  [TTL bar?]      [pin?]   |
+------------------------------------------------------------+
```

| Slot | Spec |
|------|------|
| Avatar | 48px circle. If user has no avatar, render the four-emoji peer-identity glyph (3.8) on a cyan-to-cyan-dim radial gradient. |
| Name | Fraunces 16px, weight 500, 0.95 alpha. Bold weight is reserved for unread cells. |
| Four-emoji glyph | DM Sans 14px (because emoji render in body font); positioned below avatar, 0.7 alpha when verified, 0.5 alpha when TOFU. |
| Last-message preview | DM Sans 14px, 1 line, ellipsis on overflow, 0.7 alpha. Prefix with "Draft: " in italic Fraunces if applicable. |
| Timestamp | DM Sans 12px, 0.6 alpha, top-right. |
| Delivery state | 12px check icons, cyan-then-emerald gradient. Hidden if last message is incoming. |
| TTL bar | 2px amber bar at bottom edge, full-width when message has TTL set, otherwise absent. |
| Pin glyph | 14px cyan thumbtack at top-right corner, only when pinned. |
| Per-thread PQC indicator | A 4x4 dot at the right of the cell, cyan when negotiated, amber when TOFU, rose when downgrade-detected. Tappable. |
| Self-destruct hint | If the conversation has a default TTL set, a small clock icon in amber appears beside the timestamp. |

**Cell height.** 72px. Two-line preview content. No three-line cells; if metadata cannot fit, we drop the preview before we drop the metadata.

**Hover and tap states.**
- Hover (desktop): elevation lifts to `--elevation-1`, glow `--glow-cyan-soft`.
- Tap: 80ms ripple (Material) or 80ms opacity flash (Cupertino, iOS).
- Long-press (mobile): bottom-sheet appears with audit, archive, mute, pin, self-destruct.
- Right-click (desktop): contextual menu with the same six actions.

### 6.2 Conversation header

```
+------------------------------------------------------------+
| [<-]  [Avatar]  Name                              [Audio]  |
|                 4 emojis - Ratchet step 47        [Video]  |
|       [PQC pill: ML-KEM-768 - Established]                 |
+------------------------------------------------------------+
```

| Slot | Spec |
|------|------|
| Back | 24px chevron-left, cyan, top-left, mobile only. |
| Avatar | 36px circle. |
| Name | Fraunces 18px, weight 500. |
| Four-emoji glyph + ratchet step | DM Sans 12px, 0.7 alpha; the four-emoji glyph is tappable to jump to the verification screen. |
| PQC pill | Full pill from 3.1, anchored to second row; 28px tall, cyan glow, contains: algorithm name, status, ratchet step. |
| Audio call | 24px phone-up glyph, cyan, calls VoIP pillar. |
| Video call | 24px video glyph, cyan. |
| Audit shortcut | 24px ledger glyph at far right, opens the audit side-sheet for the conversation. |

**Sticky behavior.** Header sticks to top during scroll. The PQC pill collapses to a single dot indicator after 200px of scroll to save vertical space; tapping the dot expands the pill back.

### 6.3 Message bubble

Two variants: incoming (left-aligned, neutral background) and outgoing (right-aligned, cyan background). Otherwise identical structure.

```
INCOMING:
+----------------------------------+
| Hello world. (DM Sans 15)        |
+----------------------------------+
| 2:14 PM   [audit-pill]           |   (small row beneath bubble, 0.6 alpha)

OUTGOING:
                +----------------------------------+
                | Hello back. (DM Sans 15)         |
                +----------------------------------+
                | 2:14 PM  [check]  [TTL bar?]     |
                |                  [audit-pill]    |
```

| Slot | Spec |
|------|------|
| Bubble (incoming) | Background `oklch(0.18 0.02 250)`, border `oklch(0.22 0.02 250 / 0.4)`, 16px radius (12px on the trailing-bottom corner for a tail effect). |
| Bubble (outgoing) | Background `oklch(0.30 0.10 200 / 0.45)`, glow `--glow-cyan-soft`, 16px radius (12px on leading-bottom for tail). |
| Bubble text | DM Sans 15px, line-height 1.5, color near-white at 0.95 alpha. |
| Timestamp | DM Sans 11px, 0.6 alpha, beneath the bubble (not inside). |
| State badge | Single-double-emerald check; 12px; outgoing only. |
| TTL bar | Amber bar inset 4px from the bubble's trailing edge, height 2px, animated width countdown. |
| TTL countdown text | JetBrains Mono 11px in amber, format "12s", "4m", "1h"; visible only when TTL <= 1 minute. |
| Audit pill | 8px circle, cyan, beside the timestamp; tap opens the audit side-sheet. |
| Reactions | Floating row beneath bubble; each reaction is a 24px chip with the emoji plus a count. |
| Quote bar | 3px vertical cyan bar on the leading edge of the bubble when message is a reply; quoted preview is inset 8px and 0.7 alpha. |

**Long-press behavior.** Reactions appear as a popover; the popover includes the emoji-as-fingerprint set used in verification. Selecting an emoji adds it to the message reactions.

**Edited state.** If the message has been edited, append "edited" in DM Sans 11px italic at 0.5 alpha after the timestamp. Tap "edited" to view edit history.

### 6.4 Composer

```
+--------------------------------------------------------------+
| [+]  Type a message...                          [mic|send]   |
| [Lifespan: ----o-----------------------]   permanent         |
| [Anonymize attachment: O ]                                   |
+--------------------------------------------------------------+
```

| Slot | Spec |
|------|------|
| Attach button | 36px plus icon at leading edge; tap to open attachment picker (camera, file, contact, location). |
| Text input | DM Sans 15px, multi-line up to 6 lines, then scrolls; placeholder "Type a message..." at 0.4 alpha. |
| Voice/Send | When input empty: microphone glyph, cyan. When input non-empty: paper-plane glyph, cyan with `--glow-cyan-active`. Press-and-hold the mic to record a voice message. |
| Lifespan slider | Horizontal slider, full-width minus 16px insets; track gradient cyan-to-amber; thumb 18px circle with current TTL value. Default position is "permanent" (rightmost). |
| Anonymize attachment toggle | Visible only when at least one attachment is staged; appears beside the lifespan slider. Off by default; tapping opens the anonymization tier dial (3.3) as a sheet. |
| Attachment thumbnails | When attachments staged, render a horizontal scrollable strip above the text input; each thumb has a small "x" to remove. |

**Send action.** Sends the message with the current TTL and anonymization settings. After send, the lifespan slider resets to "permanent" (per-message settings do not persist).

**Voice message recording.** Press-and-hold the mic; while recording, the composer expands to show a waveform and a slide-to-cancel hint. Release to send; slide left more than 80px to cancel.

### 6.5 Verification screen

```
+--------------------------------------------------------------+
| Verify with [Peer name]                                      |
|                                                              |
|     [16 emoji rendered at 36px each, 4-per-row]              |
|     anchor    key    mountain    telescope                   |
|     bell      cube   leaf        atom                        |
|     ... etc                                                  |
|                                                              |
| Compare these emojis with [Peer name]'s screen.              |
| [Mark as verified]   [Show hex fingerprint]                  |
+--------------------------------------------------------------+
```

| Slot | Spec |
|------|------|
| Title | Fraunces 22px, weight 500. |
| Emoji grid | 4x4 grid; each emoji at 36px in a 56x56 cell; tappable. Tap highlights the corresponding 16-bit hex slice below. |
| Hex slice (collapsed by default) | "Show hex fingerprint" toggles a JetBrains Mono 13px row showing all 64 hex chars in groups of 4. |
| Compare hint | DM Sans 14px, 0.7 alpha, two lines max. |
| Mark as verified | Primary button, cyan background, white text; on tap, plays the verification haptic plus 600ms emerald glow. |
| Show hex fingerprint | Secondary button, ghost style, cyan border. |

**Both peers' screens.** Show the same 16 emojis. The peers verbally compare; once both tap "Mark as verified", the per-pair safety number is locked in and a "verified" emerald dot appears on the conversation header's four-emoji glyph.

**Mismatch handling.** If the user notices an emoji mismatch and taps "Report mismatch", the conversation enters a quarantine state: the composer is disabled, the PQC pill turns rose, and the audit log records the mismatch event for DORA review.

### 6.6 Voice message UI

```
INCOMING VOICE MESSAGE:
+--------------------------------------------------------------+
| [Play]   ~~~~~~~waveform~~~~~~~                  0:23        |
|          PQ-SRTP                                              |
+--------------------------------------------------------------+
```

| Slot | Spec |
|------|------|
| Play button | 32px circle, cyan; pause when playing. |
| Waveform | Static rendering of the audio waveform (60 bars) in cyan; the playhead bar is amber and animates left-to-right during playback. |
| Duration | DM Sans 12px, 0.7 alpha. |
| PQ-SRTP indicator | Small key glyph in cyan beside the duration; tap to open the audit side-sheet showing per-frame encryption details. |
| Speed control | Tap the duration to cycle through 1x, 1.5x, 2x. |
| Transcript (optional) | If Q-AI transcription is enabled, a "Transcribe" affordance appears below the waveform; tap to expand a transcript pane. |

**Recording UI (while user is recording outgoing).** Composer expands to a one-row recording cell: red recording dot at left, live waveform updating at 30fps in the center, "slide to cancel" hint at right. The waveform colors shift cyan-to-amber as the duration grows past 60 seconds (visual cue that the message is getting long).

### 6.7 Component spec roll-up

| Component | File path (proposed) | Status (current) | Marathon-ready? |
|-----------|----------------------|------------------|-----------------|
| Chat list cell | `app/lib/features/messenger/widgets/chat_list_cell.dart` | Stub exists | Needs four-emoji glyph + per-thread PQC indicator + TTL bar |
| Conversation header | `app/lib/features/messenger/widgets/conversation_header.dart` | Stub exists | Needs PQC pill (3.1) + audit shortcut |
| Message bubble | `app/lib/features/messenger/widgets/message_bubble.dart` | Stub exists | Needs TTL bar + audit pill + ratchet-tick microanimation |
| Composer | `app/lib/features/messenger/widgets/composer.dart` | Stub exists | Needs lifespan slider + anonymize toggle |
| Verification screen | `app/lib/features/messenger/screens/verification_screen.dart` | Not yet built | Needs curated 64-emoji set first |
| Voice message UI | `app/lib/features/messenger/widgets/voice_bubble.dart` | Not yet built | Depends on `PqSrtpService.ts` already passing |

---

## 7. Patterns to NEVER use

Inherited prohibitions from `01-stack.md` plus zipminator-specific anti-patterns. These are zero-tolerance.

### 7.1 Inherited prohibitions (from 01-stack.md)

| Prohibition | Why |
|-------------|-----|
| Inter font | Banned in QDaria system; Fraunces and DM Sans cover display and body. |
| Roboto font | Banned; Material's default is overwritten by QDaria tokens. |
| Arial font | Banned; reads as a 1995-era system font. |
| Purple gradients | Banned; we use violet only for "Critical threat" semantics, never as a gradient. |
| "Centered everything" layouts | Banned; centered everything reads as a marketing landing page from 2018, not a security product. |
| Generic SaaS hero blocks | Banned; we have specific patterns (constellation, threat gauge, audit pill) that replace them. |
| Stock illustrations | Banned; everything is rendered from QDaria tokens or quantum-derived data viz. |
| Lottie unicorns | Banned; motion is CSS keyframes or Flutter implicit animation, not Lottie. |

### 7.2 Zipminator-specific anti-patterns

| Anti-pattern | Why |
|--------------|-----|
| A single padlock as the only crypto indicator | Hides the differentiator. ML-KEM-768 must be visible by name. |
| Red as "unverified" or "offline" | Red is overloaded; we reserve rose for "downgrade or compromise detected" and use amber for TOFU and offline. |
| "Encrypted" or "Secure" as user-facing copy without algorithm name | "Encrypted" without naming the algorithm reads as marketing. The algorithm name is the trust receipt. |
| "Settings -> Privacy -> Self-destruct" buried hierarchy | Self-destruct is a composer primitive (3.2), not a settings-screen item. |
| Two-tier security model (regular vs. secret chat) | Telegram's mistake. Single-tier PQ-double-ratcheting on every message. |
| Phone-number-as-identity in user-facing copy | Phone numbers are recovery-only. Identity is the ML-KEM-768 fingerprint emoji glyph. |
| Generic "AI assistant" framing for Q-AI | Q-AI is "PQC-tunneled local LLM with PII pre-scan", not "AI assistant". The framing matters for trust. |
| White-on-gray empty states | Empty states use the cyan glow on a dark background; never a generic gray illustration. |
| Hover-only tooltips on macOS or web | Every hover-discoverable action also lives in cmd-K palette or right-click menu. |
| Pop-over notifications without an audit row | Every user-facing notification corresponds to an audit row. If there is no audit row, we do not surface the notification. |
| Animated mascot characters or anthropomorphized helpers | The product does not have a mascot. The constellation and the eight primitives carry the personality. |
| Generic "loading spinner" during PQC operations | We use the KEM-pulse oscillation (5.4); the oscillation IS the spinner. Generic spinners read as wait, not negotiate. |
| Skeumorphic textures (paper, fabric, wood, leather) | The QDaria aesthetic is digital-first; textures clash with OKLCH precision. |
| Typewriter-style streaming text in Q-AI | Streaming chunks render in the bubble as they arrive without character-by-character animation; we do not need to imitate ChatGPT. |
| Multi-page onboarding tutorials with cartoon characters | Onboarding is one screen: verify your fingerprint with a peer or import an existing identity. The product self-explains. |
| Microcopy that uses the words "secure", "private", "trusted" | These are marketing words. We say "ML-KEM-768", "PQC-tunneled", "DORA-audited". The technical specificity is the trust signal. |
| Material You system color extraction overriding QDaria primary | Pin `dynamicColor: false`; quantum-cyan must win against any wallpaper. |
| iOS system-blue replacing QDaria cyan in Cupertino widgets | Override the iOS theme accent color in the Flutter `CupertinoThemeData`. |
| Dark-mode-only design | We must work in light mode (the QDaria token system already supports it). Light mode uses the same hue palette with adjusted lightness; we do not invent a separate light palette. |
| Generic "Welcome to Zipminator" splash screens with logo | The first screen is the constellation map (logged-in) or the verification screen (first-run). No splash. |
| Confetti or celebratory animations on send | Sending a PQ-encrypted message is the baseline; we do not celebrate it. The cyan glow on the bubble is enough. |

---

## 8. Implementation roadmap

How this brief feeds the marathon currently working in `feat/9-pillars-production-2026-04-26`. Components are split between "ready to ship in current marathon" and "follow-on UI pass".

### 8.1 Ready to ship in current marathon (Pillar 2 Messenger acceptance)

These satisfy the existing acceptance criteria in `9-pillars.md` Pillar 2 and unblock the screenshot deliverables in `_screenshots/2026-04-26/02-messenger/`.

| Item | Effort estimate | Files | Acceptance hook |
|------|-----------------|-------|-----------------|
| PQC pill (3.1) on conversation header | 1 RALPH iteration | `app/lib/features/messenger/widgets/conversation_header.dart`, `web/components/dashboard/MessengerPreview.tsx` | "send flow" screenshot shows established pill |
| Lifespan slider (3.2) in composer | 1 RALPH iteration | `app/lib/features/messenger/widgets/composer.dart` | "send flow" screenshot includes a TTL-set message |
| Self-destruct dissolve animation (5.4) on bubble | 1 RALPH iteration | `app/lib/features/messenger/widgets/message_bubble.dart` | screenshot of bubble mid-dissolve |
| Audit pill (3.6) on every encrypted bubble | 1 RALPH iteration | `app/lib/features/messenger/widgets/message_bubble.dart`, audit side-sheet widget | "audit" screenshot |
| Four-emoji peer glyph (3.8) on chat list cell | 1 RALPH iteration; depends on curated 64-emoji set | `app/lib/features/messenger/widgets/chat_list_cell.dart` plus `app/lib/core/theme/quantum_emoji.dart` (new) | "chat list" screenshot |

**Curated 64-emoji set deliverable.** A small file (`app/lib/core/theme/quantum_emoji.dart`) listing the 64 chosen Unicode codepoints with cross-platform render notes. Codepoints come from a single Unicode block (U+2600-U+27BF Miscellaneous Symbols and Dingbats; U+1F300-U+1F5FF Miscellaneous Symbols and Pictographs subset) for consistent rendering.

### 8.2 Follow-on UI pass (post-marathon)

These do not block the 100% gate but define the next iteration of the design system.

| Item | Why deferred | Files (proposed) |
|------|--------------|------------------|
| Threat-level composite gauge (3.4) | Cross-pillar; needs Mesh Wave 2 attestation finalized first | `app/lib/shared/widgets/threat_gauge.dart`, `web/components/ThreatGauge.tsx` |
| Quantum entropy provenance UI (3.5) | Needs entropy-provider trace-id propagation through `qrng/` (new minor work) | side-sheet rows in audit view |
| 9-pillar constellation map (3.7) | Replaces `web/components/SuperAppShowcase.tsx`; non-trivial layout work | `web/app/(dashboard)/page.tsx`, `app/lib/features/dashboard/constellation.dart` |
| Anonymization tier dial (3.3) v2 | Requires anonymizer Pillar 5 100% gate | `app/lib/features/anonymizer/widgets/tier_dial.dart` |
| Voice message PQ-SRTP indicator (6.6) | Depends on VoIP Pillar 3 WebRTC DTLS-SRTP replacement | `app/lib/features/messenger/widgets/voice_bubble.dart` |
| Verification screen with emoji-as-fingerprint (3.8) | Depends on the curated set landing first | `app/lib/features/messenger/screens/verification_screen.dart` |
| macOS menubar tray | Non-blocking; macOS-specific | `app/macos/menubar/` |
| Lock Screen widgets (iOS) | Non-blocking; needs iOS extension target | `app/ios/widgets/` |

### 8.3 Test strategy alignment

Every component above lands with widget tests under `app/test/`. Tests verify:
- The PQC pill renders the algorithm name when state is established.
- The lifespan slider's emit value matches the bubble's TTL when the message is sent.
- The bubble dissolve animation completes within `--motion-decoherence` (640ms).
- The audit pill's tap opens the audit side-sheet.
- The four-emoji glyph is deterministic for a given fingerprint.

The test count goes from 60 (current) to ~75 by the end of the marathon's Messenger pillar acceptance.

### 8.4 Token integration sequence

1. Land tokens (5.1, 5.2, 5.3, 5.4, 5.5, 5.6) in `app/lib/core/theme/quantum_theme.dart` and `web/app/globals.css`.
2. Land curated emoji set (`app/lib/core/theme/quantum_emoji.dart`).
3. Land the five Messenger components (8.1) in parallel using the marathon's track-M (mobile) lane.
4. Run universal gates (`cargo test --workspace --exclude zipbrowser`, `cd app && flutter test`, Playwright screenshots).
5. Update `docs/guides/FEATURES.md` Pillar 2 to 100% with today's date.

---

## What to do tomorrow

The three highest-impact components from this brief that the marathon's Messenger pillar should integrate before declaring 100%: (1) the PQC pill from 3.1 on the conversation header, because it converts the invisible negotiation handshake into the product's signature trust receipt; (2) the lifespan slider from 3.2 in the composer paired with the dissolve animation from 5.4 on outgoing bubbles, because it promotes self-destruct from a settings-screen item to a daily composer decision; (3) the audit pill from 3.6 on every encrypted bubble with the side-sheet that opens the DORA-compliant audit row, because it makes the regulatory claim visible per-message rather than as a buried log file. These three together carry the originality argument with the smallest footprint of new code (five widget files, two new tokens, one curated emoji file), and they unblock the `_screenshots/2026-04-26/02-messenger/` deliverables that gate Pillar 2's 85% to 100% advance.
