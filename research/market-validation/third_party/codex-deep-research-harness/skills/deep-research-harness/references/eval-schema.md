# Eval Schema Reference

The Evaluator must output `eval_v{N}.json` matching
[`../schemas/eval.json`](../schemas/eval.json). The role instructions are in
[`../prompts/evaluator.md`](../prompts/evaluator.md), and scoring anchors are in
[`evaluator-calibration.md`](evaluator-calibration.md). Unknown fields are
rejected. This document explains each section.

## Top-Level Fields

| Field              | Type                         | Description                                             |
| ------------------ | ---------------------------- | ------------------------------------------------------- |
| `version`          | `"2.0"`                      | Schema version                                          |
| `draft_id`         | string                       | e.g. `"draft_v1"`                                       |
| `iteration`        | integer ≥1                   | Round number                                            |
| `timestamp`        | ISO 8601                     | Evaluation time                                         |
| `overall_score`    | number 1–5                   | Weighted average after the score cap                    |
| `pass`             | boolean                      | True exactly when `verdict` is `PASS`                   |
| `pass_threshold`   | number 1–5                   | Exact `meta.pass_threshold`, matching the spec threshold |
| `criteria`         | object                       | Seven scored criteria                                   |
| `gates`            | object                       | Five gate results                                       |
| `calibration`      | object                       | Recomputable audit trail for scoring decisions          |
| `defects`          | array (zero or more)          | Every genuine defect found; no quota                     |
| `weak_dimensions`  | unique array of dimension ids | Canonical spec dimensions with research or evidence gaps |
| `citation_audit`   | array                        | Deterministic citation spot-check records                |
| `verdict`          | `PASS`, `REVISE`, or `REJECT` | Final disposition                                       |
| `summary`          | string (≥10 chars)           | One- or two-sentence assessment                         |

## Criteria (7 dimensions, 1–5 each)

| Criterion              | Weight | What it measures                          |
| ---------------------- | ------ | ----------------------------------------- |
| `source_quality`       | 0.20   | Credible, diverse, verifiable sources     |
| `analytical_depth`     | 0.20   | Mechanisms, tradeoffs, implications       |
| `structural_coherence` | 0.15   | Logical flow, narrative arc               |
| `completeness`         | 0.15   | Scope coverage including counterarguments |
| `actionability`        | 0.15   | Concrete, decision-useful outputs         |
| `original_insight`     | 0.10   | Non-obvious synthesis or framing          |
| `clarity`              | 0.05   | Readable, audience-appropriate            |

Each criterion object:

```json
{
  "score": 3,
  "weight": 0.2,
  "weighted": 0.6,
  "reasoning": "..." // ≥10 chars
}
```

Arithmetic is deterministic:

- `weighted = round2(score * weight)` for every criterion.
- `calibration.raw_average = round2(sum(score * weight))` across all seven
  criteria.
- Numeric comparisons allow only the validator's small rounding tolerance;
  changing a declared weight or weighted result is invalid.
- `weakest_score` is the minimum criterion score and `weakest_criterion` must
  name a criterion with that score.
- `score_spread = highest score - lowest score`.
- `criteria_at_or_below_2` is the count of scores at or below 2.
- `defect_count` must equal `defects.length`.
- Every criterion scored above 3 requires one entry in
  `calibration.high_score_defenses`.

## Gates (5 binary checks)

| Gate                    | What it checks                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| `schema_validity`       | Draft has required sections, frontmatter, sources, uncertainty register |
| `dimension_coverage`    | All required priority levels covered                                    |
| `citation_coverage`     | Material claims cited per spec requirement                              |
| `artifact_completeness` | All required artifacts present and substantive                          |
| `feedback_compliance`   | (Revision only) Blocking fixes addressed, `Preserve` strengths retained  |

Each gate object:

```json
{
  "status": "pass" | "fail" | "not_applicable",
  "evidence": "..."  // ≥5 chars
}
```

**Pass condition:** `overall_score >= pass_threshold`, all four base blocking
gates pass, and feedback compliance is valid for the round. On iteration 1,
`feedback_compliance` must be `not_applicable`; on later iterations it must be
`pass` to qualify. A qualifying evaluation must use `verdict=PASS`, a
non-qualifying evaluation cannot use `PASS`, and `pass` is true exactly when
the verdict is `PASS`.

New runs default to threshold `3.8`; a validated spec may set another value in
the allowed 1–5 range, which the root copies into `meta.pass_threshold` before
research begins.

## Score Cap

Default cap: **3.6**. Compute the raw average first, then set
`overall_score = round2(raw_average)` when cap eligibility is satisfied or
`overall_score = round2(min(raw_average, 3.6))` otherwise.

Cap is lifted only if ALL of:

- The four base blocking gates pass
- `source_quality >= 4`
- `analytical_depth >= 4`
- Zero unresolved high-severity defects

Record in `calibration.score_cap_applied`.

`score_cap_applied` is true exactly when the cap is not lifted and the raw
average exceeds 3.6. Record the cap explanation in `score_cap_reason`.

## Weak Dimensions

Every `weak_dimensions` entry must exactly match a dimension id in the spec.
Use this list only for research or evidence gaps. If either
`dimension_coverage` or `citation_coverage` fails, at least one weak dimension
is required. Structural, stylistic, or prose-only problems belong in defects,
not in `weak_dimensions`.

## Feedback Markdown Binding

The feedback H1 round, verdict, overall score, normalized Summary, and Weak
Dimensions must mirror the evaluation JSON. For `PASS`, `Must Fix` is exactly
`- none`. For `REVISE` or `REJECT`, it contains one or more actual blocking
bullets and never `- none`; each bullet names an existing defect, its matching
failed gate or scored criterion, and the defect's draft section. `Preserve`
contains at least one nonempty bullet.

When `weak_dimensions` is empty, `## Weak Dimensions` contains exactly
`- none`. Otherwise it contains each expected unique `- dim_NNN` bullet once
and no other content.

## Citation Audit

Draft citations use the canonical `[dim_NNN-src-NNN]` form. Every cited source
id must exist in one of the run's `evidence_dim_NNN.json` files.

Let `C` be the number of unique canonical source ids cited in the draft. The
required deterministic audit sample is:

- `0` when `C = 0`;
- all `C` sources when `C < 5`;
- `min(12, max(5, ceil(0.20 * C)))` sources otherwise.

Prioritize citations supporting the Executive Summary and decision artifacts.
Each audit entry records `source_id`, an exact `claim_location`, one of
`supported`, `partial`, `unsupported`, or `unreachable`, and substantive
`notes`. Audit entries must name sources actually cited in the draft, and the
required count is based on unique source ids. Any `unsupported` audit result
requires `citation_coverage=fail`.

## Calibration Block

Audit trail for Evaluator scoring decisions:

```json
{
  "raw_average": 2.6,
  "defect_count": 5,
  "weakest_criterion": "analytical_depth",
  "weakest_score": 2,
  "score_spread": 2,
  "criteria_at_or_below_2": 3,
  "high_score_defenses": [
    {
      "criterion": "clarity",
      "defense": "Prose stays readable even where analysis is weak."
    }
  ],
  "score_cap_applied": false,
  "score_cap_value": null,
  "score_cap_reason": "Raw score did not exceed the default cap."
}
```

## Defects

Each defect:

```json
{
  "id": "D1",
  "severity": "high" | "medium" | "low",
  "criterion": "source_quality",
  "draft_section": "## Executive Summary",
  "description": "..."  // ≥10 chars
}
```

- Record every genuine defect and do not invent defects to satisfy a quota.
  An empty array is valid for a genuinely strong report.
- `criterion` can be any of the 7 criteria or 5 gate names
- `draft_section` must reference a specific section in the draft

## Calibration and Distribution Diagnostics

Read [`evaluator-calibration.md`](evaluator-calibration.md) before scoring. Use its weak,
competent, and strong anchors to calibrate severity, not as content templates.

- Assign each criterion independently from report evidence.
- `criteria_at_or_below_2` and `score_spread` are recomputed diagnostics, not
  target quotas.
- Do not lower scores, widen the spread, or create defects to fit a preferred
  distribution.
- Every score above 3 still requires a concrete high-score defense; scores
  above 4.4 require evidence that an expert would struggle to improve the
  report materially.
