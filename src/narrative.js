"use strict";
/*
 * CONGREGATION — narrative.js
 * Visions, notable townsfolk text, the Marrow Bay Gazette, and the finale.
 * All text is canonical in docs/NARRATIVE.md — edit there first, mirror here.
 * Gazette rotation is seeded (deterministic per stage/run, no repeats until
 * a pool exhausts).
 */

var NARRATIVE = (function () {

  /* ---------------------------------------------------- milestone visions -- */
  const VISIONS = [
    { id: "wake", ev: "firsttap",
      text: "You have been listening for so long that you had forgotten you could speak. Somewhere above, in a warm bed, someone frowns in their sleep." },
    { id: "taste", when: (s) => s.lifetime >= 100,
      text: "It has a taste, their unease. Salt and copper and Sunday afternoons. You would like some more." },
    { id: "firstfollower", when: (s) => s.tiersEver.follower >= 1,
      text: "She stops locking her door at night. When her neighbor asks why, she says the sea asked her not to. Both of them laugh. Neither knows what the joke is." },
    { id: "gathering", when: (s) => s.tiersEver.follower >= 10,
      text: "They have started nodding to each other in the street. They think it means good morning. It does not mean good morning." },
    { id: "firstacolyte", when: (s) => s.tiersEver.acolyte >= 1,
      text: "Ten of them stand in a circle in a kitchen and hold hands, and when they let go there are only one of them. This is arithmetic you understand." },
    { id: "stage1", when: (s) => BAL.corruptionStage(s) >= 1,
      text: "The gulls left in the night. No one in Marrow Bay mentions it, the way no one mentions a stain on a tablecloth at a nice dinner." },
    { id: "firstpriest", when: (s) => s.tiersEver.priest >= 1,
      text: "He was a quiet man and he is quieter now, and when he speaks your words come out at a depth his throat should not reach. The congregation leans in like plants." },
    { id: "stage2", when: (s) => BAL.corruptionStage(s) >= 2,
      text: "The clocktower stopped at 3:14 and the town agreed, without a meeting, to be grateful. Time was always the itchiest part of being awake." },
    { id: "firstinquiry", when: (s) => s.inquiries >= 1,
      text: "Men with clipboards came from the county. They wrote things down. The town watched them write, and watched them to their cars, and waved. You counted your flock twice that night." },
    { id: "firstherald", when: (s) => s.tiersEver.herald >= 1,
      text: "She walks the length of Main Street at noon and every door opens as she passes, not for her, but the way a wound opens. Nobody bleeds. Yet." },
    { id: "stage3", when: (s) => BAL.corruptionStage(s) >= 3,
      text: "The bay has a hole in it now. Fishermen row around it politely. At dinner tables, in the dark, the town practices not being afraid, and is getting very good at it." },
    { id: "firstavatar", when: (s) => s.tiersEver.avatar >= 1,
      text: "It wears a coat it found and a face it was given, and it stands at the end of the jetty greeting the water. The water greets it back. You feel almost proud. Almost awake." },
    { id: "stage4", when: (s) => BAL.corruptionStage(s) >= 4,
      text: "Tonight every window in Marrow Bay is lit and every person stands in theirs, facing the bay, mouths open. No sound. They are holding the note for you." },
    { id: "threshold", when: (s) => BAL.canAwaken(s),
      text: "There is enough. Enough dread, enough voices, enough dark under the doors. All that is left is to stop whispering." },
  ];
  const VISION_BY_ID = Object.fromEntries(VISIONS.map(v => [v.id, v]));

  const AWAKENING_TEXT = "You stop whispering.<br><br>The note lands. The bay folds open like a throat. For one bright second every mind in Marrow Bay is a window you are climbing through, and then the town, politely, forgets itself.";
  const NGPLUS_TEXT = "The tide goes out. The houses are repainted by morning. Nobody remembers the club.<br><br>But deep in the wet dark under the bay, cut into the rock where no one wrote it: your Name.";

  /* ---------------------------------------------------- notable townsfolk -- */
  const FOLK = {
    maren: {
      card: "She has fed the gulls every morning for forty years. She has been waiting, without knowing it, for something to feed her.",
      beat: "Maren dreams of the bay with a door in it. In the morning she opens the shop early and stands behind the counter, glad, for no reason she could name, that you are fed." },
    ash: {
      card: "His sermons have been getting shorter. There is something he would rather be listening to.",
      beat: "On Sunday, Reverend Ash preaches on the virtue of stillness at great depth. The congregation says amen one half-second too early, all together." },
    grey: {
      card: "She talks to her husband every night. You could arrange for something to answer.",
      beat: "Something answers. It is kind to her, in your way, in his voice. She sleeps through the night for the first time in nine years, and wakes devout." },
    vell: {
      card: "Thirty children copy down whatever she writes on the board. Think of the handwriting practice.",
      beat: "The children learn a new letter. It is not in the alphabet, and their parents cannot see it on the page, and at recess they stand in a circle, holding hands, practicing." },
    harrow: {
      card: "Everyone in Marrow Bay lies still for him and breathes when told. Such a well-trained town.",
      beat: "Doc Harrow updates his charts. Under “heart,” for every patient, he now writes the same word. His pen does this on its own, and he has decided to find it soothing." },
    quill: {
      card: "The town believes what the Gazette prints. The Gazette believes what Percy types. Percy believes almost anything, lately.",
      beat: "The Gazette runs a correction: “Contrary to our report of last Tuesday, nothing unusual occurred, has occurred, or will occur.” The town is relieved. Percy is promoted, by someone." },
    brun: {
      card: "Every boat obeys him already. He keeps the harbor; he could keep it for you.",
      beat: "Brun re-charts the bay by hand, and where the depth should read nineteen fathoms he writes, carefully, “further.” The boats begin mooring facing outward, in rows, like pews." },
    edda: {
      card: "Her hands know hymns older than the hymnal. Some notes open things.",
      beat: "Edda finds the low note the organ was hiding. She holds it through supper. Down the hill, dishes hum in cupboards, and the tide comes in early to hear." },
    calloway: {
      card: "The Eye of the county, its clipboard and its keys. It would be so restful if the law dreamed too.",
      beat: "Sheriff Calloway closes every open case in one afternoon. Cause listed: settled out of town. She sleeps with her hat on now, in case you need her quickly." },
    finch: {
      card: "He has given Marrow Bay thirty years of service and would give it anything else it asked. It is about to ask.",
      beat: "The town council votes unanimously on a measure no one remembers proposing. Finch signs it with his good pen. The measure has no text, only a shape, and it passes anyway." },
    keeper: {
      card: "He has kept the light against you for longer than the town has had a name for you. He is very tired.",
      beat: "The Keeper climbs down for the last time and leaves the lamp burning, aimed down into the bay, so you can see what you are doing. It is the only kindness anyone has ever shown you. You almost hesitate." },
    child: {
      card: "She has counted the boats every day for three years. Yesterday she counted one extra, and waved to it.",
      beat: "She writes the new total in chalk on the jetty and underlines it twice. She is not afraid. She was never afraid. She has been counting for you the whole time, and now the count is done." },
  };

  /* --------------------------------------------------------- the Gazette -- */
  const GAZETTE = [
    [ // stage 0 — quaint
      "regatta pushed to Sunday on account of weather",
      "Mrs. Pell's marrow takes 1st at county fair again",
      "cannery adds second shift, hiring",
      "library roof fund reaches halfway mark",
      "ferry timetable unchanged for autumn",
      "lost: one orange cat, answers to Bosun",
      "school pageant tickets now at the General Store",
    ],
    [ // stage 1 — off
      "gull count “within normal range,” says county",
      "tide tables reissued after printing error",
      "choir practice moved to earlier, darker hour",
      "several residents report same pleasant dream",
      "Bait & Tackle now opens before dawn “by demand”",
      "found: several orange cats, none Bosun",
      "letters page discontinued for lack of complaints",
    ],
    [ // stage 2 — wrong
      "clocktower repair deemed “unnecessary” by council",
      "anglers advised to respect the new part of the bay",
      "attendance at Sunday service reaches 100%",
      "water tower hum declared “restful” in survey",
      "the sea kindly asks residents to leave doors unlocked",
      "swim club renamed; new name unprintable",
      "missing-persons column replaced by welcome column",
    ],
    [ // stage 3 — consumed
      "town meeting held at 3:14 AM; minutes sealed",
      "volunteers wanted: standing, facing, humming",
      "the hole is not news, insists front page of Gazette",
      "streetlamp light “was always that color” — Council",
      "last tavern patron thanked for his patience",
      "census revised: population listed as “one, assembling”",
      "Gazette to print in new ink; readers advised not to touch it",
    ],
    [ // stage 4 — the Choir
      "THE NOTE IS ALMOST RIGHT. THE NOTE IS ALMOST RIGHT.",
    ],
  ];
  const GAZETTE_NG = [
    "town celebrates its founding, date uncertain",
    "historians disagree politely about last year",
    "new arrivals report town “felt familiar”",
    "chalk numbers on jetty deemed charming, left in place",
  ];

  /* ----------------------------------------------------------- machinery -- */
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
  function seededOrder(n, seedStr) {
    const rand = mulberry32(hash32(seedStr));
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }

  let game = null;
  let tickerState = { key: "", order: [], i: 0 };

  function fireVision(state, v) {
    state.visionsSeen[v.id] = true;
    UI.queueOverlay({ kicker: "a vision", text: v.text });
  }

  return {
    init(g) { game = g; },
    reset(state) { tickerState = { key: "", order: [], i: 0 }; },

    step(state, ev) {
      if (ev && ev.type === "buy" && ev.kind === "notable") {
        const who = BAL.NOTABLE_BY_ID[ev.id];
        if (who && FOLK[ev.id]) UI.queueOverlay({ kicker: who.name, text: FOLK[ev.id].beat });
      }
      for (const v of VISIONS) {
        if (state.visionsSeen[v.id]) continue;
        if (v.ev) { if (ev && ev.type === v.ev) fireVision(state, v); continue; }
        if (v.when && v.when(state)) fireVision(state, v);
      }
    },

    // The Awakening: vision → NG+ card (shows glyphs) → done() starts NG+.
    finale(state, res, done) {
      UI.queueOverlay({ kicker: "the awakening", text: AWAKENING_TEXT });
      UI.queueOverlay({
        kicker: "the town forgets; your Name persists",
        text: NGPLUS_TEXT,
        sub: "+" + res.glyphsGained + " Name glyph" + (res.glyphsGained > 1 ? "s" : "") +
             " — all Dread ×" + (1 + BAL.GLYPH_MULT * (state.glyphs + res.glyphsGained)).toFixed(2) + " forever",
        onDismiss: done,
      });
    },

    preview(id) {
      const v = VISION_BY_ID[id];
      if (v) UI.queueOverlay({ kicker: "a vision (preview)", text: v.text });
    },

    tickerLine(state) {
      const stage = typeof APP !== "undefined" ? APP.visualStage() : BAL.corruptionStage(state);
      let pool = GAZETTE[stage].slice();
      if (stage === 0 && state.awakenings > 0) pool = pool.concat(GAZETTE_NG);
      const key = stage + ":" + state.awakenings;
      if (tickerState.key !== key) {
        tickerState = { key, order: seededOrder(pool.length, "gazette:" + key), i: 0 };
      }
      const line = pool[tickerState.order[tickerState.i % pool.length]];
      tickerState.i++;
      return "MARROW BAY GAZETTE — " + line;
    },

    notableCard(id) { return FOLK[id] ? FOLK[id].card : ""; },
    notableBeat(id) { return FOLK[id] ? FOLK[id].beat : ""; },
    offlineExtra(state) {
      return state.awakenings > 0 ? "The chalk on the jetty has been recounted." : "";
    },
  };
})();
