"use strict";
const { test, expect } = require("@playwright/test");

test("town: element budget, determinism, stage overrides", async ({ page }) => {
  await page.goto("/?stage=0&dev=1");
  await page.waitForTimeout(400);
  const count = await page.evaluate(() => TOWN._count());
  expect(count).toBeLessThan(1500);
  expect(count).toBeGreaterThan(150); // it actually drew a town

  const sig1 = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#townsvg .win")).map((w) => w.className.baseVal).join("|"));
  await page.reload();
  await page.waitForTimeout(400);
  const sig2 = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#townsvg .win")).map((w) => w.className.baseVal).join("|"));
  expect(sig1).toBe(sig2); // deterministic window states

  for (const s of [1, 2, 3, 4]) {
    await page.goto(`/?stage=${s}`);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.querySelector("#townsvg").getAttribute("data-stage"))).toBe(String(s));
  }
  // stage 4: every window lit
  const dark = await page.evaluate(() => document.querySelectorAll("#townsvg .win.dark").length);
  expect(dark).toBe(0);
});

test("notable halo appears when affordable and clears on conversion", async ({ page }) => {
  await page.goto("/?grant=100");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.getElementById("halo-maren").classList.contains("show"))).toBe(true);
  await page.evaluate(() => { BAL.buyNotable(APP.game.state, "maren"); APP.onPurchase("notable", "maren"); });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.getElementById("halo-maren").classList.contains("show"))).toBe(false);
  expect(await page.evaluate(() => document.getElementById("b-bait").classList.contains("converted"))).toBe(true);
});
