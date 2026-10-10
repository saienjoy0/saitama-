# Codex Harness Benchmark

Run the baseline and harness in separate fresh Codex tasks with the same model
and the exact prompt in `cases/codex-research-harness.json`. Record wall-clock
duration and any available token or cost metrics, but do not substitute cost
for quality.

## Execution

1. Record the Codex CLI version and resolved model identifier.
2. Start a fresh baseline task. Give it the case prompt and baseline
   instructions without invoking `deep-research-harness`.
3. Start a different fresh task with the identical case prompt and explicitly
   invoke `deep-research-harness`.
4. Interrupt the harness only after every round-one Scout artifact validates
   and before Writer starts. Preserve `meta.json` and record each role's
   attempt/status tuple.
5. Start another fresh Codex task and issue the case's resume instruction with
   the recorded absolute run path. Confirm from `meta.json` that validated
   Planner and Scout work was not repeated.
6. Validate the completed harness run:

   ```bash
   node <SKILL_ROOT>/scripts/validate.js run <RUN_ROOT>
   ```

7. Score both reports from 1 to 5 on the five weighted dimensions in the case.
   Read the reports in a blinded order when practical. For every score, record
   a concise report-specific reason.

Do not reuse a Codex conversation between baseline, interrupted harness, and
resume. They are separate tasks; durable files are the only harness handoff.

## Local Result Record

Store local scorecards under `benchmarks/results/{date}-{model}.json`. Result
JSON is ignored by git and must contain:

```json
{
  "case_id": "codex-research-harness-v1",
  "date": "YYYY-MM-DD",
  "model": "resolved Codex model identifier",
  "codex_cli_version": "x.y.z",
  "prompt": "exact case prompt",
  "baseline": {
    "report_path": "/absolute/path/to/baseline.md",
    "wall_clock_seconds": 0,
    "tokens": null,
    "scores": {
      "source_accuracy": 0,
      "analytical_depth": 0,
      "completeness": 0,
      "actionability": 0,
      "clarity": 0
    },
    "weighted_score": 0,
    "score_notes": {}
  },
  "harness": {
    "run_root": "/absolute/path/to/run",
    "report_path": "/absolute/path/to/final_report.md",
    "wall_clock_seconds": 0,
    "tokens": null,
    "rounds": 0,
    "terminal_status": "completed",
    "validator_exit": 0,
    "citation_count": 0,
    "citation_audit_count": 0,
    "unsupported_citation_count": 0,
    "unknown_citation_count": 0,
    "citation_audit_coverage": 0,
    "role_attempts_before_resume": [],
    "role_attempts_after_resume": [],
    "duplicate_role_after_resume_count": 0,
    "scores": {},
    "weighted_score": 0,
    "score_notes": {}
  },
  "acceptance": {
    "machine_thresholds_pass": false,
    "score_gain": 0,
    "quality_threshold_pass": false,
    "release_gate_pass": false,
    "failures": []
  }
}
```

The first release passes only when every machine acceptance threshold passes
and the harness weighted score exceeds baseline by at least 0.5. A failure
triggers focused prompt or harness tuning before release. Preserve the result
record and do not weaken the threshold to make a run pass.
