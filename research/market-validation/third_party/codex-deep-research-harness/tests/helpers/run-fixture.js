const fs = require("node:fs");
const path = require("node:path");
const {
  validSpec,
  validEval,
  validEvidence,
  validDraft,
  validFeedback,
  validMeta,
} = require("./fixtures");

function passingEval() {
  const evaluation = validEval();
  const scores = {
    source_quality: 4,
    analytical_depth: 4,
    structural_coherence: 4,
    completeness: 4,
    actionability: 4,
    original_insight: 3,
    clarity: 4,
  };
  for (const [name, score] of Object.entries(scores)) {
    evaluation.criteria[name].score = score;
    evaluation.criteria[name].weighted = Math.round(score * evaluation.criteria[name].weight * 100) / 100;
  }
  evaluation.overall_score = 3.9;
  evaluation.pass = true;
  evaluation.gates = {
    schema_validity: { status: "pass", evidence: "The report contract is complete." },
    dimension_coverage: { status: "pass", evidence: "Every required dimension is substantive." },
    citation_coverage: { status: "pass", evidence: "All audited citations support their claims." },
    artifact_completeness: { status: "pass", evidence: "The required comparison matrix is substantive." },
    feedback_compliance: { status: "not_applicable", evidence: "Initial draft." },
  };
  evaluation.calibration = {
    raw_average: 3.9,
    defect_count: 0,
    weakest_criterion: "original_insight",
    weakest_score: 3,
    score_spread: 1,
    criteria_at_or_below_2: 0,
    high_score_defenses: Object.entries(scores)
      .filter(([, score]) => score > 3)
      .map(([criterion]) => ({ criterion, defense: `${criterion} is supported by concrete report evidence.` })),
    score_cap_applied: false,
    score_cap_value: null,
    score_cap_reason: "All cap-lift conditions pass and no high defect remains.",
  };
  evaluation.defects = [];
  evaluation.weak_dimensions = [];
  evaluation.citation_audit = [
    {
      source_id: "dim_001-src-001",
      claim_location: "Executive Summary",
      status: "supported",
      notes: "The architecture source directly supports the isolation claim.",
    },
    {
      source_id: "dim_002-src-001",
      claim_location: "dim_002 Key Findings",
      status: "supported",
      notes: "The specification directly supports the schema-validation claim.",
    },
  ];
  evaluation.verdict = "PASS";
  evaluation.summary = "The report passes all blocking gates with verified citations and complete decision artifacts.";
  return evaluation;
}

function secondEvidence(spec) {
  const evidence = validEvidence(spec, "dim_002");
  evidence.sources[0] = {
    ...evidence.sources[0],
    id: "dim_002-src-001",
    url: "https://json-schema.org/draft/2020-12/json-schema-core",
    title: "JSON Schema Core",
    publisher: "JSON Schema",
    author: null,
    published_at: null,
    source_type: "official",
    credibility_reason: "The normative specification for the validation format used in this run.",
  };
  evidence.claims.forEach((claim) => { claim.source_ids = ["dim_002-src-001"]; });
  return evidence;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function rewriteJson(filePath, mutator) {
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  mutator(value);
  writeJson(filePath, value);
}

function completedWorkItems(rounds) {
  return [
    {
      id: "planner",
      role: "planner",
      dimension_id: null,
      round: 0,
      status: "completed",
      attempt: 1,
      output_paths: ["spec.json"],
      last_error: null,
    },
    ...rounds.flatMap((round) => [
      ...round.researched_dimensions.map((dimensionId) => ({
        id: `round-${round.number}-scout-${dimensionId}`,
        role: "scout",
        dimension_id: dimensionId,
        round: round.number,
        status: "completed",
        attempt: 1,
        output_paths: [`context/evidence_${dimensionId}.json`],
        last_error: null,
      })),
      {
        id: `round-${round.number}-writer`,
        role: "writer",
        dimension_id: null,
        round: round.number,
        status: "completed",
        attempt: 1,
        output_paths: [`drafts/draft_v${round.number}.md`],
        last_error: null,
      },
      {
        id: `round-${round.number}-evaluator`,
        role: "evaluator",
        dimension_id: null,
        round: round.number,
        status: "completed",
        attempt: 1,
        output_paths: [
          `evals/eval_v${round.number}.json`,
          `feedback/feedback_v${round.number}.md`,
        ],
        last_error: null,
      },
    ]),
  ];
}

function createPassingRun(runRoot) {
  for (const directory of ["context", "drafts", "evals", "feedback"]) {
    fs.mkdirSync(path.join(runRoot, directory), { recursive: true });
  }
  const spec = validSpec();
  const draft = validDraft();
  const evaluation = passingEval();
  const meta = validMeta();
  meta.run_root = runRoot;
  meta.status = "completed";
  meta.phase = "finalized";
  meta.rounds = [{
    number: 1,
    researched_dimensions: ["dim_001", "dim_002"],
    draft_path: "drafts/draft_v1.md",
    eval_path: "evals/eval_v1.json",
    feedback_path: "feedback/feedback_v1.md",
    score: 3.9,
    verdict: "PASS",
    status: "completed",
  }];
  meta.work_items = completedWorkItems(meta.rounds);
  meta.best = {
    round: 1,
    draft_path: "drafts/draft_v1.md",
    eval_path: "evals/eval_v1.json",
    score: 3.9,
    passed: true,
  };
  writeJson(path.join(runRoot, "meta.json"), meta);
  writeJson(path.join(runRoot, "spec.json"), spec);
  writeJson(path.join(runRoot, "context/evidence_dim_001.json"), validEvidence(spec));
  writeJson(path.join(runRoot, "context/evidence_dim_002.json"), secondEvidence(spec));
  fs.writeFileSync(path.join(runRoot, "drafts/draft_v1.md"), draft);
  writeJson(path.join(runRoot, "evals/eval_v1.json"), evaluation);
  fs.writeFileSync(path.join(runRoot, "feedback/feedback_v1.md"), validFeedback(evaluation));
  fs.writeFileSync(path.join(runRoot, "final_report.md"), draft);
  return { meta, spec, evaluation };
}

function makeExhausted(runRoot) {
  const evaluation = validEval();
  evaluation.citation_audit.push({
    source_id: "dim_002-src-001",
    claim_location: "dim_002 Key Findings",
    status: "supported",
    notes: "The specification directly supports the schema-validation claim.",
  });
  writeJson(path.join(runRoot, "evals/eval_v1.json"), evaluation);
  fs.writeFileSync(path.join(runRoot, "feedback/feedback_v1.md"), validFeedback(evaluation));
  rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
    meta.status = "exhausted";
    meta.phase = "finalized";
    meta.max_rounds = 1;
    meta.rounds[0].score = evaluation.overall_score;
    meta.rounds[0].verdict = evaluation.verdict;
    meta.rounds[0].status = "completed";
    meta.best = {
      round: 1,
      draft_path: "drafts/draft_v1.md",
      eval_path: "evals/eval_v1.json",
      score: evaluation.overall_score,
      passed: false,
    };
  });
  fs.rmSync(path.join(runRoot, "final_report.md"), { force: true });
  fs.copyFileSync(path.join(runRoot, "drafts/draft_v1.md"), path.join(runRoot, "best_report.md"));
}

function makeFailed(runRoot) {
  fs.rmSync(path.join(runRoot, "final_report.md"), { force: true });
  fs.rmSync(path.join(runRoot, "best_report.md"), { force: true });
  rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
    meta.status = "failed";
    meta.phase = "finalized";
    meta.round = 0;
    meta.best = null;
    meta.rounds = [];
    meta.work_items = [{
      id: "planner",
      role: "planner",
      dimension_id: null,
      round: 0,
      status: "failed",
      attempt: 2,
      output_paths: ["spec.json"],
      last_error: "Planner output remained invalid after attempt two.",
    }];
    meta.last_error = "Planner output remained invalid after attempt two.";
  });
  fs.rmSync(path.join(runRoot, "spec.json"), { force: true });
  for (const directory of ["context", "drafts", "evals", "feedback"]) {
    fs.rmSync(path.join(runRoot, directory), { recursive: true, force: true });
  }
}

module.exports = {
  completedWorkItems,
  createPassingRun,
  makeExhausted,
  makeFailed,
  passingEval,
  rewriteJson,
  writeJson,
};
