// FastShare zero-flash first-paint theme boot script (W-018)
(function () {
  try {
    var storedTheme = localStorage.getItem('fs.theme') || 'dark';
    var effectiveTheme = storedTheme;
    if (storedTheme === 'system') {
      effectiveTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    var cachedPalette = localStorage.getItem('fs.palette');
    if (cachedPalette) {
      var vars = JSON.parse(cachedPalette);
      for (var key in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, key)) {
          document.documentElement.style.setProperty(key, vars[key]);
        }
      }
    }
  } catch (e) {
    // Ignore storage errors in private modes
  }
})();
