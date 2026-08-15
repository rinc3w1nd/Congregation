# CONGREGATION — UI

Mobile-first portrait, one screen, no scrolling in the core view. System
`ui-monospace` stack (no web fonts). One `src/style.css`, design tokens in
`:root`, stage palettes as `[data-stage="n"]` token overrides so the whole UI
shifts with the town.

## Layout (top → bottom)

1. **Header strip** — Dread counter (big), Dread/s (small), and the **Eye**:
   a thin meter that reads as a closed lid at 0 and opens as it fills (lid
   line bows into an almond shape; iris appears past 60%). Tapping the Eye
   explains itself in one sentence — the only tooltip in the game.
2. **The town** — the SVG map, the hero, ~45% of viewport height.
   Notable-available halos pulse here; Inquiries play out here (headlights
   sweep Main Street).
3. **Gazette ticker** — one marquee line, `MARROW BAY GAZETTE —` prefix.
4. **Panel area** — one panel at a time, tab-selected: **Flock** (tiers),
   **Rites** (three trees), **Folk** (notable cards), **More** (audio toggle,
   stats, offline cap note, reset, the Awakening button when unlocked).
5. **Thumb zone** — the **WHISPER** button, full-width, huge tap target;
   segmented tab strip directly above it. (Layout kinship with the wallpaper
   studio's tab/pill pattern is intentional; steal its ergonomics, not its
   code.)

Desktop: same column, max-width ~520px, centered; map may grow taller.

## Juice (phase 8, but designed now)

- **Dread motes:** on tap, 1–3 tiny particles drift from the tapped point
  toward the Dread counter (CSS transforms, pooled nodes, seeded jitter).
  Passive income emits an occasional mote from a lit window — the town is
  *paying* you; players should feel it.
- **Number juice:** counter eases (lerp) toward the true value; buy buttons
  do a 1-frame press scale; affordable buys get a soft glow, never a bounce.
- **Breathing UI (stage 4):** panels and the whisper button inherit the map's
  7s scale oscillation via a shared CSS animation. Subtle: 1±0.004.
- **Visions:** full-screen dim, text fades in over 600ms, any tap dismisses.
  Never two queued visions back-to-back without a tap between.
- `prefers-reduced-motion`: kills motes, breathing, flicker; keeps crossfades.

## Buttons & affordances

- Tier rows: name, count, rate contribution, cost (Dread + bodies, e.g.
  "220 ᛞ + 8 Followers"), disabled state shows *which* ingredient is short.
- Rite cards: name, blurb (the flavor line from `balance.js`), effect, cost.
  Owned rites stay visible, dimmed — the trees are a trophy wall.
- Notable cards: portrait silhouette, card line, cost, Eye cost shown as an
  eye glyph count. Converted cards flip to their beat text.
- Big-number format: `1.24K / 8.02M / 1.10B / 4.4T`, then `1.2e15`.

## Non-negotiables

- Whisper button min 88px tall; all interactive targets ≥ 44px.
- The game is fully playable one-thumbed, right or left handed (centered
  controls, no corner-critical actions).
- No layout shift on number width changes (tabular numerals / fixed slots).
- Every panel reachable in ≤ 1 tap from the core screen.
