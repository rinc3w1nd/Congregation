# STATUS.md — session ledger

Newest entry first. Every working session appends: date, what shipped, what
was verified, surprises, and the concrete next step.

---

## 2026-08-15 — Phases 1–2 complete: engine core + playable economy

**Shipped**
- `index.html` + `src/style.css`: full mobile-first shell (HUD with Dread/
  rate/Eye, town slot, gazette ticker, 4 tab panels, WHISPER thumb button,
  overlay system, stage-token palettes, stage-4 breathing, reduced-motion).
- `src/state.js`: versioned save envelope, quarantine-not-wipe corrupt
  handling, big-number formatter.
- `src/app.js`: 250ms fixed logic tick (wall-clock driven, catch-up capped,
  long gaps become offline progress), rAF render, autosave 15s +
  visibility/pagehide, offline report, dev hooks (?grant/?stage/?vision).
- `src/ui.js`: Flock/Rites/Folk/More panels fully wired through BAL
  reducers; the Eye renders as an opening eyelid; double-confirm reset;
  Awakening button (gated); overlay queue.
- Stubs with final API surface: town.js, narrative.js, audio.js.

**Verified (Playwright, real Chromium)**
- Tap earns; buy Follower works; passive accrual matches rate; save
  round-trips across reload; 10h absence → offline overlay capped at 8h
  with correct copy; corrupt save quarantined to `-corrupt` key + "bad
  dream" notice + fresh state; tabs switch; ?grant/?stage work; rites
  purchasable; Inquiry fires at maxed Eye, claims followers, floors at 1,
  shows overlay. No page errors.

**Surprises**
1. `#overlay { display:flex }` overrode the `hidden` attribute — an
   invisible full-screen overlay ate every click. (`#overlay[hidden]` fix.)
2. **Inquiries could never fire:** tickEye decayed before threshold-check,
   so an Eye pinned at exactly 100 slid under before testing. Fixed +
   invariant added. This also exposed that Follower-only Inquiry claims are
   toothless late-game → Inquiries now seize Dread too (see DECISIONS.md).

**Next**
- Phase 3: `src/town.js` — build Marrow Bay (31 buildings, 5 stage
  treatments per docs/TOWN.md).

## 2026-08-15 — Phase 0 complete: concept, economy, harness

**Shipped**
- Full design doc suite: GDD, ECONOMY, TOWN (31 buildings / 5 districts /
  5 corruption stage specs), NARRATIVE (all 15 visions, 12 notables, gazette
  pools per stage written), AUDIO, UI.
- `src/balance.js` — complete economy as pure reducers (tiers, 17 rites,
  12 notables, Eye/Inquiry, corruption, Awakening/NG+, offline).
- `sim/run.js` — headless sim: optimal + casual profiles through the real
  reducers, pacing-window asserts + safety invariants, non-zero exit on
  drift.
- Harness: ROADMAP (phases 1–8 with acceptance criteria), CLAUDE.md session
  loop, DECISIONS.md.

**Verified**
- `node --check` clean; `node sim/run.js` green: optimal Awakening 41.7m,
  casual 44.0m, acolyte 3.9m, stage 1 at 4.2m, engine humming 5.0m; Inquiry
  floor / offline cap / glyph invariants pass.

**Surprises (both caught by the sim's first runs — keep it green)**
1. Draft tier rates violated what became the 4× rule: Acolytes were a *rate
   loss* once follower rites stacked, so optimal play never tiered up.
2. Follower feedstock on a 1.15 curve made the first Priest's true chain
   cost ~30× its sticker price; mid-game was dead. Fixed with 1.10 follower
   growth + softened counts (8/6/5/4).

**Next**
- Phase 1 (engine core): `index.html` shell, tick engine, tap, save/offline.
  See ROADMAP.md Phase 1 for the checklist and verification steps.

**Note on sim caveats**
- Sim shows 0 Inquiries under both profiles (it deliberately waits out the
  Eye). Acceptable per design (see ECONOMY.md), but Phase 2's manual verify
  should confirm a notable-binge run does trigger one.
- Sim buys only ~4/12 notables (they're not payback-optimal — by design).
  UI must sell them as story, not math (UI.md).
