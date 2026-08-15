# CONGREGATION — Game Design Document

> You are a nameless thing beneath Marrow Bay, a quaint coastal town.
> Every tap is a whisper into a sleeper's dream. The town rots as your
> congregation grows. The horror is in the pacing, not jump scares.

This is the master design doc. Numbers live in [`src/balance.js`](../src/balance.js)
(single source of truth, proven by [`sim/run.js`](../sim/run.js)); systems detail
lives in the sibling docs. If a doc and `balance.js` disagree, `balance.js` wins
and the doc has a bug.

## Pillars

1. **Cozy idle mechanics, escalating wrongness.** Every mechanic is a familiar
   idle-game comfort (tap, buy, multiply, prestige) delivered warmly — and the
   *content* curdles around it. The player should feel the genre's dopamine and
   a low hum of complicity at the same time.
2. **The town is the centerpiece.** The SVG map of Marrow Bay dominates the
   screen. Progress is read primarily off the town's decay, not off numbers.
3. **Horror by pacing.** No jump scares, no gore. Wrongness accumulates in
   details: a headline, a dark window, smoke drifting toward the bay. Stage
   transitions are noticed a beat *after* they happen.
4. **Dependency-free, build-free, offline-first.** Classic `<script>` files
   sharing one global scope, no npm in the shipped product, works from
   `file://`. Inherited from the GrapheneOS Wallpaper Studio ethos.
5. **Deterministic.** All randomness is seeded (`mulberry32`). The gazette,
   town jitter, and mote drift replay identically for a given state. Never
   `Math.random()` or `Date.now()` inside game logic (wall-clock time enters
   only at the engine boundary for ticks/offline).

## Core loop

```
tap (whisper) → Dread → convert Followers → passive Dread
   → Rites (upgrades) → tier-ups (Acolytes…Avatar) → corruption stages
   → the Awakening → NG+ (the town forgets; your Name persists)
```

- **Dread** is the only currency. Earned by tapping (whispers) and passively
  by the congregation.
- **Congregation tiers** — Followers → Acolytes → Priests → Heralds → Avatar.
  Each tier consumes bodies from the tier below plus Dread, and generates more.
  See [ECONOMY.md](ECONOMY.md).
- **Rites** — three upgrade trees: *Whispers* (tap power), *Congregation*
  (passive multipliers), *Veils* (suspicion control). Defined in `balance.js`.
- **Suspicion** — the tension mechanic (LOCKED IN, see [DECISIONS.md](../DECISIONS.md)).
  Conversions of notable townsfolk and high-tier purchases raise the **Eye**
  meter; at max, an **Inquiry** claims a share of Followers (never below 1 —
  softlock-proof, invariant-tested). Counterplay lives in the Veils tree.
  See [ECONOMY.md § Suspicion](ECONOMY.md#suspicion).
- **Corruption** — five town stages driven by lifetime Dread:
  *quaint → off → wrong → consumed → the Choir*. See [TOWN.md](TOWN.md).
- **The Awakening** — the final rite: requires corruption stage 4 and a large
  Dread pile. Ends the run with a finale sequence, banks **Name glyphs**
  (permanent +25% Dread each), and resets the town. NG+ begins immediately;
  the town is quaint again, but the Gazette misremembers things it never saw.

## Narrative spine

~15 milestone **visions** (short text overlays, dismiss on tap) mark systemic
firsts; 12 **notable townsfolk** are named story conversions with their own
beats; the rotating **Marrow Bay Gazette** ticker's headlines slowly go wrong
per corruption stage. All text lives in [NARRATIVE.md](NARRATIVE.md) and ships
as data in `src/narrative.js`.

## Audio

A layered WebAudio drone that deepens per corruption stage — no audio assets,
pure synthesis. Unlocks on first tap (autoplay policy), toggleable, defaults
on once unlocked. Spec in [AUDIO.md](AUDIO.md).

## UI

Mobile-first portrait layout: Dread counter + Eye strip on top, the town map
as the hero element, Gazette ticker beneath it, and a thumb-zone whisper
button + tab strip at the bottom. At stage 4 the UI itself starts breathing.
Spec in [UI.md](UI.md).

## Engine

- Fixed-timestep tick (250ms logic tick; rendering decoupled via rAF).
- Big-number formatting (1.24M, 8.02T … then scientific).
- Save to `localStorage` every 15s + on `visibilitychange`/`pagehide`;
  versioned save envelope; corrupt saves quarantined, never silently wiped.
- Offline progress on return: capped at 8h, 60% efficiency, presented as the
  **"While the town slept…"** dream-tally report.
- Reset (hard wipe) behind a double confirm. The Awakening is *not* a reset —
  it is the point of the game.

## Pacing targets (proven, not aspirational)

`node sim/run.js` simulates optimal and casual play through the real balance
reducers and **fails CI-style** if these drift:

| Target | Value |
|---|---|
| First Follower (human, incl. reading) | ~30s |
| First Acolyte (active) | ~3–4 min |
| Engine humming (passive > 4× tap) | ≤ 15 min |
| Corruption stage 1 | ~4–5 min (first 5 minutes must escalate once) |
| The Awakening (optimal / casual) | ~42 min / ~44 min + idle sessions |

## What this game is not

- Not a clicker-only number climber — Suspicion and the town's decay give it
  a push-your-luck spine and a legible fiction.
- Not gacha, not monetized, no meta-currency beyond Name glyphs.
- Not networked. No accounts, no telemetry, nothing leaves the device.
