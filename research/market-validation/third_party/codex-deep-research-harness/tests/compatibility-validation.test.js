const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validSpec, validEval, validEvidence } = require("./helpers/fixtures");
const { runCli } = require("./helpers/run-cli");

function withDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-compat-"));
  try {
    callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function writeJson(file, payload) {
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

function makeEvalArgs(directory, evaluation) {
  const spec = validSpec();
  const context = path.join(directory, "evidence");
  const evalPath = path.join(directory, "eval.json");
  const specPath = path.join(directory, "spec.json");
  const draftPath = path.join(directory, "draft.md");
  fs.mkdirSync(context);
  writeJson(evalPath, evaluation);
  writeJson(specPath, spec);
  writeJson(path.join(context, "evidence_dim_001.json"), validEvidence(spec));
  fs.writeFileSync(draftPath, "# Report\n\n## Executive Summary\n\nIsolation matters [dim_001-src-001].\n");
  return [
    "eval",
    evalPath,
    "--spec",
    specPath,
    "--draft",
    draftPath,
    "--evidence-dir",
    context,
  ];
}

function legacyFeedback() {
  return `# Feedback

Verdict: REVISE
Overall Score: 3/5

## Must Fix

- Add citations.

## Should Improve

- Clarify the recommendation.

## What's Good

- Preserve the architecture comparison.

## New Research Directions

- Validate recovery behavior.
`;
}

function makeLegacyNotes(directory) {
  const spec = validSpec();
  const specPath = path.join(directory, "spec.json");
  const notesDirectory = path.join(directory, "context");
  fs.mkdirSync(notesDirectory);
  writeJson(specPath, spec);
  for (const dimension of spec.dimensions) {
    const notes = [
      ...dimension.subquestions.map((question) => `- ${question}`),
      "- Supporting evidence covers the architecture and recovery design.",
    ];
    fs.writeFileSync(path.join(notesDirectory, `notes_${dimension.id}.md`), `${notes.join("\n")}\n`);
    fs.writeFileSync(path.join(notesDirectory, `sources_${dimension.id}.md`), "# Sources\n");
  }
  return { notesDirectory, specPath, spec };
}

test("eval rejects pass=true when score is below threshold", () => {
  withDirectory((directory) => {
    const evaluation = validEval();
    evaluation.pass = true;
    evaluation.gates.citation_coverage.status = "pass";
    const args = makeEvalArgs(directory, evaluation);
    const file = args[1];
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID eval ${file}`);
    assert.match(result.stdout, /pass=true but score 3 < threshold 3\.8/);
  });
});

test("eval rejects pass=true when a blocking gate fails", () => {
  withDirectory((directory) => {
    const evaluation = validEval();
    evaluation.pass = true;
    evaluation.overall_score = 4;
    const args = makeEvalArgs(directory, evaluation);
    const file = args[1];
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID eval ${file}`);
    assert.match(result.stdout, /pass=true but gates failed: citation_coverage/);
  });
});

test("feedback without --eval fails normally instead of using the legacy permissive validator", () => {
  withDirectory((directory) => {
    const file = path.join(directory, "feedback.md");
    fs.writeFileSync(file, legacyFeedback());
    const result = runCli(["feedback", file]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID feedback ${file}`);
    assert.match(result.stdout, /Missing required option --eval/);
    assert.equal(result.stderr, "");
  });
});

test("legacy notes mode accepts complete per-dimension notes and sources", () => {
  withDirectory((directory) => {
    const files = makeLegacyNotes(directory);
    const result = runCli(["notes", files.notesDirectory, files.specPath]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, `VALID notes ${files.notesDirectory}\n`);
  });
});

test("legacy notes mode rejects a missing dimension sources file", () => {
  withDirectory((directory) => {
    const files = makeLegacyNotes(directory);
    const missing = path.join(files.notesDirectory, `sources_${files.spec.dimensions[1].id}.md`);
    fs.rmSync(missing);
    const result = runCli(["notes", files.notesDirectory, files.specPath]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID notes ${files.notesDirectory}`);
    assert.match(result.stdout, new RegExp(`Missing sources file for ${files.spec.dimensions[1].id}`));
  });
});

test("legacy notes mode rejects an empty spec through JSON Schema", () => {
  withDirectory((directory) => {
    const notesDirectory = path.join(directory, "context");
    const specPath = path.join(directory, "spec.json");
    fs.mkdirSync(notesDirectory);
    writeJson(specPath, {});
    const result = runCli(["notes", notesDirectory, specPath]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID notes ${notesDirectory}`);
    assert.match(result.stdout, /must have required property 'version'/);
    assert.equal(result.stderr, "");
  });
});

test("legacy notes mode rejects non-array dimensions without an uncaught stack", () => {
  withDirectory((directory) => {
    const notesDirectory = path.join(directory, "context");
    const specPath = path.join(directory, "spec.json");
    const spec = validSpec();
    spec.dimensions = {};
    fs.mkdirSync(notesDirectory);
    writeJson(specPath, spec);
    const result = runCli(["notes", notesDirectory, specPath]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID notes ${notesDirectory}`);
    assert.match(result.stdout, /\/dimensions must be array/);
    assert.equal(result.stderr, "");
  });
});

test("legacy notes mode reports malformed spec JSON through the shared parser", () => {
  withDirectory((directory) => {
    const notesDirectory = path.join(directory, "context");
    const specPath = path.join(directory, "spec.json");
    fs.mkdirSync(notesDirectory);
    fs.writeFileSync(specPath, "{\n");
    const result = runCli(["notes", notesDirectory, specPath]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.split("\n")[0], `INVALID notes ${notesDirectory}`);
    assert.match(result.stdout, /JSON parse error:/);
    assert.equal(result.stderr, "");
  });
});
