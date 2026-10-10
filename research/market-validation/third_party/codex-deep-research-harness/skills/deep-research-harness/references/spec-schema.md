# Spec Schema Reference

The Planner writes `spec.json` against
[`../schemas/spec.json`](../schemas/spec.json). Unknown fields are rejected.
The schema and validators enforce structural contracts; role prompts and the
Evaluator interpret the semantic preferences called out below. Do not treat a
schema-valid preference as proof that the report followed it well.

## Deterministically Enforced Fields

The validator deterministically checks JSON shape, required fields, bounds,
enumerations, identifiers, and cross-references. It also checks the downstream
contracts named here:

| Field | Deterministic behavior |
| --- | --- |
| `version` | Must be `"2.0"`. |
| `topic` | String with at least 5 characters. |
| `dimensions` | Contains 2-8 unique `dim_NNN` entries with bounded subquestions and search queries. |
| `audience` | Object shape, level enum, and context length only. |
| `depth` | Must be `sprint` or `full`; the qualitative depth is not mechanically proven. |
| `outputFormat.sections` | Array shape and item lengths only. |
| `outputFormat.maxWords` | Integer from 500-20000; draft validation enforces the maximum. |
| `outputFormat.citationStyle` | `inline` only; draft citations use canonical `[dim_NNN-src-NNN]` IDs. |
| `successCriteria.passThreshold` | Number from 1.0-5.0, copied into `meta.pass_threshold` after Planner validation. |
| Other `successCriteria` fields | Required enums or booleans are structurally validated. |
| `artifactPlan` | Contains 1-3 unique artifacts with valid type, placement, and dimension references; draft validation checks markers and placement. |
| `constraints` | Optional object shape, nonempty entries, language length, and require/exclude collision only. |

### Required Top-Level Fields

| Field | Type | Description |
| --- | --- | --- |
| `version` | `"2.0"` | Schema version |
| `topic` | string | Refined research topic |
| `dimensions` | array | Questions assigned to Scouts |
| `audience` | object | Intended reader and purpose |
| `depth` | `"sprint"` or `"full"` | Requested research depth |
| `outputFormat` | object | Thematic sections, word maximum, and citation form |
| `successCriteria` | object | Threshold and evaluation preferences |
| `artifactPlan` | array | Required Markdown-native decision artifacts |
| `constraints` | object, optional | Source and language preferences |

### Dimensions

```json
{
  "id": "dim_001",
  "question": "What are the leading technical approaches?",
  "priority": "must-have",
  "subquestions": ["Sub-question 1", "Sub-question 2"],
  "search_keywords": [
    "technical approach comparison 2025",
    "state of the art method survey",
    "leading implementation benchmark results"
  ]
}
```

- `id` matches `^dim_[0-9]{3}$` and is unique.
- `question` has at least 10 characters.
- `priority` is `must-have`, `should-have`, or `nice-to-have`.
- `subquestions` contains 2-4 strings of at least 5 characters.
- `search_keywords` contains 3-6 strings of at least 3 characters.

The Planner should make these real, focused searches and should include risk
and future-impact dimensions when relevant. Those are planning-quality
instructions, not additional schema rules.

### Output Format

```json
{
  "sections": ["Executive Summary", "Key Dimensions", "Sources"],
  "maxWords": 4000,
  "citationStyle": "inline"
}
```

- `sections` contains at least 3 strings of at least 3 characters.
- `maxWords` is an integer from 500-20000.
- `citationStyle` is `inline` only.

### Success Criteria

```json
{
  "passThreshold": 3.8,
  "mustAddressPriorities": ["must-have", "should-have"],
  "citationCoverage": "all-material-claims",
  "artifactCompleteness": "all-required-artifacts-substantive",
  "preserveWhatsGoodOnRevision": true
}
```

- `passThreshold` is 1.0-5.0. The Planner default is `3.8`; after validation,
  the root copies it to `meta.pass_threshold`.
- `mustAddressPriorities` contains unique values from `must-have`,
  `should-have`, and `nice-to-have`.
- `citationCoverage` is `all-non-common-knowledge-claims`,
  `all-material-claims`, or `high-risk-claims`.
- `artifactCompleteness` is `all-required-artifacts` or
  `all-required-artifacts-substantive`.
- `preserveWhatsGoodOnRevision` is boolean.

### Artifact Plan

```json
{
  "id": "artifact_01",
  "type": "comparison_matrix",
  "purpose": "Compare leading options for the core decision",
  "placement": "executive_summary",
  "sourceDimensions": ["dim_001", "dim_003"]
}
```

Allowed types are `evidence_table`, `comparison_matrix`, `tradeoff_matrix`,
`risk_matrix`, `timeline`, and `decision_checklist`. Allowed placements are
`executive_summary`, `dimension_section`, and `appendix`. IDs match
`^artifact_[0-9]{2}$`; `sourceDimensions` reference existing dimensions.

### Constraints

```json
{
  "excludeSources": ["unreliable-domain.com"],
  "requireSources": ["specific-source"],
  "language": "en"
}
```

`excludeSources` and `requireSources` contain unique nonempty strings and may
not overlap. `language` is optional and must be at least two characters.

## Advisory Agent Guidance

These fields influence role behavior and evaluator judgment, but their full
semantic effect is not deterministically validated:

- `audience` is advisory agent guidance for vocabulary, context, and reader fit.
- `depth` is advisory agent guidance for breadth and analytical depth.
- `sections` is advisory thematic guidance, not literal headings that replace
  the Writer prompt's mandatory report structure.
- `language` is advisory agent guidance for the Writer's output language.
- `requireSources` is advisory agent guidance for Scout search preferences;
  an unmet preference is reported in evidence `open_questions`.
- `excludeSources` is advisory agent guidance for Scout source selection.
- `mustAddressPriorities` is advisory agent guidance assessed by the Evaluator.
- `citationCoverage` is advisory agent guidance for which factual claims need
  citations; canonical citation syntax and source-ID resolution remain hard
  gates.
- `artifactCompleteness` is advisory agent guidance for substantiveness; marker
  presence, declared placement, and source-dimension references are hard gates.
- `preserveWhatsGoodOnRevision` is advisory agent guidance evaluated from the
  prior feedback and revised draft.

Prompts must honor these preferences where observable and report material
exceptions. They must not claim deterministic enforcement for semantic quality.

## Fixed Runtime Policy

Fixed runtime policy is not caller configuration. It lives in `meta.json` and
the Skill workflow rather than `spec.json`:

- maximum 5 rounds;
- maximum 3 active child agents;
- maximum 2 attempts per work item;
- 10-minute timeout per role attempt; and
- plateau exhaustion after at least three valid evaluations when each of the
  last two score improvements is below `0.15`.

Changing these values requires a harness contract change plus corresponding
schema, validator, documentation, and test updates; a Planner must not encode
different runtime limits in `spec.json`.
