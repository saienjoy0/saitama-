# Codex stage contract

## Stage map

| Stage | Codex may do | Required skills | Exit evidence |
|---|---|---|---|
| DESIGN | inspect, compare alternatives, write specs, synthetic fixtures | brainstorming; project AI/UI skills; official docs lookup | written spec + open decisions + acceptance tests |
| PLAN | decompose approved spec into file-level tasks | writing-plans; dispatching parallel agents only when independent | reviewed implementation plan |
| BUILD | implement one planned slice with tests | test-driven-development; relevant framework skill; supabase/security if applicable | tests and traceability pass |
| VERIFY | adversarial review, accessibility, privacy, failure paths | verification-before-completion; systematic-debugging when needed | evidence report and human release decision |
| PILOT | synthetic then consenting families, observe metrics | research/evaluation discipline; no production health inference | pilot report and next hypothesis |

## Current gate

The repository is in DESIGN. “Implement” is a future instruction, not current authorization to skip the gates. The next Codex session should read current/PROJECT_STATE.json first, then the three design documents.

## Skill loading policy

Required project skill: yattemi-role-based-ui-design for any screen or navigation decision. Existing general skills are selected by stage, not loaded all at once. Do not add a skill merely to decorate the repository; every skill must have a trigger, output, and validation check.

## Definition of ready for implementation

The human has reviewed and approved the written product, AI harness, UI system, data/consent model, and acceptance tests; spec_status is approved; a writing-plans artifact exists and is reviewed; implementation_allowed is true. Until then Codex can improve documents and synthetic tests only.

