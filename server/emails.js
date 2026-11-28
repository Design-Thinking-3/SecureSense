const FREEMAIL = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com",
]);
const RISKY_EXT = /\.(exe|scr|com|bat|cmd|msi|js|jse|vbs|vbe|wsf|hta|ps1|lnk|iso|img|vhd|html?|svg|zip|rar|7z|docm|xlsm|pptm|one)$/i;
const MAX_LINKS = 25;
const MAX_BODY = 8000;

export const domainOf = (address = "") => (/@([^\s>]+)/.exec(address)?.[1] || "").toLowerCase();

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function unwrapSafeLink(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("safelinks.protection.outlook.com")) return u.searchParams.get("url") || url;
  } catch {
  }
  return url;
}

function parseHeaders(raw = "") {
  const out = {};
  for (const line of raw.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) (out[line.slice(0, i).trim().toLowerCase()] ||= []).push(line.slice(i + 1).trim());
  }
  return out;
}

function authResult(headers, mechanism) {
  const results = (headers["authentication-results"] || []).join(" ");
  const match = new RegExp(`\\b${mechanism}=(\\w+)`, "i").exec(results);
  if (match) return match[1].toLowerCase();
  if (mechanism === "spf" && headers["received-spf"]) return headers["received-spf"][0].split(/\s/)[0].toLowerCase();
  return "unknown";
}

const looksLikeDomain = (text) => /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(text.trim());

function collectLinks(email) {
  const seen = new Map();
  const add = (href, text = "") => {
    if (!/^https?:/i.test(href || "")) return;
    const url = unwrapSafeLink(href);
    const domain = hostOf(url);
    if (!domain || seen.has(url)) return;
    const textDomain = looksLikeDomain(text) ? hostOf(/^https?:/i.test(text.trim()) ? text.trim() : `https://${text.trim()}`) : "";
    seen.set(url, {
      text: text.trim().slice(0, 80),
      url: url.slice(0, 200),
      domain,
      textShowsDifferentDomain: Boolean(textDomain && textDomain !== domain && !domain.endsWith(`.${textDomain}`)),
    });
  };
  for (const l of email.links || []) add(l.href, l.text);
  for (const href of (email.body || "").match(/https?:\/\/[^\s"'<>)\]]+/g) || []) add(href);
  return [...seen.values()].sort((a, b) => b.textShowsDifferentDomain - a.textShowsDifferentDomain).slice(0, MAX_LINKS);
}

export function buildFacts(email) {
  const headers = parseHeaders(email.headers);
  const address = email.from?.address || "";
  const senderDomain = domainOf(address);
  const replyTo = headers["reply-to"]?.[0] || "";
  const replyToDomain = domainOf(replyTo);
  const returnPathDomain = domainOf(headers["return-path"]?.[0] || "");

  return {
    sender: {
      displayName: email.from?.name || "",
      address,
      domain: senderDomain,
      personalEmailService: FREEMAIL.has(senderDomain),
    },
    replyTo: replyTo ? { address: replyTo, differsFromSender: replyToDomain !== senderDomain } : null,
    returnPathDomain: returnPathDomain && returnPathDomain !== senderDomain ? returnPathDomain : undefined,
    senderChecks: { spf: authResult(headers, "spf"), dkim: authResult(headers, "dkim"), dmarc: authResult(headers, "dmarc") },
    links: collectLinks(email),
    attachments: (email.attachments || []).map((name) => ({ name, riskyType: RISKY_EXT.test(name) })),
  };
}

const untag = (s = "") => String(s).replace(/<\/?(email|facts|analysis)>/gi, "");


export function formatEmailForModel(email, facts) {
  return `<facts>
${JSON.stringify(facts)}
</facts>

<email>
From: ${untag(`${email.from?.name || ""} <${email.from?.address || ""}>`)}
Subject: ${untag(email.subject)}
Attachments: ${untag((email.attachments || []).join(", ") || "none")}

${untag((email.body || "").slice(0, MAX_BODY))}
</email>`;
}

export function evidenceCorpus(email, facts) {
  return [email.from?.name, email.from?.address, email.subject, email.body, (email.attachments || []).join(" "), JSON.stringify(facts)]
    .join("\n")
    .toLowerCase();
}