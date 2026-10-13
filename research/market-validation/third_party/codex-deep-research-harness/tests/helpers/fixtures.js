function validSpec() {
  return {
    version: "2.0",
    topic: "How should a Codex research harness be designed?",
    dimensions: [
      {
        id: "dim_001",
        question: "Which architecture keeps generation and evaluation isolated?",
        priority: "must-have",
        subquestions: [
          "Which roles require fresh agent contexts?",
          "How should agents exchange state?",
        ],
        search_keywords: [
          "agent evaluator isolation primary source",
          "file handoff long running agents",
          "Codex multi agent collaboration tools",
        ],
      },
      {
        id: "dim_002",
        question: "Which validation gates make the workflow resumable?",
        priority: "should-have",
        subquestions: [
          "Which artifacts require deterministic validation?",
          "How should interrupted work be reconciled?",
        ],
        search_keywords: [
          "JSON schema workflow state validation",
          "resumable agent artifact state machine",
          "idempotent workflow recovery design",
        ],
      },
    ],
    audience: {
      level: "expert",
      context: "Engineers maintaining a Codex Skill-based research workflow",
    },
    depth: "full",
    outputFormat: {
      sections: ["Executive Summary", "Architecture", "Recommendation"],
      maxWords: 3000,
      citationStyle: "inline",
    },
    successCriteria: {
      passThreshold: 3.8,
      mustAddressPriorities: ["must-have", "should-have"],
      citationCoverage: "all-material-claims",
      artifactCompleteness: "all-required-artifacts-substantive",
      preserveWhatsGoodOnRevision: true,
    },
    artifactPlan: [
      {
        id: "artifact_01",
        type: "comparison_matrix",
        purpose: "Compare architecture choices against the required failure modes",
        placement: "dimension_section",
        sourceDimensions: ["dim_001", "dim_002"],
      },
    ],
    constraints: {
      excludeSources: [],
      requireSources: ["https://www.anthropic.com/engineering/harness-design-long-running-apps"],
      language: "en",
    },
  };
}

function validEval() {
  const weights = {
    source_quality: 0.2,
    analytical_depth: 0.2,
    structural_coherence: 0.15,
    completeness: 0.15,
    actionability: 0.15,
    original_insight: 0.1,
    clarity: 0.05,
  };
  const criteria = Object.fromEntries(
    Object.entries(weights).map(([name, weight]) => [
      name,
      {
        score: 3,
        weight,
        weighted: 3 * weight,
        reasoning: `Concrete reasoning for ${name}`,
      },
    ]),
  );
  return {
    version: "2.0",
    draft_id: "draft_v1",
    iteration: 1,
    timestamp: "2026-07-09T12:00:00.000Z",
    overall_score: 3,
    pass: false,
    pass_threshold: 3.8,
    criteria,
    gates: {
      schema_validity: { status: "pass", evidence: "Required structure is present." },
      dimension_coverage: { status: "pass", evidence: "Both dimensions are substantive." },
      citation_coverage: { status: "fail", evidence: "Two material claims are unsupported." },
      artifact_completeness: { status: "pass", evidence: "The comparison matrix is complete." },
      feedback_compliance: { status: "not_applicable", evidence: "Initial draft." },
    },
    calibration: {
      raw_average: 3,
      defect_count: 5,
      weakest_criterion: "source_quality",
      weakest_score: 3,
      score_spread: 0,
      criteria_at_or_below_2: 0,
      high_score_defenses: [],
      score_cap_applied: false,
      score_cap_value: null,
      score_cap_reason: "Raw score is below the default cap.",
    },
    defects: Array.from({ length: 5 }, (_, index) => ({
      id: `D${index + 1}`,
      severity: index === 0 ? "high" : "medium",
      criterion: "citation_coverage",
      draft_section: "## Executive Summary",
      description: `Specific unsupported material claim number ${index + 1}`,
    })),
    weak_dimensions: ["dim_001"],
    citation_audit: [
      {
        source_id: "dim_001-src-001",
        claim_location: "## Executive Summary paragraph 1",
        status: "supported",
        notes: "The source directly supports the architecture claim.",
      },
    ],
    verdict: "REVISE",
    summary: "The structure is usable, but citation coverage is not yet sufficient.",
  };
}

function validEvidence(spec = validSpec(), dimensionId = "dim_001") {
  const dimension = spec.dimensions.find((item) => item.id === dimensionId);
  return {
    version: "1.0",
    task_id: "codex-harness-20260709-1200",
    round: 1,
    dimension_id: dimensionId,
    status: "complete",
    sources: [
      {
        id: `${dimensionId}-src-001`,
        url: "https://www.anthropic.com/engineering/harness-design-long-running-apps",
        title: "Harness design for long-running application development",
        publisher: "Anthropic",
        author: "Prithvi Rajasekaran",
        published_at: "2026-03-24",
        accessed_at: "2026-07-09T12:00:00.000Z",
        source_type: "primary",
        credibility_reason: "First-party engineering account of the harness architecture being studied.",
      },
    ],
    claims: dimension.subquestions.map((subquestion, index) => ({
      id: `${dimensionId}-claim-${String(index + 1).padStart(3, "0")}`,
      subquestion,
      statement: `Evidence-backed answer for ${subquestion}`,
      source_ids: [`${dimensionId}-src-001`],
      support: "The source directly describes isolated roles and file-based handoffs.",
      locator: "Architecture and Running the harness sections",
      confidence: "high",
      limitations: [],
    })),
    contradictions: [],
    open_questions: [],
  };
}

function validMeta() {
  return {
    version: "1.0",
    task_id: "codex-harness-20260709-1200",
    topic: "How should a Codex research harness be designed?",
    run_root: "/tmp/codex-harness-20260709-1200",
    status: "running",
    phase: "researching",
    round: 1,
    max_rounds: 5,
    pass_threshold: 3.8,
    created_at: "2026-07-09T12:00:00.000Z",
    updated_at: "2026-07-09T12:05:00.000Z",
    work_items: [
      {
        id: "round-1-scout-dim_001",
        role: "scout",
        dimension_id: "dim_001",
        round: 1,
        status: "completed",
        attempt: 1,
        output_paths: ["context/evidence_dim_001.json"],
        last_error: null,
      },
      {
        id: "round-1-scout-dim_002",
        role: "scout",
        dimension_id: "dim_002",
        round: 1,
        status: "pending",
        attempt: 0,
        output_paths: ["context/evidence_dim_002.json"],
        last_error: null,
      },
    ],
    rounds: [
      {
        number: 1,
        researched_dimensions: ["dim_001", "dim_002"],
        draft_path: null,
        eval_path: null,
        feedback_path: null,
        score: null,
        verdict: "pending",
        status: "researching",
      },
    ],
    best: null,
    last_error: null,
  };
}

function validDraft() {
  const body = `# Codex Research Harness Architecture

## Executive Summary

Fresh Writer and Evaluator contexts reduce self-evaluation bias [dim_001-src-001].

## [dim_001] Which architecture keeps generation and evaluation isolated?

### Key Findings

The roles exchange validated files instead of conversation history [dim_001-src-001].

### Evidence and Analysis

<!-- artifact:artifact_01 placement:dimension_section -->

| Choice | Isolation | Recovery |
| --- | --- | --- |
| Fresh agents | Strong | File based |

### Limitations and Uncertainty

Model-specific behavior still requires live calibration.

## [dim_002] Which validation gates make the workflow resumable?

### Key Findings

Schema checks reject malformed state before the next role starts [dim_002-src-001].

### Evidence and Analysis

Run metadata records phase and work-item status [dim_002-src-001].

### Limitations and Uncertainty

Recovery behavior must also be exercised in a live Codex task.

## Uncertainty Register

| Claim | Confidence | Reason |
| --- | --- | --- |
| Three children is the right default cap | Medium | Runtime capacity may evolve |

## Sources

- [dim_001-src-001] Anthropic, Harness design for long-running application development.
- [dim_002-src-001] JSON Schema, Draft 2020-12 specification.

## Meta-Commentary for Evaluator

Initial draft; no prior feedback exists.
`;
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  return `---
task_id: codex-harness-20260709-1200
round: 1
mode: initial
word_count: ${wordCount}
generated_at: 2026-07-09T12:30:00.000Z
---

${body}`;
}

function validFeedback(evaluation = validEval()) {
  return `# Feedback: codex-harness-20260709-1200 - Round ${evaluation.iteration}

**Verdict:** ${evaluation.verdict}
**Overall Score:** ${evaluation.overall_score}/5.0

## Summary

${evaluation.summary}

## Must Fix

${evaluation.pass ? "- none" : "- [D1] [gate:citation_coverage] [section:## Executive Summary] Add support for the unsupported claim."}

## Should Improve

- [criterion:actionability] Make the recommendation order explicit.

## Preserve

- [section:## Architecture] Keep the clear role boundary explanation.

## New Research Directions

- Recheck the weakest dimension with primary sources.

## Weak Dimensions

${evaluation.weak_dimensions.length > 0 ? evaluation.weak_dimensions.map((id) => `- ${id}`).join("\n") : "- none"}
`;
}

module.exports = { validSpec, validEval, validEvidence, validMeta, validDraft, validFeedback };
