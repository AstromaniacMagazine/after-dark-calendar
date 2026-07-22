import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function run(relativePath, context) {
  const source = read(relativePath);
  if (!source) return;
  try {
    vm.runInContext(source, context, { filename: relativePath });
  } catch (error) {
    fail(`${relativePath} did not execute: ${error.message}`);
  }
}

const sandbox = { console, Date, Math, URL };
sandbox.window = sandbox;
const context = vm.createContext(sandbox);

run("data/common.js", context);
run("data/month-manifest.js", context);

const manifest = context.window.AMC_MONTH_MANIFEST;
if (!Array.isArray(manifest) || !manifest.length) {
  fail("Month manifest is empty or invalid.");
}

const manifestIds = new Set();
for (const entry of manifest || []) {
  if (!entry?.id || !/^\d{4}-\d{2}$/.test(entry.id)) fail(`Invalid manifest id: ${entry?.id}`);
  if (manifestIds.has(entry.id)) fail(`Duplicate manifest id: ${entry.id}`);
  manifestIds.add(entry.id);
  if (!entry?.path) fail(`Manifest entry ${entry?.id} has no path.`);
  else run(entry.path, context);
}

if ((manifest || []).filter(entry => entry.default).length !== 1) {
  fail("The month manifest must contain exactly one default month.");
}

for (const entry of manifest || []) {
  const data = context.window.AMC_MONTH_DATA?.[entry.id];
  if (!data) {
    fail(`No registered data for ${entry.id}.`);
    continue;
  }

  const month = data.MONTH || data.month;
  if (!month) {
    fail(`${entry.id} has no MONTH metadata.`);
    continue;
  }

  const expectedDays = new Date(Date.UTC(month.year, month.monthIndex + 1, 0)).getUTCDate();
  if (month.days !== expectedDays) fail(`${entry.id} declares ${month.days} days; expected ${expectedDays}.`);
  if (`${month.year}-${String(month.monthIndex + 1).padStart(2, "0")}` !== entry.id) fail(`${entry.id} MONTH metadata does not match its id.`);

  const sources = data.sources || {};
  for (const [sourceId, source] of Object.entries(sources)) {
    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:") fail(`${entry.id} source ${sourceId} is not HTTPS.`);
    } catch {
      fail(`${entry.id} source ${sourceId} has an invalid URL.`);
    }
  }

  for (let day = 1; day <= month.days; day += 1) {
    const moon = data.moonData?.[day];
    if (!moon) {
      fail(`${entry.id} is missing Moon data for day ${day}.`);
      continue;
    }
    if (!Number.isFinite(moon.phase) || moon.phase < 0 || moon.phase > 100) fail(`${entry.id} day ${day} has an invalid Moon phase.`);
    if (!Number.isFinite(moon.age) || moon.age < 0 || moon.age >= 29.54) fail(`${entry.id} day ${day} has an invalid Moon age.`);
    if (!Number.isInteger(moon.frame) || moon.frame < 1) fail(`${entry.id} day ${day} has an invalid NASA frame.`);
  }

  for (const [dayText, events] of Object.entries(data.eventData || {})) {
    const day = Number(dayText);
    if (!Number.isInteger(day) || day < 1 || day > month.days) fail(`${entry.id} has events on invalid day ${dayText}.`);
    if (!Array.isArray(events)) {
      fail(`${entry.id} day ${dayText} events are not an array.`);
      continue;
    }
    for (const event of events) {
      if (!event?.type || !event?.title || !event?.copy) fail(`${entry.id} day ${dayText} contains an incomplete event.`);
      for (const sourceId of event?.sourceIds || []) {
        if (!sources[sourceId]) fail(`${entry.id} day ${dayText} references unknown source ${sourceId}.`);
      }
    }
  }
}

const html = read("index.html");
for (const match of html.matchAll(/(?:src|href)="((?:assets|data)\/[^"?#]+)[^\"]*"/g)) {
  if (!fs.existsSync(path.join(rootDir, match[1]))) fail(`index.html references missing local asset ${match[1]}.`);
}

const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
if (!structuredData) fail("index.html has no JSON-LD structured data.");
else {
  try {
    JSON.parse(structuredData);
  } catch (error) {
    fail(`JSON-LD is invalid: ${error.message}`);
  }
}

if (!html.includes("Beta0.5b")) fail("index.html does not identify Beta0.5b.");
if (!html.includes('<link rel="canonical" href="https://www.astromaniacmagazine.com/after-dark-calendar">')) fail("index.html canonical URL is missing or incorrect.");
if (!html.includes("assets/after-dark-calendar-social.png")) fail("index.html does not reference the social-sharing image.");
if (!fs.existsSync(path.join(rootDir, "assets", "after-dark-calendar-social.png"))) fail("The social-sharing image is missing.");

if (failures.length) {
  console.error(`Calendar validation failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Calendar validation passed: ${manifest.length} months, ${manifest.reduce((sum, entry) => sum + context.window.AMC_MONTH_DATA[entry.id].MONTH.days, 0)} calendar days, sources and structured data checked.`);
}
