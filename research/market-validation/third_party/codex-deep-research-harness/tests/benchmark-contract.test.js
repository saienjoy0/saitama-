const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { repoRoot, skillRoot } = require("./helpers/run-cli");

function read(relativePath) {
  const root = relativePath.startsWith("benchmarks/") ? repoRoot : skillRoot;
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function benchmarkCase() {
  return JSON.parse(read("benchmarks/cases/codex-research-harness.json"));
}

test("benchmark compares the identical prompt and includes resume", () => {
  const benchmark = benchmarkCase();
  assert.equal(typeof benchmark.prompt, "string");
  assert.ok(benchmark.prompt.length > 100);
  assert.match(benchmark.baseline.instructions, /fresh Codex task/);
  assert.match(benchmark.harness.instructions, /identical prompt/);
  assert.match(benchmark.harness.instructions, /deep-research-harness/);
  assert.match(benchmark.harness.interrupt_after, /Scout artifacts validate/);
  assert.match(benchmark.harness.resume_instruction, /Resume/);
  assert.equal(benchmark.acceptance.run_validation_exit, 0);
  assert.equal(benchmark.acceptance.unknown_citation_count, 0);
  assert.equal(benchmark.acceptance.duplicate_role_after_resume_count, 0);
  assert.equal(benchmark.acceptance.required_terminal_status, "completed");
});

test("human benchmark weights sum to one", () => {
  const total = Object.values(benchmarkCase().human_score_weights)
    .reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test("benchmark release thresholds remain strict", () => {
  const acceptance = benchmarkCase().acceptance;
  assert.equal(acceptance.minimum_citation_audit_coverage, 0.2);
  assert.equal(acceptance.minimum_harness_human_score_gain, 0.5);
  assert.match(read("benchmarks/README.md"), /do not weaken the threshold/i);
});

test("evaluator calibration permits truth without defect or score quotas", () => {
  const prompt = read("prompts/evaluator.md");
  const reference = read("references/eval-schema.md");
  const calibration = read("references/evaluator-calibration.md");
  const contract = `${prompt}\n${reference}`;
  assert.match(prompt, /Read the absolute `references\/evaluator-calibration\.md` path/);
  assert.match(contract, /do not invent defects/i);
  assert.match(contract, /defect_count.*defects\.length/is);
  assert.doesNotMatch(contract, /at least \*\*?5|at least 5|≥5 defects/i);
  assert.doesNotMatch(contract, /At least \*\*two\*\* criteria.*(?:<=|≤) 2/i);
  for (const anchor of ["Weak: 2.0-2.5", "Competent: 3.0-3.4", "Strong: 4.0-4.4"]) {
    assert.match(calibration, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Skill passes the absolute evaluator calibration path", () => {
  assert.match(
    read("SKILL.md"),
    /pass the absolute `references\/evaluator-calibration\.md` path/,
  );
});
