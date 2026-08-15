# STATUS.md — session ledger

Newest entry first. Every working session appends: date, what shipped, what
was verified, surprises, and the concrete next step.

---

## 2026-08-15 — Phase 8 complete: THE GAME SHIPS. All phases done.

**Shipped**
- Committed Playwright suite (`tests/`, `playwright.config.js`,
  `package.json` dev-only): 12 specs consolidating every ad-hoc check —
  engine (tap/buy/passive/save round-trip, 8h offline cap with report,
  corrupt-save quarantine, double-confirm reset), economy (the sim runs AS
  a test, Inquiry fires/claims/floors/seizes, reducers-only purchases),
  town (element budget, window determinism, stage overrides, halos +
  converted styling), narrative (visions fire once, beats, ticker cycle,
  full Awakening → NG+ persistence), audio (unlock, 5 layers, toggle
  persistence, one-shot safety). **12/12 green.**
- README rewritten as a shipped-game page with both marquee screenshots.

**Line-by-line audit vs. the concept lock — every MVP item ships:**
engine/tick/big numbers/save/offline-report/reset ✓ · 5 tiers consuming
downward on 1.1x-family curves ✓ (follower 1.10 / upper 1.13, a recorded
deviation that the sim forced — see DECISIONS) · 31-building/5-district
SVG town with 5 corruption stages, palette shifts, dark windows, tendrils,
breathing UI at stage 4 ✓ · rotating Gazette going wrong per stage ✓ ·
Eye/Inquiry with 1-Follower floor + Sheriff/Gazette counterplay rites ✓ ·
three rite trees ✓ · 15 vision beats (14 milestones + finale) and 12 named
notables ✓ · five-layer WebAudio drone, first-tap unlock, toggle ✓ ·
pacing: first convert ~30s human, Acolyte 3.9m, humming 5.0m, Awakening
41.4m optimal / 43.6m casual, first-5-minutes escalation at 4.2m ✓ ·
NG+ permanent multiplier ✓.

**The project is done to MVP.** Next session, if any: play-feel tuning
from real human sessions, or items under "Deferred" (each needs a new
decision first).

## 2026-08-15 — Phase 5 complete: the drone

**Shipped**
- `src/audio.js` per docs/AUDIO.md: five cumulative layers (ground drone +
  seeded-noise surf with wave-lap LFO, detuned unease, 27.5Hz depth, formant
  "aw" presence, choir triad + heartbeat), compressor + master ramps, surf
  slows per stage and holds still at the Choir. One-shots: rate-limited
  whisper noise-burst, convert blips (fifth added for grand tiers), vision
  swell, Inquiry duck, 8s Awakening glissando → hard cut → stage-0 resume.
- Preference persisted (`congregation-audio`); unlocks inside first tap;
  suspends on tab hide; toggle label live in More.

**Verified (browser, autoplay-relaxed Chromium)**
- No ctx before first tap; running ctx + layer 1 after; 4 layers at stage
  3, 5 at stage 4; toggle-off ramps master to 0 and persists "0"; whisper
  spam and awaken() error-free.

## 2026-08-15 — Phases 4 + 6 complete: narrative layer and the Awakening

**Shipped**
- `src/narrative.js`: all 14 milestone visions + finale text, 12 notable
  card/beat pairs, gazette pools for all five stages + NG+ pool, seeded
  no-repeat ticker rotation, vision trigger engine (fired flags persisted in
  `visionsSeen`), notable conversion beats as overlays, finale sequence
  (awakening vision → NG+ card with glyph math → onDismiss starts NG+).
- Overlay queue: `onDismiss` support; offline report gains the NG+ chalk
  line on runs 2+.
- Phase 6 was already wired through app/ui scaffolding: awaken() state swap,
  fold animation, glyph banking, UI rebuild into NG+.

**Verified (browser)**
- Wake vision on first tap; taste at 100 lifetime; Maren converts with her
  beat overlay (kicker = her name) and her card flips to the beat text.
- Ticker: 7 unique lines before any repeat, deterministic cycle order.
- Full finale: grant 2.5e8 → THE AWAKENING button → confirm → "You stop
  whispering." → NG+ card "+1 Name glyph — all Dread ×1.25 forever" →
  fresh state {glyphs:1, awakenings:1, dread:0, stage 0}, tapPower 1.25,
  all surviving reload. No page errors.

**Surprises**
- Playwright refuses to click elements under the stage-4 breathing
  animation ("element is not stable") — by design; tests must use
  force:true at stage 4. Noted for the Phase 8 suite.

## 2026-08-15 — Phase 3 complete: Marrow Bay drawn, five stages live

**Shipped**
- `src/town.js`: all 31 buildings across the 5 districts as one 255-element
  SVG (budget 1500), built once, restyled per stage. Per-kind silhouettes
  (spire, clocktower, cannery stack, lighthouse, water tower, jetty with the
  Child, terraces, chapel stones, quarry cut). Seeded jitter + seeded window
  thresholds (fully deterministic, verified identical across reloads).
- Stage treatments per docs/TOWN.md: windows darken on schedule (all lit in
  accent at stage 4), gulls vanish at 1, smoke mirrors toward the bay,
  clocktower runs then stops at 3:14, tide rises, boats go dead-calm
  uniform, shoreline tendrils then webs, the Bore fades in with pulsing
  rings, lighthouse beam sweeps lazy → hunting → fixed down into the Bore
  (rotate(-82deg) scale(1.55), aimed empirically via screenshots).
- Notable halos + converted-building window styling wired to TOWN.refresh.

**Verified**
- Screenshots of all five stages via Playwright/Chromium eyeballed; element
  count 255; window determinism across reloads; ?stage override works; HUD
  stage label follows the dev override; no page errors.

**Surprises**
- SVG beam geometry vs. screen intuition: aim the lighthouse by screenshot,
  not by arithmetic. The dev `?stage=` hook made this a 3-minute loop.

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
