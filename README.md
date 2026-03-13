# Resume Parsing and Job Matching System

A production-ready, rule-based system that parses resumes and matches them against job descriptions — built entirely without LLMs. Uses regex, heuristics, and a hand-crafted skills knowledge base across 150+ technologies.

## Assignment Compliance

### Constraint Compliance (No LLMs)

- No OpenAI/ChatGPT, Gemini, Claude, or any generative AI APIs are used.
- No AI-based resume parsing SaaS is integrated.
- The system uses deterministic logic only: regex patterns, lexical matching, section heuristics, and rule-based scoring.

### Functional Requirements Mapping

| Requirement | Implemented | Where |
|---|---|---|
| JD Salary Extraction | Yes | `src/parsers/jdParser.js` |
| JD Experience Extraction | Yes | `src/parsers/jdParser.js` |
| JD Skills Extraction | Yes | `src/parsers/skillExtractor.js`, `src/parsers/jdParser.js` |
| Required vs Optional Skills | Yes | `src/parsers/jdParser.js` |
| About Role Summary | Yes | `src/parsers/jdParser.js` |
| Skill Mapping (`presentInResume`) | Yes | `src/parsers/skillExtractor.js`, `src/services/matchService.js` |
| Matching Score 0–100 | Yes | `src/matchers/jobMatcher.js` |
| Output JSON Structure | Yes | `src/services/matchService.js`, `data/sample_output.json` |
| API Implementation (Bonus) | Yes | `src/api/routes/*` |
| Persistent Storage (Bonus) | Yes | `src/models/db.js` |
| UI (Bonus) | Yes | `public/*` |
| Docker Support (Bonus) | Yes | `Dockerfile`, `docker-compose.yml` |

---

## Features

- **Resume Parsing** — Extract name, email, phone, skills, years of experience, salary, and education from PDF, DOCX, and TXT files
- **JD Parsing** — Extract required skills, optional skills, salary range, experience required, and role summary from raw job description text
- **Skill Matching** — Check every JD skill against the resume and produce a per-skill presence map
- **Matching Score** — `(matched JD skills / total JD skills) × 100`
- **Match Verdicts** — Strong Match (≥80%), Good Match (≥60%), Partial Match (≥40%), Weak Match (<40%)
- **REST API** — Full CRUD for resumes and JDs, plus match endpoints
- **File-based JSON Store** — Persistent storage for resumes, JDs, and match history
- **Docker Support** — Single-command deployment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | Local JSON file store |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| Skill Matching | Regex + custom skills knowledge base |
| Containerization | Docker + Docker Compose |

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Local Setup

```bash
# 1. Clone and enter the directory
cd "Resume Parsing and Job Matching System"

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env

# 4. Start the server
npm start
```

Server starts at `http://localhost:3000`.

### Evaluator Quick Check (2-3 minutes)

1. `GET /health` should return `{ status: "ok" }`.
2. `POST /api/resumes/text` with a sample resume should return parsed `resumeSkills` and `yearOfExperience`.
3. `POST /api/jds` with sample JD text should return `requiredSkills`, `optionalSkills`, `aboutRole`, and parsed `salary`.
4. `POST /api/match/resume/:resumeId/all` should return `skillsAnalysis` entries with `presentInResume` and a `matchingScore` from 0 to 100.
5. Open `http://localhost:3000/` to validate the UI flow (resume -> JD -> matching).

### Web UI

After starting the server, open:

```text
http://localhost:3000/
```

The dashboard supports:
- Resume parsing from text or file upload
- JD parsing from text
- Match resume vs one JD or all JDs
- Listing parsed resumes and JDs

### Docker Setup

```bash
docker-compose up --build
```

## Postman Collection

Import this file into Postman:

```text
postman/Resume-Parser-Job-Matcher.postman_collection.json
```

Set collection variables:
- `baseUrl` (default: `http://localhost:3000`)
- `resumeId`
- `jdId`

---

## API Reference

### Health Check

```
GET /health
```

---

### Resumes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload a resume file (PDF/DOCX/TXT) |
| POST | `/api/resumes/text` | Parse resume from raw text |
| GET | `/api/resumes` | List all resumes |
| GET | `/api/resumes/:id` | Get resume by ID |
| DELETE | `/api/resumes/:id` | Delete a resume |

**Upload resume file:**
```bash
curl -X POST http://localhost:3000/api/resumes/upload \
  -F "resume=@/path/to/resume.pdf"
```

**Parse from text:**
```bash
curl -X POST http://localhost:3000/api/resumes/text \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe\njohn@example.com\n5 years of Java, Spring Boot, Docker..."}'
```

---

### Job Descriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jds` | Add a job description |
| POST | `/api/jds/bulk` | Add up to 50 JDs at once |
| GET | `/api/jds` | List all JDs |
| GET | `/api/jds/:id` | Get JD by ID or jobId |
| DELETE | `/api/jds/:id` | Delete a JD |

**Add a JD:**
```bash
curl -X POST http://localhost:3000/api/jds \
  -H "Content-Type: application/json" \
  -d '{
    "text": "<full JD text>",
    "role": "Backend Developer",
    "company": "Capgemini",
    "jobId": "JD001"
  }'
```

---

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/resume/:resumeId/jd/:jdId` | Match one resume against one JD |
| POST | `/api/match/resume/:resumeId/all` | Match resume against all stored JDs |
| GET | `/api/match/resume/:resumeId/history` | Get match history for a resume |
| GET | `/api/match/jd/:jdId/candidates` | Get top candidates for a JD |

**Match resume against all JDs:**
```bash
curl -X POST http://localhost:3000/api/match/resume/<resumeId>/all
```

---

## Output Format

```json
{
  "name": "John Doe",
  "salary": null,
  "yearOfExperience": 6,
  "resumeSkills": ["Java", "Spring Boot", "Docker", "Kubernetes"],
  "matchingJobs": [
    {
      "jobId": "JD001",
      "role": "Backend Developer",
      "company": "Capgemini",
      "aboutRole": "Strong hands-on experience with Core Java, Spring Boot...",
      "salary": "$61,087 - $104,364",
      "skillsAnalysis": [
        { "skill": "Java", "presentInResume": true },
        { "skill": "Kafka", "presentInResume": false }
      ],
      "matchingScore": 69,
      "requiredSkillsScore": 75,
      "verdict": "Good Match",
      "experienceMatch": "slightly_below",
      "missingRequiredSkills": ["Kafka", "Angular"]
    }
  ]
}
```

See [data/sample_output.json](data/sample_output.json) for a full example.

---

## Matching Score Formula

```
Matching Score = (Matched JD Skills / Total JD Skills) × 100
```

| Score | Verdict |
|-------|---------|
| ≥ 80% | Strong Match |
| ≥ 60% | Good Match |
| ≥ 40% | Partial Match |
| < 40% | Weak Match |

### Formula Used

`matchingScore = Math.round((matchedJDSkills / totalJDSkills) * 100)`

This ensures the score always remains between 0 and 100.

---

## Test Coverage

Automated tests are included for key logic and API smoke checks:

- `tests/jdParser.test.js` (salary + required/optional skills extraction)
- `tests/matcher.test.js` (matching score calculation)
- `tests/api.test.js` (health endpoint)

Run tests:

```bash
npm test -- --runInBand
```

---

## Project Structure

```
src/
├── api/
│   ├── middleware/
│   │   ├── errorHandler.js     # Central error handler
│   │   └── upload.js           # Multer file upload config
│   └── routes/
│       ├── resume.routes.js    # Resume CRUD endpoints
│       ├── jd.routes.js        # JD CRUD endpoints
│       └── match.routes.js     # Match + scoring endpoints
├── matchers/
│   └── jobMatcher.js           # Score calculation & match logic
├── models/
│   └── db.js                   # File-based JSON data store
├── parsers/
│   ├── fileParser.js           # PDF/DOCX/TXT text extraction
│   ├── jdParser.js             # JD field extraction
│   ├── resumeParser.js         # Resume field extraction
│   └── skillExtractor.js       # Skill detection engine
├── services/
│   ├── jdService.js            # JD business logic + DB ops
│   ├── matchService.js         # Match orchestration + DB ops
│   └── resumeService.js        # Resume business logic + DB ops
├── utils/
│   ├── patterns.js             # All regex patterns
│   ├── skillsDatabase.js       # 150+ skills knowledge base
│   └── textUtils.js            # Text normalization helpers
├── app.js                      # Express app setup
└── server.js                   # Entry point
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_PATH` | `./data/database.db` | Base path used to resolve local JSON data files |
| `UPLOAD_DIR` | `./uploads` | Temporary file upload directory |
| `MAX_FILE_SIZE_MB` | `10` | Max resume file size in MB |

---

## Supported File Formats

| Format | Extension |
|--------|-----------|
| PDF | `.pdf` |
| Word Document | `.docx`, `.doc` |
| Plain Text | `.txt` |

---

## Submission Proof (Screenshots)

Place your screenshots inside the folder `assets/proof` using the filenames below. They will render directly in this README.

### 1) Resume Upload + Step Flow

![Resume Upload and Step Flow](assets/proof/Screenshot%202026-03-13%20151614.png)

### 2) Resume ID Always Visible + JD Filled

![Resume ID Visible and JD Entry](assets/proof/Screenshot%202026-03-13%20151651.png)

### 3) Matching + Quick Data View + API Result

![Matching and Output](assets/proof/Screenshot%202026-03-13%20151711.png)

---

## Answers / Verification Notes

- **Q: Is Resume ID visible in frontend and always available?**
  - **Answer:** Yes. The UI shows a persistent **Current Resume ID** banner, and it is stored in browser local storage so it remains visible after refresh.

- **Q: Are upload/save/match actions acknowledged clearly?**
  - **Answer:** Yes. Success/error/info toast popups are shown for resume upload, JD save, matching, and list loading.

- **Q: Is the app deployed and accessible?**
  - **Answer:** Yes. Vercel production deployment is active and the app + health endpoint are reachable.

- **Q: Does output include skills analysis and matching score?**
  - **Answer:** Yes. API result includes `skillsAnalysis` with `presentInResume` and score fields like `matchingScore`, `requiredSkillsScore`, and verdict.
