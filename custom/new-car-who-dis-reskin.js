(function () {
  var root = document.querySelector('.x-new-car-who-dis-reskin');
  if (!root) return;
  // The four accents and their names, from the style guide's "Alternate accents (tweakable)" row.
  var ACCENTS = { cobalt: ['Cobalt', '#3A5FCC'], forest: ['Forest', '#3C8268'], bronze: ['Bronze', '#9A7327'], ink: ['Ink', '#2A2A26'] };
  var readout = root.querySelector('[data-readout]');
  var readName = root.querySelector('[data-readout-name]');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var flashTimer = null;
  function flash() {
    if (reduce) return;
    root.classList.add('is-flash');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { root.classList.remove('is-flash'); }, 600);
  }
  function apply(group, value) {
    root.setAttribute('data-' + group, value);
    flash();
    if (group === 'accent') {
      readout.textContent = '--accent: ' + ACCENTS[value][1];
      readName.textContent = ACCENTS[value][0];
    }
  }

  Array.prototype.forEach.call(root.querySelectorAll('[role="radiogroup"]'), function (g) {
    var group = g.getAttribute('data-group');
    var opts = Array.prototype.slice.call(g.querySelectorAll('[role="radio"]'));
    function choose(o, focus) {
      opts.forEach(function (x) { var on = x === o; x.setAttribute('aria-checked', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
      apply(group, o.getAttribute('data-value'));
      if (focus) o.focus();
    }
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { choose(o, false); });
      o.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = opts[(i + 1) % opts.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = opts[(i - 1 + opts.length) % opts.length];
        else if (e.key === 'Home') n = opts[0];
        else if (e.key === 'End') n = opts[opts.length - 1];
        if (n) { e.preventDefault(); choose(n, true); }
      });
    });
  });
})();
