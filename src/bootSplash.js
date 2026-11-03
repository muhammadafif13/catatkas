const MIN_VISIBLE_MS = 1100;
const FADE_MS = 400;

export function dismissBootSplash() {
  const splash = document.getElementById('boot-splash');
  if (!splash || splash.dataset.dismissed === 'true') return;

  splash.dataset.dismissed = 'true';

  const startedAt = Number(window.__catatkasBootStartedAt);
  const elapsed = Number.isFinite(startedAt) ? performance.now() - startedAt : MIN_VISIBLE_MS;
  const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

  window.setTimeout(() => {
    splash.classList.add('boot-splash--hidden');
    window.setTimeout(() => splash.remove(), FADE_MS);
  }, delay);
}
