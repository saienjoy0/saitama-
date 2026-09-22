# Codex project instructions

## Source of truth

Read in this order before acting: AGENTS.md, current/PROJECT_STATE.json, current/PROJECT_RULES_GAKUSTA.md, then the current design documents. Treat legacy/, research/, and source_materials/ as evidence or hypotheses, not automatic requirements.

## Stage gate

The machine-readable stage is current/PROJECT_STATE.json. At DESIGN, Codex may inspect, research, revise design, create synthetic fixtures, and run documentation checks. It must not create product UI, APIs, database migrations, real-user integrations, payment, or health inference. A user saying “start implementation” changes intent but does not skip the written-spec approval and implementation-plan gate in docs/workflow/STAGES_AND_SKILLS.md.

## Product boundary

Yattemi Quest is a three-generation household learning and communication product. Ogenki is a reference implementation: adopt selected functions (photo/newspaper delivery, optional reactions/questions, user-entered “元気だよ” status), but do not merge its code or assume its authentication, tenancy, or health-status logic is production-safe.

## Skills by stage

Use the project skill yattemi-role-based-ui-design for role-specific screen work. Use the existing brainstorming and writing-plans skills for design-to-plan handoff, then implementation, testing, security, and verification skills only after the state gate permits them. If a required skill is unavailable, stop and record the gap instead of silently substituting implementation.

## Safety

AI drafts are suggestions. No AI output may publish to a family, change a reward, infer health, expose household finance, or send a notification without an explicit human action and an audit record. Never use inactivity as a health conclusion.

