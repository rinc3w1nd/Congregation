"use strict";
/*
 * CONGREGATION — app.js
 * The engine: load → offline report → fixed 250ms logic tick (wall-clock
 * driven, catch-up capped) + decoupled rAF render → autosave. Also the only
 * place that translates engine events (stage change, inquiry, purchase,
 * awakening) into calls on TOWN / NARRATIVE / AUDIO / UI.
 *
 * Dev hooks (URL params, harmless in normal play, used by tests):
 *   ?grant=N     — add N dread on load
 *   ?stage=N     — force corruption stage visuals (economy untouched)
 *   ?vision=id   — preview one vision overlay on load
 */

var APP = (function () {
  const TICK = 0.25;               // seconds per logic step
  const game = { state: null, acc: 0, last: 0, stage: -1, firstTap: false };
  const DEVQ = new URLSearchParams(location.search);
  const devStage = DEVQ.has("stage") ? Math.max(0, Math.min(4, Number(DEVQ.get("stage")) || 0)) : null;

  function visualStage() {
    return devStage !== null ? devStage : BAL.corruptionStage(game.state);
  }

  function applyStage(force) {
    const s = visualStage();
    if (s === game.stage && !force) return;
    const prev = game.stage;
    game.stage = s;
    document.documentElement.dataset.stage = s;
    TOWN.setStage(s);
    AUDIO.setStage(s);
    if (!force && prev >= 0) NARRATIVE.step(game.state, { type: "stage", stage: s });
  }

  function step(dt) {
    BAL.earn(game.state, BAL.ratePerSec(game.state) * dt);
    const inquiry = BAL.tickEye(game.state, dt);
    if (inquiry) {
      AUDIO.duck();
      // Full overlay only the first time; repeats are a Gazette line so the
      // late game (where the Eye maxes often) isn't a modal storm.
      if (game.state.inquiries <= 1) UI.showInquiry(inquiry);
      else UI.setTicker("MARROW BAY GAZETTE — county inspectors visit again; find nothing, take notes, take " + fmt(inquiry.dreadClaimed) + " dread of edge off the air");
      NARRATIVE.step(game.state, { type: "inquiry" });
    }
    applyStage(false);
    NARRATIVE.step(game.state, { type: "tick" });
  }

  function logic() {
    const now = performance.now();
    let dt = (now - game.last) / 1000;
    game.last = now;
    if (dt < 0) dt = 0;
    if (dt > 60) {
      // Tab was throttled/asleep past our catch-up budget: treat as offline.
      const d = BAL.offlineDread(game.state, dt);
      BAL.earn(game.state, d);
      if (dt > 300 && d > 0) UI.showOffline(d, dt, dt > BAL.OFFLINE_CAP_HOURS * 3600);
      dt = 0;
    }
    game.acc += dt;
    let steps = 0;
    while (game.acc >= TICK && steps < 240) { step(TICK); game.acc -= TICK; steps++; }
  }

  function frame() {
    UI.render(game.state);
    requestAnimationFrame(frame);
  }

  function tap(ev) {
    if (!game.firstTap) {
      game.firstTap = true;
      AUDIO.unlock();
      NARRATIVE.step(game.state, { type: "firsttap" });
    }
    BAL.earn(game.state, BAL.tapPower(game.state));
    AUDIO.whisper();
    UI.render(game.state);
  }

  // Called by UI after any successful reducer purchase.
  function onPurchase(kind, id) {
    NARRATIVE.step(game.state, { type: "buy", kind, id });
    TOWN.refresh(game.state);
    applyStage(false);
    saveGame(game.state);
  }

  function awaken() {
    const res = BAL.awaken(game.state);
    if (!res) return;
    AUDIO.awaken();
    document.body.classList.add("awakening");
    NARRATIVE.finale(game.state, res, () => {
      game.state = res.next;
      document.body.classList.remove("awakening");
      saveGame(game.state);
      UI.rebuild();
      applyStage(true);
      NARRATIVE.reset(game.state);
    });
  }

  function reset() {
    clearSave();
    game.state = BAL.newState();
    saveGame(game.state);
    UI.rebuild();
    applyStage(true);
    NARRATIVE.reset(game.state);
  }

  function rotateTicker() {
    const line = NARRATIVE.tickerLine(game.state);
    if (line) UI.setTicker(line);
  }

  function init() {
    const loaded = loadGame();
    game.state = loaded.state;
    if (DEVQ.has("grant")) BAL.earn(game.state, Number(DEVQ.get("grant")) || 0);

    TOWN.build(document.getElementById("town"));
    UI.init(game, { awaken, reset });
    NARRATIVE.init(game);
    applyStage(true);

    if (loaded.corrupt) {
      UI.queueOverlay({
        kicker: "a bad dream",
        quiet: true,
        text: "Your saved town could not be read. It has been set aside, unharmed, and a fresh one laid out.",
      });
    }
    if (loaded.offlineSeconds > 10) {
      const d = BAL.offlineDread(game.state, loaded.offlineSeconds);
      if (d > 0) {
        BAL.earn(game.state, d);
        UI.showOffline(d, Math.min(loaded.offlineSeconds, BAL.OFFLINE_CAP_HOURS * 3600),
          loaded.offlineSeconds > BAL.OFFLINE_CAP_HOURS * 3600);
      }
    }
    if (DEVQ.has("vision")) NARRATIVE.preview(DEVQ.get("vision"));

    document.getElementById("whisper").addEventListener("click", tap);
    game.last = performance.now();
    setInterval(logic, 100);
    setInterval(() => saveGame(game.state), 15000);
    rotateTicker();
    setInterval(rotateTicker, 8000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) saveGame(game.state);
    });
    window.addEventListener("pagehide", () => saveGame(game.state));
    requestAnimationFrame(frame);
  }

  init();

  return { game, onPurchase, visualStage };
})();
