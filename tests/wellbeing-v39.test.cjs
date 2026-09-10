"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(html, /body data-design-system="minimal-navy"/, "the app should identify its current visual system");
assert.match(styles, /Version 39: Minimal Navy design system/, "the stylesheet should contain the cross-screen minimalist layer");
assert.match(styles, /--minimal-navy: #203444;/, "the reference navy should be a named system token");
assert.match(styles, /--minimal-action: #d9d9d9;/, "the reference off-white should drive dark-mode actions");
assert.match(styles, /body::before,[\s\S]*body::after \{[\s\S]*display: none;/, "ambient glows should be removed");
assert.match(styles, /\.hero-badge,[\s\S]*\.timer-halos \{[\s\S]*display: none;/, "decorative halos and hero marks should be removed");
assert.match(styles, /\.hero-card,[\s\S]*\.panel \{[\s\S]*background: transparent;[\s\S]*box-shadow: none;/, "screens should use flat sections rather than glass cards");
assert.match(styles, /\.button-primary \{[\s\S]*background: var\(--minimal-action\);[\s\S]*border-radius: 0;/, "primary actions should use flat square geometry");
assert.match(styles, /\.app-navigation \{[\s\S]*border-radius: 0;[\s\S]*box-shadow: none;/, "navigation should use the same flat geometry");
assert.match(app, /dom\.setupEyebrow\.textContent = "YOUR WORKOUT";/, "the loaded Home title should follow the reference");
assert.equal(manifest.theme_color, "#203444", "the installed app chrome should match the new navy");
assert.match(worker, /wellbeing-v40/, "the current app should retain a fresh offline cache");

console.log("Wellbeing Version 39 Minimal Navy tests passed");
