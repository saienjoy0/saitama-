const fs = require("node:fs");
const path = require("node:path");
const { validateJsonFile } = require("./json-schema");

function validateNotes(notesDirectory, specPath) {
  const errors = [];
  const specResult = validateJsonFile("spec", specPath);
  if (!specResult.valid) {
    return { valid: false, errors: specResult.errors.map((error) => `spec: ${error}`) };
  }
  const spec = specResult.data;

  if (!fs.existsSync(notesDirectory)) {
    return { valid: false, errors: [`Notes directory not found: ${notesDirectory}`] };
  }

  for (const dimension of spec.dimensions || []) {
    const notesPath = path.join(notesDirectory, `notes_${dimension.id}.md`);
    if (!fs.existsSync(notesPath)) {
      errors.push(`Missing notes file for ${dimension.id}: ${notesPath}`);
      continue;
    }

    const content = fs.readFileSync(notesPath, "utf8");
    const evidenceLines = content
      .split("\n")
      .filter((line) => /^[-*]\s+/.test(line.trim()) || /^###\s+/.test(line.trim())).length;
    if (evidenceLines < 3) {
      errors.push(`${dimension.id}: only ${evidenceLines} evidence items (minimum 3)`);
    }

    const uncovered = (dimension.subquestions || []).filter((subquestion) => {
      const keyTerms = subquestion
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4);
      const matchCount = keyTerms.filter((term) => content.toLowerCase().includes(term)).length;
      return matchCount < 2;
    });
    if (uncovered.length > 0) {
      errors.push(`${dimension.id}: subquestions not covered in notes: ${uncovered.join("; ")}`);
    }
  }

  for (const dimension of spec.dimensions || []) {
    const sourcesPath = path.join(notesDirectory, `sources_${dimension.id}.md`);
    if (!fs.existsSync(sourcesPath)) {
      errors.push(`Missing sources file for ${dimension.id}: ${sourcesPath}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateNotes };
