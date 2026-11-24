/* Spot what is off model: four marks on a cut sheet, each shows the painting's version and the lock line. No network. */
(function () {
  var D = [
    { title: "The throat",
      cut: "The white stipple and the cream spade scales under the jaw are gone, and the throat is plain green.",
      paint: "A white stippled throat with cream spade-shaped scales along the jaw.",
      lock: "\u201cwhite stippled throat with flat cream spade-shaped scales under the jaw (scales, not teeth)\u201d" },
    { title: "The dress shape",
      cut: "A white collar, buttons and puffed sleeves with white cuffs.",
      paint: "No collar and no sleeves. Thin arms leave a plain A-line dress.",
      lock: "\u201cHot magenta-pink A-line dress\u2026\u201d, with nothing named at the neck or shoulders." },
    { title: "The hands",
      cut: "Four fingers wrap around the basket.",
      paint: "Small three-fingered hands.",
      lock: "\u201cthin green arms with small three-fingered hands\u201d" },
    { title: "The dots",
      cut: "The polka dots shrink and fade into the fabric.",
      paint: "Large, dark purple dots, evenly spaced across the dress.",
      lock: "\u201cHot magenta-pink A-line dress with large evenly spaced purple polka dots\u201d" }
  ];
  var root = document.getElementById("x-maxine-spot");
  if (!root) return;
  var marks = [].slice.call(root.querySelectorAll(".x-maxine-spot__mark"));
  function q(k) { return root.querySelector('[data-x="' + k + '"]'); }
  function pick(i, focus) {
    marks.forEach(function (m, j) { var on = j === i; m.setAttribute("aria-checked", on ? "true" : "false"); m.tabIndex = on ? 0 : -1; });
    var d = D[i];
    q("n").textContent = String(i + 1); q("title").textContent = d.title;
    q("cut").textContent = d.cut; q("paint").textContent = d.paint; q("lock").textContent = d.lock;
    if (focus) marks[i].focus();
  }
  marks.forEach(function (m, i) {
    m.addEventListener("click", function () { pick(i, false); });
    m.addEventListener("keydown", function (e) {
      var k = e.key, n = -1;
      if (k === "ArrowRight" || k === "ArrowDown") n = (i + 1) % marks.length;
      else if (k === "ArrowLeft" || k === "ArrowUp") n = (i - 1 + marks.length) % marks.length;
      else if (k === "Home") n = 0; else if (k === "End") n = marks.length - 1;
      if (n < 0) return; e.preventDefault(); pick(n, true);
    });
  });
  pick(0, false);
})();
