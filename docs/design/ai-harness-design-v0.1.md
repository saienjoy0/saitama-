# AI harness design v0.1

Status: DESIGN / proposal, not runtime code.

## Two harnesses, kept separate

1. Development harness (Codex): reads repository state, loads the stage-appropriate skill, refuses out-of-stage implementation, produces traceable artifacts, and reports tests before completion.
2. Product AI harness (Yattemi): turns approved family context into a bounded draft. It never becomes a family member, teacher of record, health monitor, wallet, or autonomous publisher.

## Product AI jobs

| Job | Trigger | Output | Human gate |
|---|---|---|---|
| Quest suggestion | child/parent asks or weekly opt-in | 1–3 age/context-fit questions with reason and skip | child chooses; parent safety boundary |
| Reflection prompt | child submits photo/guess/result | one neutral “what changed?” prompt | child edits/skips |
| Newspaper draft | approved artifact exists | short plain-language caption and layout draft | parent approves audience/content |
| Conversation bridge | grandparent reply/question exists | suggested follow-up question | sender edits/sends |
| Operations triage | failed delivery or unanswered item | retry/fallback suggestion | operator confirms |

No model call is required for the fixed first experience. AI is an assistive layer after deterministic curriculum and consent checks work.

## Runtime envelope

request -> identity/consent/tenant check -> allowed context projection -> policy checks -> model (structured output) -> schema validation -> safety/redaction -> human review -> explicit publish/send -> audit event

The model receives the minimum projected context: role, age band, approved artifact IDs, selected household fields, and language. It does not receive raw health data, hidden parent notes, unapproved financial details, or unrelated family history. Prompts and model versions are versioned. Every output stores provenance, status, reviewer, and reason for rejection.

## Output states

drafted -> edited -> approved -> published or drafted -> rejected -> regenerated or drafted -> expired. A timeout, schema refusal, policy hit, or unavailable model falls back to fixed copy and a visible retry; it never blocks a child’s saved work or silently sends.

## Safety and privacy invariants

- Suggestions cannot publish, award money, change consent, infer health, or contact a third party.
- “元気だよ” is an explicit user-entered status with timestamp; inactivity means unknown.
- Child assent and parent authorization are separate records; withdrawal revokes future visibility and queues deletion/retention handling.
- Household financial fields are purpose-limited and audience-limited; grandparents see only approved artifacts.
- Under-18 handling, retention, vendor terms, abuse reporting, and human escalation must be verified before real-family pilot. Do not promise zero retention without a provider-specific contract.

## Evaluation harness before pilot

Maintain fixtures, not real children: 20+ synthetic cases covering refusal, prompt injection in family text, over-disclosure, unsafe reward advice, grandparent no-response, duplicate send, model timeout, accessibility language, and consent withdrawal. Score schema validity, policy violations, leakage, edit distance, human usefulness, latency, cost, and fallback success. Block release if any critical privacy or send-without-approval case fails.

## Cost and operations

Set per-family daily token/request budgets, queue slow jobs, cache deterministic outputs, log latency and refusal rates, and expose an operator kill switch. Start with one provider adapter and a fixed prompt version; compare models offline before changing. No autonomous agent loop or tool-writing permissions in MVP.

## Open decisions

Provider/region and retention terms; exact age-band policy; parent review UX; pilot red-team owner; deletion SLA; acceptable cost per family-week. These are design decisions, not reasons to implement early.

