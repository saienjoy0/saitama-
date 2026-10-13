const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");
const skillRoot = path.join(repoRoot, "skills/deep-research-harness");

function runCli(args) {
  return spawnSync(process.execPath, [path.join(skillRoot, "scripts/validate.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

module.exports = { repoRoot, skillRoot, runCli };
