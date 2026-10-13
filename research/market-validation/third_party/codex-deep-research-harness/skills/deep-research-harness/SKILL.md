---
name: deep-research-harness
description: >
  Codex-only long-running deep research harness using isolated Planner, Scout,
  Writer, and Evaluator agents with validated file handoffs and resumable state.
  Use for complex multi-source research, deep dives, decision reports, and
  explicit resume requests. Do not use for quick lookups or simple Q&A.
---

# Deep Research Harness

## Runtime Invariants

1. `SKILL_ROOT` is the directory containing this `SKILL.md`; resolve every prompt, schema, reference, and script from it.
2. Default `RUN_ROOT` is `${CODEX_HOME:-$HOME/.codex}/deep-research-harness/runs/{task_id}`.
3. New runs initialize `max_rounds` to `5` and `pass_threshold` to `3.8`; after Planner validation, copy `spec.successCriteria.passThreshold` into `meta.pass_threshold` before creating round 1.
4. The root agent owns orchestration and `meta.json`. The root agent must not author spec, evidence, draft, or evaluation artifacts during normal execution.
5. Spawn Planner, Scouts, Writer, and Evaluator with `fork_turns: "none"`. Each prompt must include all required absolute paths and role instructions.
6. Keep a maximum of three active child agents. Use `list_agents` before every spawn wave and run Scouts in bounded waves.
7. Validate every artifact before advancing. Invalid output gets one retry in a fresh agent; attempt two failure ends the run.
8. Update the user at least once every 60 seconds during active work.

This Skill is a Codex orchestration contract, not a JavaScript or Python agent
orchestrator. The root agent interprets the contract and uses Codex
collaboration tools. Role completion messages are advisory; canonical files
plus deterministic validation are authoritative.

## Ownership and Isolation

| Role | Context | May write |
| --- | --- | --- |
| Root | Current task | `meta.json`, staging promotion, `final_report.md`, or `best_report.md` |
| Planner | Fresh child | `spec.json` only |
| Scout | Fresh child | One assigned staged evidence JSON file only |
| Writer | Fresh child | One assigned `drafts/draft_v{N}.md` only |
| Evaluator | Fresh child | One assigned eval JSON and feedback Markdown pair only |

The root agent is orchestration-only. It must not perform Planner, Scout,
Writer, or Evaluator work when a child fails. Every retry uses a new child with
`fork_turns: "none"`; no role inherits the user's conversation or another
role's reasoning. Planner and Writer do not browse. Scouts and Evaluator may
use Codex search and source-page access under their role prompts.

## Canonical Paths

Resolve `SKILL_ROOT` once from this file's installation directory. The
directory containing this SKILL.md is the only resource root. Resolve or create
`RUN_ROOT` as an absolute path before assigning any child work.

| Artifact | Absolute location under `RUN_ROOT` |
| --- | --- |
| Durable state | `meta.json` |
| Research specification | `spec.json` |
| Scout staging output | `context/.staging/{work_item_id}.json` |
| Canonical evidence | `context/evidence_{dimension_id}.json` |
| Round draft | `drafts/draft_v{N}.md` |
| Round evaluation | `evals/eval_v{N}.json` |
| Round feedback | `feedback/feedback_v{N}.md` |
| Passing output | `final_report.md` |
| Non-passing exhausted output | `best_report.md` |

Children receive absolute paths. Work-item `output_paths` stored in `meta.json`
remain relative to `RUN_ROOT` and must never escape it. Scout handoffs are
schema-valid evidence JSON, not free-form research notes.

Work-item ownership is exact: Planner owns only `spec.json`; a pending,
running, or failed Scout owns only `context/.staging/{work_item_id}.json`; a
completed or partial Scout owns only
`context/evidence_{dimension_id}.json`; Writer owns only
`drafts/draft_v{N}.md`; Evaluator owns exactly `evals/eval_v{N}.json` and
`feedback/feedback_v{N}.md`. Planner uses round 0. Every other role names an
existing round, and Scout dimensions must be selected by that round.

The `work_items` ledger is append-only. Preserve one Planner work item, one
Scout work item for every `researched_dimensions` entry, and one Writer and
one Evaluator work item for every completed round. Never delete historical
role attempts to make state validate.

## Durable State Rules

- Validate `meta.json` against `schemas/meta.json` after every state mutation.
- Before each spawn, set the work item to `running`, increment `attempt`, set
  the current phase and round, clear its prior error, and update `updated_at`.
- After deterministic output validation, set the work item to `completed` or,
  for valid incomplete Scout evidence with open questions, `partial`. Then
  update `updated_at` and validate `meta.json` again.
- Attempt values are `0` before first spawn, `1` during the first attempt, and
  `2` during the only retry. Never create attempt `3`.
- Missing, malformed, out-of-boundary, or invalid output is an attempt failure.
  Record its validator error in the work item and `last_error` before retrying.
- If attempt two fails, mark the work item `failed`, set run status `failed` and
  phase `finalized`, validate `meta.json`, stop spawning, and report the error.
- On an explicit resume request, resolve the task ID beneath the default run
  base or accept the supplied absolute run path, then validate `meta.json`.
  If `meta.status` is terminal, return the recorded terminal outcome without
  spawning. If `meta.status` is nonterminal, reconcile artifacts first and
  continue from the earliest incomplete checkpoint.
- Before changing a stale `running` item, validate its assigned existing,
  staged, or canonical output.
- If the output validates, reconcile the item to `completed` or valid Scout
  `partial` and continue without spawning. Use the ordered Scout promotion
  checkpoint below before recording its reconciled status.
- If output is invalid or missing and `attempt < 2`, set the item to `pending`,
  retain the existing attempt count, and permit exactly one remaining spawn.
- If output is invalid or missing and `attempt == 2`, mark the item `failed`,
  set run status `failed` and phase `finalized`, and do not spawn.
- Never increment an attempt to `3`.

Whenever a staged Scout output validates during normal completion or stale
recovery, apply one ordered checkpoint. Validate the staged Scout evidence.
Atomically rename it to `context/evidence_{dimension_id}.json`. Replace the
work item's `output_paths` with
`["context/evidence_{dimension_id}.json"]`. Only then mark the work item
`completed` or `partial`. Validate `meta.json` after the path and status update.

After each root-owned role completion checkpoint—Planner metadata bootstrap,
every Scout promotion, Writer completion, and Evaluator round-record and best
update—run:

`node SKILL_ROOT/scripts/validate.js run RUN_ROOT`

Do not advance or spawn the next role unless both the role-specific validation
and this whole-run validation pass.

## Resume Existing Run

1. Resolve the requested task ID under the default run base, or use the
   absolute run path supplied by the user.
2. Validate the whole run before trusting meta.json. Use
   `node SKILL_ROOT/scripts/validate.js run RUN_ROOT`. Report malformed or
   escaping paths and stop; never repair those paths silently.
3. Read `meta.json`. If status is terminal, return the recorded outcome and
   report path without spawning agents.
4. Before changing any stale `running` work item, validate its assigned
   existing, staged, or canonical output. If the output validates, reconcile
   it to `completed` or valid Scout `partial`. Do not respawn a role whose assigned output already validates.
5. If output is invalid or missing and `attempt < 2`, reset stale running work items to pending, retain the existing attempt count, set
   `updated_at`, validate `meta.json`, and permit only the remaining attempt.
6. If output is invalid or missing and `attempt == 2`, mark the item `failed`,
   set run status `failed` and phase `finalized`, validate `meta.json`, and do
   not spawn. Never increment an attempt to `3`.
7. Reconcile artifact-first: do not respawn a role whose assigned output already validates. Mark that work item complete and continue from the next
   missing or invalid artifact.
8. Resume the earliest incomplete phase in this order: Planner, selected
   Scouts, Writer, Evaluator, Decide.
9. Never replace a valid prior draft or evaluation during recovery. New
   attempts write only their originally assigned round paths.

## Root Workflow

### New Run

1. Generate `{topic-slug}-{YYYYMMDD}-{HHMMSS}` and create `RUN_ROOT/context`, `RUN_ROOT/context/.staging`, `RUN_ROOT/drafts`, `RUN_ROOT/evals`, and `RUN_ROOT/feedback`.
2. Write valid `meta.json` with status `running`, phase `planning`, round `0`,
   `max_rounds=5`, `pass_threshold=3.8`, and a pending Planner work item.
3. Spawn a fresh Planner using `prompts/planner.md`; pass the user request, absolute prompt path, absolute schema path, absolute spec output path, and absolute validator path.
4. Use `wait_agent` in intervals no longer than 60 seconds. Validate `spec.json`. Retry once in a fresh Planner if output is invalid or missing.
5. Copy the validated spec's `successCriteria.passThreshold` to
   `meta.pass_threshold`. Create round 1 Scout work items for every spec
   dimension, append the round 1 state record, set round `1`, change phase to
   `researching`, and validate `meta.json` before the first Scout spawn.

### Scout Waves

1. Call `list_agents`; calculate `available = max(0, 3 - active_children)`.
2. Spawn at most `available` pending Scouts with `spawn_agent` and `fork_turns: "none"`.
3. Give each Scout exactly one dimension, the absolute Scout prompt path, the absolute spec path, a unique `context/.staging/{work_item_id}.json` output path, and the absolute validator command. For round 2+, also pass the canonical prior evidence path.
4. Use `wait_agent` in intervals no longer than 60 seconds. After ten elapsed minutes, call `interrupt_agent`, validate any output, and retry once if needed.
5. Validate each staged evidence file. For round 2+, require `--prior` so prior sources, claims, and contradictions cannot be removed or rewritten.
6. Apply the ordered Scout promotion checkpoint: validate, atomically rename
   to `context/evidence_{dimension_id}.json`, replace the work item's
   `output_paths` with the canonical path, and only then mark it `completed` or
   `partial`.
7. Do not start Writer until every selected dimension has valid complete or partial canonical evidence. A partial artifact must list open questions.

Repeat the wave calculation until every selected Scout item reaches a valid
terminal work-item state. Never exceed three active children, and never convert
an invalid or missing Scout result into partial evidence.

### Write

1. After Scout completion, set phase `writing`, update the current round to
   `writing`, and create one pending Writer work item with `attempt=0` in one
   checkpoint. A writing-only round already contains that pending Writer; do
   not append a duplicate. Validate `meta.json` and the whole run before spawn.
2. Spawn a fresh Writer using `prompts/writer.md` with `fork_turns: "none"`; pass the absolute spec path, context directory, draft output path, validator command, and prior round draft, evaluation, and feedback paths when applicable.
3. Use `wait_agent` in intervals no longer than 60 seconds. After ten elapsed minutes, call `interrupt_agent` and validate any output. Validate the draft and retry once in a fresh Writer if it is invalid or missing.
4. After the draft gate passes, atomically set the Writer work item to
   `completed`, set the current round's `draft_path` to
   `drafts/draft_v{N}.md`, and update `updated_at` while both `meta.phase` and
   the round status remain `writing`.
5. Validate `meta.json`, then validate the whole run with
   `node SKILL_ROOT/scripts/validate.js run RUN_ROOT`.

### Evaluate

1. Only after both validations pass, set `meta.phase` and the round status to
   `evaluating`, and append one pending Evaluator work item with `attempt=0`.
2. Validate `meta.json` and the whole run again.
3. Then spawn a fresh Evaluator. Use `prompts/evaluator.md` with
   `fork_turns: "none"`; pass the absolute `references/evaluator-calibration.md` path,
   spec, draft, context directory, eval output, feedback output, validator
   commands, and prior evaluation when applicable.
4. Use `wait_agent` in intervals no longer than 60 seconds. After ten elapsed minutes, call `interrupt_agent` and validate both outputs. Validate eval and feedback; retry once in a fresh Evaluator if either is invalid or missing.
5. Copy score, verdict, draft path, eval path, and feedback path into the round record, mark the round `completed`, and update `best`.

Passing rounds take precedence over non-passing rounds. Within the eligible
pass class, select the highest valid `overall_score`; break ties in favor of
the later round. When the current evaluation has `pass=true`, recalculate
`best` before Decide so that `best.passed=true` and `best.draft_path` names a
passing artifact. A completed run's `best` must be the selected passing round
and must have `passed=true`. An exhausted run's `best` must be the highest-ranked
valid non-passing round and must have `passed=false`.

### Decide

1. If `pass=true`, copy the best draft byte-for-byte to `final_report.md`, set status `completed` and phase `finalized`, validate `meta.json` plus every canonical run artifact, and return the absolute report path.
2. If verdict is `REJECT`, set status `failed` and phase `finalized`; do not label any draft final and do not create `final_report.md`.
3. If at least three valid evaluations exist and each of the last two score improvements is less than `0.15`, set status `exhausted` and phase `finalized`, copy the best draft byte-for-byte to `best_report.md`, and report a plateau.
4. If `max_rounds` is reached, set status `exhausted` and phase `finalized`, copy the best draft byte-for-byte to `best_report.md`, and explicitly report that it did not pass.
5. Otherwise bootstrap the next round using the checkpoint rules below.

Before any next-round spawn, increment `meta.round` by one. Append a pending
round record with `number=meta.round`, `draft_path=null`, `eval_path=null`,
`feedback_path=null`, `score=null`, and `verdict=pending`.

For research gaps, set `researched_dimensions` to the canonical
`weak_dimensions`, set round status and phase to `researching`, and create one
pending Scout work item with `attempt=0` for each selected dimension. Each item
uses the new round number and its unique staging output path.

For writing-only defects, set `researched_dimensions` to an empty array, set
round status and phase to `writing`, create no Scout work items, and create one
pending Writer work item with `attempt=0` in the same checkpoint.

Validate `meta.json` and the whole run before spawning any child for the new
round. Only after both validations succeed may the root enter Scout Waves for
research gaps or spawn the already-checkpointed Writer for writing-only
defects. Both branches then run a fresh Writer and Evaluator.

Never create `final_report.md` for an exhausted or failed run. A valid
`best_report.md` is explicitly non-passing. Every terminal state must preserve
`meta.json`, validator errors, and all validated round artifacts for diagnosis.
Before finalizing `completed` or `exhausted`, require the latest round to be
completed and require every work item to be `completed` or valid Scout
`partial`. A failed run must remain non-passing, contain no running work item,
and be justified by an attempt-two failed work item or a validated `REJECT`
evaluation. A running run must never use phase `finalized`.
A validated `REJECT` is absorbing: set `failed/finalized` at that exact
round; no later round or work item may exist.

## Validation Gates

Build every command with the absolute validator path
`SKILL_ROOT/scripts/validate.js` and absolute artifact paths:

- Planner: `spec <spec-path>`
- Scout round 1: `evidence <staged-path> --spec <spec-path>`
- Scout round 2+: `evidence <staged-path> --spec <spec-path> --prior <canonical-prior-path>`
- Writer: `draft <draft-path> --spec <spec-path> --evidence-dir <context-directory>`
- Evaluator eval: `eval <eval-path> --spec <spec-path> --draft <draft-path> --evidence-dir <context-directory>`
- Evaluator feedback: `feedback <feedback-path> --eval <eval-path>`
- State: `meta <meta-path>`

An agent's success message never bypasses these gates. Do not advance while an
assigned file is missing, still staged, schema-invalid, semantically invalid,
or outside its write boundary.

## Codex Collaboration Tools

- Use `spawn_agent` only for one fresh Planner, Scout, Writer, or Evaluator attempt.
- Use `list_agents` before each bounded Scout wave and before any retry that could exceed capacity.
- Use `wait_agent` for waits no longer than 60 seconds.
- Use `interrupt_agent` when a child reaches ten elapsed minutes or violates its write boundary.

See `references/codex-runtime.md` for the normative tool contract and
`references/workflow.md` for the mirrored phase checklist.

## References

- Runtime: `references/codex-runtime.md`
- Workflow: `references/workflow.md`
- Durable state: `references/run-state.md`
- Evidence: `references/evidence-contract.md`
- Spec and evaluation: `references/spec-schema.md`, `references/eval-schema.md`
- Role prompts: `prompts/planner.md`, `prompts/scout.md`, `prompts/writer.md`, `prompts/evaluator.md`
- Schemas: `schemas/spec.json`, `schemas/evidence.json`, `schemas/eval.json`, `schemas/meta.json`
