// Audited 2026-10-27. See 2027-audit.json for source records and prediction limits.
(() => {
  "use strict";
  const shared = window.AMC_SHARED;
  const data = {
  "id": "2027-07",
  "MONTH": {
    "year": 2027,
    "monthIndex": 6,
    "days": 31
  },
  "exactMoon": {
    "4": "New Moon 03:02 UTC",
    "10": "First Quarter 18:39 UTC",
    "18": "Buck Moon (Full Moon) 15:45 UTC",
    "26": "Last Quarter 16:55 UTC"
  },
  "eventData": {
    "4": [
      {
        "type": "moon",
        "title": "New Moon",
        "copy": "New Moon occurs at 03:02 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "10": [
      {
        "type": "moon",
        "title": "First Quarter",
        "copy": "First Quarter occurs at 18:39 UTC. The evening terminator offers strong relief for lunar imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "18": [
      {
        "type": "moon",
        "title": "Buck Moon (Full Moon)",
        "copy": "Full Moon occurs at 15:45 UTC. Bright moonlight limits faint deep-sky work. Traditional names vary between cultures.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027",
          "fullMoonNames"
        ],
        "mediaKey": null
      },
      {
        "type": "eclipse",
        "title": "Marginal penumbral lunar eclipse",
        "copy": "Greatest eclipse near 16:03 UTC. The Moon passes through Earth's faint penumbra, without entering the umbra; no red total eclipse occurs. Visibility depends on the local horizon. This extremely slight graze is catalogued but effectively unobservable; do not expect visible darkening.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027",
          "nasaEclipses2027"
        ],
        "mediaKey": "eclipse"
      }
    ],
    "26": [
      {
        "type": "moon",
        "title": "Last Quarter",
        "copy": "Last Quarter occurs at 16:55 UTC. Evenings become darker; the Moon rises later at night.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "5": [
      {
        "type": "sky",
        "title": "Earth at Aphelion",
        "copy": "At 05:06 UTC, earth at aphelion. This orbital distance marker does not cause Earth's seasons.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoSeasons2027"
        ],
        "mediaKey": "sun"
      }
    ],
    "15": [
      {
        "type": "sky",
        "title": "Mercury at greatest western elongation",
        "copy": "Around 19:00 UTC, the planet reaches its greatest angular separation from the Sun for this apparition. Look in the morning twilight; visibility depends on latitude and horizon.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027"
        ],
        "mediaKey": "planets"
      }
    ],
    "31": [
      {
        "type": "meteor",
        "title": "Alpha Capricornids meteor shower peak",
        "copy": "Predicted maximum around this UTC date. Low rates, sometimes bright meteors; Moon near New Moon. Ideal zenithal hourly rate about 5; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "imo2027"
        ],
        "mediaKey": "meteor"
      },
      {
        "type": "meteor",
        "title": "Southern Delta Aquariids meteor shower peak",
        "copy": "Predicted maximum around this UTC date. Moon near New Moon; best from southern and tropical latitudes. Ideal zenithal hourly rate about 25; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
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
      "day": 18,
      "title": "Marginal penumbral lunar eclipse",
      "text": "Greatest eclipse near 16:03 UTC. The Moon passes through Earth's faint penumbra, without entering the umbra; no red total eclipse occurs. Visibility depends on the local horizon. This extremely slight graze is catalogued but effectively unobservable; do not expect visible darkening.",
      "imageKey": "eclipse"
    },
    {
      "day": 31,
      "title": "Alpha Capricornids meteor shower peak",
      "text": "Predicted maximum around this UTC date. Low rates, sometimes bright meteors; Moon near New Moon. Ideal zenithal hourly rate about 5; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 31,
      "title": "Southern Delta Aquariids meteor shower peak",
      "text": "Predicted maximum around this UTC date. Moon near New Moon; best from southern and tropical latitudes. Ideal zenithal hourly rate about 25; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 4,
      "title": "New Moon",
      "text": "New Moon occurs at 03:02 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
      "imageKey": "milkyWay"
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
