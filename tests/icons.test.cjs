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
const suppliedVector = fs.readFileSync(path.join(root,"icons","wellbeing-icon.svg"));
const standard512 = fs.readFileSync(path.join(root,"icons","icon-512.png"));
const standard192 = fs.readFileSync(path.join(root,"icons","icon-192.png"));

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
  ["apple-touch-icon-v42.png",[180,180]],
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
  "c8e4ca684f38fe3ad4c5c0fc223685dc3081b37169fe0f08e55c568990e944e4",
  "the high-resolution source should be rendered from the supplied vector"
);
assert.equal(crypto.createHash("sha256").update(suppliedVector).digest("hex"),"5951dc764691d22388737b46d9c811e1e8480969a69260fc71746bceded4c2bd","the supplied Wellbeing SVG must remain unchanged");
assert.equal(crypto.createHash("sha256").update(standard512).digest("hex"),"cba6195dd24455589ad605d537fc66e38cf77134d50d2217322d77c0f18f994b","the supplied 512px icon must remain unchanged");
assert.equal(crypto.createHash("sha256").update(standard192).digest("hex"),"6f05dcc7d0c4cabbf198812e61857a8da139018c37611b9a6969a1c100ad6d86","the supplied 192px icon must remain unchanged");
const ico = fs.readFileSync(path.join(root,"icons","favicon.ico"));
assert.equal(ico.subarray(0,6).toString("hex"),"000001000300","favicon.ico should contain three icon sizes");
assert.match(html,/apple-touch-icon-v42\.png/,"iOS should request the Version 42 Apple Touch icon");
assert.match(html,/favicon-32\.png\?v=42[\s\S]*favicon-16\.png\?v=42[\s\S]*favicon\.ico\?v=42/,"browser icons should bypass earlier cached artwork");
assert.match(html,/styles\.css\?v=43/,"Wellbeing should version its stylesheet");
assert.match(html,/wellness\.js\?v=43/,"Wellbeing should version its body-data script");
assert.match(html,/app\.js\?v=43/,"Wellbeing should version its app script");
assert.match(worker,/wellbeing-v43/,"Wellbeing should use the Version 43 offline cache");
assert.match(worker,/apple-touch-icon-v42\.png/,"offline shell should include the new Apple icon");
assert.equal(manifest.background_color,"#191919","manifest background should match the current app chrome");
assert.equal(manifest.name,"Wellbeing","manifest should expose the new app name");
assert.ok(manifest.icons.some(icon=>icon.src === "icons/icon-512.png?v=42" && icon.purpose === "any"),"manifest should request the Version 42 standard icon");
assert.ok(manifest.icons.some(icon=>icon.src === "icons/icon-maskable-512.png?v=42" && icon.purpose === "maskable"),"manifest should request the Version 42 maskable icon");

console.log("Wellbeing AuraOS icon tests passed");
