---
name: yattemi-role-based-ui-design
description: Use when designing or reviewing Yattemi Quest screens for children, parents, and grandparents, especially when role-specific tasks must feel distinct while sharing one product language.
---

# Yattemi Role-Based UI Design

Design one product with three role-specific jobs. Keep shared trust, navigation grammar, typography, color tokens, and accessibility consistent; do not force the same dashboard or information density onto every role.

## Required sequence

1. Read `current/PROJECT_STATE.json`; stop if the stage does not permit design work.
2. Write each role's job, anxiety, device/context, and first successful action before drawing screens.
3. Define shared design tokens and interaction rules first.
4. Map role-specific information architecture and one primary action per screen.
5. Design first-run paths with realistic content, empty/error/offline states, and consent boundaries.
6. Test the same task with each role; record where consistency becomes sameness or where differences break trust.
7. Do not implement UI until the written design is approved and the state file allows implementation.

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

Read `references/yattemi-screen-matrix.md` for a screen inventory. Read the repository's `docs/design/ui-system-and-role-screens-v0.1.md` for product-specific decisions.
