# Codex handoff

Current stage: DESIGN.

The next Codex must first read AGENTS.md, current/PROJECT_STATE.json, current/PROJECT_RULES_GAKUSTA.md, docs/workflow/STAGES_AND_SKILLS.md, and the three design documents under docs/design/. The next useful action is a design review and decision log update. Do not start app implementation yet.

When the human approves the written spec, update the state only with that approval, invoke writing-plans, and create a file-level implementation plan. Only after that plan is reviewed may the user say “implementation start” to enter BUILD.

Product boundary: Yattemi Quest uses Ogenki capabilities as references/features, not code integration. Child, parent, and grandparent screens are intentionally different inside one shared UI system. AI is bounded drafting with explicit human gates; fixed curriculum must work without AI.

