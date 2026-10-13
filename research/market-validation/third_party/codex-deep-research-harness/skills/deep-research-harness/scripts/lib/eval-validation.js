const fs = require("node:fs");
const path = require("node:path");

const CRITERION_WEIGHTS = Object.freeze({
  source_quality: 0.2,
  analytical_depth: 0.2,
  structural_coherence: 0.15,
  completeness: 0.15,
  actionability: 0.15,
  original_insight: 0.1,
  clarity: 0.05,
});

const BLOCKING_GATES = Object.freeze([
  "schema_validity",
  "dimension_coverage",
  "citation_coverage",
  "artifact_completeness",
]);

function closeEnough(left, right) {
  return Math.abs(left - right) <= 0.011;
}

function roundScore(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function readEvidenceFiles(directory) {
  return fs.readdirSync(directory)
    .filter((name) => /^evidence_dim_[0-9]{3}\.json$/.test(name))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")));
}

function extractCitations(draft) {
  return [...new Set([...draft.matchAll(/\[(dim_[0-9]{3}-src-[0-9]{3})\]/g)].map((match) => match[1]))];
}

function validateEvalSemantics(evaluation, spec, draft, evidenceFiles) {
  const errors = [];
  let rawAverage = 0;

  for (const [name, expectedWeight] of Object.entries(CRITERION_WEIGHTS)) {
    const criterion = evaluation.criteria[name];
    if (!closeEnough(criterion.weight, expectedWeight)) {
      errors.push(`${name} weight must be ${expectedWeight}`);
    }
    const expectedWeighted = roundScore(criterion.score * expectedWeight);
    if (!closeEnough(criterion.weighted, expectedWeighted)) {
      errors.push(`${name} weighted must equal score multiplied by weight (${expectedWeighted})`);
    }
    rawAverage += criterion.score * expectedWeight;
  }

  rawAverage = roundScore(rawAverage);
  if (!closeEnough(evaluation.calibration.raw_average, rawAverage)) {
    errors.push(`calibration.raw_average must equal ${rawAverage}`);
  }

  const scores = Object.entries(evaluation.criteria).map(([name, criterion]) => ({ name, score: criterion.score }));
  const lowestScore = Math.min(...scores.map((item) => item.score));
  const highestScore = Math.max(...scores.map((item) => item.score));
  const lowCount = scores.filter((item) => item.score <= 2).length;
  if (evaluation.calibration.weakest_score !== lowestScore) {
    errors.push(`weakest_score must equal ${lowestScore}`);
  }
  if (evaluation.criteria[evaluation.calibration.weakest_criterion].score !== lowestScore) {
    errors.push("weakest_criterion must name a criterion with the minimum score");
  }
  if (evaluation.calibration.score_spread !== highestScore - lowestScore) {
    errors.push(`score_spread must equal ${highestScore - lowestScore}`);
  }
  if (evaluation.calibration.criteria_at_or_below_2 !== lowCount) {
    errors.push(`criteria_at_or_below_2 must equal ${lowCount}`);
  }
  if (evaluation.calibration.defect_count !== evaluation.defects.length) {
    errors.push(`defect_count must equal defects.length (${evaluation.defects.length})`);
  }
  const defendedCriteria = new Set(evaluation.calibration.high_score_defenses.map((item) => item.criterion));
  for (const { name, score } of scores) {
    if (score > 3 && !defendedCriteria.has(name)) errors.push(`missing high-score defense for ${name}`);
  }

  const baseGatesPass = BLOCKING_GATES.every((name) => evaluation.gates[name].status === "pass");
  const feedbackStatus = evaluation.gates.feedback_compliance.status;

  if (evaluation.iteration === 1 && feedbackStatus !== "not_applicable") {
    errors.push("initial evaluation requires feedback_compliance=not_applicable");
  }
  if (evaluation.iteration > 1 && feedbackStatus === "not_applicable") {
    errors.push("revision evaluation requires feedback_compliance pass or fail");
  }

  const failedBlockingGates = BLOCKING_GATES.filter((name) => evaluation.gates[name].status === "fail");
  if (evaluation.iteration > 1 && feedbackStatus === "fail") failedBlockingGates.push("feedback_compliance");
  if (evaluation.pass && evaluation.overall_score < evaluation.pass_threshold) {
    errors.push(`pass=true but score ${evaluation.overall_score} < threshold ${evaluation.pass_threshold}`);
  }
  if (evaluation.pass && failedBlockingGates.length > 0) {
    errors.push(`pass=true but gates failed: ${failedBlockingGates.join(", ")}`);
  }

  const feedbackPasses = evaluation.iteration === 1
    ? feedbackStatus === "not_applicable"
    : feedbackStatus === "pass";
  const qualifies = evaluation.overall_score >= evaluation.pass_threshold && baseGatesPass && feedbackPasses;

  if (qualifies && evaluation.verdict !== "PASS") errors.push("qualifying evaluation verdict must be PASS");
  if (!qualifies && evaluation.verdict === "PASS") errors.push("non-qualifying evaluation verdict cannot be PASS");
  if (evaluation.pass !== (evaluation.verdict === "PASS")) errors.push("pass and verdict must agree");

  const highDefect = evaluation.defects.some((defect) => defect.severity === "high");
  const capLifted = baseGatesPass
    && evaluation.criteria.source_quality.score >= 4
    && evaluation.criteria.analytical_depth.score >= 4
    && !highDefect;
  const expectedOverall = roundScore(capLifted ? rawAverage : Math.min(rawAverage, 3.6));
  if (!closeEnough(evaluation.overall_score, expectedOverall)) {
    errors.push(`overall_score must equal ${expectedOverall} after cap rules`);
  }
  if (evaluation.calibration.score_cap_applied !== (!capLifted && rawAverage > 3.6)) {
    errors.push("score_cap_applied does not match cap eligibility");
  }

  const dimensionIds = new Set(spec.dimensions.map((dimension) => dimension.id));
  for (const dimensionId of evaluation.weak_dimensions) {
    if (!dimensionIds.has(dimensionId)) errors.push(`unknown weak dimension ${dimensionId}`);
  }
  if ((evaluation.gates.dimension_coverage.status === "fail" || evaluation.gates.citation_coverage.status === "fail")
      && evaluation.weak_dimensions.length === 0) {
    errors.push("failed coverage gates require at least one weak dimension");
  }

  const sourceIds = new Set(evidenceFiles.flatMap((evidence) => evidence.sources.map((source) => source.id)));
  const citations = extractCitations(draft);
  for (const citation of citations) {
    if (!sourceIds.has(citation)) errors.push(`citation ${citation} has no evidence source`);
  }

  const requiredAuditCount = citations.length === 0
    ? 0
    : Math.min(citations.length, Math.max(5, Math.ceil(citations.length * 0.2)), 12);
  const auditedIds = new Set(evaluation.citation_audit.map((entry) => entry.source_id));
  if (auditedIds.size < requiredAuditCount) {
    errors.push(`citation audit requires ${requiredAuditCount} unique source entries`);
  }
  for (const entry of evaluation.citation_audit) {
    if (!citations.includes(entry.source_id)) errors.push(`audited source ${entry.source_id} is not cited in draft`);
  }
  if (evaluation.citation_audit.some((entry) => entry.status === "unsupported")
      && evaluation.gates.citation_coverage.status !== "fail") {
    errors.push("unsupported citation audit requires citation_coverage=fail");
  }

  return errors;
}

module.exports = {
  CRITERION_WEIGHTS,
  extractCitations,
  readEvidenceFiles,
  validateEvalSemantics,
};
