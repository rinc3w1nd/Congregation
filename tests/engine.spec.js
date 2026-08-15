"use strict";
const { test, expect } = require("@playwright/test");
const { dismissAll, collectErrors, doctorStorage, whisper } = require("./helpers");

test.describe("engine core", () => {
  test("tap earns, buy works, passive accrues, save round-trips", async ({ page }) => {
    const errs = collectErrors(page);
    await page.goto("/");
    await page.click("#whisper");
    await dismissAll(page); // wake vision
    // Phase 9: whispers saturate the ground they land on, so a player
    // rotates districts. Mashing one is a real (and intended) penalty.
    const DISTRICTS = ["harborfront", "hillside", "commons", "verge", "oldtown"];
    for (let i = 0; i < 40; i++) {
      await whisper(page, i % 4 === 0 ? DISTRICTS[(i / 4) % DISTRICTS.length] : null);
    }
    await dismissAll(page);
    await dismissAll(page); // taste vision at 100 lifetime? (not yet at 31)
    await expect(page.locator("#buy-follower")).toBeEnabled();
    await page.click("#buy-follower");
    await dismissAll(page); // firstfollower vision
    await expect(page.locator("#count-follower")).toHaveText("1");

    const before = await page.evaluate(() => APP.game.state.dread);
    await page.waitForTimeout(2200);
    const after = await page.evaluate(() => APP.game.state.dread);
    expect(after - before).toBeGreaterThan(0.3); // 1 follower @0.25/s

    await page.evaluate(() => saveGame(APP.game.state));
    await page.reload();
    await dismissAll(page);
    expect(await page.evaluate(() => APP.game.state.tiers.follower)).toBe(1);
    expect(errs()).toEqual([]);
  });

  test("offline progress is reported and capped at 8h", async ({ page, context }) => {
    await page.goto("/");
    await page.click("#whisper");
    await dismissAll(page);
    await page.evaluate(() => {
      BAL.buyTier(Object.assign(APP.game.state, { dread: 1000 }), "follower");
      saveGame(APP.game.state);
    });
    await page.close();
    await doctorStorage(context, () => {
      const env = JSON.parse(localStorage.getItem("congregation-save-v1"));
      env.savedAt = Date.now() - 10 * 3600 * 1000; // 10h > 8h cap
      localStorage.setItem("congregation-save-v1", JSON.stringify(env));
    });
    const p2 = await context.newPage();
    await p2.goto("/");
    await p2.waitForTimeout(600);
    await expect(p2.locator("#overlay-kicker")).toContainText("while the town slept");
    await expect(p2.locator("#overlay-sub")).toContainText("eight hours");
    // 1 follower * 0.25/s * 8h * 0.6 = 4320, plus the ~975 dread the setup
    // granted and a handful of tap earnings.
    const dread = await p2.evaluate(() => APP.game.state.dread);
    expect(dread).toBeGreaterThan(5100);
    expect(dread).toBeLessThan(5700);
  });

  test("corrupt save is quarantined, never wiped silently", async ({ page, context }) => {
    await page.goto("/");
    await page.close();
    await doctorStorage(context, () => localStorage.setItem("congregation-save-v1", "{nope"));
    const p2 = await context.newPage();
    await p2.goto("/");
    await p2.waitForTimeout(400);
    await expect(p2.locator("#overlay-kicker")).toContainText("a bad dream");
    expect(await p2.evaluate(() => localStorage.getItem("congregation-save-v1-corrupt"))).toBe("{nope");
    expect(await p2.evaluate(() => APP.game.state.lifetime)).toBe(0);
  });

  test("hard reset wipes after double confirm", async ({ page }) => {
    await page.goto("/?grant=5000");
    await dismissAll(page);
    await page.click('[data-panel="more"]');
    await page.click("#reset-btn");
    await page.click(".overlay-btn.danger"); // first confirm
    await page.waitForTimeout(200);
    await page.click(".overlay-btn.danger"); // FORGET
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => APP.game.state.lifetime)).toBe(0);
    expect(await page.evaluate(() => APP.game.state.dread)).toBe(0);
  });
});
