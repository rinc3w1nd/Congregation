# CONGREGATION — Audio

Pure WebAudio synthesis in `src/audio.js` — **zero audio assets**. Unlocks on
first tap (autoplay policy: create/resume the `AudioContext` inside the tap
handler). Toggle in the More tab; state saved. Master gain ramps (~2s) on all
transitions — nothing in this game clicks or pops.

## The drone (one layer added per corruption stage, cumulative)

| Stage | Layer | Recipe |
|---|---|---|
| 0 | Ground | Two triangle oscillators at 55 Hz and 55.3 Hz (slow beat), lowpass at 220 Hz, very quiet. Plus filtered brown-ish noise (surf): noise buffer → bandpass ~400 Hz with slow LFO on gain, wave-lap rhythm ~0.4 Hz. |
| 1 | Unease | Add sine at 110.7 Hz (detuned octave), and slow the surf LFO by 20% — the sea breathes slower than it should. |
| 2 | Depth | Add sub sine at 27.5 Hz (felt, not heard on phone speakers — fine). Lowpass on Ground opens to 330 Hz. Surf LFO slows another 25%. |
| 3 | Presence | Add a formant pad: two sawtooth oscs (55, 82.5 Hz) through parallel bandpasses at ~500/1150 Hz (an "aw" vowel), barely audible, gain LFO ~0.05 Hz. The tendrils sound. |
| 4 | The Choir | Add a slow triadic swell: sines at 220/277/330 Hz (A–C#–E, wrong-brightly major) fading in and out on an 11 s cycle, and a heartbeat: 55 Hz sine gain-gated ×2 thump at ~0.9 Hz. Surf stops entirely — the sea is holding still. |

Stage transitions crossfade over ~4 s in sync with the map's visual fade.

## One-shots

- **Whisper (tap):** short noise burst (0.08 s) through a bandpass at
  1.2–2 kHz with fast decay — a breath consonant, pitch jittered by seeded
  PRNG. Rate-limited (max ~8/s) so button mashing stays a whisper, not a hiss.
- **Convert (any tier buy):** soft low sine blip (110 Hz, 0.15 s) + a faint
  second voice a fifth up at higher tiers.
- **Vision open:** single deep swell (2 s attack) — no sting.
- **Inquiry:** everything ducks −12 dB for 3 s. Silence *is* the sting.
- **Awakening:** all layers glissando down one octave over 8 s while the
  choir triad sustains, then hard cut to sea-noise only. Then quiet stage-0
  ground resumes: NG+.

## Engineering rules

- One `AudioContext`, one master `GainNode`; every layer is `{osc/noise →
  filter → gain}` bundles that connect/disconnect on stage change.
- All scheduling via `AudioParam` ramps — no per-frame JS.
- Noise buffers generated once with the seeded PRNG (determinism pillar).
- `visibilitychange` hidden → suspend context; visible → resume (if enabled).
- Audio must remain fully optional: the game never gates anything on sound.
