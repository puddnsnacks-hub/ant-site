/* Universal hero carousel, live. Rules shown: 8-second auto-advance; a pause and play control first in focus order;
   any navigation by the reader (arrow, tab, swipe) stops rotation for good; reduced motion or a phone-width screen
   starts paused. Holds: keyboard focus on the slide's own controls (arrows, tabs) holds the timer; the pointer over
   the carousel holds only rotation the reader did not start. Focus on the Play button never holds, so an explicit
   Play always runs. Automatic rotation starts when the carousel is half in view; a Play press runs wherever the page is scrolled. No network, no storage. */
(function () {
  var DWELL = 8000;
  document.querySelectorAll("[data-x-universal-carousel]").forEach(function (root) {
    var stage = root.querySelector(".x-universal-carousel-stage");
    var slidesBox = root.querySelector("[data-x-uc-slides]");
    var slides = [].slice.call(root.querySelectorAll(".x-universal-carousel-slide"));
    var tabs = [].slice.call(root.querySelectorAll("[data-x-uc-tabs] [role=tab]"));
    var motion = root.querySelector("[data-x-uc-motion]");
    var motionText = root.querySelector("[data-x-uc-motion-text]");
    var count = root.querySelector("[data-x-uc-count]");
    var bar = root.querySelector("[data-x-uc-bar]");
    var status = root.querySelector("[data-x-uc-status]");
    var n = slides.length, cur = 0, elapsed = 0, last = 0, lastSecs = -1;
    var playing = true, userStarted = false, hover = false, ctrlFocus = false;
    var inView = !("IntersectionObserver" in window), seen = inView;

    var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    var why = "";
    if (mq("(prefers-reduced-motion: reduce)")) { playing = false; why = "Paused, because this device asks for reduced motion."; }
    else if (mq("(max-width: 639px)")) { playing = false; why = "Paused, as recommended for phones."; }

    function held() { return ctrlFocus || (hover && !userStarted); }

    function paint() {
      var secs = Math.max(0, Math.ceil((DWELL - elapsed) / 1000));
      var tail = playing ? (held() ? " · held" : (!inView && !userStarted) ? " · waiting" : " · " + secs + " s") : "";
      var txt = (cur + 1) + " of " + n + tail;
      if (count.textContent !== txt) count.textContent = txt;
      bar.style.width = (playing ? Math.min(100, elapsed / DWELL * 100) : 0) + "%";
      lastSecs = secs;
    }
    function say(t) { status.textContent = t; }

    function show(i, user) {
      i = (i + n) % n;
      if (i !== cur) {
        slides[cur].hidden = true; slides[cur].classList.remove("is-in");
        slides[i].hidden = false; void slides[i].offsetWidth; slides[i].classList.add("is-in");
      }
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
      cur = i; elapsed = 0;
      if (user && playing) stop("Stopped. You moved the carousel, so it stays where you put it.");
      paint();
    }

    function stop(msg) {
      playing = false; userStarted = false;
      root.setAttribute("data-state", "paused");
      motion.setAttribute("aria-label", "Play the slide rotation");
      motionText.textContent = "Play";
      slidesBox.setAttribute("aria-live", "polite");
      if (msg) say(msg);
      paint();
    }

    function play(byUser) {
      playing = true; userStarted = !!byUser; elapsed = 0; last = 0;
      if (byUser) seen = true;
      root.setAttribute("data-state", "playing");
      motion.setAttribute("aria-label", "Pause the slide rotation");
      motionText.textContent = "Pause";
      slidesBox.setAttribute("aria-live", "off");
      say(byUser ? "Playing. Next slide in 8 seconds." : "");
      paint();
    }

    function tick(t) {
      requestAnimationFrame(tick);
      var dt = last ? Math.min(250, t - last) : 0; last = t;
      if (!playing || (!inView && !userStarted) || held() || document.hidden) { paint(); return; }
      elapsed += dt;
      if (elapsed >= DWELL) show(cur + 1, false);
      else if (Math.ceil((DWELL - elapsed) / 1000) !== lastSecs) paint();
      else bar.style.width = Math.min(100, elapsed / DWELL * 100) + "%";
    }

    motion.addEventListener("click", function () { if (playing) stop("Paused."); else play(true); });
    root.querySelector("[data-x-uc-prev]").addEventListener("click", function () { show(cur - 1, true); });
    root.querySelector("[data-x-uc-next]").addEventListener("click", function () { show(cur + 1, true); });
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { show(k, true); });
      t.addEventListener("keydown", function (e) {
        var to = null;
        if (e.key === "ArrowRight") to = k + 1; else if (e.key === "ArrowLeft") to = k - 1;
        else if (e.key === "Home") to = 0; else if (e.key === "End") to = n - 1;
        if (to === null) return;
        e.preventDefault(); show(to, true); tabs[cur].focus();
      });
    });

    stage.addEventListener("mouseenter", function () { hover = true; paint(); });
    stage.addEventListener("mouseleave", function () { hover = false; paint(); });
    stage.addEventListener("focusin", function (e) { ctrlFocus = !motion.contains(e.target); paint(); });
    stage.addEventListener("focusout", function (e) { if (!stage.contains(e.relatedTarget)) { ctrlFocus = false; paint(); } });

    var sx = null, sy = null;
    slidesBox.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") return; sx = e.clientX; sy = e.clientY; });
    slidesBox.addEventListener("pointerup", function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = sy = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1), true);
    });
    slidesBox.addEventListener("pointercancel", function () { sx = sy = null; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          inView = en.intersectionRatio >= 0.5; paint();
          if (inView && !seen) { seen = true; if (playing) { show(0, false); elapsed = 0; } }
        });
      }, {threshold: [0, 0.5, 1]}).observe(stage);
    }

    if (playing) play(false); else stop(why);
    requestAnimationFrame(tick);
  });
})();
