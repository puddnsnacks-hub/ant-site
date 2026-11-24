(function () {
  var root = document.getElementById('x-universal-forms-address');
  if (!root) return;
  // A demo lookup: the documented example (77006) plus a few Central Florida codes.
  var ZIPS = {
    '77006': 'Houston, Texas',
    '32819': 'Orlando, Florida',
    '32801': 'Orlando, Florida',
    '34747': 'Kissimmee, Florida',
    '33602': 'Tampa, Florida'
  };
  var $ = function (id) { return document.getElementById(id); };
  var street = $('x-universal-forms-street'), zip = $('x-universal-forms-zip');
  var cityField = $('x-universal-forms-city-field'), city = $('x-universal-forms-city'), cityHelp = $('x-universal-forms-city-help');
  var aptToggle = $('x-universal-forms-apt-toggle'), aptField = $('x-universal-forms-apt-field');
  var same = $('x-universal-forms-same'), billing = $('x-universal-forms-billing');
  var bZip = $('x-universal-forms-b-zip');
  var count = $('x-universal-forms-count'), countLabel = $('x-universal-forms-count-label');
  var inlineNum = root.querySelector('.x-universal-forms-address__inline-num');
  var lastZip = '';

  function digits(el) {
    var v = el.value.replace(/\D/g, '').slice(0, 5);
    if (v !== el.value) el.value = v;
  }
  function visibleInputs() {
    var n = 0;
    root.querySelectorAll('input.aods-input').forEach(function (el) {
      if (!el.closest('[hidden]')) n++;
    });
    return n;
  }
  function update() {
    var ready = street.value.trim().length > 0 && zip.value.length === 5;
    var appearing = ready && cityField.hidden;
    cityField.hidden = !ready;
    if (ready && zip.value !== lastZip) {
      var hit = ZIPS[zip.value];
      city.value = hit || '';
      cityHelp.textContent = hit ? 'City and state filled from the zip code: ' + hit + '.' : 'This demo knows only a few zip codes. Type the city and state.';
    }
    if (appearing && cityField.scrollIntoView) {
      try { cityField.scrollIntoView({ block: 'nearest' }); } catch (e) { cityField.scrollIntoView(false); }
    }
    lastZip = ready ? zip.value : '';
    billing.hidden = same.checked;
    var n = visibleInputs();
    if (count) count.textContent = String(n);
    if (inlineNum) inlineNum.textContent = String(n);
    if (countLabel) countLabel.textContent = n === 1 ? 'input on screen' : 'inputs on screen';
  }
  zip.addEventListener('input', function () { digits(zip); update(); });
  bZip.addEventListener('input', function () { digits(bZip); });
  street.addEventListener('input', update);
  same.addEventListener('change', update);
  aptToggle.addEventListener('click', function () {
    var open = aptField.hidden;
    aptField.hidden = !open;
    aptToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    aptToggle.hidden = open;
    if (open) $('x-universal-forms-apt').focus();
    update();
  });
  update();
})();
