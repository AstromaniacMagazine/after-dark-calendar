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
    monthIndex: 9,
    days: 31
  };

  const sources = {
    ...shared.sources,
    inSky: {
      label: "In-The-Sky.org October 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?month=10&year=2026",
      note: "Cross-check for planetary events, conjunctions, oppositions, meteor showers and well-placed deep-sky targets."
    },
    usnoPhases: {
      label: "US Naval Observatory 2026 Moon phases",
      url: "https://aa.usno.navy.mil/calculated/moon/phases?year=2026",
      note: "Primary Moon phase dates and times are taken from the USNO table in Universal Time."
    },
    imo2026: {
      label: "International Meteor Organization 2026 calendar",
      url: "https://www.imo.net/files/meteor-shower/cal2026.pdf",
      note: "Reference for the October Camelopardalid, Draconid, Epsilon Geminid, Orionid and Leonis Minorid maxima and Moon conditions."
    },
    nasaSkyCal: {
      label: "NASA 2026 Sky Events Calendar",
      url: "https://eclipse.gsfc.nasa.gov/SKYCAL/SKYCAL.html?cal=2026",
      note: "UTC cross-check for primary Moon phases and selected solar-system events."
    }
  };

  const moonData = buildMoonData(MONTH.year, MONTH.monthIndex, MONTH.days);

  function moonImage(day, size) {
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
  }

  const exactMoon = {
    3: "Last Quarter",
    10: "New Moon",
    18: "First Quarter",
    26: "Hunter's Moon (Full Moon)"
  };

  const monthIntel = [
    { title: "Saturn opposition", text: "4 Oct. Saturn is opposite the Sun and visible through most of the night.", image: media.saturn.src, alt: "Saturn" },
    { title: "Draconids", text: "9 Oct. A moon-free maximum favours northern observers.", image: media.meteor.src, alt: "Meteor shower" },
    { title: "New Moon", text: "10 Oct. The darkest lunar window of the month.", image: moonImage(10, 216), alt: "New Moon" },
    { title: "Orionids", text: "21 Oct. A waxing Moon sets before dawn, leaving a useful darker pre-dawn window.", image: media.meteor.src, alt: "Meteor shower" }
  ];

  const targetData = {
    2: ["Andromeda Galaxy (M31)", "Triangulum Galaxy (M33)", "Double Cluster (NGC 869 and NGC 884)"],
    3: ["Sculptor Galaxy (NGC 253)", "Saturn", "Dumbbell Nebula (M27)"],
    4: ["Saturn", "Andromeda Galaxy (M31)", "Double Cluster (NGC 869 and NGC 884)"],
    6: ["Jupiter", "Waning crescent Moon", "Double Cluster (NGC 869 and NGC 884)"],
    9: ["Draconids", "Andromeda Galaxy (M31)", "Triangulum Galaxy (M33)"],
    10: ["Andromeda Galaxy (M31)", "Triangulum Galaxy (M33)", "Sculptor Galaxy (NGC 253)"],
    11: ["Moon-Venus pairing", "Venus", "Andromeda Galaxy (M31)"],
    12: ["Mercury", "Andromeda Galaxy (M31)", "Dumbbell Nebula (M27)"],
    15: ["Triangulum Galaxy (M33)", "Andromeda Galaxy (M31)", "Sculptor Galaxy (NGC 253)"],
    18: ["First Quarter Moon", "Dumbbell Nebula (M27)", "Messier 15"],
    21: ["Orionids", "Moon", "Jupiter"],
    24: ["Moon-Saturn pairing", "Saturn", "Moon"],
    26: ["Hunter's Moon (Full Moon)", "Saturn", "Jupiter"],
    27: ["Pleiades (M45)", "Moon", "Jupiter"]
  };

  const eventData = {
    2: [
      event("telescope", "Andromeda Galaxy well placed", "M31 is well placed during the evening for northern observers and rises high from mid-northern latitudes.", "Large galaxy target.", ["inSky"], media.milkyWay)
    ],
    3: [
      event("moon", "Last Quarter Moon", "Last Quarter occurs at 13:25 UTC, leaving the evening increasingly Moon-free.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"]),
      event("telescope", "Sculptor Galaxy well placed", "NGC 253 is well placed for southern observers and low-latitude northern sites.", "Southern galaxy target.", ["inSky"], media.cluster)
    ],
    4: [
      event("opposition", "Saturn at opposition", "Saturn lies opposite the Sun at 11:52 UTC, remaining visible for most of the night and reaching its best annual illumination.", "Planetary imaging highlight.", ["inSky", "nasaSkyCal"], media.saturn),
      event("sky", "Moon and Mars", "The waning Moon passes Mars; local altitude and twilight determine the best observing window.", "Moon-planet pairing.", ["inSky", "nasaSkyCal"], media.planets)
    ],
    6: [
      event("meteor", "October Camelopardalids", "This minor shower reaches maximum around 04:40 UTC under favourable Moon conditions.", "Minor meteor shower.", ["imo2026"], media.meteor),
      event("occultation", "Moon and Jupiter", "The waning Moon passes close to Jupiter; an occultation is visible only from a limited geographic path.", "Location-dependent occultation.", ["inSky"], media.planets)
    ],
    9: [
      event("meteor", "Draconid meteor shower", "The Draconids reach maximum under a nearly moonless sky. Activity is usually modest but occasional outbursts can occur.", "Best viewed in the evening from northern latitudes.", ["imo2026", "inSky"], media.meteor)
    ],
    10: [
      event("moon", "New Moon", "New Moon occurs at 15:50 UTC, providing the month's strongest lunar-darkness window.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ],
    11: [
      event("sky", "Moon and Venus", "A young crescent Moon passes Venus in evening twilight; visibility depends on latitude and a clear western horizon.", "Twilight planet pairing.", ["inSky"], media.venus)
    ],
    12: [
      event("sky", "Mercury at greatest eastern elongation", "Mercury reaches greatest eastern elongation at 09:59 UTC; visibility depends strongly on latitude and the western horizon.", "Evening planet highlight.", ["inSky", "nasaSkyCal"], media.planets),
      event("sky", "Moon and Mercury", "The slim Moon passes Mercury in evening twilight.", "Twilight planet pairing.", ["inSky"], media.planets)
    ],
    13: [
      event("opposition", "Asteroid 4 Vesta at opposition", "Vesta is opposite the Sun and near its brightest for the year, but still requires accurate charts and suitable optics.", "Asteroid imaging target.", ["inSky"], media.planets),
      event("meteor", "Southern Taurid early maximum", "The broad Southern Taurid stream has a possible early maximum in 2026. Rates are low, but slow bright meteors and fireballs are possible.", "Broad, low-rate meteor activity.", ["imo2026"], media.meteor)
    ],
    15: [
      event("telescope", "Triangulum Galaxy well placed", "M33 is well placed during the night, with the best results under dark, transparent skies.", "Low-surface-brightness galaxy.", ["inSky"], media.milkyWay)
    ],
    18: [
      event("moon", "First Quarter Moon", "First Quarter occurs at 16:12 UTC; the terminator favours high-resolution lunar imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"]),
      event("meteor", "Epsilon Geminids", "This minor meteor shower reaches maximum with increasing moonlight interference.", "Minor meteor shower.", ["imo2026"], media.meteor)
    ],
    21: [
      event("meteor", "Orionid meteor shower peak", "The Orionids peak around 20-21 October. A waxing Moon affects the evening, but it sets before dawn and leaves a useful darker window before morning twilight.", "Meteor shower from Halley's Comet debris.", ["imo2026", "inSky"], media.meteor)
    ],
    23: [
      event("sky", "Venus at inferior conjunction", "Venus passes between Earth and the Sun. It is lost in solar glare and must not be searched for with unfiltered optics.", "Solar conjunction; not an observing target.", ["nasaSkyCal", "inSky"], media.venus)
    ],
    24: [
      event("sky", "Moon and Saturn", "The waxing Moon passes close to Saturn; their apparent separation and timing vary by location.", "Moon-planet pairing.", ["inSky"], media.saturn),
      event("meteor", "Leonis Minorids", "A minor shower reaches maximum under strong moonlight.", "Minor meteor shower.", ["imo2026"], media.meteor)
    ],
    26: [
      event("moon", "Hunter's Moon (Full Moon)", "Full Moon occurs at 04:12 UTC and strongly limits faint deep-sky imaging. October's popular traditional name is the Hunter's Moon.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine", "fullMoonNames"]),
      event("telescope", "Perseus Double Cluster well placed", "NGC 869 and NGC 884 are high in northern skies, although moonlight favours shorter exposures or narrow fields.", "Open-cluster target.", ["inSky"], media.pleiades)
    ],
    27: [
      event("sky", "Moon near the Pleiades", "The waning gibbous Moon passes near the Pleiades, creating a bright wide-field pairing.", "Moon-cluster pairing.", ["inSky"], media.pleiades)
    ]
  };

  window.AMC_MONTH_DATA["2026-10"] = {
    id: "2026-10",
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
