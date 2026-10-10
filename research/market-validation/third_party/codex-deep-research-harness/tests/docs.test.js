const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { repoRoot, skillRoot } = require("./helpers/run-cli");

function read(relativePath) {
  const root = relativePath === "README.md" ? repoRoot : skillRoot;
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("documentation contains no user-specific absolute paths", () => {
  for (const file of ["README.md", "SKILL.md", "references/workflow.md", "references/spec-schema.md", "references/eval-schema.md"]) {
    assert.doesNotMatch(read(file), /\/Users\/[^/]+\//, file);
  }
});

test("README local Markdown links resolve", () => {
  const markdown = read("README.md");
  const links = [...markdown.matchAll(/\[[^\]]+\]\((?!https?:|#)([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    const clean = decodeURIComponent(link.split("#")[0]);
    assert.equal(fs.existsSync(path.resolve(repoRoot, clean)), true, link);
  }
});

test("README keeps the documented product-section order", () => {
  const headings = [...read("README.md").matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "What It Is",
    "Why It Exists",
    "Alignment with Anthropic's Harness Method",
    "Architecture",
    "Installation",
    "New Research Run",
    "Resume a Run",
    "Run Artifacts",
    "Validate a Run",
    "Failure and Exhaustion Semantics",
    "Security Boundaries",
    "Testing and Benchmarking",
    "Repository Layout",
    "Limitations",
  ]);
});

test("README documents Codex-only install, run, resume, and validation", () => {
  const readme = read("README.md");
  assert.match(readme, /Codex-only/i);
  assert.match(readme, /Installation/);
  assert.match(readme, /New Research Run/);
  assert.match(readme, /Resume a Run/);
  assert.match(readme, /Validate a Run/);
  assert.match(readme, /No Python orchestrator/i);
});

test("README maps supported use cases to terminal output artifacts", () => {
  const readme = read("README.md");
  assert.match(readme, /^### Supported Use Cases and Expected Outputs$/m);
  assert.match(readme, /multi-source decision comparison[^\n]*`final_report\.md`/i);
  assert.match(readme, /evidence-backed deep dive[^\n]*`final_report\.md`/i);
  assert.match(readme, /interrupted run[^\n]*(?:same|resumed)[^\n]*`final_report\.md`/i);
  assert.match(readme, /quality threshold[^\n]*`best_report\.md`/i);
  assert.match(readme, /role failure or `REJECT`[^\n]*no report/i);
  assert.match(readme, /quick (?:factual )?lookup[^\n]*not supported/i);
});

test("README separates enforced options, advisory guidance, and fixed runtime policy", () => {
  const readme = read("README.md");
  assert.match(readme, /^### Configuration Options$/m);
  assert.match(readme, /no separate configuration file/i);
  assert.match(readme, /deterministically enforced/i);
  for (const option of ["CODEX_HOME", "absolute run root", "passThreshold", "maxWords", "artifactPlan", "citationStyle"]) {
    assert.match(readme, new RegExp(option, "i"), option);
  }
  assert.match(readme, /advisory agent guidance/i);
  for (const option of ["audience", "depth", "sections", "language", "requireSources", "excludeSources"]) {
    assert.match(readme, new RegExp(option, "i"), option);
  }
  assert.match(readme, /fixed runtime policy/i);
  for (const value of ["5 rounds", "3 active", "2 attempts", "10 minutes", "0.15"]) {
    assert.match(readme, new RegExp(value, "i"), value);
  }
});

test("README gives concrete start, resume, and external-root workflows", () => {
  const readme = read("README.md");
  assert.match(readme, /^### Example Workflows$/m);
  assert.match(readme, /^#### Start a new run$/m);
  assert.match(readme, /Use deep-research-harness to research/);
  assert.match(readme, /^#### Resume an interrupted run$/m);
  assert.match(readme, /Resume deep-research-harness run/);
  assert.match(readme, /^#### Use an explicit external run root$/m);
  assert.match(readme, /absolute run path/i);
});

test("docs no longer reference the removed mixed generator prompt", () => {
  for (const file of ["README.md", "SKILL.md", "references/workflow.md"]) {
    assert.doesNotMatch(read(file), /prompts\/generator\.md/, file);
  }
});

test("Skill and workflow publish the exact runtime limits", () => {
  for (const file of ["SKILL.md", "references/workflow.md"]) {
    const document = read(file);
    assert.match(document, /max_rounds[^\n]*5/, `${file}: max rounds`);
    assert.match(document, /pass_threshold[^\n]*3\.8/, `${file}: pass threshold`);
    assert.match(document, /maximum of three active child agents/i, `${file}: concurrency`);
    assert.match(document, /(?:at most two attempts|attempt two failure)/i, `${file}: retries`);
    assert.match(document, /last two score improvements[\s\S]{0,80}0\.15/i, `${file}: plateau`);
    assert.match(document, /context\/evidence_\{dimension_id\}\.json/, `${file}: evidence path`);
    for (const status of ["completed", "exhausted", "failed"]) {
      assert.match(document, new RegExp(`\\b${status}\\b`), `${file}: ${status}`);
    }
  }
});

test("security and spec references describe only enforced contracts", () => {
  const readme = read("README.md");
  assert.doesNotMatch(readme, /root rejects undeclared writes/i);
  assert.match(readme, /observed write-boundary violation/i);

  const specReference = read("references/spec-schema.md");
  assert.doesNotMatch(
    specReference,
    /At least one artifact must support a `must-have` dimension or executive summary/,
  );
  assert.doesNotMatch(specReference, /defaults to `"en"`/);
  assert.match(
    specReference,
    /`language` is optional and must be at\s+least two characters/,
  );
});

test("spec reference classifies deterministic, advisory, and fixed policy semantics", () => {
  const reference = read("references/spec-schema.md");
  assert.match(reference, /^## Deterministically Enforced Fields$/m);
  assert.match(reference, /^## Advisory Agent Guidance$/m);
  assert.match(reference, /^## Fixed Runtime Policy$/m);
  assert.match(reference, /`citationStyle`[^\n]*`inline` only/i);
  assert.match(reference, /`sections`[^\n]*thematic guidance[^\n]*not literal headings/i);
  for (const field of ["audience", "depth", "language", "requireSources", "excludeSources", "citationCoverage", "artifactCompleteness", "preserveWhatsGoodOnRevision"]) {
    assert.match(
      reference,
      new RegExp("`" + field + "`[\\s\\S]{0,180}advisory", "i"),
      field,
    );
  }
  assert.match(reference, /fixed runtime policy[^\n]*(?:not|is not)[^\n]*caller configuration/i);
});
