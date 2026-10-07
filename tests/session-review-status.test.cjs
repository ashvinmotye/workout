"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

function sourceFor(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < app.length; index += 1) {
    if (app[index] === "{") { depth += 1; opened = true; }
    else if (app[index] === "}" && --depth === 0 && opened) return app.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

assert.match(html, /id="completeReviewStatus"[^>]*>Not saved yet\.<\/span>/);
assert.match(styles, /\.session-review-actions \{[\s\S]*?flex-wrap: wrap;/);
assert.match(styles, /\.session-review-status \{[\s\S]*?flex: 0 0 100%;/, "status should occupy its own full-width row");
assert.match(styles, /@media \(max-width: 410px\)[\s\S]*?\.session-review-actions \.button \{[\s\S]*?flex: 1 1 0;/, "mobile buttons should remain equal-width on one row");

const prepare = sourceFor("prepareCompleteSessionReview");
const save = sourceFor("submitCompleteSessionReview");
const copy = sourceFor("copyCompleteSessionForAi");
const dirty = sourceFor("markCompleteSessionReviewUnsaved");

assert.match(prepare, /completeReviewStatus\.textContent = "Not saved yet\."/);
assert.match(dirty, /completeReviewStatus\.textContent = "Not saved yet\."/);
assert.match(save, /completeReviewStatus\.textContent = "Saved\. Syncing automatically"/);
assert.match(copy, /prepareCompleteSessionReview\(updated\);[\s\S]*?Saved\. Syncing automatically[\s\S]*?await copySessionForAi\(updated\.id\);[\s\S]*?Saved\. Syncing automatically/);
assert.match(app, /completeReviewForm\.addEventListener\("input", markCompleteSessionReviewUnsaved\)/);
assert.doesNotMatch(app, /Saved · syncing automatically|Saved on this device · sync pending/);
assert.match(worker, /wellbeing-v51/);

console.log("Wellbeing Version 51 session-review status tests passed");
