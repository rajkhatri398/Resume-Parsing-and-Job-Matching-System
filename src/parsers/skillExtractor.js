const { getAllSkills } = require("../utils/skillsDatabase");
const { escapeRegex } = require("../utils/textUtils");

const SKILL_LIST = getAllSkills();

function buildSkillPattern(skill) {
  const terms = [skill.name, ...(skill.aliases || [])];
  const escaped = terms.map(escapeRegex).sort((a, b) => b.length - a.length);
  return new RegExp(`(?<![a-zA-Z])(?:${escaped.join("|")})(?![a-zA-Z])`, "gi");
}

const COMPILED_PATTERNS = SKILL_LIST.map((skill) => ({
  skill,
  pattern: buildSkillPattern(skill),
}));

function extractSkills(text) {
  const found = new Map();

  for (const { skill, pattern } of COMPILED_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      found.set(skill.name.toLowerCase(), skill.name);
    }
  }

  return Array.from(found.values()).sort();
}

function extractSkillsFromSection(text, sectionText) {
  const skills = new Set();

  if (sectionText) {
    const fromSection = extractSkills(sectionText);
    fromSection.forEach((s) => skills.add(s));
  }

  const inlineSkillPattern = /(?:proficient|experience|expertise|skilled|knowledge|familiar|hands.on)\s+(?:in|with|on)?\s*:?\s*([^.\n]{5,120})/gi;
  let m;
  while ((m = inlineSkillPattern.exec(text)) !== null) {
    const fromInline = extractSkills(m[1]);
    fromInline.forEach((s) => skills.add(s));
  }

  const bulletSkills = extractSkills(text);
  bulletSkills.forEach((s) => skills.add(s));

  return Array.from(skills).sort();
}

function checkSkillPresence(jdSkills, resumeSkills) {
  const resumeNorm = resumeSkills.map((s) => s.toLowerCase());

  return jdSkills.map((skill) => {
    const skillLower = skill.toLowerCase();
    const present =
      resumeNorm.includes(skillLower) ||
      resumeNorm.some(
        (rs) =>
          rs.includes(skillLower) ||
          skillLower.includes(rs) ||
          fuzzyMatch(rs, skillLower)
      );
    return { skill, presentInResume: present };
  });
}

function fuzzyMatch(a, b) {
  if (Math.abs(a.length - b.length) > 4) return false;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.includes(shorter)) return true;
  const tokens = b.split(/[\s\./\-]+/);
  return tokens.some((t) => t.length > 3 && a.includes(t));
}

module.exports = { extractSkills, extractSkillsFromSection, checkSkillPresence };
