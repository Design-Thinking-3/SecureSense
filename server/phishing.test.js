import { test } from "node:test";
import assert from "node:assert/strict";
const API_URL = "http://localhost:3001/api/analyse";
// Sends one email to the server and returns the AI's verdict
async function getVerdict(email) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(email),
  });
  assert.equal(response.status, 200, "server returned an error");
  return (await response.json()).verdict;
}

// Phishing emails - should be flagged as suspicious or malicious
const phishingEmails = {
  "fake bank login": {
    from: "Security Team <alerts@bank.com>",
    subject: "Your account has been compromised",
    body: "Please login to https://bank.com/login to secure your account.",
    headers: "Authentication-Results: spf=fail; dkim=none; dmarc=fail\nReply-To: help@gmail.com",
    attachments: [],
  },
  "fake paypal login": {
    from: "PayPal <alerts@paypal.com>",
    subject: "Your PayPal account has been compromised",
    body: "Please login to https://paypal.com/login to secure your account.",
    headers: "Authentication-Results: spf=fail; dkim=fail; dmarc=fail",
    attachments: [],
  },
  "dangerous attachment": {
    from: "Accounts <Invoices@billing.com>",
    subject: "Overdue invoice attached",
    body: "Please see the attached invoice.",
    headers: "Authentication-Results: spf=softfail; dkim=none; dmarc=fail",
    attachments: ["invoice.exe"],
  },
  "password expiry scam": {
    from: "IT Support <support@company.com>",
    subject: "Your password will expire soon",
    body: "Please update your password at https://company.com/update-password.",
    headers: "Authentication-Results: spf=fail; dkim=fail; dmarc=fail",
    attachments: [],
  },
};
// Safe emails - should be rated as safe
const safeEmails = {
  "normal email": {
    from: "Sam Taylor <sam.taylor@gmail.com>",
    subject: "Lunch at 12?",
    body: "Hey, want to grab lunch at 12?",
    headers: "Authentication-Results: spf=pass; dkim=pass; dmarc=pass",
    attachments: [],
  },
  "normal meeting notes email": {
    from: "Jane Doe <jane.doe@gmail.com>",
    subject: "Meeting notes",
    body: "Here are the meeting notes from today.",
    headers: "Authentication-Results: spf=pass; dkim=pass; dmarc=pass",
    attachments: [],
  },
};
for (const [name, email] of Object.entries(phishingEmails)) {
  test(`AI flags phishing email: ${name}`, async () => {
    const verdict = await getVerdict(email);
    assert.ok(["suspicious", "malicious"].includes(verdict), `got ${verdict}`);
  });
}
for (const [name, email] of Object.entries(safeEmails)) {
  test(`AI rates safe email as safe: ${name}`, async () => {
    const verdict = await getVerdict(email);
    assert.equal(verdict, "safe", `got ${verdict}`);
  });
}