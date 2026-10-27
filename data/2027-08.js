// Audited 2026-10-27. See 2027-audit.json for source records and prediction limits.
(() => {
  "use strict";
  const shared = window.AMC_SHARED;
  const data = {
  "id": "2027-08",
  "MONTH": {
    "year": 2027,
    "monthIndex": 7,
    "days": 31
  },
  "exactMoon": {
    "2": "New Moon 10:05 UTC",
    "9": "First Quarter 04:54 UTC",
    "17": "Sturgeon Moon (Full Moon) 07:29 UTC",
    "25": "Last Quarter 02:27 UTC",
    "31": "New Moon 17:41 UTC"
  },
  "eventData": {
    "2": [
      {
        "type": "moon",
        "title": "New Moon",
        "copy": "New Moon occurs at 10:05 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      },
      {
        "type": "eclipse",
        "title": "Total solar eclipse",
        "copy": "Greatest eclipse near 10:07 UTC. The central path crosses southern Spain, North Africa and parts of the Middle East; outside it, only some regions see a partial eclipse. Consult the NASA map for your location. Use a certified front-aperture solar filter for all partial and annular phases; never look through unfiltered optics.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027",
          "nasaEclipses2027"
        ],
        "mediaKey": "eclipse"
      }
    ],
    "9": [
      {
        "type": "moon",
        "title": "First Quarter",
        "copy": "First Quarter occurs at 04:54 UTC. The evening terminator offers strong relief for lunar imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "17": [
      {
        "type": "moon",
        "title": "Sturgeon Moon (Full Moon)",
        "copy": "Full Moon occurs at 07:29 UTC. Bright moonlight limits faint deep-sky work. Traditional names vary between cultures.",
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
        "copy": "Greatest eclipse near 07:14 UTC. The Moon passes through Earth's faint penumbra, without entering the umbra; no red total eclipse occurs. Visibility depends on the local horizon.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "almanac2027",
          "nasaEclipses2027"
        ],
        "mediaKey": "eclipse"
      },
      {
        "type": "meteor",
        "title": "Kappa Cygnids meteor shower peak",
        "copy": "Predicted maximum around this UTC date. Full Moon strongly reduces visibility. Ideal zenithal hourly rate about 3; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "imo2027"
        ],
        "mediaKey": "meteor"
      }
    ],
    "25": [
      {
        "type": "moon",
        "title": "Last Quarter",
        "copy": "Last Quarter occurs at 02:27 UTC. Evenings become darker; the Moon rises later at night.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "31": [
      {
        "type": "moon",
        "title": "New Moon",
        "copy": "New Moon occurs at 17:41 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "13": [
      {
        "type": "meteor",
        "title": "Perseids meteor shower peak",
        "copy": "Predicted maximum near 08:00–10:00 UTC. The waxing gibbous Moon interferes until moonset; favour the later dark hours. Ideal zenithal hourly rate about 110; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
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
      "day": 2,
      "title": "Total solar eclipse",
      "text": "Greatest eclipse near 10:07 UTC. The central path crosses southern Spain, North Africa and parts of the Middle East; outside it, only some regions see a partial eclipse. Consult the NASA map for your location. Use a certified front-aperture solar filter for all partial and annular phases; never look through unfiltered optics.",
      "imageKey": "eclipse"
    },
    {
      "day": 17,
      "title": "Penumbral lunar eclipse",
      "text": "Greatest eclipse near 07:14 UTC. The Moon passes through Earth's faint penumbra, without entering the umbra; no red total eclipse occurs. Visibility depends on the local horizon.",
      "imageKey": "eclipse"
    },
    {
      "day": 13,
      "title": "Perseids meteor shower peak",
      "text": "Predicted maximum near 08:00–10:00 UTC. The waxing gibbous Moon interferes until moonset; favour the later dark hours. Ideal zenithal hourly rate about 110; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 17,
      "title": "Kappa Cygnids meteor shower peak",
      "text": "Predicted maximum around this UTC date. Full Moon strongly reduces visibility. Ideal zenithal hourly rate about 3; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
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
