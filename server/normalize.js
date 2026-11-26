import { ISSUE_TYPES, RISK_LEVELS } from "./prompts.js";

const DEFAULT_TITLES = {
  link: "Phishy link detected",
  urgency: "Urgent language detected",
  sender: "Suspicious sender",
  attachment: "Risky attachment",
  request: "Sensitive info requested",
  impersonation: "Brand impersonation",
  other: "Something looks off",
};

const DEFAULT_SUMMARY = {
  high: "This email shows signs of phishing.",
  medium: "A few details here need checking.",
  low: "No signs of phishing found.",
};

export function clip(value, max) {
  const s = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const unquote = (s) => s.replace(/^["'“‘]+|["'”’]+$/g, "").trim();
const lowerFirst = (s) => (/^[A-Z][a-z]+\b/.test(s) && /^[A-Z][a-z]+$/.test(s.split(/\s/)[0]) ? s[0].toLowerCase() + s.slice(1) : s);

export function normalizeAnalysis(raw, corpus) {
  const riskLevel = RISK_LEVELS.includes(raw?.riskLevel) ? raw.riskLevel : "medium";
  const seenTypes = new Set();

  const issues = (Array.isArray(raw?.issues) ? raw.issues : [])
    .map((i) => {
      const type = ISSUE_TYPES.includes(i?.type) ? i.type : "other";
      const evidence = unquote(clip(i?.evidence, 60));
      return {
        type,
        title: clip(type === "other" ? i?.title || DEFAULT_TITLES.other : DEFAULT_TITLES[type], 40),
        evidence: evidence && corpus.includes(evidence.toLowerCase()) ? evidence : "",
        explanation: clip(i?.explanation, 160),
        assistantHeadline: clip(i?.assistantHeadline || DEFAULT_TITLES[type], 50),
        assistantDetail: clip(i?.assistantDetail, 100),
      };
    })
    .filter((i) => i.explanation && !seenTypes.has(i.type) && seenTypes.add(i.type))
    .slice(0, 4);

  return {
    riskLevel,
    summary: clip(raw?.summary, 70) || DEFAULT_SUMMARY[riskLevel],
    issues,
    recommendation: lowerFirst(
      clip(raw?.recommendation, 140) || (riskLevel === "low" ? "no action needed, but stay alert." : "report this email to your security team.")
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