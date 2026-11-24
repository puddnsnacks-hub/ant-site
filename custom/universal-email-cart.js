(function () {
  var root = document.getElementById('x-universal-email-cart');
  if (!root) return;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panel = root.querySelector('[role="tabpanel"]');
  var view = root.querySelector('.x-universal-email-cart__view');

  function select(n, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-n') === n;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) { panel.setAttribute('aria-labelledby', t.id); if (focus) t.focus(); }
    });
    root.querySelectorAll('.x-universal-email-cart__view img, .x-universal-email-cart__spec > div').forEach(function (el) {
      el.hidden = el.getAttribute('data-n') !== n;
    });
    root.querySelectorAll('.x-universal-email-cart__bar').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-n') === n);
    });
    view.scrollTop = 0;
  }

  root.querySelectorAll('.x-universal-email-cart__bar').forEach(function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-n'), false); });
  });

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.getAttribute('data-n'), false); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); select(tabs[j].getAttribute('data-n'), true); }
    });
  });
})();
