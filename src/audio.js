"use strict";
/*
 * CONGREGATION — audio.js (Phase 5 ships the layered drone; this stub holds
 * the API surface. Spec: docs/AUDIO.md.)
 * API: AUDIO.unlock() · setEnabled(b) · enabled() · setStage(n) ·
 *      whisper() · convert(tier) · visionSwell() · duck() · awaken()
 */

var AUDIO = {
  _on: false,
  unlock() {},
  setEnabled(b) { this._on = !!b; },
  enabled() { return this._on; },
  setStage(n) {},
  whisper() {},
  convert(tier) {},
  visionSwell() {},
  duck() {},
  awaken() {},
};
