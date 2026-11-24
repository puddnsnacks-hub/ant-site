(function () {
  var root = document.getElementById('x-universal-email-module');
  if (!root) return;
  var btns = Array.prototype.slice.call(root.querySelectorAll('[role="radio"]'));
  var cat = root.querySelector('[data-show="cat"]');
  function pick(i, focus) {
    var k = btns[i].getAttribute('data-k');
    btns.forEach(function (b, j) { b.setAttribute('aria-checked', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; });
    root.querySelectorAll('[data-k]').forEach(function (el) { if (el.tagName !== 'BUTTON') el.hidden = el.getAttribute('data-k') !== k; });
    cat.textContent = btns[i].textContent;
    if (focus) btns[i].focus();
  }
  btns.forEach(function (b, i) {
    b.addEventListener('click', function () { pick(i, false); });
    b.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % btns.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + btns.length) % btns.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = btns.length - 1;
      if (j !== null) { e.preventDefault(); pick(j, true); }
    });
  });
})();
