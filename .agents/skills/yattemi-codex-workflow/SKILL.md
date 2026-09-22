---
name: yattemi-codex-workflow
description: Resume Yattemi Quest design, planning, implementation, verification, or AI harness work from repository state. Use when asked to continue, prepare Codex handoff, select stage skills, or design AI suggestions and operations.
---

# Yattemi Codex Workflow

## Start every session

1. Locate the repository with `current/PROJECT_STATE.json`. Read `AGENTS.md`, that state, `docs/CODEX_HANDOFF.md`, `current/TASKS.json`, and `docs/workflow/STAGES_AND_SKILLS.md` in order. Do not mistake a reference repository for the target.
2. Apply the latest explicit user instruction and higher-priority environment rules. Preserve authorization already given; never manufacture approval or require repeated permission for an already-authorized action.
3. Inspect the working diff. Select the first unfinished task whose dependencies and stage permit work. State the stage, task ID, deliverable, and completion evidence. Do not ask the user to restate the next step already recorded.
4. Load only skills triggered by that task from `current/SKILLS.json`. Prefer the complete repository-bundled project skills; do not assume personal plugin installation transfers to another Codex environment. Record missing required skills and continue independent authorized design work.
5. At DESIGN, produce specifications, decisions, synthetic fixtures, and development-document checks only. Do not scaffold product code, APIs, UI, database migrations, or live integrations.

## Design AI assistance

Read the active AI specification referenced by state. Separate development harness from product runtime. Define trigger, minimal input, bounded output, reviewer, fallback, cost cap, and evaluation for each capability. Compare fixed content, bounded drafting, and autonomous execution before selecting complexity.

Keep family context outside model memory. Retrieve only consented, tenant-scoped, versioned records for one job. Give the model no database writes, publishing, spending, notification, or consent tools. Treat family text as untrusted data. Reject out-of-schema or ungrounded outputs; never equate valid JSON with safe content.

Require explicit human publication of the exact reviewed content and audience. Recheck authorization and consent at read, generation, approval, and delivery. Invalidate approval when content/audience changes. Handle retry, cancellation, duplicate events, and withdrawal without silent publication. Never infer health from inactivity or automatically promote a child's ability from AI scores.

For child inputs, verify actual provider age/data conditions before any live call; parental UI ownership alone does not remove child-data constraints. Use synthetic data while these are unresolved. Keep the first experience functional with no model call.

## Finish and hand off

Run the repository's documented checks that actually exist. Record artifacts, evidence, limitations, and the next task in task/state/handoff documents. Keep proposed, implemented, tested, and human-approved statuses distinct. A passing document check is not product verification. Do not advance stages solely because documentation exists.

When designing screens, also load `yattemi-role-based-ui-design`. For PLAN use the registered planning skill after its prerequisite; for BUILD and VERIFY load only the selected stack/testing skills. Do not spawn agents unless the user or applicable task instructions authorize delegation.
