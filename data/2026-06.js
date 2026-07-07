(() => {
  "use strict";

  window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};

  function event(type, title, copy, fact, sourceIds, mediaAsset) {
    return { type, title, copy, fact, sourceIds, media: mediaAsset || null };
  }

  function nasaImage(src, link) {
    return { src, link };
  }

  function moonImage(day, size) {
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
  }

  const MONTH = {
    year: 2026,
    monthIndex: 5,
    days: 30,
    firstDayOffset: 0
  };

  const sources = {
    nasaSvs: {
      label: "NASA SVS 2026 Moon Phase and Libration",
      url: "https://svs.gsfc.nasa.gov/5587/",
      note: "Daily Moon images and illumination values use NASA's LRO-based 2026 visualisation frames, sampled at 12:00 UT."
    },
    nasaSky: {
      label: "NASA What's Up, June 2026",
      url: "https://science.nasa.gov/solar-system/whats-up-june-2026-skywatching-tips-from-nasa/",
      note: "Reference for the Venus-Jupiter conjunction, Mercury/Venus/Jupiter evening grouping, Moon-Venus event, June solstice and seasonal deep-sky context."
    },
    astronomyEngine: {
      label: "Astronomy Engine",
      url: "https://github.com/cosinekitty/astronomy",
      note: "Moon altitude, azimuth, rise/set, exact phase searches and twilight calculations use Astronomy Engine's browser library."
    },
    openMeteo: {
      label: "Open-Meteo Forecast API",
      url: "https://open-meteo.com/en/docs",
      note: "The local 3-day forecast uses Open-Meteo hourly cloud cover, humidity, temperature, precipitation probability, wind speed, WMO weather codes and location timezone. Seeing is an in-calendar planning estimate from those variables, not a dedicated CMC seeing model."
    },
    openMeteoGeo: {
      label: "Open-Meteo Geocoding API",
      url: "https://open-meteo.com/en/docs/geocoding-api",
      note: "Manual place-name search uses Open-Meteo geocoding for coordinates and timezone, then the calendar recalculates local astronomical timing and weather."
    },
    inSky: {
      label: "In-The-Sky.org June 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?maxdiff=7&month=6&year=2026",
      note: "Cross-check for close approaches, conjunctions, occultations and monthly event ordering."
    },
    seaSky: {
      label: "Sea and Sky 2026 astronomy calendar",
      url: "https://www.seasky.org/astronomy/astronomy-calendar-current.html",
      note: "Cross-check for June 2026 New Moon and Full Moon dates and general phase context."
    },
    astromaniacArticles: {
      label: "Astromaniac Magazine articles",
      url: "https://www.astromaniacmagazine.com/articles",
      note: "Article recommendations are selected from Astromaniac Magazine's articles index and matched to the night's Moon and sky context."
    }
  };

  const articleData = {
    deepSky: {
      title: "Astrophotography Anywhere: Best Deep-Sky Targets for Light-Polluted and Dark-Sky Locations",
      url: "https://www.astromaniacmagazine.com/articles/astrophotography-anywhere-best-deep-sky-targets-for-light-polluted-and-dark-sky-locations"
    },
    moon: {
      title: "Supermoon: How An Illusion Makes The Full Moon Appear Bigger Than It Really Is",
      url: "https://www.astromaniacmagazine.com/articles/supermoon-how-an-illusion-makes-the-full-moon-appear-bigger-than-it-really-is"
    },
    launch: {
      title: "What's Gone Wrong Between Nasa And Elon Musk's SpaceX?",
      url: "https://www.astromaniacmagazine.com/articles/whats-gone-wrong-between-nasa-and-elon-musks-spacex"
    },
    numbers: {
      title: "The Big Seven: Why Numbers Matter in Astrophotography",
      url: "https://www.astromaniacmagazine.com/articles/why-numbers-matter-in-astrophotography"
    },
    telescope: {
      title: "A New Generation of Telescopes Will Probe The Unknown Unknowns",
      url: "https://www.astromaniacmagazine.com/articles/new-generation-of-telescopes"
    },
    planetary: {
      title: "A Real Treat for Skywatchers: Rare Planetary Parade",
      url: "https://www.astromaniacmagazine.com/articles/rare-planetary-parade"
    },
    lightPollution: {
      title: "Light Pollution Has Cut Humanity's Ancient Connection With The Stars",
      url: "https://www.astromaniacmagazine.com/articles/light-pollution"
    },
    accessories: {
      title: "14 Underrated Astrophotography Accessories That Will Transform Your Workflow",
      url: "https://www.astromaniacmagazine.com/articles/14-underrated-astrophotography-accessories-that-will-transform-your-workflow"
    }
  };

  const media = {
    milkyWay: nasaImage("https://images-assets.nasa.gov/image/PIA13974/PIA13974~medium.jpg", "https://images.nasa.gov/details/PIA13974"),
    planets: nasaImage("https://images-assets.nasa.gov/image/PIA00405/PIA00405~medium.jpg", "https://images.nasa.gov/details/PIA00405"),
    venus: nasaImage("https://images-assets.nasa.gov/image/PIA00104/PIA00104~medium.jpg", "https://images.nasa.gov/details/PIA00104"),
    sun: nasaImage("https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000982/GSFC_20171208_Archive_e000982~medium.jpg", "https://images.nasa.gov/details/GSFC_20171208_Archive_e000982")
  };

  const moonData = {
    1: { frame: 3637, phase: 98.7, age: 15.67, distance: 406324 },
    2: { frame: 3661, phase: 95.8, age: 16.67, distance: 405740 },
    3: { frame: 3685, phase: 91.3, age: 17.67, distance: 404397 },
    4: { frame: 3709, phase: 85.2, age: 18.67, distance: 402235 },
    5: { frame: 3733, phase: 77.8, age: 19.67, distance: 399205 },
    6: { frame: 3757, phase: 69.2, age: 20.67, distance: 395299 },
    7: { frame: 3781, phase: 59.5, age: 21.67, distance: 390568 },
    8: { frame: 3805, phase: 49.3, age: 22.67, distance: 385148 },
    9: { frame: 3829, phase: 38.7, age: 23.67, distance: 379275 },
    10: { frame: 3853, phase: 28.3, age: 24.67, distance: 373293 },
    11: { frame: 3877, phase: 18.6, age: 25.67, distance: 367638 },
    12: { frame: 3901, phase: 10.4, age: 26.67, distance: 362800 },
    13: { frame: 3925, phase: 4.2, age: 27.67, distance: 359259 },
    14: { frame: 3949, phase: 0.8, age: 28.67, distance: 357409 },
    15: { frame: 3973, phase: 0.4, age: 0.38, distance: 357473 },
    16: { frame: 3997, phase: 3.0, age: 1.38, distance: 359456 },
    17: { frame: 4021, phase: 8.5, age: 2.38, distance: 363142 },
    18: { frame: 4045, phase: 16.1, age: 3.38, distance: 368139 },
    19: { frame: 4069, phase: 25.3, age: 4.38, distance: 373960 },
    20: { frame: 4093, phase: 35.4, age: 5.38, distance: 380099 },
    21: { frame: 4117, phase: 45.8, age: 6.38, distance: 386103 },
    22: { frame: 4141, phase: 56.1, age: 7.38, distance: 391606 },
    23: { frame: 4165, phase: 65.9, age: 8.38, distance: 396355 },
    24: { frame: 4189, phase: 74.8, age: 9.38, distance: 400198 },
    25: { frame: 4213, phase: 82.6, age: 10.38, distance: 403077 },
    26: { frame: 4237, phase: 89.2, age: 11.38, distance: 405004 },
    27: { frame: 4261, phase: 94.3, age: 12.38, distance: 406039 },
    28: { frame: 4285, phase: 97.8, age: 13.38, distance: 406261 },
    29: { frame: 4309, phase: 99.6, age: 14.38, distance: 405755 },
    30: { frame: 4333, phase: 99.7, age: 15.38, distance: 404590 }
  };

  const exactMoon = {
    8: "Last Quarter 10:01 UTC",
    15: "New Moon 02:55 UTC",
    21: "First Quarter 21:56 UTC",
    29: "Full Moon 23:57 UTC"
  };

  const monthIntel = [
    { title: "Moon-free dates", text: "14-17 Jun. The darkest window of the month.", image: moonImage(15, 216), alt: "New Moon" },
    { title: "Astronomical night", text: "Use location to calculate local dark-time windows.", image: media.milkyWay.src, alt: "Milky Way night sky" },
    { title: "Planet pairing", text: "Venus and Jupiter form the headline evening pairing.", image: media.planets.src, alt: "Planet pairing" },
    { title: "June solstice", text: "21 Jun. Short northern nights, long southern nights.", image: media.sun.src, alt: "Sun" }
  ];

  const eventData = {
    8: [
      event("moon", "Last Quarter Moon", "Exact phase 10:01 UTC. The Moon rises late, improving early-night dark-sky windows.", "Moon phase marker.", ["astronomyEngine", "nasaSvs"])
    ],
    9: [
      event("sky", "Venus and Jupiter conjunction", "Bright evening pairing after sunset. Separation and altitude depend on location.", "Planet pairing.", ["nasaSky", "inSky"], media.planets)
    ],
    12: [
      event("sky", "Mercury joins Venus and Jupiter", "Mercury enters the evening line-up with Venus and Jupiter low in twilight.", "Clear western horizon needed.", ["nasaSky", "inSky"], media.planets)
    ],
    15: [
      event("moon", "New Moon", "Exact phase 02:55 UTC. Lunar illumination is near zero.", "Moon phase marker.", ["astronomyEngine", "nasaSvs", "seaSky"]),
      event("sky", "Mercury at evening elongation", "Mercury is favourably placed in evening twilight for many observers.", "Visibility depends on latitude and horizon.", ["inSky", "nasaSky"], media.planets)
    ],
    17: [
      event("occultation", "Moon and Venus", "The Moon passes Venus; occultation visibility is path-dependent.", "Twilight pairing and occultation opportunity.", ["nasaSky", "inSky"], media.venus)
    ],
    21: [
      event("sky", "June solstice", "The Sun reaches its northernmost declination at the June solstice.", "Season marker.", ["nasaSky"], media.sun),
      event("moon", "First Quarter Moon", "Exact phase 21:56 UTC. Lunar terminator detail is strong.", "Moon phase marker.", ["astronomyEngine", "nasaSvs"])
    ],
    29: [
      event("moon", "Full Moon", "Exact phase 23:57 UTC. The Moon is effectively fully illuminated.", "Moon phase marker.", ["astronomyEngine", "nasaSvs", "seaSky"])
    ]
  };

  window.AMC_MONTH_DATA["2026-06"] = {
    id: "2026-06",
    MONTH,
    sources,
    articleData,
    media,
    moonData,
    exactMoon,
    monthIntel,
    eventData
  };
})();
