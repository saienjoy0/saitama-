const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validSpec, validEval } = require("./helpers/fixtures");
const { runCli } = require("./helpers/run-cli");
const { validateJsonFile } = require("../skills/deep-research-harness/scripts/lib/json-schema");

const usage = [
  "Usage:",
  "  node scripts/validate.js spec <path>",
  "  node scripts/validate.js meta <path>",
  "  node scripts/validate.js evidence <path> --spec <spec-path> [--prior <prior-evidence-path>]",
  "  node scripts/validate.js draft <path> --spec <spec-path> --evidence-dir <evidence-directory>",
  "  node scripts/validate.js eval <path> --spec <spec-path> --draft <draft-path> --evidence-dir <evidence-directory>",
  "  node scripts/validate.js feedback <path> --eval <eval-path>",
  "  node scripts/validate.js notes <notes-dir> <spec-path>",
  "  node scripts/validate.js run <run-directory>",
  "",
].join("\n");

function withFile(content, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-schema-"));
  const file = path.join(directory, "artifact.json");
  fs.writeFileSync(file, content);
  try {
    callback(file);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function withJson(payload, callback) {
  withFile(`${JSON.stringify(payload, null, 2)}\n`, callback);
}

function assertInvalidHeader(result, mode, file) {
  assert.equal(result.stdout.split("\n")[0], `INVALID ${mode} ${path.resolve(file)}`);
}

test("spec rejects fields forbidden by additionalProperties", () => {
  const spec = validSpec();
  spec.unexpected = true;
  withJson(spec, (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 1);
    assertInvalidHeader(result, "spec", file);
    assert.match(result.stdout, /must NOT have additional properties/);
  });
});

test("spec enforces enums, integer types, and maximum item counts", () => {
  const spec = validSpec();
  spec.audience.level = "alien";
  spec.outputFormat.maxWords = 500.5;
  spec.artifactPlan = Array.from({ length: 4 }, (_, index) => ({
    ...spec.artifactPlan[0],
    id: `artifact_0${index + 1}`,
  }));
  withJson(spec, (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 1);
    assertInvalidHeader(result, "spec", file);
    assert.match(result.stdout, /must be equal to one of the allowed values/);
    assert.match(result.stdout, /must be integer/);
    assert.match(result.stdout, /must NOT have more than 3 items/);
  });
});

test("spec supports only inline citations", () => {
  for (const citationStyle of ["footnote", "endnote"]) {
    const spec = validSpec();
    spec.outputFormat.citationStyle = citationStyle;
    withJson(spec, (file) => {
      const result = runCli(["spec", file]);
      assert.equal(result.status, 1, citationStyle);
      assertInvalidHeader(result, "spec", file);
      assert.match(result.stdout, /must be equal to one of the allowed values/);
    });
  }
});

test("spec rejects duplicate dimensions and unknown artifact source dimensions", () => {
  const spec = validSpec();
  spec.dimensions[1].id = "dim_001";
  spec.artifactPlan[0].sourceDimensions = ["dim_999"];
  withJson(spec, (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 1);
    assertInvalidHeader(result, "spec", file);
    assert.match(result.stdout, /duplicate dimension id dim_001/);
    assert.match(result.stdout, /artifact_01 references unknown dimension dim_999/);
  });
});

test("spec rejects duplicate artifact ids", () => {
  const spec = validSpec();
  spec.artifactPlan.push({
    ...spec.artifactPlan[0],
    purpose: "A second artifact with a conflicting identifier",
  });
  withJson(spec, (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 1);
    assertInvalidHeader(result, "spec", file);
    assert.match(result.stdout, /duplicate artifact id artifact_01/);
  });
});

test("spec rejects a source required and excluded at the same time", () => {
  const spec = validSpec();
  spec.constraints.excludeSources = [...spec.constraints.requireSources];
  withJson(spec, (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /cannot be both required and excluded/);
  });
});

test("eval rejects a fractional criterion score and missing weight", () => {
  const evaluation = validEval();
  evaluation.criteria.source_quality.score = 2.5;
  delete evaluation.criteria.source_quality.weight;
  withJson(evaluation, (file) => {
    const result = runCli(["eval", file]);
    assert.equal(result.status, 1);
    assertInvalidHeader(result, "eval", file);
    assert.match(result.stdout, /must be integer/);
    assert.match(result.stdout, /must have required property 'weight'/);
  });
});

test("malformed JSON reports a parse error under the exact invalid header", () => {
  withFile("{\n", (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 1);
    assertInvalidHeader(result, "spec", file);
    assert.match(result.stdout, /- JSON parse error:/);
  });
});

test("validateJsonFile is exported as the direct schema validation interface", () => {
  assert.equal(typeof validateJsonFile, "function");
  withJson(validSpec(), (file) => {
    const result = validateJsonFile("spec", file);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
    assert.equal(result.data.topic, validSpec().topic);
  });
});

test("missing CLI arguments print the complete usage contract", () => {
  const result = runCli([]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, usage);
});

test("unsupported CLI modes print the complete usage contract", () => {
  const result = runCli(["unknown", "artifact.json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, usage);
});

test("valid spec fixture passes through the context-free CLI", () => {
  withJson(validSpec(), (file) => {
    const result = runCli(["spec", file]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, `VALID spec ${path.resolve(file)}\n`);
  });
});
