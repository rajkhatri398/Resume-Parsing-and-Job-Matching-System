const router = require("express").Router();
const fs = require("fs");
const upload = require("../middleware/upload");
const {
  createResumeFromFile,
  createResumeFromText,
  getResumeById,
  getAllResumes,
  deleteResume,
} = require("../../services/resumeService");

router.post("/upload", upload.single("resume"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded. Field name must be 'resume'." });

  try {
    const result = await createResumeFromFile(req.file.path, req.file.originalname);
    fs.unlink(req.file.path, () => {});
    res.status(201).json(sanitize(result));
  } catch (err) {
    fs.unlink(req.file?.path, () => {});
    next(err);
  }
});

router.post("/text", async (req, res, next) => {
  const { text, fileName } = req.body;
  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res.status(400).json({ error: "Provide at least 50 characters in the 'text' field." });
  }

  try {
    const result = createResumeFromText(text, fileName || "resume.txt");
    res.status(201).json(sanitize(result));
  } catch (err) {
    next(err);
  }
});

router.get("/", (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const resumes = getAllResumes(limit, offset);
    res.json({ count: resumes.length, limit, offset, data: resumes.map(sanitize) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const resume = getResumeById(req.params.id);
    if (!resume) return res.status(404).json({ error: "Resume not found." });
    res.json(sanitize(resume));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const deleted = deleteResume(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Resume not found." });
    res.json({ message: "Resume deleted successfully." });
  } catch (err) {
    next(err);
  }
});

function sanitize(resume) {
  const { rawText, ...rest } = resume;
  return rest;
}

module.exports = router;
