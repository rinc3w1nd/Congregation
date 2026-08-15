"use strict";
const { test, expect } = require("@playwright/test");
const { dismissAll } = require("./helpers");

test("visions fire once; notable beats show; ticker cycles without repeats", async ({ page }) => {
  await page.goto("/");
  await page.click("#whisper");
  await expect(page.locator("#overlay-text")).toContainText("You have been listening");
  await dismissAll(page);
  // firing again must not re-show
  await page.evaluate(() => NARRATIVE.step(APP.game.state, { type: "firsttap" }));
  await page.waitForTimeout(200);
  expect(await page.isVisible("#overlay-card")).toBe(false);

  await page.evaluate(() => BAL.earn(APP.game.state, 500));
  await page.waitForTimeout(500);
  await dismissAll(page); // taste
  await page.click('[data-panel="folk"]');
  await page.click("#buy-folk-maren");
  await expect(page.locator("#overlay-kicker")).toHaveText("Old Maren");
  await dismissAll(page);
  await expect(page.locator("#folk-line-maren")).toContainText("Maren dreams");

  const lines = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < 14; i++) out.push(NARRATIVE.tickerLine(APP.game.state));
    return out;
  });
  expect(new Set(lines.slice(0, 7)).size).toBe(7); // full pool before repeat
  expect(lines[0]).toBe(lines[7]);                 // deterministic cycle
});

test("the Awakening banks a glyph; NG+ multiplier applies and persists", async ({ page }) => {
  await page.goto("/?grant=250000000");
  await page.waitForTimeout(600);
  await dismissAll(page); // stage + threshold visions
  await page.click('[data-panel="more"]', { force: true }); // stage-4 UI breathes
  await page.click("#awaken-btn", { force: true });
  await page.click(".overlay-btn.danger", { force: true });
  await expect(page.locator("#overlay-text")).toContainText("You stop whispering");
  await page.click("#overlay", { force: true });
  await expect(page.locator("#overlay-sub")).toContainText("Name glyph");
  await page.click("#overlay", { force: true });
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({
    glyphs: APP.game.state.glyphs, awakenings: APP.game.state.awakenings,
    dread: APP.game.state.dread, tap: BAL.tapPower(APP.game.state),
    stage: document.documentElement.dataset.stage,
  }));
  expect(st.glyphs).toBeGreaterThanOrEqual(1);
  expect(st.awakenings).toBe(1);
  expect(st.dread).toBe(0);
  expect(st.tap).toBeCloseTo(1 + 0.25 * st.glyphs, 5);
  expect(st.stage).toBe("0");

  await page.evaluate(() => saveGame(APP.game.state));
  await page.reload();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => APP.game.state.glyphs)).toBe(st.glyphs);
});
