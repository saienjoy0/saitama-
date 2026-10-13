---
name: yattemi-market-validation-harness
description: Research and stress-test four Yattemi Quest offers against four behavioral ICPs using evidence, real-world tests, and bounded DeepSeek Harness iterations.
---

# Yattemi market validation harness

## Trigger
Use when asked for market sizing, customer identification, acquisition, pricing, retention, failure scenarios, competitive marketing, or comparing the four go-to-market proposals.

## Authority and preflight
1. Read AGENTS.md, CURRENT.md, current/PROJECT_STATE.json, docs/workflow/REFERENCE_BEFORE_CHANGE.md.
2. Read market-harness/README.md and config.json, then the five repository research files listed there; read the unmerged product PR #10/#11/#12/#14/#21 when available.
3. Workstream: customer validation and marketing research ONLY. Product remains DESIGN/D90. Do not update PRODUCT_STATE/REVIEW_BUNDLE/AGENTS/main during this task. Use a review PR.
4. Existing 10-family recruitment quota R1=4,R2=2,R3=2,R4=2 is immutable; new R/O/F/B is assessed **after** interviews, not a recruiting gate.
5. Keep the user-supplied product definition, not a narrower card-only money app.

## Workflow
- Run: python3 market-harness/runner.py prepare --repo .
- Read the matrix, source ledger and 16 cell briefs. On missing documents, retrieve their authoritative GitHub file before making claims; do not count a file URL as read.
- From each verified source extract exact source/date/target/measure and limits. Claims from a publication are not interviews with product users.
- Compare all four offers across all four customer types, including existing alternatives (spoken conversation, LINE, J-FLEC, generic AI, existing banking and photo apps).
- Examine each funnel stage: eligible market→reach→click→trial start→first **actual** action→unprompted second action→parent workload→real payment→4-week continuation→cancel.
- Independently red-team the best offer; do not optimize a sales claim by inventing market size or willingness to pay.
- Run at most 4 cells × 1 AI round first. No unbounded Ralph/Goal loop. No verified new evidence => stop and request specific real-world observation.
- Every model result is SYNTHETIC; never label persona dialogue as real customers, customer quotes or actual payment.
- Save the checked source and dissenting alternatives alongside conclusions. Never edit existing project sources to make the outcome fit.

## Critique questions
- Does the parent have an unsolved problem and has actually searched, paid or spent time to address it?
- Could a free resource / GoHenry / money ring / LINE / simple allowance rule do enough?
- Can the child safely start and keep using it without shame, pressure, or surveillance?
- Does the parent have to approve so many things that the app increases work?
- Does the child try a *second* real-world action without repeated parent prompting?
- Does the grandparent add incremental value or simply recreate free family sharing?
- Is there observed payment from the payer, not merely saying education is important?

## Stopping conditions
Stop when (a) model budget is consumed, (b) no independent evidence adds information after a challenge pass, (c) family interactions or payment are needed, or (d) consent/safety or provider license terms are unresolved. Never loop forever.

## Outputs
A run contains 16-cell matrix, SHA-256 source ledger, 16 prompt files, state.json, optional unverified model responses. Transfer only de-identified evidence-backed findings to research/; do not commit child data, credentials, raw interviews, model secrets or private accounts.

## Human approval
Never contact families, change pricing, publish LP or ads, spend money, collect child data, or make product changes automatically. Create proposed scripts/experiments and request explicit permission via Work for those actions.
