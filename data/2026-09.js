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
    26: "Full Moon"
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
    14: ["Moon-Venus pairing", "Crescent Moon", "Venus"],
    18: ["First Quarter Moon", "Lunar terminator", "Craters"],
    22: ["Venus", "Andromeda Galaxy (M31)", "Dumbbell Nebula (M27)"],
    25: ["NGC 55", "Dumbbell Nebula (M27)", "Pleiades (M45)"],
    26: ["Neptune", "Full Moon", "Moonrise"],
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
      event("moon", "Last Quarter Moon", "The Moon rises late, improving early-night sky contrast.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"])
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
      event("moon", "New Moon", "Lunar illumination is near zero, giving the month its best dark-sky window.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"])
    ],
    14: [
      event("sky", "Moon and Venus", "A slim Moon passes Venus in evening twilight; occultation visibility is path-dependent.", "Twilight pairing.", ["inSky"], media.venus)
    ],
    18: [
      event("moon", "First Quarter Moon", "The lunar terminator is strong for visual observing and high-resolution Moon imaging.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"])
    ],
    22: [
      event("sky", "Venus at greatest brightness", "Venus reaches its brightest evening appearance.", "Evening planet highlight.", ["inSky"], media.venus)
    ],
    23: [
      event("sky", "September equinox", "The Sun crosses the celestial equator, marking the September equinox.", "Season marker.", ["inSky", "rmg2026"], media.sun)
    ],
    25: [
      event("telescope", "NGC 55 well placed", "The Sculptor Galaxy is well placed for southern observers.", "Southern deep-sky target.", ["inSky"], media.cluster)
    ],
    26: [
      event("opposition", "Neptune at opposition", "Neptune is opposite the Sun in Earth's sky, but the Full Moon makes contrast difficult.", "Advanced telescope target.", ["inSky"], media.planets),
      event("moon", "Full Moon", "The Moon is effectively fully illuminated.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"])
    ],
    27: [
      event("sky", "Moon and Saturn", "The Moon passes close to Saturn.", "Moon-planet pairing.", ["inSky"], media.saturn),
      event("sky", "Mercury high in the evening sky", "Mercury reaches a better evening placement, with visibility still dependent on horizon and latitude.", "Twilight planet highlight.", ["inSky"], media.planets)
    ],
    30: [
      event("sky", "Moon near the Pleiades", "The Moon returns near the Pleiades at the end of the month.", "Moon-cluster pairing.", ["inSky"], media.pleiades)
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
