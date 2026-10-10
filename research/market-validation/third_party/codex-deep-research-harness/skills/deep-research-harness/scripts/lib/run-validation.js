const fs = require("node:fs");
const path = require("node:path");
const { validateJsonFile } = require("./json-schema");
const { validateSpecSemantics } = require("./spec-validation");
const { validateEvidenceSemantics } = require("./evidence-validation");
const { validateEvalSemantics } = require("./eval-validation");
const { validateDraftMarkdown, validateFeedbackMarkdown } = require("./markdown-validation");

function resolveInside(runRoot, relativePath) {
  const lexicalRoot = path.resolve(runRoot);
  const lexicalTarget = path.resolve(lexicalRoot, relativePath);
  const lexicalPrefix = `${lexicalRoot}${path.sep}`;
  if (lexicalTarget !== lexicalRoot && !lexicalTarget.startsWith(lexicalPrefix)) {
    throw new Error(`path ${relativePath} escapes run root`);
  }

  const realRoot = fs.realpathSync(lexicalRoot);
  let existingAncestor = lexicalTarget;
  while (existingAncestor !== lexicalRoot) {
    try {
      fs.lstatSync(existingAncestor);
      break;
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      existingAncestor = path.dirname(existingAncestor);
    }
  }

  let realAncestor;
  try {
    realAncestor = fs.realpathSync(existingAncestor);
  } catch (error) {
    throw new Error(`path ${relativePath} cannot be resolved safely: ${error.message}`);
  }
  const realPrefix = `${realRoot}${path.sep}`;
  if (realAncestor !== realRoot && !realAncestor.startsWith(realPrefix)) {
    throw new Error(`path ${relativePath} escapes run root through a symlink`);
  }

  const canonicalAncestor = path.join(lexicalRoot, path.relative(realRoot, realAncestor));
  return path.resolve(canonicalAncestor, path.relative(existingAncestor, lexicalTarget));
}

function samePaths(actual, expected) {
  return actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function feedbackTaskId(feedback) {
  return feedback.split(/\r?\n/, 1)[0]
    .match(/^# Feedback: (.+) - Round [1-9]\d*$/)?.[1] || null;
}

function addResult(errors, label, result) {
  for (const error of result.errors) errors.push(`${label}: ${error}`);
}

function sameNumber(left, right) {
  return Math.abs(left - right) <= 0.011;
}

function selectBest(candidates) {
  return [...candidates].sort((left, right) => (
    Number(right.passed) - Number(left.passed)
      || right.score - left.score
      || right.round - left.round
  ))[0] || null;
}

function bestMatches(recorded, selected) {
  if (recorded === null || selected === null) return recorded === selected;
  return recorded.round === selected.round
    && recorded.draft_path === selected.draft_path
    && recorded.eval_path === selected.eval_path
    && sameNumber(recorded.score, selected.score)
    && recorded.passed === selected.passed;
}

function readText(filePath, label, errors) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }
}

function validateEvidenceDirectory(runRoot, spec, meta, requireCompleteSet, errors) {
  let contextDirectory;
  try {
    contextDirectory = resolveInside(runRoot, "context");
  } catch (error) {
    errors.push(`context: ${error.message}`);
    return [];
  }
  let names;
  try {
    names = fs.readdirSync(contextDirectory).sort();
  } catch (error) {
    errors.push(`context: ${error.message}`);
    return [];
  }

  const canonicalPattern = /^evidence_(dim_[0-9]{3})\.json$/;
  const evidenceJsonNames = names.filter((name) => /^evidence_.*\.json$/.test(name));
  const canonicalNames = evidenceJsonNames.filter((name) => canonicalPattern.test(name));
  const expectedDimensions = spec.dimensions.map((dimension) => dimension.id);
  const expectedSet = new Set(expectedDimensions);
  const evidenceFiles = [];

  for (const name of evidenceJsonNames.filter((candidate) => !canonicalPattern.test(candidate))) {
    errors.push(`context: unexpected evidence JSON filename ${name}; expected evidence_dim_NNN.json`);
  }

  for (const name of canonicalNames) {
    let filePath;
    try {
      filePath = resolveInside(runRoot, `context/${name}`);
    } catch (error) {
      errors.push(`${name}: ${error.message}`);
      continue;
    }
    const result = validateJsonFile("evidence", filePath);
    addResult(errors, name, result);
    if (!result.valid) continue;

    const filenameDimension = canonicalPattern.exec(name)[1];
    if (filenameDimension !== result.data.dimension_id) {
      errors.push(`${name}: filename dimension ${filenameDimension} does not match payload dimension ${result.data.dimension_id}`);
    }
    if (!expectedSet.has(result.data.dimension_id)) {
      errors.push(`${name}: payload dimension ${result.data.dimension_id} does not exist in spec`);
    }
    if (result.data.task_id !== meta.task_id) {
      errors.push(`${name}: task_id ${result.data.task_id} does not match meta.task_id ${meta.task_id}`);
    }
    if (result.data.round > meta.round) {
      errors.push(`${name}: evidence round ${result.data.round} exceeds meta.round ${meta.round}`);
    }
    for (const error of validateEvidenceSemantics(result.data, spec)) errors.push(`${name}: ${error}`);
    evidenceFiles.push({ name, data: result.data });
  }

  const payloadNames = new Map();
  for (const evidence of evidenceFiles) {
    const existing = payloadNames.get(evidence.data.dimension_id) || [];
    existing.push(evidence.name);
    payloadNames.set(evidence.data.dimension_id, existing);
  }
  for (const [dimensionId, matchingNames] of payloadNames) {
    if (matchingNames.length > 1) {
      errors.push(`duplicate evidence payload for dimension ${dimensionId}: ${matchingNames.sort().join(", ")}`);
    }
  }

  if (requireCompleteSet) {
    for (const dimensionId of expectedDimensions) {
      const expectedName = `evidence_${dimensionId}.json`;
      if (!canonicalNames.includes(expectedName)) errors.push(`missing evidence for ${dimensionId}`);
    }
  }
  for (const name of canonicalNames) {
    const filenameDimension = canonicalPattern.exec(name)[1];
    if (!expectedSet.has(filenameDimension)) errors.push(`unexpected evidence file ${name} for unknown dimension ${filenameDimension}`);
  }

  return evidenceFiles.map((evidence) => evidence.data);
}

function validateRoundPaths(runRoot, round, errors) {
  const resolved = {};
  for (const field of ["draft_path", "eval_path", "feedback_path"]) {
    if (round[field] === null) continue;
    try {
      resolved[field] = resolveInside(runRoot, round[field]);
    } catch (error) {
      errors.push(`round ${round.number}: ${error.message}`);
    }
  }
  return resolved;
}

function validateRoundShape(round, spec, errors) {
  const knownDimensions = new Set(spec.dimensions.map((dimension) => dimension.id));
  const expectedPaths = {
    draft_path: `drafts/draft_v${round.number}.md`,
    eval_path: `evals/eval_v${round.number}.json`,
    feedback_path: `feedback/feedback_v${round.number}.md`,
  };
  for (const [field, expected] of Object.entries(expectedPaths)) {
    if (round[field] !== null && round[field] !== expected) {
      errors.push(`round ${round.number} ${field} must be ${expected}`);
    }
  }
  for (const dimensionId of round.researched_dimensions) {
    if (!knownDimensions.has(dimensionId)) errors.push(`round ${round.number} references unknown researched dimension ${dimensionId}`);
  }
  if (round.eval_path !== null && round.draft_path === null) {
    errors.push(`round ${round.number} eval_path requires draft_path`);
  }
  if (round.feedback_path !== null && round.eval_path === null) {
    errors.push(`round ${round.number} feedback_path requires eval_path`);
  }

  if (round.status === "completed") {
    for (const field of ["draft_path", "eval_path", "feedback_path", "score"]) {
      if (round[field] === null) errors.push(`completed round ${round.number} requires ${field}`);
    }
    if (round.verdict === "pending") errors.push(`completed round ${round.number} requires a terminal verdict`);
  } else {
    if (round.score !== null || round.verdict !== "pending") {
      errors.push(`incomplete round ${round.number} must keep score null and verdict pending`);
    }
    if (round.status === "researching" && [round.draft_path, round.eval_path, round.feedback_path].some((value) => value !== null)) {
      errors.push(`researching round ${round.number} must not record draft, eval, or feedback paths`);
    }
    if (round.status === "writing" && (round.eval_path !== null || round.feedback_path !== null)) {
      errors.push(`writing round ${round.number} must not record eval or feedback paths`);
    }
  }
}

function validateDraftIdentity(draft, round, meta, errors) {
  const taskId = draft.match(/^task_id:[ \t]*(.*)$/m)?.[1]?.trim();
  const draftRound = draft.match(/^round:[ \t]*(.*)$/m)?.[1]?.trim();
  if (taskId && taskId !== meta.task_id) {
    errors.push(`round ${round.number} draft task_id ${taskId} does not match meta.task_id ${meta.task_id}`);
  }
  if (draftRound && Number(draftRound) !== round.number) {
    errors.push(`round ${round.number} draft frontmatter round must equal ${round.number}`);
  }
}

function validateWorkItemContracts(meta, spec, errors) {
  const rounds = new Map(meta.rounds.map((round) => [round.number, round]));
  const knownDimensions = spec
    ? new Set(spec.dimensions.map((dimension) => dimension.id))
    : null;

  for (const item of meta.work_items) {
    if (item.status === "partial" && item.role !== "scout") {
      errors.push(`work item ${item.id}: only a Scout may have partial status`);
    }
    if (item.round > meta.round) {
      errors.push(`work item ${item.id} round ${item.round} exceeds meta.round ${meta.round}`);
    }

    const allowedAttempts = item.status === "pending"
      ? [0, 1]
      : item.status === "failed"
        ? [2]
        : [1, 2];
    if (!allowedAttempts.includes(item.attempt)) {
      const expectation = item.status === "pending"
        ? "0 or 1"
        : item.status === "failed"
          ? "2"
          : "1 or 2";
      errors.push(`${item.status} work item ${item.id} attempt must be ${expectation}`);
    }

    if (item.role === "planner") {
      if (item.id !== "planner") errors.push("Planner id must be planner");
      if (item.dimension_id !== null) errors.push("Planner dimension_id must be null");
      if (item.round !== 0) errors.push("Planner round must be 0");
      if (!samePaths(item.output_paths, ["spec.json"])) {
        errors.push('Planner output_paths must be exactly ["spec.json"]');
      }
      continue;
    }

    const round = rounds.get(item.round);
    if (!round) errors.push(`work item ${item.id} has no matching round record`);

    if (item.role === "scout") {
      const expectedId = `round-${item.round}-scout-${item.dimension_id}`;
      if (item.id !== expectedId) errors.push(`Scout id must be ${expectedId}`);
      if (item.dimension_id === null) {
        errors.push("Scout dimension_id must name an assigned dimension");
      } else {
        if (knownDimensions && !knownDimensions.has(item.dimension_id)) {
          errors.push(`Scout dimension ${item.dimension_id} does not exist in spec`);
        }
        if (round && !round.researched_dimensions.includes(item.dimension_id)) {
          errors.push(`Scout dimension ${item.dimension_id} is not selected in round ${item.round}`);
        }
      }

      const promoted = ["completed", "partial"].includes(item.status);
      const expectedPath = promoted
        ? `context/evidence_${item.dimension_id}.json`
        : `context/.staging/${item.id}.json`;
      if (!samePaths(item.output_paths, [expectedPath])) {
        errors.push(promoted
          ? "terminal Scout output_paths must be exactly its canonical evidence path"
          : "active Scout output_paths must be exactly its staging path");
      }
      continue;
    }

    if (item.dimension_id !== null) {
      errors.push(`${item.role === "writer" ? "Writer" : "Evaluator"} dimension_id must be null`);
    }

    if (item.role === "writer") {
      const expectedId = `round-${item.round}-writer`;
      if (item.id !== expectedId) errors.push(`Writer id must be ${expectedId}`);
      const expectedPaths = [`drafts/draft_v${item.round}.md`];
      if (!samePaths(item.output_paths, expectedPaths)) {
        errors.push(`Writer output_paths must be exactly ["${expectedPaths[0]}"]`);
      }
      continue;
    }

    const expectedId = `round-${item.round}-evaluator`;
    if (item.id !== expectedId) errors.push(`Evaluator id must be ${expectedId}`);
    const expectedPaths = [
      `evals/eval_v${item.round}.json`,
      `feedback/feedback_v${item.round}.md`,
    ];
    if (!samePaths(item.output_paths, expectedPaths)) {
      errors.push("Evaluator output_paths must be exactly the round eval and feedback pair");
    }
  }
}

function validateWorkItemCoverage(meta, errors) {
  const itemsById = new Map(meta.work_items.map((item) => [item.id, item]));
  const planner = itemsById.get("planner");
  if (!planner) errors.push("missing Planner work item");
  if (planner && meta.rounds.length > 0 && planner.status !== "completed") {
    errors.push("Planner work item must be completed before round 1 exists");
  }

  for (const round of meta.rounds) {
    const scouts = [];
    for (const dimensionId of round.researched_dimensions) {
      const scoutId = `round-${round.number}-scout-${dimensionId}`;
      const scout = itemsById.get(scoutId);
      if (!scout) {
        errors.push(`missing Scout work item for ${dimensionId} in round ${round.number}`);
      } else {
        scouts.push(scout);
      }
    }

    const writerId = `round-${round.number}-writer`;
    const evaluatorId = `round-${round.number}-evaluator`;
    const writer = itemsById.get(writerId);
    const evaluator = itemsById.get(evaluatorId);
    const requiresWriter = ["writing", "evaluating", "completed"].includes(round.status)
      || round.draft_path !== null;
    const requiresEvaluator = ["evaluating", "completed"].includes(round.status)
      || round.eval_path !== null
      || round.feedback_path !== null;

    if (requiresWriter && !writer) {
      errors.push(`missing Writer work item for round ${round.number}`);
    }
    if (requiresEvaluator && !evaluator) {
      errors.push(`missing Evaluator work item for round ${round.number}`);
    }

    if (round.status === "researching" && (writer || evaluator)) {
      errors.push(`researching round ${round.number} must not contain Writer or Evaluator work items`);
    }
    if (round.status === "writing" && evaluator) {
      errors.push(`writing round ${round.number} must not contain an Evaluator work item`);
    }
    if (meta.status === "running"
        && round.status === "evaluating"
        && evaluator
        && !["pending", "running"].includes(evaluator.status)) {
      errors.push(`evaluating round ${round.number} requires its Evaluator work item to be pending or running`);
    }

    const nextRound = meta.rounds
      .filter((candidate) => candidate.number > round.number)
      .sort((left, right) => left.number - right.number)[0];
    if (nextRound && round.status !== "completed") {
      errors.push(`round ${round.number} must be completed before round ${nextRound.number} exists`);
    }

    if (["writing", "evaluating", "completed"].includes(round.status)) {
      for (const scout of scouts) {
        if (!["completed", "partial"].includes(scout.status)) {
          errors.push(`round ${round.number} cannot advance past research with nonterminal Scout ${scout.id}`);
        }
      }
    }
    if (["evaluating", "completed"].includes(round.status)
        && writer
        && writer.status !== "completed") {
      errors.push(`round ${round.number} requires its Writer work item to be completed before evaluation`);
    }
    const expectedDraftPath = `drafts/draft_v${round.number}.md`;
    if (writer?.status === "completed" && round.draft_path !== expectedDraftPath) {
      errors.push(`completed Writer ${writerId} requires draft_path ${expectedDraftPath}`);
    }
    if (round.status === "evaluating" && round.draft_path === null) {
      errors.push(`evaluating round ${round.number} requires draft_path`);
    }
    if (round.draft_path !== null && writer?.status !== "completed") {
      errors.push(`round ${round.number} draft_path requires its Writer work item to be completed`);
    }
    if (round.status === "completed"
        && evaluator
        && evaluator.status !== "completed") {
      errors.push(`completed round ${round.number} requires its Evaluator work item to be completed`);
    }
  }
}

function latestTerminalScouts(workItems) {
  const latest = new Map();
  for (const item of workItems) {
    if (item.role !== "scout" || !["completed", "partial"].includes(item.status)) continue;
    const prior = latest.get(item.dimension_id);
    if (!prior || item.round > prior.round) latest.set(item.dimension_id, item);
  }
  return latest;
}

function validateWorkItemOutputs(runRoot, meta, spec, evidenceFiles, evidenceValid, errors) {
  const latestScouts = latestTerminalScouts(meta.work_items);
  for (const item of meta.work_items) {
    if (!["completed", "partial"].includes(item.status)) continue;

    const outputs = [];
    for (const outputPath of item.output_paths) {
      let absolutePath;
      try {
        absolutePath = resolveInside(runRoot, outputPath);
      } catch {
        continue;
      }
      if (fs.existsSync(absolutePath)) outputs.push({ outputPath, absolutePath });
    }

    if (item.role === "planner") {
      for (const output of outputs) {
        const result = validateJsonFile("spec", output.absolutePath);
        addResult(errors, `work item ${item.id} output ${output.outputPath}`, result);
        if (result.valid) {
          for (const error of validateSpecSemantics(result.data)) {
            errors.push(`work item ${item.id} output ${output.outputPath}: ${error}`);
          }
        }
      }
      continue;
    }

    if (item.role === "scout") {
      for (const output of outputs) {
        const result = validateJsonFile("evidence", output.absolutePath);
        addResult(errors, `work item ${item.id} output ${output.outputPath}`, result);
        if (!result.valid) continue;
        if (result.data.dimension_id !== item.dimension_id) {
          errors.push(`work item ${item.id} output dimension does not match assigned dimension ${item.dimension_id}`);
        }
        if (result.data.task_id !== meta.task_id) {
          errors.push(`work item ${item.id} output task_id does not match meta.task_id`);
        }
        if (result.data.round < item.round) {
          errors.push(`work item ${item.id} cannot use evidence from earlier round ${result.data.round}`);
        }
        if (latestScouts.get(item.dimension_id) === item) {
          if (result.data.round !== item.round) {
            errors.push(`latest terminal Scout round ${item.round} requires canonical evidence round ${item.round}`);
          }
          if (item.status === "completed" && result.data.status !== "complete") {
            errors.push("latest terminal Scout completed status requires complete evidence");
          }
          if (item.status === "partial" && result.data.status !== "partial") {
            errors.push("latest terminal Scout partial status requires partial evidence");
          }
        }
        for (const error of validateEvidenceSemantics(result.data, spec)) {
          errors.push(`work item ${item.id} output ${output.outputPath}: ${error}`);
        }
      }
      continue;
    }

    if (item.role === "writer") {
      for (const output of outputs) {
        const draft = readText(output.absolutePath, `work item ${item.id} output ${output.outputPath}`, errors);
        if (draft === null) continue;
        const taskId = draft.match(/^task_id:[ \t]*(.*)$/m)?.[1]?.trim();
        const draftRound = draft.match(/^round:[ \t]*(.*)$/m)?.[1]?.trim();
        if (taskId && taskId !== meta.task_id) errors.push(`work item ${item.id} output task_id does not match meta.task_id`);
        if (draftRound && Number(draftRound) !== item.round) errors.push(`work item ${item.id} output round does not match assigned round`);
        if (evidenceValid) {
          for (const error of validateDraftMarkdown(draft, spec, evidenceFiles)) {
            errors.push(`work item ${item.id} output ${output.outputPath}: ${error}`);
          }
        }
      }
      continue;
    }

    const evalOutput = outputs.find((output) => output.outputPath.endsWith(".json"));
    const feedbackOutput = outputs.find((output) => output.outputPath.endsWith(".md"));
    let evaluation = null;
    if (evalOutput) {
      const result = validateJsonFile("eval", evalOutput.absolutePath);
      addResult(errors, `work item ${item.id} output ${evalOutput.outputPath}`, result);
      if (result.valid) evaluation = result.data;
    }
    const round = meta.rounds.find((candidate) => candidate.number === item.round);
    if (evaluation && round?.draft_path && evidenceValid) {
      try {
        const draft = fs.readFileSync(resolveInside(runRoot, round.draft_path), "utf8");
        for (const error of validateEvalSemantics(evaluation, spec, draft, evidenceFiles)) {
          errors.push(`work item ${item.id} output ${evalOutput.outputPath}: ${error}`);
        }
      } catch (error) {
        errors.push(`work item ${item.id} evaluation context: ${error.message}`);
      }
    }
    if (feedbackOutput && evaluation) {
      const feedback = readText(feedbackOutput.absolutePath, `work item ${item.id} output ${feedbackOutput.outputPath}`, errors);
      if (feedback !== null) {
        for (const error of validateFeedbackMarkdown(feedback, evaluation)) {
          errors.push(`work item ${item.id} output ${feedbackOutput.outputPath}: ${error}`);
        }
        const taskId = feedbackTaskId(feedback);
        if (taskId && taskId !== meta.task_id) {
          errors.push(`feedback task_id ${taskId} does not match meta.task_id ${meta.task_id}`);
        }
      }
    }
  }
}

function validateLifecycleCheckpoint(meta, errors) {
  if (meta.status === "running" && meta.phase === "finalized") {
    errors.push("running run must not have phase finalized");
  }
  if (meta.status === "running" && meta.phase === "planning") {
    if (meta.round !== 0 || meta.rounds.length !== 0) {
      errors.push("running planning phase requires round 0 with no round records");
    }
  }
  if (meta.status === "running" && ["researching", "writing", "evaluating"].includes(meta.phase)) {
    const currentRound = meta.rounds.find((round) => round.number === meta.round);
    if (!currentRound) {
      errors.push(`running ${meta.phase} phase requires current round ${meta.round}`);
    } else {
      const phaseMatches = meta.phase === "evaluating"
        ? ["evaluating", "completed"].includes(currentRound.status)
        : currentRound.status === meta.phase;
      if (!phaseMatches) {
        errors.push(`meta.phase ${meta.phase} does not match current round status ${currentRound.status}`);
      }
    }
  }
  if (meta.status === "running" && meta.work_items.some((item) => item.status === "failed")) {
    errors.push("running run must not contain failed work items");
  }

  if (["completed", "exhausted"].includes(meta.status)) {
    if (meta.work_items.some((item) => ["pending", "running", "failed"].includes(item.status))) {
      errors.push(`${meta.status} run must not contain active or failed work items`);
    }
    const latestRound = meta.rounds.find((round) => round.number === meta.round);
    if (!latestRound || latestRound.status !== "completed") {
      errors.push(`${meta.status} run requires its latest round to be completed`);
    }
  }

  if (meta.status === "failed" && meta.work_items.some((item) => item.status === "running")) {
    errors.push("failed run must not contain running work items");
  }
}

function hasPlateau(candidates) {
  const scores = [...candidates]
    .sort((left, right) => left.round - right.round)
    .map((candidate) => candidate.score);
  return scores.length >= 3
    && scores.at(-1) - scores.at(-2) < 0.15
    && scores.at(-2) - scores.at(-3) < 0.15;
}

function validateRunDirectory(runDirectory) {
  const errors = [];
  const requestedRoot = path.resolve(runDirectory);
  let rootStat;
  try {
    rootStat = fs.statSync(requestedRoot);
  } catch (error) {
    return { valid: false, errors: [`run directory: ${error.message}`], bestDraft: null };
  }
  if (!rootStat.isDirectory()) {
    return { valid: false, errors: ["run path must be a directory"], bestDraft: null };
  }

  let runRoot;
  try {
    fs.realpathSync(requestedRoot);
    runRoot = requestedRoot;
  } catch (error) {
    return { valid: false, errors: [`run directory: ${error.message}`], bestDraft: null };
  }

  let metaPath;
  try {
    metaPath = resolveInside(runRoot, "meta.json");
  } catch (error) {
    return { valid: false, errors: [`meta: ${error.message}`], bestDraft: null };
  }
  const metaResult = validateJsonFile("meta", metaPath);
  addResult(errors, "meta", metaResult);
  if (!metaResult.valid) return { valid: false, errors, bestDraft: null };
  const meta = metaResult.data;

  if (!path.isAbsolute(meta.run_root)) errors.push("meta.run_root must be absolute");
  if (path.resolve(meta.run_root) !== runRoot) errors.push("meta.run_root does not match validated run directory");

  validateLifecycleCheckpoint(meta, errors);
  validateWorkItemContracts(meta, null, errors);

  const workItemIds = new Set();
  for (const item of meta.work_items) {
    if (workItemIds.has(item.id)) errors.push(`duplicate work item id ${item.id}`);
    workItemIds.add(item.id);
    for (const outputPath of item.output_paths) {
      try {
        const resolved = resolveInside(runRoot, outputPath);
        if (["completed", "partial"].includes(item.status) && !fs.existsSync(resolved)) {
          errors.push(`work item ${item.id} output is missing: ${outputPath}`);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  let specPath;
  try {
    specPath = resolveInside(runRoot, "spec.json");
  } catch (error) {
    errors.push(`spec: ${error.message}`);
    return { valid: false, errors, bestDraft: null };
  }
  if (!fs.existsSync(specPath)) {
    const recoverablePlanningRun = meta.status === "running"
      && meta.phase === "planning"
      && meta.round === 0
      && meta.rounds.length === 0
      && meta.best === null
      && meta.work_items.length === 1
      && meta.work_items[0].role === "planner"
      && ["pending", "running"].includes(meta.work_items[0].status);
    const failedPlanner = meta.status === "failed"
      && meta.phase === "finalized"
      && meta.round === 0
      && meta.best === null
      && meta.work_items.some((item) => item.role === "planner" && item.status === "failed" && item.attempt === 2);
    if (!recoverablePlanningRun && !failedPlanner) errors.push("spec.json is missing without a planning checkpoint or terminal Planner failure");
    let finalPath;
    let bestReportPath;
    try {
      finalPath = resolveInside(runRoot, "final_report.md");
    } catch (error) {
      errors.push(`final_report.md: ${error.message}`);
    }
    if (finalPath && fs.existsSync(finalPath)) errors.push(`${meta.status} run must not contain final_report.md`);
    try {
      bestReportPath = resolveInside(runRoot, "best_report.md");
    } catch (error) {
      errors.push(`best_report.md: ${error.message}`);
    }
    if (bestReportPath && fs.existsSync(bestReportPath)) errors.push(`${meta.status} run must not contain best_report.md`);
    return { valid: errors.length === 0, errors, bestDraft: null };
  }

  const specResult = validateJsonFile("spec", specPath);
  addResult(errors, "spec", specResult);
  if (specResult.valid) {
    for (const error of validateSpecSemantics(specResult.data)) errors.push(`spec: ${error}`);
  }
  if (errors.some((error) => error.startsWith("spec:"))) return { valid: false, errors, bestDraft: null };
  const spec = specResult.data;
  validateWorkItemCoverage(meta, errors);

  const knownDimensions = new Set(spec.dimensions.map((dimension) => dimension.id));
  for (const item of meta.work_items) {
    if (item.role === "scout" && item.dimension_id !== null && !knownDimensions.has(item.dimension_id)) {
      errors.push(`Scout dimension ${item.dimension_id} does not exist in spec`);
    }
  }

  if (meta.topic !== spec.topic) errors.push("meta.topic does not match spec.topic");
  if (!sameNumber(meta.pass_threshold, spec.successCriteria.passThreshold)) {
    errors.push("meta.pass_threshold does not match spec success threshold");
  }

  const roundNumbers = new Set();
  for (const round of meta.rounds) {
    if (roundNumbers.has(round.number)) errors.push(`duplicate round number ${round.number}`);
    roundNumbers.add(round.number);
    validateRoundShape(round, spec, errors);
  }
  const sortedRoundNumbers = [...roundNumbers].sort((left, right) => left - right);
  for (let index = 0; index < sortedRoundNumbers.length; index += 1) {
    if (sortedRoundNumbers[index] !== index + 1) errors.push("meta.rounds must be sequential from round 1");
  }
  if (meta.rounds.length === 0) {
    if (meta.round !== 0) errors.push("meta.round must be 0 when no rounds exist");
  } else if (meta.round !== sortedRoundNumbers.at(-1)) {
    errors.push("meta.round must match the latest round record");
  }

  const requiresCompleteEvidence = meta.rounds.some((round) => round.draft_path !== null)
    || ["writing", "evaluating"].includes(meta.phase)
    || ["completed", "exhausted"].includes(meta.status);
  const evidenceErrorStart = errors.length;
  const evidenceFiles = validateEvidenceDirectory(runRoot, spec, meta, requiresCompleteEvidence, errors);
  const evidenceValid = errors.length === evidenceErrorStart;

  validateWorkItemOutputs(runRoot, meta, spec, evidenceFiles, evidenceValid, errors);

  const candidates = [];
  for (const round of meta.rounds) {
    const roundErrorStart = errors.length;
    const resolved = validateRoundPaths(runRoot, round, errors);

    let draft = null;
    if (round.draft_path !== null && resolved.draft_path) {
      draft = readText(resolved.draft_path, `round ${round.number} draft`, errors);
      if (draft !== null) {
        validateDraftIdentity(draft, round, meta, errors);
        if (evidenceValid) {
          for (const error of validateDraftMarkdown(draft, spec, evidenceFiles)) errors.push(`round ${round.number} draft: ${error}`);
        }
      }
    }

    let evaluation = null;
    if (round.eval_path !== null && resolved.eval_path) {
      const evaluationResult = validateJsonFile("eval", resolved.eval_path);
      addResult(errors, `round ${round.number} eval`, evaluationResult);
      if (evaluationResult.valid) {
        evaluation = evaluationResult.data;
        if (evaluation.iteration !== round.number) errors.push(`round ${round.number} eval iteration must equal ${round.number}`);
        if (!sameNumber(evaluation.pass_threshold, meta.pass_threshold)) {
          errors.push(`round ${round.number} eval pass_threshold does not match meta.pass_threshold`);
        }
        const expectedDraftId = round.draft_path ? path.basename(round.draft_path, path.extname(round.draft_path)) : null;
        if (expectedDraftId && evaluation.draft_id !== expectedDraftId) {
          errors.push(`round ${round.number} eval draft_id does not match draft path`);
        }
        if (draft !== null && evidenceValid) {
          for (const error of validateEvalSemantics(evaluation, spec, draft, evidenceFiles)) errors.push(`round ${round.number} eval: ${error}`);
        }
        if (!sameNumber(round.score, evaluation.overall_score) || round.verdict !== evaluation.verdict) {
          errors.push(`round ${round.number} metadata does not match evaluation`);
        }
      }
    }

    if (round.feedback_path !== null && resolved.feedback_path) {
      const feedback = readText(resolved.feedback_path, `round ${round.number} feedback`, errors);
      if (feedback !== null && evaluation !== null) {
        for (const error of validateFeedbackMarkdown(feedback, evaluation)) errors.push(`round ${round.number} feedback: ${error}`);
        const taskId = feedbackTaskId(feedback);
        if (taskId && taskId !== meta.task_id) {
          errors.push(`feedback task_id ${taskId} does not match meta.task_id ${meta.task_id}`);
        }
      }
    }

    if (evidenceValid && round.status === "completed" && draft !== null && evaluation !== null
        && round.feedback_path !== null && errors.length === roundErrorStart) {
      candidates.push({
        round: round.number,
        draft_path: round.draft_path,
        eval_path: round.eval_path,
        score: evaluation.overall_score,
        passed: evaluation.pass,
        verdict: evaluation.verdict,
      });
    }
  }

  const firstReject = candidates
    .filter((candidate) => candidate.verdict === "REJECT")
    .sort((left, right) => left.round - right.round)[0];
  if (firstReject) {
    if (meta.status !== "failed" || meta.phase !== "finalized") {
      errors.push(`REJECT at round ${firstReject.round} must terminate the run as failed/finalized`);
    }
    for (const round of meta.rounds.filter((candidate) => candidate.number > firstReject.round)) {
      errors.push(`round ${round.number} occurs after REJECT at round ${firstReject.round}`);
    }
    for (const item of meta.work_items.filter((candidate) => candidate.round > firstReject.round)) {
      errors.push(`work item ${item.id} occurs after REJECT at round ${firstReject.round}`);
    }
    if (meta.round !== firstReject.round) {
      errors.push(`meta.round must remain ${firstReject.round} after REJECT`);
    }
  }

  const bestDraft = selectBest(candidates);
  if (!bestMatches(meta.best, bestDraft)) {
    errors.push("meta.best does not match the highest valid evaluation");
  }

  let finalPath = null;
  let bestReportPath = null;
  try {
    finalPath = resolveInside(runRoot, "final_report.md");
  } catch (error) {
    errors.push(`final_report.md: ${error.message}`);
  }
  try {
    bestReportPath = resolveInside(runRoot, "best_report.md");
  } catch (error) {
    errors.push(`best_report.md: ${error.message}`);
  }
  if (meta.status === "completed") {
    if (!bestDraft?.passed) {
      errors.push("completed run requires a passing best draft");
    } else {
      const bestContent = readText(resolveInside(runRoot, bestDraft.draft_path), "best draft", errors);
      if (!finalPath || !fs.existsSync(finalPath)
          || (bestContent !== null && readText(finalPath, "final_report.md", errors) !== bestContent)) {
        errors.push("final_report.md must equal the best draft");
      }
    }
    if (bestReportPath && fs.existsSync(bestReportPath)) errors.push("completed run must not contain best_report.md");
  } else {
    if (finalPath && fs.existsSync(finalPath)) errors.push(`${meta.status} run must not contain final_report.md`);
    if (meta.status === "exhausted") {
      if (!bestDraft || bestDraft.passed) errors.push("exhausted run requires a non-passing best draft");
      const reachedMaxRounds = meta.rounds.length >= meta.max_rounds;
      if (!reachedMaxRounds && !hasPlateau(candidates)) {
        errors.push("exhausted run requires max_rounds or two score improvements below 0.15");
      }
      if (!bestReportPath || !fs.existsSync(bestReportPath)) {
        errors.push("exhausted run requires best_report.md");
      } else if (bestDraft) {
        const bestContent = readText(resolveInside(runRoot, bestDraft.draft_path), "best draft", errors);
        if (bestContent !== null && readText(bestReportPath, "best_report.md", errors) !== bestContent) {
          errors.push("best_report.md must equal the best draft");
        }
      }
    } else if (bestReportPath && fs.existsSync(bestReportPath)) {
      errors.push(`${meta.status} run must not contain best_report.md`);
    }

    if (meta.status === "failed") {
      if (bestDraft?.passed || meta.best?.passed) errors.push("failed run must remain nonpassing");
      const hasAttemptTwoFailure = meta.work_items.some((item) => item.status === "failed" && item.attempt === 2);
      const hasReject = candidates.some((candidate) => candidate.verdict === "REJECT");
      if (!hasAttemptTwoFailure && !hasReject) {
        errors.push("failed run requires an attempt-two work-item failure or a REJECT verdict");
      }
    }
  }

  return { valid: errors.length === 0, errors, bestDraft };
}

module.exports = { resolveInside, selectBest, validateRunDirectory };
