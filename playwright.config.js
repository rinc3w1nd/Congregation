// CONGREGATION — Playwright config (dev-only; the shipped game has no build
// and no dependencies). Serves the static site via python3 http.server and
// runs Chromium from an explicit executable path (CI/container friendly).
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  timeout: 45000,
  retries: 0,
  use: {
    baseURL: "http://localhost:8877",
    viewport: { width: 390, height: 780 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
      args: ["--autoplay-policy=no-user-gesture-required"],
    },
  },
  webServer: {
    command: "python3 -m http.server 8877",
    port: 8877,
    reuseExistingServer: true,
  },
});
