import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./screenshots/automated",
  fullyParallel: false,
  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright-report", open: "never" }],
  ],
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "projection", use: { viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
