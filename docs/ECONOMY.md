# CONGREGATION — Economy & Suspicion

**Single source of truth: [`src/balance.js`](../src/balance.js).** This doc
explains the shapes and the rules for changing them. Concrete constants are
quoted for orientation and may lag the code — when in doubt, read the code,
and always re-run `node sim/run.js` after touching it.

## Whispers (Phase 9)

Tapping is no longer a flat trickle: whispers land in one of five districts,
each paying differently and **saturating** under repetition. See
[DISTRICTS.md](DISTRICTS.md). `tapPower()` remains the base the district
multipliers scale, so rites and glyphs still apply exactly as before.

## Currency

**Dread** — earned by taps (`tapPower`) and passively (`ratePerSec`). Lifetime
Dread (`state.lifetime`) is a separate monotonic counter that drives corruption
stages and NG+ glyphs; it never decreases within a run.

## Congregation tiers

Followers → Acolytes → Priests → Heralds → Avatars. Buying a unit of tier N
costs Dread (`baseCost · growth^owned`, priced on the *currently held* count)
**plus bodies**: it consumes a fixed count of the tier below.

### Balance rules (violate these and the game stalls — the sim will catch you)

1. **The 4× rule.** Each tier's base rate must be ≥ ~4× the summed base rate
   of the bodies it consumes. Congregation rites can stack up to ×4 on a
   consumed tier while the consuming tier holds only ×2; below the 4× ratio,
   tiering up becomes a *rate loss* and optimal play (and the greedy sim)
   correctly refuses to ever tier up. This bug shipped in draft one; the sim
   caught it in its first run.
2. **Feedstock stays cheap.** Followers use a shallow 1.10 growth curve
   (upper tiers 1.13). The *true* cost of the first Priest includes rebuilding
   every consumed Acolyte and every Follower those Acolytes ate; on a 1.15
   follower curve that chain-cost was ~30× the sticker price and the mid-game
   died. Consumption prices off *held* count, so eating bodies also walks
   their price back down — this is intentional and load-bearing.
3. **Multiplier rites must outpace the tail.** The Congregation tree's later
   `allMult` rites (×2, ×2.5, ×3, ×3) are what keep the last 15 minutes from
   being pure tier-grinding. If you add tiers or raise the Awakening cost,
   check whether the tree needs another rung.

## Rites (upgrades)

Three trees, all one-time purchases, defined in `RITES`:

- **Whispers** (5): tap multipliers, plus two rites that make the tap earn a
  % of the passive rate — keeps tapping *feel* relevant after the engine hums.
- **Congregation** (7): tier-specific ×2s early, global multipliers late.
- **Veils** (5): Eye decay ×2s, notable-Eye halving (*The Gazette Prints What
  We Wish*), Inquiry claim 25%→10% (*The Sheriff Dreams Too*), and finally
  tier-purchase Eye elimination (*No One Is Watching*).

## Notables

12 named townsfolk (see [NARRATIVE.md](NARRATIVE.md)): one-time conversions
costing Dread, each granting a permanent global multiplier (×1.10–×1.30),
spiking the Eye, and firing a story beat. Late holdouts are gated behind
corruption stages (`stageMin`) — the Lighthouse Keeper and the Child cannot be
taken before stage 4. They are deliberately *not* payback-optimal purchases
(the sim buys only ~4/12); they are story pulls, and the UI should sell them
as such (portrait cards, not line items).

## Suspicion

- **Eye** meter 0–100. Gains: notable conversions (their `eye` field, halved
  by v2) and Priest/Herald/Avatar purchases (+3/+6/+12, zeroed by v5).
  Decays 0.2/s, doubled by v1 and again by v4.
- **Inquiry** at Eye=100: claims 25% of Followers (10% with v3), floors at
  **1 Follower minimum — an Inquiry never claims below the floor** (holding 0
  Followers because Acolytes ate them all is legal; then it claims none —
  invariant-tested in the sim). It also seizes Dread: claim fraction ×
  `INQUIRY_DREAD_FACTOR` (base 10%, 4% with v3) of the current pile — added
  after the sim proved Follower-only claims were toothless late-game (optimal
  play ate 18 Inquiries rather than buy one Veil). Eye resets to 35. The
  first Inquiry of a run gets a full overlay; repeats land as a Gazette line
  (no modal storm).
- Disciplined play can avoid *notable-triggered* Inquiries by waiting out
  the Eye; late-game bulk tier-buying will still trip some — the sim's
  frictionless burst-buying trips ~20 per run, a human buying at human speed
  far fewer. Suspicion is a *pacing brake and mood device*, not a mandatory
  punishment.

## Corruption

`corruptionStage(state)` = count of `CORRUPTION_THRESHOLDS` crossed by
lifetime Dread (currently 2 000 / 50 000 / 1.2 M / 25 M) → stages 0–4.
Monotonic within a run; visuals in [TOWN.md](TOWN.md).

## The Awakening & NG+

- Unlocks at stage 4; costs `AWAKENING_COST` (1.2e8) Dread.
- Banks `max(1, ⌊√(lifetime / 1e8)⌋)` **Name glyphs** — a first casual run
  banks 1, a deliberately fat run banks 2–3. Each glyph is +25% to all Dread
  gain (taps and passive), forever, across runs.
- `awaken()` returns a fresh state carrying only `glyphs` and `awakenings`.
  The town forgets; your Name persists.

## Offline progress

`offlineDread(state, elapsed)` = passive rate × elapsed × **0.6**, capped at
**8 hours**. Tap income never accrues offline. Presented as the "While the
town slept…" report; the cap and efficiency are invariant-tested.

## The sim (`sim/run.js`)

Runs three player profiles through the *actual* reducers (no reimplemented
math): **optimal** (3 taps/s throughout), **casual** (3 taps/s for 5 min,
then 0.8/s), and **sloppy** (mashes one district forever). Whispers go
through `whisperInto()`, so district choice, saturation and murmur are all
modelled; the policy treats the Eye as a budget (notice is free while the lid
is shut, expensive when it is open) rather than a flat taboo. Purchasing is greedy best-payback with two wrinkles: it won't
buy a notable that would trip an Inquiry, and after stage 4 it skips anything
that can't pay for itself before the Awakening arrives by saving alone.

It asserts the pacing windows **and** the safety invariants (Inquiry floor,
offline cap, glyph multiplier application, ≥1 glyph per Awakening), and exits
non-zero on failure — treat it as the economy's regression test and run it on
every balance change.

### Current results (2026-08-15, commit of record in STATUS.md)

| Milestone | optimal | casual |
|---|---|---|
| First Follower (sim, frictionless) | 0.1m | 0.1m |
| First Acolyte | 3.9m | 3.9m |
| First Priest | 16.9m | 17.8m |
| First Herald | 34.9m | 36.1m |
| First Avatar | 41.5m | 43.7m |
| Engine humming | 5.0m | 5.0m |
| Stages 1–4 | 4.2 / 11.9 / 25.5 / 40.0m | 4.2 / 12.4 / 26.6 / 41.9m |
| Inquiries survived | 9 | 18 |

A third profile, **sloppy** (never rotates districts), reaches the Awakening
at **53.2m** having eaten **35** Inquiries — the sim fails the build if that
gap ever falls under 5%, so district play can't decay into decoration.
| **Awakening** | **42.0m** (1 glyph) | **43.3m** (2 glyphs) |

The sim's taps are frictionless; human play adds reading/UI time, so the
"first Follower ~30s" human target corresponds to the sim's ~10s window.
