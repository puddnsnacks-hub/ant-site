/* The cube: press it and it turns to another of his cases, never the same twice in a row,
   walking a shuffled deck so every case comes up before any repeats. The cases are read
   from the disclosure list, so the page holds them once. Reduced motion: the face changes
   without turning. The result is announced through the polite live region. */
(function () {
  function init() {
    var btn = document.getElementById("x-accessibility-cube-btn");
    if (!btn) return;
    var cube = document.getElementById("x-accessibility-cube");
    var live = document.getElementById("x-accessibility-cube-live");
    var faces = cube.querySelectorAll(".x-accessibility-face");
    var CASES = [];
    document.querySelectorAll(".x-accessibility-lists > div").forEach(function (g) {
      var reg = g.getAttribute("data-reg");
      g.querySelectorAll("li").forEach(function (li) { CASES.push([li.textContent.trim(), reg]); });
    });
    if (!CASES.length) return;
    var first = "A cracked phone screen in direct sun";
    var last = CASES.findIndex(function (c) { return c[0] === first; });
    var deck = [];
    function refill() {
      deck = CASES.map(function (_, i) { return i; }).filter(function (i) { return i !== last; });
      for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    }
    function span(cls, text) { var s = document.createElement("span"); s.className = cls; s.textContent = text; return s; }
    function paint(face, i) {
      var c = CASES[i], label = c[1].charAt(0).toUpperCase() + c[1].slice(1);
      face.setAttribute("data-reg", c[1]);
      face.replaceChildren(span("x-accessibility-reg", label), span("x-accessibility-case", c[0]), span("x-accessibility-hint", "Press for another face of it"));
    }
    var turn = 0;
    btn.addEventListener("click", function () {
      if (!deck.length) refill();
      var i = deck.shift();
      if (i === last) { if (!deck.length) refill(); i = deck.shift(); }
      last = i; turn++;
      paint(faces[turn % 4], i);
      cube.style.setProperty("--x-accessibility-turn", (-90 * turn) + "deg");
      var c = CASES[i];
      live.textContent = c[1].charAt(0).toUpperCase() + c[1].slice(1) + ": " + c[0];
    });
  }
  /* at 600px of container and up the three lists stand open beside the cube */
  function lists() {
    var d = document.querySelector(".x-accessibility-all"), host = document.querySelector(".x-accessibility-cubebeat");
    if (!d || !host) return;
    function fit() { var wide = host.getBoundingClientRect().width >= 600; d.classList.toggle("x-accessibility-open", wide); if (wide) d.open = true; }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener("resize", fit);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); lists(); });
  else { init(); lists(); }
})();
