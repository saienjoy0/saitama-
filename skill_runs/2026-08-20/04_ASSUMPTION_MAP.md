# Assumption Map — Current Business

Applied existing skill: `skills/vendor/borghei_Claude-Skills/identify-assumptions/SKILL.md`

Scoring follows the vendored skill:

`Risk Score = Impact × (1 − Confidence)`

Confidence mapping: High=0.8, Medium=0.5, Low=0.2.

Quadrants:
- Test Now: Impact >= 7 and confidence Low/Medium
- Proceed: Impact >= 7 and confidence High
- Investigate: Impact < 7 and confidence Low
- Defer: Impact < 7 and confidence Medium/High

## Context

- Product type: new product
- Categories: Value, Usability, Viability, Feasibility, Ethics, Go-to-Market, Strategy, Team
- Evidence quality: early-stage; most assumptions remain low-confidence because direct behavioral/user evidence is limited
- Principle: do not inflate every uncertainty into an existential risk; only assumptions that can collapse the core interaction or commercialization path receive impact >= 7

## Assumption Registry

| # | Assumption | Category | Confidence | Impact | Risk Score | Quadrant |
|---|---|---|---|---:|---:|---|
| A1 | A first-time child will voluntarily want another attempt after roughly 3–5 minutes of the onboarding/core interaction. | Value | Low | 10 | 8.0 | **Test Now** |
| A2 | Parents care enough about this kind of autonomy/problem-discovery growth to repeatedly support the interaction rather than default to direct instruction. | Value | Low | 10 | 8.0 | **Test Now** |
| A3 | A child in the initial target age can understand and move through notice → interpret → propose → negotiate with only light scaffolding. | Usability | Low | 9 | 7.2 | **Test Now** |
| A4 | After experiencing the pilot, at least some target parents will make a real financial commitment to continue. | Viability | Low | 10 | 8.0 | **Test Now** |
| A5 | The service can preserve meaningful refusal/negotiation in real family dynamics without turning autonomy into a nominal UI choice while adults still control the outcome. | Ethics | Medium | 8 | 4.0 | **Test Now** |
| A6 | Parents can provide a useful “situation worth exploring” without immediately giving the child the finished task/answer. | Usability | Low | 6 | 4.8 | Investigate |
| A7 | Family members can naturally return concrete “what changed/helped” feedback rather than generic praise or pass/fail grading. | Value | Low | 6 | 4.8 | Investigate |
| A8 | Optional compensation and condition negotiation can add value without making the entire household relationship transactional. | Ethics | Low | 5 | 4.0 | Investigate |
| A9 | A manual/concierge or lightweight MVP can faithfully represent the core behavior loop before a full application is built. | Feasibility | Medium | 6 | 3.0 | Defer |
| A10 | The `AI apprentice + household exploration` framing performs better than simpler non-AI entry methods for first-use engagement and problem framing. | Value | Low | 6 | 4.8 | Investigate |
| A11 | Grandparent participation materially improves continuation, reflection, or the next child-initiated action. | Value | Low | 5 | 4.0 | Investigate |
| A12 | A minimum-data design can make child/family privacy and safety acceptable without weakening the core experience. | Ethics | Medium | 6 | 3.0 | Defer |
| A13 | The first target households can be recruited in Saitama through a practical channel at low enough effort for a small PoC. | Go-to-Market | Low | 6 | 4.8 | Investigate |
| A14 | After the top behavior/payer risks are resolved, the project can reach a paid offering on the GAKU∞STA timeline toward March 2027. | Strategy | Medium | 6 | 3.0 | Defer |
| A15 | The founder can run the first discovery/concierge cycle with existing resources before adding significant team complexity. | Team | Medium | 5 | 2.5 | Defer |
| A16 | AI/runtime/support costs can remain small enough that a parent-priced product is not structurally uneconomic at MVP scale. | Viability | Medium | 5 | 2.5 | Defer |

## Highest-priority Test Now assumptions

### A1 — Child repeat desire

**Why load-bearing:** The current project itself identifies first-use “want to do it again” as the most important unresolved question. If the child does not voluntarily re-engage, feature expansion does not solve the core problem.

**Validation method:** Observe real first-use sessions; measure behavior, not “sounds fun” opinions.

**Success signal:** child independently asks to continue, chooses another situation, or returns for another attempt without adult pressure.

**Failure signal:** repeated need for adult prompting, boredom, or refusal to repeat despite understandable interaction.

---

### A2 — Parent sees enough value to support repetition

**Why load-bearing:** Parent is the leading payer/requester hypothesis. A child-facing experience that parents do not repeatedly facilitate cannot become a household product.

**Validation method:** Mom Test interviews + actual pilot usage.

**Success signal:** parent supplies a second real situation, makes time for another trial, or refers another household.

**Failure signal:** parent says the idea is good but reverts to direct instruction because the process feels slower or burdensome.

---

### A3 — Child can understand the core cognitive loop

**Why load-bearing:** If the child cannot move from situation to their own proposal without the system giving the answer, the stated autonomy mechanism collapses.

**Validation method:** usability/behavior observation with the minimum viable scaffolding.

**Success signal:** child can explain what is happening and produce or modify an action with limited hints.

**Failure signal:** facilitator repeatedly supplies the action, or child treats the flow as a quiz with a hidden correct answer.

---

### A4 — Real payer commitment exists

**Why load-bearing:** The GAKU∞STA project explicitly requires identifying who pays and willingness to pay.

**Validation method:** after value has been experienced, present a specific paid-pilot offer. Do not ask hypothetical willingness-to-pay questions alone.

**Success signal:** deposit/payment/paid continuation or another concrete financial commitment.

**Failure signal:** praise without payment when a concrete chance to buy is offered.

---

### A5 — Autonomy is real in household power dynamics

**Why load-bearing:** “Refuse / modify / negotiate” is part of the business core. If adults can override these choices without consequence, the experience becomes chore compliance with decorative choice.

**Validation method:** observe what actually happens when a child says “not now,” changes the task, or asks for different conditions.

**Success signal:** family can preserve safe boundaries while accepting genuine child decisions.

**Failure signal:** “refusal” exists only on screen but triggers pressure, punishment, or hidden negative consequences.

## Investigate next

- A6 parent input behavior
- A7 quality of feedback
- A10 AI apprentice vs simpler onboarding
- A13 first Saitama recruitment channel
- A8 compensation design
- A11 grandparent timing/value

These matter, but the business should not delay A1–A5 in order to perfect them.

## Defer / monitor

- A9 manual MVP fidelity
- A12 minimum-data privacy design
- A14 March 2027 paid-offer timeline
- A15 founder operating capacity
- A16 early economics

They still require monitoring, but none should be used as an excuse to skip the core behavior and payer tests.

## Anti-inflation check

5 of 16 assumptions are in `Test Now` (31%). This is above the vendored red-flag heuristic of ~20%, but the project is a new child/family product with several genuinely load-bearing unknowns. To avoid paralysis, only **A1–A5** are active critical assumptions; all other unknowns remain explicitly lower priority.

## Re-score rule

After each experiment, update confidence based on observed behavior or real commitments. Do not leave “validated” assumptions permanently fixed; the map should be revised as the target age, payer, and onboarding model become clearer.
