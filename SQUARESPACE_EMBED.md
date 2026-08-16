# Squarespace embed for After Dark Calendar

The calendar sends its current document height and active mobile day to the parent page. The Squarespace Code Block must listen for those messages so the iframe grows to its full height. This removes the iframe's second vertical scrollbar and keeps a mobile day/date control sticky in the Squarespace page.

Replace the existing calendar iframe Code Block with this snippet:

```html
<div class="adc-embed" id="adc-embed">
  <nav class="adc-mobile-day-nav" aria-label="Calendar day navigation">
    <button type="button" data-adc-direction="-1" aria-label="Previous day">&lsaquo;</button>
    <span><strong>Loading calendar...</strong><small>Swipe left or right</small></span>
    <button type="button" data-adc-direction="1" aria-label="Next day">&rsaquo;</button>
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
  .adc-embed { width: 100%; }
  #adc-calendar-frame { border: 0; display: block; overflow: hidden; width: 100%; }
  .adc-mobile-day-nav { display: none; }
  @media (max-width: 600px) {
    .adc-mobile-day-nav {
      align-items: center;
      backdrop-filter: blur(14px);
      background: rgba(255,253,248,.96);
      border: 1px solid rgba(24,28,34,.2);
      border-radius: 13px;
      box-shadow: 0 8px 24px rgba(22,25,29,.14);
      box-sizing: border-box;
      display: grid;
      font-family: Manrope, Inter, system-ui, sans-serif;
      gap: 7px;
      grid-template-columns: 38px minmax(0,1fr) 38px;
      margin: 0 0 5px;
      min-height: 50px;
      padding: 5px;
      position: sticky;
      top: max(0px, env(safe-area-inset-top));
      z-index: 20;
    }
    .adc-mobile-day-nav button {
      background: #f1ece3;
      border: 1px solid rgba(24,28,34,.2);
      border-radius: 10px;
      color: #0f6f84;
      font: 1.55rem/1 system-ui, sans-serif;
      height: 38px;
    }
    .adc-mobile-day-nav button:disabled { opacity: .3; }
    .adc-mobile-day-nav span { display: grid; gap: 1px; min-width: 0; text-align: center; }
    .adc-mobile-day-nav strong { color: #16191d; font-size: .94rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .adc-mobile-day-nav small { color: #0f6f84; font-size: .6rem; font-weight: 700; text-transform: uppercase; }
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
