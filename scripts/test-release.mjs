import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=process.argv[process.argv.indexOf('--modules')+1];
const output=process.argv.includes('--output') ? path.resolve(process.argv[process.argv.indexOf('--output')+1]) : null;
const {chromium}=createRequire(path.join(modules,'package.json'))('playwright');
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/inline') {res.setHeader('content-type','text/html; charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="adc-inline-calendar"></div><script src="/assets/squarespace-inline.js"></script>');return;}
  const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep)) throw Error('Path');
  res.setHeader('content-type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(4175,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[];const result={};
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2});
 await context.route('**/api.open-meteo.com/v1/forecast?**',route=>route.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const ids=Array.from({length:14},(_,i)=>i<2?`2026-${i+11}`:`2027-${String(i-1).padStart(2,'0')}`);
 for(const id of ids){
  await page.goto(`http://127.0.0.1:4175/?snapshot=1&month=${id}`);
  await page.waitForFunction(id=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true'&&document.querySelector('#amc-after-dark-calendar')?.dataset.month===id,id);
  const days=new Date(Number(id.slice(0,4)),Number(id.slice(5)),0).getDate();
  assert.equal(await page.locator('.amc-day').count(),days,id);
  await page.locator('.amc-day[data-day="15"]').click();
  assert.equal(await page.locator('.amc-day[aria-expanded="true"]').count(),1);
  assert.equal(await page.locator('.amc-day[aria-expanded="true"]').evaluate(el=>getComputedStyle(el).borderTopWidth),'4px');
  await page.locator('.amc-day[data-day="15"] .amc-minimise').click();
  assert.equal(await page.locator('.amc-day[aria-expanded="true"]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${id} overflow`);
 }
 result.monthsChecked=ids.length;
 await page.goto('http://127.0.0.1:4175/?snapshot=1&month=2027-08');
 await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');
 await page.locator('.amc-day[data-day="2"]').click();
 assert.match(await page.locator('.amc-day[data-day="2"] .amc-expanded').innerText(),/Total solar eclipse/);
 assert.equal(await page.locator('.amc-day[data-day="2"] img').first().evaluate(async el=>{await el.decode();return el.naturalWidth>0}),true,'2027 phase diagram must decode');
 if(output){
  await fs.mkdir(output,{recursive:true});
  await page.setViewportSize({width:1920,height:1080});
  for(const theme of ['light','dark','red']){
   while(await page.locator('#amc-after-dark-calendar').getAttribute('data-theme')!==theme)await page.locator('#amc-theme-toggle').click();
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(400);
   const file=path.join(output,`ADC_${theme.toUpperCase()}_Beta0.9.7.png`);
   await page.screenshot({path:file,fullPage:true,animations:'disabled'});
   const png=await fs.readFile(file);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),3840);
  }
 }
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
 await mp.clock.install({time:new Date('2027-01-01T12:00:00Z')});
 await mp.goto('http://127.0.0.1:4175/inline');
 await mp.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');
 assert.equal(await mp.locator('#amc-after-dark-calendar').getAttribute('data-month'),'2027-01','Inline loader must open current year');
 assert.equal(await mp.locator('.amc-day.is-mobile-active').getAttribute('data-day'),'1');
 // The adjacent-year date rail must transition both directions without a page reload.
 await mp.locator('.amc-mobile-day-chip[data-month-id="2026-12"][data-day="31"]').click();
 await mp.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar').dataset.month==='2026-12');
 await mp.locator('.amc-mobile-day-chip[data-month-id="2027-01"][data-day="1"]').click();
 await mp.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar').dataset.month==='2027-01');
 for(const width of [320,390,430,600,768]){
  await mp.setViewportSize({width,height:844});await mp.waitForTimeout(200);
  assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`2027 inline overflow at ${width}`);
 }
 if(output){await mp.setViewportSize({width:390,height:844});await mp.waitForTimeout(200);await mp.screenshot({path:path.join(output,'ADC_MOBILE_Beta0.9.7.png'),fullPage:true});}
 result.inline2027=true;result.yearBoundary=true;result.responsiveWidths=[320,390,430,600,768];
 assert.deepEqual(errors,[]);result.pageErrors=errors;
 console.log(JSON.stringify(result,null,2));
 await mobile.close();
} finally {await browser.close();server.close();}
