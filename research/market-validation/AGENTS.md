# ChatGPT Work market-validation instructions (research-only)

**Execution agent = ChatGPT in Work.** DeepSeek/model API/deepseek-harness CLI are not a dependency. The repository provides DeepSeek-inspired structured goal/round/handoff/stop gates, implemented as files plus a pure-Python validator.

Before starting a 48-round public research task: read WORK48_PUBLIC_RESEARCH_START.md, WORK48_START.md and work48_plan.json. For final synthesis read WORK_START.md, README.md, config.json, 2026-10-09 customer docs and newest product PR #10–#21. Existing research/design skills are optional methodology references, not other LLM runtimes.

Objective: rigorously compare all 16 P1–P4 household × S1–S4 sales-message combinations, emphasizing willingness and ability to buy rather than generic praise. Distinguish H1 consult-friction from H2 autonomy teaching, and include grandparents' self-initiated daily posts, not only receiving a family newspaper.

Role sequence **inside the same Work run**:
- Researcher: attributable and dated research, direct customer evidence when accessible.
- Critic: aggressively identify alternatives, buyer/user split, security and autonomy risks, likely failure, price resistance.
- Strategist: change only testable hypotheses, propose specific landing page/message, initial experience, price and next action.
- Auditor: double-check each claim/source and all 16 cells, refuse invented market share or conversion rates.

Evidence classification:
- VERIFIED_PUBLIC: directly cited dated public primary source; disclose sample and applicability.
- REPOSITORY_DESIGN: repo feature / PR with design vs demo vs production status.
- OBSERVED_CUSTOMER: consented real interview/use/payment; currently none loaded.
- INFERENCE: conditional conclusion based on referenced facts.
- SYNTHETIC: role-play only, cannot establish purchases or conversion.
- UNVERIFIED: no direct evidence.

Adversarial requirements:
1. Is problem salient enough to overcome free ChatGPT/LINE/parent-child dialogue?
2. Could fixed allowance, paper budgets, or money ring solve it already?
3. Why would the child voluntarily start a second real-world quest?
4. How much new approval/input burden does a parent incur?
5. Does a child who fears discussing money have genuine privacy and choice?
6. Why is grandparent participation better than LINE/みてね, and whose money buys the gift?
7. Is four-week ¥980 payment supported by action rather than intentions?

Work must not push personal/child data or make real payments, outreach, ads, deployments, merges. Current main product design is DESIGN/D90; do not touch it. No customer-level data access unless authorized through separate appropriate secure source.

Write only round results/state and related market-validation research files; edits to this Work workflow itself require user's request (this turn authorized migration). On no new evidence, stop at NEEDS_REAL_CUSTOMERS. A repeated synthetic role-play does not increase evidence. Legacy 16-cell synthesis is max 3 rounds. Separate work48.py has 48 distinct DESK-ONLY public research tasks and per-round checkpoints; never claim 48 actual Work runs before files are saved and verified. Legacy NEEDS_REAL_CUSTOMERS blocks new sales claims / legacy summaries, not unrelated public competitive research. A six-BLOCKED streak warns of missing evidence but does not halt separate future desk subjects.

## Acceptance criteria (updated after 48-pass review)
- READ `WORK_DESIGN_REVIEW_20261010.md` before research; the previous P2>S2 ranking must be challenged, not confirmed.
- Treat P1/P2/P3 as overlapping needs, and P4 as a participation/gift-payer dimension, not mutually exclusive market segments.
- First round must finish audit + recommendation + dated, measurable field-experiment plan even without new public findings.
- Four mandatory saved artifacts: `reports/evidence-audit.md`, `reports/work-decision-memo.md`, `reports/experiment-plan.md`, `rounds/round-001/RESULT.json`.
- `harness.py verify` checks referenced sources exist, all 16 unique P×S cells, 3+ credible objections, 3+ field tests, and decision reports. It cannot establish the truth of claims: **manually verify** each central claim in primary sources.
- Preserve child's safety/permission; protect family-level and underage sensitive data in any uploaded evidence.
- Interim presentation on 2026-10-16: show only what was actually completed by that date; if the Work run starts later, treat that date as past, not an upcoming deadline.

**There is no automatic Work scheduler here**; the user starts the Work task. Do not promise background completion from this file alone.
