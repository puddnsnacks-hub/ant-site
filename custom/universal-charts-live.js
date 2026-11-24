(function () {
  var root = document.getElementById('x-universal-charts-live');
  if (!root) return;
  // Ride rules as written in the February 2023 high-fidelity mocks.
  var CATS = [
    { id: 'height', name: 'Height Requirements' },
    { id: 'safety', name: 'Ride Safety' },
    { id: 'mothers', name: 'Expecting Mothers' },
    { id: 'wheelchair', name: 'Wheelchair Access' },
    { id: 'dogs', name: 'Assistance Dogs' }
  ];
  var TALL = 'Guests must be at least **4 feet** tall.';
  var RANGE = 'Guests must be **3 feet - 6 feet** tall. Children between **3 feet - 4 feet** need to be accompanied.';
  var FOG = 'Ride has fog, smoke, strobes, water, soap bubbles, loud noises, pitch black, and scents.';
  var JERK = 'Ride has loud noises, jerking motions, and speed.';
  var MOM = 'Expecting mothers should **not** ride.';
  var CHAIR = 'Wheelchairs **are permitted**.';
  var DOG = 'Assistance dogs are **not permitted** and will be in the waiting area.';
  var RIDES = [
    { name: 'Harry Potter & the Forbidden Journey', d: { height: TALL, safety: FOG, mothers: MOM, wheelchair: CHAIR, dogs: DOG } },
    { name: 'Flight of the Hippogriff', d: { height: RANGE, safety: JERK, mothers: MOM, wheelchair: CHAIR, dogs: DOG } },
    { name: 'The Amazing Adventures of Spider-Man', d: { height: TALL, safety: FOG, mothers: MOM, wheelchair: CHAIR, dogs: DOG } },
    { name: 'Despicable Me: Minion Mayhem', d: { height: RANGE, safety: JERK, mothers: MOM, wheelchair: CHAIR, dogs: DOG } }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var trigger = $('x-universal-charts-trigger'), panel = $('x-universal-charts-panel');
  var all = $('x-universal-charts-all'), summary = $('x-universal-charts-summary');
  var status = $('x-universal-charts-status'), cards = $('x-universal-charts-cards');
  var table = $('x-universal-charts-table');
  var boxes = Array.prototype.slice.call(panel.querySelectorAll('input[value]'));

  function rich(el, text) {
    text.split('**').forEach(function (part, i) {
      if (!part) return;
      if (i % 2) { var b = document.createElement('strong'); b.textContent = part; el.appendChild(b); }
      else el.appendChild(document.createTextNode(part));
    });
  }
  function build() {
    var headRow = table.tHead.rows[0], body = table.tBodies[0];
    CATS.forEach(function (c) {
      var th = document.createElement('th'); th.scope = 'col'; th.dataset.cat = c.id;
      th.textContent = c.name; headRow.appendChild(th);
    });
    RIDES.forEach(function (r) {
      var tr = document.createElement('tr');
      var th = document.createElement('th'); th.scope = 'row'; th.textContent = r.name; tr.appendChild(th);
      CATS.forEach(function (c) { var td = document.createElement('td'); td.dataset.cat = c.id; rich(td, r.d[c.id]); tr.appendChild(td); });
      body.appendChild(tr);
      var card = document.createElement('article'); card.className = 'x-universal-charts-live__card';
      var h = document.createElement('h4'); h.className = 'x-universal-charts-live__ride'; h.textContent = r.name; card.appendChild(h);
      var dl = document.createElement('dl');
      CATS.forEach(function (c) {
        var row = document.createElement('div'); row.className = 'x-universal-charts-live__row'; row.dataset.cat = c.id;
        var dt = document.createElement('dt'); dt.textContent = c.name;
        var dd = document.createElement('dd'); rich(dd, r.d[c.id]);
        row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
      });
      card.appendChild(dl); cards.appendChild(card);
    });
  }
  function update() {
    var on = boxes.filter(function (b) { return b.checked; });
    var n = on.length, total = boxes.length;
    all.checked = n === total;
    all.indeterminate = n > 0 && n < total;
    summary.textContent = n === total ? 'All Categories Selected' : n === 0 ? 'Select Categories' : on.map(function (b) { return b.dataset.short; }).join(', ');
    status.textContent = n === 0 ? 'No categories selected. Pick at least one.' : 'Showing ' + n + ' of ' + total + ' categories';
    var set = {}; on.forEach(function (b) { set[b.value] = true; });
    root.querySelectorAll('.x-universal-charts-live__row').forEach(function (row) { row.hidden = !set[row.dataset.cat]; });
    table.querySelectorAll('[data-cat]').forEach(function (cell) {
      if (set[cell.dataset.cat] && n < total) cell.setAttribute('data-on', ''); else cell.removeAttribute('data-on');
    });
  }
  function open(state) {
    panel.hidden = !state;
    trigger.setAttribute('aria-expanded', state ? 'true' : 'false');
  }
  trigger.addEventListener('click', function () { open(panel.hidden); });
  $('x-universal-charts-done').addEventListener('click', function () { open(false); trigger.focus(); });
  $('x-universal-charts-reset').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = true; }); update(); });
  all.addEventListener('change', function () { var v = all.checked; boxes.forEach(function (b) { b.checked = v; }); update(); });
  boxes.forEach(function (b) { b.addEventListener('change', update); });
  function onKey(e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && !panel.hidden) { open(false); trigger.focus(); e.stopPropagation(); }
  }
  panel.addEventListener('keydown', onKey);
  trigger.addEventListener('keydown', onKey);
  var dd = root.querySelector('.x-universal-charts-live__dd');
  dd.addEventListener('focusout', function (e) {
    var to = e.relatedTarget;
    // A tap on a label can move focus to a focusable ancestor such as main; outside taps are handled by the click listener.
    if (!panel.hidden && to && !dd.contains(to) && !to.contains(dd)) open(false);
  });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !trigger.contains(e.target)) open(false);
  });
  build(); update();
})();
