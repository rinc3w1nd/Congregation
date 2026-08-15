"use strict";
const { test, expect } = require("@playwright/test");
const { dismissAll, collectErrors } = require("./helpers");

test("audio unlocks on tap, layers per stage, toggle persists", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("/");
  expect((await page.evaluate(() => AUDIO._debug())).hasCtx).toBe(false);
  await page.click("#whisper");
  await dismissAll(page);
  let d = await page.evaluate(() => AUDIO._debug());
  expect(d.hasCtx).toBe(true);
  expect(d.layerCount).toBe(1);

  await page.evaluate(() => AUDIO.setStage(4));
  await page.waitForTimeout(200);
  d = await page.evaluate(() => AUDIO._debug());
  expect(d.layerCount).toBe(5);

  await page.evaluate(() => AUDIO.setEnabled(false));
  await page.waitForTimeout(1800);
  d = await page.evaluate(() => AUDIO._debug());
  expect(d.on).toBe(false);
  expect(d.master).toBeLessThan(0.05);
  expect(await page.evaluate(() => localStorage.getItem("congregation-audio"))).toBe("0");

  // one-shots must not throw in either state
  await page.evaluate(() => { AUDIO.whisper(); AUDIO.convert("avatar"); AUDIO.duck(); AUDIO.awaken(); });
  expect(errs()).toEqual([]);
});
