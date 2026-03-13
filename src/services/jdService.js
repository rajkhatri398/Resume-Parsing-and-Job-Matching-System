const { v4: uuidv4 } = require("uuid");
const { Store } = require("../models/db");
const { parseJD } = require("../parsers/jdParser");

const COL = "job_descriptions";

function createJD(rawText, meta = {}) {
  const parsed = parseJD(rawText, meta);
  const id = uuidv4();
  const jobId = meta.jobId || `JD-${id.slice(0, 8).toUpperCase()}`;
  parsed.jobId = jobId;

  const existing = Store.findOne(COL, (d) => d.jobId === jobId);
  const docId = existing ? existing._id : id;

  Store.upsert(COL, docId, {
    jobId,
    role: parsed.role,
    company: parsed.company,
    salary: parsed.salary,
    yearOfExperience: parsed.yearOfExperience,
    requiredSkills: parsed.requiredSkills,
    optionalSkills: parsed.optionalSkills,
    aboutRole: parsed.aboutRole,
    rawText: parsed.rawText,
    _createdAt: (existing && existing._createdAt) || new Date().toISOString(),
  });

  return { id, ...parsed };
}

function getJDById(id) {
  const byId = Store.findById(COL, id);
  if (byId) return hydrateDoc(byId);
  const byJobId = Store.findOne(COL, (d) => d.jobId === id);
  return byJobId ? hydrateDoc(byJobId) : null;
}

function getAllJDs(limit = 50, offset = 0) {
  return Store.findAll(COL, null, { limit, offset }).map(hydrateDoc);
}

function deleteJD(id) {
  if (Store.remove(COL, id)) return true;
  const doc = Store.findOne(COL, (d) => d.jobId === id);
  if (doc) return Store.remove(COL, doc._id);
  return false;
}

function hydrateDoc(doc) {
  return {
    id: doc._id,
    jobId: doc.jobId,
    role: doc.role,
    company: doc.company,
    salary: doc.salary,
    yearOfExperience: doc.yearOfExperience,
    requiredSkills: doc.requiredSkills || [],
    optionalSkills: doc.optionalSkills || [],
    aboutRole: doc.aboutRole,
    createdAt: doc._createdAt,
    rawText: doc.rawText,
  };
}

module.exports = {
  createJD,
  getJDById,
  getAllJDs,
  deleteJD,
};
