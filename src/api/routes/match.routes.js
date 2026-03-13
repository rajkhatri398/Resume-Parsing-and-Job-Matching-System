const router = require("express").Router();
const {
  matchResumeAgainstJD,
  matchResumeAgainstAllJDs,
  getMatchHistory,
  getTopCandidatesForJD,
} = require("../../services/matchService");

router.post("/resume/:resumeId/jd/:jdId", (req, res, next) => {
  try {
    const result = matchResumeAgainstJD(req.params.resumeId, req.params.jdId);
    res.json(result);
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

router.post("/resume/:resumeId/all", (req, res, next) => {
  try {
    const result = matchResumeAgainstAllJDs(req.params.resumeId);
    res.json(result);
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

router.get("/resume/:resumeId/history", (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const history = getMatchHistory(req.params.resumeId, limit);
    res.json({ count: history.length, data: history });
  } catch (err) {
    next(err);
  }
});

router.get("/jd/:jdId/candidates", (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const candidates = getTopCandidatesForJD(req.params.jdId, limit);
    res.json({ count: candidates.length, data: candidates });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
