---
name: yattemi-role-based-ui-design
description: Use when designing or reviewing Yattemi Quest screens, child engagement, family feedback loops, AI assistance, motion, accessibility, and shared design systems for children, parents, and grandparents.
---

# Yattemi Role-Based UI Design

Design one product with three role-specific jobs. Keep shared trust, navigation grammar, typography, color tokens, and accessibility consistent; do not force the same dashboard or information density onto every role.

## Required sequence

1. Read `current/PROJECT_STATE.json`; stop if the stage does not permit design work.
2. Write each role's job, anxiety, device/context, and first successful action before drawing screens.
3. Read `references/evidence-led-family-design.md`. Apply Material-style semantic tokens, PAIR's non-AI comparison, Working Backwards customer outcomes, and appropriate Cloudscape interaction patterns. These are project adaptations, not official Google/Amazon skills.
4. Map role-specific information architecture and one primary action per screen.
5. Design first-run paths with realistic content, empty/error/offline states, and consent boundaries.
6. Specify purposeful motion and reduced-motion behavior using `references/motion-and-change-review.md`. Attach feature, screen, motion, and acceptance IDs to every reviewed flow.
7. Walk through each role's actual job and the handoff to the next role, including refusal, no response, and no grandparents. Test with users only when authorized; label persona walkthroughs as hypotheses, never observed results.
8. Do not implement UI until the written design is approved and the state file allows implementation.

## Role contract

| Role | Primary job | Default surface | Never imply |
|---|---|---|---|
| Child | Explore a real household mechanism, choose, try, reflect | visual quest/exploration | grades, surveillance, guaranteed money |
| Parent | Set safe boundaries, review growth, approve sharing/reward | decision inbox + growth album | automatic diagnosis or hidden spending |
| Grandparent | Receive a meaningful update, respond optionally, say “元気だよ” | large-type family newspaper + one-tap reply | required daily participation or medical certainty |

## Consistency rules

- Share brand tokens, content tone, status meanings, consent language, and back navigation.
- Change density, verbs, card hierarchy, type scale, touch target size, and notification cadence by role.
- Every AI suggestion shows why it appeared, source/context, uncertainty, and a human edit/skip action.
- Every state that can affect a child, family sharing, reward, or health-adjacent status is reviewable and reversible.
- Never derive a health conclusion from inactivity; show only user-entered status and timestamp.

## Screen review checklist

- Can the role state the next action in five seconds?
- Is there exactly one primary action and a visible “later/skip” choice?
- Are child data, household figures, and grandparent responses scoped to consent?
- Do loading, empty, failure, withdrawal, and offline states preserve dignity?
- Does the screen work with large text, high contrast, and role-appropriate touch targets?
- Is the same concept named the same way across roles while the task remains role-specific?

## References

Read `references/yattemi-screen-matrix.md` for a screen inventory. Read the active role/motion specification in `current/PROJECT_STATE.json` for product-specific decisions; old version filenames are not authoritative.

## Child agency and AI

Make child engagement visible as meaningful choice, prediction, comparison, discovery, and self-expression; decoration alone does not pass review. Keep a non-purchase path and an accessible alternative to gesture controls. Do not optimize streaks, screen time, or dependency.

For each AI feature, compare a fixed alternative and define the user bottleneck, permitted input, output type, display audience, reviewer, failure path, and removal criterion. Distinguish curated candidate selection from newly generated prose. Never add a parent approval to every fixed hint; never remove sharing or real-world risk checks because a child has completed more tasks. Keep keys and authorization on the server. Treat the current AI specification as authoritative for provider/data gates.

Require traceability from family reply to an optional seed and a child-chosen next action. A delivered newspaper is not evidence that this loop improves learning.

## Review deliverable

Give the user a feature inventory and a navigable review artifact when requested. Label all mock state changes as simulations, never real saves or sends. Include one successful flow plus failure, empty, refusal, and reduced-motion views. Keep private implementation details outside the depicted product UI. Map feedback to stable IDs so later changes do not require redesigning unrelated features.
