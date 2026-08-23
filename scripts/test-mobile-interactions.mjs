import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const modulesIndex = process.argv.indexOf("--modules");
const modulesPath = modulesIndex >= 0 ? process.argv[modulesIndex + 1] : process.env.AMC_NODE_MODULES;
const chromeIndex = process.argv.indexOf("--chrome");
const chromePath = chromeIndex >= 0 ? process.argv[chromeIndex + 1] : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!modulesPath) throw new Error("Pass --modules with the bundled node_modules directory.");

const runtimeRequire = createRequire(path.join(path.resolve(modulesPath), "package.json"));
const { chromium } = runtimeRequire("playwright");
const mime = new Map([
  [".css", "text/css"], [".html", "text/html"], [".js", "text/javascript"],
  [".json", "application/json"], [".png", "image/png"], [".webp", "image/webp"]
]);

function staticServer(port) {
  const server = http.createServer(async (request, response) => {
    try {
      const urlPath = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
      const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
      const filePath = path.resolve(rootDir, relative);
      if (!filePath.startsWith(`${rootDir}${path.sep}`) && filePath !== path.join(rootDir, "index.html")) throw new Error("Invalid path");
      const body = await fs.readFile(filePath);
      response.writeHead(200, { "content-type": mime.get(path.extname(filePath)) || "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  return new Promise(resolve => server.listen(port, "127.0.0.1", () => resolve(server)));
}

function wrapperServer(port) {
  const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>html,body{margin:0} .intro{height:120px} iframe{border:0;display:block;width:100%}</style>
    <div class="intro">Mobile wrapper</div><iframe id="frame" src="http://127.0.0.1:4173/" height="1200" allow="geolocation"></iframe>
    <script>
      const frame = document.getElementById('frame');
      addEventListener('message', event => {
        if (event.origin !== 'http://127.0.0.1:4173' || event.source !== frame.contentWindow) return;
        if (event.data?.type === 'amc:resize') frame.height = String(Math.ceil(event.data.height));
        if (event.data?.type === 'amc:scroll-parent') scrollBy(0, Number(event.data.deltaY) || 0);
      });
      const ready = () => frame.contentWindow.postMessage({ type:'amc:embed-ready', wrapperVersion:'Beta0.9.3' }, 'http://127.0.0.1:4173');
      frame.addEventListener('load', ready); ready();
    <\/script>`;
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(html);
  });
  return new Promise(resolve => server.listen(port, "127.0.0.1", () => resolve(server)));
}

async function touchDrag(cdp, from, to, steps = 8) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }]
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

const childServer = await staticServer(4173);
const parentServer = await wrapperServer(4174);
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const failures = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  await context.route("**/api.open-meteo.com/v1/forecast?**", async route => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const time = [];
    for (let offset = 0; offset < 8 * 24; offset += 1) {
      const value = new Date(start.getTime() + offset * 3600000);
      time.push(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}:00`);
    }
    const values = value => Array(time.length).fill(value);
    await route.fulfill({ json: { timezone: "Europe/London", hourly: {
      time, cloud_cover: values(22), temperature_2m: values(14), relative_humidity_2m: values(62),
      dew_point_2m: values(7), precipitation_probability: values(4), wind_speed_10m: values(8),
      wind_gusts_10m: values(13), visibility: values(28000), cape: values(20), weather_code: values(1)
    } } });
  });
  await context.addInitScript(() => {
    localStorage.setItem("amc-sky-calendar-location", JSON.stringify({
      lat: 51.50853, lon: -0.12574, name: "London, Greater London",
      timeZone: "Europe/London", savedAt: new Date().toISOString()
    }));
  });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push(error.message));
  await page.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
  let child = null;
  for (let attempt = 0; attempt < 30 && !child; attempt += 1) {
    child = page.frames().find(frame => frame.url().startsWith("http://127.0.0.1:4173")) || null;
    if (!child) await page.waitForTimeout(100);
  }
  assert(child, "Calendar iframe did not load");
  await child.locator("#amc-after-dark-calendar").waitFor();
  await child.locator(".amc-day.is-mobile-active").waitFor();
  await page.waitForTimeout(500);

  const today = new Date().getDate();
  assert.equal(Number(await child.locator(".amc-day.is-mobile-active").getAttribute("data-day")), today, "Calendar did not open on Today");
  assert.match(await child.locator("#amc-use-location").innerText(), /London/i, "Location name was not merged into the current-location button");
  assert.equal(await child.locator("#amc-location-label").evaluate(element => getComputedStyle(element).display), "none", "Separate mobile location label is still visible");
  const rowTops = await child.locator("#amc-use-location, #amc-location-input, #amc-manual-location button").evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
  assert.equal(new Set(rowTops).size, 1, "Mobile location controls are not on one row");
  assert.equal(await child.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, "Calendar has horizontal page overflow");

  const cdp = await context.newCDPSession(page);
  for (const selector of [
    ".amc-day.is-mobile-active .amc-chart",
    ".amc-day.is-mobile-active .amc-cell-weather-list",
    ".amc-day.is-mobile-active .amc-target-card",
    ".amc-day.is-mobile-active .amc-article-promo"
  ]) {
    const target = child.locator(selector).first();
    await target.waitFor();
    const childBox = await target.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    const frameOffset = await page.locator("#frame").evaluate(element => element.offsetTop);
    await page.evaluate(scrollTop => scrollTo(0, scrollTop), Math.max(0, frameOffset + childBox.y - 360));
    await page.waitForTimeout(60);
    const frameBox = await page.locator("#frame").boundingBox();
    const before = await page.evaluate(() => scrollY);
    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const x = Math.max(24, Math.min(366, frameBox.x + childBox.x + Math.min(childBox.width / 2, 80)));
    const y = frameBox.y + childBox.y + Math.min(childBox.height / 2, 40);
    const movement = maxScroll - before > 120 ? -165 : 165;
    await touchDrag(cdp, { x, y }, { x: x + 5, y: y + movement });
    await page.waitForTimeout(220);
    const after = await page.evaluate(() => scrollY);
    assert(Math.abs(after - before) > 100, `Vertical touch scrolling failed over ${selector}: ${before} -> ${after}`);
  }

  const frameOffset = await page.locator("#frame").evaluate(element => element.offsetTop);
  const gridBox = await child.locator("#amc-grid").evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.evaluate(scrollTop => scrollTo(0, scrollTop), Math.max(0, frameOffset + gridBox.y - 180));
  await page.waitForTimeout(60);
  const frameBox = await page.locator("#frame").boundingBox();
  const parentBefore = await page.evaluate(() => scrollY);
  const dayBefore = Number(await child.locator(".amc-day.is-mobile-active").getAttribute("data-day"));
  const x = frameBox.x + gridBox.x + gridBox.width * .7;
  const y = frameBox.y + gridBox.y + 120;
  await touchDrag(cdp, { x, y }, { x: x - 260, y: y + 6 }, 12);
  await page.waitForTimeout(520);
  const dayAfter = Number(await child.locator(".amc-day.is-mobile-active").getAttribute("data-day"));
  const parentAfter = await page.evaluate(() => scrollY);
  assert(dayAfter > dayBefore, `Horizontal day swipe did not advance: ${dayBefore} -> ${dayAfter}`);
  assert(Math.abs(parentAfter - parentBefore) < 12, "Horizontal day swipe moved the parent page vertically");

  const transitionDay = dayAfter < 31 ? dayAfter + 1 : dayAfter - 1;
  const transitionMetrics = await child.evaluate(day => {
    const grid = document.querySelector("#amc-grid");
    const card = grid.querySelector(`.amc-day[data-day="${day}"]`);
    const gridRect = grid.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      start: grid.scrollLeft,
      target: Math.max(0, Math.min(grid.scrollLeft + cardRect.left + cardRect.width / 2 - gridRect.left - gridRect.width / 2, grid.scrollWidth - grid.clientWidth))
    };
  }, transitionDay);
  await child.locator(`.amc-mobile-day-chip[data-month-id="2026-08"][data-day="${transitionDay}"]`).click();
  await page.waitForTimeout(70);
  const middleScroll = await child.locator("#amc-grid").evaluate(element => element.scrollLeft);
  assert(Math.abs(middleScroll - transitionMetrics.start) > 1, "Date transition did not begin smoothly");
  assert(Math.abs(middleScroll - transitionMetrics.target) > 1, "Date transition jumped straight to its final position");
  await page.waitForTimeout(340);
  const finalScroll = await child.locator("#amc-grid").evaluate(element => element.scrollLeft);
  assert(Math.abs(finalScroll - transitionMetrics.target) < 2, "Date transition did not finish centred");
  assert.equal(Number(await child.locator(".amc-day.is-mobile-active").getAttribute("data-day")), transitionDay, "Date did not activate after its transition");

  await child.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await page.waitForTimeout(120);
  assert.equal(Number(await child.locator(".amc-day.is-mobile-active").getAttribute("data-day")), today, "Restored page did not reset to Today");
  assert.deepEqual(failures, [], `Page errors: ${failures.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, today, verticalTargets: 4, horizontalSwipe: [dayBefore, dayAfter], mergedLocation: true }, null, 2));
  await context.close();
} finally {
  await browser.close();
  childServer.close();
  parentServer.close();
}
