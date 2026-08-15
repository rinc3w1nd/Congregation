"use strict";
// Phase 9: the town is the input surface.
const { test, expect } = require("@playwright/test");
const { dismissAll, collectErrors, doctorStorage, whisper } = require("./helpers");

test("whispers land in the selected district and saturate it", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("/");
  await whisper(page, "hillside");
  await dismissAll(page);
  expect(await page.evaluate(() => APP.game.state.district)).toBe("hillside");
  const before = await page.evaluate(() => APP.game.state.sat.hillside);
  expect(before).toBeGreaterThan(0);

  // leaning on one district tanks its yield and eventually draws notice
  for (let i = 0; i < 12; i++) await whisper(page);
  await dismissAll(page);
  const s = await page.evaluate(() => ({
    sat: APP.game.state.sat.hillside,
    mult: BAL.districtMult(APP.game.state, "hillside"),
    eye: APP.game.state.eye,
  }));
  expect(s.sat).toBeGreaterThan(0.85);
  expect(s.mult).toBeLessThan(0.4);
  expect(s.eye).toBeGreaterThan(0); // Hillside draws notice, more so when obvious
  expect(errs()).toEqual([]);
});

test("saturation decays, so rotation restores yield", async ({ page }) => {
  await page.goto("/");
  await whisper(page, "commons");
  await dismissAll(page);
  for (let i = 0; i < 10; i++) await whisper(page);
  await dismissAll(page);
  const spent = await page.evaluate(() => APP.game.state.sat.commons);
  await page.waitForTimeout(3000); // decay runs in the logic tick
  const rested = await page.evaluate(() => APP.game.state.sat.commons);
  expect(rested).toBeLessThan(spent);
});

test("Old Town bleeds the Eye — suspicion is playable, not just waited out", async ({ page }) => {
  await page.goto("/");
  await whisper(page, "oldtown");
  await dismissAll(page);
  await page.evaluate(() => { APP.game.state.eye = 50; });
  for (let i = 0; i < 8; i++) await whisper(page);
  await dismissAll(page);
  const eye = await page.evaluate(() => APP.game.state.eye);
  expect(eye).toBeLessThan(45); // 8 whispers × -1.2, minus tick decay
  expect(eye).toBeGreaterThanOrEqual(0);
});

test("the Commons murmur grants free Followers", async ({ page }) => {
  await page.goto("/");
  await whisper(page, "commons");
  await dismissAll(page);
  const need = await page.evaluate(() => Math.ceil(BAL.murmurPerFollower(APP.game.state)));
  for (let i = 0; i < need + 2; i++) await whisper(page);
  await dismissAll(page);
  expect(await page.evaluate(() => APP.game.state.tiers.follower)).toBeGreaterThanOrEqual(1);
});

test("tapping the map whispers into that building's district", async ({ page }) => {
  await page.goto("/");
  await whisper(page, "harborfront");
  await dismissAll(page);
  // the church is Old Town
  await page.click("#b-church", { force: true });
  await dismissAll(page);
  expect(await page.evaluate(() => APP.game.state.district)).toBe("oldtown");
});

test("readouts: Eye exposure warns, Awakening projects its glyphs", async ({ page }) => {
  await page.goto("/?grant=250000000");
  await page.waitForTimeout(600);
  await dismissAll(page);
  await page.evaluate(() => { APP.game.state.eye = 90; });
  await page.waitForTimeout(400);
  await expect(page.locator("#eye-warn")).toBeVisible();
  await expect(page.locator("#eye-warn")).toContainText("an Inquiry would take");

  await page.click('[data-panel="more"]', { force: true });
  await expect(page.locator("#awaken-proj")).toContainText("glyph");
  await expect(page.locator("#awaken-proj")).toContainText("more lifetime dread");
});

test("v1 saves migrate to v2 with a fresh, unspent town", async ({ page, context }) => {
  await page.goto("/");
  await page.close();
  await doctorStorage(context, () => {
    // a pre-Phase-9 save: no sat/murmur/district fields at all
    localStorage.setItem("congregation-save-v1", JSON.stringify({
      v: 1, savedAt: Date.now(),
      state: { v: 1, dread: 500, lifetime: 500,
               tiers: { follower: 3, acolyte: 0, priest: 0, herald: 0, avatar: 0 },
               tiersEver: { follower: 3, acolyte: 0, priest: 0, herald: 0, avatar: 0 },
               rites: {}, notables: {}, eye: 0, inquiries: 0, glyphs: 2,
               awakenings: 1, visionsSeen: {} },
    }));
  });
  const p2 = await context.newPage();
  await p2.goto("/");
  await p2.waitForTimeout(600);
  const st = await p2.evaluate(() => APP.game.state);
  expect(st.v).toBe(2);
  expect(st.tiers.follower).toBe(3);   // progress preserved
  expect(st.glyphs).toBe(2);           // NG+ preserved
  expect(st.murmur).toBe(0);
  expect(st.district).toBe("harborfront");
  expect(Object.values(st.sat).every((v) => v === 0)).toBe(true);
  expect(await p2.evaluate(() => localStorage.getItem("congregation-save-v1-corrupt"))).toBeNull();
});
