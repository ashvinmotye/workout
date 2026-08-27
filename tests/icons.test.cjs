"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname,"..");
const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8"));
const worker = fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const source = fs.readFileSync(path.join(root,"icons","icon-source.png"));

function pngDimensions(fileName){
  const png = fs.readFileSync(path.join(root,"icons",fileName));
  assert.equal(png.toString("ascii",1,4),"PNG",`${fileName} must be a PNG`);
  return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const sizes = new Map([
  ["icon-source.png",[2048,2048]],
  ["forge-icon-master.png",[1024,1024]],
  ["icon-512.png",[512,512]],
  ["icon-192.png",[192,192]],
  ["apple-touch-icon-v31.png",[180,180]],
  ["apple-touch-icon.png",[180,180]],
  ["icon-maskable-512.png",[512,512]],
  ["icon-maskable-192.png",[192,192]],
  ["favicon-48.png",[48,48]],
  ["favicon-32.png",[32,32]],
  ["favicon-16.png",[16,16]]
]);

for (const [fileName,expected] of sizes) {
  assert.deepEqual(pngDimensions(fileName),expected,`${fileName} has the wrong dimensions`);
}

assert.equal(
  crypto.createHash("sha256").update(source).digest("hex"),
  "93017760d18e1d2479836a3e02ef8fd4d525d8ce50a25e72c25de91565443882",
  "the supplied Forge source artwork must remain unchanged"
);
const ico = fs.readFileSync(path.join(root,"icons","favicon.ico"));
assert.equal(ico.subarray(0,6).toString("hex"),"000001000300","favicon.ico should contain three icon sizes");
assert.match(html,/apple-touch-icon-v31\.png/,"iOS should request the cache-busting Apple Touch icon");
assert.match(html,/styles\.css\?v=31/,"Forge should version its stylesheet");
assert.match(html,/app\.js\?v=31/,"Forge should version its app script");
assert.match(worker,/forge-v31/,"Forge should use the Version 31 offline cache");
assert.match(worker,/apple-touch-icon-v31\.png/,"offline shell should include the new Apple icon");
assert.equal(manifest.background_color,"#193546","manifest background should match the supplied icon");
assert.ok(manifest.icons.some(icon=>icon.src === "icons/icon-512.png" && icon.purpose === "any"),"manifest should retain a large standard icon");
assert.ok(manifest.icons.some(icon=>icon.src === "icons/icon-maskable-512.png" && icon.purpose === "maskable"),"manifest should retain a large maskable icon");

console.log("Forge AuraOS icon tests passed");
