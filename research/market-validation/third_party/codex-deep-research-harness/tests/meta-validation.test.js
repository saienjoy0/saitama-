const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validMeta } = require("./helpers/fixtures");
const { runCli } = require("./helpers/run-cli");

function validate(payload) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-meta-"));
  const file = path.join(directory, "meta.json");
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  const result = runCli(["meta", file]);
  fs.rmSync(directory, { recursive: true, force: true });
  return result;
}

function completedMeta(passed) {
  const meta = validMeta();
  meta.status = "completed";
  meta.phase = "finalized";
  meta.best = {
    round: 1,
    draft_path: "drafts/draft_v1.md",
    eval_path: "eval/eval_v1.json",
    score: 4,
    passed,
  };
  return meta;
}

test("valid resumable meta state passes", () => {
  const result = validate(validMeta());
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("meta rejects unknown lifecycle states", () => {
  const meta = validMeta();
  meta.status = "finished-ish";
  const result = validate(meta);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /allowed values/);
});

test("work item attempts cannot exceed the one-retry policy", () => {
  const meta = validMeta();
  meta.work_items[0].attempt = 3;
  const result = validate(meta);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /must be <= 2/);
});

test("terminal completed state requires a best draft", () => {
  const meta = validMeta();
  meta.status = "completed";
  meta.phase = "finalized";
  const result = validate(meta);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /must match "then" schema/);
});

test("completed state rejects a best draft that did not pass", () => {
  const result = validate(completedMeta(false));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /must be equal to constant/);
});

test("completed state accepts a best draft that passed", () => {
  const result = validate(completedMeta(true));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
