import type { EmailData, EmailLink } from "./types";



function getBody(item: Office.MessageRead, type: Office.CoercionType): Promise<string> {
  return new Promise((resolve, reject) => {
    item.body.getAsync(type, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(typeof result.value === "string" ? result.value : "");
      }
      else reject(result.error);
    });
  });
}

function getHeaders(item: Office.MessageRead): Promise<string> {
  return new Promise((resolve) => {
    if (!item.getAllInternetHeadersAsync) return resolve(""); // older Outlook builds
    item.getAllInternetHeadersAsync((result) => {
      resolve(result.status === Office.AsyncResultStatus.Succeeded ? result.value : "");
    });
  });
}

function extractLinks(html: string): EmailLink[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("a[href]"))
    .map((a) => ({ text: (a.textContent || "").trim().slice(0, 200), href: a.getAttribute("href") || "" }))
    .filter((l) => /^https?:/i.test(l.href))
    .slice(0, 50);
}

export async function readCurrentEmail(): Promise<EmailData> {
  const item = Office.context.mailbox.item as Office.MessageRead;
  if (!item) throw new Error("No email is open.");

  const [body, html, headers] = await Promise.all([
    getBody(item, Office.CoercionType.Text),
    getBody(item, Office.CoercionType.Html).catch(() => ""),
    getHeaders(item),
  ]);

  return {
    from: { name: item.from?.displayName || "", address: item.from?.emailAddress || "" },
    subject: item.subject || "",
    body,
    headers,
    links: html ? extractLinks(html) : [],
    attachments: (item.attachments || []).map((a) => a.name),
  };
}