
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "../dist");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SYSTEM_PROMPT = `Return ONLY valid JSON:
{
  "title": "Topic title",
  "summary": "Short overview",
  "flashcards": [
    {"question": "Question", "answer": "Answer"}
  ],
  "quiz": [
    {
      "question": "Question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Explanation"
    }
  ]
}
Generate 6-8 flashcards and 5 quiz questions.
Each quiz must have exactly 4 options.
correctIndex must be between 0 and 3.`;

function validatePayload(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid JSON object.");

  if (typeof data.title !== "string" || !data.title.trim())
    throw new Error("Missing title.");

  if (typeof data.summary !== "string" || !data.summary.trim())
    throw new Error("Missing summary.");

  if (!Array.isArray(data.flashcards) || !data.flashcards.length)
    throw new Error("Missing flashcards.");

  if (!Array.isArray(data.quiz) || !data.quiz.length)
    throw new Error("Missing quiz.");

  data.flashcards.forEach((card, i) => {
    if (
      typeof card?.question !== "string" ||
      !card.question.trim() ||
      typeof card?.answer !== "string" ||
      !card.answer.trim()
    ) {
      throw new Error(`Invalid flashcard ${i + 1}.`);
    }
  });

  data.quiz.forEach((q, i) => {
    if (
      typeof q?.question !== "string" ||
      !q.question.trim() ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      q.options.some(o => typeof o !== "string" || !o.trim()) ||
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex > 3 ||
      typeof q.explanation !== "string"
    ) {
      throw new Error(`Invalid quiz question ${i + 1}.`);
    }
  });

  return data;
}

function extractJson(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start < 0 || end <= start)
    throw new Error("AI did not return JSON. Please retry.");

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("Malformed JSON returned by AI.");
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/study", async (req, res) => {
  const input =
    typeof req.body?.input === "string"
      ? req.body.input.trim()
      : "";

  if (input.length < 10)
    return res.status(400).json({
      error: "Enter at least 10 characters."
    });

  if (input.length > 12000)
    return res.status(400).json({
      error: "Notes must be under 12,000 characters."
    });

  if (!process.env.GEMINI_API_KEY)
    return res.status(503).json({
      error: "Missing Gemini API key in .env file."
    });

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [{
            role: "user",
            parts: [{
              text: `Create study material from these notes:\n${input}`
            }]
          }],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json"
          }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));

      return res.status(502).json({
        error: detail?.error?.message || "AI provider error."
      });
    }

    const result = await response.json();

    const raw = result?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("");

    if (!raw)
      throw new Error("AI returned an empty response.");

    const validated = validatePayload(extractJson(raw));

    res.json(validated);

  } catch (error) {
    res.status(502).json({
      error: error.name === "TimeoutError"
        ? "Request timed out. Please retry."
        : error.message || "Something went wrong."
    });
  }
});
// Serve React production build
app.use(express.static(distPath));

// Handle frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`StudySprint API running on port ${PORT}`);
});
