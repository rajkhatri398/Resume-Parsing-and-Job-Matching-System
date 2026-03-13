const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;
const uploadDir = process.env.UPLOAD_DIR || (isVercel ? "/tmp/uploads" : "./uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".docx", ".doc", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) return cb(null, true);
  cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(", ")}`));
};

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;

const upload = multer({ storage, fileFilter, limits: { fileSize: maxSizeMB } });

module.exports = upload;
