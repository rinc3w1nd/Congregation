"use strict";
/*
 * CONGREGATION — audio.js
 * Pure WebAudio synthesis, zero assets. One layer added per corruption stage
 * (cumulative), gentle one-shots, everything ramped — nothing clicks.
 * Spec: docs/AUDIO.md. Unlocks inside the first tap handler; preference is
 * persisted; suspends when the tab hides.
 */

var AUDIO = (function () {
  const PREF_KEY = "congregation-audio";
  let ctx = null, master = null, comp = null;
  let layers = [];        // [{gain, target, oscs:[{osc, f0}], extra}]
  let stage = 0, on = false, lastWhisper = 0, whisperN = 0;

  function pref() { try { return localStorage.getItem(PREF_KEY); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(PREF_KEY, v); } catch (e) {} }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    const rand = mulberry32(0xC0FFEE);
    const len = 2 * ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {           // brown-ish: integrated white
      last = (last + (rand() * 2 - 1) * 0.18) * 0.985;
      d[i] = last * 2.4;
    }
    return noiseBuf;
  }

  function osc(type, freq, dest) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    o.connect(dest); o.start();
    return o;
  }
  function gainNode(v, dest) {
    const g = ctx.createGain();
    g.gain.value = v;
    g.connect(dest || comp);
    return g;
  }
  function filt(type, freq, q, dest) {
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    f.connect(dest);
    return f;
  }
  function loopNoise(dest) {
    const src = ctx.createBufferSource();
    src.buffer = noise(); src.loop = true;
    src.connect(dest); src.start();
    return src;
  }

  /* ------------------------------------------------------ drone layers -- */
  // Each builder returns {gain (its output, at 0), target, oscs, surf?}
  const BUILDERS = [
    function ground() {                        // stage 0
      const g = gainNode(0);
      const lp = filt("lowpass", 220, 0, g);
      const o1 = osc("triangle", 55, lp), o2 = osc("triangle", 55.3, lp);
      // surf: looped brown noise, bandpassed, wave-lapped by an LFO
      const surfG = gainNode(0, g);
      const bp = filt("bandpass", 400, 0.8, surfG);
      loopNoise(bp);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.4;
      const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.35;
      lfo.connect(lfoDepth); lfoDepth.connect(surfG.gain);
      surfG.gain.value = 0.4;
      lfo.start();
      return { gain: g, target: 0.16, oscs: [{ osc: o1, f0: 55 }, { osc: o2, f0: 55.3 }], surf: { lfo, surfG }, lp };
    },
    function unease() {                        // stage 1
      const g = gainNode(0);
      const lp = filt("lowpass", 300, 0, g);
      const o = osc("sine", 110.7, lp);
      return { gain: g, target: 0.05, oscs: [{ osc: o, f0: 110.7 }] };
    },
    function depth() {                         // stage 2
      const g = gainNode(0);
      const o = osc("sine", 27.5, g);
      return { gain: g, target: 0.11, oscs: [{ osc: o, f0: 27.5 }] };
    },
    function presence() {                      // stage 3 — the "aw" vowel
      const g = gainNode(0);
      const f1 = filt("bandpass", 500, 6, g), f2 = filt("bandpass", 1150, 8, g);
      const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 55;
      const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 82.5;
      const pre = gainNode(0.16, null); pre.disconnect(); pre.connect(f1); pre.connect(f2);
      o1.connect(pre); o2.connect(pre); o1.start(); o2.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
      const d = ctx.createGain(); d.gain.value = 0.02;
      lfo.connect(d); d.connect(g.gain); lfo.start();
      return { gain: g, target: 0.05, oscs: [{ osc: o1, f0: 55 }, { osc: o2, f0: 82.5 }] };
    },
    function choir() {                         // stage 4 — wrong-bright triad + heartbeat
      const g = gainNode(0);
      const triad = gainNode(0, g);
      const os = [220, 277.18, 329.63].map(f => osc("sine", f, triad));
      const lfo = ctx.createOscillator(); lfo.frequency.value = 1 / 11;
      const d = ctx.createGain(); d.gain.value = 0.5;
      lfo.connect(d); d.connect(triad.gain); triad.gain.value = 0.5; lfo.start();
      const heartG = gainNode(0, g);
      const h = osc("sine", 55, heartG);
      const beat = ctx.createOscillator(); beat.frequency.value = 0.9; beat.type = "square";
      const bd = ctx.createGain(); bd.gain.value = 0.5;
      beat.connect(bd); bd.connect(heartG.gain); heartG.gain.value = 0.5; beat.start();
      return { gain: g, target: 0.055, oscs: os.map((o, i) => ({ osc: o, f0: [220, 277.18, 329.63][i] })).concat([{ osc: h, f0: 55 }]) };
    },
  ];

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return false; }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22; comp.ratio.value = 8;
    master = ctx.createGain();
    master.gain.value = 0;
    comp.connect(master); master.connect(ctx.destination);
    layers = [];
    return true;
  }

  function ramp(param, v, t) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(v, now + (t || 2));
  }

  function applyStage() {
    if (!ctx) return;
    for (let i = 0; i < BUILDERS.length; i++) {
      if (i <= stage && !layers[i]) layers[i] = BUILDERS[i]();
      if (layers[i]) ramp(layers[i].gain.gain, i <= stage ? layers[i].target : 0, 4);
    }
    const g = layers[0];
    if (g) {
      // the sea breathes slower each stage; holds still for the Choir
      const lfoHz = [0.4, 0.32, 0.24, 0.18, 0.0001][stage];
      ramp(g.surf.lfo.frequency, lfoHz, 4);
      ramp(g.surf.surfG.gain, stage === 4 ? 0 : 0.4, 4);
      ramp(g.lp.frequency, stage >= 2 ? 330 : 220, 4);
    }
  }

  function masterTo(v, t) { if (ctx) ramp(master.gain, v, t || 2); }

  return {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
      on = pref() !== "0";
      applyStage();
      if (on) masterTo(0.85, 2);
      document.addEventListener("visibilitychange", () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend();
        else if (on) ctx.resume();
      });
    },
    enabled() { return on; },
    setEnabled(b) {
      on = !!b;
      setPref(on ? "1" : "0");
      if (!ctx && on) { this.unlock(); return; }
      if (ctx) { if (on) { ctx.resume(); masterTo(0.85, 1.5); } else masterTo(0, 1.5); }
    },
    setStage(n) { stage = Math.max(0, Math.min(4, n)); applyStage(); },

    whisper() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      if (t - lastWhisper < 0.12) return;      // max ~8/s
      lastWhisper = t;
      const jit = mulberry32(0x515C0 + (whisperN++))();
      const g = gainNode(0);
      const bp = filt("bandpass", 1200 + jit * 800, 2.5, g);
      const src = ctx.createBufferSource();
      src.buffer = noise(); src.connect(bp);
      src.start(t, jit * 1.2, 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    },
    convert(kind) {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      const g = gainNode(0);
      const o = osc("sine", 110, g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.stop(t + 0.2);
      if (kind === "priest" || kind === "herald" || kind === "avatar" || kind === "notable") {
        const g2 = gainNode(0);
        const o2 = osc("sine", 165, g2);
        g2.gain.setValueAtTime(0.0001, t + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o2.stop(t + 0.35);
      }
    },
    visionSwell() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      const g = gainNode(0);
      const lp = filt("lowpass", 160, 0, g);
      const o = osc("sine", 41.2, lp);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 2);
      g.gain.linearRampToValueAtTime(0.0001, t + 4.5);
      o.stop(t + 5);
    },
    duck() {
      if (!ctx || !on) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.2, now + 0.3);
      master.gain.setValueAtTime(0.2, now + 3);
      master.gain.linearRampToValueAtTime(0.85, now + 5);
    },
    _debug() {
      return { hasCtx: !!ctx, state: ctx && ctx.state, on,
               layerCount: layers.filter(Boolean).length,
               master: ctx ? master.gain.value : 0 };
    },
    awaken() {
      if (!ctx || !on) return;
      const now = ctx.currentTime;
      for (const l of layers) {
        if (!l) continue;
        for (const { osc: o, f0 } of l.oscs) {
          try {
            o.frequency.cancelScheduledValues(now);
            o.frequency.setValueAtTime(o.frequency.value, now);
            o.frequency.exponentialRampToValueAtTime(Math.max(f0 / 2, 8), now + 8);
          } catch (e) {}
        }
      }
      masterTo(0.0001, 8);
      setTimeout(() => {                       // hard cut, then stage-0 quiet
        if (!ctx) return;
        for (const l of layers) { if (l) try { l.gain.disconnect(); } catch (e) {} }
        layers = [];
        stage = 0;
        applyStage();
        if (on) masterTo(0.85, 6);
      }, 8600);
    },
  };
})();
