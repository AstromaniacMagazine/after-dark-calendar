import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");

function argument(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

const url = argument("url", "http://127.0.0.1:4173/");
const outputDir = path.resolve(rootDir, argument("output", ".release-snapshots"));
const version = argument("version", "Beta0.9");
const selectedDay = Number(argument("day", "12"));
const chromePath = argument("chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
const modulesPath = argument("modules", process.env.AMC_NODE_MODULES || "");

if (!modulesPath) {
  throw new Error("Pass --modules with the bundled node_modules directory.");
}

const runtimeRequire = createRequire(path.join(path.resolve(modulesPath), "package.json"));
const { chromium } = runtimeRequire("playwright");
const sharp = runtimeRequire("sharp");

const location = {
  lat: 51.50853,
  lon: -0.12574,
  name: "London, Greater London",
  timeZone: "Europe/London",
  savedAt: new Date().toISOString()
};

async function settleImages(page) {
  await page.evaluate(() => {
    document.querySelectorAll("img").forEach(image => {
      image.loading = "eager";
      image.decoding = "sync";
      image.dataset.snapshotSource = image.currentSrc || image.src;
    });
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 720) {
      await page.evaluate(scrollTop => window.scrollTo(0, scrollTop), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1400);
    const failed = await page.evaluate(() => [...document.images].filter(image => !image.complete || image.naturalWidth === 0).length);
    if (!failed) return;
    await page.evaluate(() => {
      [...document.images].filter(image => !image.complete || image.naturalWidth === 0).forEach(image => {
        const source = image.dataset.snapshotSource || image.src;
        image.removeAttribute("loading");
        image.src = "";
        image.src = source;
      });
    });
  }

  const failedSources = await page.evaluate(() => [...document.images]
    .filter(image => !image.complete || image.naturalWidth === 0)
    .map(image => image.dataset.snapshotSource || image.src));
  if (failedSources.length) throw new Error(`Snapshot image loading failed: ${failedSources.join(", ")}`);
}

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb"]
});

const results = [];
try {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(savedLocation => {
    localStorage.setItem("amc-sky-calendar-location", JSON.stringify(savedLocation));
    localStorage.setItem("amc-sky-calendar-theme", "light");
  }, location);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("#amc-after-dark-calendar").waitFor({ state: "visible", timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForFunction(() => document.querySelectorAll(".amc-weather-card").length === 7, null, { timeout: 15000 }).catch(() => {});
  if (Number.isInteger(selectedDay) && selectedDay > 0) {
    const day = page.locator(`.amc-day[data-day="${selectedDay}"]`);
    await day.click();
    await day.click();
    await page.waitForTimeout(220);
  }
  await settleImages(page);

  for (const theme of ["light", "dark", "red", "teal"]) {
    while (await page.locator("#amc-after-dark-calendar").getAttribute("data-theme") !== theme) {
      await page.locator("#amc-theme-toggle").click();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(160);

    const filename = `ADC_${theme.toUpperCase()}_${version}.png`;
    const outputPath = path.join(outputDir, filename);
    await page.screenshot({
      path: outputPath,
      type: "png",
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      scale: "device"
    });

    const file = await fs.readFile(outputPath);
    const metadata = await sharp(file).metadata();
    const signature = file.subarray(0, 8).toString("hex");
    if (signature !== "89504e470d0a1a0a" || metadata.format !== "png") {
      throw new Error(`${filename} is not a valid PNG.`);
    }
    results.push({
      filename,
      bytes: file.length,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      pageErrors
    });
  }
  await context.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({ outputDir, results }, null, 2));
