# After Dark Calendar 1.0 release audit — 15 November 2026

**Status: release blocked.** This branch contains tested candidate fixes, but the public version remains Beta 0.9.9. Do not merge or change the Squarespace cache key to 1.0 until the two external-service issues below are resolved and retested.

## Release blockers

1. **Open-Meteo licence.** The live calendar calls the free weather and geocoding endpoints. [Open-Meteo's terms](https://open-meteo.com/en/terms) treat a website with advertising or promotional activity as commercial, even if the calendar itself is free to visitors. The magazine page has ad and tracking scripts. The owner has not confirmed a commercial subscription or written permission. Obtain permission/licensed access, or migrate weather and city search to a provider that permits this use, then test the replacement and update the visible attribution and privacy notice. [Visual Crossing's no-key API](https://www.visualcrossing.com/resources/documentation/weather-api/free-weather-api-no-key/) is a possible commercial-use alternative, subject to its fair-use limits and visible attribution, but has not been integrated or approved.
2. **Host-page consent.** In a clean browser before banner choice, the Squarespace page requested Google Analytics/ads, Facebook and Pinterest endpoints and set `google_auto_fc_cmp_setting` in local storage. The standalone calendar made no tracker or location-service requests and set no cookies. The host's code injection/integrations must hold non-essential scripts until valid consent, or use a consent setup that does so. [ICO guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-comply-with-the-pecr-rules/) and [Squarespace's integration guidance](https://support.squarespace.com/hc/en-us/articles/360001264507-The-cookies-Squarespace-uses) support this check. Re-run a clean-browser request/cookie audit after the site change; also test Decline all and later withdrawal. The repository does not control Squarespace's site-level scripts.

These observations identify release risks; they are not a legal certification. The magazine privacy policy and data processor arrangements should be reviewed by the site owner or a qualified adviser.

## Candidate changes

- Stopped sending manually typed coordinates to BigDataCloud's free reverse-geocoding endpoint, whose [fair-use terms](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free) limit it to consented device GPS coordinates. Updated the inline privacy notice and added a browser regression.
- Replaced four broken target-image URLs and a copyright-marked APOD photo, and replaced two unverified external image sources. Added visible image credits and licence links for Wikimedia Commons targets. All 55 static target-image URLs returned HTTP 200 on 15 November 2026. Added a validator for image source, credit and licence metadata.
- Reserved initial calendar space so measured first-load cumulative layout shift fell from 0.54 to 0 on desktop and from 0.118 to about 0.0002 on mobile under the local trace. This is a laboratory measurement, not a field Core Web Vitals result.
- Added a USNO season source and precise June 2026 solstice time.

## Verification

- `node scripts/validate-calendar.mjs`: 20 months and 610 days; phase, season, meteor, source and image metadata checks pass.
- Live USNO comparison: 83 phase dates/types, 70 exact phase times and 10 season entries; no detected mismatches. NASA's [2027 eclipse list](https://eclipse.gsfc.nasa.gov/OH/OH2027.html) agrees with the five catalogued eclipse entries. Forecasts and future event predictions remain subject to later updates.
- Astronomy fixture: Sun/Moon rise and set reference cases for London, Sydney, New York and DST, plus a JPL apparent Moon position, pass. Local terrain, unusual atmospheric refraction and changing weather are outside this model.
- Browser regressions pass for all 14 remaining months from November 2026 to December 2027, widths 320–1920 px, mobile swipes, Today navigation, event-copy spacing, chart spacing, target and article rotation, location opt-in/history and all four themes. No page script errors or horizontal overflow in the tested layouts.
- All 35 recommended magazine links returned HTTP 200. Four 3840 × 2912 PNG theme snapshots are saved under the ignored `.release-snapshots/Version1.0/` folder.
- Local throttled pages showed about 3–4 seconds to ready, zero desktop CLS and about 0.0002 mobile CLS after the fix; remeasure on production. The current Squarespace host took about 26–29 seconds to calendar ready in a separate throttled run, with roughly 107–130 requests before ready. Site-level assets are the main performance issue observed.

## SEO and publication checks

- The standalone page has a self-consistent title, description, structured data and canonical to the magazine page. The live magazine page also has a title, description and canonical, but its source renders multiple `h1` elements, some in the footer; simplify those in Squarespace.
- The magazine still requests `squarespace-inline.js?v=Beta0.9.8b-20261108a`, although the script currently displays Beta 0.9.9. Update the Code Block cache key only after the approved 1.0 build is merged and GitHub Pages serves it.
- After blockers are cleared: update version markers, structured data date, release log (latest three only), sources/privacy copy and Squarespace build key; run all regressions and four-theme snapshots again; merge the reviewed release PR; verify GitHub Pages and the magazine embed in clean desktop/mobile browsers.
