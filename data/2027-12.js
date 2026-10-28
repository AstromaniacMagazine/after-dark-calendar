// Rechecked 2026-10-28. See 2027-audit.json for source records and prediction limits.
(() => {
  "use strict";
  const shared = window.AMC_SHARED;
  const data = {
  "id": "2027-12",
  "MONTH": {
    "year": 2027,
    "monthIndex": 11,
    "days": 31
  },
  "exactMoon": {
    "6": "First Quarter 05:22 UTC",
    "13": "Cold Moon (Full Moon) 16:09 UTC",
    "20": "Last Quarter 09:11 UTC",
    "27": "New Moon 20:12 UTC"
  },
  "eventData": {
    "6": [
      {
        "type": "moon",
        "title": "First Quarter",
        "copy": "First Quarter occurs at 05:22 UTC. The evening terminator offers strong relief for lunar imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      },
      {
        "type": "meteor",
        "title": "Andromedids possible enhancement",
        "copy": "The IMO notes a possible Andromedid dust-trail display around 6 December, with no precise peak hour or reliable rate forecast. Look for slow meteors from a radiant near Cassiopeia; activity may remain weak or fail to appear.",
        "fact": "Uncertain prediction; observe across neighbouring nights and check later IMO updates.",
        "sourceIds": [
          "imo2027"
        ],
        "mediaKey": "meteor"
      }
    ],
    "13": [
      {
        "type": "moon",
        "title": "Cold Moon (Full Moon)",
        "copy": "Full Moon occurs at 16:09 UTC. Bright moonlight limits faint deep-sky work. Traditional names vary between cultures.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027",
          "fullMoonNames"
        ],
        "mediaKey": null
      }
    ],
    "20": [
      {
        "type": "moon",
        "title": "Last Quarter",
        "copy": "Last Quarter occurs at 09:11 UTC. Evenings become darker; the Moon rises later at night.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "27": [
      {
        "type": "moon",
        "title": "New Moon",
        "copy": "New Moon occurs at 20:12 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoPhases2027"
        ],
        "mediaKey": null
      }
    ],
    "22": [
      {
        "type": "sky",
        "title": "December solstice",
        "copy": "At 02:42 UTC: December solstice. Seasons are opposite in the Northern and Southern Hemispheres.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "usnoSeasons2027"
        ],
        "mediaKey": "sun"
      }
    ],
    "14": [
      {
        "type": "meteor",
        "title": "Geminids meteor shower peak",
        "copy": "Predicted maximum around this UTC date. Almost Full Moon severely reduces faint-meteor visibility. Ideal zenithal hourly rate about 150; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
        "fact": "Times and dates are UTC; local visibility depends on your location.",
        "sourceIds": [
          "imo2027"
        ],
        "mediaKey": "meteor"
      }
    ],
    "23": [
      {
        "type": "meteor",
        "title": "Ursids meteor shower peak",
        "copy": "Predicted maximum near 04:00 UTC. Waning crescent; favour hours before moonrise from northern latitudes. Ideal zenithal hourly rate about 10; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
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
      "day": 14,
      "title": "Geminids meteor shower peak",
      "text": "Predicted maximum around this UTC date. Almost Full Moon severely reduces faint-meteor visibility. Ideal zenithal hourly rate about 150; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 23,
      "title": "Ursids meteor shower peak",
      "text": "Predicted maximum near 04:00 UTC. Waning crescent; favour hours before moonrise from northern latitudes. Ideal zenithal hourly rate about 10; actual observed counts are usually lower. Observe around the peak on adjacent nights; timing is a prediction.",
      "imageKey": "meteor"
    },
    {
      "day": 27,
      "title": "New Moon",
      "text": "New Moon occurs at 20:12 UTC. A useful lunar-darkness window for faint deep-sky imaging.",
      "imageKey": "milkyWay"
    },
    {
      "day": 22,
      "title": "December solstice",
      "text": "At 02:42 UTC: December solstice. Seasons are opposite in the Northern and Southern Hemispheres.",
      "imageKey": "sun"
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
    "note": "2027 maxima, lunar conditions and possible Andromedid activity near 6 December. Predictions can change or fail to appear; ZHR is an idealised rate, not a guaranteed visible count."
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
