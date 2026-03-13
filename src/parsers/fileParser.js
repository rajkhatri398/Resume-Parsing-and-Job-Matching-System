const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return extractFromPDF(filePath);
    case ".docx":
      return extractFromDOCX(filePath);
    case ".doc":
      return extractFromDOCX(filePath);
    case ".txt":
      return fs.readFileSync(filePath, "utf-8");
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractTextFromBuffer(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }
  throw new Error(`Unsupported MIME type: ${mimetype}`);
}

module.exports = { extractTextFromFile, extractTextFromBuffer };
