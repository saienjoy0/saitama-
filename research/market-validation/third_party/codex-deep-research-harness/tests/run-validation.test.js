const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  completedWorkItems,
  createPassingRun,
  makeExhausted,
  makeFailed,
  passingEval,
  rewriteJson,
  writeJson,
} = require("./helpers/run-fixture");
const { validDraft, validEval, validFeedback } = require("./helpers/fixtures");
const { repoRoot, runCli } = require("./helpers/run-cli");
const {
  resolveInside,
  validateRunDirectory,
} = require("../skills/deep-research-harness/scripts/lib/run-validation");

function withRun(callback) {
  const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-run-"));
  createPassingRun(runRoot);
  try {
    callback(runRoot);
  } finally {
    fs.rmSync(runRoot, { recursive: true, force: true });
  }
}

function removeTerminalAndRoundArtifacts(runRoot) {
  fs.rmSync(path.join(runRoot, "final_report.md"), { force: true });
  fs.rmSync(path.join(runRoot, "best_report.md"), { force: true });
}

function snapshotFiles(root) {
  const snapshot = {};
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute);
      if (entry.isDirectory()) {
        walk(absolute);
      } else {
        const stat = fs.lstatSync(absolute);
        snapshot[relative] = {
          mode: stat.mode,
          mtimeMs: stat.mtimeMs,
          content: fs.readFileSync(absolute).toString("base64"),
        };
      }
    }
  }
  walk(root);
  return snapshot;
}

function makeSingleRoundNonPassing(runRoot, { status = "exhausted", verdict = "REVISE", maxRounds = 1 } = {}) {
  const evaluation = validEval();
  evaluation.verdict = verdict;
  evaluation.citation_audit.push({
    source_id: "dim_002-src-001",
    claim_location: "dim_002 Key Findings",
    status: "supported",
    notes: "The specification directly supports the schema-validation claim.",
  });
  writeJson(path.join(runRoot, "evals/eval_v1.json"), evaluation);
  fs.writeFileSync(path.join(runRoot, "feedback/feedback_v1.md"), validFeedback(evaluation));
  rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
    meta.status = status;
    meta.phase = "finalized";
    meta.max_rounds = maxRounds;
    Object.assign(meta.rounds[0], {
      score: evaluation.overall_score,
      verdict,
      status: "completed",
    });
    meta.best = {
      round: 1,
      draft_path: "drafts/draft_v1.md",
      eval_path: "evals/eval_v1.json",
      score: evaluation.overall_score,
      passed: false,
    };
  });
  fs.rmSync(path.join(runRoot, "final_report.md"), { force: true });
  if (status === "exhausted") {
    fs.copyFileSync(path.join(runRoot, "drafts/draft_v1.md"), path.join(runRoot, "best_report.md"));
  } else {
    fs.rmSync(path.join(runRoot, "best_report.md"), { force: true });
  }
}

function writeRevisionRound(runRoot, number) {
  const draft = validDraft()
    .replace("round: 1", `round: ${number}`)
    .replace("mode: initial", "mode: revision");
  const evaluation = validEval();
  evaluation.draft_id = `draft_v${number}`;
  evaluation.iteration = number;
  evaluation.gates.feedback_compliance = {
    status: "pass",
    evidence: "The revision preserves validated strengths and addresses the prior blocking feedback.",
  };
  evaluation.citation_audit.push({
    source_id: "dim_002-src-001",
    claim_location: "dim_002 Key Findings",
    status: "supported",
    notes: "The specification directly supports the schema-validation claim.",
  });
  fs.writeFileSync(path.join(runRoot, `drafts/draft_v${number}.md`), draft);
  writeJson(path.join(runRoot, `evals/eval_v${number}.json`), evaluation);
  fs.writeFileSync(path.join(runRoot, `feedback/feedback_v${number}.md`), validFeedback(evaluation));
  return { draft, evaluation };
}

function makePlateauExhausted(runRoot) {
  makeSingleRoundNonPassing(runRoot, { maxRounds: 5 });
  const second = writeRevisionRound(runRoot, 2);
  const third = writeRevisionRound(runRoot, 3);
  rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
    meta.round = 3;
    meta.rounds.push(
      {
        number: 2,
        researched_dimensions: [],
        draft_path: "drafts/draft_v2.md",
        eval_path: "evals/eval_v2.json",
        feedback_path: "feedback/feedback_v2.md",
        score: second.evaluation.overall_score,
        verdict: second.evaluation.verdict,
        status: "completed",
      },
      {
        number: 3,
        researched_dimensions: [],
        draft_path: "drafts/draft_v3.md",
        eval_path: "evals/eval_v3.json",
        feedback_path: "feedback/feedback_v3.md",
        score: third.evaluation.overall_score,
        verdict: third.evaluation.verdict,
        status: "completed",
      },
    );
    meta.work_items = completedWorkItems(meta.rounds);
    meta.best = {
      round: 3,
      draft_path: "drafts/draft_v3.md",
      eval_path: "evals/eval_v3.json",
      score: third.evaluation.overall_score,
      passed: false,
    };
  });
  fs.writeFileSync(path.join(runRoot, "best_report.md"), third.draft);
}

test("complete passing run validates", () => {
  withRun((runRoot) => {
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, `VALID run ${runRoot}\n`);
  });
});

test("terminal run requires the complete durable role ledger", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.work_items = [];
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /missing Planner work item/);
    assert.match(result.stdout, /missing Scout work item for dim_001 in round 1/);
    assert.match(result.stdout, /missing Writer work item for round 1/);
    assert.match(result.stdout, /missing Evaluator work item for round 1/);
  });
});

test("REJECT is absorbing and forbids a later passing round", () => {
  withRun((runRoot) => {
    const firstEvaluation = validEval();
    firstEvaluation.verdict = "REJECT";
    firstEvaluation.citation_audit.push({
      source_id: "dim_002-src-001",
      claim_location: "dim_002 Key Findings",
      status: "supported",
      notes: "The specification directly supports the schema-validation claim.",
    });
    writeJson(path.join(runRoot, "evals/eval_v1.json"), firstEvaluation);
    fs.writeFileSync(
      path.join(runRoot, "feedback/feedback_v1.md"),
      validFeedback(firstEvaluation),
    );

    const draftV2 = fs.readFileSync(path.join(runRoot, "drafts/draft_v1.md"), "utf8")
      .replace("round: 1", "round: 2")
      .replace("mode: initial", "mode: revision");
    fs.writeFileSync(path.join(runRoot, "drafts/draft_v2.md"), draftV2);
    const secondEvaluation = passingEval();
    secondEvaluation.draft_id = "draft_v2";
    secondEvaluation.iteration = 2;
    secondEvaluation.gates.feedback_compliance = {
      status: "pass",
      evidence: "The revision preserves every validated strength from round one.",
    };
    writeJson(path.join(runRoot, "evals/eval_v2.json"), secondEvaluation);
    fs.writeFileSync(
      path.join(runRoot, "feedback/feedback_v2.md"),
      validFeedback(secondEvaluation),
    );
    fs.writeFileSync(path.join(runRoot, "final_report.md"), draftV2);

    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.round = 2;
      Object.assign(meta.rounds[0], {
        score: firstEvaluation.overall_score,
        verdict: "REJECT",
      });
      meta.rounds.push({
        number: 2,
        researched_dimensions: [],
        draft_path: "drafts/draft_v2.md",
        eval_path: "evals/eval_v2.json",
        feedback_path: "feedback/feedback_v2.md",
        score: secondEvaluation.overall_score,
        verdict: "PASS",
        status: "completed",
      });
      meta.best = {
        round: 2,
        draft_path: "drafts/draft_v2.md",
        eval_path: "evals/eval_v2.json",
        score: secondEvaluation.overall_score,
        passed: true,
      };
      meta.work_items = [
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
        ...["dim_001", "dim_002"].map((dimensionId) => ({
          id: `round-1-scout-${dimensionId}`,
          role: "scout",
          dimension_id: dimensionId,
          round: 1,
          status: "completed",
          attempt: 1,
          output_paths: [`context/evidence_${dimensionId}.json`],
          last_error: null,
        })),
        ...[1, 2].flatMap((round) => [
          {
            id: `round-${round}-writer`,
            role: "writer",
            dimension_id: null,
            round,
            status: "completed",
            attempt: 1,
            output_paths: [`drafts/draft_v${round}.md`],
            last_error: null,
          },
          {
            id: `round-${round}-evaluator`,
            role: "evaluator",
            dimension_id: null,
            round,
            status: "completed",
            attempt: 1,
            output_paths: [
              `evals/eval_v${round}.json`,
              `feedback/feedback_v${round}.md`,
            ],
            last_error: null,
          },
        ]),
      ];
    });

    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /REJECT at round 1 must terminate the run as failed/);
    assert.match(result.stdout, /round 2 occurs after REJECT at round 1/);
  });
});

test("completed run fails when final report differs from best draft", () => {
  withRun((runRoot) => {
    fs.appendFileSync(path.join(runRoot, "final_report.md"), "\nUnvalidated change.\n");
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /final_report\.md must equal the best draft/);
  });
});

test("run rejects best metadata that does not match evaluated rounds", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => { meta.best.score = 4.8; });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /meta\.best does not match the highest valid evaluation/);
  });
});

test("best metadata comparison is independent of JSON property order", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      const best = meta.best;
      meta.best = {
        passed: best.passed,
        score: best.score,
        eval_path: best.eval_path,
        draft_path: best.draft_path,
        round: best.round,
      };
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("completed work item output paths cannot escape the run root", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.work_items = [{
        id: "unsafe-output",
        role: "writer",
        dimension_id: null,
        round: 1,
        status: "completed",
        attempt: 1,
        output_paths: ["../outside.md"],
        last_error: null,
      }];
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /escapes run root/);
  });
});

test("meta run_root must be the exact absolute directory being validated", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.run_root = path.relative(repoRoot, runRoot);
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /meta\.run_root must be absolute/);
  });
});

test("a lower-scoring PASS outranks a higher-scoring non-PASS in a completed run", () => {
  withRun((runRoot) => {
    const draftV1 = fs.readFileSync(path.join(runRoot, "drafts/draft_v1.md"), "utf8");
    const draftV2 = draftV1
      .replace("round: 1", "round: 2")
      .replace("mode: initial", "mode: revision")
      .replace("draft_v1", "draft_v2");
    fs.writeFileSync(path.join(runRoot, "drafts/draft_v2.md"), draftV2);

    const evaluation = passingEval();
    evaluation.draft_id = "draft_v2";
    evaluation.iteration = 2;
    for (const criterion of Object.values(evaluation.criteria)) {
      criterion.score = 4;
      criterion.weighted = Math.round(criterion.weight * 4 * 100) / 100;
    }
    evaluation.overall_score = 4;
    evaluation.pass = false;
    evaluation.verdict = "REVISE";
    evaluation.gates.feedback_compliance = {
      status: "fail",
      evidence: "The revision did not preserve one validated prior strength.",
    };
    evaluation.calibration.raw_average = 4;
    evaluation.calibration.weakest_criterion = "source_quality";
    evaluation.calibration.weakest_score = 4;
    evaluation.calibration.score_spread = 0;
    evaluation.calibration.high_score_defenses = Object.keys(evaluation.criteria)
      .map((criterion) => ({ criterion, defense: `${criterion} remains supported by concrete report evidence.` }));
    evaluation.defects = [{
      id: "D1",
      severity: "medium",
      criterion: "feedback_compliance",
      draft_section: "## Executive Summary",
      description: "The revision did not preserve one validated prior strength.",
    }];
    evaluation.calibration.defect_count = 1;
    evaluation.summary = "The revision scores well but fails the required feedback-compliance gate.";
    writeJson(path.join(runRoot, "evals/eval_v2.json"), evaluation);
    const feedback = validFeedback(evaluation).replace("[gate:citation_coverage]", "[gate:feedback_compliance]");
    fs.writeFileSync(path.join(runRoot, "feedback/feedback_v2.md"), feedback);

    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.round = 2;
      meta.rounds.push({
        number: 2,
        researched_dimensions: [],
        draft_path: "drafts/draft_v2.md",
        eval_path: "evals/eval_v2.json",
        feedback_path: "feedback/feedback_v2.md",
        score: 4,
        verdict: "REVISE",
        status: "completed",
      });
      meta.work_items = completedWorkItems(meta.rounds);
    });

    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("run mode accepts exactly one run-directory argument", () => {
  withRun((runRoot) => {
    const result = runCli(["run", runRoot, "unexpected"]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Usage:/);
    assert.match(result.stderr, /run <run-directory>/);
    assert.doesNotMatch(result.stderr, /at .*scripts\/validate\.js/);
  });
});

test("run mode reports missing directories without a stack trace", () => {
  const runRoot = path.join(os.tmpdir(), `missing-harness-run-${process.pid}-${Date.now()}`);
  const result = runCli(["run", runRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, new RegExp(`^INVALID run ${runRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
  assert.match(result.stdout, /run directory:/);
  assert.equal(result.stderr, "");
  assert.doesNotMatch(result.stdout, /\n\s*at /);
});

test("run mode reports malformed meta JSON without a stack trace", () => {
  withRun((runRoot) => {
    fs.writeFileSync(path.join(runRoot, "meta.json"), "{\n");
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^INVALID run /);
    assert.match(result.stdout, /meta: JSON parse error:/);
    assert.equal(result.stderr, "");
    assert.doesNotMatch(result.stdout, /\n\s*at /);
  });
});

test("whole-run validation is byte-for-byte read-only", () => {
  withRun((runRoot) => {
    const before = snapshotFiles(runRoot);
    const result = runCli(["run", runRoot]);
    const after = snapshotFiles(runRoot);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(after, before);
  });
});

test("run validates spec semantics, not only its JSON Schema", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "spec.json"), (spec) => {
      spec.artifactPlan[0].sourceDimensions = ["dim_999"];
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /artifact_01 references unknown dimension dim_999/);
  });
});

test("run validates every canonical evidence artifact semantically", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "context/evidence_dim_002.json"), (evidence) => {
      evidence.claims[0].subquestion = "A valid-length but unassigned research question";
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /subquestion does not match an assigned subquestion/);
  });
});

test("an invalid evidence context cannot produce a best draft", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "context/evidence_dim_001.json"), (evidence) => {
      evidence.status = "partial";
      evidence.open_questions = [];
    });
    const result = validateRunDirectory(runRoot);
    assert.equal(result.valid, false);
    assert.equal(result.bestDraft, null);
  });
});

test("run binds draft frontmatter to meta and its round record", () => {
  withRun((runRoot) => {
    const draftPath = path.join(runRoot, "drafts/draft_v1.md");
    const draft = fs.readFileSync(draftPath, "utf8").replace("round: 1", "round: 2");
    fs.writeFileSync(draftPath, draft);
    fs.writeFileSync(path.join(runRoot, "final_report.md"), draft);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /draft frontmatter round must equal 1/);
  });
});

test("run binds evaluation identity and threshold to meta and draft", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "evals/eval_v1.json"), (evaluation) => {
      evaluation.draft_id = "draft_v9";
      evaluation.pass_threshold = 4.2;
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /eval draft_id does not match draft path/);
    assert.match(result.stdout, /eval pass_threshold does not match meta\.pass_threshold/);
  });
});

test("run binds round score and verdict to its evaluation", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.rounds[0].score = 4.8;
      meta.rounds[0].verdict = "REVISE";
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /round 1 metadata does not match evaluation/);
  });
});

test("run validates feedback against the same round evaluation", () => {
  withRun((runRoot) => {
    const feedbackPath = path.join(runRoot, "feedback/feedback_v1.md");
    fs.writeFileSync(feedbackPath, fs.readFileSync(feedbackPath, "utf8").replace("**Verdict:** PASS", "**Verdict:** REVISE"));
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /round 1 feedback: Verdict must match eval JSON/);
  });
});

test("run rejects meta identity and threshold drift from the spec", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.topic = "A different but schema-valid research topic";
      meta.pass_threshold = 4.4;
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /meta\.topic does not match spec\.topic/);
    assert.match(result.stdout, /meta\.pass_threshold does not match spec success threshold/);
  });
});

test("run validates existing output claimed by a completed work item", () => {
  withRun((runRoot) => {
    fs.writeFileSync(path.join(runRoot, "drafts/untracked.md"), "not a valid draft\n");
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.work_items = [{
        id: "completed-writer",
        role: "writer",
        dimension_id: null,
        round: 1,
        status: "completed",
        attempt: 1,
        output_paths: ["drafts/untracked.md"],
        last_error: null,
      }];
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /work item completed-writer output.*missing frontmatter field task_id/i);
  });
});

test("pending work-item paths are checked for escape even when output is absent", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.work_items = [{
        id: "pending-writer",
        role: "writer",
        dimension_id: null,
        round: 1,
        status: "pending",
        attempt: 1,
        output_paths: ["../../future.md"],
        last_error: "A prior attempt did not produce a draft.",
      }];
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /escapes run root/);
  });
});

test("a planning checkpoint without spec output is a valid incomplete run", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "planning";
      meta.round = 0;
      meta.rounds = [];
      meta.best = null;
      meta.work_items = [{
        id: "planner",
        role: "planner",
        dimension_id: null,
        round: 0,
        status: "running",
        attempt: 1,
        output_paths: ["spec.json"],
        last_error: null,
      }];
    });
    fs.rmSync(path.join(runRoot, "spec.json"));
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("a planning checkpoint may reconcile a valid spec from a running Planner", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "planning";
      meta.round = 0;
      meta.rounds = [];
      meta.best = null;
      meta.work_items = [{
        id: "planner",
        role: "planner",
        dimension_id: null,
        round: 0,
        status: "running",
        attempt: 1,
        output_paths: ["spec.json"],
        last_error: null,
      }];
    });
    for (const relativePath of [
      "context/evidence_dim_001.json",
      "context/evidence_dim_002.json",
      "drafts/draft_v1.md",
      "evals/eval_v1.json",
      "feedback/feedback_v1.md",
    ]) {
      fs.rmSync(path.join(runRoot, relativePath), { force: true });
    }
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("a planning checkpoint without spec requires one pending or running Planner", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "planning";
      meta.round = 0;
      meta.rounds = [];
      meta.best = null;
      meta.work_items = [];
    });
    fs.rmSync(path.join(runRoot, "spec.json"));
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /spec\.json is missing without a planning checkpoint or terminal Planner failure/);
  });
});

test("a researching checkpoint may have only a subset of canonical evidence", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "researching";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "researching",
      });
      meta.work_items = completedWorkItems(meta.rounds)
        .filter((item) => ["planner", "scout"].includes(item.role))
        .map((item) => item.id === "round-1-scout-dim_002"
          ? {
            ...item,
            status: "running",
            output_paths: ["context/.staging/round-1-scout-dim_002.json"],
          }
          : item);
    });
    fs.rmSync(path.join(runRoot, "context/evidence_dim_002.json"));
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("a researching checkpoint still requires its context directory", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "researching";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "researching",
      });
    });
    fs.rmSync(path.join(runRoot, "context"), { recursive: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /context:/);
    assert.equal(result.stderr, "");
  });
});

test("writing and evaluating checkpoints allow their assigned output to be incomplete", async (t) => {
  await t.test("writing before a draft exists", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "writing";
        meta.best = null;
        meta.work_items = [
          ...completedWorkItems(meta.rounds)
            .filter((item) => ["planner", "scout"].includes(item.role)),
          {
          id: "round-1-writer",
          role: "writer",
          dimension_id: null,
          round: 1,
          status: "running",
          attempt: 2,
          output_paths: ["drafts/draft_v1.md"],
          last_error: null,
          },
        ];
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "writing",
        });
      });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"));
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("writing after a validated draft is durably recorded", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "writing";
        meta.best = null;
        meta.work_items = completedWorkItems(meta.rounds)
          .filter((item) => item.role !== "evaluator");
        Object.assign(meta.rounds[0], {
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "writing",
        });
      });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("evaluating before the pending Evaluator starts", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "evaluating";
        meta.best = null;
        const evaluator = meta.work_items.find((item) => item.role === "evaluator");
        evaluator.status = "pending";
        evaluator.attempt = 0;
        Object.assign(meta.rounds[0], {
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "evaluating",
        });
      });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("evaluating after a valid draft exists", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "evaluating";
        meta.best = null;
        meta.work_items = [
          ...completedWorkItems(meta.rounds)
            .filter((item) => item.role !== "evaluator"),
          {
          id: "round-1-evaluator",
          role: "evaluator",
          dimension_id: null,
          round: 1,
          status: "running",
          attempt: 1,
          output_paths: ["evals/eval_v1.json", "feedback/feedback_v1.md"],
          last_error: null,
          },
        ];
        Object.assign(meta.rounds[0], {
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "evaluating",
        });
      });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });
});

test("round artifact paths preserve draft then eval then feedback dependency order", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "evaluating";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        eval_path: null,
        score: null,
        verdict: "pending",
        status: "evaluating",
      });
    });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /feedback_path requires eval_path/);
  });
});

test("round records use canonical round-numbered artifact paths", () => {
  withRun((runRoot) => {
    fs.renameSync(path.join(runRoot, "drafts/draft_v1.md"), path.join(runRoot, "drafts/custom.md"));
    fs.renameSync(path.join(runRoot, "evals/eval_v1.json"), path.join(runRoot, "evals/custom.json"));
    fs.renameSync(path.join(runRoot, "feedback/feedback_v1.md"), path.join(runRoot, "feedback/custom.md"));
    rewriteJson(path.join(runRoot, "evals/custom.json"), (evaluation) => {
      evaluation.draft_id = "custom";
    });
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.rounds[0].draft_path = "drafts/custom.md";
      meta.rounds[0].eval_path = "evals/custom.json";
      meta.rounds[0].feedback_path = "feedback/custom.md";
      meta.best.draft_path = "drafts/custom.md";
      meta.best.eval_path = "evals/custom.json";
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /round 1 draft_path must be drafts\/draft_v1\.md/);
    assert.match(result.stdout, /round 1 eval_path must be evals\/eval_v1\.json/);
    assert.match(result.stdout, /round 1 feedback_path must be feedback\/feedback_v1\.md/);
  });
});

test("resolveInside rejects symlink escapes through existing and missing descendants", async (t) => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "harness-paths-"));
  const runRoot = path.join(parent, "run");
  const outside = path.join(parent, "outside");
  fs.mkdirSync(runRoot);
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "existing.json"), "{}\n");
  fs.symlinkSync(outside, path.join(runRoot, "escape"));
  try {
    await t.test("existing target", () => {
      assert.throws(
        () => resolveInside(runRoot, "escape/existing.json"),
        /escapes run root through a symlink/,
      );
    });
    await t.test("missing leaf below nearest existing symlink ancestor", () => {
      assert.throws(
        () => resolveInside(runRoot, "escape/future/nested.json"),
        /escapes run root through a symlink/,
      );
    });
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("resolveInside returns the canonical path for an in-root symlink", () => {
  const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-canonical-path-"));
  fs.mkdirSync(path.join(runRoot, "canonical"));
  fs.symlinkSync(path.join(runRoot, "canonical"), path.join(runRoot, "alias"));
  try {
    assert.equal(
      resolveInside(runRoot, "alias/future.json"),
      path.join(runRoot, "canonical/future.json"),
    );
  } finally {
    fs.rmSync(runRoot, { recursive: true, force: true });
  }
});

test("run validation rejects an existing draft symlink that resolves outside the run", () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "harness-draft-link-"));
  const runRoot = path.join(parent, "run");
  fs.mkdirSync(runRoot);
  createPassingRun(runRoot);
  const draftPath = path.join(runRoot, "drafts/draft_v1.md");
  const outsideDraft = path.join(parent, "outside-draft.md");
  fs.copyFileSync(draftPath, outsideDraft);
  fs.rmSync(draftPath);
  fs.symlinkSync(outsideDraft, draftPath);
  try {
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /drafts\/draft_v1\.md escapes run root through a symlink/);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("run validation rejects a pending output below an external symlink directory", () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "harness-pending-link-"));
  const runRoot = path.join(parent, "run");
  const outsideDrafts = path.join(parent, "outside-drafts");
  fs.mkdirSync(runRoot);
  fs.mkdirSync(outsideDrafts);
  createPassingRun(runRoot);
  rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
    meta.status = "running";
    meta.phase = "writing";
    meta.best = null;
    meta.work_items = [{
      id: "round-1-writer",
      role: "writer",
      dimension_id: null,
      round: 1,
      status: "pending",
      attempt: 0,
      output_paths: ["drafts/draft_v1.md"],
      last_error: null,
    }];
    Object.assign(meta.rounds[0], {
      draft_path: null,
      eval_path: null,
      feedback_path: null,
      score: null,
      verdict: "pending",
      status: "writing",
    });
  });
  fs.rmSync(path.join(runRoot, "drafts"), { recursive: true });
  fs.symlinkSync(outsideDrafts, path.join(runRoot, "drafts"));
  fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
  fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
  removeTerminalAndRoundArtifacts(runRoot);
  try {
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /drafts\/draft_v1\.md escapes run root through a symlink/);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("canonical run artifacts cannot be replaced by external symlinks", async (t) => {
  async function check(relativePath, prepare = () => {}) {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "harness-canonical-link-"));
    const runRoot = path.join(parent, "run");
    fs.mkdirSync(runRoot);
    createPassingRun(runRoot);
    prepare(runRoot);
    const artifactPath = path.join(runRoot, relativePath);
    const outsidePath = path.join(parent, path.basename(relativePath));
    fs.renameSync(artifactPath, outsidePath);
    fs.symlinkSync(outsidePath, artifactPath);
    try {
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /escapes run root through a symlink/);
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  }

  await t.test("meta.json", () => check("meta.json"));
  await t.test("spec.json", () => check("spec.json"));
  await t.test("context directory", () => check("context"));
  await t.test("final_report.md", () => check("final_report.md"));
  await t.test("best_report.md", () => check("best_report.md", (runRoot) => {
    makeSingleRoundNonPassing(runRoot, { maxRounds: 1 });
  }));
});

test("work items use exact role-owned output sets", async (t) => {
  await t.test("Planner owns spec.json only", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "planning";
        meta.round = 0;
        meta.rounds = [];
        meta.best = null;
        meta.work_items = [{
          id: "planner",
          role: "planner",
          dimension_id: null,
          round: 0,
          status: "running",
          attempt: 1,
          output_paths: ["spec.json", "planner-notes.md"],
          last_error: null,
        }];
      });
      fs.rmSync(path.join(runRoot, "spec.json"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Planner output_paths must be exactly \["spec\.json"\]/);
    });
  });

  await t.test("active Scout owns its unique staging path", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "researching";
        meta.best = null;
        meta.work_items = [{
          id: "round-1-scout-dim_001",
          role: "scout",
          dimension_id: "dim_001",
          round: 1,
          status: "running",
          attempt: 1,
          output_paths: ["context/evidence_dim_001.json"],
          last_error: null,
        }];
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "researching",
        });
      });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"));
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /active Scout output_paths must be exactly its staging path/);
    });
  });

  await t.test("terminal Scout owns its promoted canonical path", () => {
    withRun((runRoot) => {
      const stagingDirectory = path.join(runRoot, "context/.staging");
      fs.mkdirSync(stagingDirectory, { recursive: true });
      fs.copyFileSync(
        path.join(runRoot, "context/evidence_dim_001.json"),
        path.join(stagingDirectory, "round-1-scout-dim_001.json"),
      );
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "researching";
        meta.best = null;
        meta.work_items = [{
          id: "round-1-scout-dim_001",
          role: "scout",
          dimension_id: "dim_001",
          round: 1,
          status: "completed",
          attempt: 1,
          output_paths: ["context/.staging/round-1-scout-dim_001.json"],
          last_error: null,
        }];
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "researching",
        });
      });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"));
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /terminal Scout output_paths must be exactly its canonical evidence path/);
    });
  });

  await t.test("Writer owns only its assigned round draft", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "writing";
        meta.best = null;
        meta.work_items = [{
          id: "round-1-writer",
          role: "writer",
          dimension_id: null,
          round: 1,
          status: "running",
          attempt: 1,
          output_paths: ["drafts/draft_v1.md", "drafts/notes.md"],
          last_error: null,
        }];
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "writing",
        });
      });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"));
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Writer output_paths must be exactly \["drafts\/draft_v1\.md"\]/);
    });
  });

  await t.test("Evaluator owns exactly the round eval and feedback pair", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "evaluating";
        meta.best = null;
        meta.work_items = [{
          id: "round-1-evaluator",
          role: "evaluator",
          dimension_id: null,
          round: 1,
          status: "running",
          attempt: 1,
          output_paths: ["evals/eval_v1.json", "feedback/feedback_v1.md", "feedback/private.md"],
          last_error: null,
        }];
        Object.assign(meta.rounds[0], {
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "evaluating",
        });
      });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Evaluator output_paths must be exactly the round eval and feedback pair/);
    });
  });
});

test("work-item identity binds role, dimension, round, and selected research", async (t) => {
  await t.test("role-specific id and dimension", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.work_items = [{
          id: "writer-alias",
          role: "writer",
          dimension_id: "dim_001",
          round: 1,
          status: "completed",
          attempt: 1,
          output_paths: ["drafts/draft_v1.md"],
          last_error: null,
        }];
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Writer id must be round-1-writer/);
      assert.match(result.stdout, /Writer dimension_id must be null/);
    });
  });

  await t.test("work round exists and does not exceed meta.round", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.work_items = [{
          id: "round-2-writer",
          role: "writer",
          dimension_id: null,
          round: 2,
          status: "pending",
          attempt: 0,
          output_paths: ["drafts/draft_v2.md"],
          last_error: null,
        }];
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /work item round-2-writer round 2 exceeds meta\.round 1/);
      assert.match(result.stdout, /has no matching round record/);
    });
  });

  await t.test("Scout dimension is known and selected for its round", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.rounds[0].researched_dimensions = ["dim_002"];
        meta.work_items = [{
          id: "round-1-scout-dim_001",
          role: "scout",
          dimension_id: "dim_001",
          round: 1,
          status: "completed",
          attempt: 1,
          output_paths: ["context/evidence_dim_001.json"],
          last_error: null,
        }];
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Scout dimension dim_001 is not selected in round 1/);
    });
  });
});

test("work-item attempts agree with lifecycle status", async (t) => {
  const cases = [
    ["pending attempt two", "pending", 2, /pending work item.*attempt must be 0 or 1/],
    ["running attempt zero", "running", 0, /running work item.*attempt must be 1 or 2/],
    ["completed attempt zero", "completed", 0, /completed work item.*attempt must be 1 or 2/],
    ["failed before retry", "failed", 1, /failed work item.*attempt must be 2/],
  ];
  for (const [name, status, attempt, expected] of cases) {
    await t.test(name, () => {
      withRun((runRoot) => {
        rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
          meta.work_items = [{
            id: "round-1-writer",
            role: "writer",
            dimension_id: null,
            round: 1,
            status,
            attempt,
            output_paths: ["drafts/draft_v1.md"],
            last_error: status === "failed" || status === "pending" ? "attempt failed" : null,
          }];
        });
        const result = runCli(["run", runRoot]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, expected);
      });
    });
  }
});

test("historical Scout items accept a later append-only canonical evidence revision", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "context/evidence_dim_001.json"), (evidence) => {
      evidence.round = 2;
    });
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "researching";
      meta.round = 2;
      meta.rounds.push({
        number: 2,
        researched_dimensions: ["dim_001"],
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "researching",
      });
      meta.work_items = [
        ...completedWorkItems([meta.rounds[0]])
          .map((item) => item.id === "round-1-scout-dim_001"
            ? { ...item, status: "partial" }
            : item),
        {
          id: "round-2-scout-dim_001",
          role: "scout",
          dimension_id: "dim_001",
          round: 2,
          status: "completed",
          attempt: 1,
          output_paths: ["context/evidence_dim_001.json"],
          last_error: null,
        },
      ];
    });
    fs.rmSync(path.join(runRoot, "final_report.md"));
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("latest terminal Scout binds canonical evidence round and status", async (t) => {
  async function withSecondRound(mutator, expected) {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "researching";
        meta.round = 2;
        meta.work_items = [{
          id: "round-2-scout-dim_001",
          role: "scout",
          dimension_id: "dim_001",
          round: 2,
          status: "completed",
          attempt: 1,
          output_paths: ["context/evidence_dim_001.json"],
          last_error: null,
        }];
        meta.rounds.push({
          number: 2,
          researched_dimensions: ["dim_001"],
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "researching",
        });
      });
      rewriteJson(path.join(runRoot, "context/evidence_dim_001.json"), mutator);
      fs.rmSync(path.join(runRoot, "final_report.md"));
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, expected);
    });
  }
  await t.test("round", () => withSecondRound(
    () => {},
    /latest terminal Scout round 2 requires canonical evidence round 2/,
  ));
  await t.test("status", () => withSecondRound(
    (evidence) => { evidence.round = 2; evidence.status = "partial"; evidence.open_questions = ["One scoped question remains unanswered."]; },
    /latest terminal Scout completed status requires complete evidence/,
  ));
});

test("terminal lifecycle preconditions are enforced", async (t) => {
  await t.test("running cannot be finalized", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => { meta.status = "running"; });
      fs.rmSync(path.join(runRoot, "final_report.md"));
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /running run must not have phase finalized/);
    });
  });

  await t.test("running cannot retain an attempt-two failure", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "running";
        meta.phase = "writing";
        meta.best = null;
        meta.work_items = [{
          id: "round-1-writer",
          role: "writer",
          dimension_id: null,
          round: 1,
          status: "failed",
          attempt: 2,
          output_paths: ["drafts/draft_v1.md"],
          last_error: "Both Writer attempts were invalid.",
        }];
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "writing",
        });
      });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"));
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /running run must not contain failed work items/);
    });
  });

  await t.test("completed has no active or failed work", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.work_items = [{
          id: "round-1-writer",
          role: "writer",
          dimension_id: null,
          round: 1,
          status: "running",
          attempt: 1,
          output_paths: ["drafts/draft_v1.md"],
          last_error: null,
        }];
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /completed run must not contain active or failed work items/);
    });
  });

  await t.test("completed latest round must be completed", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.rounds[0].status = "evaluating";
        meta.rounds[0].score = null;
        meta.rounds[0].verdict = "pending";
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /completed run requires its latest round to be completed/);
    });
  });

  await t.test("exhausted requires max rounds or a plateau", () => {
    withRun((runRoot) => {
      makeSingleRoundNonPassing(runRoot, { maxRounds: 5 });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /exhausted run requires max_rounds or two score improvements below 0\.15/);
    });
  });

  await t.test("max-round exhaustion is valid", () => {
    withRun((runRoot) => {
      makeSingleRoundNonPassing(runRoot, { maxRounds: 1 });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("plateau exhaustion is valid", () => {
    withRun((runRoot) => {
      makePlateauExhausted(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });
});

test("failed lifecycle requires a nonpassing retry failure or REJECT", async (t) => {
  await t.test("attempt-two Planner failure without spec is valid", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "failed";
        meta.phase = "finalized";
        meta.round = 0;
        meta.rounds = [];
        meta.best = null;
        meta.work_items = [{
          id: "planner",
          role: "planner",
          dimension_id: null,
          round: 0,
          status: "failed",
          attempt: 2,
          output_paths: ["spec.json"],
          last_error: "Planner output remained invalid after the retry.",
        }];
      });
      fs.rmSync(path.join(runRoot, "spec.json"));
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("pre-draft failure cannot claim a best report", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "failed";
        meta.phase = "finalized";
        meta.round = 0;
        meta.rounds = [];
        meta.best = null;
        meta.work_items = [{
          id: "planner",
          role: "planner",
          dimension_id: null,
          round: 0,
          status: "failed",
          attempt: 2,
          output_paths: ["spec.json"],
          last_error: "Planner output remained invalid after the retry.",
        }];
      });
      fs.rmSync(path.join(runRoot, "spec.json"));
      removeTerminalAndRoundArtifacts(runRoot);
      fs.writeFileSync(path.join(runRoot, "best_report.md"), "not a validated report\n");
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /failed run must not contain best_report\.md/);
    });
  });

  await t.test("attempt-two Scout failure preserves the researching checkpoint", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "failed";
        meta.phase = "finalized";
        meta.best = null;
        meta.work_items = completedWorkItems(meta.rounds)
          .filter((item) => ["planner", "scout"].includes(item.role));
        const failedScout = meta.work_items.find((item) => item.id === "round-1-scout-dim_001");
        failedScout.status = "failed";
        failedScout.attempt = 2;
        failedScout.output_paths = ["context/.staging/round-1-scout-dim_001.json"];
        failedScout.last_error = "Scout evidence remained invalid after attempt two.";
        const pendingScout = meta.work_items.find((item) => item.id === "round-1-scout-dim_002");
        pendingScout.status = "pending";
        pendingScout.attempt = 0;
        pendingScout.output_paths = ["context/.staging/round-1-scout-dim_002.json"];
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "researching",
        });
      });
      fs.rmSync(path.join(runRoot, "context/evidence_dim_001.json"), { force: true });
      fs.rmSync(path.join(runRoot, "context/evidence_dim_002.json"), { force: true });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"), { force: true });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("attempt-two Writer failure preserves the writing checkpoint", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "failed";
        meta.phase = "finalized";
        meta.best = null;
        meta.work_items = completedWorkItems(meta.rounds)
          .filter((item) => item.role !== "evaluator");
        const writer = meta.work_items.find((item) => item.role === "writer");
        writer.status = "failed";
        writer.attempt = 2;
        writer.last_error = "Writer draft remained invalid after attempt two.";
        Object.assign(meta.rounds[0], {
          draft_path: null,
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "writing",
        });
      });
      fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"), { force: true });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("attempt-two Evaluator failure preserves the evaluating checkpoint", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.status = "failed";
        meta.phase = "finalized";
        meta.best = null;
        const evaluator = meta.work_items.find((item) => item.role === "evaluator");
        evaluator.status = "failed";
        evaluator.attempt = 2;
        evaluator.last_error = "Evaluator artifacts remained invalid after attempt two.";
        Object.assign(meta.rounds[0], {
          eval_path: null,
          feedback_path: null,
          score: null,
          verdict: "pending",
          status: "evaluating",
        });
      });
      fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
      fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
      removeTerminalAndRoundArtifacts(runRoot);
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("Evaluator REJECT is valid", () => {
    withRun((runRoot) => {
      makeSingleRoundNonPassing(runRoot, { status: "failed", verdict: "REJECT", maxRounds: 5 });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  await t.test("a terminal round cannot erase completed Planner provenance", () => {
    withRun((runRoot) => {
      makeSingleRoundNonPassing(runRoot, { status: "failed", verdict: "REJECT", maxRounds: 5 });
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        const planner = meta.work_items.find((item) => item.id === "planner");
        planner.status = "pending";
        planner.attempt = 0;
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Planner work item must be completed before round 1 exists/);
    });
  });

  await t.test("passing artifacts cannot be marked failed", () => {
    withRun((runRoot) => {
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => { meta.status = "failed"; });
      fs.rmSync(path.join(runRoot, "final_report.md"));
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /failed run must remain nonpassing/);
      assert.match(result.stdout, /failed run requires an attempt-two work-item failure or a REJECT verdict/);
    });
  });

  await t.test("failed run cannot retain running work", () => {
    withRun((runRoot) => {
      makeSingleRoundNonPassing(runRoot, { status: "failed", verdict: "REJECT", maxRounds: 5 });
      rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
        meta.work_items = [{
          id: "round-1-evaluator",
          role: "evaluator",
          dimension_id: null,
          round: 1,
          status: "running",
          attempt: 1,
          output_paths: ["evals/eval_v1.json", "feedback/feedback_v1.md"],
          last_error: null,
        }];
      });
      const result = runCli(["run", runRoot]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /failed run must not contain running work items/);
    });
  });
});

test("feedback H1 task id must match meta.task_id", () => {
  withRun((runRoot) => {
    const feedbackPath = path.join(runRoot, "feedback/feedback_v1.md");
    fs.writeFileSync(
      feedbackPath,
      fs.readFileSync(feedbackPath, "utf8").replace(
        "# Feedback: codex-harness-20260709-1200 - Round 1",
        "# Feedback: another-task-20260709-1200 - Round 1",
      ),
    );
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /feedback task_id another-task-20260709-1200 does not match meta\.task_id/);
  });
});

test("a pending retry with attempt one remains a legitimate incomplete checkpoint", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "writing";
      meta.best = null;
      meta.work_items = [
        ...completedWorkItems(meta.rounds)
          .filter((item) => ["planner", "scout"].includes(item.role)),
        {
        id: "round-1-writer",
        role: "writer",
        dimension_id: null,
        round: 1,
        status: "pending",
        attempt: 1,
        output_paths: ["drafts/draft_v1.md"],
        last_error: "The first draft attempt was invalid.",
        },
      ];
      Object.assign(meta.rounds[0], {
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "writing",
      });
    });
    fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"));
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"));
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"));
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("running meta phase must match the current round checkpoint", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "researching";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "evaluating",
      });
      const evaluator = meta.work_items.find((item) => item.role === "evaluator");
      evaluator.status = "running";
      evaluator.attempt = 1;
    });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /meta.phase researching does not match current round status evaluating/);
  });
});

test("Evaluator cannot start before Writer completion records draft_path", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "evaluating";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "evaluating",
      });
      const evaluator = meta.work_items.find((item) => item.role === "evaluator");
      evaluator.status = "running";
      evaluator.attempt = 1;
    });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /evaluating round 1 requires draft_path/);
    assert.match(result.stdout, /completed Writer round-1-writer requires draft_path drafts\/draft_v1\.md/);
  });
});

test("recorded draft_path requires the round Writer to be completed", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "writing";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "writing",
      });
      const writer = meta.work_items.find((item) => item.role === "writer");
      writer.status = "running";
      writer.attempt = 1;
      meta.work_items = meta.work_items.filter((item) => item.role !== "evaluator");
    });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /round 1 draft_path requires its Writer work item to be completed/);
  });
});

test("researching round cannot start Writer or Evaluator work", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "researching";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "researching",
      });
      const writer = meta.work_items.find((item) => item.role === "writer");
      writer.status = "running";
      writer.attempt = 1;
      const evaluator = meta.work_items.find((item) => item.role === "evaluator");
      evaluator.status = "pending";
      evaluator.attempt = 0;
    });
    fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"), { force: true });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /researching round 1 must not contain Writer or Evaluator work items/);
  });
});

test("writing round cannot start Evaluator work", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "writing";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "writing",
      });
      const writer = meta.work_items.find((item) => item.role === "writer");
      writer.status = "running";
      writer.attempt = 1;
      const evaluator = meta.work_items.find((item) => item.role === "evaluator");
      evaluator.status = "running";
      evaluator.attempt = 1;
    });
    fs.rmSync(path.join(runRoot, "drafts/draft_v1.md"), { force: true });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /writing round 1 must not contain an Evaluator work item/);
  });
});

test("completed Evaluator requires an atomic completed round checkpoint", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "evaluating";
      meta.best = null;
      Object.assign(meta.rounds[0], {
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "evaluating",
      });
    });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /evaluating round 1 requires its Evaluator work item to be pending or running/);
  });
});

test("a later round cannot exist before every prior round completes", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "writing";
      meta.round = 2;
      meta.best = null;
      Object.assign(meta.rounds[0], {
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "writing",
      });
      meta.rounds.push({
        number: 2,
        researched_dimensions: [],
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "writing",
      });
      meta.work_items = meta.work_items.filter((item) => item.role !== "evaluator");
      meta.work_items.push({
        id: "round-2-writer",
        role: "writer",
        dimension_id: null,
        round: 2,
        status: "pending",
        attempt: 0,
        output_paths: ["drafts/draft_v2.md"],
        last_error: null,
      });
    });
    fs.rmSync(path.join(runRoot, "evals/eval_v1.json"), { force: true });
    fs.rmSync(path.join(runRoot, "feedback/feedback_v1.md"), { force: true });
    removeTerminalAndRoundArtifacts(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /round 1 must be completed before round 2 exists/);
  });
});

test("Decide checkpoint may keep phase evaluating after the round completes", () => {
  withRun((runRoot) => {
    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.status = "running";
      meta.phase = "evaluating";
    });
    fs.rmSync(path.join(runRoot, "final_report.md"), { force: true });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("exhausted run exposes best_report but never final_report", () => {
  withRun((runRoot) => {
    makeExhausted(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(fs.existsSync(path.join(runRoot, "best_report.md")), true);
    assert.equal(fs.existsSync(path.join(runRoot, "final_report.md")), false);
  });
});

test("failed pre-draft run validates without claiming a report", () => {
  withRun((runRoot) => {
    makeFailed(runRoot);
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(fs.existsSync(path.join(runRoot, "final_report.md")), false);
    assert.equal(fs.existsSync(path.join(runRoot, "best_report.md")), false);
  });
});

test("partial evidence requires open questions in a complete run", () => {
  withRun((runRoot) => {
    const evidencePath = path.join(runRoot, "context/evidence_dim_001.json");
    rewriteJson(evidencePath, (evidence) => {
      evidence.status = "partial";
      evidence.open_questions = [];
    });
    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /partial evidence must list at least one open question/);
  });
});

test("best draft tie breaks toward the later valid round", () => {
  withRun((runRoot) => {
    const draftV1 = fs.readFileSync(path.join(runRoot, "drafts/draft_v1.md"), "utf8");
    const draftV2 = draftV1
      .replace("round: 1", "round: 2")
      .replace("mode: initial", "mode: revision");
    fs.writeFileSync(path.join(runRoot, "drafts/draft_v2.md"), draftV2);

    const evaluation = passingEval();
    evaluation.iteration = 2;
    evaluation.draft_id = "draft_v2";
    evaluation.gates.feedback_compliance = {
      status: "pass",
      evidence: "All prior validated strengths and blocking fixes were preserved.",
    };
    writeJson(path.join(runRoot, "evals/eval_v2.json"), evaluation);
    fs.writeFileSync(path.join(runRoot, "feedback/feedback_v2.md"), validFeedback(evaluation));

    rewriteJson(path.join(runRoot, "meta.json"), (meta) => {
      meta.round = 2;
      meta.rounds.push({
        number: 2,
        researched_dimensions: [],
        draft_path: "drafts/draft_v2.md",
        eval_path: "evals/eval_v2.json",
        feedback_path: "feedback/feedback_v2.md",
        score: evaluation.overall_score,
        verdict: evaluation.verdict,
        status: "completed",
      });
      meta.best = {
        round: 2,
        draft_path: "drafts/draft_v2.md",
        eval_path: "evals/eval_v2.json",
        score: evaluation.overall_score,
        passed: true,
      };
      meta.work_items = completedWorkItems(meta.rounds);
    });
    fs.writeFileSync(path.join(runRoot, "final_report.md"), draftV2);

    const result = runCli(["run", runRoot]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(validateRunDirectory(runRoot).bestDraft.round, 2);
  });
});
