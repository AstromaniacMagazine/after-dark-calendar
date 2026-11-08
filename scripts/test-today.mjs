import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=process.argv[process.argv.indexOf('--modules')+1];
const {chromium}=createRequire(path.join(modules,'package.json'))('playwright');
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file))}catch{res.writeHead(404).end()}});
await new Promise(resolve=>server.listen(4178,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage();await page.clock.install({time:new Date('2026-11-08T12:00:00Z')});
  await page.goto('http://127.0.0.1:4178/?month=2026-11',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');
  if(mobile){await page.locator('.amc-mobile-day-chip[data-month-id="2026-11"][data-day="9"]').click();await page.waitForTimeout(450)}
  else await page.locator('.amc-day[data-day="9"]').click();
  assert.equal(await page.locator('#amc-today-button').isEnabled(),true);
  await page.locator('#amc-today-button').click();
  if(mobile)await page.waitForTimeout(450);
  assert.equal(await page.locator('.amc-day[data-day="8"]').getAttribute('aria-expanded'),'true',`${mobile?'mobile':'desktop'} Today did not expand`);
  assert.equal(await page.locator('#amc-today-button').isDisabled(),true,'Today should only disable when already expanded');
  if(!mobile){await page.locator('[data-month-next]').first().click();await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar').dataset.month==='2026-12');await page.locator('#amc-today-button').click();await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar').dataset.month==='2026-11');assert.equal(await page.locator('.amc-day[data-day="8"]').getAttribute('aria-expanded'),'true','Cross-month Today did not expand');}
  await context.close();
 }
 console.log('Today regression passed: current-month desktop/mobile and cross-month desktop navigation.');
}finally{await browser.close();server.close()}
