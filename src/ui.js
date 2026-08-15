"use strict";
/*
 * CONGREGATION — ui.js
 * All DOM: header (Dread/rate/Eye), tabs+panels (Flock/Rites/Folk/More),
 * overlay queue (visions, reports, confirms), ticker. State mutations go
 * through BAL reducers only; APP.onPurchase is told after any success.
 */

var UI = (function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  const DREAD = "✦";

  let game = null, handlers = null;
  let shownDread = 0, slowTimer = 0;
  const rows = {}, riteCards = {}, folkCards = {};
  let moreBits = null;

  /* ------------------------------------------------------------ overlay -- */
  const queue = [];
  let overlayBusy = false;

  function queueOverlay(item) { queue.push(item); if (!overlayBusy) nextOverlay(); }

  function nextOverlay() {
    const item = queue.shift();
    if (!item) { overlayBusy = false; $("overlay").hidden = true; return; }
    overlayBusy = true;
    $("overlay-kicker").textContent = item.kicker || "";
    $("overlay-text").innerHTML = item.text || "";
    const sub = $("overlay-sub");
    sub.innerHTML = "";
    if (item.sub) sub.appendChild(el("div", "overlay-subtext", item.sub));
    if (item.actions) {
      const bar = el("div", "overlay-actions");
      for (const a of item.actions) {
        const b = el("button", "overlay-btn" + (a.danger ? " danger" : ""), a.label);
        b.addEventListener("click", (ev) => { ev.stopPropagation(); nextOverlay(); if (a.fn) a.fn(); });
        bar.appendChild(b);
      }
      sub.appendChild(bar);
    }
    $("overlay-hint").style.display = item.actions ? "none" : "";
    $("overlay").hidden = false;
    if (typeof AUDIO !== "undefined" && item.kicker !== undefined && !item.quiet) AUDIO.visionSwell();
  }

  function overlayTap() {
    if (!overlayBusy) return;
    const cur = queue.length; // actions-style overlays only close via buttons
    if ($("overlay-hint").style.display === "none") return;
    nextOverlay();
  }

  /* -------------------------------------------------------------- panels -- */
  function fxLabel(fx) {
    const parts = [];
    if (fx.tapMult) parts.push("whisper ×" + fx.tapMult);
    if (fx.tapRatePct) parts.push("whisper +" + Math.round(fx.tapRatePct * 100) + "% of the flow");
    if (fx.tierMult) for (const t in fx.tierMult) parts.push(BAL.TIERS[BAL.TIER_INDEX[t]].label + " ×" + fx.tierMult[t]);
    if (fx.allMult) parts.push("everything ×" + fx.allMult);
    if (fx.eyeDecayMult) parts.push("the Eye tires faster");
    if (fx.notableEyeMult) parts.push("notables draw half the notice");
    if (fx.inquiryClaim !== undefined) parts.push("Inquiries claim only 10%");
    if (fx.tierEyeZero) parts.push("grand conversions go unseen");
    return parts.join(" · ");
  }

  function tierCostText(t, state) {
    let s = DREAD + fmt(BAL.tierCost(t.id, state.tiers[t.id]));
    if (t.consumes) s += " + " + t.consumes.count + " " + BAL.TIERS[BAL.TIER_INDEX[t.consumes.tier]].label;
    return s;
  }

  function buildFlock() {
    const p = $("panel-flock");
    p.innerHTML = "";
    for (const t of BAL.TIERS) {
      const row = el("div", "row tier hidden");
      row.id = "row-" + t.id;
      const info = el("div", "row-info");
      info.appendChild(el("div", "row-name", t.label + ' <span class="count" id="count-' + t.id + '">0</span>'));
      info.appendChild(el("div", "row-rate", '<span id="trate-' + t.id + '">—</span>'));
      const buy = el("button", "buy", "");
      buy.id = "buy-" + t.id;
      buy.addEventListener("click", () => {
        if (BAL.buyTier(game.state, t.id)) {
          AUDIO.convert(t.id);
          APP.onPurchase("tier", t.id);
        }
      });
      row.appendChild(info); row.appendChild(buy);
      p.appendChild(row);
      rows[t.id] = { row, buy };
    }
  }

  function buildRites() {
    const p = $("panel-rites");
    p.innerHTML = "";
    const treeNames = { whispers: "Whispers", congregation: "Congregation", veils: "Veils" };
    for (const tree of ["whispers", "congregation", "veils"]) {
      p.appendChild(el("h3", "tree-head", treeNames[tree]));
      for (const r of BAL.RITES) {
        if (r.tree !== tree) continue;
        const card = el("button", "rite hidden");
        card.id = "rite-" + r.id;
        card.innerHTML =
          '<span class="rite-name">' + r.name + '</span>' +
          '<span class="rite-cost">' + DREAD + fmt(r.cost) + '</span>' +
          '<span class="rite-fx">' + fxLabel(r.fx) + '</span>' +
          '<span class="rite-blurb">' + r.blurb + '</span>';
        card.addEventListener("click", () => {
          if (BAL.buyRite(game.state, r.id)) {
            AUDIO.convert("rite");
            APP.onPurchase("rite", r.id);
          }
        });
        p.appendChild(card);
        riteCards[r.id] = card;
      }
    }
  }

  function buildFolk() {
    const p = $("panel-folk");
    p.innerHTML = "";
    p.appendChild(el("p", "panel-note", "Some of Marrow Bay matter more than the rest. Their dreams have doors."));
    for (const n of BAL.NOTABLES) {
      const card = el("div", "folk hidden");
      card.id = "folk-" + n.id;
      const eyeTag = n.eye > 0 ? '<span class="folk-eye">notice +' + n.eye + '</span>' : "";
      card.innerHTML =
        '<div class="folk-head"><span class="folk-name">' + n.name + '</span><span class="folk-role">' + n.role + '</span></div>' +
        '<p class="folk-line" id="folk-line-' + n.id + '"></p>' +
        '<div class="folk-foot">' + eyeTag + '<button class="buy" id="buy-folk-' + n.id + '">' + DREAD + fmt(n.cost) + '</button></div>';
      p.appendChild(card);
      card.querySelector("button").addEventListener("click", () => {
        if (BAL.buyNotable(game.state, n.id)) {
          AUDIO.convert("notable");
          APP.onPurchase("notable", n.id);
        }
      });
      folkCards[n.id] = card;
    }
    p.appendChild(el("p", "panel-note dim", '<span id="folk-waiting"></span>'));
  }

  function buildMore() {
    const p = $("panel-more");
    p.innerHTML = "";
    p.appendChild(el("h3", "tree-head", "The Ledger"));
    const stats = el("div", "stats");
    stats.innerHTML =
      '<div>lifetime dread <b id="stat-lifetime">0</b></div>' +
      '<div>inquiries <b id="stat-inquiries">0</b></div>' +
      '<div>awakenings <b id="stat-awakenings">0</b></div>' +
      '<div>name glyphs <b id="stat-glyphs">0</b></div>';
    p.appendChild(stats);

    p.appendChild(el("h3", "tree-head", "The Final Rite"));
    const aw = el("div", "awaken-wrap hidden");
    aw.id = "awaken-wrap";
    aw.innerHTML = '<p class="panel-note">There is a point past which whispering is unnecessary.</p>' +
      '<button id="awaken-btn" class="buy big danger">THE AWAKENING — ' + DREAD + fmt(BAL.AWAKENING_COST) + '</button>';
    p.appendChild(aw);
    aw.querySelector("#awaken-btn").addEventListener("click", () => {
      if (!BAL.canAwaken(game.state)) return;
      queueOverlay({
        kicker: "the final rite",
        text: "Stop whispering?",
        actions: [
          { label: "not yet", fn: null },
          { label: "STOP WHISPERING", danger: true, fn: () => handlers.awaken() },
        ],
      });
    });

    p.appendChild(el("h3", "tree-head", "Settings"));
    const set = el("div", "settings");
    const audioBtn = el("button", "chip", "sound: off");
    audioBtn.id = "audio-toggle";
    audioBtn.addEventListener("click", () => {
      AUDIO.setEnabled(!AUDIO.enabled());
      audioBtn.textContent = "sound: " + (AUDIO.enabled() ? "on" : "off");
    });
    set.appendChild(audioBtn);
    const reset = el("button", "chip danger", "forget everything");
    reset.id = "reset-btn";
    reset.addEventListener("click", () => {
      queueOverlay({
        kicker: "hard reset",
        text: "The town forgets you. Your Name too. Everything. This is not the Awakening — nothing is kept.",
        actions: [
          { label: "keep whispering", fn: null },
          { label: "forget everything", danger: true, fn: () => queueOverlay({
              kicker: "hard reset",
              text: "Last chance. All progress, all glyphs, gone.",
              actions: [
                { label: "keep whispering", fn: null },
                { label: "FORGET", danger: true, fn: () => handlers.reset() },
              ],
            }) },
        ],
      });
    });
    set.appendChild(reset);
    p.appendChild(set);
    moreBits = true;
  }

  /* ---------------------------------------------------------------- tabs -- */
  function setupTabs() {
    const tabs = Array.from(document.querySelectorAll("#tabs .tab"));
    tabs.forEach((b, i) => b.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      $("tabs").style.setProperty("--active", i);
      document.querySelectorAll(".panel").forEach((pa) => pa.classList.remove("active"));
      $("panel-" + b.dataset.panel).classList.add("active");
    }));
  }

  /* -------------------------------------------------------------- render -- */
  const STAGE_NAMES = ["quaint", "a little off", "wrong", "consumed", "the Choir"];

  function renderFast(state) {
    const target = state.dread;
    shownDread += (target - shownDread) * 0.18;
    if (Math.abs(target - shownDread) < Math.max(0.5, target * 1e-6)) shownDread = target;
    $("dread").textContent = DREAD + " " + fmt(shownDread);
  }

  function renderSlow(state) {
    const rate = BAL.ratePerSec(state);
    $("rate").textContent = rate > 0 ? fmt(rate) + "/s — the town murmurs" : "the town sleeps";
    $("stagename").textContent = STAGE_NAMES[BAL.corruptionStage(state)];

    // The Eye
    const o = Math.min(1, state.eye / BAL.EYE_MAX);
    const lift = 10 * o;
    $("eye-lid-top").setAttribute("d", "M4 12 Q32 " + (12 - lift) + " 60 12");
    $("eye-lid-bot").setAttribute("d", "M4 12 Q32 " + (12 + lift) + " 60 12");
    const iris = Math.max(0, o - 0.45) * 14;
    $("eye-iris").setAttribute("r", iris.toFixed(1));
    $("eye-pupil").setAttribute("r", (iris * 0.45).toFixed(1));
    $("hud-eye").classList.toggle("wide", o > 0.8);

    // Flock
    for (const t of BAL.TIERS) {
      const r = rows[t.id];
      const revealed = t.id === "follower" || state.tiersEver[t.id] > 0 ||
        (t.consumes && state.tiersEver[t.consumes.tier] >= t.consumes.count);
      r.row.classList.toggle("hidden", !revealed);
      if (!revealed) continue;
      $("count-" + t.id).textContent = state.tiers[t.id];
      $("trate-" + t.id).textContent = fmt(BAL.tierRate(state, t.id)) + "/s";
      r.buy.textContent = tierCostText(t, state);
      const can = BAL.canBuyTier(state, t.id);
      r.buy.disabled = !can;
      r.buy.classList.toggle("afford", can);
    }

    // Rites
    for (const rt of BAL.RITES) {
      const card = riteCards[rt.id];
      const owned = !!state.rites[rt.id];
      const revealed = owned || state.lifetime >= rt.cost * 0.2;
      card.classList.toggle("hidden", !revealed);
      card.classList.toggle("owned", owned);
      card.disabled = owned || !BAL.canBuyRite(state, rt.id);
      if (!owned && BAL.canBuyRite(state, rt.id)) card.classList.add("afford");
      else card.classList.remove("afford");
    }

    // Folk
    const stage = BAL.corruptionStage(state);
    let waiting = 0;
    for (const n of BAL.NOTABLES) {
      const card = folkCards[n.id];
      const owned = !!state.notables[n.id];
      const revealed = owned || (stage >= n.stageMin && state.lifetime >= n.cost * 0.1);
      if (!revealed) waiting++;
      card.classList.toggle("hidden", !revealed);
      card.classList.toggle("converted", owned);
      const line = $("folk-line-" + n.id);
      line.textContent = owned ? NARRATIVE.notableBeat(n.id) : NARRATIVE.notableCard(n.id);
      const btn = $("buy-folk-" + n.id);
      btn.style.display = owned ? "none" : "";
      const can = BAL.canBuyNotable(state, n.id);
      btn.disabled = !can;
      btn.classList.toggle("afford", can);
      TOWN.refresh(state);
    }
    $("folk-waiting").textContent = waiting > 0 ? waiting + " of Marrow Bay are not yet listening." : "All of Marrow Bay is listening.";

    // More
    $("stat-lifetime").textContent = fmt(state.lifetime);
    $("stat-inquiries").textContent = state.inquiries;
    $("stat-awakenings").textContent = state.awakenings;
    $("stat-glyphs").textContent = state.glyphs;
    const awWrap = $("awaken-wrap");
    awWrap.classList.toggle("hidden", stage < 4);
    if (stage >= 4) $("awaken-btn").disabled = !BAL.canAwaken(state);
  }

  function render(state) {
    renderFast(state);
    const now = performance.now();
    if (now - slowTimer > 250) { slowTimer = now; renderSlow(state); }
  }

  /* -------------------------------------------------------------- public -- */
  return {
    init(g, h) {
      game = g; handlers = h;
      buildFlock(); buildRites(); buildFolk(); buildMore(); setupTabs();
      $("overlay").addEventListener("click", overlayTap);
      $("hud-eye").addEventListener("click", () => {
        queueOverlay({ kicker: "the Eye", quiet: true, text: $("eye-tip").textContent });
      });
      shownDread = g.state.dread;
    },
    render, queueOverlay,
    rebuild() { buildFlock(); buildRites(); buildFolk(); buildMore(); renderSlow(game.state); },
    showOffline(dread, seconds, capped) {
      queueOverlay({
        kicker: "while the town slept…",
        quiet: true,
        text: "While the town slept, the congregation murmured your name into the dark. <b>+" + DREAD + fmt(dread) + "</b> gathered over " + fmtDuration(seconds) + ".",
        sub: capped ? "(Dreams keep poorly past eight hours.)" : "",
      });
    },
    showInquiry(rep) {
      queueOverlay({
        kicker: "an Inquiry",
        text: rep.claimed + " of the flock have remembered how to be afraid. They will be back. The rest hold the silence, and the silence holds." +
          (rep.dreadClaimed > 0.5 ? " The county men take " + DREAD + fmt(rep.dreadClaimed) + " of the dark away in folders." : ""),
        sub: "Veils quiet the Eye.",
      });
    },
    setTicker(text) {
      const t = $("ticker-text");
      if (t.textContent === text) return;
      t.textContent = text;
      t.parentElement.classList.remove("roll");
      void t.parentElement.offsetWidth; // restart CSS animation
      t.parentElement.classList.add("roll");
    },
  };
})();
