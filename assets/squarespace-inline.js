(() => {
  "use strict";

  const script = document.currentScript;
  const host = document.getElementById("adc-inline-calendar");
  if (!script || !host || host.dataset.amcLoaded === "true") return;

  const base = new URL("../", script.src).href;
  const build = "Beta0.9.4-20260827a";
  host.dataset.amcLoaded = "true";
  host.classList.add("amc-inline-host");

  if (!document.querySelector("link[data-amc-calendar-styles]")) {
    const styles = document.createElement("link");
    styles.rel = "stylesheet";
    styles.href = `${base}assets/after-dark-calendar.css?v=${build}`;
    styles.dataset.amcCalendarStyles = "calendar";
    document.head.appendChild(styles);
  }

  host.innerHTML = `
    <section class="amc-sky-calendar" id="amc-after-dark-calendar" data-theme="light" data-version="Beta0.9.4" data-asset-version="${build}" data-asset-base="${base}" data-inline="true" aria-labelledby="amc-title">
      <div class="amc-print-brand" aria-hidden="true">
        <img class="amc-print-logo" src="${base}assets/astromaniac-logo.webp" alt="">
        <div><strong>After Dark Calendar</strong><span>by Astromaniac Magazine</span></div>
        <em data-month-label>July 2026</em>
      </div>

      <header class="amc-top">
        <div class="amc-brand-lockup">
          <img class="amc-brand-logo" src="${base}assets/astromaniac-logo.webp" alt="" width="56" height="56" loading="eager" decoding="async">
          <h1 class="amc-title" id="amc-title"><span class="amc-title-line"><span>After Dark Calendar</span><small class="amc-version-badge" aria-label="Current version Beta0.9.4">Beta0.9.4</small></span><span class="amc-byline">by Astromaniac Magazine</span></h1>
        </div>

        <div class="amc-month-strip">
          <button class="amc-button amc-today-button secondary" type="button" id="amc-today-button">Today</button>
          <nav class="amc-month-nav" aria-label="Calendar month">
            <button class="amc-month-button" type="button" data-month-prev aria-label="Previous loaded month" title="Previous loaded month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg></button>
            <strong class="amc-month-label" data-month-label>July 2026</strong>
            <button class="amc-month-button" type="button" data-month-next aria-label="Next loaded month" title="Next loaded month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
          </nav>
        </div>

        <div class="amc-actions">
          <div class="amc-location-controls">
            <button class="amc-button amc-location-button" type="button" id="amc-use-location" aria-label="Use current location" title="Use your device's current location"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle class="amc-location-dot" cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg><span class="amc-use-location-text">Use Current Location</span></button>
            <span class="amc-location-status" id="amc-location-label" aria-live="polite">Location not set</span>
          </div>
          <button class="amc-button secondary amc-icon-button" type="button" id="amc-theme-toggle" aria-label="Switch calendar theme" title="Switch calendar theme"></button>
          <form class="amc-manual-location" id="amc-manual-location" aria-label="Set calendar location manually">
            <input class="amc-location-input" id="amc-location-input" type="search" autocomplete="off" inputmode="search" placeholder="Enter your city or Lat/Lon" aria-controls="amc-location-results" aria-expanded="false">
            <button class="amc-button secondary" type="submit">Set</button>
            <div class="amc-location-results" id="amc-location-results" role="listbox" hidden></div>
          </form>
          <span class="amc-location-prompt" id="amc-location-prompt">Select the location icon or enter a city for local timing and forecast.</span>
        </div>
      </header>

      <section class="amc-intel-strip" aria-label="Monthly highlights">
        <div class="amc-intel-heading"><span>This month</span><b data-month-highlights>July's Highlights</b></div>
        <div class="amc-intel" id="amc-intel"></div>
      </section>

      <div class="amc-layout">
        <div class="amc-calendar-wrap">
          <div class="amc-legend" aria-label="Event colour legend">
            <span class="moon">Moon</span><span class="meteor">Meteor</span><span class="launch">Launch</span><span class="opposition">Opposition</span><span class="eclipse">Eclipse</span><span class="sky">Sky</span><span class="telescope">Telescope</span><span class="occultation">Occultation</span>
          </div>
          <div class="amc-weekdays" aria-hidden="true"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
          <nav class="amc-mobile-day-nav" id="amc-mobile-day-nav" aria-label="Mobile day navigation"><div class="amc-mobile-day-rail" id="amc-mobile-day-rail" role="listbox" aria-label="Swipe dates left or right"></div></nav>
          <div class="amc-grid" id="amc-grid" role="group" aria-label="Month day selector"></div>
        </div>
        <aside class="amc-detail" id="amc-detail" aria-live="polite" aria-label="Selected day details"></aside>
        <section class="amc-recommendations" id="amc-recommendations" aria-live="polite" aria-label="Night photography targets and related articles"></section>
      </div>

      <div class="amc-reference-row">
        <details class="amc-sources">
          <summary><span>Sources and logs</span><a class="amc-feedback-link" href="https://www.astromaniacmagazine.com/contact" target="_blank" rel="noopener">Suggestions or feedback?</a></summary>
          <ul class="amc-source-list" id="amc-source-list"></ul>
          <div class="amc-version-panel">
            <h3>Current version: Beta0.9.4</h3>
            <ul class="amc-version-list">
              <li><b>Beta0.9.4:</b> accelerates first load, strengthens Today, streamlines observing details and polishes mobile date, location, target and return-to-top navigation.</li>
              <li><b>Beta0.9.3:</b> restores native one-finger mobile scrolling, simplifies the date strip and keeps location, city and date context ready across visits.</li>
              <li><b>Beta0.9.2:</b> delivers smoother embedded mobile scrolling, a theme-aware tap-and-swipe date rail, 30-day location memory, corrected target imagery and a final September event audit.</li>
            </ul>
            <section class="amc-about" aria-labelledby="amc-about-title">
              <h2 id="amc-about-title">2026 night-sky calendar and astrophotography planner</h2>
              <p>Explore deep-sky objects, Moon phases, meteor showers, eclipses and planetary events month by month. Add your city for local Moon and Sun timings, astronomical darkness, target altitude guidance and a live seven-night observing forecast.<br><b>Disclaimer and copyright:</b> © 2026 Astromaniac Magazine. After Dark Calendar's original text, design and compiled content are protected by copyright; unauthorised copying, redistribution, adaptation or commercial reuse is prohibited except where permitted by law. Where limited use is legally permitted, give clear credit and link to this page. Third-party imagery and data remain subject to their owners' terms. Astronomy, weather and launch information can change, so verify critical plans with the cited sources.</p>
            </section>
          </div>
        </details>
      </div>
      <span class="amc-weather-tooltip" id="amc-weather-tooltip" role="status" aria-live="polite"></span>
      <button class="amc-back-to-top" id="amc-back-to-top" type="button" aria-label="Back to top" title="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg></button>
    </section>`;

  const initialMonth = `2026-${String(Math.min(12, Math.max(7, new Date().getMonth() + 1))).padStart(2, "0")}`;
  const sources = [
    "assets/astronomy.browser.js",
    "data/common.js",
    "data/month-manifest.js",
    `data/${initialMonth}.js`,
    "assets/after-dark-calendar.js"
  ];

  const load = source => new Promise((resolve, reject) => {
    const dependency = document.createElement("script");
    dependency.src = `${base}${source}?v=${build}`;
    dependency.async = false;
    dependency.onload = resolve;
    dependency.onerror = () => reject(new Error(`Could not load ${source}`));
    document.head.appendChild(dependency);
  });

  (async () => {
    try {
      await Promise.all(sources.map(load));
    } catch (error) {
      console.error("After Dark Calendar failed to initialise", error);
      host.innerHTML = `<p role="alert">After Dark Calendar could not load. <a href="https://astromaniacmagazine.github.io/after-dark-calendar/">Open the calendar directly</a>.</p>`;
    }
  })();
})();
