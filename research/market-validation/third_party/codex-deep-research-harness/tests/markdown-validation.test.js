const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validSpec, validEval, validEvidence, validDraft, validFeedback } = require("./helpers/fixtures");
const { runCli } = require("./helpers/run-cli");

function makeContext() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-markdown-"));
  const context = path.join(directory, "context");
  fs.mkdirSync(context);
  const spec = validSpec();
  const secondEvidence = validEvidence(spec, "dim_002");
  secondEvidence.sources[0] = {
    ...secondEvidence.sources[0],
    id: "dim_002-src-001",
    url: "https://json-schema.org/draft/2020-12/json-schema-core",
    title: "JSON Schema Core",
    publisher: "JSON Schema",
    author: null,
    published_at: null,
    source_type: "official",
    credibility_reason: "The normative specification for the validation format used by the harness.",
  };
  secondEvidence.claims.forEach((claim) => { claim.source_ids = ["dim_002-src-001"]; });
  fs.writeFileSync(path.join(directory, "spec.json"), `${JSON.stringify(spec, null, 2)}\n`);
  fs.writeFileSync(path.join(context, "evidence_dim_001.json"), `${JSON.stringify(validEvidence(spec), null, 2)}\n`);
  fs.writeFileSync(path.join(context, "evidence_dim_002.json"), `${JSON.stringify(secondEvidence, null, 2)}\n`);
  return { directory, context, specPath: path.join(directory, "spec.json") };
}

function writeJson(file, payload) {
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

function replaceFrontmatterValue(draft, field, value) {
  return draft.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: ${value}`);
}

function recountDraft(draft) {
  const frontmatter = draft.match(/^---\n[\s\S]*?\n---\n/);
  assert.ok(frontmatter, "test fixture must have frontmatter");
  const body = draft.slice(frontmatter[0].length);
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  return replaceFrontmatterValue(draft, "word_count", String(wordCount));
}

function runDraft(files, draft) {
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, draft);
  return runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
}

function makeFeedbackContext(evaluation = validEval()) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-feedback-"));
  const evalPath = path.join(directory, "eval.json");
  const feedbackPath = path.join(directory, "feedback.md");
  writeJson(evalPath, evaluation);
  return { directory, evalPath, feedbackPath, evaluation };
}

function runFeedback(files, feedback) {
  fs.writeFileSync(files.feedbackPath, feedback);
  return runCli(["feedback", files.feedbackPath, "--eval", files.evalPath]);
}

function passingEval() {
  const evaluation = validEval();
  evaluation.pass = true;
  evaluation.verdict = "PASS";
  evaluation.overall_score = 4;
  evaluation.weak_dimensions = [];
  evaluation.summary = "The report satisfies every blocking evaluation requirement.";
  return evaluation;
}

test("valid draft passes while remaining well below maxWords", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, validDraft());
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft rejects missing dimension sections", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, validDraft().replace(/## \[dim_002\][\s\S]*?## Uncertainty Register/, "## Uncertainty Register"));
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /missing dimension section dim_002/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft rejects artifact placement that disagrees with spec", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, validDraft().replace("placement:dimension_section", "placement:appendix"));
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /artifact_01 placement must be dimension_section/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft rejects citations absent from evidence", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, `${validDraft()}\nUnknown claim [dim_001-src-999].\n`);
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /citation dim_001-src-999 has no evidence source/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("one-line keyword feedback no longer passes", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-feedback-"));
  const evalPath = path.join(directory, "eval.json");
  const feedbackPath = path.join(directory, "feedback.md");
  fs.writeFileSync(evalPath, `${JSON.stringify(validEval(), null, 2)}\n`);
  fs.writeFileSync(feedbackPath, "Must Fix Should Improve Preserve New Research Directions Weak Dimensions Verdict Overall Score\n");
  try {
    const result = runCli(["feedback", feedbackPath, "--eval", evalPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /missing heading/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("feedback weak dimensions must mirror eval JSON", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-feedback-"));
  const evaluation = validEval();
  const evalPath = path.join(directory, "eval.json");
  const feedbackPath = path.join(directory, "feedback.md");
  fs.writeFileSync(evalPath, `${JSON.stringify(evaluation, null, 2)}\n`);
  fs.writeFileSync(feedbackPath, validFeedback(evaluation).replace("- dim_001", "- dim_002"));
  try {
    const result = runCli(["feedback", feedbackPath, "--eval", evalPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Weak Dimensions must match eval JSON/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("valid feedback passes with an eval JSON context", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-feedback-"));
  const evaluation = validEval();
  const evalPath = path.join(directory, "eval.json");
  const feedbackPath = path.join(directory, "feedback.md");
  writeJson(evalPath, evaluation);
  fs.writeFileSync(feedbackPath, validFeedback(evaluation));
  try {
    const result = runCli(["feedback", feedbackPath, "--eval", evalPath]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, `VALID feedback ${feedbackPath}\n`);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("draft requires both context options without printing a stack", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-markdown-"));
  const draftPath = path.join(directory, "draft.md");
  fs.writeFileSync(draftPath, validDraft());
  try {
    const result = runCli(["draft", draftPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Missing required option --spec/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("draft validates evidence JSON Schema before Markdown", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, "not a valid draft\n");
  const evidencePath = path.join(files.context, "evidence_dim_001.json");
  const evidence = validEvidence();
  evidence.sources[0].title = "x";
  writeJson(evidencePath, evidence);
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /evidence_dim_001\.json: \/sources\/0\/title must NOT have fewer than 3 characters/);
    assert.doesNotMatch(result.stdout, /missing heading/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft validates evidence semantics before Markdown", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, "not a valid draft\n");
  const evidencePath = path.join(files.context, "evidence_dim_001.json");
  const evidence = validEvidence();
  evidence.claims[0].subquestion = "An unassigned but sufficiently long subquestion";
  writeJson(evidencePath, evidence);
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /subquestion does not match an assigned subquestion/);
    assert.doesNotMatch(result.stdout, /missing heading/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft reports malformed evidence JSON without a stack", () => {
  const files = makeContext();
  const draftPath = path.join(files.directory, "draft.md");
  fs.writeFileSync(draftPath, validDraft());
  fs.writeFileSync(path.join(files.context, "evidence_dim_001.json"), "{\n");
  try {
    const result = runCli(["draft", draftPath, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /evidence_dim_001\.json: JSON parse error:/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft reports missing files and directories without a stack", () => {
  const files = makeContext();
  const missingDraft = path.join(files.directory, "missing.md");
  const missingContext = path.join(files.directory, "missing-context");
  try {
    const missingDirectoryResult = runCli(["draft", missingDraft, "--spec", files.specPath, "--evidence-dir", missingContext]);
    assert.equal(missingDirectoryResult.status, 1);
    assert.match(missingDirectoryResult.stdout, /Evidence context error:/);
    assert.equal(missingDirectoryResult.stderr, "");

    const missingDraftResult = runCli(["draft", missingDraft, "--spec", files.specPath, "--evidence-dir", files.context]);
    assert.equal(missingDraftResult.status, 1);
    assert.match(missingDraftResult.stdout, /Draft file error:/);
    assert.equal(missingDraftResult.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback validates eval JSON Schema before Markdown", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-feedback-"));
  const evalPath = path.join(directory, "eval.json");
  const feedbackPath = path.join(directory, "feedback.md");
  writeJson(evalPath, {});
  fs.writeFileSync(feedbackPath, "not a valid feedback artifact\n");
  try {
    const result = runCli(["feedback", feedbackPath, "--eval", evalPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /must have required property 'version'/);
    assert.doesNotMatch(result.stdout, /missing heading/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("feedback reports malformed eval and missing feedback files without a stack", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-feedback-"));
  const evalPath = path.join(directory, "eval.json");
  const missingFeedback = path.join(directory, "missing.md");
  try {
    fs.writeFileSync(evalPath, "{\n");
    const malformedEvalResult = runCli(["feedback", missingFeedback, "--eval", evalPath]);
    assert.equal(malformedEvalResult.status, 1);
    assert.match(malformedEvalResult.stdout, /JSON parse error:/);
    assert.equal(malformedEvalResult.stderr, "");

    writeJson(evalPath, validEval());
    const missingFeedbackResult = runCli(["feedback", missingFeedback, "--eval", evalPath]);
    assert.equal(missingFeedbackResult.status, 1);
    assert.match(missingFeedbackResult.stdout, /Feedback file error:/);
    assert.equal(missingFeedbackResult.stderr, "");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("draft requires one canonical evidence file for every spec dimension", () => {
  const files = makeContext();
  fs.rmSync(path.join(files.context, "evidence_dim_002.json"));
  try {
    const result = runDraft(files, validDraft());
    assert.equal(result.status, 1);
    assert.match(result.stdout, /missing evidence file evidence_dim_002\.json for dimension dim_002/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft rejects extra evidence files for unknown dimensions", () => {
  const files = makeContext();
  const extra = validEvidence(files.spec, "dim_001");
  extra.dimension_id = "dim_999";
  extra.sources[0].id = "dim_999-src-001";
  extra.claims.forEach((claim, index) => {
    claim.id = `dim_999-claim-${String(index + 1).padStart(3, "0")}`;
    claim.source_ids = ["dim_999-src-001"];
  });
  writeJson(path.join(files.context, "evidence_dim_999.json"), extra);
  try {
    const result = runDraft(files, validDraft());
    assert.equal(result.status, 1);
    assert.match(result.stdout, /unexpected evidence file evidence_dim_999\.json for unknown dimension dim_999/);
    assert.match(result.stdout, /payload dimension dim_999 does not exist in spec/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft rejects evidence filename and payload dimension mismatch", () => {
  const files = makeContext();
  writeJson(path.join(files.context, "evidence_dim_001.json"), validEvidence(files.spec, "dim_002"));
  try {
    const result = runDraft(files, validDraft());
    assert.equal(result.status, 1);
    assert.match(result.stdout, /evidence_dim_001\.json: filename dimension dim_001 does not match payload dimension dim_002/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft rejects duplicate evidence payload dimensions", () => {
  const files = makeContext();
  writeJson(path.join(files.context, "evidence_dim_001.json"), validEvidence(files.spec, "dim_002"));
  try {
    const result = runDraft(files, validDraft());
    assert.equal(result.status, 1);
    assert.match(result.stdout, /duplicate evidence payload for dimension dim_002: evidence_dim_001\.json, evidence_dim_002\.json/);
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft frontmatter requires a nonempty task_id", () => {
  const files = makeContext();
  try {
    const result = runDraft(files, replaceFrontmatterValue(validDraft(), "task_id", ""));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter task_id must be nonempty/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft frontmatter round must be a positive integer", () => {
  const files = makeContext();
  try {
    const result = runDraft(files, replaceFrontmatterValue(validDraft(), "round", "0"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter round must be a positive integer/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft frontmatter mode must be initial or revision", () => {
  const files = makeContext();
  try {
    const result = runDraft(files, replaceFrontmatterValue(validDraft(), "mode", "retry"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter mode must be initial or revision/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("initial draft frontmatter requires round 1", () => {
  const files = makeContext();
  try {
    const result = runDraft(files, replaceFrontmatterValue(validDraft(), "round", "2"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter mode initial requires round 1/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("revision draft frontmatter requires a round greater than 1", () => {
  const files = makeContext();
  try {
    const draft = replaceFrontmatterValue(validDraft(), "mode", "revision");
    const result = runDraft(files, draft);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter mode revision requires round greater than 1/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft frontmatter word_count must be an integer", () => {
  const files = makeContext();
  try {
    const result = runDraft(files, replaceFrontmatterValue(validDraft(), "word_count", "many"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter word_count must be an integer/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft frontmatter integer word_count must equal the raw body count", () => {
  const files = makeContext();
  try {
    const result = runDraft(files, replaceFrontmatterValue(validDraft(), "word_count", "1"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter word_count 1 does not equal actual/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft frontmatter generated_at must be an ISO timestamp", () => {
  const files = makeContext();
  try {
    let result = runDraft(files, replaceFrontmatterValue(validDraft(), "generated_at", "yesterday"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter generated_at must be an ISO timestamp/);

    result = runDraft(files, replaceFrontmatterValue(validDraft(), "generated_at", "2026-02-30T12:30:00.000Z"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter generated_at must be an ISO timestamp/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft task_id must agree with every evidence artifact", () => {
  const files = makeContext();
  const evidencePath = path.join(files.context, "evidence_dim_002.json");
  const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  evidence.task_id = "different-task-id";
  writeJson(evidencePath, evidence);
  try {
    const result = runDraft(files, validDraft());
    assert.equal(result.status, 1);
    assert.match(result.stdout, /frontmatter task_id codex-harness-20260709-1200 does not match evidence dim_002 task_id different-task-id/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft ignores headings and artifact markers inside fenced code blocks", () => {
  const files = makeContext();
  let draft = validDraft()
    .replace("<!-- artifact:artifact_01 placement:dimension_section -->", "")
    .replace(/## \[dim_002\][\s\S]*?## Uncertainty Register/, "## Uncertainty Register");
  draft += "\n```markdown\n## [dim_002] Fenced fake dimension\n<!-- artifact:artifact_01 placement:dimension_section -->\n```\n";
  draft = recountDraft(draft);
  try {
    const result = runDraft(files, draft);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /missing dimension section dim_002/);
    assert.match(result.stdout, /missing artifact marker artifact_01/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("draft ignores citations inside fenced code blocks while counting their raw words", () => {
  const files = makeContext();
  const draft = recountDraft(`${validDraft()}\n~~~text\nFenced fake citation [dim_999-src-999].\n~~~\n`);
  try {
    const result = runDraft(files, draft);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback H1 round must equal the eval iteration", () => {
  const files = makeFeedbackContext();
  try {
    const result = runFeedback(files, validFeedback(files.evaluation).replace("Round 1", "Round 2"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Feedback H1 round must match eval JSON iteration 1/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback verdict and score must be exact anchored lines", () => {
  const files = makeFeedbackContext();
  const feedback = validFeedback(files.evaluation)
    .replace("**Verdict:** REVISE", "prefix **Verdict:** REVISE")
    .replace("**Overall Score:** 3/5.0", "**Overall Score:** 3/5.0 suffix");
  try {
    const result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Verdict must match eval JSON/);
    assert.match(result.stdout, /Overall Score must match eval JSON/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback Summary must normalize to the eval summary", () => {
  const files = makeFeedbackContext();
  try {
    const whitespaceOnly = validFeedback(files.evaluation).replace(
      files.evaluation.summary,
      `  ${files.evaluation.summary.replaceAll(" ", "\n   ")}  `,
    );
    assert.equal(runFeedback(files, whitespaceOnly).status, 0);

    const mismatch = validFeedback(files.evaluation).replace(files.evaluation.summary, "A different summary appears here.");
    const result = runFeedback(files, mismatch);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Summary must match eval JSON/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("passing feedback Must Fix must contain exactly one - none bullet", () => {
  const files = makeFeedbackContext(passingEval());
  try {
    const valid = validFeedback(files.evaluation);
    assert.equal(runFeedback(files, valid).status, 0);
    const result = runFeedback(files, valid.replace("- none\n\n## Should Improve", "- none\n- extra\n\n## Should Improve"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /passing feedback Must Fix section must be exactly - none/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("non-PASS feedback Must Fix requires at least one blocking bullet", () => {
  const files = makeFeedbackContext();
  try {
    const feedback = validFeedback(files.evaluation).replace(
      "- [D1] [gate:citation_coverage] [section:## Executive Summary] Add support for the unsupported claim.",
      "- none",
    );
    const result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /non-PASS feedback Must Fix requires at least one blocking bullet/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback Must Fix rejects unknown defect references", () => {
  const files = makeFeedbackContext();
  try {
    const feedback = validFeedback(files.evaluation).replace("[D1]", "[D999]");
    const result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Must Fix references unknown defect D999/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback Must Fix gate references must exist, fail, and apply to the defect", () => {
  const files = makeFeedbackContext();
  try {
    let result = runFeedback(files, validFeedback(files.evaluation).replace("gate:citation_coverage", "gate:not_a_gate"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Must Fix references unknown gate not_a_gate/);

    result = runFeedback(files, validFeedback(files.evaluation).replace("gate:citation_coverage", "gate:schema_validity"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Must Fix gate schema_validity is not a failed applicable gate for defect D1/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback Must Fix criterion references must exist and apply to the defect", () => {
  const files = makeFeedbackContext();
  const evaluation = files.evaluation;
  evaluation.defects[0].criterion = "source_quality";
  writeJson(files.evalPath, evaluation);
  try {
    let feedback = validFeedback(evaluation).replace("gate:citation_coverage", "criterion:not_a_criterion");
    let result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Must Fix references unknown criterion not_a_criterion/);

    feedback = validFeedback(evaluation).replace("gate:citation_coverage", "criterion:actionability");
    result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Must Fix criterion actionability is not applicable to defect D1/);

    feedback = validFeedback(evaluation).replace("gate:citation_coverage", "criterion:source_quality");
    result = runFeedback(files, feedback);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback Preserve requires a nonempty bullet", () => {
  const files = makeFeedbackContext();
  try {
    const feedback = validFeedback(files.evaluation).replace(
      "- [section:## Architecture] Keep the clear role boundary explanation.",
      "Preserve this prose without a bullet.",
    );
    const result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Preserve must contain at least one nonempty bullet/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("empty eval weak dimensions require exactly one - none bullet", () => {
  const evaluation = validEval();
  evaluation.weak_dimensions = [];
  const files = makeFeedbackContext(evaluation);
  try {
    const valid = validFeedback(evaluation);
    assert.equal(runFeedback(files, valid).status, 0);
    const result = runFeedback(files, valid.replace("- none\n", "- none\nextra text\n"));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Weak Dimensions must match eval JSON exactly/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("nonempty eval weak dimensions reject duplicates, extra lines, and - none", () => {
  const files = makeFeedbackContext();
  try {
    for (const replacement of [
      "- dim_001\n- dim_001",
      "- dim_001\n- none",
      "- dim_001\nextra text",
    ]) {
      const feedback = validFeedback(files.evaluation).replace("- dim_001", replacement);
      const result = runFeedback(files, feedback);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Weak Dimensions must match eval JSON exactly/);
    }
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("feedback ignores fenced H1, headings, verdict, score, and section bullets", () => {
  const files = makeFeedbackContext();
  const feedback = `~~~markdown\n${validFeedback(files.evaluation)}~~~\n`;
  try {
    const result = runFeedback(files, feedback);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /missing heading ## Summary/);
    assert.match(result.stdout, /Feedback H1 round must match eval JSON iteration 1/);
    assert.match(result.stdout, /Verdict must match eval JSON/);
    assert.match(result.stdout, /Overall Score must match eval JSON/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});
