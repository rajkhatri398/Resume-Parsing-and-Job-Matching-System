const { v4: uuidv4 } = require("uuid");
const { Store } = require("../models/db");
const { getResumeById } = require("./resumeService");
const { getJDById, getAllJDs } = require("./jdService");
const {
  matchResumeToJD,
  matchResumeToMultipleJDs,
  generateMatchSummary,
} = require("../matchers/jobMatcher");

const COL = "matches";

function matchResumeAgainstJD(resumeId, jdId) {
  const resume = getResumeById(resumeId);
  if (!resume) throw new Error(`Resume not found: ${resumeId}`);

  const jd = getJDById(jdId);
  if (!jd) throw new Error(`Job description not found: ${jdId}`);

  const matchResult = matchResumeToJD(resume, jd);
  const summary = generateMatchSummary(matchResult);
  persistMatch(resumeId, jd.id, jd.jobId, matchResult, summary);

  return buildOutput(resume, [{ ...matchResult, ...summary }]);
}

function matchResumeAgainstAllJDs(resumeId) {
  const resume = getResumeById(resumeId);
  if (!resume) throw new Error(`Resume not found: ${resumeId}`);

  const jds = getAllJDs(200);
  if (jds.length === 0) return buildOutput(resume, []);

  const matchingJobs = jds.map((jd) => {
    const matchResult = matchResumeToJD(resume, jd);
    const summary = generateMatchSummary(matchResult);

    persistMatch(resumeId, jd.id, jd.jobId, matchResult, summary);

    return { ...matchResult, ...summary };
  });

  matchingJobs.sort((a, b) => b.matchingScore - a.matchingScore);
  return buildOutput(resume, matchingJobs);
}

function getMatchHistory(resumeId, limit = 20) {
  const docs = Store.findAll(
    COL,
    (d) => d.resumeId === resumeId,
    { limit, sortBy: "matchingScore", desc: true }
  );
  return docs.map((d) => ({
    matchId: d._id,
    jobId: d.jobId,
    role: d.role,
    company: d.company,
    salary: d.salary,
    matchingScore: d.matchingScore,
    requiredSkillsScore: d.requiredSkillsScore,
    experienceMatch: d.experienceMatch,
    verdict: d.verdict,
    createdAt: d._createdAt,
  }));
}

function getTopCandidatesForJD(jdId, limit = 10) {
  const jd = getJDById(jdId);
  if (!jd) return [];

  const docs = Store.findAll(
    COL,
    (d) => d.jdId === jd.id,
    { limit, sortBy: "matchingScore", desc: true }
  );

  return docs.map((d) => {
    const resume = getResumeById(d.resumeId) || {};
    return {
      resumeId: d.resumeId,
      name: resume.name,
      email: resume.email,
      yearOfExperience: resume.yearOfExperience,
      resumeSkills: resume.resumeSkills || [],
      matchingScore: d.matchingScore,
      requiredSkillsScore: d.requiredSkillsScore,
      verdict: d.verdict,
    };
  });
}

function persistMatch(resumeId, jdId, jobId, matchResult, summary) {
  const existing = Store.findOne(COL, (d) => d.resumeId === resumeId && d.jdId === jdId);
  const id = existing ? existing._id : uuidv4();
  const jd = getJDById(jdId) || {};

  Store.upsert(COL, id, {
    resumeId,
    jdId,
    jobId,
    role: matchResult.role,
    company: matchResult.company,
    salary: matchResult.salary,
    matchingScore: matchResult.matchingScore,
    requiredSkillsScore: summary.requiredSkillsScore,
    experienceMatch: summary.experienceMatch,
    verdict: summary.verdict,
    analysis: { matchResult, summary },
    _createdAt: (existing && existing._createdAt) || new Date().toISOString(),
  });
}

function buildOutput(resume, matchingJobs) {
  return {
    name: resume.name,
    email: resume.email,
    phone: resume.phone,
    salary: resume.salary,
    yearOfExperience: resume.yearOfExperience,
    resumeSkills: resume.resumeSkills,
    education: resume.education,
    matchingJobs: matchingJobs.map((job) => ({
      jobId: job.jobId,
      role: job.role,
      company: job.company,
      aboutRole: job.aboutRole,
      salary: job.salary,
      skillsAnalysis: job.skillsAnalysis,
      matchingScore: job.matchingScore,
      requiredSkillsScore: job.requiredSkillsScore,
      verdict: job.verdict,
      experienceMatch: job.experienceMatch,
      missingRequiredSkills: job.missingRequiredSkills,
    })),
  };
}

module.exports = {
  matchResumeAgainstJD,
  matchResumeAgainstAllJDs,
  getMatchHistory,
  getTopCandidatesForJD,
};
