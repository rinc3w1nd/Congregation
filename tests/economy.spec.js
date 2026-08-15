"use strict";
const { test, expect } = require("@playwright/test");
const { dismissAll, collectErrors } = require("./helpers");
const { execFileSync } = require("child_process");

test("headless economy sim holds all pacing targets and invariants", () => {
  // The sim exits non-zero on any drift; surface its report on failure.
  const out = execFileSync("node", ["sim/run.js"], { encoding: "utf8" });
  expect(out).toContain("All pacing targets and invariants hold.");
});

test("Inquiry fires at maxed Eye, claims followers, floors at 1", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("/");
  await page.click("#whisper");
  await dismissAll(page);
  await page.evaluate(() => {
    APP.game.state.tiers.follower = 10;
    APP.game.state.tiersEver.follower = 10;
    APP.game.state.dread = 1000;
    APP.game.state.eye = 100;
  });
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({
    inquiries: APP.game.state.inquiries,
    followers: APP.game.state.tiers.follower,
    eye: APP.game.state.eye,
    dread: APP.game.state.dread,
  }));
  expect(r.inquiries).toBe(1);
  expect(r.followers).toBeGreaterThanOrEqual(1);
  expect(r.followers).toBeLessThan(10);
  expect(r.dread).toBeLessThan(1000); // dread seizure
  expect(r.eye).toBeLessThanOrEqual(35);
  await expect(page.locator("#overlay-kicker")).toContainText("an Inquiry");
  expect(errs()).toEqual([]);
});

test("UI purchases route through reducers (rite flips state, costs dread)", async ({ page }) => {
  await page.goto("/?grant=1000");
  await dismissAll(page);
  await page.click('[data-panel="rites"]');
  await expect(page.locator("#rite-w1")).toBeVisible();
  await expect(page.locator("#rite-w1")).toBeEnabled();
  await page.click("#rite-w1", { force: true });
  const st = await page.evaluate(() => ({ owned: !!APP.game.state.rites.w1, dread: APP.game.state.dread }));
  expect(st.owned).toBe(true);
  expect(st.dread).toBeLessThanOrEqual(900);
  expect(await page.evaluate(() => BAL.tapPower(APP.game.state))).toBe(2);
});
