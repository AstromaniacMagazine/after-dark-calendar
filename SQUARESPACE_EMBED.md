# Squarespace inline installation for After Dark Calendar

Use this current installation. It renders the calendar directly in the Squarespace page, so mobile vertical scrolling is native and no cross-frame gesture forwarding is required.

Replace the entire existing iframe Code Block with:

```html
<div id="adc-inline-calendar" aria-live="polite"></div>
<script src="https://astromaniacmagazine.github.io/after-dark-calendar/assets/squarespace-inline.js?v=Beta0.9.8-20261029a"></script>
<noscript><p><a href="https://astromaniacmagazine.github.io/after-dark-calendar/">Open After Dark Calendar</a></p></noscript>
```

Do not put the new snippet inside the old `.adc-embed` wrapper. Delete the old wrapper, iframe, styles and bridge script first. After saving, the page source should contain `adc-inline-calendar` and should not contain `adc-calendar-frame`.

## Legacy iframe installation — do not use

The calendar sends its full document height, active date, theme and the in-calendar navigator position to the parent page. This removes the iframe's second vertical scrollbar. On mobile, the date rail first appears naturally below the colour guides inside the calendar; the parent copy only appears when that rail reaches the viewport top.

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
    .adc-mobile-day-nav.is-stuck {
      --adc-panel: rgba(255,253,248,.96);
      --adc-soft: #f1ece3;
      --adc-text: #16191d;
      --adc-muted: #6d747d;
      --adc-line: rgba(24,28,34,.14);
      --adc-accent: #0f6f84;
      backdrop-filter: blur(14px);
      background: var(--adc-panel);
      border: 0;
      border-radius: 0;
      box-shadow: 0 8px 24px rgba(22,25,29,.14);
      box-sizing: border-box;
      display: block;
      left: var(--adc-left, 0px);
      min-height: 62px;
      overflow: hidden;
      padding: 4px 0;
      position: fixed;
      top: max(0px, env(safe-area-inset-top));
      width: var(--adc-width, 100%);
      z-index: 2147483000;
    }
    .adc-mobile-day-nav[data-theme="dark"] { --adc-panel: rgba(17,22,29,.96); --adc-soft: #181f28; --adc-text: #f3f1eb; --adc-muted: #aeb6c1; --adc-line: rgba(232,236,242,.14); --adc-accent: #78d8ee; }
    .adc-mobile-day-nav[data-theme="red"] { --adc-panel: rgba(20,7,7,.97); --adc-soft: #210b0a; --adc-text: #ffc0b9; --adc-muted: #d88d86; --adc-line: rgba(255,123,112,.18); --adc-accent: #ff675c; }
    .adc-mobile-day-nav[data-theme="teal"] { --adc-panel: rgba(11,36,39,.97); --adc-soft: #123337; --adc-text: #edf7f3; --adc-muted: #adcbc5; --adc-line: rgba(197,239,228,.16); --adc-accent: #5ed5c7; }
    .adc-mobile-day-nav.is-today { box-shadow: 0 0 0 3px color-mix(in srgb, var(--adc-accent) 19%, transparent), 0 8px 24px rgba(22,25,29,.16); }
    .adc-mobile-day-rail { align-items: center; display: flex; gap: 4px; min-height: 54px; overflow-x: auto; overflow-y: hidden; overscroll-behavior-inline: contain; padding-inline: calc(50% - 35px); scroll-padding-inline: calc(50% - 35px); scrollbar-width: none; scroll-snap-type: x mandatory; touch-action: pan-x pan-y pinch-zoom; -webkit-overflow-scrolling: touch; }
    .adc-mobile-day-rail::-webkit-scrollbar { display: none; }
    .adc-day-chip { appearance: none; align-content: center; background: var(--adc-soft); border: 1px solid var(--adc-line); border-radius: 9px; color: var(--adc-muted); display: grid; flex: 0 0 52px; font-family: Manrope, Inter, system-ui, sans-serif; gap: 1px; height: 38px; line-height: 1; opacity: var(--adc-wheel-opacity, .62); padding: 0; scroll-snap-align: center; scroll-snap-stop: always; text-align: center; transform: translateY(var(--adc-wheel-lift, 2px)) scale(var(--adc-wheel-scale, .92)); transition: flex-basis .22s cubic-bezier(.2,.75,.2,1), height .22s cubic-bezier(.2,.75,.2,1), opacity .12s linear, transform .12s linear, border-color .18s ease, background .18s ease; }
    .adc-day-chip small { font-size: .52rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .adc-day-chip b { font-size: .74rem; font-weight: 600; white-space: nowrap; }
    .adc-day-chip.is-active { --adc-wheel-lift: 0px !important; --adc-wheel-opacity: 1 !important; --adc-wheel-scale: 1 !important; background: color-mix(in srgb, var(--adc-accent) 12%, var(--adc-panel)); border-color: color-mix(in srgb, var(--adc-accent) 64%, var(--adc-line)); color: var(--adc-text); flex-basis: 70px; height: 52px; }
    .adc-day-chip.is-active small, .adc-day-chip.is-active b { font-weight: 700; }
    .adc-day-chip.is-today { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--adc-accent) 70%, transparent); }
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
  const nav = document.querySelector('#adc-embed .adc-mobile-day-nav');
  const rail = nav?.querySelector('.adc-mobile-day-rail');
  if (!frame || !nav || !rail) return;
  const allowedOrigin = 'https://astromaniacmagazine.github.io';
  const mobile = window.matchMedia('(max-width: 600px)');
  let navTop = 0;
  let navHeight = 58;
  let syncTimer = 0;
  let settleTimer = 0;
  let parentScrollFrame = 0;
  let parentScrollDelta = 0;
  let wheelFocusKey = '';

  const hapticTick = key => {
    if (!key || key === wheelFocusKey) return;
    wheelFocusKey = key;
    try { navigator.vibrate?.(8); } catch {}
  };

  const updateWheel = userDriven => {
    const rect = rail.getBoundingClientRect();
    const centre = rect.left + rect.width / 2;
    const radius = Math.max(1, rect.width * .44);
    let closest = null;
    [...rail.querySelectorAll('.adc-day-chip')].forEach(chip => {
      const chipRect = chip.getBoundingClientRect();
      const distancePx = Math.abs(chipRect.left + chipRect.width / 2 - centre);
      const distance = Math.max(0, Math.min(1, distancePx / radius));
      chip.style.setProperty('--adc-wheel-scale', (1 - distance * .1).toFixed(3));
      chip.style.setProperty('--adc-wheel-lift', `${(distance * 3).toFixed(2)}px`);
      chip.style.setProperty('--adc-wheel-opacity', (1 - distance * .48).toFixed(3));
      if (!closest || distancePx < closest.distance) closest = { chip, distance: distancePx };
    });
    if (userDriven && closest?.chip) hapticTick(`${closest.chip.dataset.monthId}:${closest.chip.dataset.day}`);
    return closest?.chip || null;
  };

  const centreActive = smooth => {
    const active = rail.querySelector('.adc-day-chip.is-active');
    if (!active) return;
    const left = Math.max(0, Math.min(active.offsetLeft + active.offsetWidth / 2 - rail.clientWidth / 2, rail.scrollWidth - rail.clientWidth));
    window.clearTimeout(syncTimer);
    rail.dataset.syncing = 'true';
    rail.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    syncTimer = window.setTimeout(() => { delete rail.dataset.syncing; updateWheel(false); }, smooth ? 340 : 40);
  };

  const renderRail = entries => {
    rail.innerHTML = entries.map(entry => `<button class="adc-day-chip${entry.active ? ' is-active' : ''}${entry.today ? ' is-today' : ''}" type="button" role="option" aria-selected="${entry.active}" data-month-id="${entry.monthId}" data-day="${entry.day}"><small>${entry.weekday}</small><b>${entry.date}</b></button>`).join('');
    nav.classList.toggle('is-today', entries.some(entry => entry.active && entry.today));
    centreActive(false);
    window.requestAnimationFrame(() => updateWheel(false));
  };

  const updateStickyRail = () => {
    if (!mobile.matches || !navTop) { nav.classList.remove('is-stuck'); return; }
    const rect = frame.getBoundingClientRect();
    const frameTop = rect.top + window.scrollY;
    const threshold = frameTop + navTop;
    const frameBottom = frameTop + rect.height;
    const viewportTop = window.scrollY;
    const shouldStick = viewportTop >= threshold && viewportTop + navHeight < frameBottom;
    nav.style.setProperty('--adc-left', `${Math.max(0, rect.left)}px`);
    nav.style.setProperty('--adc-width', `${Math.max(0, rect.width)}px`);
    nav.classList.toggle('is-stuck', shouldStick);
  };

  const forwardParentScroll = delta => {
    parentScrollDelta += delta;
    if (parentScrollFrame) return;
    parentScrollFrame = window.requestAnimationFrame(() => {
      parentScrollFrame = 0;
      const amount = Math.max(-180, Math.min(180, parentScrollDelta));
      parentScrollDelta = 0;
      if (Math.abs(amount) >= .25) window.scrollBy(0, amount);
    });
  };

  window.addEventListener('message', event => {
    if (event.origin !== allowedOrigin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'amc:resize') {
      const height = Math.ceil(Number(event.data.height));
      if (Number.isFinite(height) && height >= 600 && height <= 30000) frame.height = String(height);
      navTop = Math.max(0, Number(event.data.navTop) || navTop);
      navHeight = Math.max(44, Number(event.data.navHeight) || navHeight);
      if (event.data.theme) nav.dataset.theme = event.data.theme;
      updateStickyRail();
    }
    if (event.data?.type === 'amc:theme-state' && event.data.theme) nav.dataset.theme = event.data.theme;
    if (event.data?.type === 'amc:day-state' && Array.isArray(event.data.dayRail)) renderRail(event.data.dayRail);
    if (event.data?.type === 'amc:scroll-parent') forwardParentScroll(Number(event.data.deltaY) || 0);
  });

  rail.addEventListener('click', event => {
    const chip = event.target.closest('.adc-day-chip');
    if (!chip) return;
    hapticTick(`${chip.dataset.monthId}:${chip.dataset.day}`);
    frame.contentWindow.postMessage({ type: 'amc:navigate-date', monthId: chip.dataset.monthId, day: Number(chip.dataset.day) }, allowedOrigin);
  });

  rail.addEventListener('scroll', () => {
    updateWheel(!rail.dataset.syncing);
    if (rail.dataset.syncing) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const closest = updateWheel(false);
      if (!closest || closest.classList.contains('is-active')) { centreActive(true); return; }
      frame.contentWindow.postMessage({ type: 'amc:navigate-date', monthId: closest.dataset.monthId, day: Number(closest.dataset.day) }, allowedOrigin);
    }, 118);
  }, { passive: true });

  window.addEventListener('scroll', updateStickyRail, { passive: true });
  window.addEventListener('resize', updateStickyRail, { passive: true });
  mobile.addEventListener?.('change', updateStickyRail);

  const announceParent = () => frame.contentWindow.postMessage({ type: 'amc:embed-ready', wrapperVersion: 'Beta0.9.5' }, allowedOrigin);
  frame.addEventListener('load', announceParent);
  announceParent();
})();
</script>
```

The origin and source checks are intentional: do not replace them with a wildcard (`*`).
