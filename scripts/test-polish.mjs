import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=process.argv[process.argv.indexOf('--modules')+1];
const output=process.argv.includes('--output')?path.resolve(process.argv[process.argv.indexOf('--output')+1]):null;
const {chromium}=createRequire(path.join(modules,'package.json'))('playwright');
const server=http.createServer(async(req,res)=>{
 try{const u=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(4177,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[];const results={};
const fixture=()=>{
 const time=Array.from({length:192},(_,i)=>new Date(Date.UTC(2026,9,27,i)).toISOString().slice(0,16));const v=n=>Array(time.length).fill(n);
 return {timezone:'Europe/London',hourly:{time,cloud_cover:v(22),temperature_2m:v(14),relative_humidity_2m:v(62),dew_point_2m:v(7),precipitation_probability:v(4),wind_speed_10m:v(8),wind_gusts_10m:v(13),visibility:v(28000),cape:v(20),weather_code:v(1)}};
};
async function setup(viewport,seed=false,month='2026-10'){
 const context=await browser.newContext({viewport,hasTouch:viewport.width<601,isMobile:viewport.width<601,deviceScaleFactor:2});
 const requests={weather:0};
 await context.route('**/api.open-meteo.com/v1/forecast?**',route=>{requests.weather++;return route.fulfill({json:fixture()});});
 await context.route('**/api.bigdatacloud.net/**',route=>route.fulfill({json:{city:'Selected place',timeZone:'Europe/London'}}));
 if(seed)await context.addInitScript(()=>{localStorage.setItem('amc-remember-locations','yes');localStorage.setItem('amc-sky-calendar-location',JSON.stringify({lat:51.50853,lon:-.12574,name:'London',timeZone:'Europe/London',savedAt:new Date().toISOString()}));});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:4177/?snapshot=1&month=${month}`);
 await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');
 return {context,page,requests};
}
const boxes=page=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.amc-day, .amc-detail .amc-chart, .amc-detail .amc-weather, .amc-recommendations')].map((el,i)=>{const r=el.getBoundingClientRect();return [el.classList.contains('amc-day')?'day'+el.dataset.day:'section'+i,{x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height}]})));
try{
 for(const width of [1920,1440,1300,1024,768]){
  const {context,page}=await setup({width,height:1080},true);
  await page.waitForFunction(()=>document.querySelectorAll('.amc-weather-card').length===7);
  for(const day of [1,4,7,27,31]){
   const before=await boxes(page);
   await page.evaluate(day=>document.querySelector(`.amc-day[data-day="${day}"]`).click(),day);
   await page.waitForTimeout(80);
   const after=await boxes(page);
   for(const [id,rect] of Object.entries(before))for(const axis of ['x','y'])assert(Math.abs(rect[axis]-after[id][axis])<.3,`${width}px day ${day} moved ${id}.${axis}: ${rect[axis]} -> ${after[id][axis]}`);
   for(const id of Object.keys(before).filter(id=>id.startsWith('day')))assert(Math.abs(before[id].h-after[id].h)<.3,`${id} changed height`);
   const alignment=await page.locator(`.amc-day[data-day="${day}"]`).evaluate(el=>{
    const r=el.getBoundingClientRect(),p=el.querySelector('.amc-expanded').getBoundingClientRect();
    const row=[...document.querySelectorAll('.amc-day')].map(el=>({el,r:el.getBoundingClientRect()})).filter(e=>Math.abs(e.r.top-r.top)<2);
    const i=row.findIndex(e=>e.el===el),n=row[i+1]||row[i-1];
    const grid=document.querySelector('.amc-grid'),g=grid.getBoundingClientRect(),gap=parseFloat(getComputedStyle(grid).columnGap)||0;
    const w=n?Math.max(r.right,n.r.right)-Math.min(r.left,n.r.left):r.width*2+gap;
    const left=n?Math.min(r.left,n.r.left):Math.min(r.left,g.right-w);
    return {left:p.left,right:p.right,expectedLeft:left,expectedRight:left+w,border:getComputedStyle(el.querySelector('.amc-expanded')).borderTopWidth};
   });
   assert(Math.abs(alignment.left-alignment.expectedLeft)<.3&&Math.abs(alignment.right-alignment.expectedRight)<.3,JSON.stringify({width,day,alignment}));
   assert.equal(alignment.border,'5px');
   await page.evaluate(day=>document.querySelector(`.amc-day[data-day="${day}"] .amc-minimise`).click(),day);
   const closed=await boxes(page);
   for(const [id,rect]of Object.entries(before))for(const axis of ['x','y'])assert(Math.abs(rect[axis]-closed[id][axis])<.3,`Collapse moved ${id}`);
  }
  const headers=await page.locator('.amc-detail .amc-weather-card-date b').evaluateAll(els=>els.map(el=>{const range=document.createRange();range.selectNodeContents(el);return {lines:range.getClientRects().length,fits:el.scrollWidth<=el.clientWidth}}));
  assert(headers.every(h=>h.lines===1&&h.fits),`${width} forecast date wraps or clips: ${JSON.stringify(headers)}`);
  const iconRows=await page.locator('.amc-detail .amc-weather-card').evaluateAll(cards=>cards.map(card=>{const head=card.querySelector('.amc-weather-card-head'),date=head.querySelector('.amc-weather-card-date').getBoundingClientRect(),icons=[...head.querySelectorAll('.amc-weather-icon')],slots=[...card.querySelectorAll('.amc-weather-row:first-child .amc-weather-segments i')];return {icons:icons.length,slots:slots.length,sameLine:icons.every(icon=>{const r=icon.getBoundingClientRect();return r.top<date.bottom&&r.bottom>date.top}),fits:head.scrollWidth<=head.clientWidth}}));
  assert(iconRows.every(row=>row.icons===4&&row.slots===4&&row.sameLine&&row.fits),`${width} forecast icons do not share the date line or four intervals: ${JSON.stringify(iconRows)}`);
  assert(await page.locator('.amc-detail .amc-weather-card').evaluateAll(els=>els.every(el=>el.querySelector('.amc-weather-row:last-child').getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom-3)),`${width} last forecast metric is clipped`);
  assert.equal(await page.locator('.amc-day[data-day="12"]').evaluate(el=>Math.round(el.getBoundingClientRect().height)),120);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(output&&width===1920){await fs.mkdir(output,{recursive:true});await page.evaluate(()=>document.querySelector('.amc-day[data-day="27"]').click());for(const theme of ['light','dark','red','teal']){while(await page.locator('#amc-after-dark-calendar').getAttribute('data-theme')!==theme)await page.locator('#amc-theme-toggle').click();await page.screenshot({path:path.join(output,`POLISH_${theme.toUpperCase()}.png`),fullPage:true});}}
  await context.close();
 }
 results.stableAlignedOverlays={widths:[1920,1440,1300,1024,768],days:[1,4,7,27,31],tolerancePixels:.3};results.forecastDates='single line, four interval icons, no clipping';
 for(const [month,day] of [['2026-11',17],['2026-12',12],['2027-11',18],['2027-12',6]]){
  const {context,page}=await setup({width:1440,height:1000},false,month);
  await page.locator(`.amc-day[data-day="${day}"]`).click();
  const gaps=await page.locator('.amc-detail-summary').evaluate(el=>{const title=el.querySelector('.amc-detail-title').getBoundingClientRect(),listElement=el.querySelector('.amc-event-list'),list=listElement.getBoundingClientRect(),last=listElement.lastElementChild.getBoundingClientRect(),summary=el.getBoundingClientRect();return {titleToList:list.top-title.bottom,visible:last.bottom<=summary.bottom-2,items:[...el.querySelectorAll('.amc-event')].map(item=>{const heading=item.querySelector('h4').getBoundingClientRect(),copy=item.querySelector('p').getBoundingClientRect();return copy.top-heading.bottom})}});
  assert(gaps.titleToList>=4&&gaps.items.every(gap=>gap>=5)&&gaps.visible,`${month}-${day} event text overlaps or is clipped: ${JSON.stringify(gaps)}`);
  if(output&&month==='2026-11')await page.screenshot({path:path.join(output,'POLISH_EVENT_NOVEMBER.png'),fullPage:true});
  await context.close();
 }
 results.eventSpacing='November/December 2026 and 2027 titles and copy do not overlap';
 if(output){
  const seeded=await setup({width:390,height:844},true);
  await seeded.page.waitForFunction(()=>document.querySelectorAll('.amc-day.is-mobile-active .amc-cell-weather-row').length===7);
  for(const width of [320,390,430]){
   await seeded.page.setViewportSize({width,height:844});
   const rows=await seeded.page.locator('.amc-day.is-mobile-active .amc-cell-weather-row .amc-weather-card-head').evaluateAll(heads=>heads.map(head=>{const date=head.querySelector('.amc-weather-card-date').getBoundingClientRect(),icons=[...head.querySelectorAll('.amc-weather-icon')];return {count:icons.length,fits:head.scrollWidth<=head.clientWidth,sameLine:icons.every(icon=>{const r=icon.getBoundingClientRect();return r.top<date.bottom&&r.bottom>date.top})}}));
   assert(rows.every(row=>row.count===4&&row.fits&&row.sameLine),`${width}px mobile forecast header wraps or clips: ${JSON.stringify(rows)}`);
  }
  await seeded.page.setViewportSize({width:390,height:844});
  await seeded.page.screenshot({path:path.join(output,'POLISH_MOBILE_FORECAST_ORDER.png'),fullPage:true});
  await seeded.page.locator('.amc-sources > summary').click();
  await seeded.page.screenshot({path:path.join(output,'POLISH_MOBILE_SOURCES.png'),fullPage:true});
  await seeded.context.close();
 }
 const {context,page,requests}=await setup({width:390,height:844});
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-sky-calendar-location')),null,'No location should be saved by default');
 assert.equal(requests.weather,0,'No location/weather request should occur before a location is chosen');
 const mobileOrder=await page.locator('.amc-day.is-mobile-active .amc-cell-mobile-extra').evaluate(el=>[...el.children].map(child=>child.className));
 assert(mobileOrder.indexOf('amc-weather')>=0&&mobileOrder.indexOf('amc-weather')<mobileOrder.indexOf('amc-mobile-recommendations'),`Mobile forecast must precede recommendations: ${mobileOrder}`);
 await page.locator('.amc-day.is-mobile-active .amc-chart-location-action').click();
 assert.equal(await page.locator('#amc-location-input').evaluate(el=>document.activeElement===el),true,'Chart prompt must focus the location search');
 const highlight=await page.locator('.amc-intel-card').first().evaluate(el=>({height:el.getBoundingClientRect().height,bodySize:parseFloat(getComputedStyle(el.querySelector('.amc-intel-copy span')).fontSize)}));
 assert(highlight.height<=72&&highlight.bodySize>=11.5,`Mobile highlight grew or stayed too small: ${JSON.stringify(highlight)}`);
 await page.locator('.amc-sources > summary').click();
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});
  const sourceLayout=await page.locator('.amc-source-list').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,overflow:[...el.querySelectorAll('li')].filter(li=>li.scrollWidth>li.clientWidth+1).length}));
  assert.equal(sourceLayout.columns,2,`${width}px mobile sources must use two columns`);
  assert.equal(sourceLayout.overflow,0,`${width}px mobile source text overflows its column`);
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.amc-sources > summary').click();
 await page.locator('#amc-location-input').click();
 await page.locator('[data-enable-history]').click();
 for(let i=0;i<6;i++){
  await page.locator('#amc-location-input').fill(`${50+i/10}, -0.1`);
  await page.locator('#amc-manual-location > button').click();
  await page.waitForTimeout(100);
 }
 const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('amc-location-history')));
 assert.equal(history.length,5);assert.equal(history[0].lat,50.5);assert.equal(history[4].lat,50.1);
 await page.locator('#amc-location-input').click();
 assert.equal(await page.locator('.amc-location-option').count(),5);
 await page.locator('.amc-location-option').nth(3).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('amc-sky-calendar-location')).lat),50.2);
 await page.locator('#amc-location-input').click();await page.locator('#amc-location-input').press('ArrowDown');await page.keyboard.press('Escape');
 assert.equal(await page.locator('#amc-location-results').isHidden(),true);
 const compact=await page.locator('.amc-day.is-mobile-active .amc-mini-grid').evaluate(el=>el.getBoundingClientRect().height);
 assert(compact<215,`Mobile dataset grid too tall: ${compact}`);
 const chartSpacing=await page.locator('.amc-day.is-mobile-active .amc-chart').evaluate(el=>{const h=el.querySelector('h3').getBoundingClientRect(),s=el.querySelector('svg').getBoundingClientRect(),l=el.querySelector('.amc-alt-labels').getBoundingClientRect();return {above:s.top-h.bottom,below:l.top-s.bottom};});
 assert(chartSpacing.above<=5&&chartSpacing.below<=5,JSON.stringify(chartSpacing));
 await page.locator('#amc-location-input').click();await page.locator('[data-clear-history]').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-location-history')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-sky-calendar-location')),null);
 const previousRequests=requests.weather;
 await page.reload();await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');
 assert.equal(await page.locator('#amc-after-dark-calendar').evaluate(el=>el.classList.contains('has-location')),false);
 assert.equal(requests.weather,previousRequests,'Cleared location must not trigger a background weather request');
 await page.waitForFunction(()=>{const a=document.querySelector('.amc-day.is-mobile-active'),g=document.querySelector('.amc-grid');if(!a||!g)return false;const ar=a.getBoundingClientRect(),gr=g.getBoundingClientRect();return Math.abs((ar.left+ar.right)/2-(gr.left+gr.right)/2)<2&&a.querySelector('.amc-mini-grid')?.getBoundingClientRect().height>100;});
 if(output)await page.screenshot({path:path.join(output,'POLISH_MOBILE.png'),fullPage:true});
 results.history={optIn:true,max:5,selection:true,keyboard:true,clear:true,mobileGridHeight:compact,chartSpacing};
 // Expiry is enforced on the next visit, including removal of the legacy current-location record.
 await page.evaluate(()=>{const old={lat:51,lon:0,name:'Expired',timeZone:'UTC',savedAt:new Date(Date.now()-31*86400000).toISOString()};localStorage.setItem('amc-remember-locations','yes');localStorage.setItem('amc-location-history',JSON.stringify([old]));localStorage.setItem('amc-sky-calendar-location',JSON.stringify(old));});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-location-history')),'[]');assert.equal(await page.evaluate(()=>localStorage.getItem('amc-sky-calendar-location')),null);
 results.history.expiry=true;
 await page.locator('.amc-sources > summary').click();
 await page.locator('#amc-theme-toggle').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-sky-calendar-theme')),null);
 await page.locator('#amc-remember-theme').check();
 await page.locator('#amc-theme-toggle').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-sky-calendar-theme')),await page.locator('#amc-after-dark-calendar').getAttribute('data-theme'));
 await page.locator('#amc-remember-theme').uncheck();
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-sky-calendar-theme')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('amc-remember-theme')),null);
 results.optionalThemeMemory=true;
 await context.close();
 const denied=await browser.newContext();await denied.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Storage blocked')};});
 const dp=await denied.newPage();dp.on('pageerror',e=>errors.push(e.message));await dp.goto('http://127.0.0.1:4177/');await dp.waitForFunction(()=>document.querySelector('#amc-after-dark-calendar')?.dataset.ready==='true');await dp.locator('#amc-location-input').click();await dp.locator('[data-enable-history]').click();assert.match(await dp.locator('#amc-privacy-status').textContent(),/unavailable/);await denied.close();
 results.blockedStorage=true;assert.deepEqual(errors,[]);results.pageErrors=errors;console.log(JSON.stringify(results,null,2));
}finally{await browser.close();server.close()}
