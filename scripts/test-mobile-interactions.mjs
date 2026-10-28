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
    <style>html,body{margin:0}.intro{height:120px}</style>
    <div class="intro">Squarespace page content</div>
    <div id="adc-inline-calendar"></div>
    <script src="http://127.0.0.1:4173/assets/squarespace-inline.js?v=test"><\/script>`;
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
    await new Promise(resolve => setTimeout(resolve, 12));
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
    localStorage.setItem("amc-remember-locations", "yes");
    localStorage.setItem("amc-sky-calendar-location", JSON.stringify({
      lat: 51.50853, lon: -0.12574, name: "London, Greater London",
      timeZone: "Europe/London", savedAt: new Date().toISOString()
    }));
  });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push(error.message));
  const loadStarted = Date.now();
  await page.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
  await page.locator("#amc-after-dark-calendar").waitFor();
  await page.locator(".amc-day.is-mobile-active").waitFor();
  await page.waitForFunction(() => document.querySelector("#amc-after-dark-calendar")?.dataset.ready === "true");
  const readyMs = Date.now() - loadStarted;
  assert(readyMs < 1800, `Inline calendar took too long to become ready locally: ${readyMs}ms`);
  await page.waitForTimeout(500);

  const today = new Date().getDate();
  assert.equal(Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day")), today, "Calendar did not open on Today");
  assert.equal(await page.locator("#amc-use-location .amc-use-location-text").evaluate(element => getComputedStyle(element).display), "none", "Mobile current-location text was not replaced by an icon");
  assert.match(await page.locator("#amc-location-label").innerText(), /London/i, "The determined location name is missing");
  assert.notEqual(await page.locator("#amc-location-label").evaluate(element => getComputedStyle(element).display), "none", "The determined location box is hidden");
  const rowTops = await page.locator("#amc-use-location, #amc-location-label, #amc-location-input, #amc-manual-location button").evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
  assert.equal(new Set(rowTops).size, 1, "Mobile location controls are not on one row");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, "Calendar has horizontal page overflow");
  assert.equal(await page.locator("iframe").count(), 0, "The inline installation unexpectedly contains an iframe");
  assert.equal(await page.locator(".amc-expanded-observing-title").count(), 0, "The redundant observing summary is still visible");
  assert.equal(await page.getByText("Moon brightness", { exact: true }).count(), 0, "Target cards still display Moon brightness");
  assert.equal(await page.locator(".amc-day.is-mobile-active .amc-target-facts em", { hasText: "Constellation" }).count(), 4, "All four targets should display a constellation");
  assert.equal(await page.evaluate(() => {
    const active = document.querySelector(".amc-day.is-mobile-active");
    const recommendations = active?.querySelector(".amc-mobile-recommendations");
    const forecast = active?.querySelector(".amc-cell-weather-list");
    return Boolean(recommendations && forecast && (forecast.compareDocumentPosition(recommendations) & Node.DOCUMENT_POSITION_FOLLOWING));
  }), true, "The mobile forecast must appear before targets and related articles");
  assert.equal(await page.locator(".amc-day.is-mobile-active [data-now-detail]").count(), 1, "Moon chart is missing its live time/date/altitude label");
  const todayStyle = await page.locator(".amc-day.is-today").evaluate(element => ({ border: getComputedStyle(element).borderTopWidth, shadow: getComputedStyle(element).boxShadow }));
  assert(Number.parseFloat(todayStyle.border) >= 3 && todayStyle.shadow !== "none", "Today is not visibly highlighted");

  const cdp = await context.newCDPSession(page);
  for (const selector of [
    ".amc-day.is-mobile-active .amc-chart",
    ".amc-day.is-mobile-active .amc-cell-weather-list",
    ".amc-day.is-mobile-active .amc-target-card",
    ".amc-day.is-mobile-active .amc-article-promo"
  ]) {
    const target = page.locator(selector).first();
    await target.waitFor();
    const documentTop = await target.evaluate(element => element.getBoundingClientRect().top + scrollY);
    await page.evaluate(scrollTop => scrollTo(0, scrollTop), Math.max(0, documentTop - 360));
    await page.waitForTimeout(60);
    const targetBox = await target.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    const before = await page.evaluate(() => scrollY);
    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const x = Math.max(24, Math.min(366, targetBox.x + Math.min(targetBox.width / 2, 80)));
    const y = targetBox.y + Math.min(targetBox.height / 2, 40);
    const movement = maxScroll - before > 120 ? -165 : 165;
    await touchDrag(cdp, { x, y }, { x: x + 5, y: y + movement });
    await page.waitForTimeout(220);
    const after = await page.evaluate(() => scrollY);
    assert(Math.abs(after - before) > 100, `Vertical touch scrolling failed over ${selector}: ${before} -> ${after}`);
  }

  const targetList = page.locator(".amc-day.is-mobile-active .amc-target-list");
  const targetListTop = await targetList.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(scrollTop => scrollTo(0, scrollTop), Math.max(0, targetListTop - 360));
  await page.waitForTimeout(60);
  const targetListBox = await targetList.boundingBox();
  const targetScrollBefore = await targetList.evaluate(element => element.scrollLeft);
  const targetMetrics = await targetList.evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, overflowX: getComputedStyle(element).overflowX, touchAction: getComputedStyle(element).touchAction }));
  await touchDrag(cdp, { x: targetListBox.x + targetListBox.width * .78, y: targetListBox.y + targetListBox.height * .5 }, { x: targetListBox.x + targetListBox.width * .18, y: targetListBox.y + targetListBox.height * .5 + 3 }, 16);
  await page.waitForTimeout(180);
  const targetScrollAfter = await targetList.evaluate(element => element.scrollLeft);
  assert(targetScrollAfter - targetScrollBefore > 80, `Suggested targets did not scroll horizontally: ${targetScrollBefore} -> ${targetScrollAfter}; box=${JSON.stringify(targetListBox)}; metrics=${JSON.stringify(targetMetrics)}`);

  const gridTop = await page.locator("#amc-grid").evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(scrollTop => scrollTo(0, scrollTop), Math.max(0, gridTop - 180));
  await page.waitForTimeout(60);
  const gridBox = await page.locator("#amc-grid").evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const parentBefore = await page.evaluate(() => scrollY);
  await page.evaluate(() => document.querySelector("#amc-grid").addEventListener("touchstart", () => { window.__amcTestTouchStartY = scrollY; }, { once: true, capture: true }));
  const dayBefore = Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day"));
  const monthBefore = await page.locator(".amc-mobile-day-chip.is-active").getAttribute("data-month-id");
  const x = gridBox.x + gridBox.width * .7;
  const y = gridBox.y + 120;
  await touchDrag(cdp, { x, y }, { x: x - 260, y: y + 6 }, 12);
  await page.waitForTimeout(520);
  const dayAfter = Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day"));
  const monthAfter = await page.locator(".amc-mobile-day-chip.is-active").getAttribute("data-month-id");
  const parentAfter = await page.evaluate(() => scrollY);
  const touchStartY = await page.evaluate(() => window.__amcTestTouchStartY);
  assert(monthAfter > monthBefore || (monthAfter === monthBefore && dayAfter > dayBefore), `Horizontal day swipe did not advance: ${monthBefore}-${dayBefore} -> ${monthAfter}-${dayAfter}; box=${JSON.stringify(gridBox)}`);
  assert(Math.abs(parentAfter - touchStartY) < 12, `Horizontal day swipe moved the page after touch start: ${touchStartY} -> ${parentAfter} (pre-touch momentum was ${parentBefore})`);

  const [transitionYear, transitionMonth] = monthAfter.split("-").map(Number);
  const daysInTransitionMonth = new Date(transitionYear, transitionMonth, 0).getDate();
  const transitionDay = dayAfter < daysInTransitionMonth ? dayAfter + 1 : dayAfter - 1;
  const transitionMetrics = await page.evaluate(day => {
    const grid = document.querySelector("#amc-grid");
    const card = grid.querySelector(`.amc-day[data-day="${day}"]`);
    const gridRect = grid.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      start: grid.scrollLeft,
      target: Math.max(0, Math.min(grid.scrollLeft + cardRect.left + cardRect.width / 2 - gridRect.left - gridRect.width / 2, grid.scrollWidth - grid.clientWidth))
    };
  }, transitionDay);
  await page.locator(`.amc-mobile-day-chip[data-month-id="${monthAfter}"][data-day="${transitionDay}"]`).click();
  await page.waitForTimeout(70);
  const middleScroll = await page.locator("#amc-grid").evaluate(element => element.scrollLeft);
  assert(Math.abs(middleScroll - transitionMetrics.start) > 1, `Date transition did not begin smoothly: ${JSON.stringify({ middleScroll, ...transitionMetrics })}`);
  assert(Math.abs(middleScroll - transitionMetrics.target) > 1, `Date transition jumped straight to its final position: ${JSON.stringify({ middleScroll, ...transitionMetrics })}`);
  await page.waitForTimeout(340);
  const finalScroll = await page.locator("#amc-grid").evaluate(element => element.scrollLeft);
  assert(Math.abs(finalScroll - transitionMetrics.target) < 2, "Date transition did not finish centred");
  assert.equal(Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day")), transitionDay, "Date did not activate after its transition");

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await page.waitForTimeout(120);
  assert.equal(Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day")), today, "Restored page did not reset to Today");
  const activeChipWidth = await page.locator(".amc-mobile-day-chip.is-active").evaluate(element => Math.round(element.getBoundingClientRect().width));
  assert(activeChipWidth >= 57 && activeChipWidth <= 59, `The fixed-width active date chip has an unexpected width: ${activeChipWidth}px`);
  const railAlignment = await page.evaluate(() => {
    const rail = document.querySelector("#amc-mobile-day-rail").getBoundingClientRect();
    const focus = document.querySelector(".amc-mobile-day-chip.is-rail-focus").getBoundingClientRect();
    return Math.abs((rail.left + rail.width / 2) - (focus.left + focus.width / 2));
  });
  assert(railAlignment < 2, `The focused date is not inside the fixed centre highlight: ${railAlignment}px`);
  assert.match(targetMetrics.touchAction, /pan-x|manipulation/, "Target cards should use native horizontal momentum scrolling");
  const railBox = await page.locator("#amc-mobile-day-rail").boundingBox();
  const railMonthBefore = await page.locator(".amc-mobile-day-chip.is-active").getAttribute("data-month-id");
  const railDayBefore = Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day"));
  await touchDrag(cdp,
    { x: railBox.x + railBox.width * .72, y: railBox.y + railBox.height * .5 },
    { x: railBox.x + railBox.width * .3, y: railBox.y + railBox.height * .5 + 2 }, 14);
  await page.waitForTimeout(670);
  const railMonthAfter = await page.locator(".amc-mobile-day-chip.is-active").getAttribute("data-month-id");
  const railDayAfter = Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day"));
  assert(railMonthAfter > railMonthBefore || (railMonthAfter === railMonthBefore && railDayAfter > railDayBefore), `Date rail swipe did not advance: ${railMonthBefore}-${railDayBefore} -> ${railMonthAfter}-${railDayAfter}`);
  await page.locator("#amc-today-button").click();
  await page.waitForTimeout(430);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight - innerHeight));
  await page.waitForTimeout(120);
  assert.equal(await page.locator("#amc-back-to-top").evaluate(element => element.classList.contains("is-visible")), true, "Back-to-top control did not appear");
  await page.locator("#amc-back-to-top").click();
  await page.waitForTimeout(650);
  assert(Math.abs(await page.locator("#amc-after-dark-calendar").evaluate(element => element.getBoundingClientRect().top)) < 3, "Back-to-top did not return to the calendar top");
  for (const width of [320, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, `Inline calendar overflows at ${width}px`);
    const tops = await page.locator("#amc-use-location, #amc-location-label, #amc-location-input, #amc-manual-location button").evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
    assert.equal(new Set(tops).size, 1, `Location controls do not stay on one row at ${width}px`);
    const radii = await page.locator("#amc-use-location, #amc-location-label, #amc-location-input, #amc-manual-location button").evaluateAll(elements => elements.map(element => getComputedStyle(element).borderTopLeftRadius));
    assert.equal(new Set(radii).size, 1, `Location controls do not share one corner radius at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const suggestionSizing = await page.evaluate(() => {
    const result = document.querySelector("#amc-location-results");
    const option = document.createElement("button");
    option.className = "amc-location-option";
    option.innerHTML = "<b>London</b><span>United Kingdom</span>";
    result.hidden = false;
    result.append(option);
    const sizes = { input: parseFloat(getComputedStyle(document.querySelector("#amc-location-input")).fontSize), option: parseFloat(getComputedStyle(option).fontSize) };
    option.remove();
    result.hidden = true;
    return sizes;
  });
  assert(suggestionSizing.option <= 8.5, `City suggestion text was not reduced by 25% from its former 11.2px size: ${JSON.stringify(suggestionSizing)}`);
  const outsideForecastDay = today > 1 ? today - 1 : 8;
  const outsideForecastMonth = await page.locator(".amc-mobile-day-chip.is-active").getAttribute("data-month-id");
  const outsideForecastChip = page.locator(`.amc-mobile-day-chip[data-month-id="${outsideForecastMonth}"][data-day="${outsideForecastDay}"]`);
  await outsideForecastChip.click();
  await page.waitForTimeout(520);
  assert.equal(await page.locator(".amc-day.is-mobile-active .amc-forecast-window-note").innerText(), "Outside the 7-day forecast window", "An out-of-range day does not explain forecast availability");
  await page.locator("#amc-today-button").click();
  await page.waitForTimeout(420);
  assert.equal(Number(await page.locator(".amc-day.is-mobile-active").getAttribute("data-day")), today, "Today did not restore after the out-of-range forecast test");
  assert.deepEqual(failures, [], `Page errors: ${failures.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, readyMs, today, nativeInlineScroll: true, verticalTargets: 4, horizontalSwipe: [dayBefore, dayAfter], targetCarousel: true, fixedDateFocus: true, backToTop: true, locationRow: true }, null, 2));
  await context.close();
} finally {
  await browser.close();
  childServer.close();
  parentServer.close();
}
