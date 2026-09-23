# GAKUSTA UI Prototype Skill

## Purpose
Design and review GAKU∞STA screens before production implementation.

## Principles
- The product is not a quiz app. It turns family daily events into financial decision practice.
- AI does not give answers. AI asks, provides hints, or matches curated next actions, and support should become smaller when it is no longer needed.
- Child, parent, and grandparent views have different jobs but share one design system.
- A first experience must work with fixed content and no model call.
- No-response, refusal to share, no grandparents, offline, and reduced-motion are normal review states.

## Required screens
1. Child journey
- exploration
- prediction
- comparison
- decision
- action/try
- reflection
- discovery record

2. Parent view
- observe decision process
- distinguish information from required review
- support without replacing judgment
- approve family sharing only where needed

3. Grandparent view
- read a large, meaningful discovery update
- optionally return experience, question, or encouragement
- never require daily participation

## Component rules
Read `references/COMPONENTS.md`.
Core reusable concepts:
- DecisionCard
- AIHintCard
- ProgressMap
- FamilyMessage
- ReflectionCard

## Current review artifact
- `prototype/gakusta/index.html`
- synthetic state only
- no persistence, real sending, payment, live AI, ability scoring, or real family data

## Before production
Validate whether children understand and want to repeat the experience before adding complex features or APIs.
Production implementation remains governed by `current/PROJECT_STATE.json`, `current/TASKS.json`, and `AGENTS.md`.
