# UI consistency during feature implementation

Read `docs/design/ui-consistency-20261007.md` and `docs/design/ui-system.json` with the active feature spec before changing screens. Prefer the latest user-approved navigation over historical tab labels. Apply a single semantic token source; role variants change density and size, not save/share/reward meanings.

For each S feature, identify reused components, new component responsibilities, role/context, one primary action, an alternative/later action, input provenance, audience, and persistent state. Keep record, sharing and reward receipt as independent state domains. Preserve input on failed saves; wait for durable acknowledgment before success. Show actual content and recipients before consequential confirmation.

When implementing the feature, add only its relevant Storybook states and test the underlying behavior with Testing Library and Playwright. Check 320/390/768px, 200% text, keyboard/focus, role-appropriate sizes and reduced motion. Use axe as one check alongside manual reading. Attach S, F/C/P/G, motion and acceptance references in review evidence.

Review a generated concept image as visual inspiration only. Do not use image typography, simulated status or decorative color as a source of truth. Implement text and buttons as accessible live elements. Do not create a second full UI system because a new feature looks different. Update the common contract deliberately when a shared meaning changes.

This project reference consolidates existing role/motion rules and the current feature organization; it is not an official framework skill or proof of user-tested usability.
