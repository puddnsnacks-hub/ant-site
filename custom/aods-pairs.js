/* AODS page · the six pairs: one view control per pair, kept in step, so the choice made at one pair
   holds as the reader scrolls on. The clicked control stays where it was on screen. */
(function () {
  var root = document.querySelector('.x-aods-pairs');
  if (!root) return;
  var groups = [].slice.call(root.querySelectorAll('.x-aods-view'));

  function paint(value) {
    root.setAttribute('data-x-aods-view', value);
    groups.forEach(function (g) {
      [].slice.call(g.querySelectorAll('[role="radio"]')).forEach(function (o) {
        var on = o.getAttribute('data-value') === value;
        o.setAttribute('aria-checked', String(on));
        o.tabIndex = on ? 0 : -1;
      });
    });
    try { sessionStorage.setItem('x-aods-view', value); } catch (e) {}
    scrollables();
  }

  function choose(option, focus) {
    var before = option.getBoundingClientRect().top;
    paint(option.getAttribute('data-value'));
    var after = option.getBoundingClientRect().top;
    if (Math.abs(after - before) > 1) window.scrollBy(0, after - before);
    if (focus) option.focus({ preventScroll: true });
  }

  groups.forEach(function (g) {
    var opts = [].slice.call(g.querySelectorAll('[role="radio"]'));
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

  /* a panel that scrolls takes focus so a keyboard can scroll it; one that does not stays out of the Tab order */
  function scrollables() {
    [].slice.call(root.querySelectorAll('[data-x-aods-scroll]')).forEach(function (el) {
      var s = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      if (s && el.offsetParent !== null) el.setAttribute('tabindex', '0'); else el.removeAttribute('tabindex');
      if (s && el.classList.contains('x-aods-scroll')) { el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Button variants, scrolls sideways'); }
      else if (el.classList.contains('x-aods-scroll')) { el.removeAttribute('role'); el.removeAttribute('aria-label'); }
    });
  }

  /* the phone control pins just under the site header, whatever its height */
  function pin() {
    var h = document.querySelector('.s-header');
    var top = h && getComputedStyle(h).position === 'sticky' ? h.getBoundingClientRect().height : 0;
    root.style.setProperty('--x-aods-top', Math.round(top) + 'px');
  }
  pin();

  /* pair 06: the person at the end of the line decides */
  var verdict = root.querySelector('[data-x-aods-verdict]');
  [].slice.call(root.querySelectorAll('[data-x-aods-act]')).forEach(function (b, i) {
    b.addEventListener('click', function () {
      verdict.textContent = b.getAttribute('data-x-aods-act');
      verdict.setAttribute('data-state', i === 0 ? 'approved' : 'back');
    });
  });

  var saved = null;
  try { saved = sessionStorage.getItem('x-aods-view'); } catch (e) {}
  paint(saved === 'machine' || saved === 'person' ? saved : 'both');
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { scrollables(); pin(); }, 150); });
})();
