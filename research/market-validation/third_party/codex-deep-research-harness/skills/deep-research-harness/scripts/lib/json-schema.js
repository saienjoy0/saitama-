const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const schemaDirectory = path.resolve(__dirname, "../../schemas");
const validators = new Map();

function readJson(filePath) {
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, "utf8")), errors: [] };
  } catch (error) {
    return { data: null, errors: [`JSON parse error: ${error.message}`] };
  }
}

function getValidator(schemaName) {
  if (validators.has(schemaName)) return validators.get(schemaName);
  const schemaPath = path.join(schemaDirectory, `${schemaName}.json`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validator = ajv.compile(schema);
  validators.set(schemaName, validator);
  return validator;
}

function formatAjvError(error) {
  const location = error.instancePath || "/";
  return `${location} ${error.message}`;
}

function validateJsonFile(schemaName, dataPath) {
  const parsed = readJson(dataPath);
  if (parsed.errors.length > 0) {
    return { valid: false, data: null, errors: parsed.errors };
  }
  const validator = getValidator(schemaName);
  const valid = validator(parsed.data);
  const errors = valid ? [] : validator.errors.map(formatAjvError);
  return { valid, data: parsed.data, errors };
}

module.exports = { readJson, validateJsonFile };
