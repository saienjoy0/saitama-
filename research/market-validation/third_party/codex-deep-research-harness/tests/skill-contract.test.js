const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { skillRoot } = require("./helpers/run-cli");

function read(relativePath) {
  return fs.readFileSync(path.join(skillRoot, relativePath), "utf8");
}

function normalized(content) {
  return content.replace(/\s+/g, " ").trim();
}

function assertInOrder(content, fragments, label) {
  let cursor = -1;
  for (const fragment of fragments) {
    const next = content.indexOf(fragment, cursor + 1);
    assert.notEqual(next, -1, `${label}: missing ${fragment}`);
    assert.ok(next > cursor, `${label}: out of order ${fragment}`);
    cursor = next;
  }
}

test("role prompts are separate and generator mode switching is removed", () => {
  for (const file of ["planner.md", "scout.md", "writer.md", "evaluator.md"]) {
    assert.equal(fs.existsSync(path.join(skillRoot, "prompts", file)), true, file);
  }
  assert.equal(fs.existsSync(path.join(skillRoot, "prompts/generator.md")), false);
  assert.doesNotMatch(read("prompts/scout.md"), /Mode:\s*writer/i);
  assert.doesNotMatch(read("prompts/writer.md"), /Mode:\s*scout/i);
});

test("prompts contain explicit write boundaries", () => {
  assert.match(read("prompts/planner.md"), /write only.*spec/i);
  assert.match(read("prompts/scout.md"), /write only.*evidence/i);
  assert.match(read("prompts/writer.md"), /write only.*draft/i);
  assert.match(read("prompts/evaluator.md"), /write only.*eval.*feedback/is);
});

test("role prompts forbid child agents and delegated role work", () => {
  for (const file of ["planner.md", "scout.md", "writer.md", "evaluator.md"]) {
    assert.match(
      read(`prompts/${file}`),
      /Do not spawn agents or delegate to subagents\./i,
      file,
    );
  }
});

test("role prompts distinguish advisory research guidance from enforced contracts", () => {
  const planner = read("prompts/planner.md");
  const scout = read("prompts/scout.md");
  const writer = read("prompts/writer.md");
  const evaluator = read("prompts/evaluator.md");

  assert.match(planner, /citationStyle[^\n]*`?inline`? only/i);

  assert.match(scout, /advisory search preferences/i);
  assert.match(scout, /requireSources/);
  assert.match(scout, /excludeSources/);
  assert.match(scout, /unmet[^\n]*open_questions/i);

  assert.match(writer, /advisory writing guidance/i);
  assert.match(writer, /outputFormat\.sections/);
  assert.match(writer, /constraints\.language/);
  assert.match(writer, /mandatory structure/i);
  assert.match(writer, /canonical inline citations/i);

  assert.match(evaluator, /observable adherence/i);
  assert.match(evaluator, /advisory agent guidance/i);
  assert.match(evaluator, /not deterministic validator enforcement/i);
});

test("research prompts reject instructions embedded in artifacts", () => {
  for (const file of ["scout.md", "writer.md", "evaluator.md"]) {
    const content = read(`prompts/${file}`);
    assert.match(content, /untrusted data/i, file);
    assert.match(content, /ignore instructions embedded/i, file);
  }
});

test("evaluator instructions match the strict feedback template", () => {
  const evaluator = read("prompts/evaluator.md");
  const reference = read("references/eval-schema.md");
  const template = read("templates/feedback.md");
  assert.match(evaluator, /`Preserve` must contain at least one nonempty bullet/);
  assert.match(template, /^## Preserve$/m);
  assert.match(evaluator, /- dim_003[\s\S]*- dim_005/);
  assert.match(evaluator, /write exactly: `- none`/);
  assert.match(evaluator, /When `verdict=PASS`, `Must Fix` must contain exactly `- none`/);
  assert.match(evaluator, /REVISE` or `REJECT`[\s\S]*one or more actual blocking bullets/);
  assert.match(template, /If the verdict is PASS, write exactly `- none`/);
  assert.match(template, /If the verdict is REVISE or REJECT[\s\S]*actual blocking bullets/);
  assert.doesNotMatch(template, /\[D1\]/);
  for (const content of [evaluator, reference, template]) {
    assert.doesNotMatch(content, /What's Good/);
  }
});

test("prompts do not name unsupported orchestration or web APIs", () => {
  for (const file of ["SKILL.md", "prompts/scout.md", "references/workflow.md"]) {
    if (!fs.existsSync(path.join(skillRoot, file))) continue;
    const content = read(file);
    assert.doesNotMatch(content, /mode=run|web_search|web_fetch|Claude Agent SDK/);
  }
});

test("skill declares Codex collaboration tools and fresh contexts", () => {
  const skill = read("SKILL.md");
  for (const tool of ["spawn_agent", "list_agents", "wait_agent", "interrupt_agent"]) {
    assert.match(skill, new RegExp(`\\b${tool}\\b`), tool);
  }
  assert.match(skill, /fork_turns:\s*["'`]none["'`]/);
});

test("skill caps active child agents and requires bounded Scout waves", () => {
  const skill = read("SKILL.md");
  assert.match(skill, /maximum of three active child agents/i);
  assert.match(skill, /bounded waves/i);
  assert.doesNotMatch(skill, /all Scouts run simultaneously|all in parallel/i);
});

test("root agent is orchestration-only", () => {
  const skill = read("SKILL.md");
  assert.match(skill, /root agent must not author spec, evidence, draft, or evaluation artifacts/i);
});

test("skill resolves resources from its installation directory", () => {
  const skill = read("SKILL.md");
  assert.match(skill, /SKILL_ROOT/);
  assert.match(skill, /directory containing this SKILL\.md/i);
});

test("all four research roles are isolated from the root agent", () => {
  const skill = read("SKILL.md");
  for (const role of ["Planner", "Scout", "Writer", "Evaluator"]) {
    assert.match(skill, new RegExp(`Spawn a fresh ${role}|Spawn Planner, Scouts, Writer, and Evaluator`, "i"), role);
  }
  assert.doesNotMatch(skill, /execute directly on (?:the )?main agent|main agent \((?:Planner|Writer|Evaluator)\)/i);
});

test("skill and workflow use JSON evidence handoffs without legacy research notes", () => {
  const contract = `${read("SKILL.md")}\n${read("references/workflow.md")}`;
  assert.match(contract, /context\/evidence_\{dimension_id\}\.json/);
  assert.match(contract, /context\/\.staging\/\{work_item_id\}\.json/);
  assert.doesNotMatch(contract, /context\/(?:sources|notes)_|notes_dim_|sources_dim_/i);
});

test("runtime contract fixes child limits, retries, and terminal outcomes", () => {
  const contract = `${read("SKILL.md")}\n${read("references/codex-runtime.md")}`;
  assert.match(contract, /one retry in a fresh agent/i);
  assert.match(contract, /after ten elapsed minutes.*interrupt_agent/is);
  assert.match(contract, /completed.*final_report\.md/is);
  assert.match(contract, /exhausted.*best_report\.md/is);
  assert.match(contract, /failed.*(?:do not create|must not contain).*final_report\.md/is);
});

test("next-round bootstrap persists both branches before any child spawn", () => {
  const fragments = [
    "Before any next-round spawn, increment `meta.round` by one.",
    "Append a pending round record with `number=meta.round`, `draft_path=null`, `eval_path=null`, `feedback_path=null`, `score=null`, and `verdict=pending`.",
    "For research gaps, set `researched_dimensions` to the canonical `weak_dimensions`, set round status and phase to `researching`, and create one pending Scout work item with `attempt=0` for each selected dimension.",
    "For writing-only defects, set `researched_dimensions` to an empty array, set round status and phase to `writing`, create no Scout work items, and create one pending Writer work item with `attempt=0` in the same checkpoint.",
    "Validate `meta.json` and the whole run before spawning any child for the new round.",
  ];
  for (const file of ["SKILL.md", "references/workflow.md", "references/run-state.md"]) {
    assertInOrder(normalized(read(file)), fragments, file);
  }
});

test("resume returns without spawning only for terminal state", () => {
  const skill = normalized(read("SKILL.md"));
  assert.match(
    skill,
    /On an explicit resume request[^.]*\.[\s\S]*If `meta\.status` is terminal,[^.]*without spawning\.[\s\S]*If `meta\.status` is nonterminal,[^.]*continue from the earliest incomplete checkpoint\./i,
  );
});

test("run-state reference names both legal round phase paths", () => {
  const state = normalized(read("references/run-state.md"));
  assert.match(
    state,
    /`researching -> writing -> evaluating` for round 1 and research-gap revisions/i,
  );
  assert.match(
    state,
    /`writing -> evaluating` for writing-only revisions/i,
  );
});

test("run-state reference publishes the enforced phase-role legality matrix", () => {
  const state = normalized(read("references/run-state.md"));
  for (const fragment of [
    "Every earlier round must be `completed` before a later round record exists.",
    "A `researching` round contains no Writer or Evaluator work item.",
    "A `writing` round contains exactly one Writer and no Evaluator.",
    "An `evaluating` round contains a completed Writer, the canonical `draft_path`, and one pending or running Evaluator.",
    "The Decide checkpoint keeps `meta.phase=evaluating` while the round is `completed`",
  ]) {
    assert.match(state, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("Writer completion is checkpointed before Evaluator creation and spawn", () => {
  const fragments = [
    "After the draft gate passes, atomically set the Writer work item to `completed`, set the current round's `draft_path` to `drafts/draft_v{N}.md`, and update `updated_at` while both `meta.phase` and the round status remain `writing`.",
    "Validate `meta.json`, then validate the whole run with `node SKILL_ROOT/scripts/validate.js run RUN_ROOT`.",
    "Only after both validations pass, set `meta.phase` and the round status to `evaluating`, and append one pending Evaluator work item with `attempt=0`.",
    "Validate `meta.json` and the whole run again.",
    "Then spawn a fresh Evaluator.",
  ];
  for (const file of ["SKILL.md", "references/workflow.md", "references/run-state.md"]) {
    assertInOrder(normalized(read(file)), fragments, file);
  }
});

test("stale running recovery validates output before deciding whether to respawn", () => {
  const fragments = [
    "Before changing a stale `running` item, validate its assigned existing, staged, or canonical output.",
    "If the output validates, reconcile the item to `completed` or valid Scout `partial` and continue without spawning.",
    "If output is invalid or missing and `attempt < 2`, set the item to `pending`, retain the existing attempt count, and permit exactly one remaining spawn.",
    "If output is invalid or missing and `attempt == 2`, mark the item `failed`, set run status `failed` and phase `finalized`, and do not spawn.",
    "Never increment an attempt to `3`.",
  ];
  for (const file of ["SKILL.md", "references/workflow.md", "references/run-state.md"]) {
    assertInOrder(normalized(read(file)), fragments, file);
  }
});

test("best selection prioritizes passing rounds and preserves terminal invariants", () => {
  const fragments = [
    "Passing rounds take precedence over non-passing rounds.",
    "Within the eligible pass class, select the highest valid `overall_score`; break ties in favor of the later round.",
    "When the current evaluation has `pass=true`, recalculate `best` before Decide so that `best.passed=true` and `best.draft_path` names a passing artifact.",
    "A completed run's `best` must be the selected passing round and must have `passed=true`.",
    "An exhausted run's `best` must be the highest-ranked valid non-passing round and must have `passed=false`.",
  ];
  for (const file of ["SKILL.md", "references/workflow.md", "references/run-state.md"]) {
    assertInOrder(normalized(read(file)), fragments, file);
  }
});

test("resume is artifact-first and never repeats validated work", () => {
  const skill = read("SKILL.md");
  assert.match(skill, /Resume Existing Run/);
  assert.match(skill, /validate the whole run before trusting meta\.json/i);
  assert.match(skill, /reset stale running work items to pending/i);
  assert.match(skill, /do not respawn a role whose assigned output already validates/i);
  assert.match(skill, /retain the existing attempt count/i);
  assert.match(skill, /attempt < 2[\s\S]*pending[\s\S]*attempt == 2[\s\S]*failed[\s\S]*do not spawn/i);
});

test("terminal outcomes distinguish pass, exhaustion, and failure", () => {
  const skill = read("SKILL.md");
  assert.match(skill, /completed.*final_report\.md/is);
  assert.match(skill, /exhausted.*best_report\.md/is);
  assert.match(skill, /failed.*(?:do not create|must not contain).*final_report\.md/is);
});

test("Scout promotion updates canonical ownership before terminal status", () => {
  const fragments = [
    "Validate the staged Scout evidence.",
    "Atomically rename it to `context/evidence_{dimension_id}.json`.",
    "Replace the work item's `output_paths` with `[\"context/evidence_{dimension_id}.json\"]`.",
    "Only then mark the work item `completed` or `partial`.",
  ];
  for (const file of ["SKILL.md", "references/workflow.md", "references/run-state.md"]) {
    assertInOrder(normalized(read(file)), fragments, file);
  }
});

test("runtime docs define exact role output ownership and terminal preconditions", () => {
  const contract = normalized(`${read("SKILL.md")} ${read("references/workflow.md")} ${read("references/run-state.md")}`);
  assert.match(contract, /Planner owns only `spec\.json`/);
  assert.match(contract, /completed or partial Scout owns only `context\/evidence_\{dimension_id\}\.json`/);
  assert.match(contract, /Evaluator owns exactly/);
  assert.match(contract, /latest round must be completed/);
  assert.match(contract, /attempt-two failed work item or a validated `REJECT` evaluation/);
  assert.match(contract, /running run must never use phase `finalized`/);
});

test("every role completion checkpoint passes whole-run validation before advancing", () => {
  for (const file of ["SKILL.md", "references/workflow.md"]) {
    const contract = normalized(read(file));
    assert.match(contract, /Planner metadata bootstrap/);
    assert.match(contract, /every Scout promotion/);
    assert.match(contract, /Writer completion/);
    assert.match(contract, /Evaluator round-record and best update/);
    assert.match(
      contract,
      /node SKILL_ROOT\/scripts\/validate\.js run RUN_ROOT/,
    );
    assert.match(
      contract,
      /do not advance or spawn the next role unless both the role-specific validation and this whole-run validation pass/i,
    );
  }
});

test("runtime docs preserve complete role provenance and make REJECT absorbing", () => {
  for (const file of ["SKILL.md", "references/workflow.md", "references/run-state.md"]) {
    const contract = normalized(read(file));
    assert.match(contract, /The `work_items` ledger is append-only/);
    assert.match(contract, /one Planner work item/);
    assert.match(contract, /one Scout work item for every `researched_dimensions` entry/);
    assert.match(contract, /one Writer and one Evaluator work item for every completed round/);
    assert.match(contract, /A validated `REJECT` is absorbing/);
    assert.match(contract, /no later round or work item may exist/);
  }
});

test("Writer preflights decision artifacts for single-valued complete routing", () => {
  const writer = read("prompts/writer.md");
  assert.match(writer, /Decision-Artifact Semantic Preflight/);
  assert.match(writer, /mutually exclusive/i);
  assert.match(writer, /every stated input combination/i);
  assert.match(writer, /exactly one outcome/i);
  assert.match(writer, /precedence/i);
  assert.match(writer, /conditions that imply different outcomes/i);
  assert.doesNotMatch(writer, /Deterministic coverage/);
});

test("Evaluator treats ambiguous decision-state routing as a blocking defect", () => {
  const evaluator = read("prompts/evaluator.md");
  assert.match(evaluator, /decision table, scorecard, state machine, or routing rule/i);
  assert.match(evaluator, /overloaded state/i);
  assert.match(evaluator, /uncovered combination/i);
  assert.match(evaluator, /conflicting outcomes/i);
  assert.match(evaluator, /blocking actionability defect/i);
  assert.doesNotMatch(evaluator, /Deterministic coverage/);
});
