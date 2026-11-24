(function () {
  var root = document.querySelector('.x-companion-sites-themes');
  if (!root) return;
  // Values copied from each site's theme file (New Orleans: theme-wsp.css plus the nola.css layer).
  var SITES = {
    mke: {
      file: 'Milwaukee theme', img: 'img/companion-sites/open-mke.jpg',
      alt: 'The Milwaukee site on a phone: The Bloody Mary bar category open on a pink band, with two cards below it in pink and green.',
      note: 'Milwaukee came first. Its values were sampled from the poster prints.',
      v: { paper: ['Cream kraft paper', '#fbf3dd'], teal: ['Deep teal ink', '#0b4a56'], gold: ['Butterscotch', '#e4b23a'], orange: ['Orange spot color', '#a2500f'], pink: ['From the prints', '#a2334f'], green: ['From the prints', '#2d5f38'] }
    },
    nola: {
      file: 'Milwaukee theme plus a New Orleans layer', img: 'img/companion-sites/open-nola.jpg',
      alt: 'The New Orleans site on a phone: The shows category open on a purple band, with black and green cards below it.',
      note: 'New Orleans kept the Milwaukee theme and moved one slot: teal became Mardi Gras purple.',
      v: { paper: ['Same as Milwaukee', '#fbf3dd'], teal: ['Mardi Gras purple', '#4a2679'], gold: ['Same as Milwaukee', '#e4b23a'], orange: ['Same as Milwaukee', '#a2500f'], pink: ['Same as Milwaukee', '#a2334f'], green: ['Same as Milwaukee', '#2d5f38'] }
    },
    esp: {
      file: 'Spain theme', img: 'img/companion-sites/open-esp.jpg',
      alt: 'The Spain site on a phone: the Madrid category open on a brick band, with blue and wine cards for food, music and art.',
      note: 'The slot names stay. The values move to Spain.',
      v: { paper: ['Lime-washed cream', '#fcf6e6'], teal: ['Mediterranean blue', '#114770'], gold: ['Saffron', '#e7ab24'], orange: ['Madrid brick', '#933f1b'], pink: ['Rioja wine', '#7c1f2b'], green: ['Basque olive', '#3e5c2a'] }
    },
    aloha: {
      file: 'Hawaii theme', img: 'img/companion-sites/open-aloha.jpg',
      alt: 'The Hawaii site on a phone: The islands category open on a lagoon band, with dark teal and jungle green cards, one per island.',
      note: 'Hawaii was built from the Spain site, with a new theme in the same slots.',
      v: { paper: ['Coconut cream', '#fcf7ea'], teal: ['Lagoon after dark', '#0a524f'], gold: ['Mai tai amber', '#e9a42a'], orange: ['Lava', '#9a3918'], pink: ['Hibiscus', '#8b1c38'], green: ['Jungle', '#2e5c25'] }
    }
  };
  var img = root.querySelector('.x-companion-sites-themes__img');
  var file = root.querySelector('[data-file]');
  var note = root.querySelector('[data-note]');
  var rows = Array.prototype.slice.call(root.querySelectorAll('tr[data-slot]'));
  var opts = Array.prototype.slice.call(root.querySelectorAll('.x-companion-sites-themes__pick [role="radio"]'));

  Object.keys(SITES).forEach(function (k) { var i = new Image(); i.src = SITES[k].img; });

  function render(k) {
    var s = SITES[k];
    root.setAttribute('data-site', k);
    img.src = s.img; img.alt = s.alt;
    file.textContent = s.file;
    note.textContent = s.note;
    rows.forEach(function (r) {
      var slot = r.getAttribute('data-slot'), val = s.v[slot];
      r.querySelector('[data-name]').textContent = val[0];
      r.querySelector('[data-hex]').textContent = val[1];
      r.querySelector('.x-companion-sites-themes__sw').style.background = val[1];
      r.classList.toggle('is-changed', k !== 'mke' && val[1] !== SITES.mke.v[slot][1]);
    });
  }

  function choose(o, focus) {
    opts.forEach(function (x) { var on = x === o; x.setAttribute('aria-checked', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
    render(o.getAttribute('data-site'));
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
  render('mke');
})();
