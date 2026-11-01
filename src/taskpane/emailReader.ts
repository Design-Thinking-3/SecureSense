export interface EmailData {
  from: string;
  subject: string;
  body: string;
  headers: string;
  attachments: string[];
}

function getBody(item: Office.MessageRead): Promise<string> {
  return new Promise((resolve, reject) => {
    item.body.getAsync(Office.CoercionType.Text, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) resolve(result.value);
      else reject(result.error);
    });
  });
}

function getHeaders(item: Office.MessageRead): Promise<string> {
  return new Promise((resolve) => {
    item.getAllInternetHeadersAsync((result) => {
      resolve(result.status === Office.AsyncResultStatus.Succeeded ? result.value : "");
    });
  });
}

export async function readCurrentEmail(): Promise<EmailData> {
  const item = Office.context.mailbox.item as Office.MessageRead;
  if (!item) throw new Error("No email is open.");

  const [body, headers] = await Promise.all([getBody(item), getHeaders(item)]);

  return {
    from: item.from ? `${item.from.displayName} <${item.from.emailAddress}>` : "",
    subject: item.subject,
    body,
    headers,
    attachments: (item.attachments || []).map((a) => a.name),
  };
}