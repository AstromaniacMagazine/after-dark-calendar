# After Dark Calendar

This repository contains the production website files for **After Dark Calendar by Astromaniac Magazine**.

## Folder structure

- `index.html` - main web page
- `assets/` - CSS, JavaScript, images
- `data/` - month and shared data files
- `scripts/validate-calendar.mjs` - release-time source and data integrity checks
- `scripts/test-mobile-interactions.mjs` - real one-finger touch regression checks for native inline scrolling, date swiping, Today and location layout
- `assets/squarespace-inline.js` - production Squarespace loader that renders the calendar in the page for native mobile scrolling
- `SQUARESPACE_EMBED.md` - one-line production Code Block installation plus the retired iframe reference
- `*.zip`, `archive/`, `July 26/` - local archives (not required at runtime and excluded from Git)

## Release workflow

The working production copy lives at:

`G:\My Drive\After Dark Calendar\After Dark Codes`

For each version:

1. Create a release branch from the latest `origin/main`.
2. Edit the production files directly in this repository root.
3. Run `node scripts/validate-calendar.mjs`, `node scripts/test-mobile-interactions.mjs --modules <node_modules>` and complete responsive browser checks.
4. Save three standard high-resolution full-page release snapshots in `G:\My Drive\After Dark Calendar\Snapshots`:
   - `ADC_LIGHT_<VERSION>.png`
   - `ADC_DARK_<VERSION>.png`
   - `ADC_RED_<VERSION>.png`
   Use `scripts/capture-release-snapshots.mjs` to produce full-page, 2x-resolution PNG files and verify their PNG signatures and dimensions. Do not generate 3D, perspective or depth-of-field variants.
5. Review the diff, commit only the intended release files and push the branch.
6. Open a pull request to `main`, merge it, and verify the GitHub Pages build.
7. Confirm the embedded calendar at `https://www.astromaniacmagazine.com/after-dark-calendar` is serving the new version.
8. Keep the Squarespace Code Block on the inline installation in `SQUARESPACE_EMBED.md`; do not restore the retired iframe bridge.

## Notes

### Beta0.9.7d (28 October 2026)

The right-side event panel uses a neutral heading instead of repeating the first event title, gives event headings and descriptions separate rows, and reserves enough space for the longer multi-event dates before the Moon chart. Mobile inline date gestures suspend scroll snapping while the finger moves, then settle on a day; the date rail uses swipe velocity to select a nearby date. Observing target cards use native horizontal touch scrolling. Responsive checks verify multi-event copy is fully visible, date and target swipes work, and vertical scrolling remains available.

### Beta0.9.7c (28 October 2026)

The desktop event summary now separates event headings from explanatory text while keeping the chart and forecast anchored. Forecast headers place the date and four icons on one row; each icon comes from the same four-hour interval as its colour bars. Unexpanded desktop date rows are shorter. Mobile shows the seven-night forecast before observing targets and related articles, uses two source columns, and offers an animated, keyboard-accessible location prompt for the Moon chart. Monthly highlight text is larger and clearer within the existing cards.

November and December 2026 phase times were rechecked against the live USNO API, the December solstice against USNO, and meteor predictions against the IMO 2026 calendar. All 49 stored 2027 lunar phases and six seasons/apsides matched the live USNO API. The IMO 2027 calendar additionally describes possible, unconfirmed Leonid enhancements on 17–20 November and possible Andromedid activity around 6 December; those are labelled as uncertain predictions in the relevant date entries. `data/2027-audit.json` records the recheck scope and source URLs. No specific launch dates were added without a reliable dated schedule.

`node scripts/test-polish.mjs --modules <node_modules> --output <snapshot-directory>` also checks four same-line weather icons, event heading/copy gaps, shorter date cards, mobile content order, location prompt focus, highlight size and two-column sources.

### Beta0.9.7b (27 October 2026)

Desktop expansions use a measured two-column overlay with a raised border and dimmed background dates. The grid keeps fixed rows, and selected-day summary content has a reserved scrollable area, so changing events does not move the chart or forecast. Mobile retains native date swiping and uses compact data cards.

Moon azimuth and altitude are explicitly labelled **21:00 local time**, rather than the former unlabelled midnight sample. Azimuth is clockwise from true north; the Moon-centre altitude includes standard refraction. Rise/set searches use the actual local midnight-to-midnight interval, including 23/25-hour DST days, and displayed times round to the nearest minute. Terrain and non-standard weather are outside the model. Checked reference cases in `scripts/fixtures/astronomy-reference.json` cover USNO Sun/Moon rise/set for London, Sydney, New York and a DST date, plus a JPL apparent topocentric Moon position. `node scripts/test-astronomy.mjs` verifies these without network access.

Location history and theme persistence are optional and off by default. A user can enable a five-place history on the location dropdown or in Sources and logs. Coordinates stored in that history and sent to weather/reverse-geocoding services are rounded to three decimals; astronomy uses the selected coordinates in memory. History expires after 30 days and expired records are removed on the next calendar visit. Clearing it stops persistence; the current location can continue in memory until the visit ends. Legacy automatic location/theme storage is removed unless the user opts into the new controls. No location API requests run before a location is selected or an explicitly remembered one is restored. Calendar API requests omit credentials and referrers, and the standalone page no longer requests Google Fonts.

The calendar privacy notice identifies Open-Meteo, BigDataCloud, external imagery and the magazine policy. Technical storage controls follow an opt-in approach consistent with the [ICO storage/access guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/). This repository does not control Squarespace's separate analytics/consent configuration or third-party processing policies; a whole-site legal compliance assessment must cover those too.

Additional browser checks: `node scripts/test-polish.mjs --modules <node_modules> --output <snapshot-directory>`. This measures overlay alignment and unchanged section positions, checks one-line dates without clipping, and exercises history opt-in, five-entry limits, selection, keyboard navigation, deletion, expiry, theme opt-out and denied browser storage.

### Beta0.9.7 (27 October 2026)

The calendar covers May 2026–December 2027. Month files remain lazy-loaded; there is no runtime article scraping or annual data bundle. `data/2027-audit.json` retains the checked USNO phase/season records, Espenak planetary almanac records and IMO 2027 meteor predictions. USNO takes precedence for lunar and seasonal instants; IMO takes precedence for shower maxima. Future launches are omitted unless a reliable dated schedule is available. Meteor maxima are predictions, ZHRs are idealised, and local visibility must be checked.

2027 Moon thumbnails are illustrative phase diagrams computed from Astronomy Engine, avoiding unavailable annual NASA frames. Two contextual related links are selected from the magazine's articles, reviews and mission features checked on 27 October 2026.

Forecast Overall ratings are Poor (<45), Average (45–63), Fair (64–77), Good (78–89) and Excellent (90+). Additional limits apply to cloud, precipitation, fog, visibility and wind; an incomplete interval is unavailable. A poor quarter limits the whole-night rating. Calendar blocks and forecast intervals share one rating/colour function. Seeing and transparency remain weather-derived planning estimates.

Release checks:

```text
node scripts/validate-calendar.mjs
node scripts/test-forecast.mjs
node scripts/test-mobile-interactions.mjs --modules <node_modules>
node scripts/test-release.mjs --modules <node_modules> --output <snapshot-directory>
```

The final browser suite checks all 14 newly added/refreshed months, expanded desktop borders, the inline 2027 loader, navigation across December/January and widths of 320, 390, 430, 600 and 768 pixels. It can save the three standard 2x desktop screenshots and a mobile screenshot.

- Do not copy `.git` or local archive folders into a release.
- ZIP archives and historical working folders are ignored to keep production commits clean.
- Month data must cite its sources and pass the validation script before release.
- Full Moon entries must include a popular traditional name in `Name (Full Moon)` form, cite the naming source, and retain the exact astronomical phase time when available.
- The public “Current version” panel must contain only the latest three release entries.
- Always review the exact staged diff before committing or merging.

## Version numbering

- Use a new tenth-level beta (`Beta0.6`, `Beta0.7`) for substantial features, data-model changes or meaningful performance and UX work.
- Use a letter suffix (`Beta0.6a`, `Beta0.6b`) for smaller follow-up fixes to the same release.
- Do not change the public version for routine source checks that produce no material user-facing change.
- The validator checks that the root data attribute, visible badge, version panel and structured data all identify the same release.
