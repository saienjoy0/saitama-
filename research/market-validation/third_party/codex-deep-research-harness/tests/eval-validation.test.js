const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validSpec, validEval, validEvidence } = require("./helpers/fixtures");
const { passingEval } = require("./helpers/run-fixture");
const { runCli } = require("./helpers/run-cli");

function makeFiles(evaluation) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-eval-"));
  const context = path.join(directory, "context");
  fs.mkdirSync(context);
  const spec = validSpec();
  fs.writeFileSync(path.join(directory, "spec.json"), `${JSON.stringify(spec, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, "draft.md"), "# Report\n\n## Executive Summary\n\nIsolation matters [dim_001-src-001].\n");
  fs.writeFileSync(path.join(context, "evidence_dim_001.json"), `${JSON.stringify(validEvidence(spec), null, 2)}\n`);
  fs.writeFileSync(path.join(directory, "eval.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return {
    directory,
    args: [
      "eval",
      path.join(directory, "eval.json"),
      "--spec",
      path.join(directory, "spec.json"),
      "--draft",
      path.join(directory, "draft.md"),
      "--evidence-dir",
      context,
    ],
  };
}

function checkInvalid(mutator, expected) {
  const evaluation = validEval();
  mutator(evaluation);
  const files = makeFiles(evaluation);
  try {
    const result = runCli(files.args);
    assert.equal(result.status, 1);
    assert.match(result.stdout, expected);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
}

test("valid evaluation passes with complete semantic context", () => {
  const files = makeFiles(validEval());
  try {
    const result = runCli(files.args);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evaluation rejects criterion weight and multiplication drift", () => {
  checkInvalid((evaluation) => {
    evaluation.criteria.source_quality.weight = 0.3;
    evaluation.criteria.source_quality.weighted = 4.75;
  }, /source_quality weight must be 0.2|weighted must equal score multiplied by weight/);
});

test("evaluation rejects raw-average drift", () => {
  checkInvalid((evaluation) => {
    evaluation.calibration.raw_average = 4.9;
  }, /calibration.raw_average must equal/);
});

test("evaluation rejects derived calibration and overall-score drift", () => {
  checkInvalid((evaluation) => {
    evaluation.calibration.weakest_score = 2;
    evaluation.calibration.defect_count = 6;
    evaluation.overall_score = 3.5;
  }, /weakest_score must equal 3|defect_count must equal defects.length|overall_score must equal 3 after cap rules/);
});

test("scores above three require a concrete high-score defense", () => {
  checkInvalid((evaluation) => {
    evaluation.criteria.clarity.score = 4;
    evaluation.criteria.clarity.weighted = 0.2;
    evaluation.calibration.raw_average = 3.05;
    evaluation.calibration.score_spread = 1;
    evaluation.overall_score = 3.05;
  }, /missing high-score defense for clarity/);
});

test("pass true cannot coexist with REVISE", () => {
  checkInvalid((evaluation) => {
    evaluation.pass = true;
    evaluation.overall_score = 4;
    evaluation.verdict = "REVISE";
    Object.values(evaluation.gates).forEach((gate) => { gate.status = "pass"; });
    evaluation.gates.feedback_compliance.status = "not_applicable";
  }, /pass and verdict must agree|verdict must be PASS/);
});

test("initial evaluation requires feedback compliance to be not_applicable", () => {
  checkInvalid((evaluation) => {
    evaluation.gates.feedback_compliance.status = "pass";
  }, /initial evaluation requires feedback_compliance=not_applicable/);
});

test("a qualifying evaluation must use the PASS verdict", () => {
  checkInvalid((evaluation) => {
    evaluation.pass_threshold = 3;
    evaluation.gates.citation_coverage.status = "pass";
  }, /qualifying evaluation verdict must be PASS/);
});

test("revision evaluation cannot use not_applicable feedback compliance", () => {
  checkInvalid((evaluation) => {
    evaluation.iteration = 2;
  }, /revision evaluation requires feedback_compliance pass or fail/);
});

test("weak dimensions must exist in the spec", () => {
  checkInvalid((evaluation) => {
    evaluation.weak_dimensions = ["dim_999"];
  }, /unknown weak dimension dim_999/);
});

test("failed coverage gates require a weak dimension", () => {
  checkInvalid((evaluation) => {
    evaluation.weak_dimensions = [];
  }, /failed coverage gates require at least one weak dimension/);
});

test("draft citations must exist in evidence", () => {
  const evaluation = validEval();
  const files = makeFiles(evaluation);
  fs.writeFileSync(path.join(files.directory, "draft.md"), "# Report\n\nUnsupported [dim_002-src-999].\n");
  try {
    const result = runCli(files.args);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /citation dim_002-src-999 has no evidence source/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("citation audit must cover the deterministic sample", () => {
  const evaluation = validEval();
  evaluation.citation_audit = [];
  const files = makeFiles(evaluation);
  try {
    const result = runCli(files.args);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /citation audit requires 1 unique source/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("citation audit entries must name a source cited in the draft", () => {
  checkInvalid((evaluation) => {
    evaluation.citation_audit[0].source_id = "dim_002-src-001";
  }, /audited source dim_002-src-001 is not cited in draft/);
});

test("an unsupported citation audit forces the citation gate to fail", () => {
  checkInvalid((evaluation) => {
    evaluation.citation_audit[0].status = "unsupported";
    evaluation.gates.citation_coverage.status = "pass";
  }, /unsupported citation audit requires citation_coverage=fail/);
});

test("evaluation reports each missing semantic-context flag without a stack trace", () => {
  for (const flag of ["--spec", "--draft", "--evidence-dir"]) {
    const files = makeFiles(validEval());
    const index = files.args.indexOf(flag);
    files.args.splice(index, 2);
    try {
      const result = runCli(files.args);
      assert.equal(result.status, 1);
      assert.equal(result.stderr, "");
      assert.match(result.stdout, new RegExp(`Missing required option ${flag}`));
    } finally {
      fs.rmSync(files.directory, { recursive: true, force: true });
    }
  }
});

test("genuinely strong evaluation may contain zero defects", () => {
  const evaluation = passingEval();
  evaluation.defects = [];
  evaluation.calibration.defect_count = 0;
  evaluation.citation_audit = [evaluation.citation_audit[0]];
  const files = makeFiles(evaluation);
  try {
    const result = runCli(files.args);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});
