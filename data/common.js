(() => {
  "use strict";

  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2026, 6, 14, 9, 44);

  function event(type, title, copy, fact, sourceIds, mediaAsset) {
    return { type, title, copy, fact, sourceIds, media: mediaAsset || null };
  }

  function nasaImage(src, link) {
    return { src, link };
  }

  function buildMoonData(year, monthIndex, days) {
    const moonData = {};
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(Date.UTC(year, monthIndex, day, 12));
      const age = moonAge(date);
      moonData[day] = {
        frame: moonFrame(year, monthIndex, day),
        phase: moonIllumination(date, age),
        age,
        distance: moonDistance(date, age)
      };
    }
    return moonData;
  }

  function moonFrame(year, monthIndex, day) {
    const start = Date.UTC(2026, 0, 1, 12);
    const sample = Date.UTC(year, monthIndex, day, 12);
    return 13 + Math.round((sample - start) / 86400000) * 24;
  }

  function moonAge(date) {
    try {
      const angle = window.Astronomy?.MoonPhase?.(date);
      if (Number.isFinite(angle)) return (((angle % 360) + 360) % 360) / 360 * synodicMonth;
    } catch {}
    const elapsed = (date.getTime() - knownNewMoon) / 86400000;
    return ((elapsed % synodicMonth) + synodicMonth) % synodicMonth;
  }

  function moonIllumination(date, age) {
    try {
      const info = window.Astronomy?.Illumination?.(window.Astronomy.Body.Moon, date);
      if (Number.isFinite(info?.phase_fraction)) return info.phase_fraction * 100;
    } catch {}
    return 50 * (1 - Math.cos((age / synodicMonth) * Math.PI * 2));
  }

  function moonDistance(date, age) {
    try {
      const astronomy = window.Astronomy;
      const vector = astronomy?.GeoVector?.(astronomy.Body.Moon, date, false);
      const au = typeof vector?.Length === "function"
        ? vector.Length()
        : Math.hypot(vector?.x || 0, vector?.y || 0, vector?.z || 0);
      if (Number.isFinite(au) && Number.isFinite(astronomy?.KM_PER_AU)) return Math.round(au * astronomy.KM_PER_AU);
    } catch {}
    return Math.round(384400 + 22000 * Math.sin((age / synodicMonth) * Math.PI * 2));
  }

  const sources = {
    nasaSvs: {
      label: "NASA SVS 2026 Moon Phase and Libration",
      url: "https://svs.gsfc.nasa.gov/5587/",
      note: "Daily Moon images use NASA's LRO-based 2026 visualisation frames, sampled at 12:00 UT."
    },
    astronomyEngine: {
      label: "Astronomy Engine",
      url: "https://github.com/cosinekitty/astronomy",
      note: "Moon phase, distance, altitude, azimuth, rise/set and twilight calculations use Astronomy Engine's browser library."
    },
    openMeteo: {
      label: "Open-Meteo Forecast API",
      url: "https://open-meteo.com/en/docs",
      note: "The local 7-night forecast uses Open-Meteo hourly cloud cover, humidity, temperature, precipitation probability, wind speed, WMO weather codes and location timezone."
    },
    openMeteoGeo: {
      label: "Open-Meteo Geocoding API",
      url: "https://open-meteo.com/en/docs/geocoding-api",
      note: "Manual place-name search uses Open-Meteo geocoding for coordinates and timezone, then the calendar recalculates local astronomical timing and weather."
    },
    bigDataCloud: {
      label: "BigDataCloud Reverse Geocoding",
      url: "https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api",
      note: "Browser current-location names use BigDataCloud's free reverse geocoding endpoint; coordinates still come directly from the browser geolocation permission flow."
    },
    targetSizes: {
      label: "NASA Messier catalogue and LCO angular-size guide",
      url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/",
      note: "Target-card apparent sizes use catalogue angular dimensions for Messier/deep-sky objects and standard angular-size ranges for the Moon and planets; variable objects are labelled variable."
    },
    simbad: {
      label: "SIMBAD Astronomical Database",
      url: "https://simbad.cds.unistra.fr/simbad/",
      note: "Deep-sky target coordinates and catalogue identities are cross-checked against the SIMBAD database operated by CDS, Strasbourg."
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
    },
    artemis: {
      title: "Artemis II Mission Report",
      url: "https://www.astromaniacmagazine.com/artemis-ii-mission-report",
      image: "",
      kind: "Mission Report"
    },
    jamesWebb: {
      title: "James Webb: Inside the Mission",
      url: "https://www.astromaniacmagazine.com/james-webb-space-telescope-inside-the-mission",
      image: "",
      kind: "Mission Guide"
    },
    darkStars: {
      title: "When Darkness Shines: How Dark Stars Could Illuminate The Early Universe",
      url: "https://www.astromaniacmagazine.com/articles/when-darkness-shines-how-dark-stars-could-illuminate-the-early-universe",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/6a21a49af2f64d69b394e4f8/1780589722203/NASA%E2%80%99s+Webb+Delivers+Deepest+Infrared+Image+of+Universe+Yet.jpg?format=750w",
      kind: "Article"
    },
    lunarLife: {
      title: "The Unseen Challenges Of Life On The Moon",
      url: "https://www.astromaniacmagazine.com/articles/the-unseen-challenges-of-life-on-the-moon",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/69d58a8a41aa4877850635b0/1775602318842/NASA+Earthrise.jpg?format=750w",
      kind: "Article"
    },
    marsLife: {
      title: "Molecules Found In Martian Rock Hint At Ancient Life",
      url: "https://www.astromaniacmagazine.com/articles/molecules-found-in-martian-rock-hint-at-ancient-life",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/69c06f742b5c1a4793c5a9be/1774219124136/Molecules+found+in+Martian+rock+hint+at+ancient+life+%E2%80%93+new+study.jpg?format=750w",
      kind: "Article"
    },
    spaceDebris: {
      title: "Space Debris: Will It Take A Catastrophe For Nations To Take The Issue Seriously?",
      url: "https://www.astromaniacmagazine.com/articles/space-debris-will-it-take-a-catastrophe-for-nations-to-take-the-issue-seriously",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/6945881d78a9133f02890892/1766164509760/Space+debris.jpg?format=750w",
      kind: "Article"
    },
    earthLike: {
      title: "Our Quest To Find A Truly Earth-like Planet In Deep Space",
      url: "https://www.astromaniacmagazine.com/articles/our-quest-to-find-a-truly-earth-like-planet-in-deep-space",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/6901f490b715376eb1ae5163/1761735824711/unsplash-image-2ZzOkyyShIc.jpg?format=750w",
      kind: "Article"
    },
    planetNine: {
      title: "The Hunt For Planet Nine",
      url: "https://www.astromaniacmagazine.com/articles/the-hunt-for-planet-nine-why-there-could-still-be-something-massive-at-the-edge-of-the-solarnbspsystem",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/689b6a2e04a17d214f5744e8/1755015726825/Planet_nine_artistic_plain.png?format=750w",
      kind: "Article"
    },
    rubin: {
      title: "Could The First Images From The Vera Rubin Telescope Change How We View Space For Good?",
      url: "https://www.astromaniacmagazine.com/articles/could-the-first-images-from-the-vera-rubin-telescope-change-how-we-view-space-for-good",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/689a002d2352f55305f9fae7/1754923053949/The+Lagoon+Nebula+-+Astromaniac+Magazine.jpg?format=750w",
      kind: "Article"
    },
    earliestGalaxies: {
      title: "The Earliest Galaxies Formed Amazingly Fast",
      url: "https://www.astromaniacmagazine.com/articles/the-earliest-galaxies-formed-amazingly-fast",
      image: "https://static1.squarespace.com/static/6707b4b3f2000e3c80442056/t/67329fdca137590340b1bcb5/1731370972851/IC+2163+and+NGC+2207+galaxies.jpg?format=750w",
      kind: "Article"
    }
  };

  const media = {
    milkyWay: nasaImage("https://images-assets.nasa.gov/image/PIA13974/PIA13974~medium.jpg", "https://images.nasa.gov/details/PIA13974"),
    lagoon: nasaImage("https://assets.science.nasa.gov/content/dam/science/missions/hubble/nebulae/emission/Hubble_M8_ACS_1_flat_FINAL.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-8/"),
    trifid: nasaImage("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2026/04/STScI-01KM5VPG2R1WX1SY7ASDJ9JEV5.jpg?w=900", "https://science.nasa.gov/asset/hubble/trifid-nebula-wide-field-camera-3-image/"),
    comet: nasaImage("https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/07/hartley2_main.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "https://science.nasa.gov/solar-system/comets/"),
    pleiades: nasaImage("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2000/12/STScI-01EVT9S49SBSG3HS70G8GW5PRJ.tif?w=900", "https://science.nasa.gov/asset/hubble/ghostly-reflections-in-the-pleiades/"),
    saturn: nasaImage("https://svs.gsfc.nasa.gov/vis/a030000/a030300/a030348/saturn_full_disk_PIA06193_print.jpg", "https://svs.gsfc.nasa.gov/30348/"),
    meteor: nasaImage("https://images-assets.nasa.gov/image/NHQ202508030001/NHQ202508030001~medium.jpg", "https://images.nasa.gov/details/NHQ202508030001"),
    cluster: nasaImage("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2000/12/STScI-01EVT9S49SBSG3HS70G8GW5PRJ.tif?w=900", "https://science.nasa.gov/asset/hubble/ghostly-reflections-in-the-pleiades/"),
    planets: nasaImage("https://images-assets.nasa.gov/image/PIA00405/PIA00405~medium.jpg", "https://images.nasa.gov/details/PIA00405"),
    venus: nasaImage("https://images-assets.nasa.gov/image/PIA00104/PIA00104~medium.jpg", "https://images.nasa.gov/details/PIA00104"),
    sun: nasaImage("https://svs.gsfc.nasa.gov/vis/a010000/a014200/a014263/133DaysontheSun_StillSept15_print.jpg", "https://svs.gsfc.nasa.gov/14263/"),
    eclipse: nasaImage("https://svs.gsfc.nasa.gov/vis/a010000/a014500/a014572/DallasTotality_VanessaThomas_WhiteLight_YouTube.00001_print.jpg", "https://svs.gsfc.nasa.gov/14572")
  };

  window.AMC_SHARED = {
    articleData,
    buildMoonData,
    event,
    media,
    nasaImage,
    sources
  };
})();
