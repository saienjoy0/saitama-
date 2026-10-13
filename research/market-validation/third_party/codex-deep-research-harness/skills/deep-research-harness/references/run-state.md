# Run State

`meta.json` is the root agent's durable checkpoint. JavaScript validates it but never changes it.

`planning` is the initialization phase. The legal nonterminal round paths are
`researching -> writing -> evaluating` for round 1 and research-gap revisions,
or `writing -> evaluating` for writing-only revisions. Every terminal outcome
uses phase `finalized`.

## Enforced Phase-Role Legality

Every earlier round must be `completed` before a later round record exists.
For the current nonterminal round, the whole-run validator enforces these
checkpoints:

| Checkpoint | Current-round contract |
| --- | --- |
| Research | A `researching` round contains no Writer or Evaluator work item. It contains only its selected Scout work items, which may still be pending or running. Draft, evaluation, feedback, score, and verdict remain unrecorded. |
| Writing before draft validation | A `writing` round contains exactly one Writer and no Evaluator. The Writer is pending or running, and `draft_path` is null. |
| Writing after draft validation | The Writer is completed and the round records exactly `drafts/draft_v{N}.md`; the round remains `writing` and still has no Evaluator until both validations pass. |
| Evaluation | An `evaluating` round contains a completed Writer, the canonical `draft_path`, and one pending or running Evaluator. Evaluation, feedback, score, and verdict remain unrecorded until both Evaluator outputs validate. |
| Decide | The Decide checkpoint keeps `meta.phase=evaluating` while the round is `completed`, both Writer and Evaluator are completed, canonical draft/evaluation/feedback paths and score/verdict are recorded, and `best` has been recalculated. |

A role that fails its second attempt terminates the run as `failed/finalized`
while preserving the corresponding round checkpoint (`researching`, `writing`,
or `evaluating`) and the failed work item. Terminal validation permits that
attempt-two failure but never a running work item or a later round.

The root agent writes state before spawning a role and again after validating
its output.

Work-item output ownership is exact. Planner owns only `spec.json`; a pending,
running, or failed Scout owns only its unique staging JSON; a completed or
partial Scout owns only `context/evidence_{dimension_id}.json`; Writer owns
only its round draft; Evaluator owns exactly its round evaluation and feedback
pair. Planner uses round 0. Every other item names an existing round, and its
attempt value must agree with its lifecycle status.

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

Before changing a stale `running` item, validate its assigned existing, staged,
or canonical output. If the output validates, reconcile the item to `completed`
or valid Scout `partial` and continue without spawning. Apply the ordered Scout
promotion checkpoint before recording its reconciled status. If output
is invalid or missing and `attempt < 2`, set the item to `pending`, retain the
existing attempt count, and permit exactly one remaining spawn. If output is
invalid or missing and `attempt == 2`, mark the item `failed`, set run status
`failed` and phase `finalized`, and do not spawn. Never increment an attempt to
`3`.

Each work item gets at most two attempts. A Scout may finish `partial` only when its evidence file validates and lists open questions. Missing or invalid evidence after attempt two ends the run as `failed` before Writer starts.

## Writer-to-Evaluator Checkpoint

After the draft gate passes, atomically set the Writer work item to
`completed`, set the current round's `draft_path` to
`drafts/draft_v{N}.md`, and update `updated_at` while both `meta.phase` and the
round status remain `writing`.

Validate `meta.json`, then validate the whole run with
`node SKILL_ROOT/scripts/validate.js run RUN_ROOT`.

Only after both validations pass, set `meta.phase` and the round status to
`evaluating`, and append one pending Evaluator work item with `attempt=0`.
Validate `meta.json` and the whole run again. Then spawn a fresh Evaluator.

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

`completed` means a draft passed every blocking gate. `exhausted` means max rounds or plateau rules stopped a valid but non-passing run. `failed` means a required artifact could not be produced or validated after retry, or the Evaluator returned `REJECT`.

Before finalizing `completed` or `exhausted`, the latest round must be completed
and every work item must be `completed` or valid Scout `partial`. A failed run
must remain non-passing, contain no running work item, and have either an
attempt-two failed work item or a validated `REJECT` evaluation. A running run
must never use phase `finalized`.
A validated `REJECT` is absorbing: set `failed/finalized` at that exact
round; no later round or work item may exist.

Passing rounds take precedence over non-passing rounds. Within the eligible
pass class, select the highest valid `overall_score`; break ties in favor of
the later round. When the current evaluation has `pass=true`, recalculate
`best` before Decide so that `best.passed=true` and `best.draft_path` names a
passing artifact. A completed run's `best` must be the selected passing round
and must have `passed=true`. An exhausted run's `best` must be the highest-ranked
valid non-passing round and must have `passed=false`.

## Next-Round Checkpoint

Before any next-round spawn, increment `meta.round` by one. Append a pending
round record with `number=meta.round`, `draft_path=null`, `eval_path=null`,
`feedback_path=null`, `score=null`, and `verdict=pending`.

For research gaps, set `researched_dimensions` to the canonical
`weak_dimensions`, set round status and phase to `researching`, and create one
pending Scout work item with `attempt=0` for each selected dimension. For
writing-only defects, set `researched_dimensions` to an empty array, set round
status and phase to `writing`, create no Scout work items, and create one
pending Writer work item with `attempt=0` in the same checkpoint.

Validate `meta.json` and the whole run before spawning any child for the new
round.
