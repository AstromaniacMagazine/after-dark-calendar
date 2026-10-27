// Audited 2026-10-27. See 2027-audit.json for source records and prediction limits.
(() => {
  "use strict";
  const shared = window.AMC_SHARED;
  const data = {
  "id": "2027-02",
  "MONTH": {
    "year": 2027,
    "monthIndex": 1,
    "days": 28
  },
  "exactMoon": {
    "6": "New Moon 15:56 UTC",
    "14": "First Quarter 07:58 UTC",
    "20": "Snow Moon (Full Moon) 23:23 UTC",
    "28": "Last Quarter 05:16 UTC"
  },
  "eventData": {
    "6": [
      {
        "type": "moon",
        "title": "New Moon",
        "copy": "New Moon occurs at 15:56 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      },
      {
        "type": "eclipse",
        "title": "Annular solar eclipse",
        "copy": "Greatest eclipse near 16:00 UTC. The central path crosses southern South America and the South Atlantic; outside it, only some regions see a partial eclipse. Consult the NASA map for your location. Use a certified front-aperture solar filter for all partial and annular phases; never look through unfiltered optics.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027",
          "nasaEclipses2027"
        ],
        "mediaKey": "eclipse"
      }
    ],
    "14": [
      {
        "type": "moon",
        "title": "First Quarter",
        "copy": "First Quarter occurs at 07:58 UTC. The evening terminator offers strong relief for lunar imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "20": [
      {
        "type": "moon",
        "title": "Snow Moon (Full Moon)",
        "copy": "Full Moon occurs at 23:23 UTC. Bright moonlight limits faint deep-sky work. Traditional names vary between cultures.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027",
          "fullMoonNames"
        ],
        "mediaKey": null
      },
      {
        "type": "eclipse",
        "title": "Penumbral lunar eclipse",
        "copy": "Greatest eclipse near 23:13 UTC. The Moon passes through Earth's faint penumbra, without entering the umbra; no red total eclipse occurs. Visibility depends on the local horizon.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027",
          "nasaEclipses2027"
        ],
        "mediaKey": "eclipse"
      }
    ],
    "28": [
      {
        "type": "moon",
        "title": "Last Quarter",
        "copy": "Last Quarter occurs at 05:16 UTC. Evenings become darker; the Moon rises later at night.",
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
        "title": "Mercury at greatest eastern elongation",
        "copy": "Around 06:00 UTC, the planet reaches its greatest angular separation from the Sun for this apparition. Look in the evening twilight; visibility depends on latitude and horizon.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027"
        ],
        "mediaKey": "planets"
      }
    ],
    "11": [
      {
        "type": "opposition",
        "title": "Jupiter at Opposition",
        "copy": "Around 00:00 UTC, Jupiter is opposite the Sun in Earth's sky. A favourable annual observing geometry; altitude and visibility still depend on latitude, horizon and weather.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027"
        ],
        "mediaKey": "planets"
      }
    ],
    "19": [
      {
        "type": "opposition",
        "title": "Mars at Opposition",
        "copy": "Around 15:00 UTC, Mars is opposite the Sun in Earth's sky. A favourable annual observing geometry; altitude and visibility still depend on latitude, horizon and weather.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027"
        ],
        "mediaKey": "planets"
      }
    ],
    "8": [
      {
        "type": "meteor",
        "title": "Alpha Centaurids meteor shower peak",
        "copy": "Predicted maximum around this UTC date. Best suited to southern latitudes; rates are variable. Ideal zenithal hourly rate about 6; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
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
      "day": 6,
      "title": "Annular solar eclipse",
      "text": "Greatest eclipse near 16:00 UTC. The central path crosses southern South America and the South Atlantic; outside it, only some regions see a partial eclipse. Consult the NASA map for your location. Use a certified front-aperture solar filter for all partial and annular phases; never look through unfiltered optics.",
      "imageKey": "eclipse"
    },
    {
      "day": 20,
      "title": "Penumbral lunar eclipse",
      "text": "Greatest eclipse near 23:13 UTC. The Moon passes through Earth's faint penumbra, without entering the umbra; no red total eclipse occurs. Visibility depends on the local horizon.",
      "imageKey": "eclipse"
    },
    {
      "day": 8,
      "title": "Alpha Centaurids meteor shower peak",
      "text": "Predicted maximum around this UTC date. Best suited to southern latitudes; rates are variable. Ideal zenithal hourly rate about 6; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 11,
      "title": "Jupiter at Opposition",
      "text": "Around 00:00 UTC, Jupiter is opposite the Sun in Earth's sky. A favourable annual observing geometry; altitude and visibility still depend on latitude, horizon and weather.",
      "imageKey": "planets"
    }
  ]
};
  data.sources = { ...shared.sources, ...{
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
