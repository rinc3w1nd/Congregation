# CONGREGATION — Districts (Phase 9)

**Whispers land somewhere.** The MVP's single WHISPER button made the monster
a shopkeeper: the map was decoration, and tapping fell from 67% of income at
one minute to 2.6% by twenty. Districts make the town the input surface and
give the verb a lasting decision.

Data and reducers live in [`src/balance.js`](../src/balance.js)
(`DISTRICTS`, `whisperInto`, `districtYield`, `decaySaturation`); numbers
below orient, the code rules.

## The five

| District | Dread | Eye / whisper | Saturates | Role |
|---|---|---|---|---|
| **Harborfront** | ×1.3 | — | normal | The dependable earner. |
| **Old Town** | ×0.7 | **−1.2** | normal | Bleeds suspicion. Turns the Eye from a wall into a valve. |
| **The Commons** | ×1.0 | — | normal | +1 murmur; murmur buys **free Followers**. |
| **Hillside** | ×1.9 | +0.25 | **fast** | Richest ground, and the most noticed. Burst it while the lid is shut. |
| **The Verge** | ×0.8 | −0.1 | **never** | Weak, safe, inexhaustible. The idle tap. |

## Saturation — why you rotate

Every whisper adds to a district's saturation; yield falls toward a floor of
**25%**, and past **0.7** the same street dreaming the same dream every night
starts drawing notice (+0.35 Eye per whisper on top of the district's own).
Saturation decays at **0.085/s**.

The tuning is deliberate and sim-proven:

- Rotating five districts at ~3 taps/s adds ~0.05 sat/s to each — just under
  the decay, so a rotating player keeps the whole town fresh.
- Mashing one adds ~0.26/s and tanks it to the floor in about six seconds.

Cost of ignoring this, measured by `sim/run.js` (the `sloppy` profile mashes
Hillside forever): **Awakening at 53.2m vs 42.0m, and 35 Inquiries vs 9.**
The sim asserts rotation stays worth ≥5%, so the layer can never quietly
decay into decoration.

## Murmur

Commons whispers accumulate murmur; at `45 × 1.12^followers` you gain a free
Follower. Strong early, deliberately fading — late game the Commons is a
minor earner and Old Town's Eye valve is what you want.

Murmur was originally 12 × 1.10 and handed you the very first Follower about
four seconds in, stealing the "first convert ~30s" beat. Raised until the
*bought* first Follower comes first.

## How it plays

Early: burst Hillside, top up Harborfront, drift to Commons for free bodies.
Mid: the Eye starts climbing off Priest/Herald purchases, so Old Town enters
the rotation as a real move rather than a chore. Late: buying an Avatar costs
+12 Eye, which is ten Old Town whispers — so the endgame rhythm becomes
*spend, quiet the town, spend again*, and the Verge is where you park when
you are just idling.

## Interface

- The **chip strip** above the WHISPER button is the mobile-first control:
  five ≥46px targets, each showing its saturation as a fill bar (red when
  obvious). One-thumb play is preserved — select occasionally, tap a lot.
- **Any building on the map** is also tappable and whispers into its district,
  for precision and for players holding the device two-handed.
- Saturated districts visibly **dim on the map**; the selected district's
  buildings lift slightly toward the accent colour.
- A ripple marks where each whisper landed — red when you are being obvious.

## Teaching it

No tutorial. The `spent` vision fires the first time any district passes 0.85:

> The same street has had the same dream four nights running. They are
> starting to compare notes at the bakery — pleasantly, over bread, the way a
> town does right before it stops being pleasant. Let that ground rest. Speak
> somewhere else.

The whisper button also states the live yield and says *this ground is spent*
/ *you are being obvious* as it happens.
