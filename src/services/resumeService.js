const { v4: uuidv4 } = require("uuid");
const { Store } = require("../models/db");
const { parseResume } = require("../parsers/resumeParser");
const { extractTextFromFile, extractTextFromBuffer } = require("../parsers/fileParser");

const COL = "resumes";

async function createResumeFromFile(filePath, fileName) {
  const rawText = await extractTextFromFile(filePath);
  return createResumeFromText(rawText, fileName);
}

async function createResumeFromBuffer(buffer, mimetype, fileName) {
  const rawText = await extractTextFromBuffer(buffer, mimetype);
  return createResumeFromText(rawText, fileName);
}

function createResumeFromText(rawText, fileName = "resume.txt") {
  const parsed = parseResume(rawText);
  const id = uuidv4();

  const doc = {
    fileName,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    salary: parsed.salary,
    yearOfExperience: parsed.yearOfExperience,
    resumeSkills: parsed.resumeSkills,
    education: parsed.education,
    summary: parsed.summary,
    rawText: parsed.rawText,
    _createdAt: new Date().toISOString(),
  };
  Store.insert(COL, id, doc);

  return { id, ...parsed };
}

function getResumeById(id) {
  const doc = Store.findById(COL, id);
  if (!doc) return null;
  return hydrateDoc(doc);
}

function getAllResumes(limit = 50, offset = 0) {
  return Store.findAll(COL, null, { limit, offset }).map(hydrateDoc);
}

function deleteResume(id) {
  return Store.remove(COL, id);
}

function hydrateDoc(doc) {
  return {
    id: doc._id,
    fileName: doc.fileName,
    createdAt: doc._createdAt,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    salary: doc.salary,
    yearOfExperience: doc.yearOfExperience,
    resumeSkills: doc.resumeSkills || [],
    education: doc.education || [],
    summary: doc.summary,
    rawText: doc.rawText,
  };
}

module.exports = {
  createResumeFromFile,
  createResumeFromBuffer,
  createResumeFromText,
  getResumeById,
  getAllResumes,
  deleteResume,
};
