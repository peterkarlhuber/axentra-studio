// Applies the stored theme before first paint to avoid a light/dark flash.
// Kept as an external file so the Content-Security-Policy needs no 'unsafe-inline' scripts.
// Must stay in sync with src/lib/theme.ts (storage key and resolution rules).
(function () {
  var preference = 'system';
  try {
    preference = window.localStorage.getItem('axentra.studio.theme') || 'system';
  } catch {
    /* storage unavailable */
  }
  var dark =
    preference === 'dark' ||
    (preference !== 'light' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
