"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname,"..");
const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const manifest = fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8");
const worker = fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const source = fs.readFileSync(path.join(root,"icons","icon-source.svg"),"utf8");
const dumbbell = fs.readFileSync(path.join(root,"icons","dumbbell-mark.svg"),"utf8");

function pngDimensions(fileName){
  const png = fs.readFileSync(path.join(root,"icons",fileName));
  assert.equal(png.toString("ascii",1,4),"PNG",`${fileName} must be a PNG`);
  return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const sizes = new Map([
  ["forge-icon-master.png",[1024,1024]],
  ["icon-512.png",[512,512]],
  ["icon-192.png",[192,192]],
  ["apple-touch-icon-v29.png",[180,180]],
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

assert.match(dumbbell,/Fabric Design System/,"supplied dumbbell attribution should be preserved");
assert.match(dumbbell,/viewBox="0 0 25 25"/,"supplied dumbbell geometry should be preserved");
assert.match(source,/dumbbell-mark\.svg/,"Forge icon source should use the supplied dumbbell");
assert.match(source,/rx="222"/,"Forge frame should use iOS-compatible corners");
for (const auraColor of ["#065b98","#1b7fdc","#087d95"]) {
  assert.match(source,new RegExp(auraColor,"i"),`Forge source should use AuraOS color ${auraColor}`);
}
assert.match(html,/apple-touch-icon-v29\.png/,"iOS should request the cache-busting Apple Touch icon");
assert.match(html,/styles\.css\?v=30/,"Forge should version its stylesheet");
assert.match(html,/app\.js\?v=30/,"Forge should version its app script");
assert.match(worker,/forge-v30/,"Forge should use the Version 30 offline cache");
assert.match(worker,/apple-touch-icon-v29\.png/,"offline shell should include the new Apple icon");
assert.match(manifest,/icon-maskable-512\.png/,"manifest should retain a large maskable icon");

console.log("Forge AuraOS icon tests passed");
