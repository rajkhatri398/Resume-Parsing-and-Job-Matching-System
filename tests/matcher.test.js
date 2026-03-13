const { calculateMatchingScore } = require("../src/matchers/jobMatcher");

describe("calculateMatchingScore", () => {
  test("returns 0 when JD skills are empty", () => {
    expect(calculateMatchingScore(["Java"], [])).toBe(0);
  });

  test("returns percentage based on matched skills", () => {
    const resumeSkills = ["Java", "Spring Boot", "Docker"];
    const jdSkills = ["Java", "Kafka", "Docker", "MySQL"];
    expect(calculateMatchingScore(resumeSkills, jdSkills)).toBe(50);
  });
});
