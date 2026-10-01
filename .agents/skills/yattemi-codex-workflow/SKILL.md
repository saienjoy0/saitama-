---
name: yattemi-codex-workflow
description: Resume Yattemi Quest by workstream and repository evidence. Use for current-state navigation, project organization, Codex handoff, stage-specific work, or AI assistance design and operations.
---

# Yattemi Codex Workflow

## Start every session

1. Locate the repository with `current/PROJECT_STATE.json` and read its `AGENTS.md`. If `CURRENT.md` and `current/WORKSTREAMS.json` exist, read that generated dashboard, select the user-requested workstream, then read its linked Issue and necessary sources. Read `docs/workflow/PROJECT_MANAGEMENT.md` when changing the management workflow. Otherwise use the legacy entry: state, `docs/CODEX_HANDOFF.md`, tasks, and stage table. Do not mistake a reference repository or an old LP draft for the active source.
2. Apply the latest explicit user instruction and higher-priority environment rules. Preserve authorization already given; never manufacture approval or require repeated permission for an already-authorized action.
3. Inspect the working diff. Honor the explicit workstream/task in the user's request. Without one, use the dashboard's focus order, verify its source state and dependencies, and select actionable work. Treat `state.next_task_id` as the product queue, not the next task for every workstream. Read the product state, review bundle and approval evidence before product work or any gate change. State the workstream, stage/task, deliverable and completion evidence. Do not ask the user to restate recorded next steps.
4. Load only skills triggered by that task from `current/SKILLS.json`. Prefer the complete repository-bundled project skills; do not assume personal plugin installation transfers to another Codex environment. Record missing required skills and continue independent authorized design work.
5. Keep workstream permissions separate. At product DESIGN, produce specifications, decisions, synthetic fixtures and development-document checks; do not scaffold product code, APIs, UI, database migrations or live integrations. Existing explicit authorization for synthetic LP or presentation work is scoped to that workstream and never opens product BUILD, live response collection, spending or live-child AI. Recruitment interviews do not require a finished LP; verify the actual intake, consent and scheduling conditions.

## Design AI assistance

Read the active AI specification referenced by state. Separate development harness from product runtime. Define trigger, minimal input, bounded output, reviewer, fallback, cost cap, and evaluation for each capability. Compare fixed content, bounded drafting, and autonomous execution before selecting complexity.

Keep family context outside model memory. Retrieve only consented, tenant-scoped, versioned records for one job. Give the model no database writes, publishing, spending, notification, or consent tools. Treat family text as untrusted data. Reject out-of-schema or ungrounded outputs; never equate valid JSON with safe content.

Require explicit human publication of the exact reviewed content and audience. Recheck authorization and consent at read, generation, approval, and delivery. Invalidate approval when content/audience changes. Handle retry, cancellation, duplicate events, and withdrawal without silent publication. Never infer health from inactivity or automatically promote a child's ability from AI scores.

For child inputs, verify actual provider age/data conditions before any live call; parental UI ownership alone does not remove child-data constraints. Use synthetic data while these are unresolved. Keep the first experience functional with no model call.

## Finish and hand off

Run the repository's documented checks that actually exist. If `current/WORKSTREAMS.json` is absent, use the legacy repository's task/state/handoff update rules; do not call a missing renderer. Otherwise follow its authority mode; never silently promote Issues or Projects to authoritative status during migration. In navigation mode, update existing task/state sources only for the affected workstream and regenerate `CURRENT.md` with `python3 scripts/render_current.py`; use Issues for context and evidence links, not a second hand-edited status ledger. In a later verified Projects mode, follow the repository's documented one-way synchronization. Do not hand-edit the generated dashboard. Keep `CODEX_HANDOFF.md` short and link historical details rather than appending every revision. Keep proposed, implemented, tested and human-approved statuses distinct. Issue closure or PR merge is never approval evidence. A passing document check is not product verification. Do not advance stages solely because documentation exists.

When designing screens, also load `yattemi-role-based-ui-design`. For PLAN use the registered planning skill after its prerequisite; for BUILD and VERIFY load only the selected stack/testing skills. Do not spawn agents unless the user or applicable task instructions authorize delegation.
