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
    monthIndex: 4,
    days: 31
  };

  const sources = {
    ...shared.sources,
    inSky: {
      label: "In-The-Sky.org May 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?maxdiff=7&month=5&year=2026",
      note: "Cross-check for Moon phases, close approaches, occultations, meteor showers and Messier object placement."
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
    1: "Full Moon",
    9: "Last Quarter",
    16: "New Moon",
    23: "First Quarter",
    31: "Blue Moon"
  };

  const monthIntel = [
    { title: "Moon-free dates", text: "15-18 May. Best dark-sky window around New Moon.", image: moonImage(16, 216), alt: "New Moon" },
    { title: "Eta Aquariids", text: "6 May. Better before dawn, especially at lower northern and southern latitudes.", image: media.meteor.src, alt: "Meteor shower" },
    { title: "Evening Venus", text: "Venus reaches a strong evening placement late in the month.", image: media.venus.src, alt: "Venus" },
    { title: "Blue Moon", text: "31 May. Second Full Moon of the calendar month.", image: moonImage(31, 216), alt: "Full Moon" }
  ];

  const targetData = {
    1: ["Full Moon", "Saturn", "Messier 5"],
    6: ["Eta Aquariids", "Waning gibbous Moon", "Milky Way fields"],
    12: ["Messier 5", "Globular cluster", "Late-night dark sky"],
    13: ["Moon-Saturn pairing", "Saturn", "Waning crescent Moon"],
    16: ["Milky Way core", "Lagoon Nebula (M8)", "Trifid Nebula (M20)"],
    19: ["Moon-Venus pairing", "Crescent Moon", "Venus"],
    20: ["Moon-Jupiter pairing", "Crescent Moon", "Jupiter"],
    22: ["Venus", "Eagle Nebula (M16)", "Whirlpool Galaxy (M51)"],
    23: ["First Quarter Moon", "Regulus occultation", "Lunar terminator"],
    28: ["Messier 4", "Antares region", "Waxing gibbous Moon"],
    31: ["Blue Moon", "Antares occultation", "Moonrise"]
  };

  const eventData = {
    1: [
      event("moon", "Full Moon", "The Moon is effectively fully illuminated, so deep-sky contrast will be poor.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"])
    ],
    6: [
      event("meteor", "Eta Aquariid meteor shower", "Peak morning. The shower favours pre-dawn viewing, with radiant height depending strongly on latitude.", "Meteor shower peak.", ["inSky", "rmg2026"], media.meteor)
    ],
    9: [
      event("moon", "Last Quarter Moon", "The Moon rises late, improving early-night dark-sky planning.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"])
    ],
    12: [
      event("telescope", "Messier 5 well placed", "The globular cluster M5 is well placed for telescope and long-focal-length imaging.", "Deep-sky target.", ["inSky"], media.cluster)
    ],
    13: [
      event("sky", "Moon and Saturn", "The waning Moon passes close to Saturn before dawn.", "Moon-planet pairing.", ["inSky"], media.saturn)
    ],
    16: [
      event("moon", "New Moon", "Lunar illumination is near zero, opening the month's strongest dark-sky window.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"]),
      event("sky", "Dark-sky window", "Use the Moon-free nights around New Moon for Milky Way and nebula work.", "Astrophotography planning window.", ["rmg2026"], media.milkyWay)
    ],
    19: [
      event("sky", "Moon and Venus", "A slim Moon and Venus make a bright twilight pairing.", "Twilight pairing.", ["inSky"], media.venus)
    ],
    20: [
      event("sky", "Moon and Jupiter", "The Moon passes Jupiter in the evening sky.", "Moon-planet pairing.", ["inSky"], media.planets)
    ],
    22: [
      event("sky", "Venus high in the evening sky", "Venus reaches one of its best evening placements of the month.", "Twilight planet highlight.", ["inSky"], media.venus)
    ],
    23: [
      event("moon", "First Quarter Moon", "The lunar terminator is strong for crater and mountain detail.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"]),
      event("occultation", "Regulus occultation", "The Moon occults Regulus for observers along the visibility path.", "Path-dependent occultation.", ["inSky"])
    ],
    28: [
      event("telescope", "Messier 4 well placed", "The globular cluster M4 near Antares is a strong late-spring target from favourable latitudes.", "Deep-sky target.", ["inSky"], media.cluster)
    ],
    31: [
      event("moon", "Blue Moon", "The second Full Moon of May keeps lunar brightness high through the night.", "Moon phase marker.", ["nasaSvs", "astronomyEngine", "inSky"]),
      event("occultation", "Antares occultation", "A lunar occultation of Antares is visible from selected regions.", "Path-dependent occultation.", ["inSky"])
    ]
  };

  window.AMC_MONTH_DATA["2026-05"] = {
    id: "2026-05",
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
