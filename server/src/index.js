const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const fs = require("fs/promises");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

// Multer (uploads folder)
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Suggestions generator
function generateEngagementSuggestions(text) {
  const suggestions = [];

  if (text.length < 50) suggestions.push("Post is very short. Add more context.");
  if (text.length > 280) suggestions.push("Post is long. Shorten for readability.");
  if (!/[!?]/.test(text)) suggestions.push("Add a CTA or engaging question.");
  if (!/#\w+/.test(text)) suggestions.push("Add 1–3 relevant hashtags.");
  if (!/[😊😂😍🔥⭐✨❤️👍]/.test(text)) suggestions.push("Use 1–2 emojis to improve engagement.");

  if (!/(http|www\.)/i.test(text)) suggestions.push("Add a link if relevant.");

  if (suggestions.length === 0) suggestions.push("Your content is already optimized.");

  return suggestions;
}

// Health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Upload route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    let extractedText = "";

    // ===== PDF Parsing =====
    if (mimeType === "application/pdf") {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer); // ✅ FIXED
      extractedText = pdfData.text;
    }

    // ===== Image OCR =====
    else if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(filePath, "eng");
      extractedText = result.data.text;
    }

    else {
      return res.status(400).json({ message: "Unsupported file format" });
    }

    extractedText = extractedText.trim();
    const suggestions = generateEngagementSuggestions(extractedText);

    res.json({
      success: true,
      extractedText,
      suggestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing file" });
  } finally {
    try {
      await fs.unlink(filePath);
    } catch {}
  }
});

// Start server
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
