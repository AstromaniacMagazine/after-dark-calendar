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
    tooltip: root.querySelector("#amc-weather-tooltip"),
    mobileDayNav: root.querySelector("#amc-mobile-day-nav"),
    mobileDayRail: root.querySelector("#amc-mobile-day-rail"),
    feedbackLink: root.querySelector(".amc-feedback-link"),
    backToTop: root.querySelector("#amc-back-to-top"),
    rememberLocations: root.querySelector("#amc-remember-locations"),
    rememberTheme: root.querySelector("#amc-remember-theme"),
    clearLocations: root.querySelector("#amc-clear-locations"),
    privacyStatus: root.querySelector("#amc-privacy-status")
  };

  const zonedFormatters = new Map();
  const validTimeZones = new Map();
  const shared = window.AMC_SHARED || {};
  const manifest = Array.isArray(window.AMC_MONTH_MANIFEST) ? window.AMC_MONTH_MANIFEST : [];
  const assetVersion = root.dataset.assetVersion || root.dataset.version || "";
  const assetBase = root.dataset.assetBase || "";
  const locationKey = "amc-sky-calendar-location";
  const historyKey = "amc-location-history";
  const rememberKey = "amc-remember-locations";
  const themePreferenceKey = "amc-remember-theme";
  const themeKey = "amc-sky-calendar-theme";
  const themeOrder = ["light", "dark", "red", "teal"];
  const chartStartHour = 16;
  const chartEndHour = 8;
  const chartDurationHours = 16;
  const chartSampleCount = 64;
  const weatherRefreshMs = 75 * 60 * 1000;
  const weatherRetryMs = 15 * 60 * 1000;
  const locationMemoryMs = 30 * 24 * 60 * 60 * 1000;
  const useLocationText = "Use Current Location";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarterLabels = ["16:00-20:00", "20:00-00:00", "00:00-04:00", "04:00-08:00"];
  const mobileDetailRadius = 1;
  const embedParentOrigins = new Set([
    "https://www.astromaniacmagazine.com",
    "https://astromaniacmagazine.com",
    "http://127.0.0.1:4174",
    "http://localhost:4174"
  ]);

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
    locationSavedAt: 0,
    timeZone: browserTimeZone(),
    night: {},
    sky: {},
    weather: [],
    weatherState: "idle",
    weatherUpdatedAt: null,
    weatherTimer: null,
    weatherRequestId: 0,
    nowTimer: null,
    locationMatches: [],
    locationSearchTimer: null,
    locationSearchId: 0,
    monthTransitionTimer: null,
    mobileScrollFrame: null,
    mobileSnapTimer: null,
    mobileScrollAnimationFrame: null,
    mobileActivationTimer: null,
    mobileNavigationTimer: null,
    mobileNavigationTarget: null,
    mobileMonthTransition: false,
    mobileRailFrame: null,
    mobileRailTimer: null,
    mobileRailSyncing: false,
    mobileRailIgnoreUntil: 0,
    mobileRailMonthId: "",
    mobileRailFocusKey: "",
    lastHapticKey: "",
    parentManagedEmbed: false,
    embedTouch: null,
    inlineHorizontalTouch: null,
    embedScrollDelta: 0,
    embedScrollFrame: null,
    embedMomentumFrame: null,
    inlineScrollHoldFrame: null,
    backTopFrame: null,
    resizeTimer: null,
    embedResizeTimer: null,
    embedResizeObserver: null,
    mobileLayout: window.matchMedia("(max-width: 600px)").matches,
    targetObservationCache: new Map(),
    monthPromises: Object.create(null)
  };

  const targetCatalogue = [
    { match: /lagoon|m8\b/i, name: "Lagoon Nebula (M8)", type: "Emission nebula", ra: 18.06, dec: -24.38, size: "90 x 40 arcmin" },
    { match: /trifid|m20\b/i, name: "Trifid Nebula (M20)", type: "Nebula", ra: 18.04, dec: -23.03, size: "28 arcmin" },
    { match: /eagle|m16\b/i, name: "Eagle Nebula (M16)", type: "Emission nebula", ra: 18.31, dec: -13.82, size: "35 arcmin" },
    { match: /omega nebula|swan nebula|m17\b/i, name: "Omega Nebula (M17)", type: "Emission nebula", ra: 18.34, dec: -16.18, size: "46 x 37 arcmin" },
    { match: /dumbbell|m27\b/i, name: "Dumbbell Nebula (M27)", type: "Planetary nebula", ra: 19.99, dec: 22.72, size: "8 x 6 arcmin" },
    { match: /ring nebula|m57\b/i, name: "Ring Nebula (M57)", type: "Planetary nebula", ra: 18.89, dec: 33.03, size: "1.4 x 1 arcmin" },
    { match: /north america|ngc\s*7000/i, name: "North America Nebula (NGC 7000)", type: "Emission nebula", ra: 20.98, dec: 44.33, size: "120 x 100 arcmin" },
    { match: /cygnus loop|veil nebula|ngc\s*6960|ngc\s*6992/i, name: "Cygnus Loop (Veil Nebula)", type: "Supernova remnant", ra: 20.75, dec: 30.97, size: "about 180 arcmin" },
    { match: /clamshell|sh2[-\s]*119/i, name: "Clamshell Nebula (Sh2-119)", type: "Emission nebula", ra: 21.3, dec: 44.0, size: "about 150 arcmin" },
    { match: /sadr|gamma cygni|ic\s*1318/i, name: "Sadr Region (IC 1318)", type: "Emission nebula", ra: 20.37, dec: 40.42, size: "about 180 arcmin" },
    { match: /elephant trunk|ic\s*1396a|vdB\s*142/i, name: "Elephant Trunk Nebula (IC 1396A)", type: "Dark nebula", ra: 21.59, dec: 57.49, size: "about 20 x 10 arcmin" },
    { match: /pelican|ic\s*5070/i, name: "Pelican Nebula (IC 5070)", type: "Emission nebula", ra: 20.85, dec: 44.35, size: "about 60 x 50 arcmin" },
    { match: /crescent nebula|ngc\s*6888|caldwell\s*27/i, name: "Crescent Nebula (NGC 6888)", type: "Emission nebula", ra: 20.2, dec: 38.35, size: "18 x 12 arcmin" },
    { match: /bubble nebula|ngc\s*7635/i, name: "Bubble Nebula (NGC 7635)", type: "Emission nebula", ra: 23.35, dec: 61.2, size: "15 x 8 arcmin" },
    { match: /heart nebula|ic\s*1805/i, name: "Heart Nebula (IC 1805)", type: "Emission nebula", ra: 2.55, dec: 61.45, size: "150 x 150 arcmin" },
    { match: /soul nebula|ic\s*1848/i, name: "Soul Nebula (IC 1848)", type: "Emission nebula", ra: 2.85, dec: 60.42, size: "150 x 75 arcmin" },
    { match: /andromeda|m31\b/i, name: "Andromeda Galaxy (M31)", type: "Galaxy", ra: 0.71, dec: 41.27, size: "178 x 63 arcmin" },
    { match: /triangulum|m33\b/i, name: "Triangulum Galaxy (M33)", type: "Galaxy", ra: 1.56, dec: 30.66, size: "62 x 39 arcmin" },
    { match: /whirlpool|m51\b/i, name: "Whirlpool Galaxy (M51)", type: "Galaxy", ra: 13.5, dec: 47.2, size: "11 x 7 arcmin" },
    { match: /pinwheel|m101\b/i, name: "Pinwheel Galaxy (M101)", type: "Galaxy", ra: 14.05, dec: 54.35, size: "29 x 27 arcmin" },
    { match: /centaurus a|ngc\s*5128/i, name: "Centaurus A (NGC 5128)", type: "Galaxy", ra: 13.42, dec: -43.02, size: "26 x 20 arcmin" },
    { match: /sculptor galaxy|ngc\s*253/i, name: "Sculptor Galaxy (NGC 253)", type: "Galaxy", ra: 0.79, dec: -25.29, size: "28 x 7 arcmin" },
    { match: /ngc\s*55/i, name: "NGC 55", type: "Galaxy", ra: 0.25, dec: -39.2, size: "32 x 6 arcmin" },
    { match: /hercules cluster|m13\b/i, name: "Hercules Cluster (M13)", type: "Globular cluster", ra: 16.69, dec: 36.46, size: "20 arcmin" },
    { match: /omega centauri|ngc\s*5139/i, name: "Omega Centauri (NGC 5139)", type: "Globular cluster", ra: 13.45, dec: -47.48, size: "36 arcmin" },
    { match: /orion nebula|m42\b/i, name: "Orion Nebula (M42)", type: "Emission nebula", ra: 5.59, dec: -5.45, size: "85 x 60 arcmin" },
    { match: /horsehead|barnard\s*33/i, name: "Horsehead Nebula (Barnard 33)", type: "Dark nebula", ra: 5.68, dec: -2.46, size: "8 x 6 arcmin" },
    { match: /rosette|ngc\s*2237/i, name: "Rosette Nebula (NGC 2237)", type: "Emission nebula", ra: 6.52, dec: 5.03, size: "80 x 60 arcmin" },
    { match: /california|ngc\s*1499/i, name: "California Nebula (NGC 1499)", type: "Emission nebula", ra: 4.05, dec: 36.37, size: "145 x 40 arcmin" },
    { match: /pleiades|m45/i, name: "Pleiades (M45)", type: "Open cluster", ra: 3.79, dec: 24.12, size: "110 arcmin" },
    { match: /messier 4|m4\b/i, name: "Messier 4", type: "Globular cluster", ra: 16.39, dec: -26.53, size: "26 arcmin" },
    { match: /messier 5|m5\b/i, name: "Messier 5", type: "Globular cluster", ra: 15.31, dec: 2.08, size: "23 arcmin" },
    { match: /messier 2|m2\b/i, name: "Messier 2", type: "Globular cluster", ra: 21.56, dec: -0.82, size: "16 arcmin" },
    { match: /messier 15|m15\b/i, name: "Messier 15", type: "Globular cluster", ra: 21.5, dec: 12.17, size: "18 arcmin" },
    { match: /double cluster|ngc\s*869|ngc\s*884/i, name: "Double Cluster (NGC 869 and NGC 884)", type: "Open clusters", ra: 2.34, dec: 57.13, size: "about 60 arcmin" },
    { match: /rho ophiuchi|antares region/i, name: "Rho Ophiuchi Cloud Complex", type: "Reflection and dark nebulae", ra: 16.43, dec: -23.45, size: "about 4.5 degrees" },
    { match: /antares/i, name: "Antares", type: "Red supergiant", ra: 16.49, dec: -26.43, size: "point source" },
    { match: /asteroid|\bmetis\b|\bvesta\b|\bnausikaa\b/i, name: "Asteroid target", type: "Asteroid", size: "point source" },
    { match: /milky way/i, name: "Milky Way core", type: "Wide-field", ra: 17.76, dec: -29.01, size: "wide-field" },
    { match: /saturn/i, name: "Saturn", type: "Planet", body: "Saturn", size: "15-20 arcsec" },
    { match: /jupiter/i, name: "Jupiter", type: "Planet", body: "Jupiter", size: "30-50 arcsec" },
    { match: /venus/i, name: "Venus", type: "Planet", body: "Venus", size: "10-60 arcsec" },
    { match: /mars/i, name: "Mars", type: "Planet", body: "Mars", size: "4-25 arcsec" },
    { match: /mercury/i, name: "Mercury", type: "Planet", body: "Mercury", size: "5-13 arcsec" },
    { match: /uranus/i, name: "Uranus", type: "Planet", body: "Uranus", size: "3.5-4.1 arcsec" },
    { match: /neptune/i, name: "Neptune", type: "Planet", body: "Neptune", size: "2.2-2.4 arcsec" },
    { match: /pluto/i, name: "Pluto", type: "Dwarf planet", body: "Pluto", size: "about 0.1 arcsec" },
    { match: /moon|lunar|crater|terminator|moonrise/i, name: "Moon", type: "Lunar", body: "Moon", size: "about 31 arcmin" },
    { match: /meteor|perseid|aquariid|capricornid|cygnid|taurid|leonid|geminid|ursid/i, name: "Meteor radiant", type: "Meteor shower", size: "wide radiant" },
    { match: /eclipse|solar|corona/i, name: "Solar event", type: "Solar", body: "Sun", size: "30-32 arcmin" },
    { match: /comet/i, name: "Comet", type: "Comet", size: "variable coma" }
  ];

  boot();

  async function boot() {
    const embedded = isEmbeddedFrame() && root.dataset.inline !== "true";
    syncPrivacyControls();
    if (!remembersLocations()) { safeStorageRemove(locationKey); safeStorageRemove(historyKey); }
    else readLocationHistory();
    const savedLocation = readSavedLocation();
    state.parentManagedEmbed = embedded;
    root.classList.toggle("is-embedded", embedded);
    root.classList.toggle("is-legacy-parent", embedded);
    if (savedLocation) primeSavedLocation(savedLocation);
    if (safeStorageGet(themePreferenceKey) !== "yes") safeStorageRemove(themeKey);
    const savedTheme = safeStorageGet(themePreferenceKey) === "yes" ? safeStorageGet(themeKey) : null;
    setTheme(themeOrder.includes(savedTheme) ? savedTheme : "light");
    bindEvents();
    if (embedded) setupEmbedBridge();
    await showMonth(defaultMonthId());
    if (savedLocation) finishSavedLocationRestore();
    scheduleNowRefresh();
    root.dataset.ready = "true";
    root.dispatchEvent(new CustomEvent("amc:ready", { bubbles: true, detail: { version: root.dataset.version } }));
  }

  function bindEvents() {
    els.themeToggle.addEventListener("click", cycleTheme);
    els.useLocation.addEventListener("click", useBrowserLocation);
    els.manualForm.addEventListener("submit", useManualLocation);
    els.manualInput.addEventListener("input", handleManualLocationInput);
    els.manualInput.addEventListener("focus", showLocationHistory);
    els.manualInput.addEventListener("click", showLocationHistory);
    els.manualInput.addEventListener("keydown", handleLocationKeys);
    root.addEventListener("click", event => {
      if (event.target.closest(".amc-chart-location-action")) els.manualInput.focus();
    });
    els.locationResults?.addEventListener("keydown", handleLocationKeys);
    els.rememberLocations?.addEventListener("change", () => setLocationMemory(els.rememberLocations.checked));
    els.rememberTheme?.addEventListener("change", () => {
      if (els.rememberTheme.checked) {
        if (!safeStorageSet(themePreferenceKey, "yes") || !safeStorageSet(themeKey, root.dataset.theme)) {
          safeStorageRemove(themePreferenceKey);
          if (els.privacyStatus) els.privacyStatus.textContent = "Browser storage is unavailable; this theme will only be used for this visit.";
          syncPrivacyControls();
        }
      } else {
        safeStorageRemove(themePreferenceKey);
        safeStorageRemove(themeKey);
      }
    });
    els.clearLocations?.addEventListener("click", () => setLocationMemory(false));
    els.locationResults?.addEventListener("click", handleLocationResultClick);
    document.addEventListener("click", hideLocationResultsOnOutsideClick);
    els.previousMonth?.addEventListener("click", () => goToAdjacentMonth(-1));
    els.nextMonth?.addEventListener("click", () => goToAdjacentMonth(1));
    els.today?.addEventListener("click", goToToday);
    els.backToTop?.addEventListener("click", scrollCalendarToTop);
    if (els.mobileDayRail) {
      els.mobileDayRail.addEventListener("scroll", handleMobileRailScroll, { passive: true });
      els.mobileDayRail.addEventListener("click", handleMobileRailClick);
    }
    root.addEventListener("touchstart", handleInlineHorizontalTouchStart, { passive: true, capture: true });
    root.addEventListener("touchmove", handleInlineHorizontalTouchMove, { passive: false, capture: true });
    root.addEventListener("touchend", handleInlineHorizontalTouchEnd, { passive: true, capture: true });
    root.addEventListener("touchcancel", handleInlineHorizontalTouchEnd, { passive: true, capture: true });
    els.feedbackLink?.addEventListener("click", event => event.stopPropagation());
    root.addEventListener("pointerover", handleWeatherTipIn);
    root.addEventListener("pointerout", handleWeatherTipOut);
    root.addEventListener("focusin", handleWeatherTipIn);
    root.addEventListener("focusout", handleWeatherTipOut);
    root.addEventListener("click", handleWeatherTipClick);
    document.addEventListener("visibilitychange", refreshWeatherWhenVisible);
    window.addEventListener("pageshow", restoreTodayOnPageShow);
    window.addEventListener("resize", handleResponsiveLayout, { passive: true });
    window.addEventListener("scroll", handleBackTopVisibility, { passive: true });
    window.addEventListener("message", handleEmbedMessage);
    document.addEventListener("touchstart", handleEmbedTouchStart, { passive: true, capture: true });
    document.addEventListener("touchmove", handleEmbedTouchMove, { passive: false, capture: true });
    document.addEventListener("touchend", handleEmbedTouchEnd, { passive: true, capture: true });
    document.addEventListener("touchcancel", handleEmbedTouchCancel, { passive: true, capture: true });
    handleBackTopVisibility();
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
    if (!options.mobileContinuity) animateMonthChange(options.direction || 0);
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
    state.sources = { ...(shared.sources || {}), ...(data.sources || {}) };
    state.articles = { ...(shared.articleData || {}), ...(data.articleData || {}) };
    state.media = data.media || shared.media || {};
    state.moonData = data.moonData || {};
    state.exactMoon = data.exactMoon || {};
    state.highlights = data.monthIntel || [];
    state.events = data.eventData || {};
    state.targets = data.targetData || data.targets || {};
    state.targetObservationCache.clear();
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
      const source = assetBase ? new URL(entry.path, assetBase).href : entry.path;
      script.src = assetVersion ? `${source}?v=${encodeURIComponent(assetVersion)}` : source;
      script.async = true;
      script.onload = () => registry[monthId] ? resolve(registry[monthId]) : reject(new Error(`Month data did not register: ${monthId}`));
      script.onerror = () => { delete state.monthPromises[monthId]; script.remove(); reject(new Error(`Could not load month data: ${monthId}`)); };
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
    scheduleEmbedResize();
  }

  function refreshExpandedDay() {
    if (isMobileCarousel()) {
      prepareMobileDayWindow(state.selectedDay, true);
      return;
    }
    if (!validDay(state.expandedDay)) return;
    const day = Number(state.expandedDay);
    const expanded = els.grid.querySelector(`.amc-day[data-day="${day}"] .amc-expanded`);
    if (!expanded) return;
    const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
    const events = dayEvents(day);
    expanded.innerHTML = expandedDay(day, weekdays[date.getUTCDay()], moonForDay(day), events, primaryEvent(events), isMobileCarousel());
  }

  function refreshLivePanels() {
    renderDetail();
    refreshExpandedDay();
  }

  function animateMonthChange(direction) {
    if (!direction) return;
    if (state.monthTransitionTimer) window.clearTimeout(state.monthTransitionTimer);
    root.style.setProperty("--month-shift", `${direction < 0 ? "-" : ""}8px`);
    root.classList.remove("is-month-entering");
    void root.offsetWidth;
    root.classList.add("is-month-entering");
    state.monthTransitionTimer = window.setTimeout(() => {
      root.classList.remove("is-month-entering");
      state.monthTransitionTimer = null;
    }, 500);
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
    els.intel.innerHTML = [...state.highlights].sort((left, right) => highlightDay(left) - highlightDay(right)).map((item, index) => `
      <div class="amc-intel-card">
        <img src="${escapeHtml(item.image || state.media.milkyWay?.src || "")}" alt="${escapeHtml(item.alt || "")}" loading="${index < 2 ? "eager" : "lazy"}" fetchpriority="${index === 0 ? "high" : "auto"}" decoding="async" width="64" height="64">
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
      <li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a></li>
    `).join("");
  }

  function highlightDay(item) {
    if (Number.isFinite(Number(item?.day))) return Number(item.day);
    const match = String(item?.text || item?.title || "").match(/\b(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct)/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function renderCalendar() {
    const mobileCarousel = isMobileCarousel();
    const todayDay = currentCalendarDay();
    const html = [];
    if (!mobileCarousel) {
      for (let i = 0; i < state.month.firstDayOffset; i += 1) html.push(`<div class="amc-empty" aria-hidden="true"></div>`);
    }
    root.classList.toggle("has-expanded-day", !mobileCarousel && validDay(state.expandedDay));
    if (mobileCarousel) state.expandedDay = state.selectedDay;
    const previousMobileMonth = mobileCarousel ? adjacentMonth(-1) : null;
    const nextMobileMonth = mobileCarousel ? adjacentMonth(1) : null;
    if (previousMobileMonth) html.push(mobileMonthEdge(previousMobileMonth, -1));
    for (let day = 1; day <= state.month.days; day += 1) {
      const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
      const weekday = weekdays[date.getUTCDay()];
      const weekdayShort = weekday.toUpperCase();
      const moon = moonForDay(day);
      const nightInfo = state.hasLocation ? state.night[day] || noDark() : locationNeeded();
      const events = dayEvents(day);
      const primary = primaryEvent(events);
      const active = mobileCarousel && day === state.selectedDay;
      const mobileReady = mobileCarousel && Math.abs(day - state.selectedDay) <= mobileDetailRadius;
      const expanded = mobileCarousel ? mobileReady : day === state.expandedDay;
      const css = eventMeta(primary).css;
      const observing = weatherForCalendarDay(day);
      const observingSummary = observing ? `, observing conditions ${observing.observingLabel}` : "";
      const hasMajorEvent = eventImportance(primary) >= 90;
      const colIndex = (state.month.firstDayOffset + day - 1) % 7;
      const rowIndex = Math.floor((state.month.firstDayOffset + day - 1) / 7);
      const totalRows = Math.ceil((state.month.firstDayOffset + state.month.days) / 7);
      const rowEnd = colIndex === 6;
      const rowTail = colIndex >= 5;
      const rowBottom = rowIndex === totalRows - 1;
      const isToday = day === todayDay;
      const isNewMoon = isNewMoonDay(day);
      const moonSrc = moonImage(day, 216);
      const moonSource = mobileCarousel && Math.abs(day - state.selectedDay) > 2
        ? `data-src="${moonSrc}"`
        : `src="${moonSrc}"`;
      const element = mobileCarousel ? "article" : "button";
      const type = mobileCarousel ? "" : ` type="button"`;
      const current = active ? ` aria-current="date"` : "";
      const mobileAttributes = mobileCarousel ? ` role="group" tabindex="${active ? "0" : "-1"}"` : "";
      html.push(`
        <${element}${type}${mobileAttributes} class="amc-day ${css}${rowEnd ? " is-row-end" : ""}${rowTail ? " is-row-tail" : ""}${rowBottom ? " is-row-bottom" : ""}${isToday ? " is-today" : ""}${isNewMoon ? " is-new-moon" : ""}${observing ? " has-observing" : ""}${hasMajorEvent ? " is-major-event" : ""}${mobileReady ? " is-mobile-ready" : ""}${active ? " is-mobile-active" : ""}" data-day="${day}" aria-expanded="${expanded}"${current} aria-label="${isToday ? "Today, " : ""}${weekdayShort} ${day} ${monthTitle()}, ${moon.name}, ${moon.phase}% lit, astro night ${durationClock(nightInfo)}${observingSummary}">
          ${dayObservingBar(observing)}
          <span class="amc-date">
            <strong>${day}</strong>
            <span class="amc-date-badges">
              <span class="amc-mobile-weekday">${weekdayShort}</span>
              ${isToday ? `<span class="amc-today-pill">Today</span>` : ""}
              ${hasMajorEvent ? `<span class="amc-major-event-pill">Major</span>` : ""}
            </span>
          </span>
          <span class="amc-moon-line">
            <span class="amc-moon-visual"><img class="amc-moon-img" ${moonSource} alt="" loading="${mobileReady ? "eager" : "lazy"}" fetchpriority="${active ? "high" : "auto"}" decoding="async" width="52" height="52"></span>
            <span class="amc-moon-copy"><b>${escapeHtml(moon.name)}</b><span>${moon.phase}% lit</span></span>
          </span>
          <span class="amc-dark-line">Astro night: ${durationClock(nightInfo)}</span>
          <span class="amc-tags">${tagsFor(events).map(tag => `<span class="amc-tag ${tag.css}">${tag.label}</span>`).join("")}</span>
          <span class="amc-expanded">${expanded ? expandedDay(day, weekday, moon, events, primary, mobileCarousel) : ""}</span>
        </${element}>
      `);
    }
    if (nextMobileMonth) html.push(mobileMonthEdge(nextMobileMonth, 1));
    els.grid.innerHTML = html.join("");
    if (!mobileCarousel && validDay(state.expandedDay)) positionExpandedDay(els.grid.querySelector(`.amc-day[data-day="${state.expandedDay}"]`));
    els.grid.querySelectorAll(".amc-day").forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest(".amc-weather-segments i")) return;
        if (mobileCarousel) {
          if (event.target.closest("a, button, input")) return;
          const day = Number(card.dataset.day);
          beginMobileNavigation(day, true);
          return;
        }
        selectDay(Number(card.dataset.day));
      });
      if (mobileCarousel) card.addEventListener("keydown", handleMobileDayKeydown);
    });
    els.grid.onscroll = mobileCarousel ? handleMobileDayScroll : null;
    if (mobileCarousel) els.grid.setAttribute("aria-roledescription", "carousel");
    else els.grid.removeAttribute("aria-roledescription");
    if (mobileCarousel) {
      hydrateMobileMoonImages(state.selectedDay);
      updateMobileDayNavigation(false);
      preloadAdjacentMonths();
      window.requestAnimationFrame(() => {
        state.mobileNavigationTarget = state.selectedDay;
        centreMobileDay(state.selectedDay, false);
        syncMobileDayHeight(els.grid.querySelector(`.amc-day[data-day="${state.selectedDay}"]`));
        scheduleEmbedResize();
        window.setTimeout(() => clearMobileNavigation(state.selectedDay), 180);
      });
    }
  }

  function isMobileCarousel() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function mobileMonthEdge(entry, direction) {
    const action = direction < 0 ? "Previous month" : "Next month";
    const arrow = direction < 0 ? "‹" : "›";
    return `<article class="amc-month-edge" data-month-direction="${direction}" data-month-id="${escapeHtml(entry.id)}" role="group" aria-label="${action}: ${escapeHtml(entry.label)}">
      <span aria-hidden="true">${arrow}</span>
      <small>${action}</small>
      <strong>${escapeHtml(entry.label)}</strong>
      <em>Keep swiping</em>
    </article>`;
  }

  function preloadAdjacentMonths() {
    const preload = () => [-1, 1].map(adjacentMonth).filter(Boolean).forEach(entry => loadMonthData(entry.id).catch(() => {}));
    if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 900 });
    else window.setTimeout(preload, 120);
  }

  function handleResponsiveLayout() {
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => {
      const mobileLayout = isMobileCarousel();
      if (mobileLayout !== state.mobileLayout) {
        state.mobileLayout = mobileLayout;
        state.expandedDay = mobileLayout ? state.selectedDay : null;
        renderAll();
      }
      if (!mobileLayout && validDay(state.expandedDay)) positionExpandedDay(els.grid.querySelector(`.amc-day[data-day="${state.expandedDay}"]`));
      syncLocationActionLabel();
    }, 140);
  }

  function handleMobileDayScroll() {
    if (state.mobileScrollFrame) window.cancelAnimationFrame(state.mobileScrollFrame);
    state.mobileScrollFrame = window.requestAnimationFrame(() => {
      state.mobileScrollFrame = null;
      if (state.inlineHorizontalTouch?.scroller === els.grid && state.inlineHorizontalTouch.axis === "x") return;
      if (!state.mobileNavigationTarget && !state.mobileMonthTransition) {
        const closest = closestMobileSlide();
        if (closest?.slide.classList.contains("amc-month-edge") && closest.distance < closest.slide.offsetWidth * .24) {
          transitionMobileMonth(Number(closest.slide.dataset.monthDirection));
        }
      }
      scheduleMobileScrollSettle();
    });
  }

  function closestMobileSlide() {
    const gridRect = els.grid.getBoundingClientRect();
    const centre = gridRect.left + (gridRect.width / 2);
    return [...els.grid.querySelectorAll(".amc-day, .amc-month-edge")].reduce((selected, slide) => {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs((rect.left + rect.width / 2) - centre);
      return !selected || distance < selected.distance ? { slide, distance } : selected;
    }, null);
  }

  function scheduleMobileScrollSettle() {
    if (state.mobileSnapTimer) window.clearTimeout(state.mobileSnapTimer);
    state.mobileSnapTimer = window.setTimeout(settleMobileDayScroll, 86);
  }

  function settleMobileDayScroll() {
    state.mobileSnapTimer = null;
    if (!isMobileCarousel() || state.mobileMonthTransition || state.mobileNavigationTarget) return;
    const closest = closestMobileSlide();
    if (!closest) return;
    if (closest.slide.classList.contains("amc-month-edge")) {
      transitionMobileMonth(Number(closest.slide.dataset.monthDirection));
      return;
    }
    const day = Number(closest.slide.dataset.day);
    if (!validDay(day)) return;
    if (day !== state.selectedDay) activateMobileDay(day);
    const desired = mobileSlideLeft(closest.slide);
    if (Math.abs(els.grid.scrollLeft - desired) > .5) {
      state.mobileNavigationTarget = day;
      els.grid.scrollTo({ left: desired, behavior: "auto" });
    }
    clearMobileNavigation(day);
  }

  function handleMobileDayKeydown(event) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const candidate = Number(event.currentTarget.dataset.day) + direction;
    if (candidate < 1 || candidate > state.month.days) {
      transitionMobileMonth(direction);
      return;
    }
    beginMobileNavigation(candidate, true);
    els.grid.querySelector(`.amc-day[data-day="${candidate}"]`)?.focus({ preventScroll: true });
  }

  function activateMobileDay(day, railSmooth = true) {
    if (!isMobileCarousel() || !validDay(day)) return;
    const previous = els.grid.querySelector(".amc-day.is-mobile-active");
    const next = els.grid.querySelector(`.amc-day[data-day="${day}"]`);
    if (!next) return;

    const verticalScroll = document.scrollingElement?.scrollTop || 0;
    if (previous && previous !== next) {
      previous.classList.remove("is-mobile-active");
      previous.removeAttribute("aria-current");
      previous.setAttribute("tabindex", "-1");
    }

    state.selectedDay = day;
    state.expandedDay = day;
    hydrateMobileMoonImages(day);
    if (!next.classList.contains("is-mobile-ready")) populateMobileDay(next, day);
    next.classList.add("is-mobile-active");
    next.setAttribute("aria-current", "date");
    next.setAttribute("aria-expanded", "true");
    next.setAttribute("tabindex", "0");
    syncMobileDayHeight(next);
    updateMobileDayNavigation(railSmooth);
    updateTodayButton();
    restoreVerticalScroll(verticalScroll);
    window.requestAnimationFrame(() => {
      prepareMobileDayWindow(day);
      restoreVerticalScroll(verticalScroll);
    });
  }

  function populateMobileDay(card, day) {
    if (!card || !validDay(day)) return;
    const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
    const events = dayEvents(day);
    const expanded = card.querySelector(".amc-expanded");
    if (expanded) expanded.innerHTML = expandedDay(day, weekdays[date.getUTCDay()], moonForDay(day), events, primaryEvent(events), true);
    card.classList.add("is-mobile-ready");
    card.setAttribute("aria-expanded", "true");
  }

  function prepareMobileDayWindow(day, force = false) {
    if (!isMobileCarousel()) return;
    for (let candidate = Math.max(1, day - mobileDetailRadius); candidate <= Math.min(state.month.days, day + mobileDetailRadius); candidate += 1) {
      const card = els.grid.querySelector(`.amc-day[data-day="${candidate}"]`);
      if (card && (force || !card.classList.contains("is-mobile-ready"))) populateMobileDay(card, candidate);
    }
    hydrateMobileMoonImages(day);
    preloadMobileDayAssets(day);
    if (force) syncMobileDayHeight(els.grid.querySelector(`.amc-day[data-day="${day}"]`));
    scheduleEmbedResize();
  }

  function syncMobileDayHeight(card) {
    if (!card || !isMobileCarousel()) return;
    card.classList.add("is-mobile-measuring");
    const height = Math.ceil(card.getBoundingClientRect().height);
    card.classList.remove("is-mobile-measuring");
    const currentHeight = Number.parseFloat(root.style.getPropertyValue("--amc-mobile-day-height")) || 0;
    const stableHeight = Math.max(currentHeight, height);
    if (stableHeight > 0) root.style.setProperty("--amc-mobile-day-height", `${stableHeight}px`);
  }

  function restoreVerticalScroll(scrollTop) {
    if (document.scrollingElement && Math.abs(document.scrollingElement.scrollTop - scrollTop) > 1) {
      document.scrollingElement.scrollTop = scrollTop;
    }
  }

  function moveMobileDay(direction) {
    if (!isMobileCarousel()) return;
    const day = state.selectedDay + direction;
    if (day < 1 || day > state.month.days) {
      transitionMobileMonth(direction);
      return;
    }
    beginMobileNavigation(day, true);
  }

  function updateMobileDayNavigation(smooth = true) {
    if (!state.month || !validDay(state.selectedDay)) return;
    const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, state.selectedDay, 12));
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
    const progress = `${state.selectedDay} ${monthName()}`;
    if (els.mobileDayNav) {
      els.mobileDayNav.classList.toggle("is-today", isTodayDay(state.selectedDay));
    }
    renderMobileDayRail();
    syncMobileDayRail(state.selectedDay, smooth);
    const dayRail = mobileDayRailEntries().map(entry => ({
      monthId: entry.monthId,
      day: entry.day,
      weekday: entry.weekday,
      date: entry.date,
      active: entry.monthId === state.monthId && entry.day === state.selectedDay,
      today: entry.today
    }));
    postEmbedMessage({
      type: "amc:day-state",
      label: `${weekday}, ${progress} ${state.month.year}`,
      progress,
      monthId: state.monthId,
      day: state.selectedDay,
      dayRail,
      canPrevious: state.selectedDay > 1 || Boolean(adjacentMonth(-1)),
      canNext: state.selectedDay < state.month.days || Boolean(adjacentMonth(1))
    });
  }

  function mobileDayRailEntries() {
    const entries = [];
    const previous = adjacentMonth(-1);
    if (previous) {
      const [year, month] = previous.id.split("-").map(Number);
      const count = daysInMonth(year, month - 1);
      for (let day = Math.max(1, count - 2); day <= count; day += 1) entries.push(mobileRailEntry(previous.id, year, month - 1, day, true));
    }
    for (let day = 1; day <= state.month.days; day += 1) entries.push(mobileRailEntry(state.monthId, state.month.year, state.month.monthIndex, day, false));
    const next = adjacentMonth(1);
    if (next) {
      const [year, month] = next.id.split("-").map(Number);
      for (let day = 1; day <= 3; day += 1) entries.push(mobileRailEntry(next.id, year, month - 1, day, true));
    }
    return entries;
  }

  function mobileRailEntry(monthId, year, monthIndex, day, adjacent) {
    const date = new Date(Date.UTC(year, monthIndex, day, 12));
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date);
    const now = new Date();
    const today = now.getFullYear() === year && now.getMonth() === monthIndex && now.getDate() === day;
    return { monthId, day, weekday, date: `${day} ${monthShort[monthIndex]}`, adjacent, today };
  }

  function renderMobileDayRail() {
    if (!els.mobileDayRail || !isMobileCarousel()) return;
    if (state.mobileRailMonthId === state.monthId && els.mobileDayRail.childElementCount) return;
    const entries = mobileDayRailEntries();
    els.mobileDayRail.innerHTML = entries.map(entry => `<button class="amc-mobile-day-chip${entry.adjacent ? " is-adjacent" : ""}${entry.today ? " is-today" : ""}" type="button" role="option" data-month-id="${escapeHtml(entry.monthId)}" data-day="${entry.day}" aria-label="${escapeHtml(`${entry.weekday}, ${entry.date}`)}" aria-selected="false"><small>${escapeHtml(entry.weekday)}</small><b>${escapeHtml(entry.date)}</b></button>`).join("");
    state.mobileRailMonthId = state.monthId;
  }

  function handleMobileRailClick(event) {
    const chip = event.target.closest(".amc-mobile-day-chip");
    if (!chip || state.mobileMonthTransition) return;
    event.preventDefault();
    navigateMobileRailTarget(chip.dataset.monthId, Number(chip.dataset.day));
  }

  function syncMobileDayRail(day, smooth = false) {
    if (!els.mobileDayRail || !isMobileCarousel()) return;
    const chips = [...els.mobileDayRail.querySelectorAll(".amc-mobile-day-chip")];
    const active = chips.find(chip => chip.dataset.monthId === state.monthId && Number(chip.dataset.day) === day);
    chips.forEach(chip => {
      const selected = chip === active;
      chip.classList.toggle("is-active", selected);
      chip.setAttribute("aria-selected", String(selected));
    });
    if (!active) return;
    if (state.mobileRailTimer) window.clearTimeout(state.mobileRailTimer);
    state.mobileRailSyncing = true;
    state.mobileRailIgnoreUntil = performance.now() + (smooth ? 440 : 160);
    const left = Math.max(0, Math.min(active.offsetLeft + active.offsetWidth / 2 - els.mobileDayRail.clientWidth / 2, els.mobileDayRail.scrollWidth - els.mobileDayRail.clientWidth));
    els.mobileDayRail.scrollTo({ left, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    window.setTimeout(() => {
      centreMobileRailChip(active);
      els.mobileDayRail.classList.remove("is-inline-dragging");
      window.requestAnimationFrame(() => {
        state.mobileRailSyncing = false;
        if (state.mobileRailTimer) window.clearTimeout(state.mobileRailTimer);
        updateMobileRailFocus(false);
      });
    }, smooth ? 320 : 80);
  }

  function centreMobileRailChip(chip) {
    if (!chip || !els.mobileDayRail) return;
    const railRect = els.mobileDayRail.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const delta = (chipRect.left + chipRect.width / 2) - (railRect.left + railRect.width / 2);
    if (Math.abs(delta) > .5) els.mobileDayRail.scrollLeft += delta;
  }

  function handleMobileRailScroll() {
    if (!isMobileCarousel()) return;
    if (state.mobileRailFrame) window.cancelAnimationFrame(state.mobileRailFrame);
    state.mobileRailFrame = window.requestAnimationFrame(() => {
      state.mobileRailFrame = null;
      if (els.mobileDayRail.classList.contains("is-inline-dragging")) return;
      const ignoreProgrammaticScroll = state.mobileRailSyncing || performance.now() < state.mobileRailIgnoreUntil;
      updateMobileRailFocus(!ignoreProgrammaticScroll);
      if (ignoreProgrammaticScroll) {
        if (state.mobileRailTimer) window.clearTimeout(state.mobileRailTimer);
        return;
      }
      if (state.mobileRailTimer) window.clearTimeout(state.mobileRailTimer);
      state.mobileRailTimer = window.setTimeout(settleMobileRail, 140);
    });
  }

  function closestMobileRailChip() {
    if (!els.mobileDayRail || !isMobileCarousel()) return null;
    const railRect = els.mobileDayRail.getBoundingClientRect();
    const centre = railRect.left + railRect.width / 2;
    let closest = null;
    [...els.mobileDayRail.querySelectorAll(".amc-mobile-day-chip")].forEach(chip => {
      const rect = chip.getBoundingClientRect();
      const distancePx = Math.abs(rect.left + rect.width / 2 - centre);
      if (!closest || distancePx < closest.distance) closest = { chip, distance: distancePx };
    });
    return closest?.chip || null;
  }

  function updateMobileRailFocus(userDriven = false) {
    const focused = closestMobileRailChip();
    if (!focused) return null;
    els.mobileDayRail.querySelectorAll(".amc-mobile-day-chip.is-rail-focus").forEach(chip => chip.classList.toggle("is-rail-focus", chip === focused));
    focused.classList.add("is-rail-focus");
    if (userDriven) {
      const key = `${focused.dataset.monthId}:${focused.dataset.day}`;
      if (key !== state.mobileRailFocusKey) hapticDateTick(key);
      state.mobileRailFocusKey = key;
    }
    return focused;
  }

  function settleMobileRail() {
    state.mobileRailTimer = null;
    if (!els.mobileDayRail || state.mobileRailSyncing || state.mobileMonthTransition) return;
    const chip = updateMobileRailFocus(false);
    if (!chip) return;
    navigateMobileRailTarget(chip.dataset.monthId, Number(chip.dataset.day));
  }

  async function navigateMobileRailTarget(monthId, day) {
    if (monthId === state.monthId) {
      if (day !== state.selectedDay) beginMobileNavigation(day, true);
      else syncMobileDayRail(day, true);
      return;
    }
    const currentIndex = manifest.findIndex(entry => entry.id === state.monthId);
    const targetIndex = manifest.findIndex(entry => entry.id === monthId);
    if (targetIndex < 0 || currentIndex < 0) return;
    hapticDateTick(`${monthId}:${day}`);
    await transitionMobileMonth(targetIndex > currentIndex ? 1 : -1, day, monthId);
  }

  function hydrateMobileMoonImages(day) {
    for (let candidate = Math.max(1, day - 2); candidate <= Math.min(state.month.days, day + 2); candidate += 1) {
      const image = els.grid.querySelector(`.amc-day[data-day="${candidate}"] .amc-moon-img[data-src]`);
      if (!image) continue;
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
    }
  }

  function preloadMobileDayAssets(day) {
    const preload = () => {
      const days = [day - 1, day, day + 1].filter(validDay);
      const sources = days.flatMap(candidate => {
        const moon = moonImage(candidate, 216);
        const targets = targetSuggestions(candidate, dayEvents(candidate), moonForDay(candidate)).map(target => targetThumbnail(target.name, candidate).src);
        return [moon, ...targets];
      });
      [...new Set(sources)].forEach(source => {
        if (!source) return;
        const image = new Image();
        image.decoding = "async";
        image.crossOrigin = "anonymous";
        image.src = source;
      });
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 500 });
    else window.setTimeout(preload, 40);
  }

  function centreMobileDay(day, smooth = true) {
    const card = els.grid.querySelector(`.amc-day[data-day="${day}"]`);
    if (!card) return;
    const left = mobileSlideLeft(card);
    if (!smooth || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (state.mobileScrollAnimationFrame) window.cancelAnimationFrame(state.mobileScrollAnimationFrame);
      state.mobileScrollAnimationFrame = null;
      els.grid.classList.remove("is-mobile-programmatic");
      els.grid.scrollTo({ left, behavior: "auto" });
      return;
    }
    animateMobileScroll(left);
  }

  function animateMobileScroll(targetLeft) {
    if (state.mobileScrollAnimationFrame) window.cancelAnimationFrame(state.mobileScrollAnimationFrame);
    const startLeft = els.grid.scrollLeft;
    const distance = targetLeft - startLeft;
    if (Math.abs(distance) < .5) {
      els.grid.classList.remove("is-mobile-programmatic");
      return;
    }
    els.grid.classList.add("is-mobile-programmatic");
    const startedAt = performance.now();
    const duration = 320;
    const step = now => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      els.grid.scrollLeft = startLeft + distance * eased;
      if (progress < 1) state.mobileScrollAnimationFrame = window.requestAnimationFrame(step);
      else {
        els.grid.scrollLeft = targetLeft;
        state.mobileScrollAnimationFrame = null;
        window.requestAnimationFrame(() => els.grid.classList.remove("is-mobile-programmatic"));
      }
    };
    state.mobileScrollAnimationFrame = window.requestAnimationFrame(step);
  }

  function mobileSlideLeft(slide) {
    const gridRect = els.grid.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const desired = els.grid.scrollLeft + (slideRect.left + slideRect.width / 2) - (gridRect.left + gridRect.width / 2);
    return Math.max(0, Math.min(desired, els.grid.scrollWidth - els.grid.clientWidth));
  }

  function beginMobileNavigation(day, smooth = true, activate = true) {
    if (!validDay(day) || state.mobileMonthTransition) return;
    const changed = day !== state.selectedDay;
    state.mobileNavigationTarget = day;
    if (state.mobileNavigationTimer) window.clearTimeout(state.mobileNavigationTimer);
    if (state.mobileActivationTimer) window.clearTimeout(state.mobileActivationTimer);
    state.mobileActivationTimer = null;
    if (changed) {
      hapticDateTick(`${state.monthId}:${day}`);
      prepareMobileDayWindow(day);
      syncMobileDayHeight(els.grid.querySelector(`.amc-day[data-day="${day}"]`));
    }
    centreMobileDay(day, smooth);
    if (activate) {
      if (changed && smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        state.mobileActivationTimer = window.setTimeout(() => {
          state.mobileActivationTimer = null;
          if (state.mobileNavigationTarget === day) activateMobileDay(day, smooth);
        }, 270);
      } else {
        activateMobileDay(day, smooth);
      }
    }
    state.mobileNavigationTimer = window.setTimeout(() => clearMobileNavigation(day), smooth ? 420 : 40);
  }

  function hapticDateTick(key) {
    if (!key || state.lastHapticKey === key) return;
    state.lastHapticKey = key;
    if (typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(8);
    } catch {}
  }

  function clearMobileNavigation(day) {
    if (state.mobileNavigationTarget !== day) return;
    state.mobileNavigationTarget = null;
    if (state.mobileNavigationTimer) window.clearTimeout(state.mobileNavigationTimer);
    state.mobileNavigationTimer = null;
  }

  async function transitionMobileMonth(direction, targetDay = null, targetMonthId = "") {
    if (!isMobileCarousel() || state.mobileMonthTransition || ![-1, 1].includes(direction)) return;
    const entry = targetMonthId ? manifest.find(item => item.id === targetMonthId) : adjacentMonth(direction);
    if (!entry) return;
    state.mobileMonthTransition = true;
    state.mobileNavigationTarget = null;
    if (state.mobileActivationTimer) window.clearTimeout(state.mobileActivationTimer);
    state.mobileActivationTimer = null;
    const verticalScroll = document.scrollingElement?.scrollTop || 0;
    root.classList.add("is-mobile-month-switching");
    try {
      const data = await loadMonthData(entry.id);
      const month = data.MONTH || data.month || {};
      const monthDays = Number(month.days || daysInMonth(month.year, month.monthIndex));
      const selectedDay = Number.isFinite(Number(targetDay)) ? clamp(Number(targetDay), 1, monthDays) : direction > 0 ? 1 : monthDays;
      await showMonth(entry.id, { selectedDay, direction, mobileContinuity: true });
      restoreVerticalScroll(verticalScroll);
      window.requestAnimationFrame(() => {
        centreMobileDay(selectedDay, false);
        restoreVerticalScroll(verticalScroll);
        root.classList.remove("is-mobile-month-switching");
        state.mobileMonthTransition = false;
      });
    } catch {
      root.classList.remove("is-mobile-month-switching");
      state.mobileMonthTransition = false;
    }
  }

  function setupEmbedBridge() {
    if (window.parent === window) return;
    if ("ResizeObserver" in window) {
      state.embedResizeObserver = new ResizeObserver(scheduleEmbedResize);
      state.embedResizeObserver.observe(root);
    }
    window.addEventListener("load", scheduleEmbedResize, { once: true });
  }

  function scheduleEmbedResize() {
    if (window.parent === window) return;
    if (state.embedResizeTimer) window.clearTimeout(state.embedResizeTimer);
    state.embedResizeTimer = window.setTimeout(() => {
      state.embedResizeTimer = null;
      const height = Math.ceil(Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        root.getBoundingClientRect().bottom + window.scrollY
      ));
      const navRect = els.mobileDayNav?.getBoundingClientRect();
      postEmbedMessage({
        type: "amc:resize",
        height,
        version: assetVersion,
        theme: root.dataset.theme,
        navTop: navRect ? Math.max(0, Math.round(navRect.top + window.scrollY)) : 0,
        navHeight: navRect ? Math.round(navRect.height) : 0
      });
    }, 32);
  }

  function postEmbedMessage(payload) {
    if (window.parent === window) return;
    embedParentOrigins.forEach(origin => window.parent.postMessage(payload, origin));
  }

  function handleEmbedMessage(event) {
    if (event.source !== window.parent || !embedParentOrigins.has(event.origin)) return;
    if (event.data?.type === "amc:embed-ready") {
      state.parentManagedEmbed = true;
      root.classList.toggle("is-legacy-parent", event.data.wrapperVersion !== root.dataset.version);
      scheduleEmbedResize();
      updateMobileDayNavigation();
      return;
    }
    if (event.data?.type === "amc:navigate-date") {
      const monthId = String(event.data.monthId || "");
      const day = Number(event.data.day);
      if (monthId && Number.isFinite(day)) navigateMobileRailTarget(monthId, day);
      return;
    }
    if (event.data?.type === "amc:navigate-day") {
      const direction = Number(event.data.direction);
      if (direction === -1 || direction === 1) moveMobileDay(direction);
    }
  }

  function handleEmbedTouchStart(event) {
    cancelInlineScrollHold();
    if (!state.parentManagedEmbed || !isMobileCarousel() || event.touches.length !== 1) return;
    if (state.embedMomentumFrame) window.cancelAnimationFrame(state.embedMomentumFrame);
    state.embedMomentumFrame = null;
    const now = performance.now();
    const horizontalScroller = embedHorizontalScroller(event.target);
    state.embedTouch = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      lastX: event.touches[0].clientX,
      lastY: event.touches[0].clientY,
      lastAt: now,
      velocity: 0,
      axis: "",
      horizontalScroller,
      horizontalStart: horizontalScroller?.scrollLeft || 0
    };
  }

  function handleEmbedTouchMove(event) {
    if (!state.parentManagedEmbed || !state.embedTouch || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - state.embedTouch.x;
    const dy = touch.clientY - state.embedTouch.y;
    if (!state.embedTouch.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 4) {
      const horizontalIntent = state.embedTouch.horizontalScroller && Math.abs(dx) > Math.abs(dy) * 1.12;
      state.embedTouch.axis = horizontalIntent ? "x" : "y";
    }
    if (!state.embedTouch.axis) return;
    if (event.cancelable) event.preventDefault();
    if (state.embedTouch.axis === "x") {
      state.embedTouch.horizontalScroller.scrollLeft = state.embedTouch.horizontalStart - dx;
      state.embedTouch.lastX = touch.clientX;
      state.embedTouch.lastY = touch.clientY;
      state.embedTouch.lastAt = performance.now();
      return;
    }
    const now = performance.now();
    const step = state.embedTouch.lastY - touch.clientY;
    const elapsed = clamp(now - state.embedTouch.lastAt, 4, 50);
    const frameVelocity = step * (16.67 / elapsed);
    state.embedTouch.velocity = state.embedTouch.velocity * .68 + frameVelocity * .32;
    queueEmbedParentScroll(step);
    state.embedTouch.lastY = touch.clientY;
    state.embedTouch.lastAt = now;
  }

  function handleEmbedTouchEnd() {
    const gesture = state.embedTouch;
    const velocity = gesture?.axis === "y" ? gesture.velocity : 0;
    state.embedTouch = null;
    if (gesture?.axis === "x") settleHorizontalScroller(gesture.horizontalScroller);
    if (Math.abs(velocity) > .7) startEmbedMomentum(velocity);
  }

  function handleEmbedTouchCancel() {
    state.embedTouch = null;
  }

  function embedHorizontalScroller(target) {
    if (!(target instanceof Element)) return null;
    const scroller = target.closest(".amc-mobile-day-rail, .amc-grid, .amc-intel-strip, .amc-legend, .amc-target-list");
    return scroller && scroller.scrollWidth > scroller.clientWidth + 1 ? scroller : null;
  }

  function settleHorizontalScroller(scroller) {
    if (!scroller) return;
    if (scroller === els.grid) {
      scheduleMobileScrollSettle();
      return;
    }
    if (scroller === els.mobileDayRail) {
      if (state.mobileRailTimer) window.clearTimeout(state.mobileRailTimer);
      state.mobileRailTimer = window.setTimeout(settleMobileRail, 118);
    }
  }

  function handleInlineHorizontalTouchStart(event) {
    if (root.dataset.inline !== "true" || !isMobileCarousel() || event.touches.length !== 1) return;
    if (event.target instanceof Element && event.target.closest(".amc-target-list")) return;
    const scroller = event.target instanceof Element
      ? event.target.closest(".amc-mobile-day-rail, .amc-grid")
      : null;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1) return;
    if (scroller === els.grid && state.mobileScrollAnimationFrame) {
      window.cancelAnimationFrame(state.mobileScrollAnimationFrame);
      state.mobileScrollAnimationFrame = null;
    }
    if (scroller === els.mobileDayRail && state.mobileRailTimer) window.clearTimeout(state.mobileRailTimer);
    state.inlineHorizontalTouch = {
      scroller,
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      lastX: event.touches[0].clientX,
      lastY: event.touches[0].clientY,
      lastAt: performance.now(),
      velocityX: 0,
      scrollLeft: scroller.scrollLeft,
      scrollTop: document.scrollingElement?.scrollTop || window.scrollY || 0,
      axis: ""
    };
  }

  function handleInlineHorizontalTouchMove(event) {
    const gesture = state.inlineHorizontalTouch;
    if (!gesture || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - gesture.x;
    const dy = event.touches[0].clientY - gesture.y;
    if (!gesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 4) {
      gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
      if (gesture.axis === "x") gesture.scroller.classList.add(gesture.scroller === els.grid ? "is-mobile-programmatic" : "is-inline-dragging");
    }
    if (gesture.axis !== "x") return;
    if (event.cancelable) event.preventDefault();
    const now = performance.now();
    const elapsed = Math.max(8, now - gesture.lastAt);
    const velocity = (event.touches[0].clientX - gesture.lastX) / elapsed;
    gesture.velocityX = gesture.velocityX * .55 + velocity * .45;
    gesture.lastX = event.touches[0].clientX;
    gesture.lastY = event.touches[0].clientY;
    gesture.lastAt = now;
    gesture.scroller.scrollLeft = gesture.scrollLeft - dx;
  }

  function handleInlineHorizontalTouchEnd(event) {
    const gesture = state.inlineHorizontalTouch;
    if (!gesture) return;
    state.inlineHorizontalTouch = null;
    if (event.type === "touchcancel") {
      if (gesture.scroller === els.grid) centreMobileDay(state.selectedDay, true);
      else gesture.scroller.classList.remove("is-inline-dragging");
      return;
    }
    if (gesture.axis === "x") {
      const horizontalDistance = gesture.lastX - gesture.x;
      if (gesture.scroller === els.grid) {
        holdVerticalScroll(gesture.scrollTop);
        if (Math.abs(horizontalDistance) > 48 || (Math.abs(horizontalDistance) > 18 && Math.abs(gesture.velocityX) > .35)) {
          moveMobileDay(horizontalDistance < 0 ? 1 : -1);
        } else {
          centreMobileDay(state.selectedDay, true);
        }
      } else if (gesture.scroller === els.mobileDayRail) {
        holdVerticalScroll(gesture.scrollTop, 420);
        const rail = els.mobileDayRail;
        const projected = Math.max(0, Math.min(rail.scrollLeft - gesture.velocityX * 110, rail.scrollWidth - rail.clientWidth));
        const chips = [...rail.querySelectorAll(".amc-mobile-day-chip")];
        const chip = chips.reduce((nearest, candidate) => {
          const left = candidate.offsetLeft + candidate.offsetWidth / 2 - rail.clientWidth / 2;
          return !nearest || Math.abs(left - projected) < nearest.distance ? { element: candidate, distance: Math.abs(left - projected) } : nearest;
        }, null)?.element;
        if (chip) navigateMobileRailTarget(chip.dataset.monthId, Number(chip.dataset.day));
        else rail.classList.remove("is-inline-dragging");
      }
    }
  }

  function holdVerticalScroll(scrollTop, duration = 900) {
    cancelInlineScrollHold();
    const startedAt = performance.now();
    const restore = () => {
      restoreVerticalScroll(scrollTop);
      if (performance.now() - startedAt < duration) {
        state.inlineScrollHoldFrame = window.requestAnimationFrame(restore);
      } else {
        state.inlineScrollHoldFrame = null;
      }
    };
    restore();
  }

  function cancelInlineScrollHold() {
    if (!state.inlineScrollHoldFrame) return;
    window.cancelAnimationFrame(state.inlineScrollHoldFrame);
    state.inlineScrollHoldFrame = null;
  }

  function queueEmbedParentScroll(deltaY) {
    state.embedScrollDelta += Number(deltaY) || 0;
    if (state.embedScrollFrame) return;
    state.embedScrollFrame = window.requestAnimationFrame(() => {
      state.embedScrollFrame = null;
      const delta = state.embedScrollDelta;
      state.embedScrollDelta = 0;
      if (Math.abs(delta) >= .2) postEmbedMessage({ type: "amc:scroll-parent", deltaY: delta });
    });
  }

  function startEmbedMomentum(initialVelocity) {
    if (state.embedMomentumFrame) window.cancelAnimationFrame(state.embedMomentumFrame);
    let velocity = clamp(initialVelocity, -42, 42);
    const step = () => {
      velocity *= .925;
      if (Math.abs(velocity) < .35 || state.embedTouch) {
        state.embedMomentumFrame = null;
        return;
      }
      queueEmbedParentScroll(velocity);
      state.embedMomentumFrame = window.requestAnimationFrame(step);
    };
    state.embedMomentumFrame = window.requestAnimationFrame(step);
  }

  function expandedDay(day, weekday, moon, events, primary, includeRecommendations = false) {
    const nightInfo = state.hasLocation ? state.night[day] || noDark() : locationNeeded();
    const skyInfo = state.hasLocation ? state.sky[day] : null;
    return `
      <span class="amc-expanded-top">
        <span class="amc-expanded-identity">
          <span class="amc-expanded-moon-visual"><img src="${moonImage(day, 216)}" alt="" loading="lazy" decoding="async" width="42" height="42"></span>
          <span>
            <strong>${isTodayDay(day) ? "Today, " : ""}${weekday} ${day} ${monthName()} ${state.month.year}</strong>
            <span class="amc-expanded-stat">${escapeHtml(moon.name)}, ${moon.phase}% illuminated</span>
            <span class="amc-expanded-night">Astro night: ${durationClock(nightInfo)}</span>
          </span>
          <span class="amc-minimise" aria-hidden="true">-</span>
        </span>
      </span>
      ${expandedObservingPanel(day, weatherForCalendarDay(day))}
      <span class="amc-mini-grid">
        ${zodiacCard(day)}
        ${eventDataCard(primary)}
        ${miniItem("azimuth", skyInfo ? `Moon azimuth · ${skyInfo.positionTime}` : "Moon azimuth", skyInfo?.moonAzLabel || "Use location", skyInfo?.positionContext)}
        ${miniItem("altitude", skyInfo ? `Moon altitude · ${skyInfo.positionTime}` : "Moon altitude", skyInfo?.moonAltLabel || "Use location", skyInfo?.positionContext)}
        ${miniItem("moonrise", "Moonrise", skyInfo?.moonriseLabel || "Use location")}
        ${miniItem("moonset", "Moonset", skyInfo?.moonsetLabel || "Use location")}
        ${miniItem("sunrise", "Sunrise", skyInfo?.sunriseLabel || "Use location")}
        ${miniItem("sunset", "Sunset", skyInfo?.sunsetLabel || "Use location")}
      </span>
      <span class="amc-cell-mobile-extra">
        ${events.length ? `<span class="amc-expanded-event-list">${events.map(expandedEventItem).join("")}</span>` : ""}
        ${moonChart(skyInfo, nightInfo, true)}
        ${cellWeatherPanel()}
        ${includeRecommendations ? `<span class="amc-mobile-recommendations">${recommendationsMarkup(day)}</span>` : ""}
      </span>
    `;
  }

  function weatherForCalendarDay(day) {
    const dateKey = `${state.month.year}-${String(state.month.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return state.weather.find(item => item.dateKey === dateKey) || null;
  }

  function dayObservingBar(weather) {
    if (!weather?.segments?.length) return "";
    const summary = weather.segments.map(segment => `${segment.label} ${observingRating(segment.observingScore).label}`).join(", ");
    return `<span class="amc-day-observing" aria-hidden="true" title="Observing conditions: ${escapeHtml(summary)}">${weather.segments.map(segment => `<i style="background:${segmentColour(segment, "observing")}"></i>`).join("")}</span>`;
  }

  function expandedObservingPanel(day, weather) {
    if (!weather?.segments?.length) {
      if (state.hasLocation && state.weatherState === "ready" && state.weather.length) {
        return `<span class="amc-forecast-window-note">Outside the 7-day forecast window</span>`;
      }
      return "";
    }
    return `<span class="amc-expanded-observing" aria-label="Quarter-by-quarter observing conditions">
      <span class="amc-expanded-observing-slots">${weather.segments.map(segment => {
        const rating = observingRating(segment.observingScore);
        return `<span><i style="background:${observingColour(rating.key)}"></i><small>${segment.label}</small><b>${rating.label}</b></span>`;
      }).join("")}</span>
    </span>`;
  }

  function miniItem(icon, label, value, context = "") {
    return `<span class="amc-mini"${context ? ` title="${escapeHtml(context)}"` : ""}>${iconSvg(icon)}<span><small>${label}</small><b>${escapeHtml(value)}</b></span></span>`;
  }

  function eventDataCard(primary) {
    if (!primary?.title) return miniItem("event", "Event", "No listed event");
    const meta = eventMeta(primary);
    return `<span class="amc-mini amc-event-mini ${meta.css}">${iconSvg("event")}<span><small>Event</small><b>${escapeHtml(primary.title)}</b></span></span>`;
  }

  function expandedEventItem(item) {
    const meta = eventMeta(item);
    return `<span class="amc-expanded-event ${meta.css}"><small>${escapeHtml(meta.label)}</small><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.copy || "")}</span></span>`;
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
    const nightInfo = state.hasLocation ? state.night[day] || noDark() : locationNeeded();
    const skyInfo = state.hasLocation ? state.sky[day] : null;
    els.detail.innerHTML = `
      <div class="amc-detail-body">
        <div class="amc-detail-summary">
        <div class="amc-detail-head">
          <span class="amc-detail-date">${weekday} ${day} ${monthTitle()}</span>
          <span class="amc-detail-location">${locationPill(locationDisplay())}</span>
        </div>
        <h2 class="amc-detail-title">Events on this date</h2>
        ${events.length ? `<ul class="amc-event-list">${events.map(eventItem).join("")}</ul>` : `<p class="amc-no-events">No major astronomical events listed for this date.</p>`}
        </div>
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
    els.recommendations.innerHTML = recommendationsMarkup(state.selectedDay);
    lockCalendarRow();
  }

  function lockCalendarRow() {
    const calendar = root.querySelector(".amc-calendar-wrap");
    if (calendar && !isMobileCarousel()) root.style.setProperty("--calendar-row-height", `${calendar.offsetHeight}px`);
  }

  function recommendationsMarkup(day) {
    const moon = moonForDay(day);
    const events = dayEvents(day);
    const targets = targetSuggestions(day, events, moon);
    const articles = recommendedArticles(day, events, moon);
    return `
      <div class="amc-recommendation-group">
        <h3>Tonight point your camera to:</h3>
        <ol class="amc-target-list">${targets.map((target, index) => targetCard(target, index)).join("")}</ol>
      </div>
      <div class="amc-recommendation-group">
        <h3>Related Articles</h3>
        <div class="amc-related-grid">${articles.map(articlePromo).join("")}</div>
      </div>
    `;
  }

  function targetSuggestions(day, events, moon) {
    const seeded = (state.targets[day] || []).filter(isSpecificTarget);
    const seasonalPool = seasonalTargetPool(moon);
    const seasonal = rotateTargets(seasonalPool, (day * 3 + state.month.monthIndex) % Math.max(1, seasonalPool.length));
    const seasonalPosition = new Map(seasonal.map((name, index) => [name, index]));
    const rankedSeasonal = [...seasonal].sort((left, right) => {
      const leftScore = targetRank(left, day) + (seasonal.length - seasonalPosition.get(left)) * 2.8;
      const rightScore = targetRank(right, day) + (seasonal.length - seasonalPosition.get(right)) * 2.8;
      return rightScore - leftScore;
    });
    const fallbacks = fallbackTargetPool(moon);
    const featuredDeepSky = seasonal[0];
    const darkNightPool = moon.phase <= 15 ? darkNightTargets() : [];
    const darkNight = rotateTargets(darkNightPool, day + state.month.year).sort((left, right) => targetRank(right, day) - targetRank(left, day));
    const candidates = uniqueTargetNames([...darkNight, ...seeded, featuredDeepSky, ...rankedSeasonal, ...fallbacks].filter(Boolean));
    const selected = [];
    const groups = new Set();

    const addTarget = (name, requireDistinctGroup = true, requireGoodAltitude = true, limit = 3) => {
      if (selected.length >= limit || selected.includes(name)) return false;
      const meta = targetMeta(name);
      const group = targetGroup(name, meta);
      if (requireDistinctGroup && groups.has(group)) return false;
      const observing = targetObserving(meta, day);
      if (requireGoodAltitude && state.hasLocation && observing.maxAltitude !== null && observing.maxAltitude < 20) return false;
      selected.push(name);
      groups.add(group);
      return true;
    };

    candidates.forEach(name => addTarget(name));
    candidates.forEach(name => addTarget(name, false));
    fallbacks.forEach(name => addTarget(name, false, false));

    const deepSkyCandidates = uniqueTargetNames([...darkNight, featuredDeepSky, ...rankedSeasonal, ...seeded, ...fallbacks].filter(Boolean))
      .filter(name => isDeepSkyTarget(name));
    let deepSkyAdded = deepSkyCandidates.some(name => addTarget(name, false, true, 4));
    if (!deepSkyAdded) deepSkyAdded = deepSkyCandidates.some(name => addTarget(name, false, false, 4));
    if (!deepSkyAdded) candidates.some(name => addTarget(name, false, false, 4));

    return selected.slice(0, 4).map(name => targetDetails(name, day, moon));
  }

  function rotateTargets(targets, offset) {
    if (!targets.length) return [];
    const index = ((offset % targets.length) + targets.length) % targets.length;
    return [...targets.slice(index), ...targets.slice(0, index)];
  }

  function darkNightTargets() {
    const byMonth = {
      0: ["Horsehead Nebula (Barnard 33)", "Rosette Nebula (NGC 2237)"],
      1: ["Horsehead Nebula (Barnard 33)", "Rosette Nebula (NGC 2237)"],
      2: ["Pinwheel Galaxy (M101)", "Whirlpool Galaxy (M51)"],
      3: ["Whirlpool Galaxy (M51)", "Pinwheel Galaxy (M101)"],
      4: ["Pinwheel Galaxy (M101)", "Whirlpool Galaxy (M51)"],
      5: ["Rho Ophiuchi Cloud Complex", "Whirlpool Galaxy (M51)"],
      6: ["Rho Ophiuchi Cloud Complex", "Elephant Trunk Nebula (IC 1396A)"],
      7: ["Elephant Trunk Nebula (IC 1396A)", "Rho Ophiuchi Cloud Complex"],
      8: ["Elephant Trunk Nebula (IC 1396A)", "Triangulum Galaxy (M33)"],
      9: ["Elephant Trunk Nebula (IC 1396A)", "Triangulum Galaxy (M33)"],
      10: ["Horsehead Nebula (Barnard 33)", "Triangulum Galaxy (M33)"],
      11: ["Horsehead Nebula (Barnard 33)", "Triangulum Galaxy (M33)"]
    };
    return byMonth[state.month.monthIndex] || [];
  }

  function seasonalTargetPool(moon) {
    const deepSkyByMonth = {
      0: ["Orion Nebula (M42)", "Rosette Nebula (NGC 2237)", "Pleiades (M45)"],
      1: ["Rosette Nebula (NGC 2237)", "Orion Nebula (M42)", "Pleiades (M45)"],
      2: ["Pinwheel Galaxy (M101)", "Whirlpool Galaxy (M51)", "Pleiades (M45)"],
      3: ["Whirlpool Galaxy (M51)", "Pinwheel Galaxy (M101)", "Hercules Cluster (M13)"],
      4: ["Whirlpool Galaxy (M51)", "Hercules Cluster (M13)", "Ring Nebula (M57)", "Centaurus A (NGC 5128)", "Omega Centauri (NGC 5139)"],
      5: ["Dumbbell Nebula (M27)", "Whirlpool Galaxy (M51)", "Hercules Cluster (M13)", "Lagoon Nebula (M8)", "Centaurus A (NGC 5128)"],
      6: ["Dumbbell Nebula (M27)", "Cygnus Loop (Veil Nebula)", "Sadr Region (IC 1318)", "Pinwheel Galaxy (M101)", "Lagoon Nebula (M8)", "Hercules Cluster (M13)", "Omega Nebula (M17)"],
      7: ["Cygnus Loop (Veil Nebula)", "Clamshell Nebula (Sh2-119)", "Sadr Region (IC 1318)", "Elephant Trunk Nebula (IC 1396A)", "Crescent Nebula (NGC 6888)", "Pelican Nebula (IC 5070)", "North America Nebula (NGC 7000)", "Dumbbell Nebula (M27)", "Andromeda Galaxy (M31)", "Ring Nebula (M57)"],
      8: ["Elephant Trunk Nebula (IC 1396A)", "Bubble Nebula (NGC 7635)", "Heart Nebula (IC 1805)", "Cygnus Loop (Veil Nebula)", "Clamshell Nebula (Sh2-119)", "Sadr Region (IC 1318)", "Andromeda Galaxy (M31)", "Triangulum Galaxy (M33)", "Double Cluster (NGC 869 and NGC 884)", "Messier 15"],
      9: ["Heart Nebula (IC 1805)", "Soul Nebula (IC 1848)", "Bubble Nebula (NGC 7635)", "Elephant Trunk Nebula (IC 1396A)", "Andromeda Galaxy (M31)", "Triangulum Galaxy (M33)", "Double Cluster (NGC 869 and NGC 884)", "California Nebula (NGC 1499)", "Pleiades (M45)"],
      10: ["Heart Nebula (IC 1805)", "Soul Nebula (IC 1848)", "Orion Nebula (M42)", "Horsehead Nebula (Barnard 33)", "California Nebula (NGC 1499)", "Pleiades (M45)", "Andromeda Galaxy (M31)", "Double Cluster (NGC 869 and NGC 884)"],
      11: ["Orion Nebula (M42)", "Horsehead Nebula (Barnard 33)", "Rosette Nebula (NGC 2237)", "Pleiades (M45)", "Andromeda Galaxy (M31)"]
    };
    const deepSky = deepSkyByMonth[state.month.monthIndex] || ["Andromeda Galaxy (M31)", "Dumbbell Nebula (M27)", "Hercules Cluster (M13)"];
    if (moon.phase <= 35) return deepSky;
    if (moon.phase >= 70) return ["Moon", "Saturn", "Jupiter", "Ring Nebula (M57)", ...deepSky];
    return ["Moon", ...deepSky, "Saturn"];
  }

  function fallbackTargetPool(moon) {
    const moonTarget = moon.phase >= 70 ? "Moon" : "Milky Way fields";
    return [moonTarget, "Andromeda Galaxy (M31)", "Cygnus Loop (Veil Nebula)", "North America Nebula (NGC 7000)", "Elephant Trunk Nebula (IC 1396A)", "Pleiades (M45)", "Saturn", "Jupiter", "Dumbbell Nebula (M27)"];
  }

  function isSpecificTarget(name) {
    return !/^(bright clusters|bright meteors|meteor watch|late-summer meteors|dark sky|twilight sky|twilight planets|moon-free morning sky|southern galaxy target|lunar disc|craters?)$/i.test(String(name).trim());
  }

  function uniqueTargetNames(names) {
    const seen = new Set();
    return names.filter(name => {
      const meta = targetMeta(name);
      const key = String(meta?.name || name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function targetGroup(name, meta) {
    const text = `${meta?.type || ""} ${name}`.toLowerCase();
    if (/moon|lunar|crater/.test(text)) return "lunar";
    if (/meteor|aquariid|capricornid|perseid|cygnid|aurigid|taurid|leonid|geminid|ursid/.test(text)) return "meteor";
    if (/nebula|supernova remnant/.test(text)) return "nebula";
    if (/galaxy/.test(text)) return "galaxy";
    if (/cluster/.test(text)) return "cluster";
    if (/planet|saturn|jupiter|venus|mars|mercury|uranus|neptune|pluto/.test(text)) return "planet";
    if (/comet/.test(text)) return "comet";
    if (/milky way/.test(text)) return "wide-field";
    if (/solar|eclipse|sun/.test(text)) return "solar";
    return `special:${String(meta?.name || name).toLowerCase()}`;
  }

  function isDeepSkyTarget(name) {
    return ["nebula", "galaxy", "cluster"].includes(targetGroup(name, targetMeta(name)));
  }

  function targetRank(name, day) {
    const observing = targetObserving(targetMeta(name), day);
    return observing.maxAltitude === null ? 0 : observing.maxAltitude;
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
      constellation: targetConstellation(meta, name, day),
      size: meta?.size || "varies"
    };
  }

  function targetConstellation(meta, name, day) {
    const Astronomy = window.Astronomy;
    try {
      if (Astronomy?.Constellation && Number.isFinite(meta?.ra) && Number.isFinite(meta?.dec)) {
        return Astronomy.Constellation(meta.ra, meta.dec).name;
      }
      if (Astronomy?.Constellation && meta?.body && Astronomy.Body?.[meta.body]) {
        const observer = new Astronomy.Observer(state.hasLocation ? state.lat : 0, state.hasLocation ? state.lon : 0, 0);
        const sample = zonedDate(state.month.year, state.month.monthIndex, day, 22, 0, 0);
        const equator = Astronomy.Equator(Astronomy.Body[meta.body], sample, observer, true, true);
        return Astronomy.Constellation(equator.ra, equator.dec).name;
      }
    } catch {
      // A short, honest fallback is preferable to hiding the field entirely.
    }
    const text = String(name).toLowerCase();
    if (/aurigid/.test(text)) return "Auriga";
    if (/epsilon perseid/.test(text)) return "Perseus";
    if (/lyncid/.test(text)) return "Lynx";
    if (/milky way/.test(text)) return "Sagittarius";
    if (/meteor/.test(text)) return "Radiant varies";
    if (/asteroid|comet/.test(text)) return "Check finder chart";
    return "Varies by date";
  }

  function targetCard(target, index = 0) {
    return `<li class="amc-target-card">
      <img src="${escapeHtml(target.image.src)}" alt="${escapeHtml(target.image.alt)}" loading="${isMobileCarousel() && index < 2 ? "eager" : "lazy"}" fetchpriority="${isMobileCarousel() && index === 0 ? "high" : "auto"}" decoding="async" crossorigin="anonymous" referrerpolicy="no-referrer" width="82" height="82">
      <span class="amc-target-copy">
        <span class="amc-target-type">${escapeHtml(target.type)}</span>
        <span class="amc-target-name">${escapeHtml(target.name)}</span>
        ${target.image.credit ? `<small class="amc-target-credit">Image: ${escapeHtml(target.image.credit)}</small>` : ""}
      </span>
      <span class="amc-target-facts">
        <span><em>Highest point</em><strong>${escapeHtml(target.best)}</strong></span>
        <span><em>Max altitude</em><strong>${escapeHtml(target.altitude)}</strong></span>
        <span><em>Constellation</em><strong>${escapeHtml(target.constellation)}</strong></span>
        <span><em>Apparent size</em><strong>${escapeHtml(target.size)}</strong></span>
      </span>
    </li>`;
  }

  function recommendedArticles(day, events, moon) {
    const typeSet = new Set(events.map(item => item.type));
    const seed = day + (state.month.monthIndex + 1) * 37 + state.month.year * 11;
    let editorial;
    let reviews;
    if (typeSet.has("eclipse")) {
      editorial = [state.articles.moon, state.articles.artemis];
      reviews = [state.articles.sqmReview, state.articles.askar80Review];
    } else if (typeSet.has("launch")) {
      editorial = [state.articles.launch, state.articles.artemis, state.articles.spaceDebris, state.articles.jamesWebb];
      reviews = [state.articles.powerReview, state.articles.zwoReview, state.articles.falconReview];
    } else if (typeSet.has("meteor")) {
      editorial = [state.articles.deepSky, state.articles.lightPollution, state.articles.numbers, state.articles.accessories];
      reviews = [state.articles.sqmReview, state.articles.askar80Review, state.articles.sqa55Review, state.articles.atr2600Review];
    } else if (moon.phase >= 70 || (typeSet.has("moon") && moon.phase >= 35)) {
      editorial = [state.articles.moon, state.articles.artemis, state.articles.lunarLife, state.articles.lunarClock];
      reviews = [state.articles.sqmReview, state.articles.monitorReview, state.articles.powerReview, state.articles.zwoReview];
    } else if (typeSet.has("telescope")) {
      editorial = [state.articles.telescope, state.articles.rubin, state.articles.jamesWebb, state.articles.deepSky];
      reviews = [state.articles.seestarS50ProReview, state.articles.askar103Review, state.articles.ts130Review, state.articles.askar80Review, state.articles.sqa55Review, state.articles.zwoReview];
    } else if (typeSet.has("opposition")) {
      editorial = [state.articles.planetary, state.articles.planetNine, state.articles.marsLife, state.articles.earthLike];
      reviews = [state.articles.asi6200Review, state.articles.atr2600Review, state.articles.ts130Review, state.articles.falconReview];
    } else if (moon.phase < 35) {
      editorial = [state.articles.deepSky, state.articles.remoteHosting, state.articles.jamesWebb, state.articles.pixInsight, state.articles.numbers];
      reviews = [state.articles.seestarS50ProReview, state.articles.asi6200Review, state.articles.atr2600Review, state.articles.sqa55Review, state.articles.askar80Review, state.articles.askar103Review, state.articles.ts130Review, state.articles.falconReview, state.articles.flatPanelReview];
    } else {
      editorial = [state.articles.numbers, state.articles.deepSky, state.articles.pixInsight, state.articles.accessories, state.articles.remoteHosting];
      reviews = [state.articles.seestarS50ProReview, state.articles.wandererBoxReview, state.articles.powerReview, state.articles.flatPanelReview, state.articles.falconReview, state.articles.zwoReview, state.articles.sqmReview];
    }

    const editorialPool = uniqueArticles(editorial);
    const reviewPool = uniqueArticles(reviews);
    if (state.monthId === "2026-08" && [10, 11, 12].includes(day)) {
      return uniqueArticles([state.articles.solarEclipse2026, pickArticle(reviewPool, seed)]).slice(0, 2);
    }
    return uniqueArticles([pickArticle(editorialPool, seed), pickArticle(reviewPool, seed * 5 + 3)]).slice(0, 2);
  }

  function pickArticle(pool, seed) {
    if (!pool.length) return null;
    return pool[Math.abs(seed) % pool.length];
  }

  function articlePromo(article) {
    if (!article) return "";
    return `<a class="amc-article-promo" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
      <img src="${escapeHtml(article.image || state.media.milkyWay?.src || "")}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="96" height="72">
      <span class="amc-article-copy"><small>${escapeHtml(article.kind || "Article")}</small><b>${escapeHtml(article.title)}</b></span>
    </a>`;
  }

  function moonChart(skyInfo, nightInfo, compact) {
    if (!state.hasLocation) {
      return `<section class="amc-chart"><h3>Moon Altitude & Darkness</h3><span class="amc-chart-location-prompt"><button type="button" class="amc-chart-location-action">Set your location to unlock this chart</button><span>Use Current Location or enter a city above to calculate Moon altitude and darkness for your night.</span></span></section>`;
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
      return `<span class="amc-alt-labels"><span class="amc-night-stat"><b>Astronomical Night</b><span>Use location</span></span></span>`;
    }
    if (!nightInfo.minutes) {
      if (nightInfo.nautical?.minutes) {
        return `<span class="amc-alt-labels">
          <span class="amc-night-stat"><b>Astronomical Night</b><span>No astronomical darkness</span></span>
          <span class="amc-night-stat"><b>Best Nautical Window</b><span>${escapeHtml(nightInfo.nautical.window)} · ${durationClock(nightInfo.nautical)}</span></span>
        </span>`;
      }
      return `<span class="amc-alt-labels"><span class="amc-night-stat"><b>Astronomical Night</b><span>No astronomical darkness</span></span><span class="amc-night-stat"><b>Nautical Window</b><span>Unavailable</span></span></span>`;
    }
    const times = nightTimes(nightInfo);
    return `<span class="amc-alt-labels">
      <span class="amc-night-stat"><b>Astronomical Night</b><span>${times.start} to ${times.end}</span></span>
      <span class="amc-night-stat"><b>Duration</b><span>${durationClock(nightInfo)}</span></span>
    </span>`;
  }

  function moonAltitudeSvg(timeline, compact) {
    const maxAltitude = 85;
    const chart = { x: compact ? 26 : 30, y: compact ? 8 : 10, width: compact ? 300 : 326, height: compact ? 130 : 174 };
    const viewWidth = compact ? 332 : 360;
    const viewHeight = compact ? 176 : 224;
    const tickStep = 2;
    const hours = Array.from({ length: (chartDurationHours / tickStep) + 1 }, (_, i) => (chartStartHour + (i * tickStep)) % 24);
    const yTicks = compact ? [0, 40, 85] : [0, 25, 50, 75, 85];
    const bands = timeline.bands.map(band => {
      const x = chart.x + (band.startHour / chartDurationHours) * chart.width;
      const width = ((band.endHour - band.startHour) / chartDurationHours) * chart.width;
      return `<rect x="${x}" y="${chart.y}" width="${Math.max(.5, width)}" height="${chart.height}" fill="${darknessColour(band.state)}"/>`;
    }).join("");
    const bandLabels = timeline.bands.map(band => {
      const width = ((band.endHour - band.startHour) / chartDurationHours) * chart.width;
      const label = darknessBandLabel(band.state, width, compact);
      const minWidth = band.state === "nautical" ? (compact ? 18 : 22) : (compact ? 50 : 64);
      if (!label || width < minWidth) return "";
      const x = chart.x + ((band.startHour + band.endHour) / (chartDurationHours * 2)) * chart.width;
      const y = band.state === "dark" ? chart.y + 14 : band.state === "nautical" ? chart.y + (compact ? 13 : 16) : chart.y + chart.height - (compact ? 8 : 10);
      const fill = band.state === "dark" ? "#fff" : "currentColor";
      const fontSize = band.state === "nautical" && width < (compact ? 38 : 46) ? (compact ? 6.8 : 7.4) : (compact ? 7.2 : 8.6);
      return `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fontSize}" font-weight="600">${label}</text>`;
    }).join("");
    const hourTicks = hours.map((hour, index) => {
      const x = chart.x + ((index * tickStep) / chartDurationHours) * chart.width;
      return `<g><line x1="${x}" x2="${x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.12)"/><text x="${x}" y="${chart.y + chart.height + (compact ? 16 : 18)}" text-anchor="middle" fill="currentColor" font-size="${compact ? 9.4 : 10.5}" font-weight="600">${String(hour).padStart(2, "0")}</text></g>`;
    }).join("");
    const altitudeTicks = yTicks.map(tick => {
      const y = chart.y + chart.height - (tick / maxAltitude) * chart.height;
      return `<g><line x1="${chart.x}" x2="${chart.x + chart.width}" y1="${y}" y2="${y}" stroke="rgba(22,25,29,.16)"/><text x="${chart.x - 8}" y="${y + 3}" text-anchor="end" fill="currentColor" font-size="${compact ? 9.4 : 10.5}" font-weight="600">${tick}°</text></g>`;
    }).join("");
    const paths = timeline.moonSegments
      .map(segment => smoothPath(segment.map(point => chartPoint(point, chart, maxAltitude))))
      .filter(Boolean)
      .map(path => `<path d="${path}" fill="none" stroke="#d08a13" stroke-width="${compact ? 3 : 3.2}" stroke-linecap="round"/>`)
      .join("");
    const now = chartNowMarker(timeline.startMs, timeline.endMs);
    const nowX = chart.x + ((now?.hour || 0) / chartDurationHours) * chart.width;
    const nowAnchor = !now || now.hour < 2.5 ? "start" : now.hour > chartDurationHours - 2.5 ? "end" : "middle";
    const nowStyle = now ? "" : " style=\"display:none\"";
    const nowMarker = `<g class="amc-now-marker" data-now-marker${nowStyle}>
      <title data-now-title>${now ? `Now: ${now.detail}` : "Current time is outside this chart window"}</title>
      <line data-now-line x1="${nowX}" x2="${nowX}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="var(--accent)" stroke-width="2.2" stroke-dasharray="5 3"/>
      <circle data-now-dot cx="${nowX}" cy="${chart.y}" r="3.5" fill="var(--accent)" stroke="var(--panel)" stroke-width="1.2"/>
      <text data-now-label x="${nowX}" y="${chart.y + 13}" text-anchor="${nowAnchor}" fill="var(--accent)" font-size="${compact ? 10.2 : 11.3}" font-weight="800">NOW</text>
      <text data-now-detail x="${nowX}" y="${chart.y + chart.height - 7}" text-anchor="${nowAnchor}" fill="var(--accent)" font-size="${compact ? 8.2 : 9.4}" font-weight="700">${now?.detail || ""}</text>
    </g>`;
    return `<svg class="amc-alt-svg" data-now-chart data-chart-start="${timeline.startMs}" data-chart-end="${timeline.endMs}" data-chart-x="${chart.x}" data-chart-width="${chart.width}" viewBox="0 0 ${viewWidth} ${viewHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Moon altitude from 16:00 to 08:00, scaled from 0 to 85 degrees; Now marker appears when the current time is in this window">
      <g style="color: var(--text)">
        ${bands}${hourTicks}${altitudeTicks}${bandLabels}
        <line x1="${chart.x}" x2="${chart.x + chart.width}" y1="${chart.y + chart.height}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.42)" stroke-width="1.2"/>
        <line x1="${chart.x}" x2="${chart.x}" y1="${chart.y}" y2="${chart.y + chart.height}" stroke="rgba(22,25,29,.36)" stroke-width="1.2"/>
        <text x="${chart.x + chart.width / 2}" y="${chart.y + chart.height + (compact ? 31 : 34)}" text-anchor="middle" fill="currentColor" font-size="${compact ? 11.2 : 12.6}" font-weight="400">TIME</text>
        ${paths}${nowMarker}
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
    if (!state.hasLocation) return `<span class="amc-weather"><b>7-Night Forecast</b><span class="amc-weather-note">Set your location to see the seven-night observing forecast.</span></span>`;
    if (!state.weather.length) return `<span class="amc-weather"><b>7-Night Forecast</b><span class="amc-weather-note">${state.weatherState === "loading" ? "Loading local observing conditions." : "Weather forecast unavailable for this location."}</span></span>`;
    return `<span class="amc-weather"><span class="amc-weather-title"><b>7-Night Forecast</b>${weatherUpdatedLine()}</span><span class="amc-cell-weather-list">${state.weather.map(day => weatherCard(day, true)).join("")}</span></span>`;
  }

  function weatherCard(day, compact = false) {
    const hasForecast = Number.isFinite(day.observingScore);
    const cardClass = compact ? "amc-cell-weather-row" : "amc-weather-card";
    return `<span class="${cardClass}">
      <span class="amc-weather-card-head">
        <span class="amc-weather-card-date"><b>${escapeHtml(day.label)}</b></span>
        <span class="amc-weather-icons">${day.icons.map((kind, index) => `<span class="amc-weather-icon" title="${escapeHtml(day.segments[index]?.label || "")} · ${escapeHtml(kind)}">${weatherIcon(kind)}</span>`).join("")}</span>
      </span>
      <span class="amc-weather-metrics">
        ${weatherMetric("Overall", day.observingLabel, day.segments.map(segment => weatherSegment(segment, "observing")), "amc-observing-segments")}
        ${weatherMetric("Cloud", hasForecast ? `${Math.round(day.cloud)}%` : "Unavailable", day.segments.map(segment => weatherSegment(segment, "cloud")))}
        ${weatherMetric("Temp", hasForecast ? `${Math.round(day.temperature)}°C` : "Unavailable", day.segments.map(segment => weatherSegment(segment, "temperature")))}
        ${weatherMetric("Trans.", day.transparencyLabel, day.segments.map(segment => weatherSegment(segment, "transparency")))}
        ${weatherMetric("Seeing", day.seeingLabel, day.segments.map(segment => weatherSegment(segment, "seeing")))}
        ${weatherMetric("Wind", hasForecast ? `${Math.round(day.wind)} km/h` : "Unavailable", day.segments.map(segment => weatherSegment(segment, "wind")))}
      </span>
    </span>`;
  }

  function weatherMetric(label, value, segments, extraClass = "") {
    return `<span class="amc-weather-row"><b>${label}: ${escapeHtml(value)}</b><span class="amc-weather-segments ${extraClass}">${segments.join("")}</span></span>`;
  }

  function weatherSegment(segment, metric) {
    return `<i tabindex="0" style="background:${segmentColour(segment, metric)}" data-tooltip-time="${escapeHtml(segment.label)}" data-tooltip="${escapeHtml(segmentTooltip(segment, metric))}"></i>`;
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
    setLocationActionText("Locating");
    showLocationMessage("Finding location", "Your browser may ask for location permission.", false);
    navigator.geolocation.getCurrentPosition(
      position => {
        applyCoordinates(position.coords.latitude, position.coords.longitude);
        els.useLocation.disabled = false;
        syncLocationActionLabel();
      },
      error => {
        els.useLocation.disabled = false;
        syncLocationActionLabel();
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
    const locationRequestId = state.locationRequestId = (state.locationRequestId || 0) + 1;
    state.hasLocation = true;
    state.lat = safeLat;
    state.lon = safeLon;
    state.locationName = options.name || state.locationName || `${safeLat.toFixed(2)}, ${safeLon.toFixed(2)}`;
    state.timeZone = cleanTimeZone(options.timeZone) || state.timeZone || browserTimeZone();
    state.locationSavedAt = options.fromStorage ? Number(options.savedAt) : Date.now();
    root.classList.add("has-location");
    updateLocationLabel();
    showLocationMessage(state.locationName, "Local timing and forecast are using your selected location.", false);
    saveLocation();
    recalculateLocationData();
    renderAll();
    updateWeather();
    if (!options.skipReverseGeocode) reverseGeocode(safeLat, safeLon).then(result => {
      if (!result || state.locationRequestId !== locationRequestId) return;
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
    state.targetObservationCache.clear();
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
    refreshLivePanels();
    try {
      const params = new URLSearchParams({
        latitude: state.lat.toFixed(3),
        longitude: state.lon.toFixed(3),
        hourly: "cloud_cover,temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,wind_speed_10m,wind_gusts_10m,visibility,cape,weather_code",
        forecast_days: "8",
        timezone: "auto"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
      if (!response.ok) throw new Error("Weather request failed");
      const payload = await response.json();
      if (requestId !== state.weatherRequestId) return;
      const nextTimeZone = cleanTimeZone(payload.timezone) || state.timeZone;
      const timeZoneChanged = nextTimeZone !== state.timeZone;
      state.timeZone = nextTimeZone;
      state.weather = summariseWeather(payload.hourly || {});
      state.weatherState = "ready";
      state.weatherUpdatedAt = new Date();
      saveLocation();
      if (timeZoneChanged) recalculateLocationData();
      renderCalendar();
      renderDetail();
      renderRecommendations();
      scheduleWeatherRefresh();
    } catch {
      if (requestId !== state.weatherRequestId) return;
      state.weatherState = "error";
      refreshLivePanels();
      scheduleWeatherRefresh(weatherRetryMs);
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
      dewPoint: numberAt(hourly.dew_point_2m, index),
      precipitation: numberAt(hourly.precipitation_probability, index),
      wind: numberAt(hourly.wind_speed_10m, index),
      gusts: numberAt(hourly.wind_gusts_10m, index),
      visibility: numberAt(hourly.visibility, index),
      cape: numberAt(hourly.cape, index),
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
      const transparency = slots.every(slot => Number.isFinite(slot.observingScore)) ? avg(slots.map(slot => slot.transparency)) : null;
      const seeing = slots.every(slot => Number.isFinite(slot.observingScore)) ? avg(slots.map(slot => slot.seeing)) : null;
      const weakestScore = Math.min(...slots.map(slot => slot.observingScore));
      const observingScore = slots.every(slot => Number.isFinite(slot.observingScore))
        ? Math.min(avg(slots.map(slot => slot.observingScore)), weakestScore + 15, weakestScore < 90 ? 89 : 100) : null;
      const observing = observingRating(observingScore);
      const kind = weatherKind(representativeWeatherCode(slots.map(slot => slot.code)), cloud);
      return {
        dateKey,
        label: shortWeatherDate(dateKey, index),
        cloud,
        temperature,
        wind,
        observingScore,
        observingKey: observing.key,
        observingLabel: observing.label,
        transparencyLabel: transparencyLabel(transparency),
        seeingLabel: seeingLabel(seeing),
        icons: Number.isFinite(observingScore) ? weatherIconKinds(slots, kind) : [],
        segments: slots
      };
    });
  }

  function slotAverage(byKey, dateKey, hours, label) {
    const samples = hours.map(hour => byKey.get(`${dateKey}T${String(hour).padStart(2, "0")}:00`)).filter(Boolean);
    const cloud = avg(samples.map(sample => sample.cloud));
    const temperature = avg(samples.map(sample => sample.temperature));
    const humidity = avg(samples.map(sample => sample.humidity));
    const dewPoint = avg(samples.map(sample => sample.dewPoint));
    const precipitation = avg(samples.map(sample => sample.precipitation));
    const wind = avg(samples.map(sample => sample.wind));
    const gusts = avg(samples.map(sample => sample.gusts));
    const visibility = avg(samples.map(sample => sample.visibility));
    const cape = avg(samples.map(sample => sample.cape));
    const code = representativeWeatherCode(samples.map(sample => sample.code));
    const temperatures = samples.map(sample => sample.temperature).filter(Number.isFinite);
    const temperatureRange = temperatures.length ? Math.max(...temperatures) - Math.min(...temperatures) : 0;
    const dewPointSpread = Number.isFinite(temperature) && Number.isFinite(dewPoint) ? Math.max(0, temperature - dewPoint) : 0;
    const visibilityPenalty = Math.max(0, 12000 - visibility) / 12000 * 18;
    const transparency = clamp(100 - cloud * .62 - humidity * .11 - precipitation * .15 - visibilityPenalty + Math.min(8, dewPointSpread), 0, 100);
    const seeing = clamp(100 - wind * 1.65 - gusts * .55 - temperatureRange * 4.5 - Math.min(18, cape / 70) - cloud * .05, 0, 100);
    // Missing hours must not be interpreted as clear, dry weather.
    const complete = samples.length === hours.length && samples.every(sample =>
      [sample.cloud, sample.temperature, sample.humidity, sample.dewPoint, sample.precipitation,
       sample.wind, sample.gusts, sample.visibility, sample.cape, sample.code].every(Number.isFinite));
    let observingScore = complete ? clamp(transparency * .68 + seeing * .22 + (100 - precipitation) * .1 - Math.max(0, weatherCodeSeverity(code) - 2) * 3, 0, 100) : null;
    // Hard limits prevent favourable averages hiding cloud, rain, fog or strong wind.
    if (complete) {
      if (cloud > 70 || precipitation >= 60 || wind >= 40 || gusts >= 60 || visibility < 1000 || code >= 45) observingScore = Math.min(observingScore, 44);
      else if (cloud > 40 || precipitation >= 30 || wind >= 25 || gusts >= 40 || visibility < 5000) observingScore = Math.min(observingScore, 63);
      else if (cloud > 20 || precipitation >= 15 || wind >= 15 || gusts >= 25 || humidity >= 90) observingScore = Math.min(observingScore, 77);
      else if (cloud > 10 || precipitation > 5 || humidity > 80 || visibility < 15000) observingScore = Math.min(observingScore, 89);
    }
    return { label, cloud, temperature, humidity, dewPoint, precipitation, wind, gusts, visibility, cape, code, transparency, seeing, observingScore, kind: weatherKind(code, cloud) };
  }

  function calculateDailySky(day) {
    const Astronomy = window.Astronomy;
    if (!Astronomy) return unavailableSky();
    try {
      const observer = new Astronomy.Observer(state.lat, state.lon, 0);
      const sample = zonedDate(state.month.year, state.month.monthIndex, day, 21, 0, 0);
      const start = zonedDate(state.month.year, state.month.monthIndex, day, 0, 0, 0);
      const moonHorizon = horizon(Astronomy.Body.Moon, sample, observer);
      const end = zonedDate(state.month.year, state.month.monthIndex, day + 1, 0, 0, 0);
      const moonrise = riseSetOnLocalDay(Astronomy.Body.Moon, observer, +1, start, end);
      const moonset = riseSetOnLocalDay(Astronomy.Body.Moon, observer, -1, start, end);
      const sunrise = riseSetOnLocalDay(Astronomy.Body.Sun, observer, +1, start, end);
      const sunset = riseSetOnLocalDay(Astronomy.Body.Sun, observer, -1, start, end);
      return {
        positionTime: formatTime(sample),
        positionContext: `Moon centre at ${formatLocal(sample)} (${state.timeZone}). Azimuth clockwise from true north; altitude includes standard atmospheric refraction.`,
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

  function riseSetOnLocalDay(body, observer, direction, start, end) {
    const result = window.Astronomy.SearchRiseSet(body, observer, direction, start, (end - start) / 86400000);
    return result?.date && result.date >= start && result.date < end ? result : null;
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
    const start = zonedDate(state.month.year, state.month.monthIndex, day, chartStartHour, 0, 0);
    const end = zonedDate(state.month.year, state.month.monthIndex, day + 1, chartEndHour, 0, 0);
    const durationMs = Math.max(1, end.getTime() - start.getTime());
    const moonSamples = [];
    const darknessStates = [];
    for (let step = 0; step < chartSampleCount; step += 1) {
      const sample = new Date(start.getTime() + (step / chartSampleCount) * durationMs);
      moonSamples.push({ hour: chartHour(sample, start, end), altitude: bodyAltitude(Astronomy.Body.Moon, sample, observer) });
      darknessStates.push(darknessState(bodyAltitude(Astronomy.Body.Sun, sample, observer)));
    }
    moonSamples.push({ hour: chartDurationHours, altitude: bodyAltitude(Astronomy.Body.Moon, end, observer) });
    return {
      startMs: start.getTime(),
      endMs: end.getTime(),
      bands: compressBands(darknessStates),
      moonSegments: moonVisibleSegments(moonSamples)
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
    // Expansion changes card geometry at every breakpoint. Preserve the clicked
    // card's viewport position so opening or closing a day never pulls the page.
    const preservePosition = isMobileCarousel();
    const currentButton = els.grid.querySelector(`.amc-day[data-day="${day}"]`);
    const previousTop = preservePosition && currentButton ? currentButton.getBoundingClientRect().top : null;
    const previouslyExpanded = validDay(state.expandedDay)
      ? els.grid.querySelector(`.amc-day[data-day="${state.expandedDay}"]`)
      : null;
    state.selectedDay = day;
    state.expandedDay = wasExpanded ? null : day;
    if (previouslyExpanded && previouslyExpanded !== currentButton) updateDayExpansion(previouslyExpanded, false);
    if (currentButton) updateDayExpansion(currentButton, !wasExpanded);
    if (!wasExpanded) { renderDetail(); renderRecommendations(); }
    root.classList.toggle("has-expanded-day", !wasExpanded);
    if (currentButton && previousTop !== null) preserveDayViewport(currentButton, previousTop);
  }

  function preserveDayViewport(button, previousTop) {
    const startedAt = performance.now();
    const restore = () => {
      const drift = button.getBoundingClientRect().top - previousTop;
      if (Math.abs(drift) > .5) {
        const scroller = document.scrollingElement;
        if (scroller) scroller.scrollTop += drift;
        else window.scrollBy(0, drift);
      }
      // Mobile browsers can apply focus/scroll anchoring after the first paint.
      // Keep the clicked card pinned briefly while those adjustments settle.
      if (performance.now() - startedAt < 240) requestAnimationFrame(restore);
    };
    restore();
  }

  function updateDayExpansion(button, expanded) {
    const day = Number(button?.dataset.day);
    if (!button || !validDay(day)) return;
    button.setAttribute("aria-expanded", String(expanded));
    const panel = button.querySelector(".amc-expanded");
    if (!panel) return;
    if (!expanded) {
      panel.innerHTML = "";
      panel.removeAttribute("style");
      return;
    }
    const date = new Date(Date.UTC(state.month.year, state.month.monthIndex, day, 12));
    const events = dayEvents(day);
    panel.innerHTML = expandedDay(day, weekdays[date.getUTCDay()], moonForDay(day), events, primaryEvent(events));
    positionExpandedDay(button);
  }

  function positionExpandedDay(button) {
    if (!button || isMobileCarousel()) return;
    const panel = button.querySelector(".amc-expanded");
    if (!panel) return;
    const own = button.getBoundingClientRect();
    const row = [...els.grid.querySelectorAll(".amc-day")]
      .map(element => ({ element, rect: element.getBoundingClientRect() }))
      .filter(item => Math.abs(item.rect.top - own.top) < 2);
    const index = row.findIndex(item => item.element === button);
    const neighbour = row[index + 1] || row[index - 1];
    // A final partial row can contain only one date; use a column from another row.
    const gap = parseFloat(getComputedStyle(els.grid).columnGap) || 0;
    const width = neighbour ? Math.max(own.right, neighbour.rect.right) - Math.min(own.left, neighbour.rect.left) : own.width * 2 + gap;
    let left = neighbour ? Math.min(own.left, neighbour.rect.left) : own.left;
    const grid = els.grid.getBoundingClientRect();
    left = Math.max(grid.left, Math.min(left, grid.right - width));
    panel.style.width = `${width}px`;
    panel.style.left = `${left - own.left - button.clientLeft}px`;
    panel.style.right = "auto";
    const height = Math.max(300, own.height * 2 + gap + 14);
    panel.style.height = `${height}px`;
    panel.style.top = `${Math.abs(own.bottom - grid.bottom) < 2 ? own.height - height - button.clientTop : -button.clientTop}px`;
  }

  function goToAdjacentMonth(direction) {
    const entry = adjacentMonth(direction);
    if (entry) showMonth(entry.id, { direction });
  }

  function goToToday(option) {
    const smooth = typeof option === "boolean" ? option : true;
    const today = new Date();
    const todayId = monthIdFromParts(today.getFullYear(), today.getMonth());
    if (!manifest.some(item => item.id === todayId)) return;
    if (state.monthId === todayId) {
      if (isMobileCarousel()) beginMobileNavigation(today.getDate(), smooth);
      else {
        state.selectedDay = today.getDate();
        state.expandedDay = null;
        renderAll();
      }
      return;
    }
    showMonth(todayId, { selectedDay: today.getDate(), direction: todayId < state.monthId ? -1 : 1 });
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

  function primeSavedLocation(saved) {
    state.hasLocation = true;
    state.lat = saved.lat;
    state.lon = saved.lon;
    state.locationName = saved.name || `${saved.lat.toFixed(2)}, ${saved.lon.toFixed(2)}`;
    state.timeZone = saved.timeZone || browserTimeZone();
    state.locationSavedAt = saved.savedAt;
    root.classList.add("has-location");
    updateLocationLabel();
  }

  function finishSavedLocationRestore() {
    updateLocationLabel();
    showLocationMessage(state.locationName, "Local timing and forecast are using your selected location.", false);
    updateWeather();
    syncLocationActionLabel();
  }

  function readSavedLocation() {
    try {
      if (!remembersLocations()) return null;
      const data = JSON.parse(safeStorageGet(locationKey) || "null");
      const lat = Number(data?.lat);
      const lon = Number(data?.lon);
      const savedAt = Date.parse(data?.savedAt || "");
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
      if (!Number.isFinite(savedAt) || Date.now() - savedAt > locationMemoryMs || savedAt > Date.now()) { safeStorageRemove(locationKey); return null; }
      return { lat, lon, name: cleanName(data.name), timeZone: cleanTimeZone(data.timeZone), savedAt };
    } catch {
      return null;
    }
  }

  function remembersLocations() { return safeStorageGet(rememberKey) === "yes"; }

  function syncPrivacyControls() {
    if (els.rememberLocations) els.rememberLocations.checked = remembersLocations();
    if (els.rememberTheme) els.rememberTheme.checked = safeStorageGet(themePreferenceKey) === "yes";
  }

  function setLocationMemory(enabled) {
    if (enabled) {
      if (!safeStorageSet(rememberKey, "yes")) {
        if (els.privacyStatus) els.privacyStatus.textContent = "Browser storage is unavailable; locations will only be used for this visit.";
        syncPrivacyControls();
        return;
      }
      saveLocation();
    } else {
      safeStorageRemove(rememberKey);
      safeStorageRemove(historyKey);
      safeStorageRemove(locationKey);
    }
    syncPrivacyControls();
    if (els.privacyStatus) els.privacyStatus.textContent = enabled ? "Location history enabled on this browser for up to 30 days." : "Remembered locations cleared. History is off; your current location is used only for this visit.";
    hideLocationResults();
  }

  function readLocationHistory() {
    if (!remembersLocations()) return [];
    try {
      const raw = JSON.parse(safeStorageGet(historyKey) || "[]");
      const seen = new Set();
      const history = (Array.isArray(raw) ? raw : []).filter(item => {
        const age = Date.now() - Date.parse(item?.savedAt);
        const key = `${item?.lat},${item?.lon}`;
        if (!Number.isFinite(item?.lat) || !Number.isFinite(item?.lon) || Math.abs(item.lat) > 90 || Math.abs(item.lon) > 180 || !Number.isFinite(age) || age < 0 || age > locationMemoryMs || seen.has(key)) return false;
        seen.add(key); return true;
      }).slice(0, 5).map(item => ({ lat: item.lat, lon: item.lon, name: cleanName(item.name), timeZone: cleanTimeZone(item.timeZone), savedAt: item.savedAt }));
      safeStorageSet(historyKey, JSON.stringify(history));
      return history;
    } catch { safeStorageRemove(historyKey); return []; }
  }

  function showLocationHistory() {
    if (els.manualInput.value.trim()) return;
    state.locationSearchId += 1;
    const results = readLocationHistory().map(item => ({ ...item, detail: `Recent · ${item.timeZone || "local time"}` }));
    state.locationMatches = results;
    renderLocationResults(results);
    els.locationResults.insertAdjacentHTML("afterbegin", `<span class="amc-history-caption">${results.length ? "Recent locations" : "No recent locations"}</span>`);
    els.locationResults.insertAdjacentHTML("beforeend", remembersLocations()
      ? '<button type="button" class="amc-history-action" data-clear-history>Clear history and stop remembering</button>'
      : '<button type="button" class="amc-history-action" data-enable-history>Remember my last 5 locations for 30 days</button>');
    els.locationResults.insertAdjacentHTML("beforeend", '<small class="amc-history-note">Typed searches use Open-Meteo. Location and privacy controls are in Sources and logs.</small>');
  }

  function handleLocationKeys(event) {
    if (event.key === "Escape") { event.preventDefault(); els.manualInput.focus(); hideLocationResults(); return; }
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    if (els.locationResults.hidden) showLocationHistory();
    const options = [...els.locationResults.querySelectorAll("button")];
    const index = options.indexOf(document.activeElement);
    options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
  }

  function saveLocation() {
    if (!state.hasLocation || !remembersLocations()) return;
    const saved = {
      lat: Number(state.lat.toFixed(3)),
      lon: Number(state.lon.toFixed(3)),
      name: cleanName(state.locationName),
      timeZone: cleanTimeZone(state.timeZone),
      savedAt: new Date(state.locationSavedAt || Date.now()).toISOString()
    };
    safeStorageSet(locationKey, JSON.stringify(saved));
    const history = readLocationHistory().filter(item => Math.abs(item.lat-saved.lat) > .0005 || Math.abs(item.lon-saved.lon) > .0005);
    safeStorageSet(historyKey, JSON.stringify([saved, ...history].slice(0, 5)));
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
    if (!query) { showLocationHistory(); return; }
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
    if (event.target.closest("[data-enable-history]")) { setLocationMemory(true); showLocationHistory(); return; }
    if (event.target.closest("[data-clear-history]")) { setLocationMemory(false); showLocationHistory(); return; }
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
    state.locationSearchId += 1;
    if (!els.locationResults) return;
    els.locationResults.hidden = true;
    els.locationResults.innerHTML = "";
    els.manualInput.setAttribute("aria-expanded", "false");
  }

  async function geocodeLocationQuery(query) {
    const params = new URLSearchParams({ name: query, count: "10", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
    if (!response.ok) throw new Error("Geocoding failed");
    const payload = await response.json();
    const results = Array.isArray(payload.results) ? payload.results.map(normaliseLocationResult).filter(Boolean) : [];
    if (!results.length) throw new Error("Location not found");
    return results;
  }

  async function reverseGeocode(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat.toFixed(3),
      longitude: lon.toFixed(3),
      localityLanguage: "en"
    });
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
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
    syncLocationActionLabel();
  }

  function syncLocationActionLabel() {
    if (!els.useLocation) return;
    setLocationActionText(useLocationText);
    els.useLocation.title = state.hasLocation
      ? `Using ${locationDisplay()}. Tap to refresh your current location.`
      : "Use your device's current location";
  }

  function handleBackTopVisibility() {
    if (!els.backToTop || state.backTopFrame) return;
    state.backTopFrame = window.requestAnimationFrame(() => {
      state.backTopFrame = null;
      const calendarTop = root.getBoundingClientRect().top;
      els.backToTop.classList.toggle("is-visible", isMobileCarousel() && calendarTop < -520);
    });
  }

  function scrollCalendarToTop() {
    window.scrollTo({ top: Math.max(0, window.scrollY + root.getBoundingClientRect().top), behavior: "auto" });
  }

  function setLocationActionText(text) {
    if (!els.useLocation) return;
    const label = els.useLocation.querySelector(".amc-use-location-text");
    if (label) label.textContent = text;
    else els.useLocation.textContent = text;
  }

  function restoreTodayOnPageShow(event) {
    if (!event.persisted) return;
    window.requestAnimationFrame(() => goToToday(false));
  }

  function locationPill(text) {
    return `${iconSvg("pin")}<span>${escapeHtml(text)}</span>`;
  }

  function locationDisplay() {
    return state.hasLocation ? state.locationName || `${state.lat.toFixed(2)}, ${state.lon.toFixed(2)}` : "Location not set";
  }

  function refreshWeatherWhenVisible() {
    if (document.hidden || !state.hasLocation) return;
    syncNowMarkers();
    updateWeather();
  }

  function scheduleWeatherRefresh(delay = weatherRefreshMs) {
    if (state.weatherTimer) window.clearTimeout(state.weatherTimer);
    state.weatherTimer = window.setTimeout(() => updateWeather(true), delay);
  }

  function scheduleNowRefresh() {
    if (state.nowTimer) window.clearTimeout(state.nowTimer);
    const delay = 60050 - (Date.now() % 60000);
    state.nowTimer = window.setTimeout(() => {
      if (!document.hidden) syncNowMarkers();
      scheduleNowRefresh();
    }, delay);
  }

  function syncNowMarkers() {
    root.querySelectorAll("[data-now-chart]").forEach(svg => {
      const marker = svg.querySelector("[data-now-marker]");
      if (!marker) return;
      const now = chartNowMarker(Number(svg.dataset.chartStart), Number(svg.dataset.chartEnd));
      marker.style.display = now ? "" : "none";
      if (!now) return;
      const x = Number(svg.dataset.chartX) + (now.hour / chartDurationHours) * Number(svg.dataset.chartWidth);
      marker.querySelector("[data-now-line]")?.setAttribute("x1", x);
      marker.querySelector("[data-now-line]")?.setAttribute("x2", x);
      marker.querySelector("[data-now-dot]")?.setAttribute("cx", x);
      marker.querySelector("[data-now-label]")?.setAttribute("x", x);
      marker.querySelector("[data-now-detail]")?.setAttribute("x", x);
      const anchor = now.hour < 2.5 ? "start" : now.hour > chartDurationHours - 2.5 ? "end" : "middle";
      marker.querySelector("[data-now-label]")?.setAttribute("text-anchor", anchor);
      marker.querySelector("[data-now-detail]")?.setAttribute("text-anchor", anchor);
      const detail = marker.querySelector("[data-now-detail]");
      const title = marker.querySelector("[data-now-title]");
      if (detail) detail.textContent = now.detail;
      if (title) title.textContent = `Now: ${now.detail}`;
    });
  }

  function cycleTheme() {
    const currentIndex = themeOrder.indexOf(root.dataset.theme);
    setTheme(themeOrder[(currentIndex + 1) % themeOrder.length], true);
  }

  function setTheme(theme, persist = false) {
    const safeTheme = themeOrder.includes(theme) ? theme : "light";
    const nextTheme = themeOrder[(themeOrder.indexOf(safeTheme) + 1) % themeOrder.length];
    const labels = { light: "Light", dark: "Night", red: "Observatory Red", teal: "Royal Teal" };
    const icons = { light: "themeMoon", dark: "themeRed", red: "themeSun", teal: "themeTeal" };
    root.dataset.theme = safeTheme;
    els.themeToggle.innerHTML = iconSvg(icons[safeTheme]);
    els.themeToggle.setAttribute("aria-label", `Current theme: ${labels[safeTheme]}. Switch to ${labels[nextTheme]}`);
    els.themeToggle.title = `Switch to ${labels[nextTheme]}`;
    if (persist && safeStorageGet(themePreferenceKey) === "yes") safeStorageSet(themeKey, safeTheme);
    postEmbedMessage({ type: "amc:theme-state", theme: safeTheme });
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
    const time = document.createElement("b");
    const detail = document.createElement("span");
    time.textContent = segment.dataset.tooltipTime || "Time window";
    detail.textContent = text;
    els.tooltip.replaceChildren(time, detail);
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
    return events.sort((left, right) => eventImportance(right) - eventImportance(left));
  }

  function primaryEvent(events) {
    return events[0] || { type: "none", title: "", copy: "", fact: "", sourceIds: [], media: null };
  }

  function eventImportance(event) {
    const priorities = { eclipse: 100, occultation: 86, meteor: 82, opposition: 76, launch: 72, sky: 58, telescope: 48, moon: 24, note: 12, none: 0 };
    return priorities[event?.type] || 0;
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
    if (state.month.year !== 2026) return shared.phaseDiagram(state.moonData[day]?.age || 0);
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
    if (!state.hasLocation) return { best: "Use location", altitude: "Use location", maxAltitude: null };
    if (!meta || (!meta.body && !Number.isFinite(meta.ra))) return { best: "After dark", altitude: "Varies", maxAltitude: null };
    const cacheKey = `${state.monthId}:${day}:${state.lat.toFixed(3)}:${state.lon.toFixed(3)}:${meta.name || meta.body || meta.ra}`;
    if (state.targetObservationCache.has(cacheKey)) return state.targetObservationCache.get(cacheKey);
    try {
      const Astronomy = window.Astronomy;
      const observer = new Astronomy.Observer(state.lat, state.lon, 0);
      const solarTarget = meta.body === "Sun" || /solar/i.test(meta.type || "");
      const start = solarTarget
        ? zonedDate(state.month.year, state.month.monthIndex, day, 6, 0, 0)
        : zonedDate(state.month.year, state.month.monthIndex, day, 16, 0, 0);
      const end = solarTarget
        ? zonedDate(state.month.year, state.month.monthIndex, day, 20, 0, 0)
        : zonedDate(state.month.year, state.month.monthIndex, day + 1, 8, 0, 0);
      const samples = [];
      for (let step = 0; step <= 32; step += 1) {
        const sample = new Date(start.getTime() + (step / 32) * (end.getTime() - start.getTime()));
        const altitude = meta.body ? bodyAltitude(Astronomy.Body[meta.body], sample, observer) : Astronomy.Horizon(sample, observer, meta.ra, meta.dec, "normal").altitude;
        const sunAltitude = bodyAltitude(Astronomy.Body.Sun, sample, observer);
        samples.push({ date: sample, altitude, sunAltitude });
      }
      const eligible = solarTarget
        ? samples.filter(sample => sample.sunAltitude > 0)
        : samples.filter(sample => sample.sunAltitude <= -18).length
          ? samples.filter(sample => sample.sunAltitude <= -18)
          : samples.filter(sample => sample.sunAltitude <= -12).length
            ? samples.filter(sample => sample.sunAltitude <= -12)
            : samples.filter(sample => sample.sunAltitude <= -6);
      const best = eligible.reduce((highest, sample) => !highest || sample.altitude > highest.altitude ? sample : highest, null);
      const result = !eligible.length && !solarTarget
        ? { best: "No dark window", altitude: "No dark window", maxAltitude: -90 }
        : !best || best.altitude < 0
          ? { best: "Below horizon", altitude: "Below horizon", maxAltitude: best?.altitude ?? -90 }
          : { best: formatTime(best.date), altitude: `${Math.round(best.altitude)}°`, maxAltitude: best.altitude };
      state.targetObservationCache.set(cacheKey, result);
      return result;
    } catch {
      return { best: "Unavailable", altitude: "Unavailable", maxAltitude: null };
    }
  }

  function targetThumbnail(target, day) {
    const text = String(target).toLowerCase();
    if (/moon[-\s]antares|antares occultation/.test(text)) return wikimediaImage("Antares and Crescent Moon.jpg", "Moon and Antares thumbnail");
    if (/rho ophiuchi|antares region/.test(text)) return wikimediaImage("Antares and Rho Ophiuchi by Adam Block.jpg", "Rho Ophiuchi and Antares region thumbnail");
    if (/antares/.test(text)) return wikimediaImage("Antares (Updated).jpg", "Antares thumbnail");
    if (/elnath|beta tauri/.test(text)) return wikimediaImage("Elnath.png", "Elnath Beta Tauri thumbnail");
    if (/regulus/.test(text)) return imageAsset("https://apod.nasa.gov/apod/image/2404/Regulus_Dwarf_by_Markus_Horn1024.png", "Regulus star field thumbnail");
    if (/comet 10p|tempel 2/.test(text)) return imageAsset("https://assets.science.nasa.gov/content/dam/science/cds/apod/apod/2026/july/10P_Tempel2_20260711_DEBartlett2048.jpg?w=400&h=230&fit=crop&crop=faces%2Cfocalpoint", "Comet 10P Tempel 2 thumbnail");
    if (/globular cluster/.test(text)) return wikimediaImage("Messier 13 Hubble WikiSky.jpg", "Globular cluster thumbnail");
    if (/saturn/.test(text)) return wikimediaImage("Saturn during Equinox.jpg", "Saturn thumbnail");
    if (/jupiter/.test(text)) return imageAsset("https://images-assets.nasa.gov/image/PIA22946/PIA22946~medium.jpg", "Jupiter thumbnail");
    if (/mars/.test(text)) return imageAsset("https://images-assets.nasa.gov/image/PIA00407/PIA00407~medium.jpg", "Mars thumbnail");
    if (/mercury/.test(text)) return imageAsset("https://images-assets.nasa.gov/image/PIA15160/PIA15160~medium.jpg", "Mercury thumbnail");
    if (/uranus/.test(text)) return imageAsset("https://images-assets.nasa.gov/image/PIA18182/PIA18182~medium.jpg", "Uranus thumbnail");
    if (/neptune/.test(text)) return imageAsset("https://images-assets.nasa.gov/image/PIA01492/PIA01492~medium.jpg", "Neptune thumbnail");
    if (/pluto/.test(text)) return imageAsset("https://images-assets.nasa.gov/image/PIA19952/PIA19952~medium.jpg", "Pluto thumbnail");
    if (/pleiades|m45/.test(text)) return wikimediaImage("Pleiades large.jpg", "Pleiades thumbnail");
    if (/lagoon|m8/.test(text)) return wikimediaImage("Lagoon Nebula.jpg", "Lagoon Nebula thumbnail");
    if (/trifid|m20/.test(text)) return wikimediaImage("Trifid.nebula.arp.750pix.jpg", "Trifid Nebula thumbnail");
    if (/eagle|m16/.test(text)) return wikimediaImage("Eagle Nebula from ESO.jpg", "Eagle Nebula thumbnail");
    if (/omega nebula|swan nebula|m17/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/VST_image_of_the_spectacular_star-forming_region_Messier_17_%28Omega_Nebula%29.jpg/330px-VST_image_of_the_spectacular_star-forming_region_Messier_17_%28Omega_Nebula%29.jpg", "Omega Nebula thumbnail");
    if (/dumbbell|m27/.test(text)) return imageAsset("https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2003/02/STScI-01EVVK02SYNTXZDX0JXGS3DGHN.tif/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "Dumbbell Nebula thumbnail");
    if (/ring nebula|m57/.test(text)) return wikimediaImage("M57 The Ring Nebula.JPG", "Ring Nebula thumbnail");
    if (/cygnus loop|veil nebula|ngc 6960|ngc 6992/.test(text)) return imageAsset("https://science.nasa.gov/wp-content/uploads/2023/07/veil-nebula.jpg?w=600", "Cygnus Loop and Veil Nebula thumbnail");
    if (/clamshell|sh2-119/.test(text)) return imageAsset("https://images.squarespace-cdn.com/content/v1/5debd4b16fcd7b02905712ff/37b3f6ce-ed44-41dd-8be1-a4ecd415dcca/BEAFD85B-9D1F-4069-9A39-DDD2042D1D5E.jpeg?format=750w", "Clamshell Nebula Sh2-119 thumbnail");
    if (/sadr|gamma cygni|ic 1318/.test(text)) return imageAsset("https://www.guidetothesky.com/images/s/out/sadr_1h_40m_49s_siril_2.jpg", "Sadr Region IC 1318 thumbnail");
    if (/elephant trunk|ic 1396a|vdb 142/.test(text)) return imageAsset("https://storage.noirlab.edu/media/archives/images/screen/noao-ic1396.jpg", "Elephant Trunk Nebula IC 1396A thumbnail");
    if (/pelican|ic 5070/.test(text)) return wikimediaImage("Pelican Nebula.jpg", "Pelican Nebula IC 5070 thumbnail");
    if (/crescent nebula|ngc 6888|caldwell 27/.test(text)) return imageAsset("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2000/07/STScI-01EVVP4D33NAHDY0D95T7RPFRE.tif?w=600", "Crescent Nebula NGC 6888 thumbnail");
    if (/bubble nebula|ngc 7635/.test(text)) return imageAsset("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2016/04/STScI-01EVVGYQGFWPRBWKW0HNACJMEB.tif?w=600", "Bubble Nebula NGC 7635 thumbnail");
    if (/heart nebula|soul nebula|ic 1805|ic 1848/.test(text)) return imageAsset("https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia13/pia13112/PIA13112.jpg?w=600&h=426&fit=clip&crop=faces%2Cfocalpoint", "Heart and Soul nebulae thumbnail");
    if (/north america|ngc 7000/.test(text)) return imageAsset("https://science.nasa.gov/wp-content/uploads/2023/04/ngc7000_wfpc2_2flat_final-jpg.webp?w=600", "North America Nebula thumbnail");
    if (/andromeda|m31/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg/330px-Andromeda_Galaxy_%28with_h-alpha%29.jpg", "Andromeda Galaxy thumbnail");
    if (/triangulum|m33/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Triangulum_Galaxy_M33.jpg/330px-Triangulum_Galaxy_M33.jpg", "Triangulum Galaxy thumbnail");
    if (/whirlpool|m51/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Messier51_sRGB.jpg/330px-Messier51_sRGB.jpg", "Whirlpool Galaxy thumbnail");
    if (/pinwheel|m101/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M101_hires_STScI-PRC2006-10a.jpg/330px-M101_hires_STScI-PRC2006-10a.jpg", "Pinwheel Galaxy thumbnail");
    if (/centaurus a|ngc 5128/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Black_Hole_Outflows_From_Centaurus_A.jpg/330px-Black_Hole_Outflows_From_Centaurus_A.jpg", "Centaurus A thumbnail");
    if (/sculptor galaxy|ngc 253/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Sculptor_Galaxy%2C_NGC_253_%28noao-ngc-253%29.tiff/lossy-page1-330px-Sculptor_Galaxy%2C_NGC_253_%28noao-ngc-253%29.tiff.jpg", "Sculptor Galaxy thumbnail");
    if (/ngc 55/.test(text)) return imageAsset("https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Irregular_Galaxy_NGC_55_%28ESO_0914a%29.jpg/330px-Irregular_Galaxy_NGC_55_%28ESO_0914a%29.jpg", "NGC 55 thumbnail");
    if (/hercules cluster|m13/.test(text)) return wikimediaImage("Messier 13 Hubble WikiSky.jpg", "Hercules Cluster thumbnail");
    if (/omega centauri|ngc 5139/.test(text)) return imageAsset("https://science.nasa.gov/wp-content/uploads/2023/04/c80-1-jpg.webp?w=600", "Omega Centauri thumbnail");
    if (/messier 4|m4\b/.test(text)) return imageAsset("https://assets.science.nasa.gov/content/dam/science/missions/hubble/stars/globular-clusters/Hubble_M4_WFC3_ACS_ok_flat_cont_FINAL_NewImage.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "Messier 4 thumbnail");
    if (/messier 5|m5\b/.test(text)) return imageAsset("https://assets.science.nasa.gov/content/dam/science/missions/hubble/stars/globular-clusters/Hubble_M5_WFC3_UV_flat_FINAL_NewImage.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "Messier 5 thumbnail");
    if (/messier 2|m2\b/.test(text)) return imageAsset("https://assets.science.nasa.gov/content/dam/science/missions/hubble/stars/globular-clusters/Hubble_M2_potw1913a.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "Messier 2 thumbnail");
    if (/messier 15|m15\b/.test(text)) return imageAsset("https://science.nasa.gov/wp-content/uploads/2023/04/heic1321a-jpg.webp?w=600", "Messier 15 thumbnail");
    if (/orion nebula|m42\b/.test(text)) return wikimediaImage("Orion Nebula (M42) part HST 4800px.jpg", "Orion Nebula thumbnail");
    if (/horsehead|barnard 33/.test(text)) return imageAsset("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2001/04/STScI-01EVT9N4HJ57T0R4MN2MJW8N89.jpg?crop=faces%2Cfocalpoint&fit=clip&h=813&w=800", "Optical image of the Horsehead Nebula by Travis Rector (NOAO)", "Travis Rector (NOAO)");
    if (/rosette|ngc 2237/.test(text)) return wikimediaImage("Rosette nebula s.jpg", "Rosette Nebula thumbnail");
    if (/california|ngc 1499/.test(text)) return wikimediaImage("California nebula NGC1499.jpg", "California Nebula thumbnail");
    if (/double cluster|ngc 869|ngc 884/.test(text)) return imageAsset("https://cdn.eso.org/images/screen/b02.jpg", "The Double Cluster in Perseus, ESO/S. Brunier", "ESO/S. Brunier");
    if (/asteroid 9 metis|\bmetis\b/.test(text)) return imageAsset("https://damit.cuni.cz/projects/damit/stored_files/open/85/shape.png", "Asteroid 9 Metis shape model thumbnail");
    if (/meteor|perseid|aquariid|capricornid|cygnid|aurigid|taurid|leonid|geminid|ursid/.test(text)) return wikimediaImage("Perseid meteor shower.jpg", "Meteor shower thumbnail");
    if (/moon|lunar|crater/.test(text)) return wikimediaImage("Full Moon Luc Viatour.jpg", "Moon thumbnail");
    if (/venus/.test(text)) return wikimediaImage("Venus-real color.jpg", "Venus thumbnail");
    if (/planet/.test(text)) return wikimediaImage("Solar System true color.jpg", "Planet thumbnail");
    if (/milky way/.test(text)) return wikimediaImage("ESO - Milky Way.jpg", "Milky Way thumbnail");
    if (/comet/.test(text)) return wikimediaImage("Comet Hartley 2.jpg", "Comet thumbnail");
    if (/eclipse|solar|corona/.test(text)) return wikimediaImage("Total Solar Eclipse 8-21-17.jpg", "Solar eclipse thumbnail");
    return { src: state.media.milkyWay?.src || moonImage(day, 216), alt: `${target} thumbnail` };
  }

  function wikimediaImage(fileName, alt) {
    return { src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=320`, alt };
  }

  function imageAsset(src, alt, credit = "") {
    return { src, alt, credit };
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
    if (stateName === "dark") return "";
    if (stateName === "astro") return "Astronomical twilight";
    if (stateName === "nautical") return width < (compact ? 38 : 46) ? "Nautical" : "Nautical night";
    return "";
  }

  function compressBands(states) {
    if (!states.length) return [{ startHour: 0, endHour: chartDurationHours, state: "light" }];
    const bands = [];
    let start = 0;
    for (let index = 1; index <= states.length; index += 1) {
      if (states[index] === states[start]) continue;
      bands.push({ startHour: Number(((start / states.length) * chartDurationHours).toFixed(3)), endHour: Number(((index / states.length) * chartDurationHours).toFixed(3)), state: states[start] });
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

  function chartNowMarker(startMs, endMs) {
    const now = Date.now();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || now < startMs || now > endMs) return null;
    const date = new Date(now);
    const parts = zonedDateParts(date);
    let altitude = "N/A";
    try {
      const Astronomy = window.Astronomy;
      const observer = new Astronomy.Observer(state.lat, state.lon, 0);
      altitude = `${Math.round(bodyAltitude(Astronomy.Body.Moon, date, observer))}°`;
    } catch {}
    const time = `${parts.hour}:${parts.minute}`;
    const dateLabel = `${Number(parts.day)} ${monthShort[Number(parts.month) - 1]}`;
    return {
      hour: chartDurationHours * (now - startMs) / Math.max(1, endMs - startMs),
      time,
      date: dateLabel,
      altitude,
      detail: `${time} · ${dateLabel} · ${altitude}`
    };
  }

  function chartTwilightMarker(event, start, end, label, type) {
    const date = event?.date;
    if (!date || date < start || date > end) return null;
    return { hour: chartHour(date, start, end), label, type };
  }

  function chartHour(date, start, end) {
    return Number((chartDurationHours * (date.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime())).toFixed(3));
  }

  function chartPoint(point, chart, maxAltitude) {
    return {
      x: Number((chart.x + (point.hour / chartDurationHours) * chart.width).toFixed(2)),
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
    return { minutes: null, label: "Set location", window: useLocationText, nautical: null };
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
    const date = astroTime?.date;
    return formatTime(date ? new Date(Math.round(date.getTime() / 60000) * 60000) : null);
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
    const zone = cleanTimeZone(timeZone) || "UTC";
    let formatter = zonedFormatters.get(zone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
      zonedFormatters.set(zone, formatter);
    }
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
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("month");
    if (params.get("snapshot") === "1" && requested && manifest.some(item => item.id === requested)) return requested;
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
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
    return `${weekday}, ${day} ${monthShort[month - 1]}`;
  }

  function numberAt(items, index) {
    const raw = items?.[index];
    if (raw === null || raw === undefined || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function avg(values) {
    const safe = values.filter(Number.isFinite);
    return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0;
  }

  function transparencyLabel(score) { return observingRating(score).label; }

  function seeingLabel(score) { return observingRating(score).label; }

  function observingRating(score) {
    if (!Number.isFinite(score)) return { key: "unavailable", label: "Unavailable" };
    if (score >= 90) return { key: "excellent", label: "Excellent" };
    if (score >= 78) return { key: "good", label: "Good" };
    if (score >= 64) return { key: "fair", label: "Fair" };
    if (score >= 45) return { key: "average", label: "Average" };
    return { key: "poor", label: "Poor" };
  }

  function observingColour(key) {
    return `var(--observing-${key})`;
  }

  function segmentColour(segment, metric) {
    if (!Number.isFinite(segment.observingScore)) return observingColour("unavailable");
    if (metric === "observing") return observingColour(observingRating(segment.observingScore).key);
    if (metric === "cloud") return cloudColour(segment.cloud);
    if (metric === "temperature") return temperatureColour(segment.temperature);
    if (metric === "transparency") return transparencyColour(segment.transparency);
    if (metric === "seeing") return seeingColour(segment.seeing);
    if (metric === "wind") return windColour(segment.wind);
    return "rgba(139,146,156,.28)";
  }

  function segmentTooltip(segment, metric) {
    if (!Number.isFinite(segment.observingScore)) return "Forecast unavailable for this interval";
    if (metric === "observing") return `Conditions: ${observingRating(segment.observingScore).label}`;
    if (metric === "cloud") return `Cloud: ${Math.round(segment.cloud)}%`;
    if (metric === "temperature") return `Temperature: ${Math.round(segment.temperature)}°C`;
    if (metric === "transparency") return `Transparency: ${transparencyLabel(segment.transparency)}`;
    if (metric === "seeing") return `Seeing: ${seeingLabel(segment.seeing)}`;
    if (metric === "wind") return `Wind: ${Math.round(segment.wind)} km/h`;
    return "Unavailable";
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
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
    if (code >= 80 && code <= 82) return "showers";
    if ((code >= 51 && code <= 67)) return "rain";
    if (code >= 45 && code <= 48) return "fog";
    if (cloud <= 10) return "stars";
    if (cloud <= 30) return "cloudThreeStars";
    if (cloud <= 50) return "cloudTwoStars";
    if (cloud <= 80) return "cloudOneStar";
    return "cloudy";
  }

  function representativeWeatherCode(codes) {
    const safe = codes.filter(Number.isFinite);
    if (!safe.length) return 0;
    return safe.reduce((selected, code) => weatherCodeSeverity(code) > weatherCodeSeverity(selected) ? code : selected, safe[0]);
  }

  function weatherCodeSeverity(code) {
    if (code >= 95) return 8;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 7;
    if (code >= 80 && code <= 82) return 6;
    if (code >= 61 && code <= 67) return 5;
    if (code >= 51 && code <= 57) return 4;
    if (code >= 45 && code <= 48) return 3;
    if (code >= 1 && code <= 3) return 2;
    return 1;
  }

  function weatherIconKinds(segments, fallback) {
    return segments.map(segment => weatherKind(segment.code, segment.cloud) || fallback);
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
    if (validTimeZones.has(text)) return validTimeZones.get(text);
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: text }).format(new Date());
      validTimeZones.set(text, text);
      return text;
    } catch {
      validTimeZones.set(text, "");
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

  function safeStorageRemove(key) {
    try { localStorage.removeItem(key); } catch {}
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
      themeRed: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 19h8M9 22h6"/><path d="M8.5 16.5A7 7 0 1 1 15.5 16.5L14 19h-4Z"/><circle cx="12" cy="10" r="2.3" fill="currentColor" stroke="none"/></svg>`,
      themeSun: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
      themeTeal: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15.5c2.2-4.1 4.5-6.1 7-6.1 2.6 0 4.9 2 7 6.1"/><path d="M5 18.5c2.2-2.2 4.5-3.3 7-3.3 2.6 0 4.9 1.1 7 3.3"/><circle cx="12" cy="5.3" r="1.6"/></svg>`,
      event: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7 3v4M17 3v4M3.5 9h17"/><path d="m12 12 .8 1.7 1.9.2-1.4 1.3.4 1.8-1.7-.9-1.7.9.4-1.8-1.4-1.3 1.9-.2Z"/></svg>`,
      altitude: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M5 17a8 8 0 0 1 14-5"/><circle cx="17.5" cy="9.5" r="2"/><path d="M8 16V7m0 0L5.5 9.5M8 7l2.5 2.5"/></svg>`,
      azimuth: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m14.8 8.2-1.6 5-5 1.6 1.6-5Z"/><path d="M12 3.5V6M12 18v2.5M3.5 12H6M18 12h2.5"/></svg>`,
      moonrise: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M18.2 12.7A4.8 4.8 0 0 1 12.3 6.8a5.5 5.5 0 1 0 5.9 5.9Z"/><path d="M7 15V6m0 0L4.5 8.5M7 6l2.5 2.5"/></svg>`,
      moonset: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M18.2 12.7A4.8 4.8 0 0 1 12.3 6.8a5.5 5.5 0 1 0 5.9 5.9Z"/><path d="M7 6v9m0 0-2.5-2.5M7 15l2.5-2.5"/></svg>`,
      sunrise: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><circle cx="15.5" cy="11" r="3"/><path d="M15.5 5.5V4M11.6 7.1l-1-1M19.4 7.1l1-1M20 11h1.5"/><path d="M7 15V6m0 0L4.5 8.5M7 6l2.5 2.5"/></svg>`,
      sunset: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><circle cx="15.5" cy="9" r="3"/><path d="M15.5 3.5V2M11.6 5.1l-1-1M19.4 5.1l1-1M20 9h1.5"/><path d="M7 5v10m0 0-2.5-2.5M7 15l2.5-2.5"/></svg>`
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
