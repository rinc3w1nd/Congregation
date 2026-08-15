# CONGREGATION

You are a nameless thing beneath **Marrow Bay**, a quaint coastal town.
Every tap is a whisper into a sleeper's dream. Whispers earn **Dread**.
Dread converts townsfolk. The town — the centerpiece of the screen — visibly
rots as your congregation grows, until you can afford the final rite:
**the Awakening**.

Cozy idle mechanics, escalating wrongness. The horror is in the pacing, not
jump scares.

**Status: in development — Phase 0 (design + economy + harness) complete;
the playable engine begins in Phase 1.** See [ROADMAP.md](ROADMAP.md) and
[STATUS.md](STATUS.md).

## Playing (once Phase 1 lands)

No build, no dependencies — open `index.html`, or:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## Development

This project is set up for long-horizon autonomous agentic development:

- [CLAUDE.md](CLAUDE.md) — the session operating manual (start here)
- [ROADMAP.md](ROADMAP.md) — phases 1–8 with acceptance criteria
- [STATUS.md](STATUS.md) — dated ledger of what's done and verified
- [DECISIONS.md](DECISIONS.md) — locked design calls (append-only)
- [docs/](docs/) — full design: [GDD](docs/GDD.md) ·
  [Economy & Suspicion](docs/ECONOMY.md) · [Town & Corruption](docs/TOWN.md) ·
  [Narrative](docs/NARRATIVE.md) · [Audio](docs/AUDIO.md) · [UI](docs/UI.md)

The economy is already real: [`src/balance.js`](src/balance.js) holds every
constant and reducer, and the headless sim proves the pacing targets —

```bash
node sim/run.js   # simulates optimal + casual runs; non-zero exit on drift
```

Current proven pacing: first Acolyte ~4 min, corruption stage 1 ~4 min,
engine humming ~5 min, **the Awakening at ~42 min (optimal) / ~44 min
(casual)**, banking the first Name glyph (+25%, permanent — the town
forgets; your Name persists).
