(() => {
  "use strict";

  window.AMC_MONTH_DATA = window.AMC_MONTH_DATA || {};

  function event(type, title, copy, fact, sourceIds, mediaAsset) {
    return { type, title, copy, fact, sourceIds, media: mediaAsset || null };
  }

  function nasaImage(src, link) {
    return { src, link };
  }

  function moonImage(day, size) {
    const folder = size === 730 ? "730x730_1x1_30p" : "216x216_1x1_30p";
    return `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/${folder}/moon.${moonData[day].frame}.jpg`;
  }
      const MONTH = {
        year: 2026,
        monthIndex: 6,
        days: 31,
        firstDayOffset: 2
      };

      const emptyEvent = { type: "none", title: "", copy: "", fact: "", sourceIds: [], media: null };
      const emptyEventMeta = { label: "", css: "no-event" };

      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const locationStorageKey = "amc-sky-calendar-location";
      const weatherRefreshMs = 75 * 60 * 1000;

      const categoryMeta = {
        moon: { label: "Moon", css: "moon" },
        meteor: { label: "Meteor", css: "meteor" },
        launch: { label: "Launch", css: "launch" },
        opposition: { label: "Opposition", css: "opposition" },
        eclipse: { label: "Eclipse", css: "eclipse" },
        sky: { label: "Sky", css: "sky" },
        telescope: { label: "Telescope", css: "telescope" },
        occultation: { label: "Occultation", css: "occultation" },
        note: { label: "Planning", css: "sky" }
      };

      const sources = {
        nasaSvs: {
          label: "NASA SVS 2026 Moon Phase and Libration",
          url: "https://svs.gsfc.nasa.gov/5587/",
          note: "Daily Moon images and illumination values use NASA's LRO-based 2026 visualisation frames, sampled at 12:00 UT."
        },
        nasaSky: {
          label: "NASA What's Up, July 2026",
          url: "https://science.nasa.gov/solar-system/whats-up-july-2026-skywatching-tips-from-nasa/",
          note: "Cross-check for the Moon-planet grouping, Comet 10P/Tempel 2, Milky Way window and Saturn ring-angle context."
        },
        rmg: {
          label: "Royal Observatory Greenwich, July 2026",
          url: "https://www.rmg.co.uk/stories/space-astronomy/astronomy/night-sky-highlights-july-2026",
          note: "Reference for July sky highlights including aphelion, Matariki, Carroll Crater and Delta Aquariids."
        },
        astronomyEngine: {
          label: "Astronomy Engine",
          url: "https://github.com/cosinekitty/astronomy",
          note: "Moon altitude, azimuth, rise/set and twilight calculations use Astronomy Engine's browser library."
        },
        openMeteo: {
          label: "Open-Meteo Forecast API",
          url: "https://open-meteo.com/en/docs",
          note: "The local 3-day forecast uses Open-Meteo hourly cloud cover, humidity, temperature, precipitation probability, wind speed, WMO weather codes and location timezone. Seeing is an in-calendar planning estimate from those variables, not a dedicated CMC seeing model."
        },
        openMeteoGeo: {
          label: "Open-Meteo Geocoding API",
          url: "https://open-meteo.com/en/docs/geocoding-api",
          note: "Manual place-name search uses Open-Meteo geocoding for coordinates and timezone, then the calendar recalculates local astronomical timing and weather."
        },
        inSky: {
          label: "In-The-Sky.org July 2026 calendar",
          url: "https://in-the-sky.org/newscal.php?maxdiff=7&month=7&year=2026",
          note: "Cross-check for close approaches, occultations, oppositions and shower peaks."
        },
        ams: {
          label: "American Meteor Society meteor calendar",
          url: "https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/",
          note: "Meteor shower peak and moonlight context for the Southern Delta Aquariids and alpha Capricornids."
        },
        nasaEvents: {
          label: "NASA events",
          url: "https://www.nasa.gov/events/",
          note: "NASA-listed launch and coverage dates."
        },
        nasaSoyuz: {
          label: "NASA Soyuz MS-29",
          url: "https://www.nasa.gov/event/soyuz-ms-29/",
          note: "NASA mission page for the Soyuz MS-29 crewed ISS launch."
        },
        spacex: {
          label: "SpaceX launches",
          url: "https://www.spacex.com/launches",
          note: "Official SpaceX launch page for Falcon 9 mission dates."
        },
        spaceflightNow: {
          label: "Spaceflight Now launch schedule",
          url: "https://spaceflightnow.com/launch-schedule/",
          note: "Launch schedule used to cross-check Falcon 9 dates, windows and launch sites."
        },
        nextSpaceflight: {
          label: "Next Spaceflight launch list",
          url: "https://nextspaceflight.com/launches/",
          note: "Launch listing used to cross-check SpaceX and Soyuz dates."
        },
        astromaniacArticles: {
          label: "Astromaniac Magazine articles",
          url: "https://www.astromaniacmagazine.com/articles",
          note: "Article recommendations are selected from Astromaniac Magazine's current articles index and matched to the night's Moon, sky and launch context."
        }
      };

      const articleData = {
        deepSky: {
          title: "Astrophotography Anywhere: Best Deep-Sky Targets for Light-Polluted and Dark-Sky Locations",
          url: "https://www.astromaniacmagazine.com/articles/astrophotography-anywhere-best-deep-sky-targets-for-light-polluted-and-dark-sky-locations",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/67cdb38f2b2e3d32a212902d/1741534096005/Astromaniac+Magazine_light-pollution-bortle-class.jpeg?format=750w",
          kind: "Article"
        },
        moon: {
          title: "Supermoon: How An Illusion Makes The Full Moon Appear Bigger Than It Really Is",
          url: "https://www.astromaniacmagazine.com/articles/supermoon-how-an-illusion-makes-the-full-moon-appear-bigger-than-it-really-is",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/695c22f72e97d326b10fb19b/1767645945673/unsplash-image-ve_uN9V8xqU.jpg?format=750w",
          kind: "Article"
        },
        launch: {
          title: "What's Gone Wrong Between Nasa And Elon Musk's SpaceX?",
          url: "https://www.astromaniacmagazine.com/articles/whats-gone-wrong-between-nasa-and-elon-musks-spacex",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/6932cf67dc074a59f9ad6b17/1764937575242/file-20251102-56-e4dr6q.jpg?format=750w",
          kind: "Article"
        },
        numbers: {
          title: "The Big Seven: Why Numbers Matter in Astrophotography",
          url: "https://www.astromaniacmagazine.com/articles/why-numbers-matter-in-astrophotography",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/67111efb41ec1c4994ea1b3f/6863d7553631d3567ba056c0/1769689545951/unsplash-image--h8Od9ze-0o.jpg?format=750w",
          kind: "Article"
        },
        telescope: {
          title: "A New Generation of Telescopes Will Probe The Unknown Unknowns",
          url: "https://www.astromaniacmagazine.com/articles/new-generation-of-telescopes",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/6728c6e99ebd4e6e30e98fed/1730725615439/The+Rubin+Observatory.jpeg?format=750w",
          kind: "Article"
        },
        planetary: {
          title: "A Real Treat for Skywatchers: Rare Planetary Parade",
          url: "https://www.astromaniacmagazine.com/articles/rare-planetary-parade",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/67bf4450e47c4e7a2363bac1/1740588112827/Astromaniac+Magazine_planets+alignment.jpg?format=750w",
          kind: "Article"
        },
        lightPollution: {
          title: "Light Pollution Has Cut Humanity's Ancient Connection With The Stars",
          url: "https://www.astromaniacmagazine.com/articles/light-pollution",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/68fde30033288c43fc363513/1761469184940/unsplash-image-m_MdXo-axyg.jpg?format=750w",
          kind: "Article"
        },
        accessories: {
          title: "14 Underrated Astrophotography Accessories That Will Transform Your Workflow",
          url: "https://www.astromaniacmagazine.com/articles/14-underrated-astrophotography-accessories-that-will-transform-your-workflow",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/697b5133508dce356f001036/1769689395970/14+Underrated+Astrophotography+Accessories+That+Will+Transform+Your+Workflow.jpg?format=750w",
          kind: "Article"
        },
        sqmReview: {
          title: "Measure Sky Quality to Tackle Light Pollution",
          url: "https://www.astromaniacmagazine.com/reviews/unihedron-sky-quality-meter-lu",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/69cae3ad9ca09f06a1530400/1774904243635/Sky+Quality+Meter+by+Unihedron+Astromaniac+Magazine+Review+3.jpg?format=750w",
          kind: "Review"
        },
        zwoReview: {
          title: "ZWO AM5N Harmonic Equatorial Mount: A New Era Begins!",
          url: "https://www.astromaniacmagazine.com/reviews/zwo-am5n",
          image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/6795069bb508a23893983874/1737819803394/ZWO+AM5N.jpg?format=750w",
          kind: "Review"
        }
      };

      const media = {
        earth: nasaImage("https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001386/GSFC_20171208_Archive_e001386~medium.jpg", "https://images.nasa.gov/details/GSFC_20171208_Archive_e001386"),
        milkyWay: nasaImage("https://images-assets.nasa.gov/image/PIA13974/PIA13974~medium.jpg", "https://images.nasa.gov/details/PIA13974"),
        lagoon: nasaImage("https://assets.science.nasa.gov/content/dam/science/missions/hubble/nebulae/emission/Hubble_M8_ACS_1_flat_FINAL.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-8/"),
        trifid: nasaImage("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2026/04/STScI-01KM5VPG2R1WX1SY7ASDJ9JEV5.jpg?w=900", "https://science.nasa.gov/asset/hubble/trifid-nebula-wide-field-camera-3-image/"),
        comet: nasaImage("https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/07/hartley2_main.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "https://science.nasa.gov/solar-system/comets/"),
        pleiades: nasaImage("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2000/12/STScI-01EVT9S49SBSG3HS70G8GW5PRJ.tif?w=900", "https://science.nasa.gov/asset/hubble/ghostly-reflections-in-the-pleiades/"),
        saturn: nasaImage("https://svs.gsfc.nasa.gov/vis/a030000/a030300/a030348/saturn_full_disk_PIA06193_print.jpg", "https://svs.gsfc.nasa.gov/30348/"),
        meteor: nasaImage("https://images-assets.nasa.gov/image/NHQ202508030001/NHQ202508030001~medium.jpg", "https://images.nasa.gov/details/NHQ202508030001"),
        cluster: nasaImage("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2000/12/STScI-01EVT9S49SBSG3HS70G8GW5PRJ.tif?w=900", "https://science.nasa.gov/asset/hubble/ghostly-reflections-in-the-pleiades/"),
        soyuz: nasaImage("https://images-assets.nasa.gov/image/NHQ201907180037/NHQ201907180037~medium.jpg", "https://images.nasa.gov/details/NHQ201907180037"),
        spacex40: nasaImage("https://sxcontent9668.azureedge.us/cms-assets/assets/medium_Kuiper_KF_03_vertical_sunset_101225_DSC_9663_desktop_4bcd35ae8f.jpg", "https://www.spacex.com/launches"),
        spacexVandy: nasaImage("https://sxcontent9668.azureedge.us/cms-assets/assets/medium_Vandy_desktop2_dbaac02989.jpg", "https://www.spacex.com/launches"),
        transporter: nasaImage("https://sxcontent9668.azureedge.us/cms-assets/assets/medium_20260313_20260313_Starlink_G17_31_Verticals_NPC_00017_DSC_00017_Desktop_645080871a.jpg", "https://www.spacex.com/launches")
      };

      const moonData = {
        1: { frame: 4357, phase: 97.9, age: 16.38, distance: 402810 },
        2: { frame: 4381, phase: 94.3, age: 17.38, distance: 400438 },
        3: { frame: 4405, phase: 89.0, age: 18.38, distance: 397475 },
        4: { frame: 4429, phase: 82.0, age: 19.38, distance: 393924 },
        5: { frame: 4453, phase: 73.6, age: 20.38, distance: 389804 },
        6: { frame: 4477, phase: 64.0, age: 21.38, distance: 385178 },
        7: { frame: 4501, phase: 53.5, age: 22.38, distance: 380174 },
        8: { frame: 4525, phase: 42.6, age: 23.38, distance: 375008 },
        9: { frame: 4549, phase: 31.6, age: 24.38, distance: 369984 },
        10: { frame: 4573, phase: 21.4, age: 25.38, distance: 365481 },
        11: { frame: 4597, phase: 12.5, age: 26.38, distance: 361922 },
        12: { frame: 4621, phase: 5.6, age: 27.38, distance: 359704 },
        13: { frame: 4645, phase: 1.4, age: 28.38, distance: 359130 },
        14: { frame: 4669, phase: 0.1, age: 0.10, distance: 360341 },
        15: { frame: 4693, phase: 1.8, age: 1.09, distance: 363277 },
        16: { frame: 4717, phase: 6.2, age: 2.10, distance: 367678 },
        17: { frame: 4741, phase: 12.9, age: 3.10, distance: 373137 },
        18: { frame: 4765, phase: 21.2, age: 4.09, distance: 379167 },
        19: { frame: 4789, phase: 30.6, age: 5.09, distance: 385272 },
        20: { frame: 4813, phase: 40.5, age: 6.09, distance: 391011 },
        21: { frame: 4837, phase: 50.5, age: 7.09, distance: 396031 },
        22: { frame: 4861, phase: 60.2, age: 8.10, distance: 400086 },
        23: { frame: 4885, phase: 69.4, age: 9.10, distance: 403038 },
        24: { frame: 4909, phase: 77.8, age: 10.10, distance: 404847 },
        25: { frame: 4933, phase: 85.1, age: 11.10, distance: 405557 },
        26: { frame: 4957, phase: 91.2, age: 12.10, distance: 405270 },
        27: { frame: 4981, phase: 95.8, age: 13.10, distance: 404128 },
        28: { frame: 5005, phase: 98.8, age: 14.10, distance: 402289 },
        29: { frame: 5029, phase: 100.0, age: 15.10, distance: 399903 },
        30: { frame: 5053, phase: 99.2, age: 16.09, distance: 397100 },
        31: { frame: 5077, phase: 96.5, age: 17.09, distance: 393981 }
      };

      const exactMoon = {
        7: "Last Quarter 19:29 UTC",
        14: "New Moon 09:44 UTC",
        21: "First Quarter 11:06 UTC",
        29: "Full Moon 14:36 UTC"
      };

      const monthIntel = [
        { title: "Moon-free dates", text: "14-16 Jul. Lowest Moon interference of the month.", image: moonImage(14, 216), alt: "New Moon" },
        { title: "Astronomical night", text: "Use Current Location to calculate local dark-time windows.", image: media.milkyWay.src, alt: "Milky Way night sky" },
        { title: "Meteor peak", text: "Delta Aquariids peak 30 Jul. Radiant height depends on latitude.", image: media.meteor.src, alt: "Meteor shower" },
        { title: "Launch watch", text: "SpaceX and Soyuz launch dates in current listings.", image: media.spacex40.src, alt: "SpaceX rocket launch" }
      ];

      const targetData = {
        4: ["Mars-Uranus pairing", "Waning gibbous Moon", "Saturn"],
        5: ["Carroll Crater", "Waning gibbous Moon", "Saturn"],
        6: ["Waning gibbous Moon", "Saturn", "Bright clusters"],
        7: ["Last Quarter Moon", "Saturn", "Bright clusters"],
        10: ["Pleiades (M45)", "Waning crescent Moon", "Saturn"],
        11: ["Moon-Mars-Saturn line-up", "Waning crescent Moon", "Saturn"],
        12: ["Delta Aquariids", "Waning crescent Moon", "Saturn"],
        13: ["Thin crescent Moon", "Delta Aquariids", "Saturn"],
        14: ["Milky Way core", "Lagoon Nebula (M8)", "Trifid Nebula (M20)"],
        15: ["Milky Way core", "Lagoon Nebula (M8)", "Comet 10P/Tempel 2"],
        16: ["Crescent Moon", "Milky Way core", "Comet 10P/Tempel 2"],
        17: ["Moon-Venus pairing", "Crescent Moon", "Milky Way fields"],
        24: ["Antares occultation", "Waxing gibbous Moon", "Saturn"],
        26: ["Saturn", "Waxing gibbous Moon", "Pluto"],
        27: ["Pluto", "Saturn", "Waxing gibbous Moon"],
        29: ["Full Moon", "Moonrise", "Saturn"],
        30: ["Delta Aquariids", "Alpha Capricornids", "Full Moon"],
        31: ["Saturn", "Waning gibbous Moon", "Bright clusters"]
      };

      const eventData = {
        4: [
          event("sky", "Mars and Uranus close", "Dawn binocular pairing. Uranus is faint; Mars is the finder.", "Angular separation and altitude vary by location.", ["inSky"])
        ],
        5: [
          event("telescope", "Carroll Crater libration", "The Moon's western limb tilts more favourably towards Earth.", "Small telescope event.", ["rmg"]),
          event("launch", "SpaceX Starlink 10-50", "Falcon 9 Starlink mission from SLC-40, Florida.", "Launch-watch item.", ["spacex", "spaceflightNow", "nextSpaceflight"], media.spacex40)
        ],
        6: [
          event("sky", "Earth at aphelion", "Earth is farthest from the Sun at about 17:30 UTC.", "Earth-Sun distance marker.", ["rmg"], media.earth)
        ],
        7: [
          event("moon", "Last Quarter Moon", "Exact phase 19:29 UTC. The terminator crosses the visible lunar disc.", "Moon phase marker.", ["astronomyEngine", "nasaSvs"]),
          event("launch", "SpaceX Transporter-17", "Falcon 9 rideshare mission from SLC-4E, California.", "Launch-watch item.", ["spacex", "spaceflightNow", "nextSpaceflight"], media.transporter)
        ],
        9: [
          event("launch", "SpaceX Starlink 10-42", "Falcon 9 Starlink mission from SLC-40, Florida.", "Launch-watch item.", ["spacex", "spaceflightNow", "nextSpaceflight"], media.spacex40)
        ],
        10: [
          event("sky", "Matariki and Pleiades", "Matariki marks the heliacal rising of the Pleiades in Aotearoa New Zealand.", "Visibility depends strongly on latitude and twilight.", ["rmg", "inSky"], media.pleiades)
        ],
        11: [
          event("sky", "Dawn Moon-planet line-up", "Waning crescent near Mars and Saturn. Uranus remains a binocular or telescope object.", "Pre-sunrise alignment.", ["nasaSky", "inSky"]),
          event("launch", "SpaceX Starlink 17-48", "Falcon 9 Starlink mission from SLC-4E, California.", "Launch-watch item.", ["spacex", "spaceflightNow", "nextSpaceflight"], media.spacexVandy)
        ],
        12: [
          event("meteor", "Delta Aquariids active", "The shower is active from today. The radiant is in Aquarius.", "Meteor shower active period begins.", ["rmg"], media.meteor)
        ],
        13: [
          event("moon", "Moon near perigee", "Very thin crescent near closest monthly approach.", "Moon distance marker.", ["inSky", "nasaSvs"]),
          event("launch", "SpaceX Starlink 15-14", "Falcon 9 Starlink mission from SLC-4E, California.", "Launch-watch item.", ["spacex", "spaceflightNow", "nextSpaceflight"], media.spacexVandy)
        ],
        14: [
          event("moon", "New Moon", "Exact phase 09:44 UTC. Lunar illumination is near zero.", "Moon phase marker.", ["astronomyEngine", "nasaSvs", "rmg"]),
          event("sky", "Milky Way and Comet 10P", "Moonlight is minimal. Comet 10P/Tempel 2 is also in play.", "Dark-sky opportunity.", ["nasaSky"], media.milkyWay),
          event("launch", "Soyuz MS-29", "Crewed Soyuz launch to the International Space Station.", "Live coverage item.", ["nasaEvents", "nasaSoyuz", "nextSpaceflight"], media.soyuz)
        ],
        17: [
          event("sky", "Moon near Venus", "Slim Moon and Venus appear close on the sky.", "Twilight pairing.", ["inSky"])
        ],
        21: [
          event("moon", "First Quarter Moon", "Exact phase 11:06 UTC. Half the visible disc is illuminated.", "Moon phase marker.", ["astronomyEngine", "nasaSvs"])
        ],
        24: [
          event("occultation", "Antares occultation", "Lunar occultation path depends on observer location.", "Path-dependent event.", ["inSky"])
        ],
        25: [
          event("moon", "Moon at apogee", "The Moon is farthest from Earth this month.", "Moon distance marker.", ["inSky", "nasaSvs"])
        ],
        26: [
          event("telescope", "Saturn thin-ring season", "Saturn's rings are still unusually narrow from Earth's viewpoint.", "Telescope target.", ["nasaSky"], media.saturn)
        ],
        27: [
          event("opposition", "Pluto at opposition", "Pluto is opposite the Sun in Earth's sky.", "Advanced telescope target.", ["inSky"])
        ],
        29: [
          event("moon", "Full Moon", "Exact phase 14:36 UTC. Illumination is effectively 100 percent.", "Moon phase marker.", ["astronomyEngine", "nasaSvs", "rmg"])
        ],
        30: [
          event("meteor", "Delta Aquariids peak", "Peak night. Radiant altitude depends on latitude and local time; bright Moon will interfere.", "Meteor shower peak.", ["rmg", "inSky", "ams"], media.meteor),
          event("meteor", "Alpha Capricornids peak", "Low-rate shower known for occasional bright meteors; bright Moon will interfere.", "Meteor shower peak.", ["inSky", "ams"], media.meteor)
        ],
        31: [
          event("telescope", "Saturn ring angle", "Saturn's ring plane remains narrow from Earth's viewpoint.", "Telescope target.", ["nasaSky"], media.saturn)
        ]
      };
  window.AMC_MONTH_DATA["2026-07"] = {
    id: "2026-07",
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
