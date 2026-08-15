"use strict";
/*
 * CONGREGATION — town.js
 * Marrow Bay: one SVG, built once, restyled per corruption stage via classes
 * and CSS custom properties (geometry is never regenerated). Spec: docs/TOWN.md.
 * Determinism: all jitter/window thresholds come from a string-seeded PRNG.
 * Budget: < 1500 SVG elements (actual ~350; logged in dev).
 */

var TOWN = (function () {
  const NS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------- deterministic rand -- */
  function hash32(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = (key) => mulberry32(hash32(key))();

  /* ------------------------------------------------------------- layout -- */
  // x,y = ground-center / baseline. Notables per docs/TOWN.md.
  const LAYOUT = [
    // Harborfront (shoreline sits near y=218)
    { id: "ferry",       x: 52,  y: 217, w: 30, h: 7,  kind: "dock" },
    { id: "fishmarket",  x: 96,  y: 214, w: 22, h: 11, kind: "shop" },
    { id: "cannery",     x: 138, y: 214, w: 30, h: 18, kind: "stack" },
    { id: "bait",        x: 170, y: 214, w: 15, h: 10, kind: "shop", notable: "maren" },
    { id: "sailloft",    x: 258, y: 214, w: 18, h: 13, kind: "house" },
    { id: "harbormaster",x: 288, y: 214, w: 18, h: 12, kind: "civic", notable: "brun" },
    { id: "jetty",       x: 215, y: 218, w: 34, h: 4,  kind: "jetty", notable: "child" },
    // Old Town
    { id: "church",      x: 84,  y: 172, w: 22, h: 16, kind: "spire", notable: "ash" },
    { id: "townhall",    x: 130, y: 172, w: 28, h: 15, kind: "civic", notable: "finch" },
    { id: "sheriff",     x: 170, y: 172, w: 18, h: 12, kind: "civic", notable: "calloway" },
    { id: "gazette",     x: 206, y: 172, w: 18, h: 13, kind: "shop", notable: "quill" },
    { id: "library",     x: 243, y: 172, w: 20, h: 13, kind: "civic" },
    { id: "clocktower",  x: 280, y: 172, w: 10, h: 30, kind: "clock" },
    { id: "grange",      x: 312, y: 174, w: 22, h: 14, kind: "house", notable: "edda" },
    // The Commons
    { id: "store",       x: 92,  y: 196, w: 20, h: 11, kind: "shop" },
    { id: "bakery",      x: 122, y: 196, w: 16, h: 11, kind: "shop" },
    { id: "butcher",     x: 148, y: 196, w: 16, h: 11, kind: "shop" },
    { id: "tavern",      x: 186, y: 196, w: 20, h: 12, kind: "house" },
    { id: "barber",      x: 214, y: 196, w: 13, h: 11, kind: "shop" },
    { id: "surgery",     x: 244, y: 196, w: 18, h: 12, kind: "house", notable: "harrow" },
    // Hillside
    { id: "school",      x: 96,  y: 138, w: 22, h: 13, kind: "house", notable: "vell" },
    { id: "widowsrow",   x: 148, y: 136, w: 30, h: 11, kind: "terrace", notable: "grey" },
    { id: "orchard",     x: 196, y: 136, w: 18, h: 11, kind: "tree" },
    { id: "watertower",  x: 238, y: 138, w: 16, h: 24, kind: "tank" },
    { id: "chapel",      x: 274, y: 136, w: 14, h: 11, kind: "stones" },
    { id: "hilltop",     x: 310, y: 134, w: 28, h: 10, kind: "terrace" },
    // The Verge
    { id: "lighthouse",  x: 340, y: 208, w: 12, h: 26, kind: "light", notable: "keeper" },
    { id: "marshcabin",  x: 20,  y: 212, w: 14, h: 9,  kind: "house" },
    { id: "quarry",      x: 24,  y: 128, w: 26, h: 10, kind: "quarry" },
    { id: "radiomast",   x: 330, y: 108, w: 4,  h: 26, kind: "mast" },
    { id: "motel",       x: 38,  y: 176, w: 30, h: 10, kind: "shop" },
  ];
  const NOTABLE_BUILDING = {};
  for (const b of LAYOUT) if (b.notable) NOTABLE_BUILDING[b.notable] = b;

  // Fraction of windows dark per stage (stage 4: ALL lit, in accent).
  const DARK_FRAC = [0.08, 0.28, 0.55, 0.85, 0];
  const BORE = { x: 205, y: 254 };

  let svg = null, winEls = [], stage = -1, count = 0;

  /* ------------------------------------------------------------ helpers -- */
  function mk(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    count++;
    return n;
  }

  function windowsFor(b, g) {
    if (["dock", "jetty", "mast", "tree", "stones", "quarry"].includes(b.kind)) return;
    const rows = b.h >= 14 && b.kind !== "clock" ? 2 : 1;
    const cols = Math.max(1, Math.min(4, Math.floor((b.w - 5) / 6)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = b.x - b.w / 2 + (b.w / (cols + 1)) * (c + 1) - 1.4;
        const wy = b.y - b.h + 3 + r * 6;
        const u = rnd("win:" + b.id + ":" + (r * 4 + c));
        const w = mk("rect", { x: wx.toFixed(1), y: wy.toFixed(1), width: 2.8, height: 3.4, class: "win" }, g);
        w.style.setProperty("--fd", (u * 5).toFixed(2) + "s");
        winEls.push({ el: w, u });
      }
    }
  }

  function building(b, layer) {
    const g = mk("g", { id: "b-" + b.id, class: "bld k-" + b.kind }, layer);
    const jx = (rnd("jx:" + b.id) - 0.5) * 2; // seeded jitter
    const x = b.x + jx, y = b.y, w = b.w, h = b.h, L = x - w / 2, R = x + w / 2;
    if (b.notable) {
      mk("circle", { cx: x, cy: y - h / 2, r: Math.max(w, h) * 0.95, class: "halo", id: "halo-" + b.notable }, g);
    }
    switch (b.kind) {
      case "house": case "civic":
        mk("rect", { x: L, y: y - h, width: w, height: h, class: "base" }, g);
        mk("polygon", { points: `${L - 1},${y - h} ${x},${y - h - w * 0.28} ${R + 1},${y - h}`, class: "roof" }, g);
        if (b.kind === "civic") mk("rect", { x: L + 2, y: y - h - 2.5, width: w - 4, height: 2.5, class: "roof" }, g);
        break;
      case "shop":
        mk("rect", { x: L, y: y - h, width: w, height: h, class: "base" }, g);
        mk("rect", { x: L - 1, y: y - h - 2, width: w + 2, height: 2.4, class: "roof" }, g);
        mk("line", { x1: L + 1, y1: y - h * 0.45, x2: R - 1, y2: y - h * 0.45, class: "awning" }, g);
        break;
      case "stack": {
        mk("rect", { x: L, y: y - h, width: w, height: h, class: "base" }, g);
        mk("rect", { x: L - 1, y: y - h - 2, width: w + 2, height: 2.4, class: "roof" }, g);
        mk("rect", { x: R - 7, y: y - h - 10, width: 3.4, height: 10, class: "base chimney" }, g);
        const s = mk("path", { class: "fx-smoke", d: `M${R - 5.3} ${y - h - 11} q -4 -5 -2 -10 q 3 -4 1 -9` }, g);
        s.style.setProperty("--sd", "0s");
        break;
      }
      case "spire":
        mk("rect", { x: L, y: y - h, width: w, height: h, class: "base" }, g);
        mk("polygon", { points: `${L - 1},${y - h} ${x},${y - h - 5} ${R + 1},${y - h}`, class: "roof" }, g);
        mk("rect", { x: x - 3, y: y - h - 16, width: 6, height: 16, class: "base" }, g);
        mk("polygon", { points: `${x - 4},${y - h - 16} ${x},${y - h - 24} ${x + 4},${y - h - 16}`, class: "roof" }, g);
        mk("circle", { cx: x, cy: y - h - 12, r: 1.8, class: "win", "data-oculus": 1 }, g);
        break;
      case "clock": {
        mk("rect", { x: x - 5, y: y - h, width: 10, height: h, class: "base" }, g);
        mk("polygon", { points: `${x - 6},${y - h} ${x},${y - h - 6} ${x + 6},${y - h}`, class: "roof" }, g);
        mk("circle", { cx: x, cy: y - h + 7, r: 4.4, class: "clockface" }, g);
        const hands = mk("g", { class: "hands", style: `transform-origin:${x}px ${y - h + 7}px` }, g);
        mk("line", { x1: x, y1: y - h + 7, x2: x, y2: y - h + 4.2, class: "hand hour", style: `transform-origin:${x}px ${y - h + 7}px` }, hands);
        mk("line", { x1: x, y1: y - h + 7, x2: x + 3.4, y2: y - h + 7, class: "hand minute", style: `transform-origin:${x}px ${y - h + 7}px` }, hands);
        break;
      }
      case "terrace":
        for (let i = 0; i < 3; i++) {
          const tw = w / 3, tl = L + i * tw;
          mk("rect", { x: tl, y: y - h + (i === 1 ? -1.5 : 0), width: tw - 1, height: h + (i === 1 ? 1.5 : 0), class: "base" }, g);
          mk("polygon", { points: `${tl - 0.5},${y - h + (i === 1 ? -1.5 : 0)} ${tl + tw / 2},${y - h - 4 + (i === 1 ? -1.5 : 0)} ${tl + tw - 0.5},${y - h + (i === 1 ? -1.5 : 0)}`, class: "roof" }, g);
        }
        break;
      case "tank":
        mk("line", { x1: L + 2, y1: y, x2: x - 2, y2: y - h + 6, class: "strut" }, g);
        mk("line", { x1: R - 2, y1: y, x2: x + 2, y2: y - h + 6, class: "strut" }, g);
        mk("rect", { x: x - 6, y: y - h, width: 12, height: 8, rx: 2, class: "base" }, g);
        mk("polygon", { points: `${x - 7},${y - h} ${x},${y - h - 4} ${x + 7},${y - h}`, class: "roof" }, g);
        break;
      case "light": {
        mk("polygon", { points: `${x - 5},${y} ${x - 3},${y - h} ${x + 3},${y - h} ${x + 5},${y}`, class: "base lighthouse-body" }, g);
        mk("rect", { x: x - 3.6, y: y - h - 5, width: 7.2, height: 5, class: "lamp" }, g);
        mk("polygon", { points: `${x - 4.6},${y - h - 5} ${x},${y - h - 9} ${x + 4.6},${y - h - 5}`, class: "roof" }, g);
        mk("polygon", { points: `${x},${y - h - 2.5} 268,128 284,108`, class: "fx-beam", id: "fx-beam", style: `transform-origin:${x}px ${y - h - 2.5}px` }, g);
        break;
      }
      case "dock":
        mk("rect", { x: L, y: y - 2, width: w, height: 2.4, class: "base" }, g);
        for (let i = 0; i < 4; i++) mk("line", { x1: L + 2 + i * (w / 4), y1: y, x2: L + 2 + i * (w / 4), y2: y + 4, class: "strut" }, g);
        break;
      case "jetty":
        mk("rect", { x: L, y: y - 1.5, width: w, height: 1.8, class: "base" }, g);
        mk("rect", { x: R - 2.6, y: y - 6, width: 1.7, height: 4.6, class: "figure", id: "fx-child" }, g);
        break;
      case "mast":
        mk("line", { x1: x, y1: y, x2: x, y2: y - h, class: "strut" }, g);
        mk("line", { x1: x - 4, y1: y - h * 0.4, x2: x + 4, y2: y - h * 0.55, class: "strut" }, g);
        mk("circle", { cx: x, cy: y - h, r: 1.2, class: "blink" }, g);
        break;
      case "tree":
        mk("rect", { x: L, y: y - 8, width: 12, height: 8, class: "base" }, g);
        mk("polygon", { points: `${L - 0.5},${y - 8} ${L + 6},${y - 12} ${L + 12.5},${y - 8}`, class: "roof" }, g);
        for (let i = 0; i < 3; i++) mk("circle", { cx: R - 4 + (rnd("tr" + i) - 0.5) * 6, cy: y - 5 - i * 2.5, r: 3 - i * 0.5, class: "canopy" }, g);
        break;
      case "stones":
        mk("rect", { x: L, y: y - h, width: 9, height: h, class: "base" }, g);
        mk("polygon", { points: `${L - 0.5},${y - h} ${L + 4.5},${y - h - 4} ${L + 9.5},${y - h}`, class: "roof" }, g);
        for (let i = 0; i < 4; i++) {
          const sx = L + 11 + i * 3.2, tilt = (rnd("st" + i) - 0.5) * 24;
          mk("rect", { x: sx, y: y - 3.4, width: 1.6, height: 3.4, class: "stone", transform: `rotate(${tilt.toFixed(0)} ${sx} ${y})` }, g);
        }
        break;
      case "quarry":
        mk("path", { d: `M${L} ${y} l4,-8 l6,2 l5,-6 l7,3 l4,9 z`, class: "quarrycut" }, g);
        break;
    }
    windowsFor(b, g);
    return g;
  }

  /* -------------------------------------------------------------- build -- */
  function build(root) {
    count = 0; winEls = [];
    root.innerHTML = "";
    svg = mk("svg", { viewBox: "0 0 360 300", id: "townsvg", preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" });
    root.appendChild(svg);
    const defs = mk("defs", {}, svg);
    const grad = mk("linearGradient", { id: "grad-sky", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk("stop", { offset: "0%", class: "sky-top" }, grad);
    mk("stop", { offset: "100%", class: "sky-bot" }, grad);

    mk("rect", { x: 0, y: 0, width: 360, height: 230, fill: "url(#grad-sky)" }, svg);

    // Gulls (gone at stage 1+)
    for (let i = 0; i < 3; i++) {
      mk("path", { class: "fx-gull", d: `M${70 + i * 60 + rnd("g" + i) * 30} ${40 + rnd("gg" + i) * 25} q 3 -3 6 0 q 3 -3 6 0` }, svg);
    }

    // Land: rising slope with a headland on the right
    mk("path", {
      class: "land",
      d: "M0 230 L0 128 Q40 118 90 126 Q180 118 250 126 Q310 120 360 132 L360 230 Z",
    }, svg);
    // Streets
    mk("path", { class: "street", d: "M20 218 Q180 208 340 216" }, svg);
    mk("path", { class: "street", d: "M40 198 Q180 190 320 197" }, svg);
    mk("path", { class: "street", d: "M60 175 Q180 168 330 176" }, svg);
    mk("path", { class: "street", d: "M80 140 Q190 132 330 138" }, svg);

    // Water (tide rises at stage 2 via CSS transform on this group)
    const water = mk("g", { id: "water" }, svg);
    mk("rect", { x: 0, y: 218, width: 360, height: 82, class: "sea" }, water);
    mk("path", { class: "waterline", d: "M0 218 Q40 216.5 80 218 T160 218 T240 218 T320 218 T360 218" }, water);

    // The Bore (stage 3+)
    const bore = mk("g", { id: "fx-bore" }, svg);
    mk("ellipse", { cx: BORE.x, cy: BORE.y, rx: 26, ry: 8.5, class: "bore-ring r2" }, bore);
    mk("ellipse", { cx: BORE.x, cy: BORE.y, rx: 17, ry: 5.5, class: "bore-ring r1" }, bore);
    mk("ellipse", { cx: BORE.x, cy: BORE.y, rx: 9, ry: 3, class: "bore-mouth" }, bore);

    // Boats (all face the Bore from stage 2)
    const boatAt = [[80, 232, -8], [150, 244, 12], [255, 238, -14], [318, 230, 6]];
    boatAt.forEach(([bx, by, a], i) => {
      const g = mk("g", { class: "boat" + (i === 2 ? " boat-first" : ""), style: `transform-origin:${bx}px ${by}px; --ba:${a}deg; --bd:${(rnd("b" + i) * 3).toFixed(1)}s` }, svg);
      const toBore = Math.atan2(BORE.y - by, BORE.x - bx) * 180 / Math.PI;
      g.style.setProperty("--bt", (toBore > 90 || toBore < -90 ? 180 : 0) + "deg"); // hull flip toward bore
      mk("path", { d: `M${bx - 6} ${by} q 6 4 12 0 l -2 -1.6 l -8 0 z`, class: "hull" }, g);
      mk("line", { x1: bx, y1: by - 1.4, x2: bx, y2: by - 7, class: "strut" }, g);
    });

    // House smoke (two chimneys besides the cannery's)
    for (const [sx, sy, k] of [[190, 183, "s1"], [318, 159, "s2"]]) {
      const s = mk("path", { class: "fx-smoke", d: `M${sx} ${sy} q -4 -5 -2 -10 q 3 -4 1 -9` }, svg);
      s.style.setProperty("--sd", (rnd(k) * 4).toFixed(1) + "s");
    }

    // Tendrils: shoreline (stage 2+) then webs (stage 3+)
    const tendrils = [
      ["t-shore", "M30 219 q 8 -6 4 -14 q -3 -6 2 -10"],
      ["t-shore", "M120 219 q -6 -8 -1 -14 q 4 -5 0 -11"],
      ["t-shore", "M282 219 q 7 -7 3 -13 q -3 -7 2 -12"],
      ["t-web", "M96 210 Q 110 196 128 200 Q 140 203 150 196"],
      ["t-web", "M180 192 Q 196 180 212 186 Q 228 191 242 184"],
      ["t-web", "M84 168 Q 104 154 124 160 Q 142 166 162 158"],
      ["t-web", "M250 170 Q 264 158 278 164 Q 292 170 306 162"],
      ["t-web", "M148 130 Q 170 118 192 126 Q 216 133 236 124"],
    ];
    tendrils.forEach(([cls, d], i) => {
      const t = mk("path", { class: "fx-tendril " + cls, d }, svg);
      t.style.setProperty("--td", (rnd("t" + i) * 4).toFixed(1) + "s");
    });

    // Buildings above effects
    const blds = mk("g", { id: "bld-layer" }, svg);
    for (const b of LAYOUT) building(b, blds);

    if (new URLSearchParams(location.search).has("dev")) {
      console.log("[town] svg elements:", count);
    }
    stage = -1;
  }

  /* -------------------------------------------------------------- stage -- */
  function setStage(n) {
    if (!svg || n === stage) return;
    stage = n;
    svg.setAttribute("data-stage", n);
    const frac = DARK_FRAC[n];
    for (const w of winEls) {
      w.el.classList.toggle("dark", n !== 4 && w.u < frac);
      w.el.classList.toggle("lit", n === 4 || w.u >= frac);
    }
  }

  // Notable halos + converted-building styling; cheap, called on renderSlow.
  function refresh(state) {
    if (!svg) return;
    for (const nid in NOTABLE_BUILDING) {
      const b = NOTABLE_BUILDING[nid];
      const g = svg.getElementById("b-" + b.id);
      if (!g) continue;
      const owned = !!state.notables[nid];
      g.classList.toggle("converted", owned);
      const halo = svg.getElementById("halo-" + nid);
      if (halo) halo.classList.toggle("show", !owned && BAL.canBuyNotable(state, nid));
    }
  }

  return { build, setStage, refresh, _count: () => count };
})();
