# Assumption Map — rerun with 今の進捗(1)

Applied upstream skill: `identify-assumptions`.

Scoring: Risk Score = Impact × (1 − Confidence), High=.8 / Medium=.5 / Low=.2.

## Assumptions
| ID | Assumption | Category | Confidence | Impact | Risk | Action |
|---|---|---|---|---:|---:|---|
| A1 | First-time child voluntarily wants another attempt after ~3–5 minutes. | Value | Low | 10 | 8.0 | TEST NOW |
| A2 | Parent cares enough about autonomy/problem-discovery growth to facilitate repeated use. | Value | Low | 10 | 8.0 | TEST NOW |
| A3 | Child can move through notice → articulate → propose with only the minimum needed scaffolding. | Usability | Low | 10 | 8.0 | TEST NOW |
| A4 | Across repeated sessions, required scaffolding can actually decrease without engagement collapsing. | Value/Usability | Low | 10 | 8.0 | TEST NOW |
| A5 | Reduced prompts are replaced by self-initiated real-world noticing, not simply reduced app use/boredom. | Value | Low | 10 | 8.0 | TEST NOW |
| A6 | Parent burden can remain low enough for repeated real household use. | Usability/Viability | Low | 9 | 7.2 | TEST NOW |
| A7 | After experiencing value, some parents make a real financial commitment. | Viability | Low | 10 | 8.0 | TEST NOW |
| A8 | Child refusal/modification/negotiation is genuinely respected in household dynamics. | Ethics | Medium | 8 | 4.0 | TEST NOW |
| A9 | A multidimensional support profile predicts useful scaffolding better than a simpler history-based approach. | Usability | Low | 6 | 4.8 | Investigate |
| A10 | Five-step hint ladder is understandable and gives enough help without giving away the answer. | Usability | Low | 6 | 4.8 | Investigate |
| A11 | AI-apprentice framing improves first-use engagement or articulation versus simpler non-AI onboarding. | Value | Low | 6 | 4.8 | Investigate |
| A12 | Lightweight family feedback (“thanks”, “time saved”, etc.) is enough to make value visible to the child. | Value | Low | 6 | 4.8 | Investigate |
| A13 | Compensation can be attached at a stage that reinforces value creation without turning the loop into compliance-for-money. | Ethics | Low | 6 | 4.8 | Investigate |
| A14 | Initial target households can be recruited in Saitama with practical effort. | GTM | Low | 6 | 4.8 | Investigate |
| A15 | Grandparent participation improves the next child action enough to justify its added complexity. | Value | Low | 5 | 4.0 | Investigate |
| A16 | Manual/concierge testing adequately represents the core loop before app build. | Feasibility | Medium | 7 | 3.5 | Test/Proceed carefully |
| A17 | Minimum-data handling can keep child/family privacy acceptable. | Ethics | Medium | 7 | 3.5 | Proceed with guardrails |
| A18 | Founder can run initial discovery cycles with existing resources. | Team | Medium | 6 | 3.0 | Defer/monitor |

## Changed priority from the previous run
The new source adds a second load-bearing axis beyond first-use engagement: **scaffolding decay**.

Previously the key question was mostly “Does the child want another attempt?”
Now the stronger pair is:
1. **Does the child want another attempt?**
2. **Does the child need less external structure over repeated attempts, eventually bringing their own observations?**

A product that gets repeat use but keeps giving the child the observation theme, questions, options and answer path forever would fail the stated autonomy mechanism.

## Active critical assumptions for the next PoC
To avoid paralysis, actively test only A1–A8. A9–A18 remain tracked but should not block behavioral testing.

## Evidence needed to upgrade confidence
- observed repeated sessions, not stated preferences;
- hint level used per skill dimension and per session;
- child-initiated entries after prompts are reduced;
- parent second-session behavior;
- real refusal/negotiation moments;
- concrete paid-pilot offer after experience.
