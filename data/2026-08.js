(() => {
  "use strict";

  window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};

  const shared = window.AMC_SHARED || {};
  const event = shared.event;
  const buildMoonData = shared.buildMoonData;
  const articleData = shared.articleData;
  const media = shared.media;

  const MONTH = {
    year: 2026,
    monthIndex: 7,
    days: 31
  };

  const sources = {
    ...shared.sources,
    inSky: {
      label: "In-The-Sky.org August 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?maxdiff=7&month=8&year=2026",
      note: "Cross-check for Moon phases, close approaches, meteor showers, comet placement and eclipse dates."
    },
    rmg2026: {
      label: "Royal Observatory Greenwich 2026 night-sky guide",
      url: "https://www.rmg.co.uk/stories/space-astronomy/2026-guide-night-sky",
      note: "High-level 2026 observing context and seasonal sky highlights."
    },
    nasaEclipse: {
      label: "NASA August 12 2026 total solar eclipse",
      url: "https://science.nasa.gov/eclipses/future-eclipses/total-solar-eclipse-on-august-12-2026/",
      note: "Reference for the 12 August 2026 total solar eclipse path and visibility."
    },
    nasaSvsEclipse: {
      label: "NASA SVS 2026 total solar eclipse map",
      url: "https://svs.gsfc.nasa.gov/5647",
      note: "NASA visualisation reference for the August 2026 eclipse path."
    },
    usnoPhases: {
      label: "US Naval Observatory 2026 Moon phases",
      url: "https://aa.usno.navy.mil/calculated/moon/phases?year=2026",
      note: "Primary Moon phase dates and times are checked against the USNO table in Universal Time."
    },
    nasaLunarEclipse: {
      label: "NASA 2026 lunar eclipses",
      url: "https://science.nasa.gov/moon/eclipses/",
      note: "Reference for the 28 August partial lunar eclipse and its visibility region."
    },
    nasaSkyCal: {
      label: "NASA 2026 Sky Events Calendar",
      url: "https://eclipse.gsfc.nasa.gov/SKYCAL/SKYCAL.html?cal=2026",
      note: "UTC cross-check for August planetary events, lunar pairings, meteor peaks and primary Moon phases."
    }
  };

  const moonData = buildMoonData(MONTH.year, MONTH.monthIndex, MONTH.days);

  function moonImage(day, size) {
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
  }

  const exactMoon = {
    6: "Last Quarter",
    12: "New Moon",
    20: "First Quarter",
    28: "Full Moon"
  };

  const monthIntel = [
    { title: "Solar eclipse", text: "12 Aug. Total on the central path; partial across much of Europe and beyond.", image: media.eclipse.src, alt: "Solar eclipse planning" },
    { title: "Perseids", text: "13 Aug. Peak near New Moon, a strong meteor opportunity.", image: media.meteor.src, alt: "Meteor shower" },
    { title: "Venus elongation", text: "15 Aug. Venus reaches greatest evening elongation.", image: media.venus.src, alt: "Venus" },
    { title: "Comet 10P", text: "2-3 Aug. Perihelion and peak brightness are listed close together.", image: media.comet.src, alt: "Comet" }
  ];

  const targetData = {
    2: ["Comet 10P/Tempel 2", "Mercury", "Pre-dawn eastern sky"],
    3: ["Moon-Saturn pairing", "Saturn", "Comet 10P/Tempel 2"],
    7: ["Pleiades (M45)", "Waning crescent Moon", "Ring Nebula (M57)"],
    9: ["Moon-Mars pairing", "Mars", "Waning crescent Moon"],
    12: ["Solar eclipse", "New Moon", "Solar corona"],
    13: ["Perseids", "Milky Way fields", "Andromeda Galaxy (M31)"],
    14: ["Messier 15", "Andromeda Galaxy (M31)", "Comet 10P/Tempel 2"],
    15: ["Venus", "Messier 15", "Comet 10P/Tempel 2"],
    16: ["Moon-Venus pairing", "Crescent Moon", "Venus"],
    18: ["Kappa Cygnids", "Summer Milky Way", "Dumbbell Nebula (M27)"],
    20: ["First Quarter Moon", "Lunar terminator", "Messier 2"],
    28: ["Partial lunar eclipse", "Full Moon", "Moonrise"],
    30: ["Moon-Saturn pairing", "Saturn", "Waning gibbous Moon"],
    31: ["Moon-Saturn conjunction", "Saturn", "Waning gibbous Moon"]
  };

  const eventData = {
    2: [
      event("sky", "Comet 10P/Tempel 2 perihelion", "Comet 10P reaches perihelion and may be a binocular or small-telescope target under dark skies.", "Comet visibility varies by location and brightness.", ["inSky"], media.comet),
      event("sky", "Mercury at greatest western elongation", "Mercury is best placed before sunrise, with visibility depending on latitude and horizon.", "Morning planet highlight.", ["inSky"], media.planets)
    ],
    3: [
      event("sky", "Moon and Saturn", "The Moon passes close to Saturn in the sky.", "Moon-planet pairing.", ["inSky"], media.saturn),
      event("sky", "Comet 10P peak brightness", "In-The-Sky lists Comet 10P near peak brightness and closest approach around this date.", "Comet planning marker.", ["inSky"], media.comet)
    ],
    6: [
      event("moon", "Last Quarter Moon", "The phase occurs at 02:21 UTC; the Moon rises late, improving early-night sky contrast.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "nasaSkyCal"])
    ],
    7: [
      event("sky", "Moon near the Pleiades", "The waning Moon passes near the Pleiades cluster.", "Moon-cluster pairing.", ["inSky"], media.pleiades)
    ],
    9: [
      event("sky", "Moon and Mars", "The waning crescent Moon passes Mars before sunrise.", "Moon-planet pairing.", ["nasaSkyCal", "inSky"], media.planets)
    ],
    12: [
      event("moon", "New Moon", "New Moon occurs at 17:37 UTC, coinciding with the solar eclipse.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "nasaSkyCal"]),
      event("eclipse", "Solar eclipse: total and partial", "Totality crosses Greenland, Iceland, northern Russia, Spain and a small part of Portugal. A partial eclipse is visible across much of Europe, including London, and parts of Africa and North America.", "Use certified solar filters throughout every partial phase.", ["nasaEclipse", "nasaSvsEclipse", "nasaSkyCal"], media.eclipse)
    ],
    13: [
      event("meteor", "Perseid meteor shower peak", "Peak night falls close to New Moon, making this one of the strongest meteor opportunities of the year.", "Meteor shower peak.", ["inSky", "rmg2026"], media.meteor)
    ],
    14: [
      event("telescope", "Messier 15 well placed", "The globular cluster M15 is well placed for telescope and long-focal-length imaging.", "Deep-sky target.", ["inSky"], media.cluster)
    ],
    15: [
      event("sky", "Venus at greatest eastern elongation", "Venus reaches a favourable evening separation from the Sun at about 46 degrees east of the Sun.", "Evening planet highlight.", ["nasaSkyCal", "inSky"], media.venus)
    ],
    16: [
      event("sky", "Moon and Venus", "A young Moon passes Venus in evening twilight.", "Twilight pairing.", ["inSky"], media.venus)
    ],
    18: [
      event("meteor", "Kappa Cygnid meteor shower", "A minor shower known for occasional bright meteors.", "Meteor shower peak.", ["inSky"], media.meteor)
    ],
    20: [
      event("moon", "First Quarter Moon", "The phase occurs at 02:46 UTC; the lunar terminator is well placed for visual observing and lunar imaging.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "nasaSkyCal"])
    ],
    28: [
      event("eclipse", "Partial lunar eclipse", "The eclipse peaks at 04:14 UTC and is visible from the Americas, Europe, Africa and the eastern Pacific, subject to local Moon altitude and weather.", "Partial lunar eclipse.", ["nasaLunarEclipse", "nasaSkyCal"]),
      event("moon", "Full Moon", "Full Moon occurs at 04:18 UTC, four minutes after the eclipse maximum.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "nasaSkyCal"])
    ],
    30: [
      event("sky", "Moon and Saturn", "The Moon passes close to Saturn again near the end of the month.", "Moon-planet pairing.", ["inSky"], media.saturn)
    ],
    31: [
      event("sky", "Moon-Saturn conjunction", "The Moon and Saturn share the same right ascension; apparent separation depends on location and time.", "Moon-planet conjunction.", ["inSky"], media.saturn)
    ]
  };

  window.AMC_MONTH_DATA["2026-08"] = {
    id: "2026-08",
    MONTH,
    sources,
    articleData,
    media,
    moonData,
    exactMoon,
    monthIntel,
    targetData,
    eventData
  };
})();
