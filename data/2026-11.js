(() => {
  "use strict";

  window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};

  const shared = window.AMC_SHARED || {};
  const event = shared.event;
  const buildMoonData = shared.buildMoonData;
  const articleData = shared.articleData;
  const media = shared.media;

  const MONTH = { year: 2026, monthIndex: 10, days: 30 };

  const sources = {
    ...shared.sources,
    usnoPhases: {
      label: "US Naval Observatory 2026 Moon phases",
      url: "https://aa.usno.navy.mil/calculated/moon/phases?year=2026",
      note: "Primary Moon phase dates and UTC times."
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
      label: "In-The-Sky.org November 2026 calendar",
      url: "https://in-the-sky.org/newscal.php?month=11&year=2026",
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
    24: "Beaver Moon (Full Moon)"
  };

  const monthIntel = [
    { day: 5, title: "Southern Taurids", text: "5 Nov. Slow, bright meteors peak without Moon interference.", image: media.meteor.src, alt: "Meteor shower" },
    { day: 9, title: "New Moon", text: "9 Nov. Prime dark-sky window for galaxies and nebulae.", image: moonImage(9, 216), alt: "New Moon" },
    { day: 17, title: "Leonids", text: "17 Nov. The shower peaks near 23:45 UTC under a dark sky.", image: media.meteor.src, alt: "Leonid meteor" },
    { day: 25, title: "Uranus opposition", text: "25 Nov. Uranus is visible throughout the night.", image: media.planets.src, alt: "Uranus" }
  ];

  const targetData = {
    2: ["Andromeda Galaxy (M31)", "Triangulum Galaxy (M33)", "Double Cluster (NGC 869 and NGC 884)"],
    5: ["Southern Taurids", "California Nebula (NGC 1499)", "Pleiades (M45)"],
    6: ["California Nebula (NGC 1499)", "Andromeda Galaxy (M31)", "Double Cluster (NGC 869 and NGC 884)"],
    9: ["Orion Nebula (M42)", "Triangulum Galaxy (M33)", "California Nebula (NGC 1499)"],
    12: ["Northern Taurids", "Pleiades (M45)", "Andromeda Galaxy (M31)"],
    14: ["Orion Nebula (M42)", "Horsehead Nebula (Barnard 33)", "Pleiades (M45)"],
    16: ["Mars-Jupiter conjunction", "Orion Nebula (M42)", "Double Cluster (NGC 869 and NGC 884)"],
    17: ["Leonids", "Orion Nebula (M42)", "Andromeda Galaxy (M31)"],
    20: ["Mercury", "Triangulum Galaxy (M33)", "California Nebula (NGC 1499)"],
    24: ["Beaver Moon (Full Moon)", "Pleiades (M45)", "Jupiter"],
    25: ["Uranus", "Double Cluster (NGC 869 and NGC 884)", "Pleiades (M45)"]
  };

  const eventData = {
    1: [
      event("moon", "Last Quarter Moon", "Last Quarter occurs at 20:28 UTC, opening progressively darker evenings for deep-sky imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ],
    2: [
      event("sky", "Moon, Mars and Jupiter", "The waning Moon passes Mars and Jupiter during the day in UTC; the grouping is best judged for the user's local horizon and twilight.", "Wide-field planetary grouping.", ["nasaSkyCal", "inSky"], media.planets)
    ],
    5: [
      event("meteor", "Southern Taurid meteor shower", "The Southern Taurids reach maximum around 18:45 UTC. Rates are modest, but the stream is noted for slow, bright meteors and 2026 is Moon-free near maximum.", "Allow a wide field of view and watch for fireballs.", ["imo2026", "nasaSkyCal"], media.meteor)
    ],
    6: [
      event("telescope", "California Nebula season", "NGC 1499 is well placed in northern evening skies. Its large, faint hydrogen-alpha structure suits wide-field, narrowband imaging under dark conditions.", "Deep-sky imaging target.", ["inSky"], media.milkyWay)
    ],
    9: [
      event("moon", "New Moon", "New Moon occurs at 07:02 UTC, creating November's strongest lunar-darkness window for faint galaxies and nebulae.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ],
    12: [
      event("meteor", "Northern Taurid meteor shower", "The Northern Taurids reach maximum around 18:02 UTC. Expected rates are low, but bright meteors are possible and moonlight is not a major obstacle.", "Minor meteor shower.", ["imo2026", "nasaSkyCal"], media.meteor)
    ],
    14: [
      event("telescope", "Orion Nebula imaging season", "M42 is returning to convenient late-evening and overnight hours, with bright core detail and extensive faint nebulosity suitable for bracketed exposures.", "Iconic deep-sky target.", ["inSky"], media.milkyWay)
    ],
    16: [
      event("sky", "Mars-Jupiter conjunction", "Mars passes close to Jupiter at 04:22 UTC. Visibility, altitude and the best imaging time depend on location.", "Planetary conjunction.", ["nasaSkyCal", "inSky"], media.planets)
    ],
    17: [
      event("meteor", "Leonid meteor shower peak", "The Leonids reach their predicted maximum near 23:45 UTC with a typical zenithal hourly rate around 15 and no significant moonlight disturbance.", "Best after the radiant rises; actual rates vary.", ["imo2026"], media.meteor),
      event("moon", "First Quarter Moon", "First Quarter occurs at 11:48 UTC; the evening terminator is favourable for detailed lunar imaging.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine"])
    ],
    20: [
      event("sky", "Mercury at greatest western elongation", "Mercury reaches its greatest morning separation from the Sun at 22:59 UTC. Visibility depends strongly on latitude and a clear eastern horizon.", "Morning planet opportunity.", ["nasaSkyCal", "inSky"], media.planets)
    ],
    24: [
      event("moon", "Beaver Moon (Full Moon)", "Full Moon occurs at 14:53 UTC. November's popular traditional name is the Beaver Moon; bright moonlight limits faint deep-sky work.", "Moon phase marker.", ["usnoPhases", "nasaSkyCal", "nasaSvs", "astronomyEngine", "fullMoonNames"]),
      event("sky", "Moon near the Pleiades", "The Full Moon passes the Pleiades, producing a bright wide-field pairing but washing out the cluster's faint reflection nebulosity.", "Moon-cluster pairing.", ["nasaSkyCal", "inSky"], media.pleiades)
    ],
    25: [
      event("opposition", "Uranus at opposition", "Uranus lies opposite the Sun at 22:47 UTC, remaining visible throughout the night and reaching its best annual observing geometry.", "A telescope and accurate chart are recommended.", ["nasaSkyCal", "inSky"], media.planets)
    ]
  };

  window.AMC_MONTH_DATA["2026-11"] = {
    id: "2026-11",
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
