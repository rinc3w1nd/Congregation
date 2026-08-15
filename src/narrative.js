"use strict";
/*
 * CONGREGATION — narrative.js (Phase 4 ships the real visions/gazette/folk
 * text; this stub holds the full API surface so the engine wires cleanly.
 * Canonical text: docs/NARRATIVE.md.)
 */

var NARRATIVE = {
  init(game) { this._game = game; },
  reset(state) {},
  // Engine events: {type:"firsttap"|"tick"|"buy"|"stage"|"inquiry"}
  step(state, ev) {},
  // Awakening finale: show sequence, then call done() to enter NG+.
  finale(state, res, done) {
    UI.queueOverlay({
      kicker: "the awakening",
      text: "You stop whispering.",
      sub: "+" + res.glyphsGained + " Name glyph" + (res.glyphsGained > 1 ? "s" : ""),
    });
    setTimeout(done, 1200);
  },
  preview(id) {},
  tickerLine(state) { return "MARROW BAY GAZETTE — regatta pushed to Sunday on account of weather"; },
  notableCard(id) { return ""; },
  notableBeat(id) { return ""; },
};
