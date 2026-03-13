const {
  SALARY_PATTERNS,
  EXPERIENCE_PATTERNS,
  JD_REQUIRED_SECTION,
  JD_PREFERRED_SECTION,
  JD_SUMMARY_SECTION,
} = require("../utils/patterns");
const {
  normalizeText,
  parseSalaryValue,
  getSectionContent,
  stripBullets,
} = require("../utils/textUtils");
const { extractSkills } = require("./skillExtractor");

function parseJD(rawText, meta = {}) {
  const text = normalizeText(rawText);

  const salary = extractSalaryFromJD(text);
  const yearOfExperience = extractRequiredExperience(text);
  const { requiredSkills, optionalSkills } = extractJDSkills(text);
  const aboutRole = extractAboutRole(text);
  const role = meta.role || extractRoleTitle(text);
  const company = meta.company || extractCompany(text);

  return {
    jobId: meta.jobId || null,
    role,
    company,
    salary,
    yearOfExperience,
    requiredSkills,
    optionalSkills,
    aboutRole,
    rawText: text,
  };
}

function extractSalaryFromJD(text) {
  const plainRangePattern = /(?:base\s+compensation\s+range[^\n:]*:?\s*|pay\s+range[^\n:]*:?\s*|salary\s+range[^\n:]*:?\s*|range\s*:?\s*)?([\d,]{4,}(?:\.\d+)?)\s*[-–—]\s*([\d,]{4,}(?:\.\d+)?)/gi;
  let match = plainRangePattern.exec(text);
  if (match) {
    const lo = parseFloat(match[1].replace(/,/g, ""));
    const hi = parseFloat(match[2].replace(/,/g, ""));
    if (!isNaN(lo) && !isNaN(hi) && lo <= hi) {
      return `$${lo.toLocaleString("en-US")} - $${hi.toLocaleString("en-US")}`;
    }
  }

  const rangePattern = /\$\s*([\d,]+(?:\.\d+)?)\s*[-–—]\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:per\s+year|\/year|annually)?/gi;
  match = rangePattern.exec(text);
  if (match) {
    const lo = parseFloat(match[1].replace(/,/g, ""));
    const hi = parseFloat(match[2].replace(/,/g, ""));
    return `$${lo.toLocaleString("en-US")} - $${hi.toLocaleString("en-US")}`;
  }

  const hourlyPattern = /\$\s*([\d.]+)\s*\/\s*hour|\$\s*([\d.]+)\s*per\s+hour/gi;
  match = hourlyPattern.exec(text);
  if (match) {
    const rate = match[1] || match[2];
    return `$${rate}/hour`;
  }

  for (const pattern of SALARY_PATTERNS) {
    pattern.lastIndex = 0;
    match = pattern.exec(text);
    if (match) return parseSalaryValue(match[0]);
  }

  return null;
}

function extractRequiredExperience(text) {
  if (/\b(?:fresher|entry.level)\b/i.test(text)) return 0;

  const patterns = [
    /(\d+)\+?\s*(?:to|-)\s*(\d+)\+?\s*years?\s*(?:of\s*)?(?:relevant\s*)?(?:experience|exp)/i,
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:strong\s+)?(?:hands.on\s+)?(?:relevant\s*)?(?:experience|exp)/i,
    /(?:minimum|min|at\s+least|atleast)\s+(\d+)\+?\s*years?/i,
    /bachelor[^\n]*?(\d+)\+?\s*years?/i,
    /master[^\n]*?(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:3|4|5|6|7|8|9|10)\s*\+\s*years/i,
  ];

  for (const p of patterns) {
    const m = p.exec(text);
    if (m) {
      const nums = [m[1], m[2]].filter(Boolean).map(Number).filter((n) => !isNaN(n) && n < 50);
      if (nums.length === 2) return parseFloat(((nums[0] + nums[1]) / 2).toFixed(1));
      if (nums.length === 1) return nums[0];
    }
  }

  return null;
}

function extractJDSkills(text) {
  const requiredSection = extractSection(text, [
    /required\s+(?:qualifications?|skills?)/i,
    /must\s+have/i,
    /minimum\s+qualifications?/i,
    /basic\s+qualifications?/i,
    /key\s+responsibilities/i,
  ]);

  const preferredSection = extractSection(text, [
    /preferred\s+(?:qualifications?|skills?)/i,
    /desired\s+(?:qualifications?|skills?|multipliers)/i,
    /nice\s+to\s+have/i,
    /good\s+to\s+have/i,
    /bonus/i,
  ]);

  const allSkills = extractSkills(text);
  const requiredSkills = requiredSection
    ? extractSkills(requiredSection)
    : allSkills;
  const optionalSkills = preferredSection
    ? extractSkills(preferredSection).filter((s) => !requiredSkills.includes(s))
    : [];

  return {
    requiredSkills: [...new Set(requiredSkills)],
    optionalSkills: [...new Set(optionalSkills)],
  };
}

function extractSection(text, startPatterns) {
  for (const startPattern of startPatterns) {
    const match = startPattern.exec(text);
    if (!match) continue;

    const start = match.index + match[0].length;
    let end = text.length;
    const remainder = text.slice(start);
    const nextHeaderPattern =
      /(?:\n|^)\s*(?:desired|preferred|nice\s+to\s+have|good\s+to\s+have|required|responsibilities|about|overview|job\s+description|qualifications|education|benefits|compensation|closing)\s*[:\-]?\s*(?:\n|$)/im;
    const sepMatch = nextHeaderPattern.exec(remainder);
    if (sepMatch && sepMatch.index > 0) {
      end = start + sepMatch.index;
    }

    return text.slice(start, end).trim();
  }

  return null;
}

function extractAboutRole(text) {
  const candidates = [
    JD_SUMMARY_SECTION.exec(text),
    /(?:position\s+overview|job\s+summary|role\s+summary)\s*[:\-]?\s*([\s\S]{50,500})/i.exec(text),
  ].filter(Boolean);

  if (candidates.length > 0) {
    const raw = candidates[0][1] || candidates[0][0];
    return raw.replace(/\s+/g, " ").trim().slice(0, 500);
  }

  const paras = text.split(/\n\n+/);
  for (const para of paras) {
    const clean = para.replace(/\s+/g, " ").trim();
    if (clean.length > 80 && clean.length < 600 && !/^\s*[-•*]/.test(clean)) {
      return clean.slice(0, 500);
    }
  }

  return text.replace(/\s+/g, " ").trim().slice(0, 300);
}

function extractRoleTitle(text) {
  const titlePatterns = [
    /(?:position|role|title|job\s+title|opening)\s*[:\-]?\s*([A-Za-z\s\/\-]{5,60})/i,
    /(?:seeking|looking\s+for|hiring)\s+(?:a\s+|an\s+)?([A-Za-z\s\/\-]{5,60})/i,
    /^([A-Z][A-Za-z\s\/\-]{4,50})(?:\s*\n|\s*$)/m,
  ];

  for (const p of titlePatterns) {
    const m = p.exec(text);
    if (m) {
      const candidate = m[1].replace(/\s+/g, " ").trim();
      if (candidate.length > 4 && candidate.length < 80) return candidate;
    }
  }

  return "Software Engineer";
}

function extractCompany(text) {
  const patterns = [
    /(?:at|join|about)\s+([A-Z][A-Za-z\s]{2,40}(?:Inc|LLC|Ltd|Corp|Technologies?|Solutions?|Systems?|Services?)?)/,
    /^([A-Z][A-Za-z\s]{2,40}(?:Inc|LLC|Ltd|Corp|Technologies?|Solutions?|Systems?|Services?))\s*$/m,
  ];

  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[1].trim();
  }

  return null;
}

module.exports = { parseJD };
