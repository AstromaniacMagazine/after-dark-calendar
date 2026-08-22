# Squarespace embed for After Dark Calendar

The calendar sends its current document height and active mobile day to the parent page. The Squarespace Code Block must listen for those messages so the iframe grows to its full height. This removes the iframe's second vertical scrollbar and keeps a mobile day/date control sticky in the Squarespace page.

Replace the existing calendar iframe Code Block with this snippet:

```html
<div class="adc-embed" id="adc-embed">
  <nav class="adc-mobile-day-nav" aria-label="Calendar day navigation">
    <button type="button" data-adc-direction="-1" aria-label="Previous day"><small>Previous</small><span>Day</span></button>
    <span class="adc-current-day"><strong>Loading calendar...</strong><small>Date</small></span>
    <button type="button" data-adc-direction="1" aria-label="Next day"><small>Next</small><span>Day</span></button>
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
      align-items: center;
      backdrop-filter: blur(14px);
      background: rgba(255,253,248,.96);
      border: 0;
      border-radius: 13px;
      box-shadow: 0 8px 24px rgba(22,25,29,.14);
      box-sizing: border-box;
      display: grid;
      font-family: Manrope, Inter, system-ui, sans-serif;
      gap: 5px;
      grid-template-columns: minmax(0,1fr) minmax(0,2fr) minmax(0,1fr);
      margin: 0 0 5px;
      min-height: 46px;
      padding: 3px;
      position: sticky;
      top: max(0px, env(safe-area-inset-top));
      z-index: 20;
    }
    .adc-mobile-day-nav button {
      background: #f1ece3;
      border: 1px solid rgba(24,28,34,.2);
      border-radius: 10px;
      color: #5d6671;
      display: grid;
      font-family: Manrope, Inter, system-ui, sans-serif;
      gap: 1px;
      height: 40px;
      min-width: 0;
      padding: 3px 4px;
    }
    .adc-mobile-day-nav button small { font-size: .58rem; font-weight: 700; text-transform: uppercase; }
    .adc-mobile-day-nav button span { font-size: .62rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .adc-mobile-day-nav button:disabled { opacity: .3; }
    .adc-mobile-day-nav .adc-current-day { align-content: center; background: #e7f1f2; border: 1px solid rgba(15,111,132,.5); border-radius: 10px; display: grid; gap: 1px; min-width: 0; text-align: center; }
    .adc-mobile-day-nav strong { color: #16191d; font-size: .94rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .adc-mobile-day-nav small { color: #0f6f84; font-size: .6rem; font-weight: 700; text-transform: uppercase; }
    body#collection-6a4777cf704b782ab47f350c { overflow-x: clip !important; }
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
  const nav = document.querySelector('#adc-embed .adc-mobile-day-nav');
  if (!frame || !nav) return;
  const allowedOrigin = 'https://astromaniacmagazine.github.io';
  const label = nav.querySelector('strong');
  const progress = nav.querySelector('small');
  const previous = nav.querySelector('[data-adc-direction="-1"]');
  const next = nav.querySelector('[data-adc-direction="1"]');

  window.addEventListener('message', event => {
    if (event.origin !== allowedOrigin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'amc:resize') {
      const height = Math.ceil(Number(event.data.height));
      if (Number.isFinite(height) && height >= 600 && height <= 30000) frame.height = String(height);
    }
    if (event.data?.type === 'amc:day-state') {
      label.textContent = event.data.label || 'After Dark Calendar';
      progress.textContent = event.data.progress || 'Swipe left or right';
      if (event.data.previousDay) previous.innerHTML = `<small>${event.data.previousDay.weekday}</small><span>${event.data.previousDay.date}</span>`;
      if (event.data.nextDay) next.innerHTML = `<small>${event.data.nextDay.weekday}</small><span>${event.data.nextDay.date}</span>`;
      previous.disabled = !event.data.canPrevious;
      next.disabled = !event.data.canNext;
    }
  });

  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-adc-direction]');
    if (!button || button.disabled) return;
    frame.contentWindow.postMessage({
      type: 'amc:navigate-day',
      direction: Number(button.dataset.adcDirection)
    }, allowedOrigin);
  });
})();
</script>
```

The origin and source checks are intentional: do not replace them with a wildcard (`*`).
