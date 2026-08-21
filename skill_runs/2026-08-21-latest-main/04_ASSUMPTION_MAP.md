# Assumption Map — Latest Main Spec

Applied skill: `identify-assumptions`

Product type: new product.
Risk formula: `Impact × (1 − Confidence)`.
Confidence mapping from the vendored skill: High=0.8, Medium=0.5, Low=0.2.

Impact is estimated from how strongly the assumption can collapse the current core mechanism or commercialization path. Confidence is intentionally low where the current spec itself marks a point as unvalidated.

| ID | Assumption | Category | Confidence | Impact | Risk score | Action |
|---|---|---|---|---:|---:|---|
| A1 | Children voluntarily re-enter the experience while scaffolding is progressively reduced. | Value | Low | 10 | 8.0 | **Test Now** |
| A2 | Across repeated new situations, combined AI + parent support can decrease without the parent simply taking over or the child failing. | Usability | Low | 10 | 8.0 | **Test Now** |
| A3 | Children can transfer the thinking to a different household situation and eventually bring one in without a prompt. | Value | Low | 10 | 8.0 | **Test Now** |
| A4 | The parent problem (“I want independent judgment but cannot coach every step”) is frequent and painful enough to change behavior. | Value | Low | 10 | 8.0 | **Test Now** |
| A5 | Parent setup/feedback can stay light enough that the household repeats the process. | Usability | Low | 9 | 7.2 | **Test Now** |
| A6 | After experienced value, a parent will make a real paid-continuation commitment. | Viability | Low | 10 | 8.0 | **Test Now after experience** |
| A7 | Refusal/modification/negotiation remain genuine in household power dynamics. | Ethics | Medium | 8 | 4.0 | Test / observe |
| A8 | AI-apprentice onboarding outperforms a simpler low-AI/non-AI scaffold on engagement and independent thinking. | Value | Low | 6 | 4.8 | Investigate |
| A9 | Support intensity can be observed and logged reliably enough to make “fading” a useful product signal. | Feasibility | Low | 7 | 5.6 | Investigate |
| A10 | A multidimensional support profile is more useful than a single level without creating excessive complexity. | Usability | Low | 6 | 4.8 | Investigate |
| A11 | Concrete recipient feedback (“what changed/helped”) can stay natural and not become grading/homework. | Value | Low | 6 | 4.8 | Investigate |
| A12 | Optional compensation supports value/negotiation learning without making household life overly transactional. | Ethics | Low | 6 | 4.8 | Investigate |
| A13 | A manual concierge pilot is faithful enough to test the mechanism before full software. | Feasibility | Medium | 7 | 3.5 | Proceed cautiously |
| A14 | Grandparent participation improves the next question/action enough to justify early inclusion. | Value | Low | 4 | 3.2 | Defer |
| A15 | Privacy/safety can be handled with minimal data and clear family boundaries in an MVP. | Ethics | Medium | 7 | 3.5 | Proceed with guardrails |
| A16 | A viable business model exists even if successful learning leads to lower product dependence/usage. | Strategy | Low | 9 | 7.2 | **Investigate early** |
| A17 | A reachable initial age/household segment in Saitama can be recruited repeatedly for a small PoC. | GTM | Low | 7 | 5.6 | Investigate |
| A18 | The project can reach a paid offer on the GAKU∞STA timeline after core behavior/payer risks are resolved. | Strategy | Medium | 6 | 3.0 | Defer / monitor |

## Highest-priority interpretation

A1–A6 are the load-bearing near-term tests.

A16 is strategically important but should not distract from behavior discovery: first establish whether the mechanism creates valued progress, then design monetization compatible with “graduation” or reduced support.

## Devil’s advocate checks

### PM perspective
- The team may be optimizing an educational ideal that parents do not actually pay to solve.
- The AND success condition may be conceptually clean but too slow/rare for a viable household product.

### Design perspective
- “Minimal scaffold” may still feel like a quiz with a hidden right answer.
- Tracking support can tempt the product to over-instrument and over-direct the child.

### Engineering perspective
- Automatic support-profile inference may be far harder than manual observation, and is not needed to validate the mechanism.
- AI variability may make support-intensity scoring noisy unless the first test uses controlled scripts/human facilitation.

## Re-score rule

After every repeated-session pilot:
- raise confidence only from observed behavior/commitment;
- separate “same chore got easier” from cross-situation transfer;
- record parent interventions as support, not only AI events;
- do not label long-term autonomy “validated” from a short PoC.
