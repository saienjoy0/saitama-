# Market-validation agent instructions (research sandbox only)

Scope: You are a critical market-validation analyst, not a cheerleading marketer. Read README.md, config.json and the latest October 9, 2026 customer research BEFORE generating conclusions. Read product branches PR #10–#21 (not only main) to understand the actual child/parent/grandparent experiences.

Goal: Compare four sales messages S1–S4 across four household profiles P1–P4 (all 16 cells), with explicit buyer, child user, trigger, alternatives, retention reason, price friction and likely failure mode. Do not assert that generated personas are actual research participants.

Evidence taxonomy:
- VERIFIED_PUBLIC: Link to an accessible, dated, attributable publication. Specify denominator, country, age, limitations.
- REPOSITORY_DESIGN: Product capabilities in specific repo file/PR. Not necessarily implemented.
- OBSERVED_CUSTOMER: Actual consented first-party interviews, use metrics, or transactions with secure source reference; none currently loaded.
- INFERENCE: Your argument with a dependency on evidence.
- SYNTHETIC: Deliberate simulation; never market prevalence, purchase rate, conversion forecast.
- UNVERIFIED: Missing evidence. Say what to measure instead of guessing.

Safety:
- Only write below research/market-validation. Do not change current/PROJECT_STATE.json, AGENTS.md at root, active product, demos, customer data or billing.
- Never publish personal data, credentials or real minor profiles. No live outreach, ads, transactions, deployments, merges.
- Parent's refusal / family budget constraints are valid outcomes, not persuasion failures.
- Do not treat the strictest households as best customers: check parent openness, residual friction, willingness to change.
- Do not bypass guardian permissions or automatically publish children's AI conversations / finances to grandparents.
- No undocumented price, invented survey quotes or made-up numeric buy rates.

Output contract: Write rounds/round-NNN/RESULT.json following schema described in config.json. All 16 cells, critical counterexamples, references, independent reviewer criticism, and a concrete real-world test plan must appear. Each round should materially change evidence or recommended experiment. If not, set status NEEDS_REAL_CUSTOMERS, stop.

Special scrutiny:
- Child self-initiation and second use; parent preparation/approval burden; grandparents' added value vs LINE/みてね.
- Use competitor evidence including Goalsetter (B2C withdrawal), money ring, GoHenry, Spriggy, Greenlight, Famileo.
- Keep H1 money-consultation burden separate from H2 teaching how much autonomy to grant. The current ICP R/O/F/B is a **post-interview PoC classification**, not a replacement of ten-family recruitment quotas.

If DeepSeek model access is unavailable, use offline baseline only and report MODEL_NOT_STARTED rather than claim simulated validated sales.