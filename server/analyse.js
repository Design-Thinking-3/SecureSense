export function extractLinks(body = "") {
  return [...new Set(body.match(/https?:\/\/[^\s"'<>)]+/g) || [])];
}

export function parseAnalysis(text) {
  return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
}
const VERDICTS = ["safe", "suspicious", "malicious"];

export function validateAnalysis(a) {
  if (!a || !VERDICTS.includes(a.verdict)) {
    throw new Error("AI reply has an invalid verdict.");
  }
  return {
    verdict: a.verdict,
    confidence: Number.isFinite(a.confidence) ? Math.min(100, Math.max(0, a.confidence)) : 0,
    reasons: Array.isArray(a.reasons) ? a.reasons.map(String) : [],
    advice: typeof a.advice === "string" ? a.advice : "",
  };
}