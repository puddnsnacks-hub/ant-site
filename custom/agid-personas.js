/* AGID personas: full cards open on desktop; a one-card swipe strip with a counter on phones. No network. */
(function () {
  document.querySelectorAll("[data-x-agid-personas]").forEach(function (root) {
    var track = root.querySelector(".x-agid-personas__grid");
    var cards = [].slice.call(root.querySelectorAll(".x-agid-personas__card"));
    var nav = root.querySelector(".x-agid-personas__nav");
    var prev = nav.querySelector('[data-dir="-1"]'), next = nav.querySelector('[data-dir="1"]');
    var count = nav.querySelector(".x-agid-personas__count");
    var phone = window.matchMedia("(max-width: 767px)");
    var still = window.matchMedia("(prefers-reduced-motion: reduce)");
    var cur = -1;
    function index() {
      var w = cards[0].offsetWidth + 12;
      return Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / w)));
    }
    function show() {
      var i = index(); if (i === cur) return; cur = i;
      count.textContent = (i + 1) + " of " + cards.length;
    }
    function go(d) {
      var i = (index() + d + cards.length) % cards.length;
      track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft - 2, behavior: still.matches ? "auto" : "smooth" });
    }
    function mode() {
      nav.hidden = !phone.matches;
      if (!phone.matches) cards.forEach(function (c) { c.querySelector("details").open = true; });
      cur = -1; show();
    }
    var raf = 0;
    track.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; show(); }); }, { passive: true });
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    window.addEventListener("beforeprint", function () { cards.forEach(function (c) { c.querySelector("details").open = true; }); });
    if (phone.addEventListener) phone.addEventListener("change", mode);
    root.setAttribute("data-ready", "");
    mode();
  });
})();
