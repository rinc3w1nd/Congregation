#!/usr/bin/env node
"use strict";
/*
 * CONGREGATION — headless economy sim
 *
 * Simulates a full run through the shared balance reducers (src/balance.js)
 * to prove the pacing targets before/without opening a browser:
 *
 *   first Follower   ~30s   (active)      engine humming    ~15min
 *   first Acolyte    ~3min  (active)      Awakening         ~45-60min casual
 *
 * Two player profiles:
 *   optimal — taps 3/s for the whole run, greedy best-payback purchasing
 *   casual  — taps 3/s for 5min, then 0.8/s (checks in, mostly idles)
 *
 * "Engine humming" = passive Dread/s exceeds 4x tap income.
 * Exit code is non-zero if any pacing target or safety invariant fails,
 * so this doubles as the economy regression test:  node sim/run.js --check
 */

const B = require("../src/balance.js");

const DT = 0.25;               // sim tick, seconds
const MAX_TIME = 120 * 60;     // give up after 2 sim-hours

function tapsPerSec(profile, t) {
  if (profile === "optimal") return 3;
  return t < 300 ? 3 : 0.8;    // casual
}

// Marginal income/s gain of a hypothetical purchase, by cloning the state.
function gainOf(state, tps, buy) {
  const clone = JSON.parse(JSON.stringify(state));
  clone.dread = Infinity;      // affordability handled by caller
  if (!buy(clone)) return 0;
  clone.dread = state.dread;
  const before = B.ratePerSec(state) + B.tapPower(state) * tps;
  const after = B.ratePerSec(clone) + B.tapPower(clone) * tps;
  return after - before;
}

// One greedy purchasing pass: repeatedly buy the affordable option with the
// best payback (cost / income-gain) until nothing affordable remains.
function spend(state, tps, log, t) {
  for (;;) {
    let best = null;
    const consider = (cost, gain, exec, label) => {
      if (gain <= 0 || cost > state.dread) return;
      const payback = cost / gain;
      if (!best || payback < best.payback) best = { payback, exec, label };
    };

    for (const tier of B.TIERS) {
      if (!B.canBuyTier(state, tier.id)) continue;
      consider(B.tierCost(tier.id, state.tiers[tier.id]),
               gainOf(state, tps, c => B.buyTier(c, tier.id)),
               s => B.buyTier(s, tier.id), "tier:" + tier.id);
    }
    for (const r of B.RITES) {
      if (!B.canBuyRite(state, r.id)) continue;
      consider(r.cost, gainOf(state, tps, c => B.buyRite(c, r.id)),
               s => B.buyRite(s, r.id), "rite:" + r.id);
    }
    for (const n of B.NOTABLES) {
      if (!B.canBuyNotable(state, n.id)) continue;
      // Optimal play waits out the Eye rather than eating an avoidable Inquiry.
      const fx = B.riteFx(state);
      if (state.eye + n.eye * fx.notableEyeMult >= B.EYE_MAX - 5) continue;
      consider(n.cost, gainOf(state, tps, c => B.buyNotable(c, n.id)),
               s => B.buyNotable(s, n.id), "notable:" + n.id);
    }

    if (!best) return;
    // Endgame discipline: once stage 4 is reached, skip anything that would
    // not pay for itself before the Awakening arrives by saving alone.
    if (B.corruptionStage(state) >= 4) {
      const income = B.ratePerSec(state) + B.tapPower(state) * tps;
      const ttAwaken = Math.max(0, B.AWAKENING_COST - state.dread) / Math.max(income, 1e-9);
      if (best.payback > ttAwaken) return;
    }
    best.exec(state);
    log.buys.push({ t, what: best.label });
  }
}

function simulate(profile) {
  const state = B.newState();
  const log = { buys: [], milestones: {}, inquiries: [] };
  const mark = (key, t) => { if (!(key in log.milestones)) log.milestones[key] = t; };

  let t = 0;
  let humming = null;
  while (t < MAX_TIME) {
    const tps = tapsPerSec(profile, t);
    B.earn(state, B.tapPower(state) * tps * DT);
    B.earn(state, B.ratePerSec(state) * DT);
    const inquiry = B.tickEye(state, DT);
    if (inquiry) {
      log.inquiries.push({ t, ...inquiry });
      if (state.tiers.follower < B.INQUIRY_FLOOR) throw new Error("SOFTLOCK: followers below floor");
    }
    spend(state, tps, log, t);

    for (const tier of B.TIERS) if (state.tiersEver[tier.id] > 0) mark("first_" + tier.id, t);
    const stage = B.corruptionStage(state);
    for (let s = 1; s <= stage; s++) mark("stage_" + s, t);
    const passive = B.ratePerSec(state);
    const tapIncome = B.tapPower(state) * tps;
    if (humming === null && passive > 4 * tapIncome && passive > 1) { humming = t; mark("engine_humming", t); }

    if (B.canAwaken(state)) {
      const res = B.awaken(state);
      mark("awakening", t);
      log.glyphs = res.glyphsGained;
      break;
    }
    t += DT;
  }
  log.final = { t, dread: state.dread, lifetime: state.lifetime,
                rate: B.ratePerSec(state), tiers: { ...state.tiers },
                rites: Object.keys(state.rites).length,
                notables: Object.keys(state.notables).length,
                inquiries: state.inquiries };
  return log;
}

/* ---------------------------------------------------------- invariants -- */
// Non-pacing safety checks that must hold regardless of tuning.
function invariantChecks() {
  const fails = [];
  // Inquiry can never softlock: even at 1 follower, the floor holds.
  const s = B.newState();
  s.tiers.follower = 1;
  s.eye = B.EYE_MAX;
  const rep = B.fireInquiry(s);
  if (s.tiers.follower < B.INQUIRY_FLOOR) fails.push("inquiry dropped followers below floor");
  if (rep.claimed !== 0) fails.push("inquiry claimed the last follower");
  // Offline is capped.
  const s2 = B.newState();
  s2.tiers.follower = 100;
  const capped = B.offlineDread(s2, 1e9);
  const atCap = B.offlineDread(s2, B.OFFLINE_CAP_HOURS * 3600);
  if (capped !== atCap) fails.push("offline progress not capped");
  // NG+ multiplier applies.
  const s3 = B.newState();
  const base = B.tapPower(s3);
  s3.glyphs = 2;
  if (B.tapPower(s3) <= base) fails.push("glyph multiplier not applied to tap");
  // Awakening always banks at least one glyph.
  const s4 = B.newState();
  s4.lifetime = B.AWAKENING_COST; // lifetime below GLYPH_LIFETIME_UNIT edge
  s4.dread = B.AWAKENING_COST;
  for (let i = 0; i < B.CORRUPTION_THRESHOLDS.length; i++) s4.lifetime = Math.max(s4.lifetime, B.CORRUPTION_THRESHOLDS[i]);
  const aw = B.awaken(s4);
  if (!aw || aw.glyphsGained < 1) fails.push("awakening banked zero glyphs");
  return fails;
}

/* --------------------------------------------------------------- report -- */
const fmt = t => t === undefined ? "  never " : (t / 60).toFixed(1).padStart(6) + "m";

function report(profile, log) {
  const m = log.milestones;
  console.log(`\n=== ${profile} ===`);
  console.log(`first Follower ${fmt(m.first_follower)}   first Acolyte ${fmt(m.first_acolyte)}   first Priest ${fmt(m.first_priest)}`);
  console.log(`first Herald   ${fmt(m.first_herald)}   first Avatar  ${fmt(m.first_avatar)}   engine hums  ${fmt(m.engine_humming)}`);
  console.log(`stages         ${[1,2,3,4].map(s => fmt(m["stage_"+s])).join(" ")}`);
  console.log(`AWAKENING      ${fmt(m.awakening)}   glyphs banked: ${log.glyphs ?? 0}   inquiries: ${log.final.inquiries}`);
  console.log(`final: rate ${log.final.rate.toExponential(2)}/s  lifetime ${log.final.lifetime.toExponential(2)}  tiers ${JSON.stringify(log.final.tiers)}  rites ${log.final.rites}/16  notables ${log.final.notables}/12`);
}

function checkTargets(results) {
  const fails = [];
  const opt = results.optimal.milestones, cas = results.casual.milestones;
  const between = (name, v, lo, hi) => {
    if (v === undefined) fails.push(`${name}: never happened`);
    else if (v < lo || v > hi) fails.push(`${name}: ${(v/60).toFixed(1)}m outside [${lo/60}m, ${hi/60}m]`);
  };
  // Sim taps are frictionless; real play adds reading/UI time, so windows
  // are the sim-equivalent of the human targets (see docs/ECONOMY.md).
  between("active first follower", opt.first_follower, 5, 45);
  between("active first acolyte", opt.first_acolyte, 60, 240);
  between("optimal engine humming", opt.engine_humming, 120, 20 * 60);
  between("optimal awakening", opt.awakening, 25 * 60, 55 * 60);
  between("casual awakening", cas.awakening, 40 * 60, 75 * 60);
  if (results.casual.final.inquiries === 0 && results.optimal.final.inquiries === 0) {
    // Not a hard fail, but suspicious: the tension mechanic never fired.
    console.log("note: no Inquiry fired in either profile (Eye pressure may be too soft)");
  }
  return fails;
}

const results = {};
for (const profile of ["optimal", "casual"]) {
  results[profile] = simulate(profile);
  report(profile, results[profile]);
}
const fails = [...invariantChecks(), ...checkTargets(results)];
if (fails.length) {
  console.error("\nFAIL:\n  " + fails.join("\n  "));
  process.exit(1);
}
console.log("\nAll pacing targets and invariants hold.");
