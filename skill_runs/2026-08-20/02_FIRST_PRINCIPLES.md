# First-Principles Rebuild — Current Business

Applied existing skill: `skills/vendor/tjboudreaux_cc-thinking-skills/thinking-first-principles/SKILL.md`

## claimed_constraints

The current project contains several things that can easily be treated as if they were mandatory. The skill requires separating true constraints from conventions or implementation choices.

| Claimed constraint | Classification | Binding now? |
|---|---|---:|
| The child must retain the ability to choose, refuse, modify, and negotiate | Primary product requirement | Yes |
| The service must gradually move initiative from adult/AI to child | Primary product requirement | Yes |
| The child should work with real situations and deliver meaningful value to someone | Primary product requirement | Yes |
| Safety and adult responsibility around minors must remain | Real ethical/operational constraint | Yes |
| AI must be present in the child experience | Convention / implementation hypothesis | No |
| The first interaction must use the “AI apprentice” framing | Convention / implementation hypothesis | No |
| There must be a family newspaper | Convention / implementation hypothesis | No |
| Photos are required to prove completion | Convention / implementation hypothesis | No |
| Every task needs monetary compensation | Convention / implementation hypothesis | No |
| Grandparents must be the first requester | Convention / implementation hypothesis | No |
| The final product must begin as a native/full app | Convention / implementation hypothesis | No |
| “Quest” language must appear everywhere | Branding/game-design convention | No |
| A parent must define the exact task | Convention; conflicts with the current core | No |

## primitives

The business can be reduced to these independently stated product truths/requirements from the current canonical concept:

1. **There is a real nearby situation.** Something in family life can be observed, improved, understood, made easier, or made more enjoyable.
2. **The child needs agency.** The child must have meaningful choices, including refusal and modification.
3. **The child needs enough scaffolding to begin.** Complete freedom is not assumed to work for a first-time user.
4. **The child must do cognitive work.** The system should not jump directly from situation to answer; the child should increasingly notice, interpret, propose, and decide.
5. **A recipient experiences value.** The result should create a meaningful change for another person, not merely complete an app checklist.
6. **The recipient returns informative feedback.** The child needs to know what actually changed or helped.
7. **The child gets another decision.** Reflection should influence what they do next.
8. **Support should be removable.** Long-term dependence on AI/adult prompting would contradict the stated success condition.
9. **Compensation is optional and negotiated.** Money can be part of the loop but cannot define obedience.
10. **Minor safety and family boundaries remain adult responsibilities.** The child's autonomy does not remove the need for safe limits.

## discarded_assumptions

The following should not be treated as product necessities during MVP design:

- “We need an app before we can test this.”
- “AI is the product.”
- “A photo submission is the natural proof of work.”
- “A family newspaper is essential to retention.”
- “Grandparent engagement must be in the first session.”
- “Points are required for motivation.”
- “A parent must issue a finished task.”
- “More features make the autonomy proposition stronger.”

Each of these can be tested later, but none is a primitive of the business core.

## rebuild

The simplest version that preserves only the binding primitives is a **manual household value loop**:

1. Adult identifies a real situation worth noticing but does not give the answer.
2. Child observes or hears the situation.
3. A lightweight facilitator (human, card, simple UI, or AI) asks what is happening.
4. Child identifies what could become easier/better and suggests an action.
5. Child can change the action, ask for help, negotiate timing, or refuse.
6. Family agrees on the action and any optional compensation.
7. Child acts.
8. Recipient says specifically what changed or helped.
9. Child answers one or two reflection prompts.
10. Next time, the facilitator gives less help if the child can proceed independently.

This loop can be tested without a full app, without payments infrastructure, without a social feed, and without a newspaper.

## binding_residuals

Even after stripping assumptions, the following real design problems remain:

- The child still needs an engaging first entry point.
- Different ages may need very different scaffolding.
- Parents may accidentally give the answer and collapse the discovery step.
- Real household value can be subjective and family-specific.
- Optional payment can create negotiation or fairness conflicts.
- Safety and coercion risks need explicit boundaries.
- The payer may not be the child user, producing a two-sided value problem.
- The project still needs a practical acquisition route in Saitama.

## kill_test

Cheapest proposed falsification test:

> Give a small number of parent-child pairs a real household situation using a manual prototype. Do not tell the child the solution. Observe whether the child can move through “notice → interpret → propose → agree → act → receive value feedback,” and whether they voluntarily want to try another situation.

A strong failure signal would be repeated cases where:

- children cannot understand or enjoy the flow even with light scaffolding,
- adults must repeatedly supply the answer,
- children do not want a second attempt,
- or parents do not consider the observed change valuable enough to continue.

If that happens, changing UI/features is not enough; the underlying interaction model needs revision.
