# CLAUDE.md

Operating manual for Claude Code sessions working on CONGREGATION. This
project is built for **long-horizon autonomous agentic development**: any
session should be able to start cold, orient in two minutes, do real work,
and leave the trail clean for the next one.

## What this is

A cozy-horror idle game: you are a nameless thing beneath the coastal town of
Marrow Bay; taps are whispers, whispers earn Dread, Dread converts townsfolk,
the SVG town visibly rots as your congregation grows, until the Awakening and
NG+. Full design: [docs/GDD.md](docs/GDD.md) and siblings.

**Shipped product = `index.html` + `src/*.js` + `src/style.css`. Nothing
else.** No npm, no bundler, no backend, no web fonts, no runtime fetches, no
network at all. `package.json`, if it ever exists, is dev-only test tooling
and gitignored. Works from `file://`.

## The session loop (follow this every time)

1. **Orient** — read [STATUS.md](STATUS.md) (latest entries) and
   [ROADMAP.md](ROADMAP.md) (first unchecked phase). Skim
   [DECISIONS.md](DECISIONS.md) before proposing any direction change.
2. **Work the current phase**, in roadmap order. Don't start phase N+1 with
   phase N unchecked unless the box is genuinely blocked (say so in STATUS).
3. **Verify** — every phase lists its verification steps; they are the
   definition of done. Always, additionally:
   ```bash
   node --check src/*.js sim/*.js        # syntax gate, per file
   node sim/run.js                       # MUST stay green — economy regression test
   python3 -m http.server 8000           # manual checks at localhost:8000
   ```
4. **Record** — tick ROADMAP checkboxes; append a dated entry to STATUS.md
   (what shipped, what's verified, what's next, any surprises); append to
   DECISIONS.md if you locked a call.
5. **Commit** per coherent unit with clear messages; push to the designated
   branch for the session.

## Architecture (mirror of the wallpaper studio's proven pattern)

Ordered classic `<script>` files sharing one global scope — no ES modules:

```
balance.js → state.js → town.js → narrative.js → audio.js → ui.js → app.js
```

- **`src/balance.js`** — the economy: all constants + pure reducers
  (`buyTier`, `buyRite`, `buyNotable`, `tickEye`, `awaken`, `offlineDread`…).
  Also `require()`-able from Node — that duality powers the sim. **All state
  mutation goes through these reducers.** UI code computing its own costs or
  mutating `state` directly is a bug, even when the math would be right.
- **`sim/run.js`** — headless economy sim + invariant suite. Exits non-zero
  on drift. Run it after ANY change to balance.js — it has already caught two
  game-killing design bugs (see STATUS 2026-08-15).
- Remaining files own exactly what their name says; contracts per phase in
  ROADMAP.md; specs in docs/.

## Hard constraints

- **Determinism:** randomness only via the seeded PRNG (`mulberry32` port in
  balance.js when needed). Never `Math.random()`/`Date.now()` in game logic;
  wall-clock enters only at the engine boundary (ticks, save timestamps).
- **Balance rules:** the 4× consumption-profitability rule and the shallow
  follower curve (explained atop `TIERS` in balance.js). The sim enforces
  them — keep it green, and keep ECONOMY.md's results table honest.
- **SVG discipline:** < 1500 elements in the town; namespace all SVG ids
  (`b-`, `grad-`, `fx-`) so they can never collide with control ids; ambience
  is CSS-animated, never per-frame JS.
- **Saves are sacred:** versioned envelope; unknown version → migrate or
  quarantine, never wipe. Any state-shape change bumps the version and adds a
  migration.
- **Text is canon in docs/NARRATIVE.md** — edit there first, then mirror to
  `src/narrative.js`.
- **Numbers are canon in `src/balance.js`** — docs quote them for
  orientation only.

## Judgment calls already made

See [DECISIONS.md](DECISIONS.md). Headlines: Suspicion is IN; own repo,
standalone (not inside the wallpaper studio app); no monetization/telemetry;
horror stays PG-13 dread — no gore, no jump scares, never name the thing.

## When you get stuck

Prefer shipping the phase's checklist smaller-but-verified over broad-but-
untested. Leave failing states documented in STATUS.md, never silently. If a
design question has no answer in docs/ or DECISIONS.md, make the smallest
reversible call, record it in DECISIONS.md as "provisional", and continue.
