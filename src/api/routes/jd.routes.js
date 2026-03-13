const router = require("express").Router();
const {
  createJD,
  getJDById,
  getAllJDs,
  deleteJD,
} = require("../../services/jdService");

router.post("/", (req, res, next) => {
  const { text, role, company, jobId } = req.body;
  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res.status(400).json({ error: "Provide at least 50 characters in the 'text' field." });
  }

  try {
    const result = createJD(text, { role, company, jobId });
    res.status(201).json(sanitize(result));
  } catch (err) {
    next(err);
  }
});

router.post("/bulk", (req, res, next) => {
  const { jobs } = req.body;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ error: "Provide a non-empty 'jobs' array." });
  }
  if (jobs.length > 50) {
    return res.status(400).json({ error: "Maximum 50 job descriptions per bulk request." });
  }

  try {
    const results = jobs.map((job) => {
      if (!job.text || job.text.trim().length < 50) {
        return { error: "Invalid or missing text", input: job };
      }
      return sanitize(createJD(job.text, { role: job.role, company: job.company, jobId: job.jobId }));
    });
    res.status(201).json({ count: results.length, data: results });
  } catch (err) {
    next(err);
  }
});

router.get("/", (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const jds = getAllJDs(limit, offset);
    res.json({ count: jds.length, limit, offset, data: jds.map(sanitize) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const jd = getJDById(req.params.id);
    if (!jd) return res.status(404).json({ error: "Job description not found." });
    res.json(sanitize(jd));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const deleted = deleteJD(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Job description not found." });
    res.json({ message: "Job description deleted successfully." });
  } catch (err) {
    next(err);
  }
});

function sanitize(jd) {
  const { rawText, ...rest } = jd;
  return rest;
}

module.exports = router;
