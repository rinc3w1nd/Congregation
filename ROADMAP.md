# CONGREGATION — Roadmap

Phased build plan. Work phases **in order** (later phases assume earlier
contracts). Every phase ends with: verification commands green, checkboxes
ticked here, an entry appended to [STATUS.md](STATUS.md), and a commit.
Conventions and the per-session working loop live in [CLAUDE.md](CLAUDE.md).

## Phase 0 — Concept, economy, harness ✅ (2026-08-15)

- [x] Concept locked (see DECISIONS.md — Suspicion IN)
- [x] `src/balance.js`: full economy as pure data + reducers
- [x] `sim/run.js`: headless sim proving pacing targets + safety invariants
- [x] Design docs: GDD, ECONOMY, TOWN, NARRATIVE, AUDIO, UI
- [x] Agent harness: ROADMAP, STATUS, DECISIONS, CLAUDE.md

## Phase 1 — Engine core ✅ (2026-08-15)

Files: `index.html`, `src/style.css` (skeleton), `src/state.js`, `src/app.js`.

- [x] `index.html` shell: header strip, empty map slot, panel area, WHISPER
      button; classic scripts in order `balance.js → state.js → town.js →
      narrative.js → audio.js → ui.js → app.js` (missing files may be empty
      placeholder scripts until their phase)
- [x] Tick engine in `app.js`: 250ms fixed logic tick driven by elapsed
      wall-clock (catches up after throttling), rAF render loop decoupled
- [x] Tap → `earn(state, tapPower(state))`, passive → `earn(rate·dt)`
- [x] `state.js`: save envelope `{v:1, savedAt, state}` to localStorage key
      `congregation-save-v1`; autosave 15s + `visibilitychange`/`pagehide`;
      corrupt save → quarantine to `-corrupt` key, start fresh, tell the user
- [x] Offline progress via `offlineDread()` + "While the town slept…" modal
      (only when > 10s elapsed and > 0 Dread)
- [x] Big-number formatter (shared util in `state.js`; spec in UI.md)
- [x] Hard reset behind double confirm
- [x] **Verify:** `node --check` all files; manual: tap earns, refresh
      restores, offline modal correct, clock-jump (set `savedAt` forward)
      capped at 8h

## Phase 2 — Tiers, rites, suspicion (playable economy) ✅ (2026-08-15)

- [x] Flock panel: five tier rows per UI.md (costs incl. bodies, disabled
      states, buy through `buyTier` only)
- [x] Rites panel: three trees per UI.md, `buyRite` only
- [x] Eye meter rendering + `tickEye` wired into the logic tick
- [x] Inquiry event: overlay report (NARRATIVE.md), map headlights moment can
      stub until Phase 3
- [x] **Verify:** play to first Priest in-browser; numbers match a sim trace
      at comparable timestamps (±20%); Inquiry fires when Eye maxed and
      Followers floor at 1

## Phase 3 — The town ✅ (2026-08-15)

Files: `src/town.js` (+ style.css stage palettes).

- [x] Layout table for all 31 buildings (TOWN.md), `buildTown()` → one SVG,
      < 1500 elements, seeded jitter only
- [x] Stage styling via `data-stage` + CSS custom properties; 4s crossfade
- [x] All five stage treatments per TOWN.md (windows, smoke, boats, tide,
      tendrils, the Bore, lighthouse behavior, stage-4 breathing)
- [x] Notable halos (available) + converted-building styling
- [x] **Verify:** dev-only `?stage=n` URL override to eyeball each stage;
      element count logged and < 1500; determinism: same state → identical
      SVG string twice

## Phase 4 — Narrative

Files: `src/narrative.js`.

- [ ] All text from NARRATIVE.md as data (visions, notable cards/beats,
      gazette pools, offline/inquiry templates)
- [ ] Vision overlay system (queue, one-at-a-time, tap-dismiss, fired flags
      in `state.visionsSeen`)
- [ ] Folk panel: notable cards, `buyNotable` only, stage gating shown
- [ ] Gazette ticker: seeded no-repeat rotation from stage pool
- [ ] **Verify:** all 15 visions reachable (dev `?vision=id` preview); no
      vision fires twice in a run; ticker never repeats until pool exhausts

## Phase 5 — Audio

Files: `src/audio.js`.

- [ ] Layer stack per AUDIO.md; unlock on first tap; toggle persisted
- [ ] Stage crossfades in sync with map; one-shots (whisper, convert, vision,
      inquiry duck, awakening glissando)
- [ ] **Verify:** each stage adds exactly one layer (dev `?stage=` works with
      audio); toggling off silences within 2s; suspend on tab hide

## Phase 6 — Awakening & NG+

- [ ] Awakening button in More (locked → affordable states per threshold
      vision); finale sequence: audio glissando + map folds into the Bore +
      `awakening` vision + NG+ card with glyphs banked
- [ ] `awaken()` state swap; NG+ starts at stage 0 with glyph multiplier
      live; NG+ gazette pool mixed in; run counter shown in More
- [ ] **Verify:** sim invariants still green; in-browser: awaken with a dev
      state (`?dev=awaken`), confirm glyphs persist through refresh and
      multiply income

## Phase 7 — Polish

- [ ] Dread motes, number easing, press states, affordable glows (UI.md)
- [ ] Stage-4 breathing on UI panels; `prefers-reduced-motion` honored
- [ ] Thumb-zone audit on a 360×780 viewport; targets ≥ 44px
- [ ] First-5-minutes feel pass: escalation beat present (stage 1 ~4–5min)
- [ ] **Verify:** Lighthouse-style perf sanity (no long tasks from ambience;
      CSS-only animations), reduced-motion spot check

## Phase 8 — Verification & handoff (the gate)

- [ ] Line-by-line audit of this roadmap + all docs vs. the shipped code
- [ ] `node sim/run.js` green at final constants; results table in
      ECONOMY.md refreshed to match
- [ ] Interaction audit: reset, corrupt-save recovery, offline cap,
      Inquiry floor, NG+ multiplier, save-version migration path stubbed
- [ ] Playwright smoke suite (`tests/`): loads, tap earns, buy works, save
      round-trips, stage override renders (dev-only npm, gitignored,
      mirroring the wallpaper studio's test posture)
- [ ] README updated with play instructions + screenshot

## Deferred / non-goals (do not do without a new decision)

Pages deploy wiring · i18n · cloud saves · achievements ·
any dependency, build step, or web font.
