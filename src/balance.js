"use strict";
/*
 * CONGREGATION — balance.js
 *
 * The single source of truth for the entire economy: tier data, cost curves,
 * rites, notables, suspicion math, corruption thresholds, offline rules, NG+.
 * Pure data + pure functions over a plain state object. No DOM, no Date, no
 * Math.random — everything here must be callable from Node so the headless
 * economy sim (sim/run.js) can prove the pacing targets.
 *
 * Loaded as a classic <script> in the browser (defines globals, like the rest
 * of this repo) and require()d from Node by the sim. Engine/UI code must go
 * through these reducers (canBuyX / buyX) rather than reimplementing costs.
 */

/* ---------------------------------------------------------------- tiers -- */
// Each tier consumes bodies from the tier below (plus Dread) and generates
// more Dread/s on the classic 1.1x-per-owned family of cost curves.
// BALANCE RULES (proven by sim/run.js — rerun it after ANY retune here):
//  1. Each tier's rate must be ~4x the total base rate of the bodies it
//     consumes. Lower-tier rites can stack up to x4 on the consumed tier, so
//     anything under that ratio makes tiering-up a rate LOSS and optimal
//     play stalls forever.
//  2. Followers are feedstock: their growth curve must stay shallow (1.10)
//     or the true chain-cost of upper tiers (bodies included) dwarfs the
//     sticker price and the mid-game grinds dead.
const TIERS = [
  { id: "follower", label: "Followers", baseCost: 25,    growth: 1.10, rate: 0.25,   consumes: null },
  { id: "acolyte",  label: "Acolytes",  baseCost: 150,   growth: 1.13, rate: 10,     consumes: { tier: "follower", count: 8 } },
  { id: "priest",   label: "Priests",   baseCost: 2200,  growth: 1.13, rate: 320,    consumes: { tier: "acolyte",  count: 6 } },
  { id: "herald",   label: "Heralds",   baseCost: 25000, growth: 1.13, rate: 8000,   consumes: { tier: "priest",   count: 5 } },
  { id: "avatar",   label: "Avatars",   baseCost: 6e5,   growth: 1.13, rate: 130000, consumes: { tier: "herald",  count: 4 } },
];
const TIER_INDEX = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));

// Eye gained when *buying* a unit of each tier (visible acts draw notice).
const TIER_EYE = { follower: 0, acolyte: 0, priest: 3, herald: 6, avatar: 12 };

/* ---------------------------------------------------------------- rites -- */
// Three trees: whispers (tap), congregation (passive), veils (suspicion).
// fx keys: tapMult, tapRatePct (tap gains % of passive rate), tierMult:{id:x},
// allMult, eyeDecayMult, notableEyeMult, inquiryClaim, tierEyeZero.
const RITES = [
  // Whispers — tap power
  { id: "w1", tree: "whispers", name: "Sibilant Tongue",      cost: 100,    fx: { tapMult: 2 },        blurb: "Your whisper splits. Both halves are true." },
  { id: "w2", tree: "whispers", name: "Teeth of the Tide",    cost: 900,    fx: { tapMult: 2.5 },      blurb: "The surf begins repeating what you say." },
  { id: "w3", tree: "whispers", name: "The Undertow",         cost: 7000,   fx: { tapRatePct: 0.02 },  blurb: "Each whisper drags the congregation's dream behind it." },
  { id: "w4", tree: "whispers", name: "Name Unspoken",        cost: 90000,  fx: { tapMult: 3 },        blurb: "They almost say it in their sleep. Almost." },
  { id: "w5", tree: "whispers", name: "Every Mouth Is Yours", cost: 1.2e6,  fx: { tapRatePct: 0.05 },  blurb: "You no longer whisper alone." },

  // Congregation — passive multipliers
  { id: "c1", tree: "congregation", name: "Shared Dreams",    cost: 400,    fx: { tierMult: { follower: 2 } },              blurb: "The same dream, in thirty beds." },
  { id: "c2", tree: "congregation", name: "Litany of Salt",   cost: 3000,   fx: { tierMult: { follower: 2, acolyte: 2 } },  blurb: "They memorize it without being taught." },
  { id: "c3", tree: "congregation", name: "Vestments of Kelp",cost: 20000,  fx: { tierMult: { acolyte: 2, priest: 2 } },    blurb: "Still wet. Always still wet." },
  { id: "c4", tree: "congregation", name: "The Processional", cost: 150000, fx: { allMult: 2 },                             blurb: "They walk the shore at 3:14 AM. All of them." },
  { id: "c5", tree: "congregation", name: "The Bore Widens",  cost: 1e6,    fx: { allMult: 2.5 },                           blurb: "The hole under the town is not deeper. The town is shallower." },
  { id: "c6", tree: "congregation", name: "Hollow Hymns",     cost: 8e6,    fx: { allMult: 3 },                             blurb: "The organ plays notes that were never installed." },
  { id: "c7", tree: "congregation", name: "The Town Breathes In", cost: 5e7, fx: { allMult: 3 },                            blurb: "It has not breathed out yet." },

  // Veils — suspicion control
  { id: "v1", tree: "veils", name: "Drawn Curtains",                 cost: 600,    fx: { eyeDecayMult: 2 },     blurb: "Nothing to see. Nothing to see. Nothing to see." },
  { id: "v2", tree: "veils", name: "The Gazette Prints What We Wish", cost: 10000, fx: { notableEyeMult: 0.5 }, blurb: "Tomorrow's headline: NOTHING HAPPENED, AND IT WAS LOVELY." },
  { id: "v3", tree: "veils", name: "The Sheriff Dreams Too",         cost: 60000,  fx: { inquiryClaim: 0.10 },  blurb: "Dot files her reports. The reports file themselves back." },
  { id: "v4", tree: "veils", name: "Nothing Was Ever Wrong Here",    cost: 500000, fx: { eyeDecayMult: 2 },     blurb: "Ask anyone. Watch their faces while they answer." },
  { id: "v5", tree: "veils", name: "No One Is Watching",             cost: 4e6,    fx: { tierEyeZero: true },   blurb: "The Eye is still open. It is simply yours now." },
];
const RITE_BY_ID = Object.fromEntries(RITES.map(r => [r.id, r]));

/* ------------------------------------------------------------- notables -- */
// Named townsfolk. One-time conversions: cost Dread, spike the Eye, grant a
// permanent global multiplier, and fire a story vision. stageMin gates the
// late holdouts behind corruption stages.
const NOTABLES = [
  { id: "maren",    name: "Old Maren",            role: "Bait & Tackle",     cost: 50,     eye: 0,  mult: 1.10, stageMin: 0 },
  { id: "ash",      name: "Reverend Ash",         role: "Church of the Tide", cost: 1500,  eye: 20, mult: 1.10, stageMin: 0 },
  { id: "grey",     name: "The Widow Ilsa Grey",  role: "Widow's Row",       cost: 8000,   eye: 15, mult: 1.10, stageMin: 1 },
  { id: "vell",     name: "Miss Vell",            role: "Schoolhouse",       cost: 30000,  eye: 25, mult: 1.10, stageMin: 1 },
  { id: "harrow",   name: "Doc Harrow",           role: "Surgery",           cost: 100000, eye: 25, mult: 1.15, stageMin: 1 },
  { id: "quill",    name: "Editor Percy Quill",   role: "Gazette Office",    cost: 300000, eye: 30, mult: 1.15, stageMin: 2 },
  { id: "brun",     name: "Harbormaster Brun",    role: "Ferry Dock",        cost: 800000, eye: 25, mult: 1.15, stageMin: 2 },
  { id: "edda",     name: "Organist Edda",        role: "Grange Hall",       cost: 2e6,    eye: 25, mult: 1.15, stageMin: 2 },
  { id: "calloway", name: "Sheriff Dot Calloway", role: "Sheriff's Office",  cost: 6e6,    eye: 45, mult: 1.20, stageMin: 3 },
  { id: "finch",    name: "Mayor Tobias Finch",   role: "Town Hall",         cost: 1.5e7,  eye: 45, mult: 1.20, stageMin: 3 },
  { id: "keeper",   name: "The Lighthouse Keeper", role: "The Light",        cost: 5e7,    eye: 55, mult: 1.25, stageMin: 4 },
  { id: "child",    name: "The Child Who Counts Boats", role: "The Jetty",   cost: 1.2e8,  eye: 0,  mult: 1.30, stageMin: 4 },
];
const NOTABLE_BY_ID = Object.fromEntries(NOTABLES.map(n => [n.id, n]));

/* ------------------------------------------------------------ suspicion -- */
const EYE_MAX = 100;
const EYE_BASE_DECAY = 0.2;           // per second
const EYE_AFTER_INQUIRY = 35;
const INQUIRY_BASE_CLAIM = 0.25;      // fraction of Followers claimed
const INQUIRY_FLOOR = 1;              // never drop Followers below this

/* ----------------------------------------------------------- corruption -- */
// Stage 0 quaint → 1 off → 2 wrong → 3 consumed → 4 the Choir.
// Driven by lifetime Dread (monotonic — corruption never heals mid-run).
const CORRUPTION_THRESHOLDS = [2000, 50000, 1.2e6, 2.5e7];

/* ------------------------------------------------------------ awakening -- */
const AWAKENING_COST = 1.2e8;           // requires corruption stage 4
const GLYPH_LIFETIME_UNIT = 1e8;      // glyphs = floor(sqrt(lifetime/unit))
const GLYPH_MULT = 0.25;              // each Name glyph: +25% all Dread

/* -------------------------------------------------------------- offline -- */
const OFFLINE_CAP_HOURS = 8;
const OFFLINE_EFFICIENCY = 0.6;

/* ---------------------------------------------------------------- state -- */
function newState() {
  return {
    v: 1,
    dread: 0,
    lifetime: 0,          // lifetime Dread this run (drives corruption)
    tiers: { follower: 0, acolyte: 0, priest: 0, herald: 0, avatar: 0 },
    tiersEver: { follower: 0, acolyte: 0, priest: 0, herald: 0, avatar: 0 },
    rites: {},            // riteId -> true
    notables: {},         // notableId -> true
    eye: 0,
    inquiries: 0,
    glyphs: 0,            // NG+ Name glyphs (persist across Awakenings)
    awakenings: 0,
    visionsSeen: {},      // visionId -> true (narrative layer marks these)
  };
}

/* ---------------------------------------------------------- multipliers -- */
function riteFx(state) {
  const fx = { tapMult: 1, tapRatePct: 0, tierMult: {}, allMult: 1,
               eyeDecayMult: 1, notableEyeMult: 1,
               inquiryClaim: INQUIRY_BASE_CLAIM, tierEyeZero: false };
  for (const id in state.rites) {
    const r = RITE_BY_ID[id];
    if (!r) continue;
    const f = r.fx;
    if (f.tapMult) fx.tapMult *= f.tapMult;
    if (f.tapRatePct) fx.tapRatePct += f.tapRatePct;
    if (f.allMult) fx.allMult *= f.allMult;
    if (f.eyeDecayMult) fx.eyeDecayMult *= f.eyeDecayMult;
    if (f.notableEyeMult) fx.notableEyeMult *= f.notableEyeMult;
    if (f.inquiryClaim !== undefined) fx.inquiryClaim = Math.min(fx.inquiryClaim, f.inquiryClaim);
    if (f.tierEyeZero) fx.tierEyeZero = true;
    if (f.tierMult) for (const t in f.tierMult) fx.tierMult[t] = (fx.tierMult[t] || 1) * f.tierMult[t];
  }
  return fx;
}

function notableMult(state) {
  let m = 1;
  for (const id in state.notables) {
    const n = NOTABLE_BY_ID[id];
    if (n) m *= n.mult;
  }
  return m;
}

function glyphMult(state) { return 1 + GLYPH_MULT * state.glyphs; }

function globalMult(state, fx) {
  return (fx || riteFx(state)).allMult * notableMult(state) * glyphMult(state);
}

/* ----------------------------------------------------------------- math -- */
function tierCost(tierId, owned) {
  const t = TIERS[TIER_INDEX[tierId]];
  return Math.ceil(t.baseCost * Math.pow(t.growth, owned));
}

function tierRate(state, tierId, fx) {
  fx = fx || riteFx(state);
  const t = TIERS[TIER_INDEX[tierId]];
  return state.tiers[tierId] * t.rate * (fx.tierMult[tierId] || 1) * fx.allMult
         * notableMult(state) * glyphMult(state);
}

function ratePerSec(state) {
  const fx = riteFx(state);
  let sum = 0;
  for (const t of TIERS) sum += tierRate(state, t.id, fx);
  return sum;
}

function tapPower(state) {
  const fx = riteFx(state);
  return 1 * fx.tapMult * notableMult(state) * glyphMult(state)
         + fx.tapRatePct * ratePerSec(state);
}

function corruptionStage(state) {
  let s = 0;
  for (const th of CORRUPTION_THRESHOLDS) if (state.lifetime >= th) s++;
  return s; // 0..4
}

function glyphsForLifetime(lifetime) {
  return Math.floor(Math.sqrt(lifetime / GLYPH_LIFETIME_UNIT));
}

/* ------------------------------------------------------------- reducers -- */
// All mutations to the economy go through these; engine/UI/sim share them.
function earn(state, amount) {
  state.dread += amount;
  state.lifetime += amount;
}

function canBuyTier(state, tierId) {
  const t = TIERS[TIER_INDEX[tierId]];
  if (state.dread < tierCost(tierId, state.tiers[tierId])) return false;
  if (t.consumes && state.tiers[t.consumes.tier] < t.consumes.count) return false;
  return true;
}

function buyTier(state, tierId) {
  if (!canBuyTier(state, tierId)) return false;
  const t = TIERS[TIER_INDEX[tierId]];
  state.dread -= tierCost(tierId, state.tiers[tierId]);
  if (t.consumes) state.tiers[t.consumes.tier] -= t.consumes.count;
  state.tiers[tierId] += 1;
  state.tiersEver[tierId] += 1;
  const fx = riteFx(state);
  if (!fx.tierEyeZero) state.eye = Math.min(EYE_MAX, state.eye + (TIER_EYE[tierId] || 0));
  return true;
}

function canBuyRite(state, riteId) {
  const r = RITE_BY_ID[riteId];
  return !!r && !state.rites[riteId] && state.dread >= r.cost;
}

function buyRite(state, riteId) {
  if (!canBuyRite(state, riteId)) return false;
  state.dread -= RITE_BY_ID[riteId].cost;
  state.rites[riteId] = true;
  return true;
}

function canBuyNotable(state, notableId) {
  const n = NOTABLE_BY_ID[notableId];
  return !!n && !state.notables[notableId] && state.dread >= n.cost
         && corruptionStage(state) >= n.stageMin;
}

function buyNotable(state, notableId) {
  if (!canBuyNotable(state, notableId)) return false;
  const n = NOTABLE_BY_ID[notableId];
  const fx = riteFx(state);
  state.dread -= n.cost;
  state.notables[notableId] = true;
  state.eye = Math.min(EYE_MAX, state.eye + n.eye * fx.notableEyeMult);
  return true;
}

// Called by the engine every tick with elapsed seconds. Returns an Inquiry
// report object when one fires (UI shows it), else null.
function tickEye(state, dt) {
  const fx = riteFx(state);
  state.eye = Math.max(0, state.eye - EYE_BASE_DECAY * fx.eyeDecayMult * dt);
  if (state.eye >= EYE_MAX) return fireInquiry(state, fx);
  return null;
}

function fireInquiry(state, fx) {
  fx = fx || riteFx(state);
  const before = state.tiers.follower;
  const claimed = Math.min(before - INQUIRY_FLOOR, Math.ceil(before * fx.inquiryClaim));
  if (claimed > 0) state.tiers.follower -= claimed;
  state.eye = EYE_AFTER_INQUIRY;
  state.inquiries += 1;
  return { claimed: Math.max(0, claimed), remaining: state.tiers.follower };
}

function canAwaken(state) {
  return corruptionStage(state) >= 4 && state.dread >= AWAKENING_COST;
}

// The Awakening: run ends, Name glyphs are banked, the town forgets.
function awaken(state) {
  if (!canAwaken(state)) return null;
  const gained = Math.max(1, glyphsForLifetime(state.lifetime));
  const next = newState();
  next.glyphs = state.glyphs + gained;
  next.awakenings = state.awakenings + 1;
  return { next, glyphsGained: gained };
}

// Offline progress: capped, discounted, computed from the passive rate only.
function offlineDread(state, elapsedSeconds) {
  const s = Math.max(0, Math.min(elapsedSeconds, OFFLINE_CAP_HOURS * 3600));
  return ratePerSec(state) * s * OFFLINE_EFFICIENCY;
}

/* -------------------------------------------------------------- exports -- */
const CONGREGATION_BALANCE = {
  TIERS, TIER_INDEX, TIER_EYE, RITES, RITE_BY_ID, NOTABLES, NOTABLE_BY_ID,
  EYE_MAX, EYE_BASE_DECAY, EYE_AFTER_INQUIRY, INQUIRY_BASE_CLAIM, INQUIRY_FLOOR,
  CORRUPTION_THRESHOLDS, AWAKENING_COST, GLYPH_LIFETIME_UNIT, GLYPH_MULT,
  OFFLINE_CAP_HOURS, OFFLINE_EFFICIENCY,
  newState, riteFx, notableMult, glyphMult, globalMult,
  tierCost, tierRate, ratePerSec, tapPower, corruptionStage, glyphsForLifetime,
  earn, canBuyTier, buyTier, canBuyRite, buyRite, canBuyNotable, buyNotable,
  tickEye, fireInquiry, canAwaken, awaken, offlineDread,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CONGREGATION_BALANCE;
}
