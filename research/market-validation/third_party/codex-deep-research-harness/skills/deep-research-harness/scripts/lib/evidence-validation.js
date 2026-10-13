function validateEvidenceSemantics(evidence, spec, priorEvidence = null) {
  const errors = [];
  const dimension = spec.dimensions.find((item) => item.id === evidence.dimension_id);
  if (!dimension) return [`dimension ${evidence.dimension_id} does not exist in spec`];

  const sourcePrefix = `${evidence.dimension_id}-src-`;
  const claimPrefix = `${evidence.dimension_id}-claim-`;
  const assignedSubquestions = new Set(dimension.subquestions);
  const sourceIds = new Set();
  const claimIds = new Set();

  for (const source of evidence.sources) {
    if (!source.id.startsWith(sourcePrefix)) {
      errors.push(`source ${source.id} must begin with ${sourcePrefix}`);
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(source.url);
    } catch {
      errors.push(`source ${source.id} URL must be a parseable HTTP(S) URL with a hostname`);
    }
    if (parsedUrl && (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname)) {
      errors.push(`source ${source.id} URL must be a parseable HTTP(S) URL with a hostname`);
    }
    if (parsedUrl && (parsedUrl.username || parsedUrl.password)) {
      errors.push(`source ${source.id} URL must not contain credentials`);
    }
    if (sourceIds.has(source.id)) errors.push(`duplicate source id ${source.id}`);
    sourceIds.add(source.id);
  }

  for (const claim of evidence.claims) {
    if (!claim.id.startsWith(claimPrefix)) {
      errors.push(`claim ${claim.id} must begin with ${claimPrefix}`);
    }
    if (claimIds.has(claim.id)) errors.push(`duplicate claim id ${claim.id}`);
    claimIds.add(claim.id);
    if (!assignedSubquestions.has(claim.subquestion)) {
      errors.push(`claim ${claim.id} subquestion does not match an assigned subquestion: ${claim.subquestion}`);
    }
    for (const sourceId of claim.source_ids) {
      if (!sourceIds.has(sourceId)) errors.push(`claim ${claim.id} references unknown source ${sourceId}`);
    }
  }

  for (const contradiction of evidence.contradictions) {
    for (const sourceId of contradiction.source_ids) {
      if (!sourceIds.has(sourceId)) errors.push(`contradiction references unknown source ${sourceId}`);
    }
  }

  if (evidence.status === "complete") {
    for (const subquestion of dimension.subquestions) {
      if (!evidence.claims.some((claim) => claim.subquestion === subquestion)) {
        errors.push(`uncovered subquestion: ${subquestion}`);
      }
    }
  } else if (evidence.open_questions.length === 0) {
    errors.push("partial evidence must list at least one open question");
  }

  if (priorEvidence) {
    if (evidence.task_id !== priorEvidence.task_id) errors.push("revision task_id must match prior evidence");
    if (evidence.dimension_id !== priorEvidence.dimension_id) errors.push("revision dimension_id must match prior evidence");
    if (evidence.round !== priorEvidence.round + 1) errors.push("revision round must increment prior evidence by one");
    for (const collection of ["sources", "claims", "contradictions"]) {
      const currentById = new Map(evidence[collection].map((item, index) => [item.id || `${collection}-${index}`, item]));
      priorEvidence[collection].forEach((priorItem, index) => {
        const key = priorItem.id || `${collection}-${index}`;
        const currentItem = currentById.get(key);
        if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(priorItem)) {
          errors.push(`prior ${collection.slice(0, -1)} ${key} must remain unchanged`);
        }
      });
    }
  }

  return errors;
}

module.exports = { validateEvidenceSemantics };
