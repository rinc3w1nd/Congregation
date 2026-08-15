"use strict";
// Shared helpers for the CONGREGATION suite.

// Dismiss any queued tap-to-dismiss overlays (visions, reports). Stops at
// action overlays (confirms) so tests can press their buttons explicitly.
async function dismissAll(page) {
  for (let i = 0; i < 30; i++) {
    if (!(await page.isVisible("#overlay-card"))) return;
    if ((await page.locator(".overlay-btn").count()) > 0) return;
    await page.click("#overlay", { force: true });
    await page.waitForTimeout(120);
  }
}

// Track page errors; call the returned fn at the end of the test.
function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return () => errors;
}

// Doctor localStorage from a non-game page on the same origin, so the game's
// pagehide autosave can't overwrite the doctored value during navigation.
async function doctorStorage(context, fn, arg) {
  const p = await context.newPage();
  await p.goto("/docs/GDD.md");
  await p.evaluate(fn, arg);
  await p.close();
}

module.exports = { dismissAll, collectErrors, doctorStorage };
