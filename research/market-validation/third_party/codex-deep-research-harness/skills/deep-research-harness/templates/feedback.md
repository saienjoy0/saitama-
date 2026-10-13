# Feedback: {task_id} - Round {N}

**Verdict:** {PASS | REVISE | REJECT}
**Overall Score:** {score}/5.0

## Summary

{Evaluation summary.}

## Must Fix

{If the verdict is PASS, write exactly `- none` and nothing else in this section.
If the verdict is REVISE or REJECT, do not write `- none`; write one or more
actual blocking bullets in this form:
`- [{defect_id}] [gate:{failed_gate_id}] [section:{matching defect section}] {Specific required fix.}`
or
`- [{defect_id}] [criterion:{criterion_id}] [section:{matching defect section}] {Specific required fix.}`}

## Should Improve

- [criterion:actionability] {Specific improvement.}

## Preserve

- [section:## Architecture] {Strength to preserve.}

## New Research Directions

- {Optional research direction.}

## Weak Dimensions

{If `weak_dimensions` is empty, write exactly `- none`.
Otherwise write each expected unique dimension exactly once as `- dim_NNN`,
with no `- none` or other lines.}
