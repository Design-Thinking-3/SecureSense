import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { ANALYSE_PROMPT, ANALYSIS_SCHEMA, ASK_PROMPT, ASK_SCHEMA } from "./prompts.js";
import { buildFacts, evidenceCorpus, formatEmailForModel } from "./emails.js";
import { clip, normalizeAnalysis, normalizeAnswer } from "./normalize.js";


const client = new OpenAI({
  apiKey: process.env.AI_API_KEY || "not-needed",
  baseURL: process.env.AI_BASE_URL,
  timeout: 45000,
  maxRetries: 1,
});
const temperature = process.env.AI_TEMPERATURE ? Number(process.env.AI_TEMPERATURE) : undefined;

function parseJson(text = "") {
  return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
}

async function completeJson(system, messages, schemaName, schema) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL,
      ...(temperature !== undefined && { temperature }),
      messages: [{ role: "system", content: system }, ...messages],
      response_format: { type: "json_schema", json_schema: { name: schemaName, schema, strict: true } },
    });
    try {
      return parseJson(completion.choices[0]?.message?.content ?? "");
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Model did not return valid JSON: ${lastError?.message}`);
}

function normalizeEmail(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const sender = typeof input.from === "string" ? { address: input.from } : input.from || {};
  const email = {
    from: {
      name: typeof sender.name === "string" ? sender.name : "",
      address: typeof sender.address === "string" ? sender.address : "",
    },
    subject: typeof input.subject === "string" ? input.subject : "",
    body: typeof input.body === "string" ? input.body : "",
    headers: typeof input.headers === "string" ? input.headers : "",
    links: Array.isArray(input.links) ? input.links : [],
    attachments: Array.isArray(input.attachments)
      ? input.attachments.filter((attachment) => typeof attachment === "string")
      : [],
  };
  const hasContent =
    email.from.name ||
    email.from.address ||
    email.subject ||
    email.body ||
    email.headers ||
    email.links.length ||
    email.attachments.length;

  return hasContent ? email : null;
}

function fail(res, err, userMessage) {
  console.error(err);
  res.status(502).json({ error: userMessage });
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/api/analyse", async (req, res) => {
  const email = normalizeEmail(req.body?.email || req.body);
  if (!email) return res.status(400).json({ error: "Missing or invalid email." });
  try {
    const facts = buildFacts(email);
    const raw = await completeJson(ANALYSE_PROMPT, [{ role: "user", content: formatEmailForModel(email, facts) }], "email_analysis", ANALYSIS_SCHEMA);
    res.json(normalizeAnalysis(raw, evidenceCorpus(email, facts)));
  } catch (err) {
    fail(res, err, "We couldn't check this email right now. Please try again.");
  }
});

app.post("/api/ask", async (req, res) => {
  const { email, analysis, question, history = [] } = req.body || {};
  if (!validEmail(email) || !analysis || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Missing email, analysis or question." });
  }
  try {
    const context = `${formatEmailForModel(email, buildFacts(email))}

<analysis>
${JSON.stringify(analysis)}
</analysis>`;
    const turns = (Array.isArray(history) ? history : [])
      .slice(-6)
      .filter((t) => (t?.role === "user" || t?.role === "assistant") && typeof t.content === "string")
      .map((t) => ({ role: t.role, content: clip(t.content, 1000) }));

    const raw = await completeJson(
      ASK_PROMPT,
      [
        { role: "user", content: context },
        { role: "assistant", content: "I've read the email and the analysis. What would you like to know?" },
        ...turns,
        { role: "user", content: clip(question, 500) },
      ],
      "assistant_reply",
      ASK_SCHEMA
    );
    res.json(normalizeAnswer(raw));
  } catch (err) {
    fail(res, err, "The assistant is unavailable right now. Please try again.");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SecureSense API on http://localhost:${PORT} using ${process.env.AI_MODEL}`));