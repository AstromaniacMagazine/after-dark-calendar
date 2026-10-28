import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const fixture=JSON.parse(read('./fixtures/astronomy-reference.json'));
const root={querySelector:()=>null,dataset:{}};
const sandbox={console,Date,Intl,URL,URLSearchParams,document:{getElementById:()=>root},matchMedia:()=>({matches:false})};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(read('../assets/astronomy.browser.js'),sandbox);
vm.runInContext(read('../assets/after-dark-calendar.js').replace('  boot();','  window.testApi={state,calculateDailySky,horizon,zonedDate,riseSetOnLocalDay,formatTime};'),sandbox);
const {state,calculateDailySky,horizon,zonedDate,riseSetOnLocalDay,formatTime}=sandbox.testApi;
const A=sandbox.Astronomy;
const results=[];
for(const item of fixture.riseSet){
 const d=item.reference;
 Object.assign(state,{lat:item.lat,lon:item.lon,timeZone:item.timeZone,month:{year:d.year,monthIndex:d.month-1}});
 const sky=calculateDailySky(d.day);
 assert.equal(sky.positionTime,'21:00');
 for(const [events,body] of [[d.sundata,'Sun'],[d.moondata,'Moon']])for(const event of events.filter(e=>['Rise','Set'].includes(e.phen))){
  const [h,m]=event.time.split(':').map(Number);
  const epoch=Date.UTC(d.year,d.month-1,d.day,h,m)-d.tz*3600000;
  const expected=formatTime(new Date(epoch));
  const key=`${body.toLowerCase()}${event.phen.toLowerCase()}Label`;
  const actual=sky[key];
  const mins=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
  assert(Number.isFinite(mins(actual)),`${item.label} ${key}: ${actual}`);
  const delta=Math.min(Math.abs(mins(actual)-mins(expected)),1440-Math.abs(mins(actual)-mins(expected)));
  assert(delta<=1,`${item.label} ${key}: ${actual} vs USNO ${expected}`);
  results.push({location:item.label,event:key,actual,USNO:expected,minutesDifference:delta});
 }
}
const p=fixture.moonPosition;
const moon=horizon(A.Body.Moon,new Date(p.time),new A.Observer(p.lat,p.lon,0));
assert(Math.abs(moon.altitude-p.altitude)<.05,`Altitude vs JPL: ${moon.altitude} / ${p.altitude}`);
assert(Math.abs(moon.azimuth-p.azimuth)<.05,`Azimuth vs JPL: ${moon.azimuth} / ${p.azimuth}`);
state.timeZone='Europe/London';
const springStart=zonedDate(2027,2,28),springEnd=zonedDate(2027,2,29);
const autumnStart=zonedDate(2027,9,31),autumnEnd=zonedDate(2027,10,1);
assert.equal((springEnd-springStart)/3600000,23);
assert.equal((autumnEnd-autumnStart)/3600000,25);
// A polar summer day must never display a following date's sunrise.
const polar=new A.Observer(78.2232,15.6469,0);
assert.equal(riseSetOnLocalDay(A.Body.Sun,polar,1,new Date('2027-06-21T00:00Z'),new Date('2027-06-22T00:00Z')),null);
console.log(JSON.stringify({riseSet:results,JPL:{altitude:moon.altitude,azimuth:moon.azimuth},DST:[23,25],polarDay:true},null,2));
