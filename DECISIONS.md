# DECISIONS.md — locked calls

Append-only. Sessions may add entries; never delete one — supersede it with
a new dated entry that references the old.

## 2026-08-15 — Concept lock

- **Suspicion is IN.** The Eye/Inquiry system ships in the MVP. It is a
  pacing brake and mood device, not a mandatory punishment: disciplined play
  can avoid Inquiries entirely; the floor of 1 Follower makes softlocks
  impossible (invariant-tested).
- **Own repo, standalone.** User call (2026-08-15): CONGREGATION lives in its
  own repository (`rinc3w1nd/congregation`), not inside GrapheneOS-Wallpaper-
  Studio. It inherits the studio's engineering posture (dependency-free,
  build-free, classic scripts, deterministic, offline-first) but shares no
  code at runtime; useful primitives (mulberry32, big-number patterns, tab
  ergonomics) are re-implemented, not imported.
- **Tone guardrails.** Cozy dread, PG-13. No gore, no jump scares, no
  children harmed on screen (the Child is eerie, never endangered). The thing
  beneath the bay is never named, never shown, never explained.
- **No monetization, no telemetry, no network.** Ever. Not a decision future
  sessions may revisit without the user.

## 2026-08-15 — Economy shape (proven by sim)

- **4× rule:** every tier's rate ≥ ~4× the summed base rate of the bodies it
  consumes (first sim run proved anything less stalls optimal play forever).
- **Feedstock curve:** Followers grow at 1.10 (upper tiers 1.13); tier costs
  price off *held* count so consumption walks prices back down. Both are
  load-bearing for mid-game pacing — see ECONOMY.md.
- **Awakening ≈ 42–44 min** (optimal/casual) at 1.2e8 Dread behind stage 4;
  first run banks 1 Name glyph (+25% each, permanent). Sim (`sim/run.js`) is
  the regression gate for all of this.

## 2026-08-15 — Engineering

- Tick = 250ms fixed logic step; render decoupled (rAF).
- Save key `congregation-save-v1`, versioned envelope, quarantine-not-wipe.
- Offline: 8h cap, 60% efficiency, passive only.
- Town SVG < 1500 elements; stage changes restyle (data-stage + CSS custom
  properties), never regenerate geometry.
