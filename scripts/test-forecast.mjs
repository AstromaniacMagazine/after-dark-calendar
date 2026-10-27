import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script = fs.readFileSync(new URL('../assets/after-dark-calendar.js', import.meta.url), 'utf8');
const root = { querySelector: () => null, dataset: {} };
const sandbox = { console, Date, Intl, URL, URLSearchParams, document: { getElementById: () => root }, matchMedia: () => ({ matches: false }) };
sandbox.window = sandbox;
vm.runInNewContext(script.replace('  boot();', '  window.testApi = { observingRating, summariseWeather, shortWeatherDate, segmentColour, dayObservingBar, numberAt, zonedDateParts };'), sandbox);
const api = sandbox.testApi;
const keys = [[0,'poor'],[44,'poor'],[45,'average'],[63,'average'],[64,'fair'],[77,'fair'],[78,'good'],[89,'good'],[90,'excellent'],[100,'excellent'],[null,'unavailable'],[NaN,'unavailable']];
for (const [score, key] of keys) assert.equal(api.observingRating(score).key, key);
assert.equal(api.numberAt([null],0),null);
assert.equal(api.numberAt([undefined],0),null);
assert.equal(api.numberAt([0],0),0);
assert.equal(api.shortWeatherDate('2026-10-28',1), 'Wednesday, 28 Oct');
assert.equal(api.shortWeatherDate('2027-01-01',0), 'Friday, 1 Jan');
function fixture(overrides = {}) {
  const time = Array.from({length:192},(_,i)=>new Date(Date.UTC(2026,9,27,i)).toISOString().slice(0,16));
  const values = n => Array(time.length).fill(n);
  return { time, cloud_cover:values(0),temperature_2m:values(12),relative_humidity_2m:values(35),dew_point_2m:values(1),precipitation_probability:values(0),wind_speed_10m:values(0),wind_gusts_10m:values(0),visibility:values(30000),cape:values(0),weather_code:values(0), ...Object.fromEntries(Object.entries(overrides).map(([k,v])=>[k,values(v)])) };
}
const cases = [
  [{},'excellent'],[{cloud_cover:22},'fair'],[{cloud_cover:80},'poor'],
  [{precipitation_probability:65},'poor'],[{weather_code:61},'poor'],[{weather_code:45},'poor'],
  [{visibility:700},'poor'],[{wind_speed_10m:42},'poor'],
  [{cloud_cover:null},'unavailable'],[{weather_code:null},'unavailable']
];
for (const [input, expected] of cases) {
  const nights=api.summariseWeather(fixture(input));
  assert.equal(nights.length,7);
  assert.equal(nights[0].observingKey,expected,JSON.stringify(input));
  const night=nights[0];
  const bar=api.dayObservingBar(night);
  for(const segment of night.segments) assert(bar.includes(api.segmentColour(segment,'observing')),'Calendar and forecast colours diverge');
}
const truncated=fixture();
for(const key of Object.keys(truncated)) truncated[key]=truncated[key].slice(0,25);
assert.equal(api.summariseWeather(truncated)[0].observingKey,'unavailable');
const splitNight=fixture();
for(let i=20;i<24;i++) splitNight.weather_code[i]=95;
assert.notEqual(api.summariseWeather(splitNight)[0].observingKey,'excellent','One stormy quarter must block Excellent overall');
const cloudyQuarter=fixture();
for(let i=20;i<24;i++) cloudyQuarter.cloud_cover[i]=22;
assert.notEqual(api.summariseWeather(cloudyQuarter)[0].observingKey,'excellent','One cloudy quarter must block Excellent overall');
assert.equal(api.zonedDateParts(new Date('2027-03-28T01:30:00Z'),'Europe/London').hour,'02');
assert.equal(api.zonedDateParts(new Date('2027-10-31T01:30:00Z'),'Europe/London').hour,'01');
console.log('Forecast regression passed: five levels, cloud/rain/fog/wind, null/truncated data, shared colours, weekday dates and UK DST.');
