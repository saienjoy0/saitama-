# GAKUSTA Prototype Component Contracts

Status: DESIGN / non-production review artifact.

The HTML prototype in `prototype/gakusta/index.html` is a synthetic, non-persistent review surface. These contracts describe the reusable UI concepts Codex should preserve when production implementation is later authorized.

## Shared rule

Use one design system, but do not make child, parent, and grandparent screens the same dashboard with different colors.

Shared semantics:
- same meaning for save/share/cancel/revoked states
- same typography/color/status token family
- same consent and source labels
- same back/cancel behavior

Role variants:
- child: exploration, prediction, comparison, choice, reflection
- parent: compact review, safety/consent, growth context
- grandparent: large readable update, optional experience/question/encouragement reply

## Components

### DecisionCard
Purpose: one possible exploration or decision entry.
Required:
- short title
- one-sentence context
- large tap target
- exactly one primary entry action
Do not:
- imply there is a single correct financial answer
- use streaks or rank as the core motivation

### AIHintCard
Purpose: provide minimum cognitive scaffolding.
Required:
- show origin: `fixed`, `ai_matched`, or `ai_draft`
- allow skip/ignore
- never replace the child's final choice
- fixed content must not be mislabeled as AI
Prototype default: fixed hint; no live model call.

### ProgressMap
Purpose: show where support is becoming unnecessary.
Required:
- describe support/independence, not an intelligence or financial-ability score
- never auto-promote permissions based on the display
- use plain language such as "自分で / 少しヒント / これから"

### FamilyMessage
Purpose: preserve provenance of family input.
Kinds:
- experience
- question
- encouragement
Required:
- author/source label
- family reply is not automatically treated as fact
- reply does not become a new quest until the child chooses it

### ReflectionCard
Purpose: short reflection after a real or simulated decision.
Required:
- lightweight selectable response
- optional short text
- no mandatory essay
- no pass/fail grading

## Role shell

### Child shell
Primary question: "何を確かめたい？"
Default flow:
explore -> predict -> compare -> choose -> try -> reflect -> discovery record.
Family sharing is optional.

### Parent shell
Primary question: "今、何を確認する必要がある？"
Separate:
- informational updates
- consent/share review
- real-world risk gates
Do not create an approval queue for every fixed hint.

### Grandparent shell
Primary question: "孫は何を考えた？"
Default surface:
large-type discovery newspaper.
Reply is optional. No-response is a normal success state.

## Review states that must stay testable

- offline / AI unavailable
- child declines sharing
- no grandparent participation
- reduced motion
- no matching curated candidate
- parent declines publication

A first child experience must still complete when family reply or AI assistance is absent.
