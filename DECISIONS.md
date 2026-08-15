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

## 2026-08-15 — Suspicion sharpened (provisional → confirmed by sim)

- **tickEye checks the threshold before decaying.** Decay-first meant a
  purchase pinning the Eye at exactly 100 slid to 99.95 before the check and
  Inquiries could never fire at all. Caught by the Phase 2 browser test;
  regression-tested in the sim's invariants.
- **Inquiries seize Dread too** (claim fraction × 0.4 of the current pile,
  so 10% base / 4% with The Sheriff Dreams Too), because Follower-only
  claims were toothless once Avatars carry the rate — the sim happily ate 18
  Inquiries rather than buy a single Veil. Pacing unaffected (41.4m/43.6m).
- **Modal fatigue guard:** only the first Inquiry of a run gets the full
  overlay; repeats are a Gazette ticker line.

## 2026-08-15 — Phase 9: the town is the input (post-MVP design change)

Found in the post-ship audit: the monster had no agency over Marrow Bay. 31
buildings, zero event listeners; tapping fell from 67% of income at one
minute to 2.6% by twenty. The player was a shopkeeper with a very good view.

- **Whispers land in a district.** Five districts with distinct yields;
  Old Town bleeds the Eye, the Commons breeds free Followers, Hillside is
  rich and noticed, the Verge is weak and safe.
- **Saturation forces rotation.** Yield decays to a 25% floor under
  repetition and past 0.7 starts drawing notice; decay is tuned so rotating
  five districts keeps them all fresh while mashing one tanks it in ~6s.
- **Suspicion became playable.** Old Town turns the Eye from a wall you wait
  out into a valve you work — the endgame rhythm is now spend, quiet the
  town, spend again.
- **Ergonomics preserved:** a 5-chip strip above the thumb button is the
  primary control; map buildings are also tappable. One-thumb play holds.
- **Taught diegetically** by the `spent` vision, not a tutorial.
- **The sim gained a `sloppy` profile** and asserts rotation is worth ≥5%,
  so this layer cannot quietly become decoration.
- Also shipped, from the same audit: the Awakening now projects the glyphs
  it would bank and what the next one costs (it was a blind button), and the
  Eye shows live what an Inquiry would claim.
- Save format v1 → v2 with migration (old saves keep progress, get a fresh
  unspent town).

Retuned to hold MVP pacing: district multipliers average >1 so rotation beats
the old flat tap; murmur raised 12→45 so free Followers stop stealing the
first-convert beat; Acolyte 150→128 to keep the first Acolyte under 4m.
