#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { validateEvidenceSemantics } = require("./lib/evidence-validation");
const { readEvidenceFiles, validateEvalSemantics } = require("./lib/eval-validation");
const { validateJsonFile } = require("./lib/json-schema");
const { validateNotes } = require("./lib/legacy-validation");
const { validateDraftMarkdown, validateFeedbackMarkdown } = require("./lib/markdown-validation");
const { validateRunDirectory } = require("./lib/run-validation");
const { validateSpecSemantics } = require("./lib/spec-validation");

const schemaModes = new Set(["spec", "meta"]);
const supportedModes = new Set([...schemaModes, "eval", "evidence", "draft", "feedback", "notes", "run"]);
const usage = [
  "Usage:",
  "  node scripts/validate.js spec <path>",
  "  node scripts/validate.js meta <path>",
  "  node scripts/validate.js evidence <path> --spec <spec-path> [--prior <prior-evidence-path>]",
  "  node scripts/validate.js draft <path> --spec <spec-path> --evidence-dir <evidence-directory>",
  "  node scripts/validate.js eval <path> --spec <spec-path> --draft <draft-path> --evidence-dir <evidence-directory>",
  "  node scripts/validate.js feedback <path> --eval <eval-path>",
  "  node scripts/validate.js notes <notes-dir> <spec-path>",
  "  node scripts/validate.js run <run-directory>",
].join("\n");
const [, , mode, targetPath, ...extraArgs] = process.argv;

if (!supportedModes.has(mode) || !targetPath || (mode === "run" && extraArgs.length !== 0)) {
  console.error(usage);
  process.exit(1);
}

const absolutePath = path.resolve(targetPath);
let result;
if (schemaModes.has(mode)) {
  result = validateJsonFile(mode, absolutePath);
  if (result.valid && mode === "spec") {
    result.errors.push(...validateSpecSemantics(result.data));
  }
  result.valid = result.errors.length === 0;
} else if (mode === "eval") {
  const evalResult = validateJsonFile("eval", absolutePath);
  if (!evalResult.valid) {
    result = evalResult;
  } else {
    let options;
    try {
      options = parseOptions(extraArgs, ["spec", "draft", "evidence-dir"]);
    } catch (error) {
      result = { valid: false, data: evalResult.data, errors: [error.message] };
    }

    if (options) {
      const missingOption = ["spec", "draft", "evidence-dir"].find((name) => !options[name]);
      if (missingOption) {
        result = { valid: false, data: evalResult.data, errors: [`Missing required option --${missingOption}`] };
      } else {
        const specResult = validateJsonFile("spec", options.spec);
        const errors = [...specResult.errors];
        if (specResult.valid) {
          try {
            const draft = fs.readFileSync(options.draft, "utf8");
            const evidenceFiles = readEvidenceFiles(options["evidence-dir"]);
            errors.push(...validateEvalSemantics(evalResult.data, specResult.data, draft, evidenceFiles));
          } catch (error) {
            errors.push(`Evaluation context error: ${error.message}`);
          }
        }
        result = { valid: errors.length === 0, data: evalResult.data, errors };
      }
    }
  }
} else if (mode === "evidence") {
  let options;
  try {
    options = parseOptions(extraArgs, ["spec", "prior"]);
  } catch (error) {
    result = { valid: false, errors: [error.message] };
  }
  if (options && !options.spec) {
    result = { valid: false, errors: ["Missing required option --spec"] };
  } else if (options) {
    const evidenceResult = validateJsonFile("evidence", absolutePath);
    const specResult = validateJsonFile("spec", options.spec);
    const errors = [...evidenceResult.errors, ...specResult.errors];
    if (errors.length === 0) {
      const priorResult = options.prior ? validateJsonFile("evidence", options.prior) : { valid: true, data: null, errors: [] };
      errors.push(...priorResult.errors);
      if (priorResult.valid) errors.push(...validateEvidenceSemantics(evidenceResult.data, specResult.data, priorResult.data));
    }
    result = { valid: errors.length === 0, data: evidenceResult.data, errors };
  }
} else if (mode === "run") {
  result = validateRunDirectory(absolutePath);
} else if (mode === "draft") {
  result = validateDraft(absolutePath, extraArgs);
} else if (mode === "feedback") {
  result = validateFeedback(absolutePath, extraArgs);
} else {
  const [specPath] = extraArgs;
  if (!specPath) {
    console.error("Usage: node scripts/validate.js notes <notes-dir> <spec-path>");
    process.exit(1);
  }
  result = validateNotes(absolutePath, path.resolve(specPath));
}

if (result.valid) {
  console.log(`VALID ${mode} ${absolutePath}`);
  process.exit(0);
}

console.log(`INVALID ${mode} ${absolutePath}`);
for (const error of result.errors) console.log(`- ${error}`);
process.exit(1);

function parseOptions(args, allowedNames = null) {
  const options = {};
  const allowed = allowedNames ? new Set(allowedNames) : null;
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error(`Invalid option sequence at ${key || "end"}`);
    }
    const name = key.slice(2);
    if (allowed && !allowed.has(name)) throw new Error(`Unexpected option --${name}`);
    if (options[name]) throw new Error(`Duplicate option --${name}`);
    options[name] = path.resolve(value);
  }
  return options;
}

function validationError(errors, data = null) {
  return { valid: false, data, errors };
}

function validateEvidenceDirectory(directory, spec) {
  let directoryNames;
  try {
    directoryNames = fs.readdirSync(directory).sort();
  } catch (error) {
    return { evidenceFiles: [], errors: [`Evidence context error: ${error.message}`] };
  }

  const canonicalPattern = /^evidence_(dim_[0-9]{3})\.json$/;
  const evidenceJsonNames = directoryNames.filter((name) => /^evidence_.*\.json$/.test(name));
  const names = evidenceJsonNames.filter((name) => canonicalPattern.test(name));
  const expectedDimensions = spec.dimensions.map((dimension) => dimension.id);
  const expectedDimensionSet = new Set(expectedDimensions);
  const expectedNames = new Set(expectedDimensions.map((dimensionId) => `evidence_${dimensionId}.json`));
  const errors = [];
  const evidenceFiles = [];

  for (const name of evidenceJsonNames.filter((candidate) => !canonicalPattern.test(candidate))) {
    errors.push(`unexpected evidence JSON filename ${name}; expected evidence_dim_NNN.json`);
  }

  for (const name of names) {
    const evidenceResult = validateJsonFile("evidence", path.join(directory, name));
    errors.push(...evidenceResult.errors.map((error) => `${name}: ${error}`));
    if (evidenceResult.valid) {
      const filenameDimension = canonicalPattern.exec(name)[1];
      evidenceFiles.push({ name, filenameDimension, data: evidenceResult.data });
    }
  }

  for (const dimensionId of expectedDimensions) {
    const expectedName = `evidence_${dimensionId}.json`;
    if (!names.includes(expectedName)) {
      errors.push(`missing evidence file ${expectedName} for dimension ${dimensionId}`);
    }
  }
  for (const name of names) {
    const filenameDimension = canonicalPattern.exec(name)[1];
    if (!expectedNames.has(name)) {
      errors.push(`unexpected evidence file ${name} for unknown dimension ${filenameDimension}`);
    }
  }

  const payloadNamesByDimension = new Map();
  for (const evidence of evidenceFiles) {
    const payloadDimension = evidence.data.dimension_id;
    if (evidence.filenameDimension !== payloadDimension) {
      errors.push(`${evidence.name}: filename dimension ${evidence.filenameDimension} does not match payload dimension ${payloadDimension}`);
    }
    if (!expectedDimensionSet.has(payloadDimension)) {
      errors.push(`${evidence.name}: payload dimension ${payloadDimension} does not exist in spec`);
    }
    const payloadNames = payloadNamesByDimension.get(payloadDimension) || [];
    payloadNames.push(evidence.name);
    payloadNamesByDimension.set(payloadDimension, payloadNames);
  }
  for (const [dimensionId, payloadNames] of [...payloadNamesByDimension.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (payloadNames.length > 1) {
      errors.push(`duplicate evidence payload for dimension ${dimensionId}: ${payloadNames.sort().join(", ")}`);
    }
  }

  if (errors.length === 0) {
    for (const evidence of evidenceFiles) {
      errors.push(...validateEvidenceSemantics(evidence.data, spec).map((error) => `${evidence.name}: ${error}`));
    }
  }
  return { evidenceFiles: evidenceFiles.map((evidence) => evidence.data), errors };
}

function validateDraft(draftPath, args) {
  let options;
  try {
    options = parseOptions(args, ["spec", "evidence-dir"]);
  } catch (error) {
    return validationError([error.message]);
  }
  const missingOption = ["spec", "evidence-dir"].find((name) => !options[name]);
  if (missingOption) return validationError([`Missing required option --${missingOption}`]);

  const specResult = validateJsonFile("spec", options.spec);
  const errors = [...specResult.errors];
  if (specResult.valid) errors.push(...validateSpecSemantics(specResult.data));
  if (errors.length > 0) return validationError(errors);

  const evidenceResult = validateEvidenceDirectory(options["evidence-dir"], specResult.data);
  errors.push(...evidenceResult.errors);
  if (errors.length > 0) return validationError(errors);

  let draft;
  try {
    draft = fs.readFileSync(draftPath, "utf8");
  } catch (error) {
    return validationError([`Draft file error: ${error.message}`]);
  }
  errors.push(...validateDraftMarkdown(draft, specResult.data, evidenceResult.evidenceFiles));
  return { valid: errors.length === 0, data: draft, errors };
}

function validateFeedback(feedbackPath, args) {
  let options;
  try {
    options = parseOptions(args, ["eval"]);
  } catch (error) {
    return validationError([error.message]);
  }
  if (!options.eval) return validationError(["Missing required option --eval"]);

  const evalResult = validateJsonFile("eval", options.eval);
  if (!evalResult.valid) return evalResult;

  let feedback;
  try {
    feedback = fs.readFileSync(feedbackPath, "utf8");
  } catch (error) {
    return validationError([`Feedback file error: ${error.message}`], evalResult.data);
  }
  const errors = validateFeedbackMarkdown(feedback, evalResult.data);
  return { valid: errors.length === 0, data: feedback, errors };
}
