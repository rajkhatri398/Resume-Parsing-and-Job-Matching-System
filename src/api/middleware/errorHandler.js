const multer = require("multer");

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File too large. Check MAX_FILE_SIZE_MB setting.",
      LIMIT_UNEXPECTED_FILE: "Unexpected field name in form upload.",
    };
    return res.status(400).json({
      error: messages[err.code] || err.message,
      code: err.code,
    });
  }

  if (err.message && err.message.startsWith("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    console.error("[ERROR]", err);
  }

  return res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
