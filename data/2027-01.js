// Audited 2026-10-27. See 2027-audit.json for source records and prediction limits.
(() => {
  "use strict";
  const shared = window.AMC_SHARED;
  const data = {
  "id": "2027-01",
  "MONTH": {
    "year": 2027,
    "monthIndex": 0,
    "days": 31
  },
  "exactMoon": {
    "7": "New Moon 20:24 UTC",
    "15": "First Quarter 20:34 UTC",
    "22": "Wolf Moon (Full Moon) 12:17 UTC",
    "29": "Last Quarter 10:55 UTC"
  },
  "eventData": {
    "7": [
      {
        "type": "moon",
        "title": "New Moon",
        "copy": "New Moon occurs at 20:24 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "15": [
      {
        "type": "moon",
        "title": "First Quarter",
        "copy": "First Quarter occurs at 20:34 UTC. The evening terminator offers strong relief for lunar imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "22": [
      {
        "type": "moon",
        "title": "Wolf Moon (Full Moon)",
        "copy": "Full Moon occurs at 12:17 UTC. Bright moonlight limits faint deep-sky work. Traditional names vary between cultures.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027",
          "fullMoonNames"
        ],
        "mediaKey": null
      }
    ],
    "29": [
      {
        "type": "moon",
        "title": "Last Quarter",
        "copy": "Last Quarter occurs at 10:55 UTC. Evenings become darker; the Moon rises later at night.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "3": [
      {
        "type": "sky",
        "title": "Earth at Perihelion",
        "copy": "At 02:33 UTC, earth at perihelion. This orbital distance marker does not cause Earth's seasons.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoSeasons2027"
        ],
        "mediaKey": "sun"
      },
      {
        "type": "sky",
        "title": "Venus at greatest western elongation",
        "copy": "Around 19:00 UTC, the planet reaches its greatest angular separation from the Sun for this apparition. Look in the morning twilight; visibility depends on latitude and horizon.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027"
        ],
        "mediaKey": "planets"
      }
    ],
    "4": [
      {
        "type": "meteor",
        "title": "Quadrantids meteor shower peak",
        "copy": "Predicted maximum near 03:25 UTC. Little lunar interference near New Moon. Ideal zenithal hourly rate about 80; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "imo2027"
        ],
        "mediaKey": "meteor"
      }
    ]
  },
  "monthIntel": [
    {
      "day": 4,
      "title": "Quadrantids meteor shower peak",
      "text": "Predicted maximum near 03:25 UTC. Little lunar interference near New Moon. Ideal zenithal hourly rate about 80; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 7,
      "title": "New Moon",
      "text": "New Moon occurs at 20:24 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
      "imageKey": "milkyWay"
    },
    {
      "day": 3,
      "title": "Earth at Perihelion",
      "text": "At 02:33 UTC, earth at perihelion. This orbital distance marker does not cause Earth's seasons.",
      "imageKey": "sun"
    },
    {
      "day": 3,
      "title": "Venus at greatest western elongation",
      "text": "Around 19:00 UTC, the planet reaches its greatest angular separation from the Sun for this apparition. Look in the morning twilight; visibility depends on latitude and horizon.",
      "imageKey": "planets"
    }
  ]
};
  data.sources = { ...shared.sources, usnoSeasons2027: {"label": "US Naval Observatory 2027 seasons and apsides", "url": "https://aa.usno.navy.mil/calculated/seasons?year=2027&tz=0&dst=false", "note": "Exact UT season and Earth apsis times, checked 27 October 2026. Takes precedence over the older rounded almanac."}, ...{
  "usnoPhases2027": {
    "label": "US Naval Observatory 2027 Moon phases",
    "url": "https://aa.usno.navy.mil/calculated/moon/phases?year=2027",
    "note": "Primary phase instants in Universal Time, checked 27 October 2026. Local dates may differ."
  },
  "almanac2027": {
    "label": "Fred Espenak: 2027 Sky Event Almanac (GMT)",
    "url": "https://astropixels.com/almanac/almanac21/almanac2027gmt.html",
    "note": "Primary planetary and seasonal calculations. Hour-only entries are approximate; phase times use USNO. Checked 27 October 2026."
  },
  "imo2027": {
    "label": "International Meteor Organization 2027 Meteor Shower Calendar",
    "url": "https://www.imo.net/files/meteor-shower/cal2027.pdf",
    "note": "2027 maxima and lunar conditions, including Table 5. Predictions can change. ZHR is an idealised rate, not a guaranteed visible count."
  },
  "nasaEclipses2027": {
    "label": "NASA eclipse catalogues: 2027",
    "url": "https://eclipse.gsfc.nasa.gov/",
    "note": "Two solar and three catalogued penumbral lunar eclipses in 2027. The July graze is marginal and effectively unobservable; visibility is location dependent."
  },
  "phaseDiagrams": {
    "label": "Astronomy Engine lunar calculations",
    "url": "https://github.com/cosinekitty/astronomy",
    "note": "2027 thumbnails are illustrative phase diagrams rather than dated NASA photographs. Illumination, lunar distance and local positions are calculated with Astronomy Engine."
  }
} };
  data.articleData = shared.articleData;
  data.media = shared.media;
  data.moonData = shared.buildMoonData(data.MONTH.year, data.MONTH.monthIndex, data.MONTH.days);
  data.targetData = {};
  for (const events of Object.values(data.eventData)) for (const event of events) {
    event.media = shared.media[event.mediaKey] || null;
    delete event.mediaKey;
  }
  data.monthIntel = data.monthIntel.map(item => ({ day: item.day, title: item.title,
    text: item.text.split(". ")[0] + ".", image: shared.media[item.imageKey].src, alt: item.title }));
  window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};
  window.AMC_MONTH_DATA[data.id] = data;
})();
