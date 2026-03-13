const { checkSkillPresence } = require("../parsers/skillExtractor");

function calculateMatchingScore(resumeSkills, jdSkills) {
  if (!jdSkills || jdSkills.length === 0) return 0;
  const analysis = checkSkillPresence(jdSkills, resumeSkills);
  const matched = analysis.filter((s) => s.presentInResume).length;
  return Math.round((matched / jdSkills.length) * 100);
}

function matchResumeToJD(parsedResume, parsedJD) {
  const allJdSkills = [
    ...new Set([...parsedJD.requiredSkills, ...parsedJD.optionalSkills]),
  ];

  const skillsAnalysis = checkSkillPresence(allJdSkills, parsedResume.resumeSkills);
  const matchingScore = calculateMatchingScore(parsedResume.resumeSkills, allJdSkills);
  const requiredAnalysis = checkSkillPresence(parsedJD.requiredSkills, parsedResume.resumeSkills);
  const requiredScore = calculateMatchingScore(parsedResume.resumeSkills, parsedJD.requiredSkills);

  const experienceMatch = assessExperienceMatch(
    parsedResume.yearOfExperience,
    parsedJD.yearOfExperience
  );

  return {
    jobId: parsedJD.jobId,
    role: parsedJD.role,
    company: parsedJD.company,
    aboutRole: parsedJD.aboutRole,
    salary: parsedJD.salary,
    requiredExperience: parsedJD.yearOfExperience,
    skillsAnalysis,
    requiredSkillsAnalysis: requiredAnalysis,
    matchingScore,
    requiredSkillsScore: requiredScore,
    experienceMatch,
  };
}

function matchResumeToMultipleJDs(parsedResume, parsedJDs) {
  const matchingJobs = parsedJDs
    .map((jd) => matchResumeToJD(parsedResume, jd))
    .sort((a, b) => b.matchingScore - a.matchingScore);

  return {
    name: parsedResume.name,
    email: parsedResume.email,
    phone: parsedResume.phone,
    salary: parsedResume.salary,
    yearOfExperience: parsedResume.yearOfExperience,
    resumeSkills: parsedResume.resumeSkills,
    education: parsedResume.education,
    matchingJobs,
  };
}

function assessExperienceMatch(resumeExp, requiredExp) {
  if (resumeExp === null || requiredExp === null) return "unknown";
  if (resumeExp >= requiredExp) return "meets_requirement";
  if (resumeExp >= requiredExp * 0.75) return "slightly_below";
  return "does_not_meet";
}

function generateMatchSummary(matchResult) {
  const { matchingScore, requiredSkillsScore, experienceMatch, skillsAnalysis } = matchResult;

  const missingRequired = matchResult.requiredSkillsAnalysis
    .filter((s) => !s.presentInResume)
    .map((s) => s.skill);

  const matchedSkills = skillsAnalysis
    .filter((s) => s.presentInResume)
    .map((s) => s.skill);

  let verdict;
  if (matchingScore >= 80) verdict = "Strong Match";
  else if (matchingScore >= 60) verdict = "Good Match";
  else if (matchingScore >= 40) verdict = "Partial Match";
  else verdict = "Weak Match";

  return {
    verdict,
    matchingScore,
    requiredSkillsScore,
    experienceMatch,
    matchedSkillsCount: matchedSkills.length,
    totalJdSkillsCount: skillsAnalysis.length,
    missingRequiredSkills: missingRequired,
  };
}

module.exports = {
  matchResumeToJD,
  matchResumeToMultipleJDs,
  calculateMatchingScore,
  generateMatchSummary,
};
