// runs before first paint so the window doesn't flash the wrong theme
(function () {
  try {
    var hint = JSON.parse(localStorage.getItem('emberwise-theme-hint') || 'null');
    var root = document.documentElement;
    var dark = hint && typeof hint.dark === 'boolean' ? hint.dark : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) root.classList.add('dark');
    if (hint && hint.accent && hint.accent !== 'ember') root.classList.add('accent-' + hint.accent);
    if (hint && hint.lang) root.lang = hint.lang;
  } catch (e) {
    /* first launch */
  }
})();
