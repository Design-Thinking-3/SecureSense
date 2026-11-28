import { test } from "node:test";
import assert from "node:assert/strict";
import { extractLinks, parseAnalysis } from "./analyse.js";
// Normal case, both http and https links are found
test("finds links in an email body", () => {
  assert.deepEqual(
    extractLinks("Go to https://a.com and http://b.org/x now"),
    ["https://a.com", "http://b.org/x"]
  );
});
// Phyishing emails often repeat link, so each one should only be listed once
test("Removes duplicate links", () => {
  assert.deepEqual(extractLinks("https://a.com https://a.com"), ["https://a.com"]);
});
//  A normal email with no links should give an empty list, not an error
test("Returns an empty list when there are no links", () => {
  assert.deepEqual(extractLinks("Lunch at 12?"), []);
});

test("Parses JSON even when the AI adds extra text around it", () => {
  const reply = 'Sure! {"verdict":"safe","confidence":90,"reasons":[],"advice":"ok"} Hope that helps';
  assert.equal(parseAnalysis(reply).verdict, "safe");
});

test("Throws an error when the AI reply has no JSON", () => {
  assert.throws(() => parseAnalysis("Sorry I am unable to help you with that."));
});