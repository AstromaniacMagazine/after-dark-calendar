# Squarespace embed for After Dark Calendar

The calendar sends its current document height and active mobile day to the parent page. The Squarespace Code Block must listen for those messages so the iframe grows to its full height. This removes the iframe's second vertical scrollbar and keeps a mobile day/date control sticky in the Squarespace page.

Replace the existing calendar iframe Code Block with this snippet:

```html
<div class="adc-embed" id="adc-embed">
  <nav class="adc-mobile-day-nav" aria-label="Swipe calendar dates left or right">
    <div class="adc-mobile-day-rail" role="listbox" aria-label="Calendar dates"></div>
  </nav>
  <iframe
    id="adc-calendar-frame"
    src="https://astromaniacmagazine.github.io/after-dark-calendar/"
    title="After Dark Calendar by Astromaniac Magazine"
    width="100%"
    height="1200"
    scrolling="no"
    allow="geolocation"
  ></iframe>
</div>

<style>
  .adc-embed { box-sizing: border-box; max-width: 100%; overflow: clip; width: 100%; }
  #adc-calendar-frame { border: 0; display: block; max-width: 100%; overflow: hidden; width: 100%; }
  .adc-mobile-day-nav { display: none; }
  @media (max-width: 600px) {
    .adc-mobile-day-nav {
      backdrop-filter: blur(14px);
      background: rgba(255,253,248,.96);
      border-radius: 13px;
      box-shadow: 0 8px 24px rgba(22,25,29,.14);
      box-sizing: border-box;
      display: block;
      margin: 0 0 5px;
      min-height: 58px;
      overflow: hidden;
      padding: 4px 0;
      position: sticky;
      top: max(0px, env(safe-area-inset-top));
      z-index: 20;
    }
    .adc-mobile-day-rail { align-items: center; display: flex; gap: 5px; min-height: 50px; overflow-x: auto; overflow-y: hidden; overscroll-behavior-inline: contain; padding-inline: calc(50% - 27px); scroll-padding-inline: calc(50% - 27px); scrollbar-width: none; scroll-snap-type: x mandatory; touch-action: pan-x pan-y pinch-zoom; -webkit-overflow-scrolling: touch; }
    .adc-mobile-day-rail::-webkit-scrollbar { display: none; }
    .adc-day-chip { align-content: center; background: #f1ece3; border: 1px solid rgba(24,28,34,.14); border-radius: 10px; color: #6d747d; display: grid; flex: 0 0 54px; font-family: Manrope, Inter, system-ui, sans-serif; gap: 1px; height: 38px; line-height: 1; opacity: .62; scroll-snap-align: center; scroll-snap-stop: always; text-align: center; transform: scale(.94); transition: height .16s ease, opacity .16s ease, transform .16s ease, border-color .16s ease, background .16s ease; }
    .adc-day-chip small { font-size: .52rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .adc-day-chip b { font-size: .74rem; font-weight: 600; white-space: nowrap; }
    .adc-day-chip.is-active { background: #e7f1f2; border-color: rgba(15,111,132,.64); color: #16191d; height: 50px; opacity: 1; transform: scale(1); }
    .adc-day-chip.is-active small, .adc-day-chip.is-active b { font-weight: 700; }
    .adc-day-chip.is-today { box-shadow: inset 0 0 0 1px rgba(15,111,132,.7); }
    body#collection-6a4777cf704b782ab47f350c { max-width: 100vw !important; overflow-x: clip !important; }
    body#collection-6a4777cf704b782ab47f350c main,
    body#collection-6a4777cf704b782ab47f350c article,
    body#collection-6a4777cf704b782ab47f350c .page-section,
    body#collection-6a4777cf704b782ab47f350c .content-wrapper { box-sizing: border-box; max-width: 100% !important; overflow-x: clip !important; }
    body#collection-6a4777cf704b782ab47f350c .header-title-nav-wrapper,
    body#collection-6a4777cf704b782ab47f350c .header-mobile-logo { box-sizing: border-box; max-width: calc(100vw - 90px) !important; min-width: 0 !important; width: calc(100vw - 90px) !important; }
    body#collection-6a4777cf704b782ab47f350c .header-mobile-logo a,
    body#collection-6a4777cf704b782ab47f350c .header-mobile-logo picture,
    body#collection-6a4777cf704b782ab47f350c .header-mobile-logo img { height: auto !important; max-width: 100% !important; min-width: 0 !important; width: 100% !important; }
  }
</style>

<script>
(() => {
  const frame = document.getElementById('adc-calendar-frame');
  const rail = document.querySelector('#adc-embed .adc-mobile-day-rail');
  if (!frame || !rail) return;
  const allowedOrigin = 'https://astromaniacmagazine.github.io';
  let syncTimer = 0;
  let settleTimer = 0;

  const centreActive = smooth => {
    const active = rail.querySelector('.adc-day-chip.is-active');
    if (!active) return;
    const left = Math.max(0, Math.min(active.offsetLeft + active.offsetWidth / 2 - rail.clientWidth / 2, rail.scrollWidth - rail.clientWidth));
    window.clearTimeout(syncTimer);
    rail.dataset.syncing = 'true';
    rail.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    syncTimer = window.setTimeout(() => { delete rail.dataset.syncing; }, smooth ? 280 : 40);
  };

  const renderRail = entries => {
    rail.innerHTML = entries.map(entry => `<span class="adc-day-chip${entry.active ? ' is-active' : ''}${entry.today ? ' is-today' : ''}" role="option" aria-selected="${entry.active}" data-month-id="${entry.monthId}" data-day="${entry.day}"><small>${entry.weekday}</small><b>${entry.date}</b></span>`).join('');
    centreActive(false);
  };

  window.addEventListener('message', event => {
    if (event.origin !== allowedOrigin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'amc:resize') {
      const height = Math.ceil(Number(event.data.height));
      if (Number.isFinite(height) && height >= 600 && height <= 30000) frame.height = String(height);
    }
    if (event.data?.type === 'amc:day-state' && Array.isArray(event.data.dayRail)) renderRail(event.data.dayRail);
    if (event.data?.type === 'amc:scroll-parent') {
      const deltaY = Math.max(-120, Math.min(120, Number(event.data.deltaY) || 0));
      if (deltaY) window.scrollBy(0, deltaY);
    }
  });

  rail.addEventListener('scroll', () => {
    if (rail.dataset.syncing) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const rect = rail.getBoundingClientRect();
      const centre = rect.left + rect.width / 2;
      const closest = [...rail.querySelectorAll('.adc-day-chip')].reduce((best, chip) => {
        const chipRect = chip.getBoundingClientRect();
        const distance = Math.abs(chipRect.left + chipRect.width / 2 - centre);
        return !best || distance < best.distance ? { chip, distance } : best;
      }, null)?.chip;
      if (!closest || closest.classList.contains('is-active')) { centreActive(true); return; }
      frame.contentWindow.postMessage({ type: 'amc:navigate-date', monthId: closest.dataset.monthId, day: Number(closest.dataset.day) }, allowedOrigin);
    }, 100);
  }, { passive: true });

  const announceParent = () => frame.contentWindow.postMessage({ type: 'amc:embed-ready' }, allowedOrigin);
  frame.addEventListener('load', announceParent);
  announceParent();
})();
</script>
```

The origin and source checks are intentional: do not replace them with a wildcard (`*`).
