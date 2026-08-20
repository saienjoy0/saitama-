# Lean / Pretotyping Experiments — Current Business

Applied existing skill: `skills/vendor/phuryn_pm-skills/brainstorm-experiments-new/SKILL.md`

The vendored skill emphasizes behavioral data, real commitment, and cheap experiments before a full build.

## Experiment Set 1 — First-use repeat desire

### XYZ hypothesis

> At least **X%** of **first-time children in the initial target segment** will **voluntarily choose another household situation or ask to do the experience again after completing one 3–5 minute onboarding/core interaction**.

`X%` is intentionally not invented here. The founder should set the threshold before running the test, based on how strong repeat desire must be to justify continuing.

### Pretotype A — Concierge household exploration

**Assumption tested:** A1 (child wants another attempt), A3 (child understands the flow).

**Method:**
- Parent supplies one real household situation.
- A human facilitator manually plays the role that the future product/AI might play.
- Facilitator follows the core sequence without giving the solution.
- No full app is required.

**Metric:**
- voluntary second attempt / explicit request to continue
- number of answer-giving interventions
- time to first child-generated observation/proposal

**Success threshold:** set before test; primary signal must be behavior, not “it was fun.”

**Kill signal:** repeated inability to reach a child-generated proposal or repeated refusal to try again even when the flow is understood.

---

### Pretotype B — Onboarding variant comparison

**Assumption tested:** A10 (AI apprentice is better than simpler entry methods).

**Variants:**
1. AI-apprentice / “teach me about this house” framing
2. situation card with observation prompts
3. simple choice/open-question hybrid without AI framing

**Metric:**
- time to first useful observation
- hint count
- child-generated proposal rate
- repeat desire
- child-reported confusion/annoyance after behavior is observed

**Success threshold:** choose the variant that produces the strongest combination of child-generated thinking and repeat behavior, not the variant children merely say looks coolest.

---

## Experiment Set 2 — Parent repeat commitment

### XYZ hypothesis

> At least **X%** of **parents who observe one real session** will **supply another real household situation and schedule/use a second session within the agreed test window**.

Again, X must be chosen before the test.

### Pretotype C — Two-session commitment test

**Assumption tested:** A2 (parent sees enough value to continue).

**Method:**
- Do not ask “Would you use this?”
- After the first real session, offer a specific second session.
- Parent must take a concrete action: submit another situation, choose a date, or introduce another household.

**Metric:**
- second-session rate
- time taken to submit next situation
- referral/introduction rate

**Success threshold:** predefine a minimum commitment rate.

**Failure signal:** praise with no second-session action.

---

## Experiment Set 3 — Paid-pilot signal

### XYZ hypothesis

> At least **X%** of **target parents who have already observed the value loop in their own household** will **make a real financial commitment for a defined continuation pilot**.

### Pretotype D — Paid continuation offer

**Assumption tested:** A4 (payer commitment).

**Method:**
- Only after the parent has experienced the pilot.
- Present one concrete offer with a real price, defined duration, and defined deliverable.
- Payment/deposit is preferable to a hypothetical willingness-to-pay survey.

**Metric:**
- payment/deposit conversion
- reasons for refusal based on actual offer
- whether price or product value is the primary blocker

**Success threshold:** set before offer.

**Failure signal:** repeated “good idea” feedback but zero real purchase when the option is available.

---

## Experiment Set 4 — Is autonomy real?

### XYZ hypothesis

> At least **X%** of **pilot sessions where the child wants to refuse, change, or renegotiate** will **end with the family accepting a genuine child decision without punishment or hidden negative scoring**.

### Pretotype E — Refusal / negotiation observation

**Assumption tested:** A5 (real autonomy in household power dynamics).

**Method:**
- Do not force refusal artificially.
- When a natural refusal/change request occurs, record what happens.
- Include explicit options to “not now,” change conditions, or propose another action.
- Interview parent and child separately afterward.

**Metric:**
- accepted refusal/change rate
- child perception of whether the choice was real
- parent perception of whether the process remained practical/safe

**Kill signal:** UI shows autonomy but family dynamics consistently override it.

---

## Experiment Set 5 — Parent input quality

### XYZ hypothesis

> At least **X%** of **target parents given a short situation-only prompt** will **describe a household context without supplying the finished task/answer**.

### Pretotype F — Situation intake test

**Assumption tested:** A6.

**Method:**
- Ask parents for a recent real situation.
- First round: no instruction.
- Second round: short examples of “situation” vs “finished task.”
- Compare how often parents over-specify.

**Metric:**
- percentage of inputs that preserve discovery space
- edit/rewrite rate needed
- parent effort/time

---

# Recommended sequence

1. Concierge household exploration (A1/A3)
2. Onboarding variant comparison (A10)
3. Two-session parent commitment (A2)
4. Paid continuation offer (A4)
5. Observe real refusal/negotiation throughout (A5)
6. Situation-intake refinement (A6)

Do not begin with broad advertising, a large survey, a full app build, or complex reward infrastructure. The cheapest discriminating data comes from actual household behavior and real continuation/payment commitments.

# Data rule

Separate:
- behavioral evidence
- real commitments
- direct quotes/qualitative observations
- founder inference

Do not convert compliments or hypothetical future intent into validation.
