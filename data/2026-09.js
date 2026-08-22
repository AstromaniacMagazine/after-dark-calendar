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
    monthIndex: 8,
    days: 30
  };

  const sources = {
    ...shared.sources,
    inSky: {
      label: "In-The-Sky.org September 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?maxdiff=7&month=9&year=2026",
      note: "Cross-check for Moon phases, close approaches, occultations, meteor showers, Neptune opposition and equinox timing."
    },
    rmg2026: {
      label: "Royal Observatory Greenwich 2026 night-sky guide",
      url: "https://www.rmg.co.uk/stories/space-astronomy/2026-guide-night-sky",
      note: "High-level 2026 observing context and seasonal sky highlights."
    },
    usnoPhases: {
      label: "US Naval Observatory 2026 Moon phases",
      url: "https://aa.usno.navy.mil/calculated/moon/phases?year=2026",
      note: "Primary Moon phase dates and times are taken from the USNO table in Universal Time."
    },
    usnoSeasons: {
      label: "US Naval Observatory 2026 seasons",
      url: "https://aa.usno.navy.mil/calculated/seasons?year=2026&tz=0&dst=false",
      note: "Primary equinox timing in Universal Time."
    }
  };

  const moonData = buildMoonData(MONTH.year, MONTH.monthIndex, MONTH.days);

  function moonImage(day, size) {
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
  }

  const exactMoon = {
    4: "Last Quarter",
    11: "New Moon",
    18: "First Quarter",
    26: "Harvest Moon (Full Moon)"
  };

  const monthIntel = [
    { title: "New Moon", text: "11 Sep. Best dark-sky window falls around the middle of the month.", image: moonImage(11, 216), alt: "New Moon" },
    { title: "Venus brightest", text: "22 Sep. Venus reaches greatest brightness in the evening sky.", image: media.venus.src, alt: "Venus" },
    { title: "Equinox", text: "23 Sep. Seasonal marker as nights lengthen in the north.", image: media.sun.src, alt: "Sun" },
    { title: "Neptune opposition", text: "26 Sep. Advanced telescope target near Full Moon.", image: media.planets.src, alt: "Outer planet" }
  ];

  const targetData = {
    1: ["Aurigids", "Milky Way fields", "Andromeda Galaxy (M31)"],
    3: ["Pleiades (M45)", "Moon-Pleiades pairing", "Waning gibbous Moon"],
    6: ["Moon-Mars pairing", "Mars", "Waning crescent Moon"],
    8: ["Moon-Jupiter pairing", "Jupiter", "Waning crescent Moon"],
    9: ["September Epsilon Perseids", "Andromeda Galaxy (M31)", "Dumbbell Nebula (M27)"],
    11: ["Milky Way core", "Lagoon Nebula (M8)", "Trifid Nebula (M20)"],
    12: ["Moon-Mercury pairing", "Mercury", "Andromeda Galaxy (M31)"],
    14: ["Moon-Venus pairing", "Crescent Moon", "Venus"],
    17: ["Moon-Antares pairing", "Antares occultation", "Andromeda Galaxy (M31)"],
    18: ["First Quarter Moon", "Lunar terminator", "Craters"],
    22: ["Venus", "Andromeda Galaxy (M31)", "Dumbbell Nebula (M27)"],
    25: ["NGC 55", "Dumbbell Nebula (M27)", "Pleiades (M45)"],
    26: ["Neptune", "Harvest Moon (Full Moon)", "Moonrise"],
    27: ["Moon-Saturn pairing", "Saturn", "Mercury"],
    30: ["Pleiades (M45)", "Waning gibbous Moon", "Dumbbell Nebula (M27)"]
  };

  const eventData = {
    1: [
      event("meteor", "Aurigids meteor shower", "A minor meteor shower best watched before dawn under clear skies.", "Meteor shower peak.", ["inSky"], media.meteor)
    ],
    3: [
      event("sky", "Moon near the Pleiades", "The Moon passes near the Pleiades cluster.", "Moon-cluster pairing.", ["inSky"], media.pleiades)
    ],
    4: [
      event("moon", "Last Quarter Moon", "Last Quarter occurs at 07:51 UTC; the Moon rises late, improving early-night sky contrast.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "inSky"])
    ],
    6: [
      event("sky", "Moon and Mars", "The Moon passes close to Mars.", "Moon-planet pairing.", ["inSky"], media.planets)
    ],
    8: [
      event("sky", "Moon and Jupiter", "The Moon passes close to Jupiter; occultation visibility is path-dependent.", "Moon-planet pairing.", ["inSky"], media.planets)
    ],
    9: [
      event("meteor", "September Epsilon Perseid meteor shower", "A minor shower with a favourable darker-sky context near New Moon.", "Meteor shower peak.", ["inSky"], media.meteor)
    ],
    11: [
      event("moon", "New Moon", "New Moon occurs at 03:27 UTC, giving the month its best dark-sky window.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "inSky"])
    ],
    12: [
      event("sky", "Moon and Mercury", "A slim crescent Moon passes Mercury in evening twilight; visibility depends on latitude and a clear western horizon.", "Twilight planet pairing.", ["inSky"], media.planets)
    ],
    14: [
      event("sky", "Moon and Venus", "A slim Moon passes Venus in evening twilight; occultation visibility is path-dependent.", "Twilight pairing.", ["inSky"], media.venus)
    ],
    17: [
      event("occultation", "Moon occults Antares", "The Moon passes in front of Antares for observers inside a limited visibility path; elsewhere it is a close conjunction.", "Location-dependent occultation.", ["inSky"], media.planets)
    ],
    18: [
      event("moon", "First Quarter Moon", "First Quarter occurs at 20:44 UTC; the lunar terminator is strong for visual observing and high-resolution Moon imaging.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "inSky"])
    ],
    20: [
      event("occultation", "Moon occults Sigma Sagittarii", "The Moon occults Sigma Sagittarii along a limited geographic track; observers outside it see a close lunar pass.", "Location-dependent occultation.", ["inSky"], media.planets)
    ],
    22: [
      event("sky", "Venus at greatest brightness", "Venus reaches its brightest evening appearance.", "Evening planet highlight.", ["inSky"], media.venus)
    ],
    23: [
      event("sky", "September equinox", "The Sun crosses the celestial equator at 00:05 UTC, marking the September equinox.", "Season marker.", ["usnoSeasons", "inSky", "rmg2026"], media.sun)
    ],
    25: [
      event("telescope", "NGC 55 well placed", "The Sculptor Galaxy is well placed for southern observers.", "Southern deep-sky target.", ["inSky"], media.cluster)
    ],
    26: [
      event("opposition", "Neptune at opposition", "Neptune reaches opposition at 01:28 UTC, but the Full Moon makes contrast difficult.", "Advanced telescope target.", ["inSky"], media.planets),
      event("moon", "Harvest Moon (Full Moon)", "Full Moon occurs at 16:49 UTC. In 2026, September's Full Moon is the popular traditional Harvest Moon.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "usnoPhases", "inSky", "fullMoonNames"])
    ],
    27: [
      event("sky", "Moon and Saturn", "The Moon passes close to Saturn.", "Moon-planet pairing.", ["inSky"], media.saturn),
      event("sky", "Mercury at aphelion", "Mercury reaches the farthest point of its orbit from the Sun; this geometric milestone does not by itself guarantee easy visibility.", "Solar-system orbital milestone.", ["inSky"], media.planets)
    ],
    30: [
      event("sky", "Moon near the Pleiades", "The Moon returns near the Pleiades at the end of the month.", "Moon-cluster pairing.", ["inSky"], media.pleiades),
      event("opposition", "Asteroid 187 Nausikaa at opposition", "Nausikaa reaches opposition; a telescope, current finder chart and accurate coordinates are needed.", "Advanced asteroid target.", ["inSky"], media.planets)
    ]
  };

  window.AMC_MONTH_DATA["2026-09"] = {
    id: "2026-09",
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
