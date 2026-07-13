(() => {
      "use strict";

      const root = document.getElementById("amc-after-dark-calendar") || document.getElementById("amc-sky-calendar-july-2026");
      const grid = root.querySelector("#amc-grid");
      const detail = root.querySelector("#amc-detail");
      const mobilePlanning = root.querySelector("#amc-mobile-planning");
      const recommendations = root.querySelector("#amc-recommendations");
      const intel = root.querySelector("#amc-intel");
      const themeToggle = root.querySelector("#amc-theme-toggle");
      const useLocationButton = root.querySelector("#amc-use-location");
      const manualLocationForm = root.querySelector("#amc-manual-location");
      const manualLocationInput = root.querySelector("#amc-location-input");
      const locationResults = root.querySelector("#amc-location-results");
      const downloadPdfButton = root.querySelector("#amc-download-pdf");
      const locationLabel = root.querySelector("#amc-location-label");
      const locationPrompt = root.querySelector("#amc-location-prompt");
      const weatherTooltip = root.querySelector("#amc-weather-tooltip");
      const brandLogo = root.querySelector(".amc-brand-logo");
      const printLogo = root.querySelector(".amc-print-logo");
      const previousMonthButton = root.querySelector("[data-month-prev]");
      const nextMonthButton = root.querySelector("[data-month-next]");
      const todayButton = root.querySelector("#amc-today-button");

      const emptyEvent = { type: "none", title: "", copy: "", fact: "", sourceIds: [], media: null };
      const emptyEventMeta = { label: "", css: "no-event" };

      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const locationStorageKey = "amc-sky-calendar-location";
      const useCurrentLocationText = "Use Current Location";
      const weatherRefreshMs = 75 * 60 * 1000;
      const monthManifest = Array.isArray(window.AMC_MONTH_MANIFEST) ? window.AMC_MONTH_MANIFEST : [];
      const wikimediaSource = {
        label: "Wikimedia Commons image files",
        url: "https://commons.wikimedia.org/wiki/Main_Page",
        note: "Target recommendation thumbnails are loaded from Wikimedia Commons file images used across Wikipedia and related projects."
      };

      const categoryMeta = {
        moon: { label: "Moon", css: "moon" },
        meteor: { label: "Meteor", css: "meteor" },
        launch: { label: "Launch", css: "launch" },
        opposition: { label: "Opposition", css: "opposition" },
        eclipse: { label: "Eclipse", css: "eclipse" },
        sky: { label: "Sky", css: "sky" },
        telescope: { label: "Telescope", css: "telescope" },
        occultation: { label: "Occultation", css: "occultation" },
        note: { label: "Planning", css: "sky" }
      };

      let activeMonthId = "";
      let MONTH = null;
      let sources = {};
      let articleData = {};
      let media = {};
      let moonData = {};
      let exactMoon = {};
      let monthIntel = [];
      let eventData = {};
      let targetData = {};
      let selectedDay = 1;
      let expandedDay = null;
      let nightData = {};
      let skyData = {};
      let hasLocation = false;
      let locationName = "";
      let locationTimeZone = browserTimeZone();
      let currentLat = null;
      let currentLon = null;
      let weatherForecast = [];
      let weatherState = "idle";
      let weatherUpdatedAt = null;
      let weatherRefreshTimer = null;
      let weatherRequestId = 0;
      let locationSearchTimer = null;
      let locationSearchRequestId = 0;
      let locationMatches = [];
      let isMonthTransitioning = false;
      let monthTransitionTimer = null;
      const monthLoadPromises = {};

      if (brandLogo && printLogo) printLogo.src = brandLogo.src;
      applySavedTheme();
      root.dataset.astroEngine = window.Astronomy ? "ready" : "missing";

      themeToggle.addEventListener("click", toggleTheme);
      useLocationButton.addEventListener("click", useBrowserLocation);
      manualLocationForm.addEventListener("submit", useManualLocation);
      manualLocationInput.addEventListener("input", handleManualLocationInput);
      locationResults?.addEventListener("click", handleLocationResultClick);
      document.addEventListener("click", handleLocationResultOutsideClick);
      downloadPdfButton.addEventListener("click", downloadPdf);
      previousMonthButton?.addEventListener("click", () => goToAdjacentMonth(-1));
      nextMonthButton?.addEventListener("click", () => goToAdjacentMonth(1));
      todayButton?.addEventListener("click", goToToday);
      root.addEventListener("pointerover", handleWeatherTipIn);
      root.addEventListener("pointerout", handleWeatherTipOut);
      root.addEventListener("focusin", handleWeatherTipIn);
      root.addEventListener("focusout", handleWeatherTipOut);
      root.addEventListener("click", handleWeatherTipClick);
      document.addEventListener("visibilitychange", refreshWeatherWhenVisible);
      initCalendar();

      async function initCalendar() {
        try {
          await showMonth(defaultMonthId());
          applySavedLocation();
        } catch (error) {
          detail.innerHTML = `<div class="amc-detail-body"><span class="amc-weather-note">Calendar data could not be loaded.</span></div>`;
          mobilePlanning.innerHTML = "";
          console.error(error);
        }
      }

      async function showMonth(monthId, options = {}) {
        const data = await loadMonthData(monthId);
        setMonthData(data, monthId);
        selectedDay = validDay(options.selectedDay) ? Number(options.selectedDay) : initialSelectedDay();
        expandedDay = null;
        nightData = {};
        skyData = {};
        if (hasLocation && Number.isFinite(currentLat) && Number.isFinite(currentLon)) {
          recalculateLocationData(currentLat, currentLon);
        }
        renderMonthShell();
        renderIntel();
        renderSources();
        renderCalendar();
        renderSelectedDay();
      }

      function setMonthData(data, fallbackId) {
        const month = data.MONTH || data.month;
        if (!month || !Number.isFinite(Number(month.year)) || !Number.isFinite(Number(month.monthIndex))) {
          throw new Error(`Invalid month data: ${fallbackId}`);
        }
        MONTH = {
          year: Number(month.year),
          monthIndex: Number(month.monthIndex),
          days: Number(month.days || daysInMonth(month.year, month.monthIndex)),
          firstDayOffset: Number.isFinite(Number(month.firstDayOffset))
            ? Number(month.firstDayOffset)
            : firstDayOffset(month.year, month.monthIndex)
        };
        activeMonthId = data.id || fallbackId || monthIdFromParts(MONTH.year, MONTH.monthIndex);
        sources = data.sources || {};
        articleData = data.articleData || {};
        media = data.media || {};
        moonData = data.moonData || {};
        exactMoon = data.exactMoon || {};
        monthIntel = data.monthIntel || [];
        eventData = data.eventData || {};
        targetData = data.targetData || data.targets || {};
        root.dataset.month = activeMonthId;
      }

      function loadMonthData(monthId) {
        const registry = window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};
        if (registry[monthId]) return Promise.resolve(registry[monthId]);
        const entry = monthManifest.find(item => item.id === monthId);
        if (!entry) return Promise.reject(new Error(`Month is not listed: ${monthId}`));
        if (monthLoadPromises[monthId]) return monthLoadPromises[monthId];
        monthLoadPromises[monthId] = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = entry.path;
          script.async = true;
          script.onload = () => registry[monthId] ? resolve(registry[monthId]) : reject(new Error(`Month data did not register: ${monthId}`));
          script.onerror = () => reject(new Error(`Could not load month data: ${monthId}`));
          document.head.appendChild(script);
        });
        return monthLoadPromises[monthId];
      }

      function defaultMonthId() {
        const requested = new URLSearchParams(window.location.search).get("month");
        if (requested && monthManifest.some(item => item.id === requested)) return requested;
        const todayId = monthIdFromParts(new Date().getFullYear(), new Date().getMonth());
        if (monthManifest.some(item => item.id === todayId)) return todayId;
        const defaultEntry = monthManifest.find(item => item.default) || monthManifest[monthManifest.length - 1];
        return defaultEntry?.id || "2026-07";
      }

      function goToAdjacentMonth(direction) {
        const entry = adjacentMonth(direction);
        if (!entry) return;
        transitionToMonth(entry.id, direction);
      }

      async function goToToday() {
        const today = new Date();
        const todayId = monthIdFromParts(today.getFullYear(), today.getMonth());
        if (!monthManifest.some(item => item.id === todayId)) return;
        const todayDay = today.getDate();
        if (activeMonthId === todayId) {
          selectedDay = todayDay;
          expandedDay = null;
          renderSelectedDay();
          updateTodayButton();
          scrollSelectedDayIntoView(todayDay);
          return;
        }
        const currentIndex = monthManifest.findIndex(item => item.id === activeMonthId);
        const todayIndex = monthManifest.findIndex(item => item.id === todayId);
        const direction = todayIndex >= currentIndex ? 1 : -1;
        await transitionToMonth(todayId, direction, { selectedDay: todayDay });
      }

      async function transitionToMonth(monthId, direction = 1, options = {}) {
        if (isMonthTransitioning) return;
        if (monthId === activeMonthId && !validDay(options.selectedDay)) return;
        isMonthTransitioning = true;
        setMonthNavigationDisabled(true);
        window.clearTimeout(monthTransitionTimer);
        root.classList.remove("is-month-entering", "is-month-leaving", "is-month-forward", "is-month-backward");
        root.classList.add(direction < 0 ? "is-month-backward" : "is-month-forward", "is-month-leaving");
        await delay(160);
        await showMonth(monthId, options);
        root.classList.remove("is-month-leaving");
        root.classList.add("is-month-entering");
        monthTransitionTimer = window.setTimeout(() => {
          root.classList.remove("is-month-entering", "is-month-forward", "is-month-backward");
          isMonthTransitioning = false;
          renderMonthShell();
        }, 260);
      }

      function delay(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
      }

      function validDay(day) {
        const value = Number(day);
        return Number.isInteger(value) && value >= 1 && value <= (MONTH?.days || 31);
      }

      function adjacentMonth(direction) {
        const index = monthManifest.findIndex(item => item.id === activeMonthId);
        if (index < 0) return null;
        return monthManifest[index + direction] || null;
      }

      function monthIdFromParts(year, monthIndex) {
        return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      }

      function daysInMonth(year, monthIndex) {
        return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
      }

      function firstDayOffset(year, monthIndex) {
        const day = new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay();
        return (day + 6) % 7;
      }

      function renderMonthShell() {
        root.querySelectorAll("[data-month-label]").forEach(item => {
          item.textContent = monthTitle();
        });
        const highlightsLabel = root.querySelector("[data-month-highlights]");
        if (highlightsLabel) highlightsLabel.textContent = `${monthName()}'s Highlights`;
        const previous = previousMonthButton;
        const next = nextMonthButton;
        const previousEntry = adjacentMonth(-1);
        const nextEntry = adjacentMonth(1);
        if (previous) {
          previous.disabled = isMonthTransitioning || !previousEntry;
          previous.title = previousEntry ? `Show ${previousEntry.label}` : `No loaded month before ${monthTitle()}`;
          previous.setAttribute("aria-label", previousEntry ? `Show ${previousEntry.label}` : `Previous month unavailable`);
        }
        if (next) {
          next.disabled = isMonthTransitioning || !nextEntry;
          next.title = nextEntry ? `Show ${nextEntry.label}` : `No loaded month after ${monthTitle()}`;
          next.setAttribute("aria-label", nextEntry ? `Show ${nextEntry.label}` : `Next month unavailable`);
        }
        updateTodayButton();
        grid.setAttribute("aria-label", `${monthTitle()} day selector`);
      }

      function updateTodayButton() {
        if (!todayButton) return;
        const today = new Date();
        const todayId = monthIdFromParts(today.getFullYear(), today.getMonth());
        const todayDay = today.getDate();
        const isLoaded = monthManifest.some(item => item.id === todayId);
        const isSelected = activeMonthId === todayId && selectedDay === todayDay;
        todayButton.disabled = isMonthTransitioning || !isLoaded || isSelected;
        todayButton.title = isLoaded ? `Show today, ${todayDay} ${monthLong[today.getMonth()]} ${today.getFullYear()}` : "Today's month is not loaded";
        todayButton.setAttribute("aria-label", todayButton.title);
      }

      function setMonthNavigationDisabled(disabled) {
        [previousMonthButton, nextMonthButton, todayButton].forEach(button => {
          if (button) button.disabled = disabled;
        });
      }

      function monthTitle() {
        return `${monthName()} ${MONTH.year}`;
      }

      function monthName() {
        return monthLong[MONTH.monthIndex];
      }

      function renderIntel() {
        intel.innerHTML = monthIntel.map(item => `
          <div class="amc-intel-card">
            <img src="${item.image}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
            <span class="amc-intel-copy">
              <b>${item.title}</b>
              <span>${item.text}</span>
            </span>
          </div>
        `).join("");
      }

      function renderSources() {
        const sourceList = { ...sources, wikimediaThumbs: wikimediaSource };
        root.querySelector("#amc-source-list").innerHTML = Object.values(sourceList).map(source => `
          <li><a href="${source.url}" target="_blank" rel="noopener">${source.label}</a><br>${source.note}</li>
        `).join("");
      }

      function renderCalendar() {
        const html = [];
        const todayDay = currentCalendarDay();
        for (let i = 0; i < MONTH.firstDayOffset; i += 1) html.push(`<div class="amc-empty" aria-hidden="true"></div>`);

        for (let day = 1; day <= MONTH.days; day += 1) {
          const date = new Date(Date.UTC(MONTH.year, MONTH.monthIndex, day, 12));
          const weekday = weekdays[date.getUTCDay()];
          const weekdayShort = weekday.toUpperCase();
          const moon = moonForDay(day);
          const nightInfo = hasLocation ? (nightData[day] || noDark()) : locationNeeded();
          const skyInfo = hasLocation ? skyData[day] : null;
          const events = dayEvents(day);
          const primary = primaryEvent(events);
          const tags = tagsFor(events);
          const css = eventMeta(primary).css;
          const expanded = day === expandedDay;
          const rowEnd = (MONTH.firstDayOffset + day - 1) % 7 === 6;
          const isToday = day === todayDay;
          const isNewMoon = isNewMoonDay(day);
          const todayLabel = isToday ? "Today, " : "";

          html.push(`
            <button type="button" class="amc-day ${css}${isNewMoon ? " is-new-moon" : ""}${isToday ? " is-today" : ""}${rowEnd ? " is-row-end" : ""}" data-day="${day}" aria-expanded="${expanded}" aria-label="${todayLabel}${weekdayShort} ${day} ${monthTitle()}, ${moon.name}, ${moon.phase}% illuminated, astro night ${durationClock(nightInfo)}">
              <span class="amc-date">
                <strong>${day}</strong>
                <span class="amc-date-badges">
                  <span class="amc-mobile-weekday">${weekdayShort}</span>
                  ${isToday ? `<span class="amc-today-pill">Today</span>` : ""}
                </span>
              </span>
              <span class="amc-moon-line">
                <img class="amc-moon-img" src="${moonImage(day, 216)}" alt="" loading="lazy" decoding="async" width="52" height="52">
                <span class="amc-moon-copy">
                  <b>${moon.name}</b>
                  <span>${moon.phase}% lit</span>
                </span>
              </span>
              <span class="amc-dark-line">Astro night: ${durationClock(nightInfo)}</span>
              <span class="amc-tags">${tags.map(tag => `<span class="amc-tag ${tag.css}">${tag.label}</span>`).join("")}</span>
              <span class="amc-expanded">${expanded ? cellEphemeris(day, skyInfo, nightInfo, primary, events, moon) : ""}</span>
            </button>
          `);
        }

        grid.innerHTML = html.join("");
        grid.querySelectorAll(".amc-day").forEach(button => {
          button.addEventListener("click", event => {
            if (event.target.closest(".amc-weather-segments i")) return;
            selectDay(Number(button.dataset.day));
          });
        });
      }

      function selectDay(day) {
        const wasExpanded = expandedDay === day;
        selectedDay = day;
        expandedDay = wasExpanded ? null : day;
        renderSelectedDay();
        updateTodayButton();
        if (!wasExpanded) scrollExpandedDayIntoView(day);
      }

      function renderSelectedDay() {
        renderCalendar();
        renderDetail(selectedDay);
        renderRecommendations(selectedDay);
      }

      function scrollExpandedDayIntoView(day) {
        window.requestAnimationFrame(() => {
          if (root.getBoundingClientRect().width > 820) return;
          const expandedButton = grid.querySelector(`.amc-day[data-day="${day}"]`);
          expandedButton?.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
        });
      }

      function scrollSelectedDayIntoView(day) {
        window.requestAnimationFrame(() => {
          const selectedButton = grid.querySelector(`.amc-day[data-day="${day}"]`);
          selectedButton?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        });
      }

      function renderDetail(day) {
        const date = new Date(Date.UTC(MONTH.year, MONTH.monthIndex, day, 12));
        const weekday = weekdays[date.getUTCDay()];
        const moon = moonForDay(day);
        const nightInfo = hasLocation ? (nightData[day] || noDark()) : locationNeeded();
        const skyInfo = hasLocation ? skyData[day] : null;
        const events = dayEvents(day);
        const main = primaryEvent(events);
        const mainMeta = eventMeta(main);

        detail.innerHTML = `
          <div class="amc-detail-body">
            <div class="amc-detail-head">
              <span class="amc-detail-date">${weekday} ${day} ${monthTitle()}</span>
              <span class="amc-detail-location">${locationPill(locationDisplay())}</span>
            </div>
            ${main.title ? `<h2 class="amc-detail-title ${mainMeta.css}">${main.title}</h2>` : ""}
            ${events.length ? `<ul class="amc-event-list">
              ${events.map(item => `
                <li class="amc-event ${eventMeta(item).css}">
                  <small>${eventMeta(item).label}</small>
                  <h4>${item.title}</h4>
                  <p>${item.copy}</p>
                </li>
              `).join("")}
            </ul>` : ""}
            ${moonChart(skyInfo, nightInfo)}
            ${weatherPanel()}
          </div>
        `;

        mobilePlanning.innerHTML = "";
      }

      function renderRecommendations(day) {
        if (!recommendations) return;
        const moon = moonForDay(day);
        const events = dayEvents(day);
        recommendations.innerHTML = recommendationsPanel(day, events, moon);
      }

      function recommendationsPanel(day, events, moon) {
        const targets = tonightBest(day, events, moon);
        const articles = recommendedArticles(day, events, moon);
        return `
          <div class="amc-recommendation-group">
            <h3>Tonight point your camera to:</h3>
            <ol class="amc-target-list">${targets.map(target => targetItem(target, day, moon)).join("")}</ol>
          </div>
          <div class="amc-recommendation-group">
            <h3>Related Articles</h3>
            <div class="amc-related-grid">${articles.map(articlePromo).join("")}</div>
          </div>`;
      }

      function dayEvents(day) {
        const events = eventData[day] ? [...eventData[day]] : [];
        if (exactMoon[day] && !events.some(item => item.type === "moon")) {
          events.unshift(event("moon", exactMoon[day], "Exact lunar phase.", "Lunar planning.", ["nasaSvs"]));
        }
        return events;
      }

      function isNewMoonDay(day) {
        const exact = String(exactMoon[day] || "");
        if (/new moon/i.test(exact)) return true;
        return (eventData[day] || []).some(item => item.type === "moon" && /new moon/i.test(item.title || ""));
      }

      function primaryEvent(events) {
        return events[0] || emptyEvent;
      }

      function eventMeta(item) {
        return categoryMeta[item?.type] || emptyEventMeta;
      }

      function tagsFor(events) {
        const seen = new Set();
        return events
          .filter(item => {
            if (seen.has(item.type)) return false;
            seen.add(item.type);
            return true;
          })
          .slice(0, 2)
          .map(item => ({ label: categoryMeta[item.type].label, css: categoryMeta[item.type].css }));
      }

      function cellEphemeris(day, skyInfo, nightInfo, primary, events, moon) {
        const date = new Date(Date.UTC(MONTH.year, MONTH.monthIndex, day, 12));
        const weekday = weekdays[date.getUTCDay()];
        const todayLabel = isTodayDay(day) ? "Today, " : "";
        const meta = eventMeta(primary);
        const identity = `<span class="amc-expanded-identity">
          <img src="${moonImage(day, 216)}" alt="" loading="lazy" decoding="async" width="40" height="40">
          <span>
            <strong>${todayLabel}${weekday} ${day} ${monthLong[MONTH.monthIndex]} ${MONTH.year}</strong>
            <span class="amc-expanded-stat">${moon.name}, ${moon.phase}% illuminated</span>
            <span class="amc-expanded-night">Astro night: ${durationClock(nightInfo)}</span>
          </span>
        </span>`;
        const title = primary.title
          ? `<span class="amc-expanded-title ${meta.css}">${primary.title}</span>`
          : `<span class="amc-expanded-title is-empty" aria-hidden="true"></span>`;
        const head = `<span class="amc-expanded-head">${title}${moonZodiacCard(day)}</span>`;
        const mobileExtra = cellMobileExtra(day, events, moon, skyInfo, nightInfo);
        if (!skyInfo) {
          return `${identity}${head}<span class="amc-mini-grid">
            ${miniItem("alt", "Altitude", useCurrentLocationText)}
            ${miniItem("az", "Azimuth", useCurrentLocationText)}
            ${miniItem("moonrise", "Moonrise", useCurrentLocationText)}
            ${miniItem("moonset", "Moonset", useCurrentLocationText)}
            ${miniItem("sunrise", "Sunrise", useCurrentLocationText)}
            ${miniItem("sunset", "Sunset", useCurrentLocationText)}
          </span>${mobileExtra}`;
        }

        return `${identity}${head}<span class="amc-mini-grid">
          ${miniItem("alt", "Altitude", skyInfo.moonAltLabel)}
          ${miniItem("az", "Azimuth", skyInfo.moonAzLabel)}
          ${miniItem("moonrise", "Moonrise", skyInfo.moonriseLabel)}
          ${miniItem("moonset", "Moonset", skyInfo.moonsetLabel)}
          ${miniItem("sunrise", "Sunrise", skyInfo.sunriseLabel)}
          ${miniItem("sunset", "Sunset", skyInfo.sunsetLabel)}
        </span>${mobileExtra}`;
      }

      function cellMobileExtra(day, events, moon, skyInfo, nightInfo) {
        return `<span class="amc-cell-mobile-extra">
          ${cellMoonChart(skyInfo, nightInfo)}
          ${events.length ? `<span class="amc-cell-section">
            <b>Events</b>
            <span class="amc-cell-event-list">
              ${events.map(item => `<span class="amc-cell-event ${eventMeta(item).css}">${item.title}</span>`).join("")}
            </span>
          </span>` : ""}
          ${cellWeatherPanel()}
        </span>`;
      }

      function cellMoonChart(skyInfo, nightInfo) {
        if (!skyInfo?.timeline) {
          return `<span class="amc-cell-section amc-cell-alt-chart" aria-label="Moon altitude and darkness chart">
            <b>Moon Altitude & Darkness</b>
            <span class="amc-chart-empty">Use Current Location to show Moon altitude and darkness phases.</span>
          </span>`;
        }
        return `<span class="amc-cell-section amc-cell-alt-chart" aria-label="Moon altitude and darkness chart">
          <b>Moon Altitude & Darkness</b>
          ${moonAltitudeSvg(skyInfo.timeline, false)}
          ${chartNightLabels(nightInfo)}
        </span>`;
      }

      function miniItem(icon, label, value) {
        return `<span class="amc-mini-item">${iconSvg(icon)}<span><span>${label}</span><b>${value}</b></span></span>`;
      }

      function astroItem(icon, label, value) {
        return `<span class="amc-astro-item">${iconSvg(icon)}<span><span>${label}</span><b>${value}</b></span></span>`;
      }

      const zodiacSigns = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
      ];

      const zodiacElements = {
        Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
        Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
        Gemini: "Air", Libra: "Air", Aquarius: "Air",
        Cancer: "Water", Scorpio: "Water", Pisces: "Water"
      };

      const zodiacGlyphs = {
        Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
        Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
        Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
      };

      function moonZodiacCard(day) {
        const info = moonZodiacInfo(day);
        return `<span class="amc-zodiac-card" aria-label="Moon zodiac ${info.sign} at 12:00 UTC">
          <span class="amc-zodiac-mark">${info.glyph}</span>
          <span>
            <small>Moon Zodiac</small>
            <b>${info.sign} ${info.degree}</b>
            <span>${info.element} sign, 12:00 UTC</span>
          </span>
        </span>`;
      }

      function moonZodiacInfo(day) {
        const Astronomy = window.Astronomy;
        if (!Astronomy?.EclipticGeoMoon) {
          return { sign: "Unavailable", glyph: "?", degree: "", element: "Zodiac" };
        }
        try {
          const sample = new Date(Date.UTC(MONTH.year, MONTH.monthIndex, day, 12, 0, 0));
          const moonEcliptic = Astronomy.EclipticGeoMoon(sample);
          const longitude = normaliseDegrees(moonEcliptic.lon);
          const sign = zodiacSigns[Math.floor(longitude / 30)];
          const signDegree = longitude % 30;
          return {
            sign,
            glyph: zodiacGlyphs[sign] || "?",
            degree: `${Math.floor(signDegree)}°`,
            element: zodiacElements[sign] || "Zodiac"
          };
        } catch {
          return { sign: "Unavailable", glyph: "?", degree: "", element: "Zodiac" };
        }
      }

      function normaliseDegrees(value) {
        return ((Number(value) % 360) + 360) % 360;
      }

      function moonChart(skyInfo, nightInfo) {
        if (!skyInfo?.timeline) {
          return `<section class="amc-alt-chart" aria-label="Moon altitude and darkness chart">
            <h3>Moon Altitude & Darkness</h3>
            <span class="amc-chart-empty">Use Current Location to show Moon altitude and darkness phases.</span>
          </section>`;
        }

        return `<section class="amc-alt-chart" aria-label="Moon altitude and darkness chart">
          <h3>Moon Altitude & Darkness</h3>
          ${moonAltitudeSvg(skyInfo.timeline, false)}
          ${chartNightLabels(nightInfo)}
        </section>`;
      }

      function chartNightLabels(nightInfo) {
        if (!nightInfo || nightInfo.minutes === null) {
          return `<span class="amc-alt-labels">
            <span><b>Astro night:</b> ${useCurrentLocationText}</span>
            <span>Night duration: ${useCurrentLocationText}</span>
          </span>`;
        }
        if (!nightInfo.minutes) {
          if (nightInfo.nautical?.minutes) {
            return `<span class="amc-alt-labels">
              <span><b>Astro night:</b> No astronomical darkness.</span>
              <span>Best nautical window: ${nightInfo.nautical.window}</span>
              <span>Nautical duration: ${durationClock(nightInfo.nautical)}</span>
            </span>`;
          }
          return `<span class="amc-alt-labels">
            <span><b>Astro night:</b> No astronomical darkness.</span>
            <span>Nautical window unavailable.</span>
          </span>`;
        }
        return `<span class="amc-alt-labels">
          <span><b>Astro night:</b></span>
          <span>${nightWindowLine(nightInfo)}</span>
          <span>Night duration: ${durationClock(nightInfo)}</span>
        </span>`;
      }

      function nightWindowLine(nightInfo) {
        const times = String(nightInfo?.window || "").match(/\b\d{1,2}:\d{2}\b/g) || [];
        if (times.length >= 2) return `from ${times[0]} to ${times[1]}`;
        return nightInfo?.window ? `from ${nightInfo.window}` : "from N/A";
      }

      function moonAltitudeSvg(timeline, compact) {
        const maxAltitude = 60;
        const chart = {
          x: compact ? 34 : 39,
          y: compact ? 16 : 22,
          width: compact ? 282 : 306,
          height: compact ? 78 : 164
        };
        const viewWidth = compact ? 332 : 360;
        const viewHeight = compact ? 136 : 244;
        const hourLabels = Array.from({ length: 13 }, (_, index) => (18 + index) % 24);
        const yTicks = compact ? [0, 30, 60] : [0, 20, 40, 60];
        const paths = timeline.moonSegments
          .map(segment => smoothPath(segment.map(point => chartPoint(point, chart, maxAltitude))))
          .filter(Boolean)
          .map(path => `<path d="${path}" fill="none" stroke="#d08a13" stroke-width="${compact ? 3 : 3.2}" stroke-linecap="round"/>`)
          .join("");
        const markers = timeline.markers.map(marker => {
          const point = chartPoint({ hour: marker.hour, altitude: 0 }, chart, maxAltitude);
          return `<g>
            <circle cx="${point.x}" cy="${point.y}" r="${compact ? 3.2 : 4}" fill="#d08a13"/>
            <text x="${point.x}" y="${point.y - 19}" text-anchor="middle" fill="#8b5f12" font-size="${compact ? 8 : 8.8}" font-weight="760">${marker.label}</text>
            <text x="${point.x}" y="${point.y - 7}" text-anchor="middle" fill="currentColor" font-size="${compact ? 7.4 : 8.2}" font-weight="720">${marker.time}</text>
          </g>`;
        }).join("");
        const twilightMarkers = (timeline.twilightMarkers || []).map(marker => {
          const x = chart.x + (marker.hour / 12) * chart.width;
          const labelY = marker.type === "end" ? chart.y + 12 : chart.y + chart.height - 24;
          return `<g>
            <line x1="${x}" x2="${x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(5,8,18,.46)" stroke-width="1" stroke-dasharray="3 3"/>
            <text x="${x}" y="${labelY}" text-anchor="middle" fill="currentColor" font-size="${compact ? 7.2 : 8.2}" font-weight="760">${marker.label}</text>
          </g>`;
        }).join("");
        const bands = timeline.bands.map(band => {
          const x = chart.x + (band.startHour / 12) * chart.width;
          const width = ((band.endHour - band.startHour) / 12) * chart.width;
          return `<rect x="${x}" y="${chart.y}" width="${Math.max(0.5, width)}" height="${chart.height}" fill="${darknessColour(band.state)}"/>`;
        }).join("");
        const bandLabels = timeline.bands.map(band => {
          const width = ((band.endHour - band.startHour) / 12) * chart.width;
          const label = darknessBandLabel(band.state, width, compact);
          const minWidth = band.state === "nautical" ? (compact ? 18 : 22) : (compact ? 50 : 64);
          if (!label || width < minWidth) return "";
          const x = chart.x + ((band.startHour + band.endHour) / 24) * chart.width;
          const y = band.state === "dark"
            ? chart.y + 14
            : band.state === "nautical"
              ? chart.y + (compact ? 13 : 16)
              : chart.y + chart.height - (compact ? 8 : 10);
          const fill = band.state === "dark" ? "#fff" : "currentColor";
          const fontSize = band.state === "nautical" && width < (compact ? 38 : 46) ? (compact ? 6.8 : 7.4) : (compact ? 7.2 : 8.6);
          return `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fontSize}" font-weight="760">${label}</text>`;
        }).join("");
        const hourTicks = hourLabels.map((hour, index) => {
          const x = chart.x + (index / 12) * chart.width;
          const label = String(hour).padStart(2, "0");
          return `<g><line x1="${x}" x2="${x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.12)" stroke-width="1"/><text x="${x}" y="${chart.y + chart.height + (compact ? 16 : 18)}" text-anchor="middle" fill="currentColor" font-size="${compact ? 8.1 : 9.1}" font-weight="720">${label}</text></g>`;
        }).join("");
        const altitudeTicks = yTicks.map(tick => {
          const y = chart.y + chart.height - (tick / maxAltitude) * chart.height;
          return `<g><line x1="${chart.x}" x2="${chart.x + chart.width}" y1="${y}" y2="${y}" stroke="rgba(22,25,29,.16)" stroke-width="1"/><text x="${chart.x - 8}" y="${y + 3}" text-anchor="end" fill="currentColor" font-size="${compact ? 8.1 : 9.1}" font-weight="720">${tick}°</text></g>`;
        }).join("");
        return `<svg class="amc-alt-svg" viewBox="0 0 ${viewWidth} ${viewHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Moon altitude through the night from 18:00 to 06:00, scaled from 0 to 60 degrees">
          <g style="color: var(--text)">
            ${bands}
            ${hourTicks}
            ${altitudeTicks}
            ${bandLabels}
            <line x1="${chart.x}" x2="${chart.x + chart.width}" y1="${chart.y + chart.height}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.42)" stroke-width="1.2"/>
            <line x1="${chart.x}" x2="${chart.x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.36)" stroke-width="1.2"/>
            ${twilightMarkers}
            ${paths}
            ${markers}
          </g>
        </svg>`;
      }

      function chartPoint(point, chart, maxAltitude = 60) {
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
          const cp1 = {
            x: Number((p1.x + (p2.x - p0.x) / 6).toFixed(2)),
            y: Number((p1.y + (p2.y - p0.y) / 6).toFixed(2))
          };
          const cp2 = {
            x: Number((p2.x - (p3.x - p1.x) / 6).toFixed(2)),
            y: Number((p2.y - (p3.y - p1.y) / 6).toFixed(2))
          };
          path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
        }
        return path;
      }

      function darknessColour(state) {
        if (state === "dark") return "rgba(5, 8, 18, .86)";
        if (state === "astro") return "rgba(42, 70, 112, .48)";
        if (state === "nautical") return "rgba(97, 135, 170, .34)";
        return "rgba(215, 207, 168, .32)";
      }

      function darknessBandLabel(state, width = 999, compact = false) {
        if (state === "dark") return "Astronomical night";
        if (state === "astro") return "Astronomical twilight";
        if (state === "nautical") return width < (compact ? 38 : 46) ? "Nautical" : "Nautical night";
        return "";
      }

      function weatherPanel() {
        if (!hasLocation) {
          return `<section class="amc-weather" aria-label="Local 7-night observing forecast">
            <h3>7-Night Forecast</h3>
            <span class="amc-weather-note">Use Current Location to show night-time cloud cover and transparency.</span>
          </section>`;
        }

        if (weatherState === "loading") {
          return `<section class="amc-weather" aria-label="Local 7-night observing forecast">
            <h3>7-Night Forecast</h3>
            <span class="amc-weather-note">Loading local observing conditions.</span>
          </section>`;
        }

        if (weatherState === "error" || !weatherForecast.length) {
          return `<section class="amc-weather" aria-label="Local 7-night observing forecast">
            <h3>7-Night Forecast</h3>
            <span class="amc-weather-note">Weather forecast unavailable for this location.</span>
          </section>`;
        }

        return `<section class="amc-weather" aria-label="Local 7-night observing forecast">
          <span class="amc-weather-title">
            <h3>7-Night Forecast</h3>
            ${weatherUpdatedLine()}
          </span>
          <div class="amc-weather-grid">
            ${weatherForecast.map(day => weatherCard(day)).join("")}
          </div>
        </section>`;
      }

      function cellWeatherPanel() {
        if (!hasLocation) {
          return `<span class="amc-cell-section"><b>7-Night Forecast</b><span class="amc-weather-note">Use Current Location to show night-time conditions.</span></span>`;
        }
        if (weatherState === "loading") {
          return `<span class="amc-cell-section"><b>7-Night Forecast</b><span class="amc-weather-note">Loading local observing conditions.</span></span>`;
        }
        if (weatherState === "error" || !weatherForecast.length) {
          return `<span class="amc-cell-section"><b>7-Night Forecast</b><span class="amc-weather-note">Weather forecast unavailable.</span></span>`;
        }
        return `<span class="amc-cell-section">
          <b>7-Night Forecast</b>
          <span class="amc-cell-weather-list">
            ${weatherForecast.map(day => weatherCard(day, true)).join("")}
          </span>
          ${weatherUpdatedLine()}
        </span>`;
      }

      function weatherCard(day, compact = false) {
        const cardClass = compact ? "amc-cell-weather-row" : "amc-weather-card";
        const metricsClass = compact ? "amc-cell-weather-copy" : "amc-weather-metrics";
        return `<span class="${cardClass}">
          <span class="amc-weather-head">
            <b>${day.label}</b>
            ${weatherIconsSvg(day.icons)}
          </span>
          <span class="${metricsClass}">
            ${weatherMetric("Cloud", day.cloudLabel, day.cloudSegments, "cloud")}
            ${weatherMetric("Temp", day.temperatureLabel, day.temperatureSegments, "temperature", "Temperature")}
            ${weatherMetric("Trans.", day.transparency, day.transparencySegments, "transparency", "Transparency")}
            ${weatherMetric("Seeing", day.seeingLabel, day.seeingSegments, "seeing")}
            ${weatherMetric("Wind", day.windLabel, day.windSegments, "wind")}
          </span>
        </span>`;
      }

      function weatherUpdatedLine() {
        if (!weatherUpdatedAt) return "";
        return `<span class="amc-weather-updated">Last updated ${formatWeatherUpdatedAge(weatherUpdatedAt)}</span>`;
      }

      function formatWeatherUpdatedAge(date) {
        const ageMs = Math.max(0, Date.now() - date.getTime());
        const minutes = Math.round(ageMs / 60000);
        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
        const days = Math.round(hours / 24);
        return `${days} day${days === 1 ? "" : "s"} ago`;
      }

      function weatherMetric(label, value, segments, css, ariaLabel = label) {
        const safeSegments = Array.isArray(segments) && segments.length ? segments : blankSegments();
        return `<span class="amc-weather-meter ${css}">
          <span class="amc-weather-label"><em>${label}:</em> <strong>${value}</strong></span>
          <span class="amc-weather-stack">
            <span class="amc-weather-segments" aria-label="${escapeHtml(ariaLabel)} through the night">
              ${safeSegments.map(segment => `<i style="--segment-colour:${segment.colour}" data-tooltip="${escapeHtml(segment.title)}" aria-label="${escapeHtml(segment.title)}" tabindex="0"></i>`).join("")}
            </span>
          </span>
        </span>`;
      }

      function iconSvg(name) {
        const icons = {
          sunrise: `<path d="M3 17.5h18"/><circle cx="12" cy="16.5" r="4.2"/><path d="M12 4.5v4M6.8 8.4l2 2M17.2 8.4l-2 2"/><path d="M18.5 5.5v7M15.5 8.5l3-3 3 3"/>`,
          sunset: `<path d="M3 17.5h18"/><circle cx="12" cy="16.5" r="4.2"/><path d="M12 4.5v4M6.8 8.4l2 2M17.2 8.4l-2 2"/><path d="M18.5 5.5v7M15.5 9.5l3 3 3-3"/>`,
          moonrise: `<path d="M3 17.5h18"/><path d="M12.8 4.5a6.7 6.7 0 1 0 5.1 11 7.6 7.6 0 0 1-7.7-10.2 6 6 0 0 1 2.6-.8Z"/><path d="M19 5v8M16 8l3-3 3 3"/>`,
          moonset: `<path d="M3 17.5h18"/><path d="M12.8 4.5a6.7 6.7 0 1 0 5.1 11 7.6 7.6 0 0 1-7.7-10.2 6 6 0 0 1 2.6-.8Z"/><path d="M19 5v8M16 10l3 3 3-3"/>`,
          alt: `<path d="M3 18h18"/><path d="M6 18a9 9 0 0 1 9-9"/><path d="M8 15l6-6"/><path d="M14 9h-5M14 9v5"/>`,
          az: `<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8v2.4M12 17.8v2.4M3.8 12h2.4M17.8 12h2.4"/><path d="M12 12l4.6-5.4-1.3 6.7-6.7 3.1L12 12Z"/><path d="M10.7 6.2 12 3.8l1.3 2.4"/>`,
          pin: `<path d="M12 21s6.5-5.8 6.5-11a6.5 6.5 0 0 0-13 0c0 5.2 6.5 11 6.5 11Z"/><circle cx="12" cy="10" r="2.2"/>`,
          moon: `<path d="M14.5 3.5a8.5 8.5 0 1 0 5.8 14.2A9.5 9.5 0 0 1 10.1 4a8.2 8.2 0 0 1 4.4-.5Z"/>`,
          night: `<path d="M3 17h18"/><path d="M6 14a6 6 0 0 1 12 0"/><path d="M7 5l.5 1.3L9 7l-1.5.7L7 9l-.5-1.3L5 7l1.5-.7L7 5ZM17 3l.4 1 1.1.5-1.1.5-.4 1-.4-1-1.1-.5 1.1-.5.4-1Z"/>`,
          themeMoon: `<path d="M14.5 3.5a8.5 8.5 0 1 0 5.8 14.2A9.5 9.5 0 0 1 10.1 4a8.2 8.2 0 0 1 4.4-.5Z"/>`,
          themeSun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>`
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.alt}</svg>`;
      }

      function weatherIconSvg(kind) {
        const icons = {
          clear: `<path d="M12 3l.9 2.8L16 7l-3.1 1.2L12 11l-.9-2.8L8 7l3.1-1.2L12 3Z"/><path d="M6 13l.6 1.8 1.9.7-1.9.7L6 19l-.6-1.8-1.9-.7 1.9-.7L6 13Z"/><path d="M18 13l.5 1.5 1.5.5-1.5.5L18 18l-.5-1.5-1.5-.5 1.5-.5L18 13Z"/>`,
          stars: `<path d="M12 3l.9 2.8L16 7l-3.1 1.2L12 11l-.9-2.8L8 7l3.1-1.2L12 3Z"/><path d="M6 13l.6 1.8 1.9.7-1.9.7L6 19l-.6-1.8-1.9-.7 1.9-.7L6 13Z"/><path d="M18 13l.5 1.5 1.5.5-1.5.5L18 18l-.5-1.5-1.5-.5 1.5-.5L18 13Z"/>`,
          mostlyClear: `<circle cx="8" cy="8" r="3"/><path d="M8 1.8v2M8 12v2M1.8 8h2M12 8h2M15 17h2.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.4 2"/>`,
          partly: `<circle cx="7.5" cy="7.5" r="3"/><path d="M7.5 2v1.5M2 7.5h1.5M11.5 4l1-1M6 17h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.3 2"/>`,
          cloudThreeStars: `<path d="M5.5 16.5h10.8a3.6 3.6 0 0 0 .3-7.2 4.9 4.9 0 0 0-9.2 1.8A3 3 0 0 0 5.5 16.5Z"/><path d="M6 4l.4 1.2 1.2.4-1.2.4L6 7.2 5.6 6 4.4 5.6l1.2-.4L6 4ZM12 2.7l.5 1.5 1.5.5-1.5.5L12 6.7l-.5-1.5-1.5-.5 1.5-.5.5-1.5ZM18 4l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4.4-1.2Z"/>`,
          cloudTwoStars: `<path d="M5.5 16.5h10.8a3.6 3.6 0 0 0 .3-7.2 4.9 4.9 0 0 0-9.2 1.8A3 3 0 0 0 5.5 16.5Z"/><path d="M8 4l.5 1.5 1.5.5-1.5.5L8 8l-.5-1.5L6 6l1.5-.5L8 4ZM17 3.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z"/>`,
          cloudOneStar: `<path d="M5.5 16.5h10.8a3.6 3.6 0 0 0 .3-7.2 4.9 4.9 0 0 0-9.2 1.8A3 3 0 0 0 5.5 16.5Z"/><path d="M16.8 3.8l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8Z"/>`,
          cloudy: `<path d="M6 17h11a4.5 4.5 0 0 0 .4-9 6 6 0 0 0-11.1 2.2A3.4 3.4 0 0 0 6 17Z"/>`,
          overcast: `<path d="M5 17h13a4 4 0 0 0 .2-8 5.5 5.5 0 0 0-10.5 1.2A3.5 3.5 0 0 0 5 17Z"/><path d="M4 20h16"/>`,
          fog: `<path d="M6 12h12M4 16h16M7 20h10M7 8a5 5 0 0 1 9.5-1.9A3.5 3.5 0 0 1 18 12"/>`,
          drizzle: `<path d="M7 14h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.2 2M8 18h.01M12 20h.01M16 18h.01"/>`,
          rain: `<path d="M7 14h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.2 2M8 18l-1 2M13 18l-1 2M18 18l-1 2"/>`,
          showers: `<path d="M7 13h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.2 2M8 17l-1 2M12 17l-1.3 3M16 17l-1 2M19 17l-1 2"/>`,
          freezing: `<path d="M7 14h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.2 2M9 18l-1 2M15 18l-1 2M18.5 19.5l-3 3M15.5 19.5l3 3"/>`,
          snow: `<path d="M7 14h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.2 2M8 20h.01M13 18.5l-1.5 1.5M11.5 18.5L13 20M18 20h.01"/>`,
          storm: `<path d="M7 14h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.2 2M13 14l-2 4h3l-2 4"/><path d="M18 18l-1 2"/>`
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icons[kind] || icons.cloudy}</svg>`;
      }

      function weatherIconsSvg(kinds) {
        const safeKinds = Array.isArray(kinds) && kinds.length ? kinds.slice(0, 3) : ["cloudy"];
        return `<span class="amc-weather-icons">${safeKinds.map(kind => weatherIconSvg(kind)).join("")}</span>`;
      }

      function tonightBest(day, events, moon) {
        if (Array.isArray(targetData[day]) && targetData[day].length) {
          return fillTargets(targetData[day], moon);
        }
        const eventTargets = eventDrivenTargets(events);
        if (eventTargets.length) return fillTargets(eventTargets, moon);
        return phaseDrivenTargets(moon);
      }

      function fillTargets(targets, moon) {
        const seen = new Set();
        const filled = [];
        [...targets, ...phaseDrivenTargets(moon)].forEach(target => {
          const key = String(target || "").trim().toLowerCase();
          if (!key || seen.has(key) || filled.length >= 3) return;
          seen.add(key);
          filled.push(String(target).trim());
        });
        return filled;
      }

      function eventDrivenTargets(events) {
        return uniqueText(events.map(targetFromEvent).filter(Boolean));
      }

      function targetFromEvent(item) {
        const text = `${item?.title || ""} ${item?.copy || ""}`.toLowerCase();
        if (/pleiades|m45|matariki/.test(text)) return "Pleiades (M45)";
        if (/saturn/.test(text)) return "Saturn";
        if (/venus/.test(text)) return "Venus";
        if (/jupiter/.test(text)) return "Jupiter";
        if (/mars/.test(text)) return "Mars";
        if (/neptune/.test(text)) return "Neptune";
        if (/mercury/.test(text)) return "Mercury";
        if (/comet 10p|tempel/.test(text)) return "Comet 10P/Tempel 2";
        if (/perseid|aquariid|capricornid|cygnid|aurigid|sextantid|meteor/.test(text)) return item.title;
        if (/eclipse/.test(text)) return item.title;
        if (/occultation/.test(text)) return item.title;
        if (/messier 5|m5\b/.test(text)) return "Messier 5";
        if (/messier 4|m4\b/.test(text)) return "Messier 4";
        if (/messier 15|m15\b/.test(text)) return "Messier 15";
        if (/messier 2|m2\b/.test(text)) return "Messier 2";
        if (/ngc 55/.test(text)) return "NGC 55";
        if (/47 tuc/.test(text)) return "47 Tucanae";
        if (/moon|lunar|quarter|full moon|new moon/.test(text)) return item.title;
        return "";
      }

      function uniqueText(items) {
        const seen = new Set();
        return items.filter(item => {
          const key = String(item || "").trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      function phaseDrivenTargets(moon) {
        if (moon.phase < 10) return ["Milky Way core", "Lagoon Nebula (M8)", "Trifid Nebula (M20)"];
        if (moon.phase < 25) return ["Crescent Moon", "Milky Way fields", "Comet 10P/Tempel 2"];
        if (moon.phase < 60) return ["Lunar terminator", "Saturn", "Bright clusters"];
        if (moon.phase < 88) return ["Gibbous Moon", "Saturn", "Bright clusters"];
        return ["Moonrise", "Lunar disc", "Saturn"];
      }

      function targetItem(target, day, moon) {
        const details = targetDetails(target, day, moon);
        const thumbnail = targetThumbnail(details.name, day);
        return `<li class="amc-target-card">
          <img src="${escapeHtml(thumbnail.src)}" alt="${escapeHtml(thumbnail.alt)}" loading="lazy" decoding="async" width="76" height="76">
          <span class="amc-target-copy">
            <b class="amc-target-name">${escapeHtml(details.name)}</b>
            <span class="amc-target-type">${escapeHtml(details.type)}</span>
            <span class="amc-target-facts">
              <span><em>Highest point in sky at</em><strong>${escapeHtml(details.peakTime)}</strong></span>
              <span><em>Max altitude</em><strong>${escapeHtml(details.maxAltitude)}</strong></span>
              <span><em>Moon brightness</em><strong>${escapeHtml(details.moonBrightness)}</strong></span>
              <span><em>Apparent size</em><strong>${escapeHtml(details.apparentSize)}</strong></span>
            </span>
          </span>
        </li>`;
      }

      function targetDetails(target, day, moon) {
        const meta = targetMeta(target);
        const observing = targetObservingInfo(meta, day);
        return {
          ...meta,
          peakTime: observing.peakTime,
          maxAltitude: observing.maxAltitude,
          moonBrightness: `${moon.phase}% lit`,
          apparentSize: meta.apparentSize || "varies"
        };
      }

      function targetMeta(target) {
        const name = String(target || "").trim();
        const text = name.toLowerCase();
        const catalogue = [
          { match: /lagoon|m8\b/, name: "Lagoon Nebula (M8)", type: "Emission nebula", ra: 18.06, dec: -24.38, apparentSize: "90 x 40 arcmin" },
          { match: /trifid|m20\b/, name: "Trifid Nebula (M20)", type: "Nebula", ra: 18.05, dec: -23.03, apparentSize: "28 arcmin" },
          { match: /milky way core/, name: "Milky Way core", type: "Wide-field", ra: 17.75, dec: -29.0, apparentSize: "wide-field" },
          { match: /milky way fields|twilight sky/, name: "Milky Way fields", type: "Wide-field", ra: 19.0, dec: -5.0, apparentSize: "wide-field" },
          { match: /pleiades|m45|matariki/, name: "Pleiades (M45)", type: "Open cluster", ra: 3.79, dec: 24.12, apparentSize: "110 arcmin" },
          { match: /messier 4|m4\b/, name: "Messier 4", type: "Globular cluster", ra: 16.39, dec: -26.53, apparentSize: "26 arcmin" },
          { match: /messier 5|m5\b/, name: "Messier 5", type: "Globular cluster", ra: 15.31, dec: 2.08, apparentSize: "23 arcmin" },
          { match: /messier 2|m2\b/, name: "Messier 2", type: "Globular cluster", ra: 21.56, dec: -0.82, apparentSize: "16 arcmin" },
          { match: /messier 15|m15\b/, name: "Messier 15", type: "Globular cluster", ra: 21.50, dec: 12.17, apparentSize: "18 arcmin" },
          { match: /ngc 55/, name: "NGC 55", type: "Galaxy", ra: 0.25, dec: -39.22, apparentSize: "32 x 6 arcmin" },
          { match: /47 tuc/, name: "47 Tucanae", type: "Globular cluster", ra: 0.40, dec: -72.08, apparentSize: "31 arcmin" },
          { match: /bright clusters|cluster/, name: "Bright clusters", type: "Star clusters", ra: 20.5, dec: 40.0, apparentSize: "varies" },
          { match: /aquariid|capricornid|perseid|cygnid|aurigid|sextantid|meteor/, name, type: "Meteor radiant", apparentSize: "wide radiant" },
          { match: /saturn/, name: "Saturn", type: "Planet", body: "Saturn", apparentSize: "15-20 arcsec" },
          { match: /jupiter/, name: "Jupiter", type: "Planet", body: "Jupiter", apparentSize: "30-50 arcsec" },
          { match: /venus/, name: "Venus", type: "Planet", body: "Venus", apparentSize: "10-60 arcsec" },
          { match: /mars/, name: "Mars", type: "Planet", body: "Mars", apparentSize: "4-25 arcsec" },
          { match: /mercury/, name: "Mercury", type: "Planet", body: "Mercury", apparentSize: "5-13 arcsec" },
          { match: /neptune/, name: "Neptune", type: "Planet", body: "Neptune", apparentSize: "2.3 arcsec" },
          { match: /uranus/, name: "Uranus", type: "Planet", body: "Uranus", apparentSize: "3.5-4 arcsec" },
          { match: /pluto/, name: "Pluto", type: "Dwarf planet", body: "Pluto", apparentSize: "0.1 arcsec" },
          { match: /comet|tempel/, name: "Comet 10P/Tempel 2", type: "Comet", apparentSize: "variable coma" },
          { match: /eclipse|solar|corona/, name, type: "Solar event", body: "Sun", apparentSize: "30-32 arcmin" },
          { match: /moon|lunar|crater|quarter|crescent|gibbous|full|moonrise|occultation/, name: lunarTargetName(name), type: "Moon", body: "Moon", apparentSize: "about 31 arcmin" }
        ];
        return catalogue.find(item => item.match.test(text)) || {
          name: name || "Night sky target",
          type: "Sky target",
          apparentSize: "varies"
        };
      }

      function lunarTargetName(target) {
        const text = String(target || "").toLowerCase();
        if (/moonrise/.test(text)) return "Moonrise";
        if (/terminator|quarter|crater/.test(text)) return "Lunar terminator";
        if (/crescent/.test(text)) return "Crescent Moon";
        if (/full|blue moon/.test(text)) return "Full Moon";
        return target || "Lunar disc";
      }

      function targetObservingInfo(meta, day) {
        if (!hasLocation || !Number.isFinite(currentLat) || !Number.isFinite(currentLon)) {
          return { peakTime: useCurrentLocationText, maxAltitude: useCurrentLocationText };
        }
        if (!meta.body && (!Number.isFinite(meta.ra) || !Number.isFinite(meta.dec))) {
          return { peakTime: "Check ephemeris", maxAltitude: "n/a" };
        }
        const Astronomy = window.Astronomy;
        if (!Astronomy) return { peakTime: "Unavailable", maxAltitude: "Unavailable" };
        try {
          const observer = new Astronomy.Observer(currentLat, currentLon, 0);
          const start = zonedDate(MONTH.year, MONTH.monthIndex, day, 18, 0, 0);
          const end = zonedDate(MONTH.year, MONTH.monthIndex, day + 1, 6, 0, 0);
          const durationMs = Math.max(1, end.getTime() - start.getTime());
          let best = null;
          for (let step = 0; step <= 48; step += 1) {
            const sample = new Date(start.getTime() + (step / 48) * durationMs);
            const altitude = targetAltitude(meta, sample, observer);
            if (!best || altitude > best.altitude) best = { date: sample, altitude };
          }
          if (!best || !Number.isFinite(best.altitude)) return { peakTime: "Unavailable", maxAltitude: "Unavailable" };
          if (best.altitude < 0) return { peakTime: "Below horizon", maxAltitude: "Below horizon" };
          return {
            peakTime: formatTimeValue(best.date),
            maxAltitude: `${Math.round(best.altitude)}°`
          };
        } catch {
          return { peakTime: "Unavailable", maxAltitude: "Unavailable" };
        }
      }

      function targetAltitude(meta, sample, observer) {
        const Astronomy = window.Astronomy;
        if (meta.body && Astronomy.Body[meta.body]) return bodyAltitude(Astronomy.Body[meta.body], sample, observer);
        return Astronomy.Horizon(sample, observer, meta.ra, meta.dec, "normal").altitude;
      }

      function targetThumbnail(target, day) {
        const text = String(target || "").toLowerCase();
        const wikimedia = wikimediaTargetThumbnail(text);
        if (wikimedia) return wikimedia;
        return { src: media.milkyWay?.src || moonImage(day, 216), alt: `${target} thumbnail` };
      }

      function wikimediaTargetThumbnail(text) {
        if (/saturn/.test(text)) return wikimediaImage("Saturn during Equinox.jpg", "Saturn thumbnail from Wikimedia Commons");
        if (/pleiades|m45/.test(text)) return wikimediaImage("Pleiades large.jpg", "Pleiades thumbnail from Wikimedia Commons");
        if (/lagoon|m8/.test(text)) return wikimediaImage("Lagoon Nebula.jpg", "Lagoon Nebula thumbnail from Wikimedia Commons");
        if (/trifid|m20/.test(text)) return wikimediaImage("Trifid.nebula.arp.750pix.jpg", "Trifid Nebula thumbnail from Wikimedia Commons");
        if (/comet/.test(text)) return wikimediaImage("Comet Hartley 2.jpg", "Comet thumbnail from Wikimedia Commons");
        if (/aquariid|capricornid|perseid|cygnid|aurigid|sextantid|meteor/.test(text)) return wikimediaImage("Perseid meteor shower.jpg", "Meteor shower thumbnail from Wikimedia Commons");
        if (/eclipse|solar|corona/.test(text)) return wikimediaImage("Total Solar Eclipse 8-21-17.jpg", "Solar eclipse thumbnail from Wikimedia Commons");
        if (/venus/.test(text)) return wikimediaImage("Venus-real color.jpg", "Venus thumbnail from Wikimedia Commons");
        if (/jupiter|mars|mercury|neptune|pluto|uranus|planet/.test(text)) return wikimediaImage("Solar System true color.jpg", "Planet thumbnail from Wikimedia Commons");
        if (/milky way/.test(text)) return wikimediaImage("ESO - Milky Way.jpg", "Milky Way thumbnail from Wikimedia Commons");
        if (/messier|m\d+\b|ngc|47 tuc|cluster|bright clusters/.test(text)) return wikimediaImage("Pleiades large.jpg", "Star cluster thumbnail from Wikimedia Commons");
        if (/moon|crater|lunar|occultation/.test(text)) return wikimediaImage("Full Moon Luc Viatour.jpg", "Moon thumbnail from Wikimedia Commons");
        return null;
      }

      function wikimediaImage(fileName, alt) {
        return {
          src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=320`,
          alt
        };
      }

      function articlePromo(article) {
        const image = article?.image || media.milkyWay?.src || "";
        const label = article?.kind || "Article";
        return `<a class="amc-article-promo" href="${escapeHtml(article.url)}" target="_blank" rel="noopener">
          <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" width="96" height="72">
          <span class="amc-article-copy">
            <small>${escapeHtml(label)}</small>
            <b>${escapeHtml(article.title)}</b>
          </span>
        </a>`;
      }

      function recommendedArticles(day, events, moon) {
        const primary = recommendedArticle(day, events, moon) || articleData.deepSky;
        const secondary = relatedArticleFor(primary, events, moon);
        return uniqueArticles([primary, secondary, articleData.deepSky, articleData.numbers]).slice(0, 2);
      }

      function relatedArticleFor(primary, events, moon) {
        const eventTypes = new Set(events.map(item => item.type));
        if (primary === articleData.deepSky) {
          if (eventTypes.has("meteor") || moon.phase < 18) return articleData.lightPollution || articleData.sqmReview || articleData.numbers;
          return articleData.numbers || articleData.lightPollution;
        }
        if (primary === articleData.telescope) return articleData.zwoReview || articleData.accessories || articleData.numbers;
        if (primary === articleData.planetary) return articleData.telescope || articleData.numbers;
        if (primary === articleData.launch) return articleData.planetary || articleData.numbers;
        if (primary === articleData.moon) return articleData.lightPollution || articleData.deepSky;
        if (primary === articleData.lightPollution) return articleData.sqmReview || articleData.deepSky;
        if (primary === articleData.accessories) return articleData.numbers || articleData.zwoReview;
        return articleData.accessories || articleData.deepSky;
      }

      function uniqueArticles(items) {
        const seen = new Set();
        return items.filter(item => {
          if (!item?.title || !item?.url || seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        });
      }

      function recommendedArticle(day, events, moon) {
        const eventTypes = new Set(events.map(item => item.type));
        const titleText = events.map(item => item.title).join(" ").toLowerCase();
        if (eventTypes.has("meteor")) return articleData.deepSky;
        if ((titleText.includes("milky way") || titleText.includes("pleiades")) && moon.phase < 35) return articleData.deepSky;
        if ((eventTypes.has("sky") || eventTypes.has("moon")) && moon.phase < 18) return articleData.deepSky;
        if (isMoonFreeWindow(day)) return articleData.deepSky;
        if (eventTypes.has("opposition") || eventTypes.has("telescope") || eventTypes.has("occultation")) return articleData.telescope;
        if (/\bmars\b|\bvenus\b|\bsaturn\b|\buranus\b|\bplanet\b/.test(titleText)) return articleData.planetary;
        if (eventTypes.has("launch")) return articleData.launch;
        if (eventTypes.has("moon") || moon.phase > 82) return articleData.moon;
        if (moon.phase < 18) return articleData.deepSky;
        if (moon.phase < 45) return articleData.lightPollution;
        if (day === 4 || day === 11 || day === 17) return articleData.telescope;
        if (day % 3 === 0) return articleData.accessories;
        return articleData.numbers;
      }

      function event(type, title, copy, fact, sourceIds, mediaAsset) {
        return { type, title, copy, fact, sourceIds, media: mediaAsset || null };
      }

      function moonForDay(day) {
        const data = moonData[day];
        return {
          phase: Number(data.phase.toFixed(1)),
          name: exactMoon[day] ? exactMoon[day].replace(/\s\d.*/, "") : phaseName(data.age),
          age: Number(data.age.toFixed(2)),
          distance: data.distance
        };
      }

      function isMoonFreeWindow(day) {
        const moon = moonData[day];
        return moon && Number(moon.phase) < 10;
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
        const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
        return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
      }

      function nasaImage(src, link) {
        return { src, link };
      }

      function nightSummary(nightInfo) {
        if (nightInfo.minutes === null) return nightInfo.label || useCurrentLocationText;
        if (!nightInfo.minutes) return "None";
        return `${nightInfo.label}, ${nightInfo.window}`;
      }

      function durationClock(nightInfo) {
        if (!nightInfo || nightInfo.minutes === null) return nightInfo?.label || useCurrentLocationText;
        const minutes = Math.max(0, Math.round(nightInfo.minutes || 0));
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, "0")}h:${String(m).padStart(2, "0")}m`;
      }

      function locationNeeded() {
        return {
          minutes: null,
          label: useCurrentLocationText,
          window: useCurrentLocationText,
          nautical: null
        };
      }

      function noDark(nautical = null) {
        return {
          minutes: 0,
          label: "None",
          window: "Sun stays above -18°",
          nautical
        };
      }

      function night(minutes, window, nautical = null) {
        return { minutes, label: formatDuration(minutes), window, nautical };
      }

      function formatDuration(minutes) {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
      }

      function initialSelectedDay() {
        return currentCalendarDay() || newMoonDay() || 1;
      }

      function currentCalendarDay() {
        const now = new Date();
        if (now.getFullYear() === MONTH.year && now.getMonth() === MONTH.monthIndex) return now.getDate();
        return null;
      }

      function isTodayDay(day) {
        return currentCalendarDay() === day;
      }

      function newMoonDay() {
        for (let day = 1; day <= (MONTH?.days || 31); day += 1) {
          if (isNewMoonDay(day)) return day;
        }
        return null;
      }

      function applySavedTheme() {
        const saved = safeStorageGet("amc-sky-calendar-theme");
        setTheme(saved === "dark" ? "dark" : "light");
      }

      function toggleTheme() {
        setTheme(root.dataset.theme === "dark" ? "light" : "dark");
      }

      function applySavedLocation() {
        const saved = readSavedLocation();
        if (!saved) return;
        locationName = saved.name || "Saved location";
        applyCoordinates(saved.lat, saved.lon, { fromStorage: true, timeZone: saved.timeZone });
        useLocationButton.textContent = useCurrentLocationText;
      }

      function readSavedLocation() {
        try {
          const raw = safeStorageGet(locationStorageKey);
          if (!raw) return null;
          const data = JSON.parse(raw);
          const lat = Number(data?.lat);
          const lon = Number(data?.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
          return {
            lat,
            lon,
            name: cleanName(data?.name),
            timeZone: cleanTimeZone(data?.timeZone)
          };
        } catch {
          return null;
        }
      }

      function saveLocation(lat, lon, name) {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        safeStorageSet(locationStorageKey, JSON.stringify({
          lat: Number(lat.toFixed(5)),
          lon: Number(lon.toFixed(5)),
          name: cleanName(name),
          timeZone: cleanTimeZone(locationTimeZone),
          savedAt: new Date().toISOString()
        }));
      }

      async function downloadPdf() {
        const previousTitle = document.title;
        const previousDay = selectedDay;
        const previousExpandedDay = expandedDay;
        const previousButtonText = downloadPdfButton.textContent;
        const sourcesPanel = root.querySelector(".amc-sources");
        const sourcesWasOpen = sourcesPanel ? sourcesPanel.open : false;
        document.title = `After Dark Calendar by Astromaniac_${monthLong[MONTH.monthIndex]} ${MONTH.year}`;
        root.classList.add("is-pdf-export");
        downloadPdfButton.disabled = true;
        downloadPdfButton.textContent = "Preparing PDF";
        if (sourcesPanel) sourcesPanel.open = false;
        grid.querySelectorAll(".amc-day").forEach(day => {
          day.setAttribute("aria-expanded", "false");
        });
        await Promise.race([waitForPrintImages(), wait(4500)]);
        window.setTimeout(() => {
          window.print();
          window.setTimeout(() => {
            root.classList.remove("is-pdf-export");
            downloadPdfButton.disabled = false;
            downloadPdfButton.textContent = previousButtonText;
            if (sourcesPanel) sourcesPanel.open = sourcesWasOpen;
            selectedDay = previousDay;
            expandedDay = previousExpandedDay;
            renderSelectedDay();
            document.title = previousTitle;
          }, 700);
        }, 80);
      }

      function waitForPrintImages() {
        const images = [...grid.querySelectorAll(".amc-moon-img")];
        return Promise.all(images.map(image => {
          if (image.complete) {
            if (!image.naturalWidth) return Promise.resolve();
            return image.decode ? image.decode().catch(() => undefined) : Promise.resolve();
          }
          return new Promise(resolve => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }));
      }

      function wait(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
      }

      function handleWeatherTipIn(event) {
        const segment = event.target.closest?.(".amc-weather-segments i");
        if (!segment || !root.contains(segment)) return;
        showWeatherTooltip(segment);
      }

      function handleWeatherTipOut(event) {
        const segment = event.target.closest?.(".amc-weather-segments i");
        if (!segment) return;
        hideWeatherTooltip();
      }

      function handleWeatherTipClick(event) {
        const segment = event.target.closest?.(".amc-weather-segments i");
        if (!segment || !root.contains(segment)) {
          hideWeatherTooltip();
          return;
        }
        event.stopPropagation();
        showWeatherTooltip(segment);
      }

      function showWeatherTooltip(segment) {
        const text = segment.dataset.tooltip;
        if (!text) return;
        weatherTooltip.textContent = text;
        weatherTooltip.classList.add("is-visible");
        positionWeatherTooltip(segment);
      }

      function hideWeatherTooltip() {
        weatherTooltip.classList.remove("is-visible");
      }

      function positionWeatherTooltip(segment) {
        const rootRect = root.getBoundingClientRect();
        const segmentRect = segment.getBoundingClientRect();
        const tooltipRect = weatherTooltip.getBoundingClientRect();
        const halfWidth = tooltipRect.width / 2;
        const x = clamp(segmentRect.left + segmentRect.width / 2 - rootRect.left, halfWidth + 10, rootRect.width - halfWidth - 10);
        let y = segmentRect.top - rootRect.top - tooltipRect.height - 10;
        if (y < 10) y = segmentRect.bottom - rootRect.top + 10;
        weatherTooltip.style.left = `${x}px`;
        weatherTooltip.style.top = `${clamp(y, 10, rootRect.height - tooltipRect.height - 10)}px`;
      }

      function setTheme(theme) {
        root.dataset.theme = theme;
        const nextMode = theme === "dark" ? "light" : "dark";
        themeToggle.innerHTML = iconSvg(theme === "dark" ? "themeSun" : "themeMoon");
        themeToggle.setAttribute("aria-label", `Switch to ${nextMode} mode`);
        themeToggle.title = `${nextMode.charAt(0).toUpperCase()}${nextMode.slice(1)} mode`;
        themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
        safeStorageSet("amc-sky-calendar-theme", theme);
      }

      async function useBrowserLocation() {
        if (!navigator.geolocation) {
          useLocationButton.textContent = "Unavailable";
          locationLabel.textContent = "Location unavailable";
          setLocationPrompt("Current location is not available in this browser. Search for a city instead.", true);
          window.setTimeout(() => {
            useLocationButton.textContent = useCurrentLocationText;
          }, 2200);
          return;
        }

        if (!window.isSecureContext && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
          locationLabel.textContent = "HTTPS required for current location";
          setLocationPrompt("Current location only works on HTTPS. GitHub Pages is fine once the site is published.", true);
          useLocationButton.textContent = useCurrentLocationText;
          return;
        }

        if (geolocationBlockedByPolicy()) {
          locationLabel.textContent = "Location blocked by embed";
          setLocationPrompt("The Squarespace iframe must include allow=\"geolocation\". Search for a city below until the embed is updated.", true);
          manualLocationInput?.focus({ preventScroll: true });
          return;
        }

        useLocationButton.disabled = true;
        useLocationButton.textContent = "Locating";
        locationLabel.textContent = "Finding location";
        setLocationPrompt("Your browser may ask for location permission.", false);
        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            applyCoordinates(lat, lon);
            useLocationButton.disabled = false;
            useLocationButton.textContent = "Using Current Location";
          },
          error => {
            useLocationButton.disabled = false;
            if (error?.code === error.PERMISSION_DENIED) {
              showLocationPermissionDenied();
            } else if (error?.code === error.POSITION_UNAVAILABLE) {
              locationLabel.textContent = "Current location unavailable";
              setLocationPrompt("Your device could not provide a location. Search for a city below.", true);
            } else {
              locationLabel.textContent = "Current location timed out";
              setLocationPrompt("Current location timed out. Try again, or search for a city below.", true);
            }
            useLocationButton.textContent = useCurrentLocationText;
            if (hasLocation) {
              window.setTimeout(() => {
                updateLocationLabel();
              }, 2600);
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 }
        );
      }

      function showLocationPermissionDenied() {
        useLocationButton.disabled = false;
        useLocationButton.textContent = useCurrentLocationText;
        locationLabel.textContent = "Location permission denied";
        const embedded = isEmbeddedFrame();
        setLocationPrompt(
          embedded
            ? "Location is being blocked by the embed. The iframe must include allow=\"geolocation\" and the page must be HTTPS. Search for a city below if it still fails."
            : "Location is blocked for this site. Click the lock or site settings icon by the address bar, set Location to Allow, reload, then try again. Or search for a city below.",
          true
        );
        manualLocationInput?.focus({ preventScroll: true });
      }

      function isEmbeddedFrame() {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
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

      async function useManualLocation(event) {
        event.preventDefault();
        const query = manualLocationInput.value.trim();
        if (!query) return;
        const submit = manualLocationForm.querySelector("button");
        submit.disabled = true;
        submit.textContent = "Setting";
        locationLabel.textContent = "Finding location";
        try {
          const parsed = parseCoordinateQuery(query);
          if (parsed) {
            locationName = parsed.name;
            applyCoordinates(parsed.lat, parsed.lon, { name: parsed.name });
            manualLocationInput.value = "";
            hideLocationResults();
            return;
          }
          const results = await geocodeLocationQuery(query);
          if (results.length > 1) {
            locationMatches = results;
            renderLocationResults(results);
            locationLabel.textContent = "Choose your location";
            return;
          }
          const result = results[0];
          if (!result) throw new Error("Manual location not found");
          locationName = result.name;
          applyCoordinates(result.lat, result.lon, { name: result.name, timeZone: result.timeZone, skipReverseGeocode: true });
          manualLocationInput.value = "";
          hideLocationResults();
        } catch {
          locationLabel.textContent = "Location not found";
        } finally {
          submit.disabled = false;
          submit.textContent = "Set";
        }
      }

      function parseCoordinateQuery(query) {
        const normalised = query.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
        const match = normalised.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
        if (!match) return null;
        const lat = Number(match[1]);
        const lon = Number(match[2]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
        return { lat, lon, name: `Manual location ${lat.toFixed(2)}, ${lon.toFixed(2)}` };
      }

      function handleManualLocationInput() {
        const query = manualLocationInput.value.trim();
        if (locationSearchTimer) window.clearTimeout(locationSearchTimer);
        if (query.length < 2 || parseCoordinateQuery(query)) {
          hideLocationResults();
          return;
        }
        locationSearchTimer = window.setTimeout(() => previewLocationQuery(query), 260);
      }

      async function previewLocationQuery(query) {
        const requestId = ++locationSearchRequestId;
        try {
          const results = await geocodeLocationQuery(query);
          if (requestId !== locationSearchRequestId || manualLocationInput.value.trim() !== query) return;
          locationMatches = results;
          renderLocationResults(results);
        } catch {
          if (requestId === locationSearchRequestId) hideLocationResults();
        }
      }

      function handleLocationResultClick(event) {
        const option = event.target.closest?.(".amc-location-option");
        if (!option || !locationResults?.contains(option)) return;
        const result = locationMatches[Number(option.dataset.locationIndex)];
        if (!result) return;
        selectLocationResult(result);
      }

      function handleLocationResultOutsideClick(event) {
        if (!locationResults || locationResults.hidden) return;
        if (manualLocationForm.contains(event.target)) return;
        hideLocationResults();
      }

      function selectLocationResult(result) {
        locationName = result.name;
        applyCoordinates(result.lat, result.lon, { name: result.name, timeZone: result.timeZone, skipReverseGeocode: true });
        manualLocationInput.value = "";
        hideLocationResults();
      }

      function renderLocationResults(results) {
        if (!locationResults) return;
        const safeResults = Array.isArray(results) ? results.filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lon)).slice(0, 10) : [];
        if (!safeResults.length) {
          hideLocationResults();
          return;
        }
        locationResults.innerHTML = safeResults.map((result, index) => `
          <button class="amc-location-option" type="button" role="option" data-location-index="${index}">
            <b>${escapeHtml(result.name)}</b>
            <span>${escapeHtml(result.detail)}</span>
          </button>
        `).join("");
        locationResults.hidden = false;
        manualLocationInput.setAttribute("aria-expanded", "true");
      }

      function hideLocationResults() {
        if (locationSearchTimer) window.clearTimeout(locationSearchTimer);
        locationSearchTimer = null;
        locationSearchRequestId += 1;
        locationMatches = [];
        if (!locationResults) return;
        locationResults.hidden = true;
        locationResults.innerHTML = "";
        manualLocationInput.setAttribute("aria-expanded", "false");
      }

      async function geocodeLocationQuery(query) {
        const params = new URLSearchParams({
          name: query,
          count: "10",
          language: "en",
          format: "json"
        });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Manual location lookup failed");
        const payload = await response.json();
        const results = Array.isArray(payload.results) ? payload.results.map(normaliseLocationResult).filter(Boolean) : [];
        if (!results.length) throw new Error("Manual location not found");
        return results;
      }

      function normaliseLocationResult(result) {
        const lat = Number(result.latitude);
        const lon = Number(result.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        const place = cleanName(result.name);
        const county = cleanName(result.admin2);
        const region = cleanName(result.admin1);
        const country = cleanName(result.country);
        const parts = [place, county, region, country].filter(Boolean);
        const deduped = parts.filter((part, index) => parts.indexOf(part) === index);
        const detailParts = [cleanTimeZone(result.timezone), `${lat.toFixed(3)}, ${lon.toFixed(3)}`].filter(Boolean);
        const detail = detailParts.join(" · ");
        return {
          lat,
          lon,
          name: deduped.join(", ") || place || "Selected location",
          detail: detail || `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
          timeZone: cleanTimeZone(result.timezone)
        };
      }

      function applyCoordinates(lat, lon, options = {}) {
        currentLat = lat;
        currentLon = lon;
        const nextTimeZone = cleanTimeZone(options.timeZone);
        if (nextTimeZone) locationTimeZone = nextTimeZone;
        weatherForecast = [];
        weatherState = "loading";
        weatherUpdatedAt = null;
        locationName = cleanName(options.name) || (options.fromStorage && locationName ? locationName : "Finding place");
        recalculateLocationData(lat, lon);
        hasLocation = true;
        saveLocation(lat, lon, locationName);
        root.classList.add("has-location");
        setLocationPrompt("Local timing and forecast are using your saved location.", false);
        updateLocationLabel();
        renderCalendar();
        renderSelectedDay();
        if (!options.skipReverseGeocode) updateLocationName(lat, lon);
        scheduleWeatherRefresh();
        updateWeather(lat, lon);
      }

      function recalculateLocationData(lat, lon) {
        nightData = {};
        skyData = {};
        for (let day = 1; day <= MONTH.days; day += 1) {
          nightData[day] = calculateAstroNight(day, lat, lon);
          skyData[day] = calculateDailySky(day, lat, lon);
        }
      }

      async function updateLocationName(lat, lon) {
        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) throw new Error("Location lookup failed");
          const data = await response.json();
          locationName = compactLocationName(data);
        } catch {
          locationName = "Current location";
        }
        saveLocation(lat, lon, locationName);
        updateLocationLabel();
        renderSelectedDay();
      }

      async function updateWeather(lat, lon, options = {}) {
        const requestId = ++weatherRequestId;
        if (!options.silent) {
          weatherState = "loading";
          renderCalendar();
          renderSelectedDay();
        }
        try {
          const params = new URLSearchParams({
            latitude: String(lat),
            longitude: String(lon),
            hourly: "cloud_cover,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,temperature_2m",
            daily: "weather_code",
            timezone: "auto",
            forecast_days: "8"
          });
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Weather lookup failed");
          const payload = await response.json();
          if (requestId !== weatherRequestId || lat !== currentLat || lon !== currentLon) return;
          const forecastTimeZone = cleanTimeZone(payload.timezone);
          if (forecastTimeZone && forecastTimeZone !== locationTimeZone) {
            locationTimeZone = forecastTimeZone;
            recalculateLocationData(lat, lon);
            saveLocation(lat, lon, locationName);
          }
          weatherForecast = summariseWeather(payload);
          weatherState = weatherForecast.length ? "ready" : "error";
          if (weatherForecast.length) weatherUpdatedAt = new Date();
        } catch {
          if (requestId !== weatherRequestId) return;
          if (!options.silent || !weatherForecast.length) {
            weatherForecast = [];
            weatherState = "error";
            weatherUpdatedAt = null;
          }
        } finally {
          if (requestId === weatherRequestId) {
            renderCalendar();
            renderSelectedDay();
          }
        }
      }

      function scheduleWeatherRefresh() {
        if (weatherRefreshTimer) window.clearInterval(weatherRefreshTimer);
        weatherRefreshTimer = null;
        if (!hasLocation || !Number.isFinite(currentLat) || !Number.isFinite(currentLon)) return;
        weatherRefreshTimer = window.setInterval(() => {
          if (document.visibilityState === "visible") refreshWeather({ silent: true });
        }, weatherRefreshMs);
      }

      function refreshWeather(options = {}) {
        if (!hasLocation || !Number.isFinite(currentLat) || !Number.isFinite(currentLon)) return Promise.resolve();
        return updateWeather(currentLat, currentLon, options);
      }

      function refreshWeatherWhenVisible() {
        if (document.visibilityState !== "visible") return;
        if (!weatherUpdatedAt || Date.now() - weatherUpdatedAt.getTime() >= weatherRefreshMs) {
          refreshWeather({ silent: true });
        }
      }

      function compactLocationName(data) {
        const city = cleanName(data.city || data.locality);
        const region = cleanName(data.principalSubdivision);
        const country = cleanName(data.countryName);
        const parts = [];
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);
        if (!parts.length && country) parts.push(country);
        return parts.join(", ") || "Current location";
      }

      function cleanName(value) {
        return String(value || "")
          .replace("United Kingdom of Great Britain and Northern Ireland (the)", "United Kingdom")
          .trim();
      }

      function cleanTimeZone(value) {
        const timeZone = String(value || "").trim();
        if (!timeZone || !isValidTimeZone(timeZone)) return "";
        return timeZone;
      }

      function browserTimeZone() {
        return cleanTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";
      }

      function isValidTimeZone(timeZone) {
        try {
          new Intl.DateTimeFormat("en-GB", { timeZone }).format(new Date());
          return true;
        } catch {
          return false;
        }
      }

      function setLocationPrompt(message, isWarning = false) {
        if (!locationPrompt) return;
        locationPrompt.textContent = message;
        locationPrompt.classList.toggle("is-warning", Boolean(isWarning));
      }

      function updateLocationLabel() {
        locationLabel.innerHTML = locationPill(locationDisplay());
      }

      function locationDisplay() {
        if (!hasLocation) return "Location not set";
        return locationName || "Current location";
      }

      function locationPill(label) {
        return `${iconSvg("pin")}<span>${escapeHtml(label)}</span>`;
      }

      function summariseWeather(payload) {
        const hourly = payload.hourly || {};
        const daily = payload.daily || {};
        const days = (daily.time || []).slice(0, 7);
        return days.map((dateKey, index) => {
          const quarters = nightWeatherQuarters(hourly, dateKey);
          const samples = mergeQuarterSamples(quarters);
          const cloud = average(samples.cloud);
          const humidity = average(samples.humidity);
          const precipitation = average(samples.precipitation);
          const wind = average(samples.wind);
          const temperature = average(samples.temperature);
          const code = dominantWeatherCode(samples.codes, daily.weather_code?.[index]);
          const transparency = transparencyInfo(cloud, humidity, precipitation);
          const windKmh = Number.isFinite(wind) ? wind : NaN;
          const seeing = seeingInfo(cloud, humidity, windKmh, temperature);
          const quarterSegments = quarters.map((quarter, quarterIndex) => {
            const qCloud = average(quarter.cloud);
            const qHumidity = average(quarter.humidity);
            const qPrecipitation = average(quarter.precipitation);
            const qWind = average(quarter.wind);
            const qTemperature = average(quarter.temperature);
            const qCode = dominantWeatherCode(quarter.codes, code);
            const qTransparency = transparencyInfo(qCloud, qHumidity, qPrecipitation);
            const qSeeing = seeingInfo(qCloud, qHumidity, qWind, qTemperature);
            return {
              label: quarterLabels[quarterIndex],
              cloud: qCloud,
              temperature: qTemperature,
              transparency: qTransparency,
              seeing: qSeeing,
              wind: qWind,
              kind: weatherKind(qCode, qCloud)
            };
          });
          return {
            dateKey,
            label: shortWeatherDate(dateKey, index),
            cloudLabel: Number.isFinite(cloud) ? `${Math.round(cloud)}%` : "n/a",
            cloudValue: Number.isFinite(cloud) ? cloud : 0,
            cloudQuality: inverseQuality(cloud, 30, 65),
            cloudSegments: quarterSegments.map(segment => cloudSegment(segment.cloud, segment.label)),
            precipitationLabel: Number.isFinite(precipitation) ? `${Math.round(precipitation)}%` : "n/a",
            precipitationValue: Number.isFinite(precipitation) ? precipitation : 0,
            precipitationQuality: inverseQuality(precipitation, 10, 35),
            temperatureLabel: Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : "n/a",
            temperatureSegments: quarterSegments.map(segment => temperatureSegment(segment.temperature, segment.label)),
            windLabel: Number.isFinite(windKmh) ? `${Math.round(windKmh)} km/h` : "n/a",
            windValue: Number.isFinite(windKmh) ? clamp((windKmh / 40) * 100, 0, 100) : 0,
            windQuality: inverseQuality(windKmh, 15, 28),
            windSegments: quarterSegments.map(segment => windSegment(segment.wind, segment.label)),
            transparency: transparency.label,
            transparencyValue: transparency.score,
            transparencyQuality: directQuality(transparency.score, 65, 40),
            transparencySegments: quarterSegments.map(segment => transparencySegment(segment.transparency, segment.label)),
            seeingLabel: seeing.label,
            seeingSegments: quarterSegments.map(segment => seeingSegment(segment.seeing, segment.label)),
            kind: weatherKind(code, cloud),
            icons: weatherIconKinds(quarterSegments, weatherKind(code, cloud))
          };
        });
      }

      function findWeatherForDay(day) {
        const dateKey = `${MONTH.year}-${String(MONTH.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return weatherForecast.find(item => item.dateKey === dateKey) || null;
      }

      const quarterLabels = ["16-20", "20-00", "00-04", "04-08"];

      function nightWeatherQuarters(hourly, dateKey) {
        const nextKey = addIsoDate(dateKey, 1);
        const quarters = Array.from({ length: 4 }, () => ({ cloud: [], humidity: [], precipitation: [], wind: [], temperature: [], codes: [] }));
        (hourly.time || []).forEach((time, index) => {
          const [dayPart, clock = ""] = String(time).split("T");
          const hour = Number(clock.slice(0, 2));
          if (!Number.isFinite(hour)) return;
          let quarter = -1;
          if (dayPart === dateKey && hour >= 16 && hour < 20) quarter = 0;
          if (dayPart === dateKey && hour >= 20) quarter = 1;
          if (dayPart === nextKey && hour < 4) quarter = 2;
          if (dayPart === nextKey && hour >= 4 && hour < 8) quarter = 3;
          if (quarter < 0) return;
          pushNumber(quarters[quarter].cloud, hourly.cloud_cover?.[index]);
          pushNumber(quarters[quarter].humidity, hourly.relative_humidity_2m?.[index]);
          pushNumber(quarters[quarter].precipitation, hourly.precipitation_probability?.[index]);
          pushNumber(quarters[quarter].wind, hourly.wind_speed_10m?.[index]);
          pushNumber(quarters[quarter].temperature, hourly.temperature_2m?.[index]);
          pushNumber(quarters[quarter].codes, hourly.weather_code?.[index]);
        });
        return quarters;
      }

      function mergeQuarterSamples(quarters) {
        return quarters.reduce((merged, quarter) => {
          merged.cloud.push(...quarter.cloud);
          merged.humidity.push(...quarter.humidity);
          merged.precipitation.push(...quarter.precipitation);
          merged.wind.push(...quarter.wind);
          merged.temperature.push(...quarter.temperature);
          merged.codes.push(...quarter.codes);
          return merged;
        }, { cloud: [], humidity: [], precipitation: [], wind: [], temperature: [], codes: [] });
      }

      function pushNumber(target, value) {
        const number = Number(value);
        if (Number.isFinite(number)) target.push(number);
      }

      function average(values) {
        if (!values.length) return NaN;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      }

      function dominantWeatherCode(codes, fallback) {
        if (!codes.length) return Number.isFinite(Number(fallback)) ? Number(fallback) : 3;
        return codes.reduce((worst, code) => weatherSeverity(code) > weatherSeverity(worst) ? code : worst, codes[0]);
      }

      function weatherSeverity(code) {
        if (code >= 95) return 7;
        if (code >= 71) return 6;
        if (code >= 51) return 5;
        if (code === 45 || code === 48) return 4;
        if (code === 3) return 3;
        if (code === 2) return 2;
        if (code === 1) return 1;
        return 0;
      }

      function transparencyInfo(cloud, humidity, precipitation) {
        if (!Number.isFinite(cloud)) return { label: "n/a", score: 0 };
        const humidityPenalty = Number.isFinite(humidity) ? Math.max(0, humidity - 55) * 0.55 : 0;
        const rainPenalty = Number.isFinite(precipitation) ? precipitation * 0.35 : 0;
        const score = Math.max(0, Math.min(100, 100 - cloud * 0.68 - humidityPenalty - rainPenalty));
        if (score >= 75) return { label: "Excellent", score };
        if (score >= 58) return { label: "Good", score };
        if (score >= 38) return { label: "Fair", score };
        return { label: "Poor", score };
      }

      function seeingInfo(cloud, humidity, wind, temperature) {
        if (![cloud, humidity, wind].some(Number.isFinite)) return { label: "n/a", score: 0 };
        const cloudPenalty = Number.isFinite(cloud) ? cloud * 0.2 : 20;
        const windPenalty = Number.isFinite(wind) ? Math.max(0, wind - 4) * 1.65 : 18;
        const humidityPenalty = Number.isFinite(humidity) ? Math.max(0, humidity - 70) * 0.22 : 8;
        const temperaturePenalty = Number.isFinite(temperature) && temperature < -5 ? 5 : 0;
        const score = clamp(100 - cloudPenalty - windPenalty - humidityPenalty - temperaturePenalty, 0, 100);
        if (score >= 76) return { label: "Excellent", score };
        if (score >= 58) return { label: "Good", score };
        if (score >= 38) return { label: "Average", score };
        return { label: "Poor", score };
      }

      function cloudSegment(value, label) {
        const rounded = Number.isFinite(value) ? `${Math.round(value)}%` : "n/a";
        return {
          colour: cloudColour(value),
          title: `${label}: Cloud ${rounded}`
        };
      }

      function transparencySegment(info, label) {
        const value = info?.label || "n/a";
        return {
          colour: transparencyColour(info?.score),
          title: `${label}: Transparency ${value}`
        };
      }

      function seeingSegment(info, label) {
        const value = info?.label || "n/a";
        return {
          colour: seeingColour(info?.label),
          title: `${label}: ${value} Seeing`
        };
      }

      function windSegment(value, label) {
        const rounded = Number.isFinite(value) ? `${Math.round(value)} km/h` : "n/a";
        return {
          colour: windColour(value),
          title: `${label}: Wind ${rounded}`
        };
      }

      function temperatureSegment(value, label) {
        const rounded = Number.isFinite(value) ? `${Math.round(value)}°C` : "n/a";
        return {
          colour: temperatureColour(value),
          title: `${label}: Temperature ${rounded}`
        };
      }

      function blankSegments() {
        return quarterLabels.map(label => ({
          colour: "rgba(139,146,156,.28)",
          title: `${label}: unavailable`
        }));
      }

      function cloudColour(value) {
        if (!Number.isFinite(value)) return "rgba(139,146,156,.28)";
        if (value <= 15) return "#083b7a";
        if (value <= 40) return "#2f73c8";
        if (value <= 70) return "#9ed8ff";
        return "#f8fbff";
      }

      function transparencyColour(score) {
        if (!Number.isFinite(score)) return "rgba(139,146,156,.28)";
        if (score >= 75) return "#2f73c8";
        if (score >= 58) return "#148cff";
        if (score >= 38) return "#36d6ff";
        return "#f8fbff";
      }

      function seeingColour(label) {
        if (label === "Excellent") return "#061d49";
        if (label === "Good") return "#083b7a";
        if (label === "Average") return "#2369b7";
        if (label === "Poor") return "#36d6ff";
        return "rgba(139,146,156,.28)";
      }

      function windColour(value) {
        if (!Number.isFinite(value)) return "rgba(139,146,156,.28)";
        if (value <= 6) return "#fff2cc";
        if (value <= 15) return "#f2c14e";
        if (value <= 28) return "#d9782f";
        return "#7a4a24";
      }

      function temperatureColour(value) {
        if (!Number.isFinite(value)) return "rgba(139,146,156,.28)";
        if (value < 0) return "#1f6feb";
        if (value < 10) return "#35a852";
        if (value < 15) return "#f2c94c";
        if (value < 20) return "#f2994a";
        if (value < 25) return "#e84a4a";
        if (value < 30) return "#9f1d1d";
        return "#6b001f";
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function directQuality(value, goodAt, badBelow) {
        if (!Number.isFinite(value)) return "ok";
        if (value >= goodAt) return "good";
        if (value < badBelow) return "bad";
        return "ok";
      }

      function inverseQuality(value, goodAtOrBelow, badAbove) {
        if (!Number.isFinite(value)) return "ok";
        if (value <= goodAtOrBelow) return "good";
        if (value > badAbove) return "bad";
        return "ok";
      }

      function qualityColour(quality) {
        if (quality === "good") return "var(--good)";
        if (quality === "bad") return "var(--bad)";
        return "var(--ok)";
      }

      function weatherKind(code, cloud) {
        if (code >= 95) return "storm";
        if (code >= 85) return "snow";
        if (code >= 80) return "showers";
        if (code >= 71) return "snow";
        if (code >= 66) return "freezing";
        if (code >= 61) return "rain";
        if (code >= 51) return "drizzle";
        if (code === 45 || code === 48) return "fog";
        if (code === 0 && cloud <= 20) return "clear";
        if (code === 1 || cloud <= 35) return "mostlyClear";
        if (code === 2 || cloud <= 70) return "partly";
        if (code === 3 || cloud >= 88) return "overcast";
        return "cloudy";
      }

      function weatherIconKinds(segments, fallback) {
        const quarterIcons = (segments || [])
          .map(segment => forecastIconKind(segment, fallback))
          .filter(Boolean);
        if (!quarterIcons.length) return repeatIcon(fallback || "cloudy", 3);
        if (quarterIcons.every(kind => kind === "stars")) return repeatIcon("stars", 3);
        if (quarterIcons.every(kind => kind === quarterIcons[0])) return repeatIcon(quarterIcons[0], 3);

        const runs = iconRuns(quarterIcons);
        if (runs.length === 2) {
          return runs[0].count >= runs[1].count
            ? [runs[0].kind, runs[0].kind, runs[1].kind]
            : [runs[0].kind, runs[1].kind, runs[1].kind];
        }
        if (runs.length === 3) return runs.map(run => run.kind);
        const sampled = [quarterIcons[0], quarterIcons[1], quarterIcons[quarterIcons.length - 1]];
        while (sampled.length < 3) sampled.push(sampled[sampled.length - 1] || fallback || "cloudy");
        return sampled.slice(0, 3);
      }

      function forecastIconKind(segment, fallback) {
        const severe = ["storm", "snow", "showers", "freezing", "rain", "drizzle", "fog"];
        if (severe.includes(segment?.kind)) return segment.kind;
        const cloud = Number(segment?.cloud);
        if (!Number.isFinite(cloud)) return fallback || "cloudy";
        if (cloud <= 10) return "stars";
        if (cloud <= 30) return "cloudThreeStars";
        if (cloud <= 50) return "cloudTwoStars";
        if (cloud <= 80) return "cloudOneStar";
        return "cloudy";
      }

      function repeatIcon(kind, count) {
        return Array.from({ length: count }, () => kind);
      }

      function iconRuns(kinds) {
        return kinds.reduce((runs, kind) => {
          const last = runs[runs.length - 1];
          if (last?.kind === kind) last.count += 1;
          else runs.push({ kind, count: 1 });
          return runs;
        }, []);
      }

      function shortWeatherDate(dateKey, index) {
        const [year, month, day] = dateKey.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, 12));
        const label = `${date.getUTCDate()} ${monthShort[date.getUTCMonth()]}`;
        return index === 0 ? `Tonight, ${label}` : label;
      }

      function addIsoDate(dateKey, days) {
        const [year, month, day] = dateKey.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day + days, 12));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function formatNumber(value) {
        return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        } catch {
          return false;
        }
        return true;
      }

      function calculateDailySky(day, lat, lon) {
        const Astronomy = window.Astronomy;
        if (!Astronomy) return unavailableSky();

        try {
          const observer = new Astronomy.Observer(lat, lon, 0);
          const sample = zonedDate(MONTH.year, MONTH.monthIndex, day, 22, 0, 0);
          const start = zonedDate(MONTH.year, MONTH.monthIndex, day, 0, 0, 0);
          const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, sample, observer, true, true);
          const moonHorizon = Astronomy.Horizon(sample, observer, moonEquator.ra, moonEquator.dec, "normal");
          const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, start, 1);
          const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, start, 1);
          const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, start, 1);
          const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, start, 1);

          return {
            moonAltLabel: `${Math.round(moonHorizon.altitude)}°`,
            moonAzLabel: `${Math.round(moonHorizon.azimuth)}°`,
            moonriseLabel: formatAstroTimeValue(moonrise),
            moonsetLabel: formatAstroTimeValue(moonset),
            sunriseLabel: formatAstroTimeValue(sunrise),
            sunsetLabel: formatAstroTimeValue(sunset),
            timeline: buildNightTimeline(day, observer)
          };
        } catch {
          return unavailableSky();
        }
      }

      function buildNightTimeline(day, observer) {
        const Astronomy = window.Astronomy;
        const start = zonedDate(MONTH.year, MONTH.monthIndex, day, 18, 0, 0);
        const end = zonedDate(MONTH.year, MONTH.monthIndex, day + 1, 6, 0, 0);
        const durationMs = Math.max(1, end.getTime() - start.getTime());
        const steps = 48;
        const moonSamples = [];
        const darknessStates = [];
        for (let step = 0; step < steps; step += 1) {
          const sample = new Date(start.getTime() + (step / steps) * durationMs);
          const sunAltitude = bodyAltitude(Astronomy.Body.Sun, sample, observer);
          const moonAltitude = bodyAltitude(Astronomy.Body.Moon, sample, observer);
          moonSamples.push({ hour: chartHour(sample, start, end), altitude: moonAltitude });
          darknessStates.push(darknessState(sunAltitude));
        }
        moonSamples.push({
          hour: 12,
          altitude: bodyAltitude(Astronomy.Body.Moon, end, observer)
        });
        const rise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, start, 0.55);
        const set = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, start, 0.55);
        const markers = [chartMarker(rise, start, end, "Rise"), chartMarker(set, start, end, "Set")].filter(Boolean);
        const labels = astronomicalLabels(day, observer, start, end);
        return {
          bands: compressBands(darknessStates),
          moonSegments: moonVisibleSegments(moonSamples),
          markers,
          twilightMarkers: labels.markers,
          astroStartLabel: labels.start,
          astroEndLabel: labels.end,
          shortAstroLabel: labels.short
        };
      }

      function bodyAltitude(body, sample, observer) {
        const Astronomy = window.Astronomy;
        const equator = Astronomy.Equator(body, sample, observer, true, true);
        return Astronomy.Horizon(sample, observer, equator.ra, equator.dec, "normal").altitude;
      }

      function darknessState(altitude) {
        if (!Number.isFinite(altitude)) return "light";
        if (altitude <= -18) return "dark";
        if (altitude <= -12) return "astro";
        if (altitude <= -6) return "nautical";
        return "light";
      }

      function compressBands(states) {
        if (!states.length) return [{ startHour: 0, endHour: 12, state: "light" }];
        const bands = [];
        let runStart = 0;
        for (let index = 1; index <= states.length; index += 1) {
          if (states[index] === states[runStart]) continue;
          bands.push({
            startHour: Number(((runStart / states.length) * 12).toFixed(3)),
            endHour: Number(((index / states.length) * 12).toFixed(3)),
            state: states[runStart]
          });
          runStart = index;
        }
        return bands;
      }

      function moonVisibleSegments(samples) {
        const segments = [];
        let current = [];
        samples.forEach(sample => {
          if (sample.altitude >= 0) {
            current.push(sample);
            return;
          }
          if (current.length) segments.push(current);
          current = [];
        });
        if (current.length) segments.push(current);
        return segments;
      }

      function chartMarker(event, start, end, label) {
        const date = event?.date;
        if (!date || date < start || date > end) return null;
        return {
          hour: chartHour(date, start, end),
          label,
          time: formatLocal(date)
        };
      }

      function astronomicalLabels(day, observer, start, end) {
        const Astronomy = window.Astronomy;
        const noon = zonedDate(MONTH.year, MONTH.monthIndex, day, 12, 0, 0);
        const astroStart = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, -12);
        const darkStart = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, -18);
        const darkEnd = darkStart ? Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, darkStart.date, 1.5, -18) : null;
        const astroEnd = astroStart ? Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, astroStart.date, 1.5, -12) : null;
        const astroEndPoint = darkStart?.date ? darkStart : astroEnd;
        const markers = [
          chartTwilightMarker(astroStart, start, end, "Astro begins", "start"),
          chartTwilightMarker(astroEndPoint, start, end, "Astro ends", "end")
        ].filter(Boolean);
        const startText = astroStart?.date && astroStart.date >= start && astroStart.date <= end
          ? `Astronomical twilight begins ${formatLocal(astroStart.date)}`
          : "Astronomical twilight begins outside chart";
        const endText = darkStart?.date && darkStart.date >= start && darkStart.date <= end
          ? `Astronomical twilight ends ${formatLocal(darkStart.date)}`
          : astroEnd?.date && astroEnd.date >= start && astroEnd.date <= end
            ? `Astronomical twilight ends ${formatLocal(astroEnd.date)}`
            : "Full darkness unavailable";
        const darkText = darkStart?.date && darkEnd?.date
          ? `Full darkness ${formatLocal(darkStart.date)}-${formatLocal(darkEnd.date)}`
          : "No full darkness";
        return {
          markers,
          start: startText,
          end: endText,
          short: darkText
        };
      }

      function chartTwilightMarker(event, start, end, label, type) {
        const date = event?.date;
        if (!date || date < start || date > end) return null;
        return {
          hour: chartHour(date, start, end),
          label,
          time: formatLocal(date),
          type
        };
      }

      function chartHour(date, start, end) {
        return Number((12 * (date.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime())).toFixed(3));
      }

      function twilightWindow(day, observer, altitude) {
        const Astronomy = window.Astronomy;
        const noon = zonedDate(MONTH.year, MONTH.monthIndex, day, 12, 0, 0);
        const dusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, altitude);
        if (!dusk?.date) return null;
        const dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, dusk.date, 1.5, altitude);
        if (!dawn?.date || dawn.date <= dusk.date) return null;
        const minutes = Math.round((dawn.date.getTime() - dusk.date.getTime()) / 60000);
        return {
          minutes,
          window: `${formatTimeValue(dusk.date)}-${formatTimeValue(dawn.date)}`,
          range: `${formatLocal(dusk.date)} to ${formatLocal(dawn.date)}`
        };
      }

      function calculateAstroNight(day, lat, lon) {
        const Astronomy = window.Astronomy;
        if (!Astronomy) return unavailableNight();

        try {
          const observer = new Astronomy.Observer(lat, lon, 0);
          const noon = zonedDate(MONTH.year, MONTH.monthIndex, day, 12, 0, 0);
          const nautical = twilightWindow(day, observer, -12);
          const dusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, noon, 1, -18);
          if (!dusk) return noDark(nautical);
          const dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, dusk.date, 1.5, -18);
          if (!dawn || dawn.date <= dusk.date) return noDark(nautical);
          const minutes = Math.round((dawn.date.getTime() - dusk.date.getTime()) / 60000);
          return night(minutes, `${formatLocal(dusk.date)} to ${formatLocal(dawn.date)}`, nautical);
        } catch {
          return unavailableNight();
        }
      }

      function unavailableSky() {
        return {
          moonAltLabel: "Unavailable",
          moonAzLabel: "Unavailable",
          moonriseLabel: "Unavailable",
          moonsetLabel: "Unavailable",
          sunriseLabel: "Unavailable",
          sunsetLabel: "Unavailable",
          timeline: null
        };
      }

      function unavailableNight() {
        return {
          minutes: null,
          label: "Unavailable",
          window: "Astronomy calculation unavailable",
          nautical: null
        };
      }

      function formatAstroTimeValue(astroTime) {
        return formatTimeValue(astroTime?.date || null);
      }

      function formatTimeValue(date) {
        if (!date) return "None";
        const parts = zonedDateParts(date);
        return `${parts.hour}:${parts.minute}`;
      }

      function formatLocal(date) {
        const parts = zonedDateParts(date);
        return `${Number(parts.day)} ${monthShort[Number(parts.month) - 1]} ${parts.hour}:${parts.minute}`;
      }

      function zonedDate(year, monthIndex, day, hour = 0, minute = 0, second = 0) {
        const timeZone = cleanTimeZone(locationTimeZone) || "UTC";
        const utcGuess = Date.UTC(year, monthIndex, day, hour, minute, second);
        let offset = timeZoneOffsetMinutes(new Date(utcGuess), timeZone);
        let zoned = new Date(utcGuess - offset * 60000);
        const correctedOffset = timeZoneOffsetMinutes(zoned, timeZone);
        if (correctedOffset !== offset) {
          zoned = new Date(utcGuess - correctedOffset * 60000);
        }
        return zoned;
      }

      function timeZoneOffsetMinutes(date, timeZone) {
        const parts = zonedDateParts(date, timeZone);
        const asUtc = Date.UTC(
          Number(parts.year),
          Number(parts.month) - 1,
          Number(parts.day),
          Number(parts.hour),
          Number(parts.minute),
          Number(parts.second)
        );
        return (asUtc - date.getTime()) / 60000;
      }

      function zonedDateParts(date, timeZone = locationTimeZone) {
        const formatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: cleanTimeZone(timeZone) || "UTC",
          hourCycle: "h23",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        const parts = {};
        formatter.formatToParts(date).forEach(part => {
          if (part.type !== "literal") parts[part.type] = part.value;
        });
        if (parts.hour === "24") parts.hour = "00";
        return parts;
      }
    })();

