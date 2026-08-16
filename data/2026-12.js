(() => {
  "use strict";

  window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};

  const shared = window.AMC_SHARED || {};
  const event = shared.event;
  const buildMoonData = shared.buildMoonData;
  const articleData = shared.articleData;
  const media = shared.media;

  const MONTH = { year: 2026, monthIndex: 11, days: 31 };

  const sources = {
    ...shared.sources,
    usnoPhases: {
      label: "US Naval Observatory 2026 Moon phases",
      url: "https://aa.usno.navy.mil/calculated/moon/phases?year=2026",
      note: "Primary Moon phase dates and UTC times."
    },
    usnoSeasons: {
      label: "US Naval Observatory 2026 seasons",
      url: "https://aa.usno.navy.mil/calculated/seasons?year=2026&tz=0&dst=false",
      note: "Primary UTC time for the December solstice."
    },
    nasaSkyCal: {
      label: "NASA 2026 Sky Events Calendar",
      url: "https://eclipse.gsfc.nasa.gov/SKYCAL/SKYCAL.html?cal=2026",
      note: "UTC cross-check for Moon, planet and conjunction events."
    },
    imo2026: {
      label: "International Meteor Organization 2026 calendar",
      url: "https://www.imo.net/files/meteor-shower/cal2026.pdf",
      note: "Primary source for meteor-shower timing and Moon conditions."
    },
    inSky: {
      label: "In-The-Sky.org December 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?month=12&year=2026",
      note: "Cross-check for planetary events and seasonal deep-sky targets."
    }
  };

  const moonData = buildMoonData(MONTH.year, MONTH.monthIndex, MONTH.days);

  function moonImage(day, size) {
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
  }

  const exactMoon = {
    1: "Last Quarter",
    9: "New Moon",
    17: "First Quarter",
    24: "Cold Moon (Full Moon)",
    30: "Last Quarter"
  };

  const monthIntel = [
    { day: 9, title: "New Moon", text: "9 Dec. Dark skies favour Orion, Rosette and faint winter nebulae.", image: moonImage(9, 216), alt: "New Moon" },
    { day: 14, title: "Geminids", text: "14 Dec. A strong, Moon-free maximum with rates near 150 per hour under ideal skies.", image: media.meteor.src, alt: "Geminid meteor" },
    { day: 21, title: "December solstice", text: "21 Dec. The solstice occurs at 20:50 UTC.", image: media.sun.src, alt: "Sun" },
    { day: 24, title: "Cold Moon", text: "24 Dec. Full Moon at 01:28 UTC.", image: moonImage(24, 216), alt: "Full Moon" }
  ];

  const targetData = {
    1: ["Orion Nebula (M42)", "Pleiades (M45)", "Double Cluster (NGC 869 and NGC 884)"],
    4: ["Orion Nebula (M42)", "Horsehead Nebula (Barnard 33)", "Rosette Nebula (NGC 2237)"],
    9: ["Horsehead Nebula (Barnard 33)", "Rosette Nebula (NGC 2237)", "California Nebula (NGC 1499)"],
    12: ["Orion Nebula (M42)", "Rosette Nebula (NGC 2237)", "Pleiades (M45)"],
    14: ["Geminids", "Orion Nebula (M42)", "Pleiades (M45)"],
    17: ["First Quarter Moon", "Orion Nebula (M42)", "Double Cluster (NGC 869 and NGC 884)"],
    21: ["Pleiades (M45)", "Orion Nebula (M42)", "Rosette Nebula (NGC 2237)"],
    22: ["Ursids", "Moon", "Jupiter"],
    24: ["Cold Moon (Full Moon)", "Jupiter", "Pleiades (M45)"],
    27: ["Moon-Jupiter pairing", "Jupiter", "Orion Nebula (M42)"],
    30: ["Orion Nebula (M42)", "Horsehead Nebula (Barnard 33)", "Rosette Nebula (NGC 2237)"]
  };

  const eventData = {
    1: [
      event("moon", "Last Quarter Moon", "Last Quarter occurs at 06:08 UTC, leaving increasingly dark evenings for winter deep-sky imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"]),
      event("sky", "Venus at greatest western elongation", "Venus reaches a morning elongation of about 41 degrees west of the Sun.", "Morning planet highlight; visibility depends on latitude.", ["nasaSkyCal", "inSky"], media.venus)
    ],
    4: [
      event("telescope", "Orion and Horsehead nebulae", "Orion's nebula complex is prominent during northern winter nights. Combine short exposures for M42's core with longer integrations for faint dust and hydrogen-alpha structures.", "Deep-sky imaging highlight.", ["inSky"], media.milkyWay)
    ],
    9: [
      event("moon", "New Moon", "New Moon occurs at 00:52 UTC, providing December's best lunar-darkness window for faint winter nebulae and galaxies.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ],
    12: [
      event("sky", "Jupiter near Regulus", "Jupiter passes near Regulus at 17:41 UTC. Their apparent altitude and best imaging time depend on location.", "Planet-star pairing.", ["nasaSkyCal", "inSky"], media.planets),
      event("telescope", "Rosette Nebula imaging window", "The Rosette Nebula is well placed during the night and rewards wide-field hydrogen-alpha and narrowband imaging.", "Large emission-nebula target.", ["inSky"], media.milkyWay)
    ],
    14: [
      event("meteor", "Geminid meteor shower peak", "The Geminids reach their predicted maximum near 14:00 UTC. A broad, Moon-free peak runs from roughly 21:00 UTC on 13 December to 18:00 UTC on the 14th, with a typical zenithal hourly rate near 150 under ideal skies.", "One of the year's strongest meteor showers.", ["imo2026", "nasaSkyCal"], media.meteor)
    ],
    17: [
      event("moon", "First Quarter Moon", "First Quarter occurs at 05:42 UTC; the evening terminator is favourable for high-resolution lunar imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ],
    21: [
      event("sky", "December solstice", "The December solstice occurs at 20:50 UTC, marking winter in the Northern Hemisphere and summer in the Southern Hemisphere.", "Seasonal marker.", ["usnoSeasons", "nasaSkyCal"], media.sun),
      event("sky", "Moon near the Pleiades", "The waxing Moon passes near the Pleiades late in the day UTC, creating a bright wide-field pairing.", "Moon-cluster pairing.", ["nasaSkyCal", "inSky"], media.pleiades)
    ],
    22: [
      event("meteor", "Ursid meteor shower peak", "The Ursids peak near 22:00 UTC with a typical zenithal hourly rate around 10. A roughly 96%-illuminated Moon severely reduces faint-meteor visibility in 2026.", "Best from northern latitudes despite strong moonlight.", ["imo2026", "nasaSkyCal"], media.meteor)
    ],
    24: [
      event("moon", "Cold Moon (Full Moon)", "Full Moon occurs at 01:28 UTC. December's popular traditional name is the Cold Moon; bright moonlight limits faint deep-sky imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine", "fullMoonNames"])
    ],
    27: [
      event("sky", "Moon and Jupiter", "The waning Moon passes Jupiter at 17:32 UTC. Local rise times determine the best viewing and imaging window.", "Moon-planet pairing.", ["nasaSkyCal", "inSky"], media.planets)
    ],
    30: [
      event("moon", "Last Quarter Moon", "Last Quarter occurs at 18:59 UTC, returning darker evening skies for Orion, Horsehead and Rosette imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ]
  };

  window.AMC_MONTH_DATA["2026-12"] = {
    id: "2026-12",
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
