(function () {
  var root = document.getElementById('x-lyric-video-studio-sync');
  if (!root) return;
  var P = 'x-lyric-video-studio-sync';
  var hold = document.getElementById(P + '-hold');
  var play = document.getElementById(P + '-play');
  var reset = document.getElementById(P + '-reset');
  var lineEl = document.getElementById(P + '-line');
  var clockEl = document.getElementById(P + '-clock');
  var status = document.getElementById(P + '-status');
  var items = Array.prototype.slice.call(root.querySelectorAll('.' + P + '__list li'));
  var texts = items.map(function (li) { return li.querySelector('.' + P + '__text').textContent; });
  var main = hold.querySelector('.' + P + '__hold-main');
  var sub = hold.querySelector('.' + P + '__hold-sub');

  var cues, idx, t0, pressing, raf, playing, pressStart, started;

  function now() { return (performance.now() - t0) / 1000; }
  function fmt(s) {
    var m = Math.floor(s / 60), r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
  }
  function tick() {
    if (t0 != null) clockEl.textContent = fmt(now());
    if (playing) {
      var t = now(), shown = '';
      for (var i = 0; i < cues.length; i++) {
        if (t >= cues[i].start && t < cues[i].end) { shown = texts[i]; mark(i, true); } else { mark(i, false); }
      }
      lineEl.textContent = shown;
      if (t > cues[cues.length - 1].end + 0.6) { stopPlayback(); return; }
    }
    if (t0 != null && (pressing || playing)) raf = requestAnimationFrame(tick);
    else if (t0 != null && idx < texts.length) raf = requestAnimationFrame(tick);
  }
  function mark(i, on) { items[i].setAttribute('data-held', on ? '1' : '0'); }
  function setCurrent() {
    items.forEach(function (li, i) { li.setAttribute('data-on', i === idx ? '1' : '0'); });
  }
  function init() {
    cancelAnimationFrame(raf);
    cues = []; idx = 0; t0 = null; pressing = false; playing = false;
    items.forEach(function (li) {
      li.setAttribute('data-done', '0'); li.setAttribute('data-held', '0');
      li.querySelector('.' + P + '__cue').textContent = 'not synced';
    });
    setCurrent();
    lineEl.textContent = '';
    clockEl.textContent = '0:00.0';
    hold.disabled = false; hold.setAttribute('aria-pressed', 'false');
    main.textContent = 'Start sync';
    sub.textContent = 'tap once to begin';
    started = false;
    play.disabled = true; play.removeAttribute('aria-disabled');
    status.textContent = '';
    root.setAttribute('data-state', 'ready');
  }
  function down(e) {
    if (e) e.preventDefault();
    if (pressing || playing || idx >= texts.length) return;
    if (!started) {
      started = true; t0 = performance.now(); raf = requestAnimationFrame(tick);
      main.textContent = 'Press · hold · release';
      sub.textContent = 'line 1 of ' + texts.length;
      status.textContent = 'Clock running. Press when the first line starts.';
      return;
    }
    pressing = true; pressStart = now();
    hold.setAttribute('aria-pressed', 'true');
    items[idx].setAttribute('data-held', '1');
    lineEl.textContent = texts[idx];
    status.textContent = '';
    main.textContent = 'Holding';
    sub.textContent = 'release when the line ends';
    root.setAttribute('data-state', 'holding');
  }
  function up(e) {
    if (e) e.preventDefault();
    if (!pressing) return;
    pressing = false;
    var end = now();
    if (end - pressStart < 0.15) end = pressStart + 0.15;
    cues.push({ start: pressStart, end: end });
    var li = items[idx];
    li.setAttribute('data-held', '0'); li.setAttribute('data-done', '1');
    li.querySelector('.' + P + '__cue').textContent = fmt(pressStart) + ' to ' + fmt(end);
    lineEl.textContent = '';
    hold.setAttribute('aria-pressed', 'false');
    idx++;
    setCurrent();
    status.textContent = 'Line ' + idx + ' set from ' + fmt(pressStart) + ' to ' + fmt(end) + '.';
    if (idx >= texts.length) {
      hold.disabled = true;
      main.textContent = 'All lines synced';
      sub.textContent = 'play it back to check';
      play.disabled = false;
      root.setAttribute('data-state', 'done');
      status.textContent = 'All ' + texts.length + ' lines synced. The gaps between them stay blank.';
      play.focus();
    } else {
      main.textContent = 'Press · hold · release';
      sub.textContent = 'line ' + (idx + 1) + ' of ' + texts.length;
      root.setAttribute('data-state', 'ready');
    }
  }
  function startPlayback() {
    if (!cues.length || playing) return;
    playing = true; t0 = performance.now();
    play.setAttribute('aria-disabled', 'true');
    status.textContent = 'Playing back the timing you set.';
    root.setAttribute('data-state', 'playing');
    raf = requestAnimationFrame(tick);
  }
  function stopPlayback() {
    playing = false;
    lineEl.textContent = '';
    items.forEach(function (li) { li.setAttribute('data-held', '0'); });
    play.removeAttribute('aria-disabled');
    status.textContent = 'Playback finished.';
    root.setAttribute('data-state', 'done');
  }

  hold.addEventListener('pointerdown', function (e) {
    try { hold.setPointerCapture(e.pointerId); } catch (err) {}
    down(e);
  });
  hold.addEventListener('pointerup', up);
  hold.addEventListener('pointercancel', up);
  hold.addEventListener('lostpointercapture', function () { if (pressing) up(); });
  hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  hold.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e);
    else if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  });
  hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') up(e); });
  hold.addEventListener('blur', function () { if (pressing) up(); });
  play.addEventListener('click', startPlayback);
  reset.addEventListener('click', function () { init(); hold.focus(); });

  init();
})();
