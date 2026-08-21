# First-Principles Rebuild — Latest Main Spec

Applied skill: `thinking-first-principles`

## claimed_constraints

| Claimed requirement | Classification | Decision |
|---|---|---|
| The product must be an AI-first app | convention / implementation hypothesis | Not binding |
| `AI apprentice` must be the onboarding | implementation hypothesis | Not binding |
| Problem discovery itself is unique | contradicted by current competitive evidence | Discard as differentiation claim |
| Family newspaper is required | convention / format hypothesis | Not binding |
| Grandparents must start the loop | convention | Not binding; parent may start |
| High retention / more usage always means success | conventional SaaS metric | Explicitly false for this learning goal |
| Child autonomy means no scaffolding | false analogy | Discard; current spec requires calibrated support |
| Scaffolding research proves the household product works | unsupported extrapolation | Discard |
| Safe family boundaries and genuine child choice matter | primary product requirement / ethics | Binding |
| Child must ultimately gain more independent judgment | primary product requirement | Binding |
| Business still needs repeated adult commitment / payment | viability requirement | Binding, exact payer/price unknown |

## primitives

Independently supported by the current specification as primary requirements:

1. The desired change is **transfer of decision/problem-discovery control to the child**, not task completion volume.
2. The child must retain meaningful ability to choose, refuse, modify, negotiate, and propose within safety boundaries.
3. Some children need an entry scaffold; no-support is not equivalent to autonomy.
4. Support should target the stuck step and should be removable when no longer needed.
5. Real-world value and recipient reaction matter more than app-internal completion status.
6. Repetition must be voluntary enough to sustain learning opportunities.
7. The target behavior must eventually appear in a new real-life situation, not only in a rehearsed task.
8. Parent effort cannot become a hidden replacement for AI support.
9. Commercial viability must be measured separately from educational/product success.

## discarded_assumptions

- “We are different because children discover problems.” Competitor evidence now weakens this.
- “More sessions is necessarily better.” Successful fading may reduce use.
- “AI sophistication is the product moat.” The mechanism could survive a low-tech implementation.
- “Photo approval / points / newspaper / grandparent-first flows are necessary.” They are replaceable.
- “A 3–5 session signal proves durable autonomy.” The current spec explicitly rejects this overclaim.

## rebuild

The simplest product consistent with the primitives is not a full app.

### Minimal mechanism
1. Present or accept one real household situation.
2. Ask the child to observe/frame it.
3. Give no help where the child can continue.
4. If stuck, increase scaffold one step at a time.
5. Let the child propose/modify/decline/negotiate.
6. Let the action meet a real recipient.
7. Return a short concrete statement of what changed.
8. Record support intensity and parent intervention.
9. On later sessions, reduce/remove entry prompts and test a different situation.
10. Eventually leave only an open “anything you noticed?” entry — then test whether even that prompt is unnecessary.

This can initially be delivered manually with simple chat/cards and observation logging.

## binding_residuals

- Child safety and family power asymmetry.
- Age/development differences.
- Parent time and willingness.
- Ethical handling of compensation and refusal.
- Privacy/minimum data.
- Unknown duration required for genuine transfer.
- Commercial tension: if reduced product dependence is success, revenue cannot rely blindly on perpetual engagement.

## kill_test

Cheapest central kill test:

> With the same child across repeated real household situations, progressively reduce AI + parent scaffolding. If the child cannot continue without equivalent support, or the parent simply replaces the AI, the current “transfer of control” mechanism is not working.

Secondary kill signals:
- child repeatedly refuses re-entry;
- support falls only because the task is memorized, with no new-situation transfer;
- parent burden rises enough to stop repetition;
- parents praise the idea but reject a concrete paid continuation after experiencing it.
