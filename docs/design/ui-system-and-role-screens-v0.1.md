# UI system and role screens v0.1

Status: DESIGN / proposal, not implemented.

## Principle

One family story, three jobs. Visual consistency creates trust; role-specific hierarchy creates usefulness. We adopt selected Ogenki functions as product capabilities, not its screens or backend.

## Shared system

Use one semantic token set for surface, text, accent, success, warning, destructive, unread, and consent. Use the same artifact ID, timestamp, status labels, verbs (“送る”, “返す”, “あとで”, “取り消す”), back behavior, confirmation pattern, and plain-language error style across roles. All primary touch targets are large enough for the least dexterous user; text can scale; contrast and screen-reader labels are required. Never use a health-like red/green status unless the user explicitly entered it and its meaning is shown.

## Role surfaces

| Role | Home promise | Primary screen | Secondary screen | First success |
|---|---|---|---|---|
| Child | “今日、家の仕組みを一つ見つける” | Explore/quest card | My album + reflection | save a guess/photo and choose next action |
| Parent | “家族の共有と学びを整える” | Review inbox | Growth album + consent/settings | approve one artifact audience |
| Grandparent | “孫の今月が届く” | Family newspaper | Reply / 元気だよ | read one story and optionally respond |

## First-run flows

Child: choose 今日の発見 or あとで -> see one household question (water first candidate) -> make a guess -> optional photo/note -> save. Parent: set child assent, choose which fields may be shared, invite grandparent, preview first newspaper. Grandparent: open large-type newspaper -> read -> tap 元気だよ, reply, or later. No reply is a valid completion.

## Ogenki capability adoption

Adopt: photo capture/delivery, newspaper-like family update, optional reactions/questions, explicit 元気だよ, invite/member concept. Rebuild: authentication, tenant/group isolation, message ownership, read state, retry/error state, audit trail, deletion/withdrawal, and all health-adjacent wording. Do not reuse Ogenki’s global status inference, unauthenticated message/user routes, client-supplied sender identity, or failure UI that claims success.

## Screen inventory for design review

1. role-aware onboarding and consent
2. child explore
3. child quest detail / guess / submit
4. child reflection and album
5. parent review inbox
6. parent growth album
7. parent sharing/consent settings
8. grandparent newspaper
9. grandparent reply / 元気だよ
10. notification and offline/error states
11. operator delivery/audit view (not family-facing)

## Acceptance checks

A role identifies its next action within five seconds; every screen has skip/later; no child private note leaks to grandparent; a grandparent can complete without typing; parent can revoke future sharing; every send has an explicit approval and audit event; failure never displays success; the same artifact reconciles across all three views.

## Open decisions

Token values and typography; exact water-first content; minimum supported devices; paper/PDF fallback; notification cadence; consent wording; accessibility test participants. Resolve before plan approval.

