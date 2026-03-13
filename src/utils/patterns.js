const SALARY_PATTERNS = [
  /\$\s*([\d,]+)\s*[-–—to]+\s*\$?\s*([\d,]+)\s*(?:per\s+year|\/year|\/yr|annually|per\s+annum)?/gi,
  /\$\s*([\d,]+(?:\.\d+)?)\s*(?:per\s+hour|\/hour|\/hr)/gi,
  /(?:salary|compensation|pay|ctc|package)\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:[-–—to]+\s*\$?\s*([\d,]+(?:\.\d+)?))?\s*(?:LPA|lpa|per\s+annum|\/year|\/yr|per\s+year|annually)?/gi,
  /(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:[-–—to]+\s*(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d+)?))?\s*(?:LPA|lpa|per\s+annum|lac|lakh)?/gi,
  /([\d]+(?:\.\d+)?)\s*(?:LPA|lpa|lac per annum)/gi,
  /(?:up\s+to|upto|between)\s+\$?\s*([\d,]+)\s*[-–—to]+\s*\$?\s*([\d,]+)/gi,
];

const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*(?:to|-)\s*(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)?/gi,
  /(\d+)\+?\s*years?\s*(?:of\s*)?(?:relevant\s+)?(?:experience|exp|work\s+experience)/gi,
  /(?:minimum|min|at\s+least|atleast)\s+(\d+)\+?\s*years?/gi,
  /(?:experience|exp)\s*[:\-]\s*(\d+)\+?\s*years?/gi,
  /(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)?/gi,
  /(?:bachelor|bs|b\.s)\s*with\s*(\d+)\+?\s*years?/gi,
  /(?:master|ms|m\.s)\s*with\s*(\d+)\+?\s*years?/gi,
  /(?:phd|ph\.d)\s*with\s*(\d+)\+?\s*years?/gi,
  /(?:fresher|entry.?level|0.?year)/gi,
  /(\d+)\+?\s*years?\s*(?:hands.?on|hands-on|professional|industry|proven)/gi,
];

const DATE_RANGE_PATTERNS = [
  /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})|present|current|now)/gi,
  /(\d{1,2})\/(\d{4})\s*[-–—to]+\s*(?:(\d{1,2})\/(\d{4})|present|current|now)/gi,
  /(\d{4})\s*[-–—to]+\s*(\d{4}|present|current)/gi,
];

const NAME_PATTERNS = [
  /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/m,
  /name\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
];

const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

const PHONE_PATTERN = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

const SECTION_HEADERS = {
  skills: /^(?:skills?|technical\s+skills?|core\s+competencies|technologies|tech\s+stack|expertise|proficiencies?)\s*:?\s*$/im,
  experience: /^(?:experience|work\s+experience|employment\s+history|professional\s+experience|work\s+history)\s*:?\s*$/im,
  education: /^(?:education|academic|qualifications?|degrees?)\s*:?\s*$/im,
  summary: /^(?:summary|profile|objective|about\s+me|professional\s+summary|career\s+summary)\s*:?\s*$/im,
  required: /^(?:required|must\s+have|minimum\s+qualifications?|basic\s+qualifications?)\s*:?\s*$/im,
  preferred: /^(?:preferred|desired|nice\s+to\s+have|bonus|good\s+to\s+have|optional)\s*:?\s*$/im,
};

const JD_REQUIRED_SECTION = /(?:required\s+qualifications?|must\s+have|minimum\s+qualifications?|basic\s+qualifications?|requirements?)\s*[:\-]?\s*([\s\S]*?)(?=desired|preferred|nice\s+to\s+have|good\s+to\s+have|responsibilities|$)/i;
const JD_PREFERRED_SECTION = /(?:desired|preferred|nice\s+to\s+have|good\s+to\s+have|bonus)\s*(?:qualifications?|skills?)?\s*[:\-]?\s*([\s\S]*?)(?=required|responsibilities|about|overview|$)/i;
const JD_SUMMARY_SECTION = /(?:about\s+(?:the\s+)?(?:role|position|job)|job\s+description|position\s+overview|overview|the\s+opportunity)\s*[:\-]?\s*([\s\S]{50,500})/i;

module.exports = {
  SALARY_PATTERNS,
  EXPERIENCE_PATTERNS,
  DATE_RANGE_PATTERNS,
  NAME_PATTERNS,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  SECTION_HEADERS,
  JD_REQUIRED_SECTION,
  JD_PREFERRED_SECTION,
  JD_SUMMARY_SECTION,
};
