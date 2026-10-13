# Codex Harness Workflow

This reference mirrors the normative phases in
[`../SKILL.md`](../SKILL.md). The Skill is
interpreted by a root Codex agent. The root owns orchestration and `meta.json`;
fresh child agents own role artifacts.

## Runtime and Capacity

- Resolve `SKILL_ROOT` as the directory containing `SKILL.md` and build every
  prompt, schema, reference, and validator path from that absolute directory.
- Default `RUN_ROOT` is
  `${CODEX_HOME:-$HOME/.codex}/deep-research-harness/runs/{task_id}`.
- New runs initialize `max_rounds=5` and `pass_threshold=3.8`. After the
  Planner artifact validates, copy `spec.successCriteria.passThreshold` into
  `meta.pass_threshold` before creating round 1.
- Planner, every Scout, Writer, and Evaluator are fresh children spawned with
  `fork_turns: "none"`.
- Keep a maximum of three active child agents. Call `list_agents` before each
  bounded Scout wave and calculate `available = max(0, 3 - active_children)`.
- Use `wait_agent` only in intervals no longer than 60 seconds. Update the user
  at least once per 60 seconds while work is active.
- After ten elapsed minutes, use `interrupt_agent`, validate any assigned
  output, and use the one permitted retry only when validation still fails.
- A work item gets at most two attempts. Attempt two failure sets the item and
  run to `failed/finalized`; the root never takes over role execution.

## Canonical Run Layout

```text
RUN_ROOT/
├── meta.json
├── spec.json
├── context/
│   ├── .staging/{work_item_id}.json
│   └── evidence_{dimension_id}.json
├── drafts/draft_v{N}.md
├── evals/eval_v{N}.json
├── feedback/feedback_v{N}.md
├── final_report.md     # completed only
└── best_report.md      # exhausted only
```

The root creates the directories and owns `meta.json`. Scouts exchange
validated evidence JSON, never free-form research notes. Planner, Scout,
Writer, and Evaluator outputs are written only by their assigned fresh child.

## State Transitions

The nonterminal phase order is `planning -> researching -> writing ->
evaluating`. A new round returns to `researching`, unless the evaluator reports
only writing defects, in which case it starts at `writing`. Terminal status is
one of `completed`, `exhausted`, or `failed`, always with phase `finalized`.

Before a spawn, set the item `running`, increment its attempt, update phase,
round, and `updated_at`, and validate `meta.json`. After the assigned output
validates, set the item `completed` or valid Scout `partial`, update state, and
validate `meta.json` again. Missing or invalid output records the validator
error before a fresh retry. Never exceed attempt `2`.

Work-item output ownership is exact. Planner owns only `spec.json`; a pending,
running, or failed Scout owns its unique staging JSON; a completed or partial
Scout owns its canonical dimension evidence JSON; Writer owns one round draft;
Evaluator owns exactly the round evaluation and feedback pair.

The `work_items` ledger is append-only. Preserve one Planner work item, one
Scout work item for every `researched_dimensions` entry, and one Writer and
one Evaluator work item for every completed round. Never delete historical
role attempts to make state validate.

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

On explicit resume, resolve the task ID under the default run base or accept an
absolute run path, then validate `meta.json`. If `meta.status` is terminal,
return the recorded outcome without spawning. If `meta.status` is nonterminal,
reconcile artifacts and continue from the earliest incomplete checkpoint.
Before changing a stale `running` item, validate its assigned
existing, staged, or canonical output. If the output validates, reconcile the
item to `completed` or valid Scout `partial` and continue without spawning.
Apply the ordered Scout promotion checkpoint before recording its status. If
output is invalid or missing and `attempt < 2`, set the item to `pending`,
retain the existing attempt count, and permit exactly one remaining spawn. If
output is invalid or missing and `attempt == 2`, mark the item `failed`, set
run status `failed` and phase `finalized`, and do not spawn. Never increment an
attempt to `3`.

## Resume Existing Run

1. Resolve the requested task ID under the default run base, or use the
   absolute run path supplied by the user.
2. Validate the whole run before trusting meta.json with the read-only `run`
   validator. Report malformed or escaping paths and stop; never repair those
   paths silently.
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
7. Reconcile artifact-first: do not respawn a role whose assigned output already validates. Continue from the next missing or invalid artifact.
8. Resume the earliest incomplete phase in this order: Planner, selected
   Scouts, Writer, Evaluator, Decide.
9. Preserve every valid prior draft and evaluation. New attempts write only
   their originally assigned round paths.

## Phase 1: New Run and Plan

1. Generate task ID `{topic-slug}-{YYYYMMDD}-{HHMMSS}`.
2. Create `context/.staging`, `drafts`, `evals`, and `feedback` under the
   absolute `RUN_ROOT`.
3. Write schema-valid `meta.json` with `running/planning`, round `0`,
   `max_rounds=5`, `pass_threshold=3.8`, and a pending Planner work item.
4. Spawn a fresh Planner with `spawn_agent` and `fork_turns: "none"`. Include
   the user request and absolute Planner prompt, schema, `spec.json`, and
   validator paths.
5. Wait in intervals no longer than 60 seconds and validate `spec.json`.
   Invalid or missing output gets one fresh Planner retry. Attempt two failure
   ends the run as `failed/finalized`.
6. Copy the validated spec's `successCriteria.passThreshold` to
   `meta.pass_threshold`. Create round 1 Scout items for every spec dimension,
   append the round record, set round `1`, change phase to `researching`, and
   validate `meta.json` before the first Scout spawn.

## Phase 2: Scout Waves

1. Call `list_agents` and calculate
   `available = max(0, 3 - active_children)`.
2. Spawn no more than `available` pending Scouts with `spawn_agent` and
   `fork_turns: "none"`.
3. Assign exactly one dimension to each Scout. Include the absolute Scout
   prompt, spec, unique staging output, and validator paths. In round 2+, also
   include the canonical prior evidence path.
4. Wait with `wait_agent` in intervals no longer than 60 seconds. At ten
   elapsed minutes, use `interrupt_agent` and validate any output.
5. Validate staged evidence against the spec. In round 2+, require the prior
   artifact so existing sources, claims, and contradictions are immutable.
6. After validation succeeds, apply the ordered Scout promotion checkpoint:
   rename staging output to `context/evidence_{dimension_id}.json`, replace
   `output_paths` with that canonical path, and only then set the work item
   `completed` or `partial`. Partial evidence must contain open questions.
7. Repeat bounded waves until every selected dimension has valid canonical
   evidence. Writer cannot start earlier.

Round 1 selects every dimension. Later rounds select only evaluator
`weak_dimensions`. If the defects are writing-only, preserve canonical
evidence and skip Scout.

## Phase 3: Write

1. After Scout completion, set phase and round status to `writing` and create
   one pending Writer work item with `attempt=0` in one checkpoint. A
   writing-only round already contains that pending Writer; do not append a
   duplicate. Validate `meta.json` and the whole run before spawn.
2. Spawn a fresh Writer with `spawn_agent` and `fork_turns: "none"`. Include
   absolute Writer prompt, spec, context directory, draft output, and validator
   paths. For revisions, include prior draft, evaluation, and feedback paths.
3. Wait in intervals no longer than 60 seconds. At ten elapsed minutes,
   interrupt and validate any output. Invalid or missing output gets one fresh
   Writer retry; attempt two failure ends the run.
4. After the draft gate passes, atomically set the Writer work item to
   `completed`, set the current round's `draft_path` to
   `drafts/draft_v{N}.md`, and update `updated_at` while both `meta.phase` and
   the round status remain `writing`.
5. Validate `meta.json`, then validate the whole run with
   `node SKILL_ROOT/scripts/validate.js run RUN_ROOT`.

Writer reads only validated evidence JSON and assigned prior artifacts. Writer
does not browse, write evidence, or edit state.

## Phase 4: Evaluate

1. Only after both validations pass, set `meta.phase` and the round status to
   `evaluating`, and append one pending Evaluator work item with `attempt=0`.
2. Validate `meta.json` and the whole run again.
3. Then spawn a fresh Evaluator. Use `spawn_agent` with
   `fork_turns: "none"`. Include
   absolute Evaluator prompt, `references/evaluator-calibration.md`, spec,
   draft, context directory, eval, feedback, prior evaluation when applicable,
   and validator paths.
4. Wait in intervals no longer than 60 seconds. At ten elapsed minutes,
   interrupt and validate both assigned outputs. Invalid or missing eval or
   feedback gets one fresh Evaluator retry; attempt two failure ends the run.
5. Copy validated score, verdict, and artifact paths into the round. Mark it
   `completed` and update `best`.

Passing rounds take precedence over non-passing rounds. Within the eligible
pass class, select the highest valid `overall_score`; break ties in favor of
the later round. When the current evaluation has `pass=true`, recalculate
`best` before Decide so that `best.passed=true` and `best.draft_path` names a
passing artifact. A completed run's `best` must be the selected passing round
and must have `passed=true`. An exhausted run's `best` must be the highest-ranked
valid non-passing round and must have `passed=false`.

## Phase 5: Decide

Apply these rules in order:

1. Evaluation `pass=true`: copy the best draft byte-for-byte to
   `final_report.md`, set `completed/finalized`, validate state and all canonical
   artifacts, and return the absolute final path.
2. Verdict `REJECT`: set `failed/finalized`; do not create `final_report.md`.
3. At least three valid evaluations and each of the last two score improvements
   below `0.15`: copy the best draft to `best_report.md`, set
   `exhausted/finalized`, and report a plateau.
4. Reaching `max_rounds` without a pass: copy the best draft to
   `best_report.md`, set `exhausted/finalized`, and report that it did not pass.
5. Otherwise bootstrap the next round using the checkpoint below.

## Next-Round Checkpoint

Before any next-round spawn, increment `meta.round` by one. Append a pending
round record with `number=meta.round`, `draft_path=null`, `eval_path=null`,
`feedback_path=null`, `score=null`, and `verdict=pending`.

For research gaps, set `researched_dimensions` to the canonical
`weak_dimensions`, set round status and phase to `researching`, and create one
pending Scout work item with `attempt=0` for each selected dimension. Give each
item the new round number and its unique staging output path.

For writing-only defects, set `researched_dimensions` to an empty array, set
round status and phase to `writing`, create no Scout work items, and create one
pending Writer work item with `attempt=0` in the same checkpoint.

Validate `meta.json` and the whole run before spawning any child for the new
round. After both validations succeed, enter Scout Waves for research gaps or
spawn the already-checkpointed Writer for writing-only defects. Both branches
continue through fresh Writer and Evaluator attempts.

Failed and exhausted runs must not contain `final_report.md`. `best_report.md`
is the best validated draft but is not a passing report.
Before finalizing `completed` or `exhausted`, the latest round must be completed
and every work item must be `completed` or valid Scout `partial`. A failed run
must remain non-passing, contain no running work item, and have either an
attempt-two failed work item or a validated `REJECT` evaluation. A running run
must never use phase `finalized`.
A validated `REJECT` is absorbing: set `failed/finalized` at that exact
round; no later round or work item may exist.

## Validation Checklist

Use the absolute `SKILL_ROOT/scripts/validate.js` path for every command:

| Gate | Arguments |
| --- | --- |
| Planner | `spec <spec-path>` |
| Scout, first round | `evidence <staged-path> --spec <spec-path>` |
| Scout, later round | `evidence <staged-path> --spec <spec-path> --prior <canonical-prior-path>` |
| Writer | `draft <draft-path> --spec <spec-path> --evidence-dir <context-directory>` |
| Evaluator JSON | `eval <eval-path> --spec <spec-path> --draft <draft-path> --evidence-dir <context-directory>` |
| Evaluator feedback | `feedback <feedback-path> --eval <eval-path>` |
| State | `meta <meta-path>` |

File existence plus deterministic validation decides completion. A child
completion message never advances state by itself.
