const { parseJD } = require("../src/parsers/jdParser");

describe("parseJD", () => {
  test("extracts salary from plain numeric range", () => {
    const text = `
      Job Description
      The base compensation range for this role in the posted location is: 61087 - 104364
      Must have 7 years of Java and Spring Boot experience.
    `;

    const result = parseJD(text, { jobId: "JD001" });
    expect(result.salary).toBe("$61,087 - $104,364");
  });

  test("extracts required and optional skills", () => {
    const text = `
      Required Qualifications:
      Java, Spring Boot, MySQL, Docker, Kubernetes

      Good to have:
      Python, Azure, CI/CD
    `;

    const result = parseJD(text, { jobId: "JD002" });
    expect(result.requiredSkills).toEqual(expect.arrayContaining(["Java", "Spring Boot", "MySQL", "Docker", "Kubernetes"]));
    expect(result.optionalSkills).toEqual(expect.arrayContaining(["Python", "Azure", "CI/CD"]));
  });
});
