const { extractCitations } = require("./eval-validation");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFencedCodeBlocks(content) {
  let fence = null;
  return content.split("\n").map((rawLine) => {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!fence) {
      const opening = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
      if (!opening) return rawLine;
      fence = { character: opening[1][0], length: opening[1].length };
      return "";
    }

    const closing = new RegExp(`^[ \\t]{0,3}${escapeRegExp(fence.character)}{${fence.length},}[ \\t]*$`);
    if (closing.test(line)) fence = null;
    return "";
  }).join("\n");
}

function hasHeading(content, heading) {
  return new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, "m").test(content);
}

function sourceIds(evidenceFiles) {
  return new Set(evidenceFiles.flatMap((evidence) => evidence.sources.map((source) => source.id)));
}

function frontmatterValues(frontmatter, errors) {
  const fields = ["task_id", "round", "mode", "word_count", "generated_at"];
  const values = {};
  for (const field of fields) {
    const matches = [...frontmatter.matchAll(new RegExp(`^${field}:[ \\t]*(.*)$`, "gm"))];
    if (matches.length === 0) {
      errors.push(`missing frontmatter field ${field}`);
      continue;
    }
    if (matches.length > 1) errors.push(`duplicate frontmatter field ${field}`);
    values[field] = matches[0][1].trim();
  }
  return values;
}

function isIsoTimestamp(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  if (offsetHourText !== undefined && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)) return false;
  return true;
}

function validateDraftMarkdown(draft, spec, evidenceFiles) {
  const errors = [];
  const frontmatter = draft.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const values = frontmatter ? frontmatterValues(frontmatter[1], errors) : frontmatterValues("", errors);
  const rawBody = frontmatter ? draft.slice(frontmatter[0].length) : draft;
  const visibleBody = stripFencedCodeBlocks(rawBody);

  const taskIdValid = values.task_id !== undefined && values.task_id.length > 0;
  if (values.task_id !== undefined && !taskIdValid) errors.push("frontmatter task_id must be nonempty");

  const roundValid = values.round !== undefined && /^[1-9]\d*$/.test(values.round)
    && Number.isSafeInteger(Number(values.round));
  const round = roundValid ? Number(values.round) : null;
  if (values.round !== undefined && !roundValid) errors.push("frontmatter round must be a positive integer");

  const modeValid = values.mode === "initial" || values.mode === "revision";
  if (values.mode !== undefined && !modeValid) errors.push("frontmatter mode must be initial or revision");
  if (roundValid && values.mode === "initial" && round !== 1) {
    errors.push("frontmatter mode initial requires round 1");
  }
  if (roundValid && values.mode === "revision" && round <= 1) {
    errors.push("frontmatter mode revision requires round greater than 1");
  }

  const wordCountValid = values.word_count !== undefined && /^(?:0|[1-9]\d*)$/.test(values.word_count)
    && Number.isSafeInteger(Number(values.word_count));
  const declaredWordCount = wordCountValid ? Number(values.word_count) : null;
  if (values.word_count !== undefined && !wordCountValid) errors.push("frontmatter word_count must be an integer");

  if (values.generated_at !== undefined && !isIsoTimestamp(values.generated_at)) {
    errors.push("frontmatter generated_at must be an ISO timestamp");
  }

  if (taskIdValid) {
    for (const evidence of evidenceFiles) {
      if (evidence.task_id !== values.task_id) {
        errors.push(`frontmatter task_id ${values.task_id} does not match evidence ${evidence.dimension_id} task_id ${evidence.task_id}`);
      }
    }
  }

  for (const heading of ["Executive Summary", "Uncertainty Register", "Sources", "Meta-Commentary for Evaluator"]) {
    if (!hasHeading(visibleBody, heading)) errors.push(`missing heading ## ${heading}`);
  }

  for (const dimension of spec.dimensions) {
    const heading = new RegExp(`^## \\[${escapeRegExp(dimension.id)}\\](?:\\s|$)`, "m");
    if (!heading.test(visibleBody)) errors.push(`missing dimension section ${dimension.id}`);
  }

  for (const artifact of spec.artifactPlan) {
    const markerPattern = new RegExp(`<!--\\s*artifact:${escapeRegExp(artifact.id)}\\s+placement:([a-z_]+)\\s*-->`);
    const match = visibleBody.match(markerPattern);
    if (!match) {
      errors.push(`missing artifact marker ${artifact.id}`);
    } else {
      if (match[1] !== artifact.placement) errors.push(`${artifact.id} placement must be ${artifact.placement}`);
      const prefix = visibleBody.slice(0, match.index);
      const headings = [...prefix.matchAll(/^## (.+)$/gm)].map((headingMatch) => headingMatch[1]);
      const containingHeading = headings.at(-1) || "";
      const locatedCorrectly = artifact.placement === "executive_summary"
        ? containingHeading === "Executive Summary"
        : artifact.placement === "dimension_section"
          ? /^\[dim_[0-9]{3}\]/.test(containingHeading)
          : containingHeading === "Appendix";
      if (!locatedCorrectly) errors.push(`${artifact.id} is not located in its declared ${artifact.placement} section`);
    }
  }

  const knownSources = sourceIds(evidenceFiles);
  for (const citation of extractCitations(visibleBody)) {
    if (!knownSources.has(citation)) errors.push(`citation ${citation} has no evidence source`);
  }

  const actualWordCount = rawBody.split(/\s+/).filter(Boolean).length;
  if (wordCountValid && declaredWordCount !== actualWordCount) {
    errors.push(`frontmatter word_count ${declaredWordCount} does not equal actual ${actualWordCount}`);
  }
  if (actualWordCount > spec.outputFormat.maxWords) {
    errors.push(`draft has ${actualWordCount} words, exceeding maxWords ${spec.outputFormat.maxWords}`);
  }
  return errors;
}

function sectionBody(content, heading) {
  const match = new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, "m").exec(content);
  if (!match) return null;
  const tail = content.slice(match.index + match[0].length);
  const end = tail.search(/^## /m);
  return (end < 0 ? tail : tail.slice(0, end)).trim();
}

function sectionLines(content, heading) {
  const body = sectionBody(content, heading);
  if (body === null) return [];
  return body.split("\n").map((line) => line.trim()).filter(Boolean);
}

function normalized(value) {
  return value.replace(/\s+/g, " ").trim();
}

function metadataLineValues(content, label) {
  return [...content.matchAll(new RegExp(`^\\*\\*${escapeRegExp(label)}:\\*\\* (.*)$`, "gm"))]
    .map((match) => match[1]);
}

function validateBlockingBullet(line, evaluation, defectsById, errors) {
  const match = line.match(/^- \[([^\]]+)\] \[(gate|criterion):([a-z][a-z0-9_]*)\] \[section:(## [^\]]+)\] (\S.*)$/);
  if (!match) {
    errors.push(`invalid Must Fix blocking bullet: ${line}`);
    return;
  }

  const [, defectId, kind, target, section] = match;
  const defect = defectsById.get(defectId);
  if (!defect) errors.push(`Must Fix references unknown defect ${defectId}`);

  if (kind === "gate") {
    if (!Object.hasOwn(evaluation.gates, target)) {
      errors.push(`Must Fix references unknown gate ${target}`);
    } else if (defect && (evaluation.gates[target].status !== "fail" || defect.criterion !== target)) {
      errors.push(`Must Fix gate ${target} is not a failed applicable gate for defect ${defectId}`);
    }
  } else if (!Object.hasOwn(evaluation.criteria, target)) {
    errors.push(`Must Fix references unknown criterion ${target}`);
  } else if (defect && defect.criterion !== target) {
    errors.push(`Must Fix criterion ${target} is not applicable to defect ${defectId}`);
  }

  if (defect && section !== defect.draft_section) {
    errors.push(`Must Fix section ${section} does not match defect ${defectId} section ${defect.draft_section}`);
  }
}

function validateWeakDimensions(lines, expectedDimensions) {
  if (expectedDimensions.length === 0) return lines.length === 1 && lines[0] === "- none";
  if (lines.length !== expectedDimensions.length) return false;
  if (!lines.every((line) => /^- dim_[0-9]{3}$/.test(line))) return false;
  const actual = lines.map((line) => line.slice(2));
  if (new Set(actual).size !== actual.length) return false;
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expectedDimensions].sort());
}

function validateFeedbackMarkdown(feedback, evaluation) {
  const errors = [];
  const visibleFeedback = stripFencedCodeBlocks(feedback);
  const headings = ["Summary", "Must Fix", "Should Improve", "Preserve", "New Research Directions", "Weak Dimensions"];
  for (const heading of headings) {
    if (!hasHeading(visibleFeedback, heading)) errors.push(`missing heading ## ${heading}`);
  }

  const firstLine = visibleFeedback.split(/\r?\n/, 1)[0];
  const h1 = firstLine.match(/^# Feedback: \S(?:.*\S)? - Round ([1-9]\d*)$/);
  if (!h1 || Number(h1[1]) !== evaluation.iteration) {
    errors.push(`Feedback H1 round must match eval JSON iteration ${evaluation.iteration}`);
  }

  const verdictValues = metadataLineValues(visibleFeedback, "Verdict");
  if (verdictValues.length !== 1 || verdictValues[0] !== evaluation.verdict) {
    errors.push("Verdict must match eval JSON");
  }
  const scoreValues = metadataLineValues(visibleFeedback, "Overall Score");
  if (scoreValues.length !== 1 || scoreValues[0] !== `${evaluation.overall_score}/5.0`) {
    errors.push("Overall Score must match eval JSON");
  }

  if (hasHeading(visibleFeedback, "Summary")) {
    const actualSummary = normalized(sectionBody(visibleFeedback, "Summary"));
    if (actualSummary !== normalized(evaluation.summary)) errors.push("Summary must match eval JSON");
  }

  if (hasHeading(visibleFeedback, "Must Fix")) {
    const mustFixLines = sectionLines(visibleFeedback, "Must Fix");
    if (evaluation.pass) {
      if (mustFixLines.length !== 1 || mustFixLines[0] !== "- none") {
        errors.push("passing feedback Must Fix section must be exactly - none");
      }
    } else {
      const blockingLines = mustFixLines.filter((line) => line !== "- none");
      if (blockingLines.length === 0) {
        errors.push("non-PASS feedback Must Fix requires at least one blocking bullet");
      }
      if (mustFixLines.includes("- none") && blockingLines.length > 0) {
        errors.push("non-PASS feedback Must Fix must not contain - none");
      }
      const defectsById = new Map(evaluation.defects.map((defect) => [defect.id, defect]));
      for (const line of blockingLines) validateBlockingBullet(line, evaluation, defectsById, errors);
    }
  }

  if (hasHeading(visibleFeedback, "Preserve")) {
    const preserveLines = sectionLines(visibleFeedback, "Preserve");
    if (!preserveLines.some((line) => /^-\s+\S/.test(line))) {
      errors.push("Preserve must contain at least one nonempty bullet");
    }
  }

  if (hasHeading(visibleFeedback, "Weak Dimensions")) {
    const weakLines = sectionLines(visibleFeedback, "Weak Dimensions");
    if (!validateWeakDimensions(weakLines, evaluation.weak_dimensions)) {
      errors.push("Weak Dimensions must match eval JSON exactly");
    }
  }
  return errors;
}

module.exports = { validateDraftMarkdown, validateFeedbackMarkdown };
