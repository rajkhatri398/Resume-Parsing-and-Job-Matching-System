const {
  SALARY_PATTERNS,
  EXPERIENCE_PATTERNS,
  NAME_PATTERNS,
  EMAIL_PATTERN,
  PHONE_PATTERN,
} = require("../utils/patterns");
const {
  normalizeText,
  parseSalaryValue,
  calculateYearsFromDateRanges,
  extractFirstNLines,
} = require("../utils/textUtils");
const { extractSkillsFromSection } = require("./skillExtractor");

function parseResume(rawText) {
  const text = normalizeText(rawText);

  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const skills = extractSkillsFromSection(text, null);
  const yearOfExperience = extractExperience(text);
  const salary = extractSalary(text);
  const education = extractEducation(text);
  const summary = extractSummary(text);

  return {
    name,
    email,
    phone,
    salary,
    yearOfExperience,
    resumeSkills: skills,
    education,
    summary,
    rawText: text,
  };
}

function extractName(text) {
  const header = extractFirstNLines(text, 5);

  for (const pattern of NAME_PATTERNS) {
    const match = pattern.exec(header);
    if (match) {
      const candidate = match[1].trim();
      if (isValidName(candidate)) return candidate;
    }
  }

  const lines = header.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 3)) {
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(line) && line.split(" ").length <= 4) {
      if (isValidName(line)) return line;
    }
  }

  return null;
}

function isValidName(str) {
  const skipWords = /^(resume|cv|curriculum|vitae|profile|contact|summary|objective)$/i;
  const words = str.trim().split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  if (skipWords.test(words[0])) return false;
  return words.every((w) => /^[A-Z][a-z']+$/.test(w) || /^[A-Z]{2,3}$/.test(w));
}

function extractEmail(text) {
  const match = EMAIL_PATTERN.exec(text);
  return match ? match[0].toLowerCase() : null;
}

function extractPhone(text) {
  const match = PHONE_PATTERN.exec(text);
  return match ? match[0].trim() : null;
}

function extractSalary(text) {
  for (const pattern of SALARY_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      return parseSalaryValue(match[0]);
    }
  }
  return null;
}

function extractExperience(text) {
  const lower = text.toLowerCase();

  if (/\b(?:fresher|entry.level|no experience|0 years?)\b/i.test(lower)) return 0;

  for (const pattern of EXPERIENCE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const nums = [match[1], match[2]].filter(Boolean).map(Number).filter((n) => !isNaN(n) && n < 50);
      if (nums.length === 2) return parseFloat(((nums[0] + nums[1]) / 2).toFixed(1));
      if (nums.length === 1) return nums[0];
    }
  }

  const computed = calculateYearsFromDateRanges(text);
  if (computed) return computed;

  return null;
}

function extractEducation(text) {
  const degrees = [];
  const degreePattern =
    /(?:bachelor(?:'s)?|master(?:'s)?|phd|ph\.d|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?|b\.?tech|m\.?tech|b\.?sc|m\.?sc)\s*(?:in|of)?\s*([A-Za-z\s]{3,50})?(?:\s*from\s*([A-Za-z\s,]{3,60}))?/gi;

  let m;
  while ((m = degreePattern.exec(text)) !== null) {
    const degree = m[0].replace(/\s+/g, " ").trim();
    if (degree.length > 3) degrees.push(degree);
    if (degrees.length >= 3) break;
  }

  return [...new Set(degrees)];
}

function extractSummary(text) {
  const summaryPattern = /(?:summary|profile|objective|about me)\s*[:\-]?\s*([\s\S]{30,500}?)(?=\n\n|\n[A-Z])/i;
  const match = summaryPattern.exec(text);
  if (match) return match[1].replace(/\s+/g, " ").trim();
  return text.split("\n\n")[0].replace(/\s+/g, " ").trim().slice(0, 300) || null;
}

module.exports = { parseResume };
