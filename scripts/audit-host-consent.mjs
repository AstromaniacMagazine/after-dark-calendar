import { createRequire } from 'node:module';
import path from 'node:path';

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1] || fallback;
}

const modules = arg('modules');
const url = arg('url', 'https://www.astromaniacmagazine.com/after-dark-calendar');
if (!modules) throw new Error('Pass --modules with the Playwright node_modules directory.');
const { chromium } = createRequire(path.join(modules, 'package.json'))('playwright');
const browser = await chromium.launch({
  executablePath: arg('chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  headless: true,
});

const trackedHost = /(?:google-analytics|googletagmanager|googlesyndication|doubleclick|facebook|pinterest)\./i;
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  let phase = 'before choice';
  const requests = [];
  page.on('request', request => {
    const address = new URL(request.url());
    if (!trackedHost.test(address.hostname)) return;
    requests.push({
      phase,
      host: address.hostname,
      path: address.pathname,
      method: request.method(),
      queryKeys: [...address.searchParams.keys()].filter(key => !['gcs', 'gcd', 'npa', 'gdpr', 'gdpr_consent'].includes(key)),
      consent: Object.fromEntries(['gcs', 'gcd', 'npa', 'gdpr', 'gdpr_consent'].filter(key => address.searchParams.has(key)).map(key => [key, key === 'gdpr_consent' ? '[present]' : address.searchParams.get(key)])),
    });
  });

  async function snapshot() {
    return {
      cookies: (await context.cookies()).map(({ name, domain, value }) => ({ name, domain, ...(name.startsWith('ss_') ? { value } : {}) })).sort((a, b) => a.name.localeCompare(b.name)),
      page: await page.evaluate(() => ({
        storageKeys: Object.keys(localStorage).sort(),
        consentCommands: (Array.isArray(window.dataLayer) ? window.dataLayer : [])
          .filter(item => item && item[0] === 'consent')
          .map(item => ({ action: item[1], values: item[2] })),
      })),
    };
  }

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  const before = await snapshot();
  const decline = page.getByRole('button', { name: 'Decline all', exact: true });
  if (await decline.count() !== 1) throw new Error(`Expected one Decline all button, found ${await decline.count()}`);
  await decline.click();
  phase = 'after decline';
  await page.waitForTimeout(2000);
  const afterDecline = await snapshot();
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  const afterReload = await snapshot();
  console.log(JSON.stringify({ url, before, afterDecline, afterReload, requests }, null, 2));
} finally {
  await browser.close();
}
