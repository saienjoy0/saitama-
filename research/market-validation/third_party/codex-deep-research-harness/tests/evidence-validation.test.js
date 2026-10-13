const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validSpec, validEvidence } = require("./helpers/fixtures");
const { runCli } = require("./helpers/run-cli");

function writePair(spec, evidence) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "harness-evidence-"));
  const specPath = path.join(directory, "spec.json");
  const evidencePath = path.join(directory, "evidence.json");
  fs.writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return { directory, specPath, evidencePath };
}

test("evidence accepts a complete dimension artifact", () => {
  const spec = validSpec();
  const files = writePair(spec, validEvidence(spec));
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evidence requires the spec option", () => {
  const spec = validSpec();
  const files = writePair(spec, validEvidence(spec));
  try {
    const result = runCli(["evidence", files.evidencePath]);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /Missing required option --spec/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evidence rejects unknown source references", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.claims[0].source_ids = ["dim_001-src-999"];
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /unknown source dim_001-src-999/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evidence source URLs must use HTTP or HTTPS", () => {
  for (const url of ["file:///etc/passwd", "data:text/plain,secret"]) {
    const spec = validSpec();
    const evidence = validEvidence(spec);
    evidence.sources[0].url = url;
    const files = writePair(spec, evidence);
    try {
      const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
      assert.equal(result.status, 1, url);
      assert.match(result.stdout, /url.*must match pattern/i);
    } finally {
      fs.rmSync(files.directory, { recursive: true, force: true });
    }
  }
});

test("evidence accepts parseable HTTP and HTTPS source URLs", () => {
  for (const url of ["http://example.com/source", "https://example.com/source?q=research"]) {
    const spec = validSpec();
    const evidence = validEvidence(spec);
    evidence.sources[0].url = url;
    const files = writePair(spec, evidence);
    try {
      const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
      assert.equal(result.status, 0, `${url}\n${result.stdout}${result.stderr}`);
    } finally {
      fs.rmSync(files.directory, { recursive: true, force: true });
    }
  }
});

test("evidence rejects HTTP or HTTPS source URLs without a usable authority", () => {
  for (const url of ["https://", "http://?q=x", "https://user:pass@"]) {
    const spec = validSpec();
    const evidence = validEvidence(spec);
    evidence.sources[0].url = url;
    const files = writePair(spec, evidence);
    try {
      const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
      assert.equal(result.status, 1, url);
      assert.match(result.stdout, /url.*(?:format|parseable|hostname)/i);
    } finally {
      fs.rmSync(files.directory, { recursive: true, force: true });
    }
  }
});

test("evidence rejects source URLs containing credentials", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.sources[0].url = "https://user:pass@example.com/path";
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /source .* URL must not contain credentials/i);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("complete evidence must cover every dimension subquestion", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.claims.pop();
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /uncovered subquestion/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("complete evidence rejects claims for unassigned subquestions", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.claims[0].subquestion = "A question not assigned to this dimension?";
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /does not match an assigned subquestion/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("partial evidence rejects claims for unassigned subquestions", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.status = "partial";
  evidence.open_questions = ["Which assigned question remains unresolved?"];
  evidence.claims[0].subquestion = "A question not assigned to this dimension?";
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /does not match an assigned subquestion/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("partial evidence must list open questions", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.status = "partial";
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /partial evidence must list at least one open question/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evidence rejects duplicate source and claim identifiers", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.sources.push(structuredClone(evidence.sources[0]));
  evidence.claims.push(structuredClone(evidence.claims[0]));
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /duplicate source id dim_001-src-001/);
    assert.match(result.stdout, /duplicate claim id dim_001-claim-001/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evidence rejects unknown contradiction source references", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.contradictions.push({
    claim: "Sources disagree about the harness behavior.",
    source_ids: ["dim_001-src-001", "dim_001-src-999"],
    assessment: "The unknown source cannot support this assessment.",
  });
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /contradiction references unknown source dim_001-src-999/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("evidence rejects source identifiers belonging to another dimension", () => {
  const spec = validSpec();
  const evidence = validEvidence(spec);
  evidence.sources[0].id = "dim_002-src-001";
  evidence.claims.forEach((claim) => { claim.source_ids = ["dim_002-src-001"]; });
  const files = writePair(spec, evidence);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /must begin with dim_001-src-/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});

test("revision evidence cannot remove or rewrite prior claims", () => {
  const spec = validSpec();
  const prior = validEvidence(spec);
  const evidence = structuredClone(prior);
  evidence.round = 2;
  evidence.claims[0].statement = "Rewritten prior claim";
  const files = writePair(spec, evidence);
  const priorPath = path.join(files.directory, "prior.json");
  fs.writeFileSync(priorPath, `${JSON.stringify(prior, null, 2)}\n`);
  try {
    const result = runCli(["evidence", files.evidencePath, "--spec", files.specPath, "--prior", priorPath]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /prior claim .* must remain unchanged/);
  } finally {
    fs.rmSync(files.directory, { recursive: true, force: true });
  }
});
