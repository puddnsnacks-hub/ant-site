(function () {
  var root = document.querySelector('.x-gigantic-squint');
  if (!root) return;
  var img = root.querySelector('.x-gigantic-squint__img');
  var stage = root.querySelector('.x-gigantic-squint__stage');
  var toggle = root.querySelector('#x-gigantic-squint-toggle');
  var opts = Array.prototype.slice.call(root.querySelectorAll('.x-gigantic-squint__pick [role="radio"]'));

  // Blur scales with the rendered width so the squint reads the same on a phone and a desktop.
  function setBlur() {
    var w = stage.getBoundingClientRect().width || 800;
    root.style.setProperty('--x-gigantic-blur', Math.max(4, Math.round(w / 70)) + 'px');
  }
  setBlur();
  if ('ResizeObserver' in window) { new ResizeObserver(setBlur).observe(stage); }
  else { window.addEventListener('resize', setBlur); }

  toggle.addEventListener('change', function () {
    root.setAttribute('data-squint', toggle.checked ? 'on' : 'off');
  });

  // Preload the other screens so a switch never flashes empty.
  opts.forEach(function (o) { var i = new Image(); i.src = o.getAttribute('data-src'); });

  function choose(o, focus) {
    opts.forEach(function (x) {
      var on = x === o;
      x.setAttribute('aria-checked', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
    });
    var w = o.getAttribute('data-w'), h = o.getAttribute('data-h');
    stage.style.aspectRatio = w + '/' + h;
    img.width = +w; img.height = +h;
    img.src = o.getAttribute('data-src');
    img.alt = o.getAttribute('data-alt');
    if (focus) o.focus();
  }

  opts.forEach(function (o, i) {
    o.addEventListener('click', function () { choose(o, false); });
    o.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = opts[(i + 1) % opts.length];
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = opts[(i - 1 + opts.length) % opts.length];
      else if (k === 'Home') n = opts[0];
      else if (k === 'End') n = opts[opts.length - 1];
      if (n) { e.preventDefault(); choose(n, true); }
    });
  });
})();
