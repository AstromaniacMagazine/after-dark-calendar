import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';

const modules = process.argv[process.argv.indexOf('--modules') + 1];
const { chromium } = createRequire(path.join(modules, 'package.json'))('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const hosts = new Set();
  const errors = [];
  page.on('request', request => hosts.add(new URL(request.url()).hostname));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/?month=2026-11', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#amc-after-dark-calendar')?.dataset.ready === 'true');
  await page.waitForTimeout(2500);
  const failedImages = await page.evaluate(() => [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src));
  const cookies = (await context.cookies()).map(({ name, domain }) => ({ name, domain }));
  assert.deepEqual(cookies, [], 'A first visit without opt-in must not set image or calendar cookies');
  assert.deepEqual(failedImages, [], 'Visible images must load');
  assert.deepEqual(errors, [], 'No browser errors');
  assert(![...hosts].some(host => /open-meteo|bigdatacloud/.test(host)), 'Location services must stay idle before selection');
  console.log(JSON.stringify({ hosts: [...hosts].sort(), cookies, failedImages, errors }, null, 2));
} finally {
  await browser.close();
}
