(function () {
  var root = document.querySelector('.x-verizon-levels');
  if (!root) return;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
  root.setAttribute('data-ready', '');

  function show(tab) {
    var n = tab.getAttribute('data-level');
    root.setAttribute('data-level', n);
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    var bar = tab.parentNode;
    if (bar.scrollWidth > bar.clientWidth) {
      var br = bar.getBoundingClientRect(), tr = tab.getBoundingClientRect();
      bar.scrollLeft += (tr.left - br.left) - (br.width - tr.width) / 2;
    }
  }

  // Tabs on the shell segmented control: one tab stop, arrows wrap, Home and End jump.
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); show(n); n.focus(); }
    });
  });
  // Next level: walk the sequence with one control, keep the new panel's top in view under the sticky bar.
  Array.prototype.forEach.call(root.querySelectorAll('.x-verizon-levels__next'), function (b) {
    b.addEventListener('click', function () {
      var t = tabs[parseInt(b.getAttribute('data-go'), 10) - 1];
      show(t);
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var bar = root.querySelector('.x-verizon-levels__bar');
      var limit = Math.max(bar.getBoundingClientRect().bottom, 64);
      var top = panel.getBoundingClientRect().top;
      if (top < limit || top > window.innerHeight * 0.6) {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var y = window.scrollY + root.getBoundingClientRect().top - 72;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
      var nb = panel.querySelector('.x-verizon-levels__next');
      if (nb) nb.focus({ preventScroll: true });
    });
  });
  show(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
})();
