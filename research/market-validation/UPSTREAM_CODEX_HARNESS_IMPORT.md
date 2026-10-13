# Vendored research harness — pinned upstream source, not yet Work-integrated

Original repository: https://github.com/kaiqiangh/deep-research-harness
Pinned commit: 14796e5baae6f7b23cf8a26673c44d029d6eb5f7
License: MIT. Original LICENSE included verbatim at `research/market-validation/third_party/codex-deep-research-harness/LICENSE`.
Imported 45 files including full upstream tests and Node.js validators; files are copied without source modification. GitHub REST's blob SHA was checked against the upstream Git tree for the initial 40 files, and the remaining test files use fetch_file content from the same pinned commit.

**This is an inactive reference copy, not a running ChatGPT Work harness.** Upstream SKILL.md requires Codex agent-collaboration tools, isolated child contexts, Node 20+, npm/ajv, and an absolute local run directory. ChatGPT Work's tooling is a different execution surface, and no Work 48-round success is claimed.

Recommended reuse: pinned schemas, claim/evidence and source-reference validators, append-only handoff/checkpoint contracts, evaluator rubric, failure/exhaustion semantics, resume tests. Adapt the runner to Work + GitHub checkpointing and validate with one real Work round before enabling it. Prefer direct calls to upstream validators where contract is compatible instead of rewriting them.

Follow-up: add an isolated CI job to run `npm ci --ignore-scripts && npm test` in the upstream vendor root; build a Work result adapter; validate an actual Work→GitHub→CI→different Work resume. Until then existing `work48.py` is the active research controller.

No DeepSeek/OpenAI external model API calls, actual sales, advertising, child personal information or auto-merge are authorized.
