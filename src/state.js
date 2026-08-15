"use strict";
/*
 * CONGREGATION — state.js
 * Save/load (versioned envelope, quarantine-not-wipe) + shared formatting.
 * Wall-clock time is allowed HERE and in app.js only (engine boundary).
 */

const SAVE_KEY = "congregation-save-v1";

// Big-number formatting per UI.md: 1.24K / 8.02M / 1.10B / 4.4T, then 1.2e15.
const FMT_UNITS = ["", "K", "M", "B", "T", "Qa", "Qi"];
function fmt(n) {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + fmt(-n);
  if (n < 10) return (Math.round(n * 10) / 10).toString();
  if (n < 1000) return Math.round(n).toString();
  const idx = Math.floor(Math.log10(n) / 3);
  if (idx >= FMT_UNITS.length) return n.toExponential(1).replace("+", "");
  const v = n / Math.pow(1000, idx);
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + FMT_UNITS[idx];
}

function fmtDuration(seconds) {
  const s = Math.round(seconds);
  if (s < 90) return s + "s";
  const m = Math.round(s / 60);
  if (m < 90) return m + " minutes";
  const h = Math.floor(s / 3600), mm = Math.round((s % 3600) / 60);
  return h + "h " + mm + "m";
}

// Returns { state, offlineSeconds, corrupt }. Never throws, never wipes:
// an unreadable save is quarantined to SAVE_KEY-corrupt for post-mortems.
function loadGame() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* private mode */ }
  if (!raw) return { state: BAL.newState(), offlineSeconds: 0, corrupt: false };
  try {
    const env = JSON.parse(raw);
    if (env.v !== 1 || !env.state || typeof env.state !== "object") throw new Error("bad envelope");
    // Merge over fresh defaults so new fields added later self-heal.
    const base = BAL.newState();
    const st = Object.assign(base, env.state);
    st.tiers = Object.assign(BAL.newState().tiers, env.state.tiers);
    st.tiersEver = Object.assign(BAL.newState().tiersEver, env.state.tiersEver);
    const offlineSeconds = env.savedAt ? Math.max(0, (Date.now() - env.savedAt) / 1000) : 0;
    return { state: st, offlineSeconds, corrupt: false };
  } catch (e) {
    try { localStorage.setItem(SAVE_KEY + "-corrupt", raw); localStorage.removeItem(SAVE_KEY); } catch (e2) {}
    return { state: BAL.newState(), offlineSeconds: 0, corrupt: true };
  }
}

function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), state }));
  } catch (e) { /* quota/private mode: play on, memory-only */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
