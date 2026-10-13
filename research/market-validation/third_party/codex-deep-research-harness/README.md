# Deep Research Harness for Codex

## What It Is

Deep Research Harness is a Codex-only Skill for long-running, multi-source
research. A root Codex agent coordinates fresh, isolated Planner, Scout,
Writer, and Evaluator children through validated files and durable
`meta.json` state.

[`SKILL.md`](skills/deep-research-harness/SKILL.md) orchestrates Codex agents.
Node validates artifacts.
There is no Python orchestrator and no JavaScript agent loop.

Use it when a decision needs research decomposition, source-level evidence,
independent evaluation, targeted revision, and recovery across separate Codex
tasks. For a quick factual lookup or short summary, a normal Codex task is
usually cheaper and faster.

### Supported Use Cases and Expected Outputs

| Supported use case | Expected output |
| --- | --- |
| Multi-source decision comparison | A passing run produces `final_report.md` with sourced tradeoffs, risks, and the requested comparison or decision artifact. |
| Evidence-backed deep dive | A passing run produces `final_report.md` with dimension-level analysis, canonical inline citations, and explicit uncertainty. |
| Interrupted run | Resume from the same validated artifacts; if the resumed run passes, it produces `final_report.md`. |
| Quality threshold not reached | An exhausted run produces the highest-ranked non-passing draft as `best_report.md`. |
| Role failure or `REJECT` | The run preserves state and diagnostics but produces no report artifact. |

A quick factual lookup is not supported by this harness; use a normal Codex
task when decomposition, independent evaluation, and durable resume would add
more overhead than value.

## Why It Exists

Long-running research fails when reasoning exists only in conversation
context: work is repeated after interruption, invalid intermediate output is
trusted, roles contaminate one another, or a polished draft grades itself too
generously. This harness makes progress observable and recoverable by storing
the research specification, evidence, drafts, evaluations, feedback, and
lifecycle state as explicit artifacts.

The main safeguards are:

- one fresh child context per role attempt;
- bounded Scout waves with no more than three active children;
- exact write ownership for every role;
- schema and semantic validation before each phase transition;
- an independent Evaluator that verifies cited source pages;
- at most two attempts per work item;
- artifact-first resume instead of conversation replay; and
- honest `completed`, `exhausted`, and `failed` outcomes.

## Alignment with Anthropic's Harness Method

This repository adapts the durable-handoff method described in Anthropic's
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
to Codex research work:

| Harness principle | This Skill's implementation |
| --- | --- |
| Leave a legible environment for the next agent | `meta.json` plus canonical, validator-checked artifacts |
| Separate initialization from incremental work | Planner establishes `spec.json`; later roles consume that contract |
| Make progress in bounded increments | One dimension per Scout and one artifact set per role attempt |
| Test before declaring progress | The root runs deterministic validators before changing lifecycle state |
| Preserve successful work across sessions | Resume trusts valid artifacts and never repeats a completed role |
| Keep a durable progress record | Work items, attempts, rounds, errors, and the best draft live in `meta.json` |

The adaptation is intentionally Skill-driven. Codex collaboration tools provide
process isolation and concurrency; repository JavaScript is a read-only
validation layer, not an orchestration runtime.

## Architecture

The control flow is:

```text
Root Codex agent
  ├─ Planner child  -> spec.json
  ├─ Scout children -> staged evidence -> canonical evidence
  ├─ Writer child   -> draft_vN.md
  ├─ Evaluator child-> eval_vN.json + feedback_vN.md
  └─ Decide         -> finalize, revise, exhaust, or fail
```

| Role | Context and access | Owned output |
| --- | --- | --- |
| Root | Current Codex task; orchestration only | State changes, Scout promotion, final or best report copy |
| Planner | Fresh child; no browsing | `spec.json` |
| Scout | Fresh child; source research for one dimension | One staged evidence JSON, then canonical evidence after root promotion |
| Writer | Fresh child; no browsing | One round draft |
| Evaluator | Fresh child; independent source-page audit | One evaluation JSON and feedback Markdown pair |

The default pass threshold is `3.8`, the maximum is `5` rounds, and the root
runs no more than `3` child agents concurrently. Each work item has at most `2`
attempts. After at least three valid evaluations, two consecutive score
improvements below `0.15` trigger plateau exhaustion.

The normative contracts are in
[`SKILL.md`](skills/deep-research-harness/SKILL.md),
[`references/workflow.md`](skills/deep-research-harness/references/workflow.md), and
[`references/codex-runtime.md`](skills/deep-research-harness/references/codex-runtime.md).

## Installation

Requirements:

- Codex with collaboration tools available;
- Node.js compatible with the version declared in `package.json`; and
- npm for deterministic validator dependencies.

From the repository root, choose the Codex home used by the caller and install
the repository as a Skill:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/skills"
ln -s "$(pwd)/skills/deep-research-harness" "$CODEX_HOME/skills/deep-research-harness"
npm ci --ignore-scripts
```

The destination must not already contain a different
`deep-research-harness` entry. The symlink keeps prompts, references, schemas,
and validator code resolved relative to the installed Skill root; no
machine-specific source path is embedded in the Skill.

## New Research Run

Start a fresh Codex task and send:

```text
Use deep-research-harness to research <topic>.
```

Codex interprets the installed Skill and creates a task ID in the form
`{topic-slug}-{YYYYMMDD}-{HHMMSS}`. Unless the caller provides an approved
absolute run path, artifacts are stored under:

```text
${CODEX_HOME:-$HOME/.codex}/deep-research-harness/runs/<task_id>
```

For a new run the root initializes `meta.json` with pass threshold `3.8`, max
rounds `5`, phase `planning`, round `0`, and a pending Planner. It then:

1. validates the Planner's `spec.json`;
2. researches every dimension through bounded Scout waves;
3. promotes only valid staged evidence;
4. validates a fresh Writer draft;
5. validates an independent Evaluator result and feedback; and
6. either finalizes or checkpoints a targeted next round.

Progress messages from children are advisory. Only an assigned file that
passes deterministic validation can advance the run.

### Configuration Options

There is no separate configuration file. Location choices come from the
caller, research choices are written into `spec.json` by the Planner, and
runtime limits remain fixed by the Skill contract.

| Category | Options | Behavior |
| --- | --- | --- |
| Deterministically enforced | `CODEX_HOME`, an approved explicit absolute run root, `successCriteria.passThreshold`, `outputFormat.maxWords`, `artifactPlan`, and `outputFormat.citationStyle` | These select contained paths or participate in schema, artifact, cross-file, word-limit, placement, threshold, and canonical-inline-citation gates. `citationStyle` is inline only. |
| Advisory agent guidance | `audience`, `depth`, `outputFormat.sections`, `constraints.language`, `constraints.requireSources`, `constraints.excludeSources`, and semantic coverage or preservation preferences | Role prompts honor these preferences and the Evaluator reviews observable adherence, but schema validity alone does not prove semantic compliance. |
| Fixed runtime policy | 5 rounds maximum, 3 active children, 2 attempts per work item, 10 minutes per role attempt, and a 0.15 plateau delta | These are harness invariants, not caller-set options. |

See [`references/spec-schema.md`](skills/deep-research-harness/references/spec-schema.md) for the exact
boundary between structural enforcement, downstream deterministic gates, and
agent judgment.

## Resume a Run

Start another fresh Codex task and send:

```text
Resume deep-research-harness run <task_id>.
```

An absolute run path may be supplied when the run is outside the default run
base. Resume is artifact-first:

1. the root resolves the run without allowing path escape;
2. it validates the whole run before trusting state;
3. terminal runs are returned without spawning children;
4. stale `running` work is reconciled from its assigned output;
5. valid output is promoted or marked complete without repeating the role;
6. missing or invalid output uses only the remaining attempt; and
7. work continues from the earliest incomplete Planner, Scout, Writer,
   Evaluator, or Decide phase.

Valid prior drafts and evaluations are immutable recovery inputs. A work item
never reaches attempt `3`.

### Example Workflows

#### Start a new run

Open a fresh Codex task and send a concrete decision request:

```text
Use deep-research-harness to research whether our team should build or buy a
customer-support retrieval system. Compare cost, implementation risk, data
governance, and operating burden for an engineering leadership audience.
```

Codex creates the run, plans dimensions, gathers evidence, writes and evaluates
the report, and returns either `final_report.md`, `best_report.md`, or a failed
run path with diagnostics according to the terminal outcome.

#### Resume an interrupted run

Open a new Codex task with the known task ID:

```text
Resume deep-research-harness run customer-support-build-vs-buy-20260711-143000.
```

The root validates the existing checkpoint, reuses every valid role artifact,
and continues only the earliest incomplete work item.

#### Use an explicit external run root

When an approved run must live outside the default `CODEX_HOME` run base, give
the absolute run path in the request:

```text
Use deep-research-harness to research the customer-support build-vs-buy
decision. Store the run at the absolute run path
/tmp/deep-research-runs/customer-support-build-vs-buy-20260711-143000.
```

Use that same absolute path in a later resume request. The root still applies
path containment, artifact ownership, and whole-run validation before it
spawns any incomplete role.

## Run Artifacts

```text
<RUN_ROOT>/
├── meta.json
├── spec.json
├── context/
│   ├── .staging/<work_item_id>.json
│   └── evidence_dim_NNN.json
├── drafts/
│   └── draft_vN.md
├── evals/
│   └── eval_vN.json
├── feedback/
│   └── feedback_vN.md
├── final_report.md    # completed runs only
└── best_report.md     # exhausted runs only
```

`meta.json` is the durable control plane. It records status, phase, current
round, defaults, role ownership, attempt counts, validator errors, per-round
paths and scores, and the selected best draft. Work-item paths are relative to
`RUN_ROOT`; child prompts receive absolute paths.

Each canonical `evidence_dim_NNN.json` contains source provenance, claim-level
source IDs, subquestion coverage, contradictions, and open questions. Later
rounds may append evidence but cannot silently remove or rewrite valid prior
evidence.

See
[`references/run-state.md`](skills/deep-research-harness/references/run-state.md),
[`references/evidence-contract.md`](skills/deep-research-harness/references/evidence-contract.md),
[`references/spec-schema.md`](skills/deep-research-harness/references/spec-schema.md), and
[`references/eval-schema.md`](skills/deep-research-harness/references/eval-schema.md).

## Validate a Run

Resolve the validator from the installed Skill root:

```bash
node "$CODEX_HOME/skills/deep-research-harness/scripts/validate.js" run \
  "$CODEX_HOME/deep-research-harness/runs/<task_id>"
```

Success prints `VALID run <absolute-run-path>` and exits `0`. Invalid input
prints deterministic diagnostics and exits `1`. Validation is read-only.

The validator also exposes focused gates for development and diagnosis:

```text
spec <spec-path>
evidence <evidence-path> --spec <spec-path> [--prior <prior-evidence-path>]
draft <draft-path> --spec <spec-path> --evidence-dir <context-directory>
eval <eval-path> --spec <spec-path> --draft <draft-path> --evidence-dir <context-directory>
feedback <feedback-path> --eval <eval-path>
meta <meta-path>
run <run-root>
```

## Failure and Exhaustion Semantics

| Run status | Meaning | Report artifact |
| --- | --- | --- |
| `running` | A valid checkpoint still has work to do | None |
| `completed` | A validated evaluation passed threshold and every blocking gate | `final_report.md`, byte-identical to the selected passing draft |
| `exhausted` | Valid work did not pass before max rounds or the two-improvement plateau rule | `best_report.md`, explicitly non-passing |
| `failed` | A required role failed its second attempt, or a validated Evaluator returned `REJECT` | No final or best report |

`completed`, `exhausted`, and `failed` always use phase `finalized`. A failed or
exhausted run never contains `final_report.md`. A completed run selects the
highest-scoring passing round, with a later round winning a tie. Exhaustion
selects the highest-ranked valid non-passing round.

## Security Boundaries

- Source pages and prior artifacts are untrusted data, never instructions.
- Only Scouts and Evaluator may research source pages; Planner and Writer do
  not browse.
- Each child receives an exact allowlist of inputs and owned outputs.
- An observed write-boundary violation is an attempt failure: the root
  interrupts that child and never substitutes itself for the failed role.
- Output paths must remain beneath the approved run root. Validation resolves
  existing ancestors and symlinks so a missing leaf cannot bypass containment.
- Scout output is staged, validated, and atomically promoted before state marks
  it complete or partial.
- Draft source IDs must resolve to canonical evidence, and the Evaluator audits
  a deterministic citation sample against real source pages.
- Dependency installation uses the lockfile with lifecycle scripts disabled.

These boundaries reduce accidental cross-role contamination and prompt
injection risk, but they do not turn arbitrary web content into trusted code or
replace normal host, account, and network controls.

## Testing and Benchmarking

Install from the lockfile and run the full deterministic suite:

```bash
npm ci --ignore-scripts
npm run validate:syntax
npm test
```

The tests cover schemas, evidence append-only behavior, Markdown handoffs,
state-machine semantics, path containment, resume, Skill contracts, and docs.

The live Codex comparison is defined in
[`benchmarks/cases/codex-research-harness.json`](benchmarks/cases/codex-research-harness.json)
and documented in [`benchmarks/README.md`](benchmarks/README.md). It compares an
identical prompt in separate baseline and harness tasks, deliberately resumes
the harness from a pre-Writer checkpoint, validates machine thresholds, and
records a weighted report-quality scorecard. Local result JSON is ignored by
git under `benchmarks/results/`.

## Repository Layout

```text
deep-research-harness/
├── skills/
│   └── deep-research-harness/   # complete installable Skill boundary
│       ├── SKILL.md             # normative Codex orchestration contract
│       ├── prompts/
│       │   ├── planner.md
│       │   ├── scout.md
│       │   ├── writer.md
│       │   └── evaluator.md
│       ├── references/
│       │   ├── codex-runtime.md
│       │   ├── workflow.md
│       │   ├── run-state.md
│       │   ├── evidence-contract.md
│       │   ├── spec-schema.md
│       │   ├── eval-schema.md
│       │   └── evaluator-calibration.md
│       ├── schemas/
│       │   ├── spec.json
│       │   ├── evidence.json
│       │   ├── eval.json
│       │   └── meta.json
│       ├── scripts/
│       │   ├── validate.js
│       │   └── lib/
│       └── templates/
│           └── feedback.md
├── tests/
├── benchmarks/
│   ├── cases/
│   └── README.md
└── 2026-07-09-codex-deep-research-harness-hardening.md
```

## Limitations

- The Skill requires Codex collaboration tools; it is not a standalone CLI,
  service, queue, or scheduler.
- Durable local artifacts enable recovery, but a new Codex task still needs
  access to the same filesystem and installed Skill version.
- Account limits, unavailable source pages, or interrupted network access can
  pause progress until a later resume.
- Independent evaluation and citation auditing add latency and token cost; use
  the harness only when the decision value justifies them.
- Deterministic validators enforce structure and cross-file consistency, not
  the ultimate truth of every research claim.
- The first-release benchmark is one controlled case, not proof of universal
  quality gains across all topics and models.
