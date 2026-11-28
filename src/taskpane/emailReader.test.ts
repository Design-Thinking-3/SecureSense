import { readCurrentEmail } from "./emailReader";

// Fake version of outlook
function setupOffice(item: any) {
  (globalThis as any).Office = {
    context: { mailbox: { item } },
    CoercionType: { Text: "text" },
    AsyncResultStatus: { Succeeded: "succeeded", Failed: "failed" },
  };
}

// Creates a fake email item with default values, allowing overrides for testing purposes
function makeItem(overrides: any = {}) {
  return {
    from: { displayName: "Ryan", emailAddress: "ryan@example.com" },
    subject: "Hello",
    attachments: [{ name: "report.pdf" }],
    body: {
      getAsync: (_type: any, cb: any) => cb({ status: "succeeded", value: "Body text" }),
    },
    getAllInternetHeadersAsync: (cb: any) =>
      cb({ status: "succeeded", value: "Received: from mail.example.com" }),
    ...overrides,
  };
}

describe("readCurrentEmail", () => {
  test("returns the email's details", async () => {
    setupOffice(makeItem());
    const email = await readCurrentEmail();

    expect(email.from).toBe("Ryan <ryan@example.com>");
    expect(email.subject).toBe("Hello");
    expect(email.body).toBe("Body text");
    expect(email.headers).toBe("Received: from mail.example.com");
    expect(email.attachments).toEqual(["report.pdf"]);
  });

  // Nothing is selected in Outlook, so it should give a error
  test("Throws if no email is open", async () => {
    setupOffice(null);
    await expect(readCurrentEmail()).rejects.toThrow("No email is open.");
  });
 // No sender on the emial, so it returns blank sender instead of crashing
  test("Returns an empty sender if 'from' is missing", async () => {
    setupOffice(makeItem({ from: undefined }));
    const email = await readCurrentEmail();
    expect(email.from).toBe("");
  });
 // No attatchment on the email, so returns an empty list
  test("Returns an empty list when there are no attachments", async () => {
    setupOffice(makeItem({ attachments: undefined }));
    const email = await readCurrentEmail();
    expect(email.attachments).toEqual([]);
  });
 // Headers are optional, so if they cant be read, carry on with blank headers
  test("Returns empty headers if reading headers fails", async () => {
    setupOffice(
      makeItem({
        getAllInternetHeadersAsync: (cb: any) => cb({ status: "failed" }),
      })
    );
    const email = await readCurrentEmail();
    expect(email.headers).toBe("");
  });
 // The body is required, so if it cant be read, throw an error
  test("Returns an error if reading the body fails", async () => {
    setupOffice(
      makeItem({
        body: {
          getAsync: (_type: any, cb: any) =>
            cb({ status: "failed", error: new Error("boom") }),
        },
      })
    );
    await expect(readCurrentEmail()).rejects.toThrow("boom");
  });
});