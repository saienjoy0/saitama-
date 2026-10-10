function validateSpecSemantics(spec) {
  const errors = [];
  const dimensionIds = new Set();
  for (const dimension of spec.dimensions) {
    if (dimensionIds.has(dimension.id)) errors.push(`duplicate dimension id ${dimension.id}`);
    dimensionIds.add(dimension.id);
  }
  const artifactIds = new Set();
  for (const artifact of spec.artifactPlan) {
    if (artifactIds.has(artifact.id)) errors.push(`duplicate artifact id ${artifact.id}`);
    artifactIds.add(artifact.id);
    for (const dimensionId of artifact.sourceDimensions) {
      if (!dimensionIds.has(dimensionId)) errors.push(`${artifact.id} references unknown dimension ${dimensionId}`);
    }
  }
  const excluded = new Set(spec.constraints?.excludeSources || []);
  for (const required of spec.constraints?.requireSources || []) {
    if (excluded.has(required)) errors.push(`source ${required} cannot be both required and excluded`);
  }
  return errors;
}

module.exports = { validateSpecSemantics };
