(() => {
  "use strict";

  const root = document.getElementById("amc-after-dark-calendar");
  if (!root) return;

  const els = {
    grid: root.querySelector("#amc-grid"),
    detail: root.querySelector("#amc-detail"),
    recommendations: root.querySelector("#amc-recommendations"),
    intel: root.querySelector("#amc-intel"),
    themeToggle: root.querySelector("#amc-theme-toggle"),
    useLocation: root.querySelector("#amc-use-location"),
    locationLabel: root.querySelector("#amc-location-label"),
    locationPrompt: root.querySelector("#amc-location-prompt"),
    manualForm: root.querySelector("#amc-manual-location"),
    manualInput: root.querySelector("#amc-location-input"),
    locationResults: root.querySelector("#amc-location-results"),
    previousMonth: root.querySelector("[data-month-prev]"),
    nextMonth: root.querySelector("[data-month-next]"),
    today: root.querySelector("#amc-today-button"),
    sources: root.querySelector("#amc-source-list"),
    downloadPdf: root.querySelector("#amc-download-pdf"),
    tooltip: root.querySelector("#amc-weather-tooltip")
  };

  const shared = window.AMC_SHARED || {};
  const manifest = Array.isArray(window.AMC_MONTH_MANIFEST) ? window.AMC_MONTH_MANIFEST : [];
  const locationKey = "amc-sky-calendar-location";
  const themeKey = "amc-sky-calendar-theme";
  const weatherRefreshMs = 75 * 60 * 1000;
  const useLocationText = "Use Current Location";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarterLabels = ["16:00-20:00", "20:00-00:00", "00:00-04:00", "04:00-08:00"];

  const categoryMeta = {
    moon: { label: "Moon", css: "moon" },
    meteor: { label: "Meteor", css: "meteor" },
    launch: { label: "Launch", css: "launch" },
    opposition: { label: "Opposition", css: "opposition" },
    eclipse: { label: "Eclipse", css: "eclipse" },
    sky: { label: "Sky", css: "sky" },
    telescope: { label: "Telescope", css: "telescope" },
    occultation: { label: "Occultation", css: "occultation" },
    note: { label: "Planning", css: "sky" },
    none: { label: "", css: "no-event" }
  };

  const wikimediaSource = {
    label: "Wikimedia Commons image files",
    url: "https://commons.wikimedia.org/wiki/Main_Page",
    note: "Target thumbnails use Wikimedia Commons file images where no month-specific image is available."
  };

  const state = {
    monthId: "",
    month: null,
    sources: {},
    articles: {},
    media: {},
    moonData: {},
    exactMoon: {},
    highlights: [],
    events: {},
    targets: {},
    selectedDay: 1,
    expandedDay: null,
    hasLocation: false,
    lat: null,
    lon: null,
    locationName: "",
    timeZone: browserTimeZone(),
    night: {},
    sky: {},
    weather: [],
    weatherState: "idle",
    weatherUpdatedAt: null,
    weatherTimer: null,
    weatherRequestId: 0,
    locationMatches: [],
    locationSearchTimer: null,
    locationSearchId: 0,
    monthPromises: Object.create(null)
  };

  const targetCatalogue = [
    { match: /lagoon|m8\b/i, name: "Lagoon Nebula (M8)", type: "Emission nebula", ra: 18.06, dec: -24.38, size: "90 x 40 arcmin" },
    { match: /trifid|m20\b/i, name: "Trifid Nebula (M20)", type: "Nebula", ra: 18.04, dec: -23.03, size: "28 arcmin" },
    { match: /pleiades|m45/i, name: "Pleiades (M45)", type: "Open cluster", ra: 3.79, dec: 24.12, size: "110 arcmin" },
    { match: /messier 4|m4\b/i, name: "Messier 4", type: "Globular cluster", ra: 16.39, dec: -26.53, size: "26 arcmin" },
    { match: /messier 5|m5\b/i, name: "Messier 5", type: "Globular cluster", ra: 15.31, dec: 2.08, size: "23 arcmin" },
    { match: /messier 2|m2\b/i, name: "Messier 2", type: "Globular cluster", ra: 21.56, dec: -0.82, size: "16 arcmin" },
    { match: /messier 15|m15\b/i, name: "Messier 15", type: "Globular cluster", ra: 21.5, dec: 12.17, size: "18 arcmin" },
    { match: /milky way/i, name: "Milky Way fields", type: "Wide-field", size: "wide-field" },
    { match: /saturn/i, name: "Saturn", type: "Planet", body: "Saturn", size: "15-20 arcsec" },
    { match: /jupiter/i, name: "Jupiter", type: "Planet", body: "Jupiter", size: "30-50 arcsec" },
    { match: /venus/i, name: "Venus", type: "Planet", body: "Venus", size: "10-60 arcsec" },
    { match: /mars/i, name: "Mars", type: "Planet", body: "Mars", size: "4-25 arcsec" },
    { match: /mercury/i, name: "Mercury", type: "Planet", body: "Mercury", size: "5-13 arcsec" },
    { match: /moon|lunar|crater|terminator|moonrise/i, name: "Moon", type: "Lunar", body: "Moon", size: "about 31 arcmin" },
    { match: /meteor|perseid|aquariid|capricornid|cygnid/i, name: "Meteor radiant", type: "Meteor shower", size: "wide radiant" },
    { match: /eclipse|solar|corona/i, name: "Solar event", type: "Solar", body: "Sun", size: "30-32 arcmin" },
    { match: /comet/i, name: "Comet", type: "Comet", size: "variable coma" },
    { match: /cluster/i, name: "Bright clusters", type: "Star cluster", size: "varies" }
  ];

  boot();

  async function boot() {
    setTheme(safeStorageGet(themeKey) === "dark" ? "dark" : "light");
    bindEvents();
    await showMonth(defaultMonthId());
    applySavedLocation();
  }

  function bindEvents() {
    els.themeToggle.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    els.useLocation.addEventListener("click", useBrowserLocation);
    els.manualForm.addEventListener("submit", useManualLocation);
    els.manualInput.addEventListener("input", handleManualLocationInput);
    els.locationResults?.addEventListener("click", handleLocationResultClick);
    document.addEventListener("click", hideLocationResultsOnOutsideClick);
    els.previousMonth?.addEventListener("click", () => goToAdjacentMonth(-1));
    els.nextMonth?.addEventListener("click", () => goToAdjacentMonth(1));
    els.today?.addEventListener("click", goToToday);
    els.downloadPdf?.addEventListener("click", downloadPdf);
    root.addEventListener("pointerover", handleWeatherTipIn);
    root.addEventListener("pointerout", handleWeatherTipOut);
    root.addEventListener("focusin", handleWeatherTipIn);
    root.addEventListener("focusout", handleWeatherTipOut);
    root.addEventListener("click", handleWeatherTipClick);
    document.addEventListener("visibilitychange", refreshWeatherWhenVisible);
  }

  async function showMonth(monthId, options = {}) {
    const data = await loadMonthData(monthId);
    setMonthData(data, monthId);
    state.selectedDay = validDay(options.selectedDay) ? Number(options.selectedDay) : initialSelectedDay();
    state.expandedDay = null;
    state.night = {};
    state.sky = {};
    if (state.hasLocation) recalculateLocationData();
    renderAll();
  }

  function setMonthData(data, fallbackId) {
    const month = data.MONTH || data.month;
    if (!month || !Number.isFinite(Number(month.year)) || !Number.isFinite(Number(month.monthIndex))) {
      throw new Error(`Invalid month data: ${fallbackId}`);
    }
    state.month = {
      year: Number(month.year),
      monthIndex: Number(month.monthIndex),
      days: Number(month.days || daysInMonth(month.year, month.monthIndex)),
      firstDayOffset: Number.isFinite(Number(month.firstDayOffset))
        ? Number(month.firstDayOffset)
        : firstDayOffset(month.year, month.monthIndex)
    };
    state.monthId = data.id || fallbackId || monthIdFromParts(state.month.year, state.month.monthIndex);
    state.sources = data.sources || shared.sources || {};
    state.articles = data.articleData || shared.articleData || {};
    state.media = data.media || shared.media || {};
    state.moonData = data.moonData || {};
    state.exactMoon = data.exactMoon || {};
    state.highlights = data.monthIntel || [];
    state.events = data.eventData || {};
    state.targets = data.targetData || data.targets || {};
    root.dataset.month = state.monthId;
  }

  function loadMonthData(monthId) {
    const registry = window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};
    if (registry[monthId]) return Promise.resolve(registry[monthId]);
    const entry = manifest.find(item => item.id === monthId);
    if (!entry) return Promise.reject(new Error(`Month is not listed: ${monthId}`));
    if (state.monthPromises[monthId]) return state.monthPromises[monthId];
    state.monthPromises[monthId] = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = entry.path;
      script.async = true;
      script.onload = () => registry[monthId] ? resolve(registry[monthId]) : reject(new Error(`Month data did not register: ${monthId}`));
      script.onerror = () => reject(new Error(`Could not load month data: ${monthId}`));
      document.head.appendChild(script);
    });
    return state.monthPromises[monthId];
  }

  function renderAll() {
    renderMonthHeader();
    renderHighlights();
    renderSources();
    renderCalendar();
    renderDetail();
    renderRecommendations();
  }

  function renderMonthHeader() {
    root.querySelectorAll("[data-month-label]").forEach(item => { item.textContent = monthTitle(); });
    const highlightsLabel = root.querySelector("[data-month-highlights]");
    if (highlightsLabel) highlightsLabel.textContent = `${monthName()}'s Highlights`;
    const previous = adjacentMonth(-1);
    const next = adjacentMonth(1);
    setMonthButton(els.previousMonth, previous, "Previous");
    setMonthButton(els.nextMonth, next, "Next");
    updateTodayButton();
    els.grid.setAttribute("aria-label", `${monthTitle()} day selector`);
  }

  function setMonthButton(button, entry, direction) {
    if (!button) return;
    button.disabled = !entry;
    button.title = entry ? `Show ${entry.label}` : `${direction} month unavailable`;
    button.setAttribute("aria-label", button.title);
  }

  function renderHighlights() {
    els.intel.innerHTML = state.highlights.map(item => `
      <div class="amc-intel-card">
        <img src="${escapeHtml(item.image || state.media.milkyWay?.src || "")}" alt="${escapeHtml(item.alt || "")}" loading="lazy" decoding="async">
        <span class="amc-intel-copy">
          <b>${escapeHtml(item.title)}</b>
          <span>${escapeHtml(item.text)}</span>
        </span>
      </div>
    `).join("");
  }

  function renderSources() {
    const sourceList = { ...state.sources, wikimediaThumbs: wikimediaSource };
    els.sources.innerHTML = Object.values(sourceList).filter(Boolean).map(source => `
      <li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a><br>${escapeHtml(source.note || "")}</li>
    `).join("");
  }

  function renderCalendar() {
    const todayDay = currentCalendarDay();
    const html = [];
    for (let i = 0; i < state.month.firstDayOffset; i += 1) html.push(`<div class="amc-empty" aria-hidden="true"></div>`);
    for (let day = 1; day <= state.month.days; day += 1) {
      const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
      const weekday = weekdays[date.getUTCDay()];
      const weekdayShort = weekday.toUpperCase();
      const moon = moonForDay(day);
      const nightInfo = state.hasLocation ? state.night[day] || noDark() : locationNeeded();
      const events = dayEvents(day);
      const primary = primaryEvent(events);
      const expanded = day === state.expandedDay;
      const css = eventMeta(primary).css;
      const rowEnd = (state.month.firstDayOffset + day - 1) % 7 === 6;
      const isToday = day === todayDay;
      const isNewMoon = isNewMoonDay(day);
      html.push(`
        <button type="button" class="amc-day ${css}${rowEnd ? " is-row-end" : ""}${isToday ? " is-today" : ""}${isNewMoon ? " is-new-moon" : ""}" data-day="${day}" aria-expanded="${expanded}" aria-label="${isToday ? "Today, " : ""}${weekdayShort} ${day} ${monthTitle()}, ${moon.name}, ${moon.phase}% lit, astro night ${durationClock(nightInfo)}">
          <span class="amc-date">
            <strong>${day}</strong>
            <span class="amc-date-badges">
              <span class="amc-mobile-weekday">${weekdayShort}</span>
              ${isToday ? `<span class="amc-today-pill">Today</span>` : ""}
            </span>
          </span>
          <span class="amc-moon-line">
            <img class="amc-moon-img" src="${moonImage(day, 216)}" alt="" loading="lazy" decoding="async" width="52" height="52">
            <span class="amc-moon-copy"><b>${escapeHtml(moon.name)}</b><span>${moon.phase}% lit</span></span>
          </span>
          <span class="amc-dark-line">Astro night: ${durationClock(nightInfo)}</span>
          <span class="amc-tags">${tagsFor(events).map(tag => `<span class="amc-tag ${tag.css}">${tag.label}</span>`).join("")}</span>
          <span class="amc-expanded">${expanded ? expandedDay(day, weekday, moon, events, primary) : ""}</span>
        </button>
      `);
    }
    els.grid.innerHTML = html.join("");
    els.grid.querySelectorAll(".amc-day").forEach(button => {
      button.addEventListener("click", event => {
        if (event.target.closest(".amc-weather-segments i")) return;
        selectDay(Number(button.dataset.day));
      });
    });
  }

  function expandedDay(day, weekday, moon, events, primary) {
    const nightInfo = state.hasLocation ? state.night[day] || noDark() : locationNeeded();
    const skyInfo = state.hasLocation ? state.sky[day] : null;
    const title = primary.title
      ? `<span class="amc-expanded-title ${eventMeta(primary).css}">${escapeHtml(primary.title)}</span>`
      : `<span class="amc-expanded-title is-empty" aria-hidden="true"></span>`;
    return `
      <span class="amc-expanded-top">
        <span class="amc-expanded-identity">
          <img src="${moonImage(day, 216)}" alt="" loading="lazy" decoding="async" width="42" height="42">
          <span>
            <strong>${isTodayDay(day) ? "Today, " : ""}${weekday} ${day} ${monthName()} ${state.month.year}</strong>
            <span class="amc-expanded-stat">${escapeHtml(moon.name)}, ${moon.phase}% illuminated</span>
            <span class="amc-expanded-night">Astro night: ${durationClock(nightInfo)}</span>
          </span>
          <span class="amc-minimise" aria-hidden="true">-</span>
        </span>
        ${title}
      </span>
      <span class="amc-mini-grid">
        ${zodiacCard(day)}
        ${miniItem("altitude", "Altitude", skyInfo?.moonAltLabel || "Use location")}
        ${miniItem("azimuth", "Azimuth", skyInfo?.moonAzLabel || "Use location")}
        ${miniItem("moonrise", "Moonrise", skyInfo?.moonriseLabel || "Use location")}
        ${miniItem("moonset", "Moonset", skyInfo?.moonsetLabel || "Use location")}
        ${miniItem("sunrise", "Sunrise", skyInfo?.sunriseLabel || "Use location")}
        ${miniItem("sunset", "Sunset", skyInfo?.sunsetLabel || "Use location")}
      </span>
      <span class="amc-cell-mobile-extra">
        ${moonChart(skyInfo, nightInfo, true)}
        ${cellWeatherPanel()}
      </span>
    `;
  }

  function miniItem(icon, label, value) {
    return `<span class="amc-mini">${iconSvg(icon)}<span><small>${label}</small><b>${escapeHtml(value)}</b></span></span>`;
  }

  function zodiacCard(day) {
    const info = moonZodiacInfo(day);
    return `<span class="amc-zodiac-card"><em>${info.glyph}</em><span><small>Moon zodiac</small><b>${info.label}</b></span></span>`;
  }

  function renderDetail() {
    const day = state.selectedDay;
    const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
    const weekday = weekdays[date.getUTCDay()];
    const events = dayEvents(day);
    const primary = primaryEvent(events);
    const nightInfo = state.hasLocation ? state.night[day] || noDark() : locationNeeded();
    const skyInfo = state.hasLocation ? state.sky[day] : null;
    els.detail.innerHTML = `
      <div class="amc-detail-body">
        <div class="amc-detail-head">
          <span class="amc-detail-date">${weekday} ${day} ${monthTitle()}</span>
          <span class="amc-detail-location">${locationPill(locationDisplay())}</span>
        </div>
        ${primary.title ? `<h2 class="amc-detail-title ${eventMeta(primary).css}">${escapeHtml(primary.title)}</h2>` : `<h2 class="amc-detail-title"></h2>`}
        ${events.length ? `<ul class="amc-event-list">${events.map(eventItem).join("")}</ul>` : ""}
        ${moonChart(skyInfo, nightInfo, false)}
        ${weatherPanel()}
      </div>
    `;
  }

  function eventItem(item) {
    const meta = eventMeta(item);
    return `<li class="amc-event ${meta.css}">
      <small>${escapeHtml(meta.label)}</small>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.copy || "")}</p>
    </li>`;
  }

  function renderRecommendations() {
    const day = state.selectedDay;
    const moon = moonForDay(day);
    const events = dayEvents(day);
    const targets = targetSuggestions(day, events, moon);
    const articles = recommendedArticles(events, moon);
    els.recommendations.innerHTML = `
      <div class="amc-recommendation-group">
        <h3>Tonight point your camera to:</h3>
        <ol class="amc-target-list">${targets.map(targetCard).join("")}</ol>
      </div>
      <div class="amc-recommendation-group">
        <h3>Related Articles</h3>
        <div class="amc-related-grid">${articles.map(articlePromo).join("")}</div>
      </div>
    `;
  }

  function targetSuggestions(day, events, moon) {
    const seeded = state.targets[day] || [];
    let names = [...seeded];
    if (!names.length) {
      const eventTypes = new Set(events.map(item => item.type));
      if (moon.phase <= 15 || eventTypes.has("meteor")) names = ["Milky Way fields", "Lagoon Nebula (M8)", "Trifid Nebula (M20)"];
      else if (moon.phase >= 70) names = ["Moon", "Saturn", "Bright clusters"];
      else names = ["Moon", "Bright clusters", "Milky Way fields"];
    }
    return names.slice(0, 3).map(name => targetDetails(name, day, moon));
  }

  function targetDetails(name, day, moon) {
    const meta = targetMeta(name);
    const observing = targetObserving(meta, day);
    return {
      name,
      type: meta?.type || "Astrophotography target",
      image: targetThumbnail(name, day),
      best: observing.best,
      altitude: observing.altitude,
      moon: `${moon.phase}% lit`,
      size: meta?.size || "varies"
    };
  }

  function targetCard(target) {
    return `<li class="amc-target-card">
      <span class="amc-target-media">
        <img src="${escapeHtml(target.image.src)}" alt="${escapeHtml(target.image.alt)}" loading="lazy" decoding="async" width="92" height="92">
        <span class="amc-target-keyfacts">
          <span><em>Max altitude</em><strong>${escapeHtml(target.altitude)}</strong></span>
          <span><em>Moon brightness</em><strong>${escapeHtml(target.moon)}</strong></span>
          <span><em>Apparent size</em><strong>${escapeHtml(target.size)}</strong></span>
        </span>
      </span>
      <span class="amc-target-copy">
        <span class="amc-target-type">${escapeHtml(target.type)}</span>
        <span class="amc-target-name">${escapeHtml(target.name)}</span>
        <span class="amc-target-facts">
          <span><em>Highest point</em><strong>${escapeHtml(target.best)}</strong></span>
        </span>
      </span>
    </li>`;
  }

  function recommendedArticles(events, moon) {
    const typeSet = new Set(events.map(item => item.type));
    const primary = typeSet.has("launch") ? state.articles.launch
      : typeSet.has("meteor") || moon.phase < 18 ? state.articles.deepSky
      : typeSet.has("moon") ? state.articles.moon
      : typeSet.has("telescope") ? state.articles.telescope
      : state.articles.numbers || state.articles.deepSky;
    const missionArticle = typeSet.has("launch") ? state.articles.artemis
      : typeSet.has("telescope") || typeSet.has("sky") ? state.articles.jamesWebb
      : null;
    const secondary = missionArticle
      || (primary === state.articles.deepSky ? state.articles.lightPollution || state.articles.sqmReview
        : primary === state.articles.launch ? state.articles.artemis || state.articles.planetary
        : primary === state.articles.moon ? state.articles.deepSky
        : state.articles.accessories || state.articles.numbers);
    return uniqueArticles([primary, secondary, state.articles.jamesWebb, state.articles.artemis, state.articles.deepSky, state.articles.numbers]).slice(0, 2);
  }

  function articlePromo(article) {
    if (!article) return "";
    return `<a class="amc-article-promo" href="${escapeHtml(article.url)}" target="_blank" rel="noopener">
      <img src="${escapeHtml(article.image || state.media.milkyWay?.src || "")}" alt="" loading="lazy" decoding="async" width="96" height="72">
      <span class="amc-article-copy"><small>${escapeHtml(article.kind || "Article")}</small><b>${escapeHtml(article.title)}</b></span>
    </a>`;
  }

  function moonChart(skyInfo, nightInfo, compact) {
    if (!state.hasLocation) {
      return `<section class="amc-chart"><h3>Moon Altitude & Darkness</h3><span class="amc-weather-note">Use Current Location or enter a city to calculate the night chart.</span></section>`;
    }
    if (!skyInfo?.timeline) {
      return `<section class="amc-chart"><h3>Moon Altitude & Darkness</h3><span class="amc-weather-note">Chart unavailable for this location.</span></section>`;
    }
    return `<section class="amc-chart">
      <h3>Moon Altitude & Darkness</h3>
      ${moonAltitudeSvg(skyInfo.timeline, compact)}
      ${chartNightLabels(nightInfo)}
    </section>`;
  }

  function chartNightLabels(nightInfo) {
    if (!nightInfo || nightInfo.minutes === null) {
      return `<span class="amc-alt-labels"><span><b>Astronomical Night:</b> Use location</span></span>`;
    }
    if (!nightInfo.minutes) {
      if (nightInfo.nautical?.minutes) {
        return `<span class="amc-alt-labels">
          <span><b>Astronomical Night:</b> No astronomical darkness.</span>
          <span>Best nautical window: ${escapeHtml(nightInfo.nautical.window)} | Duration ${durationClock(nightInfo.nautical)}</span>
        </span>`;
      }
      return `<span class="amc-alt-labels"><span><b>Astronomical Night:</b> No astronomical darkness.</span><span>Nautical window unavailable.</span></span>`;
    }
    const times = nightTimes(nightInfo);
    return `<span class="amc-alt-labels">
      <span><b>Astronomical Night:</b> from ${times.start} to ${times.end} | Duration ${durationClock(nightInfo)}</span>
    </span>`;
  }

  function moonAltitudeSvg(timeline, compact) {
    const maxAltitude = 60;
    const chart = { x: compact ? 34 : 39, y: compact ? 16 : 22, width: compact ? 282 : 306, height: compact ? 78 : 164 };
    const viewWidth = compact ? 332 : 360;
    const viewHeight = compact ? 136 : 244;
    const hours = Array.from({ length: 13 }, (_, i) => (18 + i) % 24);
    const yTicks = compact ? [0, 30, 60] : [0, 20, 40, 60];
    const bands = timeline.bands.map(band => {
      const x = chart.x + (band.startHour / 12) * chart.width;
      const width = ((band.endHour - band.startHour) / 12) * chart.width;
      return `<rect x="${x}" y="${chart.y}" width="${Math.max(.5, width)}" height="${chart.height}" fill="${darknessColour(band.state)}"/>`;
    }).join("");
    const bandLabels = timeline.bands.map(band => {
      const width = ((band.endHour - band.startHour) / 12) * chart.width;
      const label = darknessBandLabel(band.state, width, compact);
      const minWidth = band.state === "nautical" ? (compact ? 18 : 22) : (compact ? 50 : 64);
      if (!label || width < minWidth) return "";
      const x = chart.x + ((band.startHour + band.endHour) / 24) * chart.width;
      const y = band.state === "dark" ? chart.y + 14 : band.state === "nautical" ? chart.y + (compact ? 13 : 16) : chart.y + chart.height - (compact ? 8 : 10);
      const fill = band.state === "dark" ? "#fff" : "currentColor";
      const fontSize = band.state === "nautical" && width < (compact ? 38 : 46) ? (compact ? 6.8 : 7.4) : (compact ? 7.2 : 8.6);
      return `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fontSize}" font-weight="760">${label}</text>`;
    }).join("");
    const hourTicks = hours.map((hour, index) => {
      const x = chart.x + (index / 12) * chart.width;
      return `<g><line x1="${x}" x2="${x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.12)"/><text x="${x}" y="${chart.y + chart.height + (compact ? 16 : 18)}" text-anchor="middle" fill="currentColor" font-size="${compact ? 8.1 : 9.1}" font-weight="720">${String(hour).padStart(2, "0")}</text></g>`;
    }).join("");
    const altitudeTicks = yTicks.map(tick => {
      const y = chart.y + chart.height - (tick / maxAltitude) * chart.height;
      return `<g><line x1="${chart.x}" x2="${chart.x + chart.width}" y1="${y}" y2="${y}" stroke="rgba(22,25,29,.16)"/><text x="${chart.x - 8}" y="${y + 3}" text-anchor="end" fill="currentColor" font-size="${compact ? 8.1 : 9.1}" font-weight="720">${tick}°</text></g>`;
    }).join("");
    const paths = timeline.moonSegments
      .map(segment => smoothPath(segment.map(point => chartPoint(point, chart, maxAltitude))))
      .filter(Boolean)
      .map(path => `<path d="${path}" fill="none" stroke="#d08a13" stroke-width="${compact ? 3 : 3.2}" stroke-linecap="round"/>`)
      .join("");
    const markers = timeline.markers.map(marker => {
      const point = chartPoint({ hour: marker.hour, altitude: 0 }, chart, maxAltitude);
      return `<g><circle cx="${point.x}" cy="${point.y}" r="${compact ? 3.2 : 4}" fill="#d08a13"/><text x="${point.x}" y="${point.y - 19}" text-anchor="middle" fill="#8b5f12" font-size="${compact ? 8 : 8.8}" font-weight="760">${marker.label}</text><text x="${point.x}" y="${point.y - 7}" text-anchor="middle" fill="currentColor" font-size="${compact ? 7.4 : 8.2}" font-weight="720">${marker.time}</text></g>`;
    }).join("");
    const twilightMarkers = timeline.twilightMarkers.map(marker => {
      const x = chart.x + (marker.hour / 12) * chart.width;
      const y = marker.type === "end" ? chart.y + 12 : chart.y + chart.height - 24;
      return `<g><line x1="${x}" x2="${x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(5,8,18,.46)" stroke-dasharray="3 3"/><text x="${x}" y="${y}" text-anchor="middle" fill="currentColor" font-size="${compact ? 7.2 : 8.2}" font-weight="760">${marker.label}</text></g>`;
    }).join("");
    return `<svg class="amc-alt-svg" viewBox="0 0 ${viewWidth} ${viewHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Moon altitude from 18:00 to 06:00, scaled from 0 to 60 degrees">
      <g style="color: var(--text)">
        ${bands}${hourTicks}${altitudeTicks}${bandLabels}
        <line x1="${chart.x}" x2="${chart.x + chart.width}" y1="${chart.y + chart.height}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.42)" stroke-width="1.2"/>
        <line x1="${chart.x}" x2="${chart.x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.36)" stroke-width="1.2"/>
        <text x="${chart.x + chart.width / 2}" y="${chart.y + chart.height + (compact ? 30 : 33)}" text-anchor="middle" fill="currentColor" font-size="${compact ? 7.6 : 8.8}" font-weight="820">TIME</text>
        ${twilightMarkers}${paths}${markers}
      </g>
    </svg>`;
  }

  function weatherPanel() {
    if (!state.hasLocation) return `<section class="amc-weather"><h3>7-Night Forecast</h3><span class="amc-weather-note">Use Current Location to show night-time cloud cover and transparency.</span></section>`;
    if (state.weatherState === "loading") return `<section class="amc-weather"><h3>7-Night Forecast</h3><span class="amc-weather-note">Loading local observing conditions.</span></section>`;
    if (state.weatherState === "error" || !state.weather.length) return `<section class="amc-weather"><h3>7-Night Forecast</h3><span class="amc-weather-note">Weather forecast unavailable for this location.</span></section>`;
    return `<section class="amc-weather">
      <span class="amc-weather-title"><h3>7-Night Forecast</h3>${weatherUpdatedLine()}</span>
      <div class="amc-weather-grid">${state.weather.map(day => weatherCard(day)).join("")}</div>
    </section>`;
  }

  function cellWeatherPanel() {
    if (!state.hasLocation || !state.weather.length) return "";
    return `<span class="amc-weather"><span class="amc-weather-title"><b>7-Night Forecast</b>${weatherUpdatedLine()}</span><span class="amc-cell-weather-list">${state.weather.map(day => weatherCard(day, true)).join("")}</span></span>`;
  }

  function weatherCard(day, compact = false) {
    const cardClass = compact ? "amc-cell-weather-row" : "amc-weather-card";
    return `<span class="${cardClass}">
      <span class="amc-weather-card-head">
        <span class="amc-weather-card-date"><b>${escapeHtml(day.label)}</b><span>${escapeHtml(day.summary)}</span></span>
        <span class="amc-weather-icons">${day.icons.map(weatherIcon).join("")}</span>
      </span>
      <span class="amc-weather-metrics">
        ${weatherMetric("Cloud", `${Math.round(day.cloud)}%`, day.segments.map(segment => weatherSegment(segment, "cloud")))}
        ${weatherMetric("Temp", `${Math.round(day.temperature)}°C`, day.segments.map(segment => weatherSegment(segment, "temperature")))}
        ${weatherMetric("Trans.", day.transparencyLabel, day.segments.map(segment => weatherSegment(segment, "transparency")))}
        ${weatherMetric("Seeing", day.seeingLabel, day.segments.map(segment => weatherSegment(segment, "seeing")))}
        ${weatherMetric("Wind", `${Math.round(day.wind)} km/h`, day.segments.map(segment => weatherSegment(segment, "wind")))}
      </span>
    </span>`;
  }

  function weatherMetric(label, value, segments) {
    return `<span class="amc-weather-row"><b>${label} ${escapeHtml(value)}</b><span class="amc-weather-segments">${segments.join("")}</span></span>`;
  }

  function weatherSegment(segment, metric) {
    return `<i tabindex="0" style="background:${segmentColour(segment, metric)}" data-tooltip="${escapeHtml(segmentTooltip(segment, metric))}"></i>`;
  }

  function weatherUpdatedLine() {
    if (!state.weatherUpdatedAt) return "";
    return `<span class="amc-weather-updated">Last updated ${formatWeatherUpdatedAge(state.weatherUpdatedAt)}</span>`;
  }

  async function useBrowserLocation() {
    if (!navigator.geolocation) {
      showLocationMessage("Location unavailable", "Current location is not available in this browser. Search for a city instead.", true);
      return;
    }
    if (!window.isSecureContext && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      showLocationMessage("HTTPS required", "Current location only works on HTTPS. Search for a city until the page is published on HTTPS.", true);
      return;
    }
    if (geolocationBlockedByPolicy()) {
      showLocationMessage("Location blocked by embed", "The Squarespace iframe must include allow=\"geolocation\". Search for a city below until the embed is updated.", true);
      return;
    }
    els.useLocation.disabled = true;
    els.useLocation.textContent = "Locating";
    showLocationMessage("Finding location", "Your browser may ask for location permission.", false);
    navigator.geolocation.getCurrentPosition(
      position => {
        applyCoordinates(position.coords.latitude, position.coords.longitude);
        els.useLocation.disabled = false;
        els.useLocation.textContent = "Using Current Location";
      },
      error => {
        els.useLocation.disabled = false;
        els.useLocation.textContent = useLocationText;
        if (error?.code === error.PERMISSION_DENIED) {
          showLocationMessage("Location permission denied", isEmbeddedFrame()
            ? "Location is being blocked by the embed. Add allow=\"geolocation\" to the iframe, then reload."
            : "Location is blocked for this site. Open site settings, set Location to Allow, reload, then try again.", true);
        } else {
          showLocationMessage("Current location unavailable", "Your device could not provide a location. Search for a city below.", true);
        }
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 3600000 }
    );
  }

  async function useManualLocation(event) {
    event.preventDefault();
    const query = els.manualInput.value.trim();
    if (!query) return;
    const submit = els.manualForm.querySelector("button");
    submit.disabled = true;
    submit.textContent = "Setting";
    showLocationMessage("Finding location", "Searching location database.", false);
    try {
      const parsed = parseCoordinateQuery(query);
      if (parsed) {
        applyCoordinates(parsed.lat, parsed.lon, { name: parsed.name });
      } else {
        const results = await geocodeLocationQuery(query);
        if (results.length > 1) {
          state.locationMatches = results;
          renderLocationResults(results);
          showLocationMessage("Choose your location", "Select the closest matching place.", false);
          return;
        }
        const result = results[0];
        applyCoordinates(result.lat, result.lon, { name: result.name, timeZone: result.timeZone, skipReverseGeocode: true });
      }
      els.manualInput.value = "";
      hideLocationResults();
    } catch {
      showLocationMessage("Location not found", "Try a nearby city or latitude/longitude.", true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Set";
    }
  }

  function applyCoordinates(lat, lon, options = {}) {
    const safeLat = Number(lat);
    const safeLon = Number(lon);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon)) return;
    state.hasLocation = true;
    state.lat = safeLat;
    state.lon = safeLon;
    state.locationName = options.name || state.locationName || `${safeLat.toFixed(2)}, ${safeLon.toFixed(2)}`;
    state.timeZone = cleanTimeZone(options.timeZone) || state.timeZone || browserTimeZone();
    root.classList.add("has-location");
    updateLocationLabel();
    showLocationMessage(state.locationName, "Local timing and forecast are using your saved location.", false);
    saveLocation();
    recalculateLocationData();
    renderAll();
    updateWeather();
    if (!options.skipReverseGeocode) reverseGeocode(safeLat, safeLon).then(result => {
      if (!result) return;
      state.locationName = result.name || state.locationName;
      state.timeZone = result.timeZone || state.timeZone;
      saveLocation();
      recalculateLocationData();
      updateLocationLabel();
      renderAll();
    }).catch(() => {});
  }

  function recalculateLocationData() {
    if (!state.hasLocation || !state.month) return;
    const night = {};
    const sky = {};
    for (let day = 1; day <= state.month.days; day += 1) {
      night[day] = calculateAstroNight(day);
      sky[day] = calculateDailySky(day);
    }
    state.night = night;
    state.sky = sky;
  }

  async function updateWeather(force = false) {
    if (!state.hasLocation) return;
    const now = Date.now();
    if (!force && state.weatherUpdatedAt && now - state.weatherUpdatedAt.getTime() < weatherRefreshMs) return;
    const requestId = ++state.weatherRequestId;
    state.weatherState = "loading";
    renderDetail();
    try {
      const params = new URLSearchParams({
        latitude: state.lat.toFixed(5),
        longitude: state.lon.toFixed(5),
        hourly: "cloud_cover,temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code",
        forecast_days: "8",
        timezone: "auto"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Weather request failed");
      const payload = await response.json();
      if (requestId !== state.weatherRequestId) return;
      state.timeZone = cleanTimeZone(payload.timezone) || state.timeZone;
      state.weather = summariseWeather(payload.hourly || {});
      state.weatherState = "ready";
      state.weatherUpdatedAt = new Date();
      saveLocation();
      renderAll();
      scheduleWeatherRefresh();
    } catch {
      if (requestId !== state.weatherRequestId) return;
      state.weatherState = "error";
      renderAll();
    }
  }

  function summariseWeather(hourly) {
    const rows = (hourly.time || []).map((time, index) => ({
      time,
      date: time.slice(0, 10),
      hour: Number(time.slice(11, 13)),
      cloud: numberAt(hourly.cloud_cover, index),
      temperature: numberAt(hourly.temperature_2m, index),
      humidity: numberAt(hourly.relative_humidity_2m, index),
      precipitation: numberAt(hourly.precipitation_probability, index),
      wind: numberAt(hourly.wind_speed_10m, index),
      code: numberAt(hourly.weather_code, index)
    }));
    const byKey = new Map(rows.map(row => [row.time, row]));
    const dates = [...new Set(rows.map(row => row.date))].slice(0, 7);
    return dates.map((dateKey, index) => {
      const nextDate = addIsoDate(dateKey, 1);
      const slots = [
        slotAverage(byKey, dateKey, [16, 17, 18, 19], quarterLabels[0]),
        slotAverage(byKey, dateKey, [20, 21, 22, 23], quarterLabels[1]),
        slotAverage(byKey, nextDate, [0, 1, 2, 3], quarterLabels[2]),
        slotAverage(byKey, nextDate, [4, 5, 6, 7], quarterLabels[3])
      ];
      const cloud = avg(slots.map(slot => slot.cloud));
      const temperature = avg(slots.map(slot => slot.temperature));
      const wind = avg(slots.map(slot => slot.wind));
      const transparency = avg(slots.map(slot => slot.transparency));
      const seeing = avg(slots.map(slot => slot.seeing));
      const kind = weatherKind(avg(slots.map(slot => slot.code)), cloud);
      return {
        dateKey,
        label: shortWeatherDate(dateKey, index),
        summary: `${Math.round(cloud)}% cloud | ${transparencyLabel(transparency)} transparency`,
        cloud,
        temperature,
        wind,
        transparencyLabel: transparencyLabel(transparency),
        seeingLabel: seeingLabel(seeing),
        icons: weatherIconKinds(slots, kind),
        segments: slots
      };
    });
  }

  function slotAverage(byKey, dateKey, hours, label) {
    const samples = hours.map(hour => byKey.get(`${dateKey}T${String(hour).padStart(2, "0")}:00`)).filter(Boolean);
    const cloud = avg(samples.map(sample => sample.cloud));
    const temperature = avg(samples.map(sample => sample.temperature));
    const humidity = avg(samples.map(sample => sample.humidity));
    const precipitation = avg(samples.map(sample => sample.precipitation));
    const wind = avg(samples.map(sample => sample.wind));
    const code = avg(samples.map(sample => sample.code));
    const transparency = clamp(100 - cloud * .58 - humidity * .22 - precipitation * .2, 0, 100);
    const seeing = clamp(100 - wind * 2.4 - Math.abs(temperature - avg(samples.map(sample => sample.temperature))) * 3 - cloud * .12, 0, 100);
    return { label, cloud, temperature, humidity, precipitation, wind, code, transparency, seeing, kind: weatherKind(code, cloud) };
  }

  function calculateDailySky(day) {
    const Astronomy = window.Astronomy;
    if (!Astronomy) return unavailableSky();
    try {
      const observer = new Astronomy.Observer(state.lat, state.lon, 0);
      const sample = zonedDate(state.month.year, state.month.monthIndex, day, 0, 0, 0);
      const start = zonedDate(state.month.year, state.month.monthIndex, day, 0, 0, 0);
      const moonHorizon = horizon(Astronomy.Body.Moon, sample, observer);
      const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, start, 1);
      const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, start, 1);
      const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, start, 1);
      const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, start, 1);
      return {
        moonAltLabel: `${Math.round(moonHorizon.altitude)}°`,
        moonAzLabel: `${Math.round(moonHorizon.azimuth)}°`,
        moonriseLabel: formatAstroTime(moonrise),
        moonsetLabel: formatAstroTime(moonset),
        sunriseLabel: formatAstroTime(sunrise),
        sunsetLabel: formatAstroTime(sunset),
        timeline: buildNightTimeline(day, observer)
      };
    } catch {
      return unavailableSky();
    }
  }

  function calculateAstroNight(day) {
    const Astronomy = window.Astronomy;
    if (!Astronomy) return unavailableNight();
    try {
      const observer = new Astronomy.Observer(state.lat, state.lon, 0);
      const noon = zonedDate(state.month.year, state.month.monthIndex, day, 12, 0, 0);
      const nautical = twilightWindow(day, observer, -12);
      const dusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, -18);
      if (!dusk?.date) return noDark(nautical);
      const dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, dusk.date, 1.5, -18);
      if (!dawn?.date || dawn.date <= dusk.date) return noDark(nautical);
      const minutes = Math.round((dawn.date.getTime() - dusk.date.getTime()) / 60000);
      return { minutes, label: formatDuration(minutes), window: `${formatLocal(dusk.date)} to ${formatLocal(dawn.date)}`, nautical };
    } catch {
      return unavailableNight();
    }
  }

  function buildNightTimeline(day, observer) {
    const Astronomy = window.Astronomy;
    const start = zonedDate(state.month.year, state.month.monthIndex, day, 18, 0, 0);
    const end = zonedDate(state.month.year, state.month.monthIndex, day + 1, 6, 0, 0);
    const durationMs = Math.max(1, end.getTime() - start.getTime());
    const moonSamples = [];
    const darknessStates = [];
    for (let step = 0; step < 48; step += 1) {
      const sample = new Date(start.getTime() + (step / 48) * durationMs);
      moonSamples.push({ hour: chartHour(sample, start, end), altitude: bodyAltitude(Astronomy.Body.Moon, sample, observer) });
      darknessStates.push(darknessState(bodyAltitude(Astronomy.Body.Sun, sample, observer)));
    }
    moonSamples.push({ hour: 12, altitude: bodyAltitude(Astronomy.Body.Moon, end, observer) });
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, start, .55);
    const set = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, start, .55);
    return {
      bands: compressBands(darknessStates),
      moonSegments: moonVisibleSegments(moonSamples),
      markers: [chartMarker(rise, start, end, "Rise"), chartMarker(set, start, end, "Set")].filter(Boolean),
      twilightMarkers: astronomicalMarkers(day, observer, start, end)
    };
  }

  function twilightWindow(day, observer, altitude) {
    const Astronomy = window.Astronomy;
    const noon = zonedDate(state.month.year, state.month.monthIndex, day, 12, 0, 0);
    const dusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, altitude);
    if (!dusk?.date) return null;
    const dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, dusk.date, 1.5, altitude);
    if (!dawn?.date || dawn.date <= dusk.date) return null;
    const minutes = Math.round((dawn.date.getTime() - dusk.date.getTime()) / 60000);
    return { minutes, window: `${formatTime(dusk.date)}-${formatTime(dawn.date)}`, range: `${formatLocal(dusk.date)} to ${formatLocal(dawn.date)}` };
  }

  function astronomicalMarkers(day, observer, start, end) {
    const Astronomy = window.Astronomy;
    const noon = zonedDate(state.month.year, state.month.monthIndex, day, 12, 0, 0);
    const astroStart = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, -12);
    const darkStart = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, -18);
    const astroEnd = astroStart ? Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, astroStart.date, 1.5, -12) : null;
    const endPoint = darkStart?.date ? darkStart : astroEnd;
    return [chartTwilightMarker(astroStart, start, end, "Astro begins", "start"), chartTwilightMarker(endPoint, start, end, "Astro ends", "end")].filter(Boolean);
  }

  function bodyAltitude(body, sample, observer) {
    return horizon(body, sample, observer).altitude;
  }

  function horizon(body, sample, observer) {
    const Astronomy = window.Astronomy;
    const equator = Astronomy.Equator(body, sample, observer, true, true);
    return Astronomy.Horizon(sample, observer, equator.ra, equator.dec, "normal");
  }

  function selectDay(day) {
    const wasExpanded = state.expandedDay === day;
    state.selectedDay = day;
    state.expandedDay = wasExpanded ? null : day;
    renderAll();
    if (!wasExpanded && root.getBoundingClientRect().width <= 760) {
      requestAnimationFrame(() => els.grid.querySelector(`.amc-day[data-day="${day}"]`)?.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" }));
    }
  }

  function goToAdjacentMonth(direction) {
    const entry = adjacentMonth(direction);
    if (entry) showMonth(entry.id);
  }

  function goToToday() {
    const today = new Date();
    const todayId = monthIdFromParts(today.getFullYear(), today.getMonth());
    if (!manifest.some(item => item.id === todayId)) return;
    if (state.monthId === todayId) {
      state.selectedDay = today.getDate();
      state.expandedDay = null;
      renderAll();
      return;
    }
    showMonth(todayId, { selectedDay: today.getDate() });
  }

  function updateTodayButton() {
    if (!els.today || !state.month) return;
    const today = new Date();
    const todayId = monthIdFromParts(today.getFullYear(), today.getMonth());
    const loaded = manifest.some(item => item.id === todayId);
    const selected = state.monthId === todayId && state.selectedDay === today.getDate();
    els.today.disabled = !loaded || selected;
    els.today.title = loaded ? `Show today, ${today.getDate()} ${monthLong[today.getMonth()]} ${today.getFullYear()}` : "Today's month is not loaded";
  }

  function applySavedLocation() {
    const saved = readSavedLocation();
    if (!saved) return;
    applyCoordinates(saved.lat, saved.lon, { name: saved.name, timeZone: saved.timeZone, skipReverseGeocode: true });
    els.useLocation.textContent = useLocationText;
  }

  function readSavedLocation() {
    try {
      const data = JSON.parse(safeStorageGet(locationKey) || "null");
      const lat = Number(data?.lat);
      const lon = Number(data?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
      return { lat, lon, name: cleanName(data.name), timeZone: cleanTimeZone(data.timeZone) };
    } catch {
      return null;
    }
  }

  function saveLocation() {
    if (!state.hasLocation) return;
    safeStorageSet(locationKey, JSON.stringify({
      lat: Number(state.lat.toFixed(5)),
      lon: Number(state.lon.toFixed(5)),
      name: cleanName(state.locationName),
      timeZone: cleanTimeZone(state.timeZone),
      savedAt: new Date().toISOString()
    }));
  }

  function renderLocationResults(results) {
    els.locationResults.innerHTML = results.map((result, index) => `
      <button class="amc-location-option" type="button" role="option" data-location-index="${index}">
        <b>${escapeHtml(result.name)}</b><span>${escapeHtml(result.detail)}</span>
      </button>
    `).join("");
    els.locationResults.hidden = false;
    els.manualInput.setAttribute("aria-expanded", "true");
  }

  function handleManualLocationInput() {
    const query = els.manualInput.value.trim();
    if (state.locationSearchTimer) window.clearTimeout(state.locationSearchTimer);
    if (query.length < 2 || parseCoordinateQuery(query)) {
      hideLocationResults();
      return;
    }
    state.locationSearchTimer = window.setTimeout(() => previewLocationQuery(query), 260);
  }

  async function previewLocationQuery(query) {
    const requestId = ++state.locationSearchId;
    try {
      const results = await geocodeLocationQuery(query);
      if (requestId !== state.locationSearchId || els.manualInput.value.trim() !== query) return;
      state.locationMatches = results;
      renderLocationResults(results);
    } catch {
      if (requestId === state.locationSearchId) hideLocationResults();
    }
  }

  function handleLocationResultClick(event) {
    const option = event.target.closest(".amc-location-option");
    if (!option) return;
    const result = state.locationMatches[Number(option.dataset.locationIndex)];
    if (!result) return;
    applyCoordinates(result.lat, result.lon, { name: result.name, timeZone: result.timeZone, skipReverseGeocode: true });
    els.manualInput.value = "";
    hideLocationResults();
  }

  function hideLocationResultsOnOutsideClick(event) {
    if (!els.locationResults || els.locationResults.hidden) return;
    if (els.manualForm.contains(event.target)) return;
    hideLocationResults();
  }

  function hideLocationResults() {
    if (state.locationSearchTimer) window.clearTimeout(state.locationSearchTimer);
    state.locationSearchTimer = null;
    state.locationMatches = [];
    if (!els.locationResults) return;
    els.locationResults.hidden = true;
    els.locationResults.innerHTML = "";
    els.manualInput.setAttribute("aria-expanded", "false");
  }

  async function geocodeLocationQuery(query) {
    const params = new URLSearchParams({ name: query, count: "10", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Geocoding failed");
    const payload = await response.json();
    const results = Array.isArray(payload.results) ? payload.results.map(normaliseLocationResult).filter(Boolean) : [];
    if (!results.length) throw new Error("Location not found");
    return results;
  }

  async function reverseGeocode(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat.toFixed(5),
      longitude: lon.toFixed(5),
      localityLanguage: "en"
    });
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json();
    const place = cleanName(payload.city || payload.locality || payload.principalSubdivision);
    const region = cleanName(payload.principalSubdivision);
    const country = cleanName(payload.countryName);
    const parts = [place, region, country].filter(Boolean);
    const deduped = parts.filter((part, index) => parts.indexOf(part) === index);
    return {
      name: deduped.slice(0, 2).join(", ") || "Current location",
      timeZone: cleanTimeZone(payload.timeZone)
    };
  }

  function normaliseLocationResult(result) {
    if (!result) return null;
    const lat = Number(result.latitude);
    const lon = Number(result.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const parts = [result.name, result.admin2, result.admin1, result.country].map(cleanName).filter(Boolean);
    const deduped = parts.filter((part, index) => parts.indexOf(part) === index);
    return {
      lat,
      lon,
      name: deduped.slice(0, 2).join(", ") || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      detail: [cleanTimeZone(result.timezone), `${lat.toFixed(3)}, ${lon.toFixed(3)}`].filter(Boolean).join(" | "),
      timeZone: cleanTimeZone(result.timezone)
    };
  }

  function parseCoordinateQuery(query) {
    const match = query.replace(/[()]/g, "").trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon, name: `Manual location ${lat.toFixed(2)}, ${lon.toFixed(2)}` };
  }

  function showLocationMessage(label, prompt, warning) {
    els.locationLabel.textContent = label;
    els.locationPrompt.textContent = prompt;
    els.locationPrompt.classList.toggle("is-warning", Boolean(warning));
  }

  function updateLocationLabel() {
    els.locationLabel.innerHTML = locationPill(locationDisplay());
  }

  function locationPill(text) {
    return `${iconSvg("pin")}<span>${escapeHtml(text)}</span>`;
  }

  function locationDisplay() {
    return state.hasLocation ? state.locationName || `${state.lat.toFixed(2)}, ${state.lon.toFixed(2)}` : "Location not set";
  }

  function refreshWeatherWhenVisible() {
    if (document.hidden || !state.hasLocation) return;
    updateWeather();
  }

  function scheduleWeatherRefresh() {
    if (state.weatherTimer) window.clearTimeout(state.weatherTimer);
    state.weatherTimer = window.setTimeout(() => updateWeather(true), weatherRefreshMs);
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    els.themeToggle.innerHTML = iconSvg(dark ? "themeSun" : "themeMoon");
    els.themeToggle.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
    els.themeToggle.setAttribute("aria-pressed", String(dark));
    els.themeToggle.title = dark ? "Light mode" : "Night mode";
    safeStorageSet(themeKey, theme);
  }

  function downloadPdf() {
    const previousTitle = document.title;
    document.title = `After Dark Calendar by Astromaniac_${monthName()} ${state.month.year}`;
    root.classList.add("is-pdf-export");
    window.setTimeout(() => {
      window.print();
      root.classList.remove("is-pdf-export");
      document.title = previousTitle;
    }, 120);
  }

  function handleWeatherTipIn(event) {
    const segment = event.target.closest?.(".amc-weather-segments i");
    if (segment) showWeatherTooltip(segment);
  }

  function handleWeatherTipOut(event) {
    if (event.target.closest?.(".amc-weather-segments i")) hideWeatherTooltip();
  }

  function handleWeatherTipClick(event) {
    const segment = event.target.closest?.(".amc-weather-segments i");
    if (!segment) return;
    event.stopPropagation();
    showWeatherTooltip(segment);
  }

  function showWeatherTooltip(segment) {
    const text = segment.dataset.tooltip;
    if (!text) return;
    els.tooltip.textContent = text;
    els.tooltip.classList.add("is-visible");
    positionWeatherTooltip(segment);
  }

  function hideWeatherTooltip() {
    els.tooltip.classList.remove("is-visible");
  }

  function positionWeatherTooltip(segment) {
    const rootRect = root.getBoundingClientRect();
    const segmentRect = segment.getBoundingClientRect();
    const tooltipRect = els.tooltip.getBoundingClientRect();
    const halfWidth = tooltipRect.width / 2;
    const x = clamp(segmentRect.left + segmentRect.width / 2 - rootRect.left, halfWidth + 10, rootRect.width - halfWidth - 10);
    let y = segmentRect.top - rootRect.top - tooltipRect.height - 10;
    if (y < 10) y = segmentRect.bottom - rootRect.top + 10;
    els.tooltip.style.left = `${x}px`;
    els.tooltip.style.top = `${clamp(y, 10, rootRect.height - tooltipRect.height - 10)}px`;
  }

  function dayEvents(day) {
    const events = state.events[day] ? [...state.events[day]] : [];
    if (state.exactMoon[day] && !events.some(item => item.type === "moon")) {
      events.unshift({ type: "moon", title: state.exactMoon[day], copy: "Exact lunar phase.", fact: "Lunar phase marker.", sourceIds: ["astronomyEngine", "nasaSvs"], media: null });
    }
    return events;
  }

  function primaryEvent(events) {
    return events[0] || { type: "none", title: "", copy: "", fact: "", sourceIds: [], media: null };
  }

  function eventMeta(item) {
    return categoryMeta[item?.type] || categoryMeta.none;
  }

  function tagsFor(events) {
    const seen = new Set();
    return events.filter(item => {
      if (!item?.type || seen.has(item.type)) return false;
      seen.add(item.type);
      return true;
    }).slice(0, 2).map(item => eventMeta(item));
  }

  function moonForDay(day) {
    const data = state.moonData[day] || { phase: 0, age: 0, frame: 13, distance: 384400 };
    return {
      phase: Number(Number(data.phase || 0).toFixed(1)),
      name: state.exactMoon[day] ? String(state.exactMoon[day]).replace(/\s\d.*/, "") : phaseName(Number(data.age || 0)),
      age: Number(Number(data.age || 0).toFixed(2)),
      distance: Number(data.distance || 384400)
    };
  }

  function phaseName(age) {
    if (age < 1 || age > 28.6) return "New Moon";
    if (age < 6.6) return "Waxing Crescent";
    if (age < 8.2) return "First Quarter";
    if (age < 13.6) return "Waxing Gibbous";
    if (age < 16.2) return "Full Moon";
    if (age < 21.6) return "Waning Gibbous";
    if (age < 23.2) return "Last Quarter";
    return "Waning Crescent";
  }

  function moonImage(day, size) {
    const frame = state.moonData[day]?.frame || 13;
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${frame}.jpg`;
  }

  function isNewMoonDay(day) {
    const exact = String(state.exactMoon[day] || "");
    return /new moon/i.test(exact) || dayEvents(day).some(item => item.type === "moon" && /new moon/i.test(item.title || ""));
  }

  function initialSelectedDay() {
    return currentCalendarDay() || newMoonDay() || 1;
  }

  function currentCalendarDay() {
    const now = new Date();
    return now.getFullYear() === state.month.year && now.getMonth() === state.month.monthIndex ? now.getDate() : null;
  }

  function isTodayDay(day) {
    return currentCalendarDay() === day;
  }

  function newMoonDay() {
    for (let day = 1; day <= state.month.days; day += 1) if (isNewMoonDay(day)) return day;
    return null;
  }

  function targetMeta(name) {
    return targetCatalogue.find(item => item.match.test(name)) || null;
  }

  function targetObserving(meta, day) {
    if (!state.hasLocation) return { best: "Use location", altitude: "Use location" };
    if (!meta || (!meta.body && !Number.isFinite(meta.ra))) return { best: "After dark", altitude: "Varies" };
    try {
      const Astronomy = window.Astronomy;
      const observer = new Astronomy.Observer(state.lat, state.lon, 0);
      const start = zonedDate(state.month.year, state.month.monthIndex, day, 18, 0, 0);
      const end = zonedDate(state.month.year, state.month.monthIndex, day + 1, 6, 0, 0);
      let best = null;
      for (let step = 0; step <= 24; step += 1) {
        const sample = new Date(start.getTime() + (step / 24) * (end.getTime() - start.getTime()));
        const altitude = meta.body ? bodyAltitude(Astronomy.Body[meta.body], sample, observer) : Astronomy.Horizon(sample, observer, meta.ra, meta.dec, "normal").altitude;
        if (!best || altitude > best.altitude) best = { date: sample, altitude };
      }
      if (!best || best.altitude < 0) return { best: "Below horizon", altitude: "Below horizon" };
      return { best: formatTime(best.date), altitude: `${Math.round(best.altitude)}°` };
    } catch {
      return { best: "Unavailable", altitude: "Unavailable" };
    }
  }

  function targetThumbnail(target, day) {
    const text = String(target).toLowerCase();
    if (/saturn/.test(text)) return wikimediaImage("Saturn during Equinox.jpg", "Saturn thumbnail");
    if (/pleiades|m45/.test(text)) return wikimediaImage("Pleiades large.jpg", "Pleiades thumbnail");
    if (/lagoon|m8/.test(text)) return wikimediaImage("Lagoon Nebula.jpg", "Lagoon Nebula thumbnail");
    if (/trifid|m20/.test(text)) return wikimediaImage("Trifid.nebula.arp.750pix.jpg", "Trifid Nebula thumbnail");
    if (/meteor|perseid|aquariid|capricornid/.test(text)) return wikimediaImage("Perseid meteor shower.jpg", "Meteor shower thumbnail");
    if (/moon|lunar|crater/.test(text)) return wikimediaImage("Full Moon Luc Viatour.jpg", "Moon thumbnail");
    if (/venus/.test(text)) return wikimediaImage("Venus-real color.jpg", "Venus thumbnail");
    if (/planet|jupiter|mars|mercury/.test(text)) return wikimediaImage("Solar System true color.jpg", "Planet thumbnail");
    if (/milky way/.test(text)) return wikimediaImage("ESO - Milky Way.jpg", "Milky Way thumbnail");
    if (/comet/.test(text)) return wikimediaImage("Comet Hartley 2.jpg", "Comet thumbnail");
    if (/eclipse|solar|corona/.test(text)) return wikimediaImage("Total Solar Eclipse 8-21-17.jpg", "Solar eclipse thumbnail");
    return { src: state.media.milkyWay?.src || moonImage(day, 216), alt: `${target} thumbnail` };
  }

  function wikimediaImage(fileName, alt) {
    return { src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=320`, alt };
  }

  function moonZodiacInfo(day) {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const glyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
    try {
      const Astronomy = window.Astronomy;
      const sample = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
      const moon = Astronomy.EclipticGeoMoon(sample);
      const lon = normaliseDegrees(moon.lon);
      const index = Math.floor(lon / 30);
      return { glyph: glyphs[index], label: `${signs[index]} ${Math.floor(lon % 30)}°` };
    } catch {
      return { glyph: "☾", label: "Unavailable" };
    }
  }

  function darknessState(altitude) {
    if (!Number.isFinite(altitude)) return "light";
    if (altitude <= -18) return "dark";
    if (altitude <= -12) return "astro";
    if (altitude <= -6) return "nautical";
    return "light";
  }

  function darknessColour(stateName) {
    if (stateName === "dark") return "rgba(5, 8, 18, .86)";
    if (stateName === "astro") return "rgba(42, 70, 112, .48)";
    if (stateName === "nautical") return "rgba(97, 135, 170, .34)";
    return "rgba(215, 207, 168, .32)";
  }

  function darknessBandLabel(stateName, width = 999, compact = false) {
    if (stateName === "dark") return "Astronomical night";
    if (stateName === "astro") return "Astronomical twilight";
    if (stateName === "nautical") return width < (compact ? 38 : 46) ? "Nautical" : "Nautical night";
    return "";
  }

  function compressBands(states) {
    if (!states.length) return [{ startHour: 0, endHour: 12, state: "light" }];
    const bands = [];
    let start = 0;
    for (let index = 1; index <= states.length; index += 1) {
      if (states[index] === states[start]) continue;
      bands.push({ startHour: Number(((start / states.length) * 12).toFixed(3)), endHour: Number(((index / states.length) * 12).toFixed(3)), state: states[start] });
      start = index;
    }
    return bands;
  }

  function moonVisibleSegments(samples) {
    const segments = [];
    let current = [];
    samples.forEach(sample => {
      if (sample.altitude >= 0) current.push(sample);
      else {
        if (current.length) segments.push(current);
        current = [];
      }
    });
    if (current.length) segments.push(current);
    return segments;
  }

  function chartMarker(event, start, end, label) {
    const date = event?.date;
    if (!date || date < start || date > end) return null;
    return { hour: chartHour(date, start, end), label, time: formatLocal(date) };
  }

  function chartTwilightMarker(event, start, end, label, type) {
    const date = event?.date;
    if (!date || date < start || date > end) return null;
    return { hour: chartHour(date, start, end), label, type };
  }

  function chartHour(date, start, end) {
    return Number((12 * (date.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime())).toFixed(3));
  }

  function chartPoint(point, chart, maxAltitude) {
    return {
      x: Number((chart.x + (point.hour / 12) * chart.width).toFixed(2)),
      y: Number((chart.y + chart.height - (clamp(point.altitude, 0, maxAltitude) / maxAltitude) * chart.height).toFixed(2))
    };
  }

  function smoothPath(points) {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const p0 = points[Math.max(0, index - 1)];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[Math.min(points.length - 1, index + 2)];
      const cp1 = { x: Number((p1.x + (p2.x - p0.x) / 6).toFixed(2)), y: Number((p1.y + (p2.y - p0.y) / 6).toFixed(2)) };
      const cp2 = { x: Number((p2.x - (p3.x - p1.x) / 6).toFixed(2)), y: Number((p2.y - (p3.y - p1.y) / 6).toFixed(2)) };
      path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }

  function unavailableSky() {
    return { moonAltLabel: "Unavailable", moonAzLabel: "Unavailable", moonriseLabel: "Unavailable", moonsetLabel: "Unavailable", sunriseLabel: "Unavailable", sunsetLabel: "Unavailable", timeline: null };
  }

  function unavailableNight() {
    return { minutes: null, label: "Unavailable", window: "Astronomy calculation unavailable", nautical: null };
  }

  function locationNeeded() {
    return { minutes: null, label: useLocationText, window: useLocationText, nautical: null };
  }

  function noDark(nautical = null) {
    return { minutes: 0, label: "None", window: "Sun stays above -18°", nautical };
  }

  function nightWindowLine(nightInfo) {
    const times = String(nightInfo?.window || "").match(/\b\d{1,2}:\d{2}\b/g) || [];
    if (times.length >= 2) return `from ${times[0]} to ${times[1]}`;
    return nightInfo?.window ? `from ${nightInfo.window}` : "from N/A";
  }

  function nightTimes(nightInfo) {
    const times = String(nightInfo?.window || "").match(/\b\d{1,2}:\d{2}\b/g) || [];
    return {
      start: times[0] || "N/A",
      end: times[1] || "N/A"
    };
  }

  function durationClock(nightInfo) {
    if (!nightInfo || nightInfo.minutes === null) return nightInfo?.label || useLocationText;
    const minutes = Math.max(0, Math.round(nightInfo.minutes || 0));
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}h:${String(minutes % 60).padStart(2, "0")}m`;
  }

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
  }

  function formatAstroTime(astroTime) {
    return formatTime(astroTime?.date || null);
  }

  function zonedDate(year, monthIndex, day, hour = 0, minute = 0, second = 0) {
    const timeZone = cleanTimeZone(state.timeZone) || "UTC";
    const utcGuess = Date.UTC(year, monthIndex, day, hour, minute, second);
    let offset = timeZoneOffsetMinutes(new Date(utcGuess), timeZone);
    let zoned = new Date(utcGuess - offset * 60000);
    const corrected = timeZoneOffsetMinutes(zoned, timeZone);
    if (corrected !== offset) zoned = new Date(utcGuess - corrected * 60000);
    return zoned;
  }

  function timeZoneOffsetMinutes(date, timeZone) {
    const parts = zonedDateParts(date, timeZone);
    const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second || 0));
    return Math.round((asUTC - date.getTime()) / 60000);
  }

  function zonedDateParts(date, timeZone = state.timeZone) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: cleanTimeZone(timeZone) || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    return Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  }

  function formatTime(date) {
    if (!date) return "None";
    const parts = zonedDateParts(date);
    return `${parts.hour}:${parts.minute}`;
  }

  function formatLocal(date) {
    const parts = zonedDateParts(date);
    return `${Number(parts.day)} ${monthShort[Number(parts.month) - 1]} ${parts.hour}:${parts.minute}`;
  }

  function formatWeatherUpdatedAge(date) {
    const elapsed = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  function monthTitle() {
    return `${monthName()} ${state.month.year}`;
  }

  function monthName() {
    return monthLong[state.month.monthIndex];
  }

  function defaultMonthId() {
    const requested = new URLSearchParams(window.location.search).get("month");
    if (requested && manifest.some(item => item.id === requested)) return requested;
    const todayId = monthIdFromParts(new Date().getFullYear(), new Date().getMonth());
    if (manifest.some(item => item.id === todayId)) return todayId;
    const defaultEntry = manifest.find(item => item.default) || manifest[manifest.length - 1];
    return defaultEntry?.id || "2026-07";
  }

  function adjacentMonth(direction) {
    const index = manifest.findIndex(item => item.id === state.monthId);
    return index >= 0 ? manifest[index + direction] || null : null;
  }

  function monthIdFromParts(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  }

  function daysInMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
  }

  function firstDayOffset(year, monthIndex) {
    return (new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay() + 6) % 7;
  }

  function validDay(day) {
    const value = Number(day);
    return Number.isInteger(value) && value >= 1 && value <= (state.month?.days || 31);
  }

  function addIsoDate(dateKey, days) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days, 12));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function shortWeatherDate(dateKey, index) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return index === 0 ? `Tonight, ${date.getUTCDate()} ${monthShort[date.getUTCMonth()]}` : `${date.getUTCDate()} ${monthShort[date.getUTCMonth()]}`;
  }

  function numberAt(items, index) {
    const value = Number(items?.[index]);
    return Number.isFinite(value) ? value : null;
  }

  function avg(values) {
    const safe = values.filter(Number.isFinite);
    return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0;
  }

  function transparencyLabel(score) {
    if (score >= 75) return "Excellent";
    if (score >= 58) return "Fair";
    if (score >= 38) return "Average";
    return "Poor";
  }

  function seeingLabel(score) {
    if (score >= 78) return "Excellent";
    if (score >= 58) return "Good";
    if (score >= 38) return "Average";
    return "Poor";
  }

  function segmentColour(segment, metric) {
    if (metric === "cloud") return cloudColour(segment.cloud);
    if (metric === "temperature") return temperatureColour(segment.temperature);
    if (metric === "transparency") return transparencyColour(segment.transparency);
    if (metric === "seeing") return seeingColour(segment.seeing);
    if (metric === "wind") return windColour(segment.wind);
    return "rgba(139,146,156,.28)";
  }

  function segmentTooltip(segment, metric) {
    if (metric === "cloud") return `${segment.label}: Cloud ${Math.round(segment.cloud)}%`;
    if (metric === "temperature") return `${segment.label}: Temperature ${Math.round(segment.temperature)}°C`;
    if (metric === "transparency") return `${segment.label}: Transparency ${transparencyLabel(segment.transparency)}`;
    if (metric === "seeing") return `${segment.label}: ${seeingLabel(segment.seeing)} seeing`;
    if (metric === "wind") return `${segment.label}: Wind ${Math.round(segment.wind)} km/h`;
    return `${segment.label}: unavailable`;
  }

  function cloudColour(value) {
    if (value <= 15) return "#083b7a";
    if (value <= 40) return "#2f73c8";
    if (value <= 70) return "#9ed8ff";
    return "#f8fbff";
  }

  function transparencyColour(value) {
    if (value >= 75) return "#2f73c8";
    if (value >= 58) return "#148cff";
    if (value >= 38) return "#36d6ff";
    return "#f8fbff";
  }

  function seeingColour(value) {
    if (value >= 78) return "#061d49";
    if (value >= 58) return "#083b7a";
    if (value >= 38) return "#2369b7";
    return "#36d6ff";
  }

  function windColour(value) {
    if (value <= 6) return "#fff2cc";
    if (value <= 15) return "#f2c14e";
    if (value <= 28) return "#d9782f";
    return "#7a4a24";
  }

  function temperatureColour(value) {
    if (value < 0) return "#1f6feb";
    if (value < 10) return "#35a852";
    if (value < 15) return "#f2c94c";
    if (value < 20) return "#f2994a";
    if (value < 25) return "#e84a4a";
    if (value < 30) return "#9f1d1d";
    return "#6b001f";
  }

  function weatherKind(code, cloud) {
    if (code >= 95) return "storm";
    if (code >= 85) return "snow";
    if (code >= 80) return "showers";
    if (code >= 61) return "rain";
    if (code >= 45 && code <= 48) return "fog";
    if (cloud <= 10) return "stars";
    if (cloud <= 30) return "cloudThreeStars";
    if (cloud <= 50) return "cloudTwoStars";
    if (cloud <= 80) return "cloudOneStar";
    return "cloudy";
  }

  function weatherIconKinds(segments, fallback) {
    const kinds = segments.map(segment => weatherKind(segment.code, segment.cloud)).filter(Boolean);
    if (!kinds.length) return [fallback, fallback, fallback];
    if (kinds.every(kind => kind === "stars")) return ["stars", "stars", "stars"];
    const runs = kinds.reduce((items, kind) => {
      const last = items[items.length - 1];
      if (last?.kind === kind) last.count += 1;
      else items.push({ kind, count: 1 });
      return items;
    }, []);
    if (runs.length === 1) return [runs[0].kind, runs[0].kind, runs[0].kind];
    if (runs.length === 2) return runs[0].count >= runs[1].count ? [runs[0].kind, runs[0].kind, runs[1].kind] : [runs[0].kind, runs[1].kind, runs[1].kind];
    return [kinds[0], kinds[Math.floor(kinds.length / 2)], kinds[kinds.length - 1]];
  }

  function uniqueArticles(items) {
    const seen = new Set();
    return items.filter(item => {
      if (!item?.title || !item?.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }

  function geolocationBlockedByPolicy() {
    if (!isEmbeddedFrame()) return false;
    const policy = document.permissionsPolicy || document.featurePolicy;
    if (!policy || typeof policy.allowsFeature !== "function") return false;
    try {
      return !policy.allowsFeature("geolocation");
    } catch {
      return false;
    }
  }

  function isEmbeddedFrame() {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  function browserTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }

  function cleanName(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function cleanTimeZone(value) {
    const text = cleanName(value);
    if (!text) return "";
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: text }).format(new Date());
      return text;
    } catch {
      return "";
    }
  }

  function normaliseDegrees(value) {
    return ((Number(value) % 360) + 360) % 360;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function iconSvg(name) {
    const icons = {
      pin: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.4 7-12a7 7 0 0 0-14 0c0 6.6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>`,
      themeMoon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>`,
      themeSun: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
      altitude: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 17V7"/><path d="m8 11 4-4 4 4"/></svg>`,
      azimuth: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/><path d="m14.5 9.5-5 5"/></svg>`,
      moonrise: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M12 15V6"/><path d="m9 9 3-3 3 3"/></svg>`,
      moonset: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M12 6v9"/><path d="m9 12 3 3 3-3"/></svg>`,
      sunrise: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M6 15a6 6 0 0 1 12 0"/><path d="M12 15V5"/><path d="m8 9 4-4 4 4"/></svg>`,
      sunset: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M6 15a6 6 0 0 1 12 0"/><path d="M12 5v10"/><path d="m8 11 4 4 4-4"/></svg>`
    };
    return icons[name] || "";
  }

  function weatherIcon(kind) {
    const stroke = `fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;
    const star = `<path d="M17 3.5 18 6l2.5 1-2.5 1-1 2.5L16 8l-2.5-1L16 6Z" fill="currentColor" stroke="none"/>`;
    const smallStars = `${star}<path d="M6.5 5 7 6.4l1.4.6-1.4.6L6.5 9 6 7.6 4.6 7 6 6.4Z" fill="currentColor" stroke="none"/>`;
    const cloud = `<path d="M7 17h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.2-1.7A4.7 4.7 0 0 0 7 17Z"/>`;
    const icons = {
      stars: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${smallStars}<path d="M12 13.5 13 16l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" fill="currentColor" stroke="none"/></svg>`,
      cloudThreeStars: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}${smallStars}</svg>`,
      cloudTwoStars: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}${star}</svg>`,
      cloudOneStar: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}<path d="M18 4.5 18.7 6l1.6.7-1.6.7L18 9l-.7-1.6-1.6-.7 1.6-.7Z" fill="currentColor" stroke="none"/></svg>`,
      cloudy: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}</svg>`,
      rain: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}<path d="M8 20v1M12 19v2M16 20v1"/></svg>`,
      showers: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}<path d="m8 21 2-3M13 21l2-3"/></svg>`,
      snow: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}<path d="M9 20h0M13 21h0M17 20h0"/></svg>`,
      fog: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}<path d="M4 20h16M6 22h12"/></svg>`,
      storm: `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${cloud}<path d="m13 17-2 4 4-3h-3l2-3"/></svg>`
    };
    return icons[kind] || icons.cloudy;
  }
})();
