function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\+\#\.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function getSectionContent(text, startPattern, endPatterns = []) {
  const match = startPattern.exec(text);
  if (!match) return null;

  const start = match.index + match[0].length;
  let end = text.length;

  for (const ep of endPatterns) {
    ep.lastIndex = start;
    const endMatch = ep.exec(text);
    if (endMatch && endMatch.index < end) {
      end = endMatch.index;
    }
  }

  return text.slice(start, end).trim();
}

function parseSalaryValue(raw) {
  if (!raw) return null;

  const cleaned = raw.replace(/,/g, "").trim();

  const lpaMatch = cleaned.match(/([\d.]+)\s*(?:LPA|lpa|lac\s+per\s+annum)/i);
  if (lpaMatch) return `${lpaMatch[1]} LPA`;

  const inrMatch = cleaned.match(/(?:₹|INR|Rs\.?)\s*([\d.]+)/i);
  if (inrMatch) {
    const val = parseFloat(inrMatch[1]);
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} LPA`;
    return `₹${val}`;
  }

  const rangeMatch = cleaned.match(/\$?([\d.]+)\s*[-–]\s*\$?([\d.]+)/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    const fmt = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`);
    return `${fmt(lo)} - ${fmt(hi)}`;
  }

  const singleMatch = cleaned.match(/\$?([\d.]+)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}/hr`;
  }

  return raw.trim();
}

function calculateYearsFromDateRanges(text) {
  const { DATE_RANGE_PATTERNS } = require("./patterns");
  let totalMonths = 0;
  const now = new Date();

  for (const pattern of DATE_RANGE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const startDate = parseDate(match);
        const endRaw = match[2] || match[4] || match[match.length - 1];
        const endDate =
          /present|current|now/i.test(endRaw) ? now : parseEndDate(match);
        if (startDate && endDate && endDate > startDate) {
          totalMonths +=
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth());
        }
      } catch (_) {}
    }
  }

  return totalMonths > 0 ? parseFloat((totalMonths / 12).toFixed(1)) : null;
}

function parseDate(match) {
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  if (match[0].match(/[a-zA-Z]/)) {
    const parts = match[0].match(/([a-z]+)\s+(\d{4})/i);
    if (parts) {
      const month = monthMap[parts[1].toLowerCase().slice(0, 3)];
      return new Date(parseInt(parts[2]), month || 0);
    }
  }
  if (match[1] && match[2]) {
    const m = parseInt(match[1]);
    const y = parseInt(match[2]);
    if (y > 1900 && y < 2100) return new Date(y, (m || 1) - 1);
  }
  return null;
}

function parseEndDate(match) {
  const fullMatch = match[0];
  const parts = fullMatch.split(/[-–—to]+/);
  if (parts.length < 2) return null;
  const endPart = parts[parts.length - 1].trim();
  if (/present|current|now/i.test(endPart)) return new Date();
  const yearMatch = endPart.match(/\d{4}/);
  if (yearMatch) return new Date(parseInt(yearMatch[0]), 0);
  return null;
}

function extractFirstNLines(text, n = 10) {
  return text.split("\n").slice(0, n).join("\n");
}

function stripBullets(text) {
  return text.replace(/^[\s•\-\*\>\◦\▪\●]+/gm, "").trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  normalizeText,
  tokenize,
  getSectionContent,
  parseSalaryValue,
  calculateYearsFromDateRanges,
  extractFirstNLines,
  stripBullets,
  escapeRegex,
};
