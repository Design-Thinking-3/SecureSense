import { VERDICTS } from "./prompts.js";

export function clip(value, max) {
  const s = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const lowerFirst = (s) => (/^[A-Z][a-z]+\b/.test(s) && /^[A-Z][a-z]+$/.test(s.split(/\s/)[0]) ? s[0].toLowerCase() + s.slice(1) : s);

export function normalizeAnalysis(raw) {
  const verdict = VERDICTS.includes(raw?.verdict) ? raw.verdict : "suspicious";
  const confidence = Number.isFinite(raw?.confidence)
    ? Math.max(0, Math.min(100, Math.round(raw.confidence)))
    : 50;
  return {
    verdict,
    confidence,
    reasons: (Array.isArray(raw?.reasons) ? raw.reasons : [])
      .map((reason) => clip(reason, 240))
      .filter(Boolean)
      .slice(0, 4),
    advice: lowerFirst(
      clip(raw?.advice, 240) ||
        (verdict === "safe"
          ? "stay alert to unexpected requests."
          : "report this email to your security team and verify through a known, official channel.")
    ),
  };
}

export function normalizeAnswer(raw) {
  return {
    answer: clip(raw?.answer, 280) || "Sorry, I couldn't work that out. Please check with your security team.",
    points: (Array.isArray(raw?.points) ? raw.points : [])
      .map((p) => ({ headline: clip(p?.headline, 50), detail: clip(p?.detail, 100) }))
      .filter((p) => p.headline)
      .slice(0, 4),
    recommendation: lowerFirst(clip(raw?.recommendation, 140)),
  };
}