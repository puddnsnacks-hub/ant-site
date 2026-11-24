/* How a machine reads · the six guesses. Classic script, no network. */
(function () {
  var J = [
    {t: "<code>&amp;gt;</code>", q: "Is this an arrow that broke when it was saved, or text someone meant to type?",
     a: "A broken arrow", b: "Text meant to be there",
     k: "There is no arrow left to break. A key and a colon say how the two sides relate."},
    {t: "<code>-&gt;</code>", q: "Does the arrow mean “points to”, or is it part of a name?",
     a: "“Light points to this color”", b: "Part of the color’s name",
     k: "The word <code>alias</code> says it: this name points to that color."},
    {t: "<code>·</code>", q: "Does the dot split the line into two facts, or is it part of the color?",
     a: "A divider between light and dark", b: "Part of the color",
     k: "One fact per line. Nothing has to be split."},
    {t: "<code>light</code>", q: "Is “light” a setting (light or dark mode), or a folder on the way to the color?",
     a: "The light-mode setting", b: "One folder in the path",
     k: "<code>.light</code> is part of the key, so it is the mode."},
    {t: "<code>/</code>", q: "The line splits names with slashes. The spec file uses dots. Which is real?",
     a: "Slashes", b: "Dots, as in the spec file",
     k: "Dots only, the same as the spec file."},
    {t: "<code>60</code>", q: "Is 60 a step on the color scale, or a percentage?",
     a: "Step 60 of the harbor scale", b: "60 percent, or an opacity",
     k: "60 is the last step of a path to look up, not a number to read."}
  ];
  document.querySelectorAll("[data-x-ml-read]").forEach(function (root) {
    var modes = [].slice.call(root.querySelectorAll('[role="radio"]'));
    var rows = [].slice.call(root.querySelectorAll(".x-machine-legibility-read__list button"));
    var q = function (s) { return root.querySelector(s); };
    var prose = q(".x-machine-legibility-read__src--prose"), keys = q(".x-machine-legibility-read__src--keys");
    var step = 1, mode = "prose";
    var SR = ["the escaped code &gt;", "the arrow ->", "the middle dot", "the word light", "the slashes", "the number 60"];
    rows.forEach(function (r, i) { r.querySelector(".x-ml-q").textContent = "Guess " + (i + 1) + ", trigger: " + SR[i]; });
    function render() {
      var k = mode === "keys", j = J[step - 1];
      root.setAttribute("data-mode", mode); root.setAttribute("data-step", step);
      prose.hidden = k; keys.hidden = !k;
      root.querySelectorAll(".x-machine-legibility-read__src [data-j]").forEach(function (s) { s.classList.toggle("x-ml-on", s.getAttribute("data-j").split(" ").indexOf(String(step)) > -1); });
      rows.forEach(function (r) { var on = +r.getAttribute("data-step") === step; if (on) r.setAttribute("aria-current", "step"); else r.removeAttribute("aria-current"); });
      q("[data-x-ml-count]").textContent = k ? "0" : "6";
      q("[data-x-ml-meter]").textContent = k ? "places left to guess · two lookups" : "places a machine has to guess";
      q("[data-x-ml-step]").textContent = "Guess " + step + " of 6" + (k ? " · answered" : "");
      q("[data-x-ml-trig]").innerHTML = k ? "" : "Trigger " + j.t;
      q("[data-x-ml-q]").innerHTML = k ? "Was: " + j.a.replace(/^“|”$/g, "") + ", or " + j.b.charAt(0).toLowerCase() + j.b.slice(1) + "?" : j.q;
      q("[data-x-ml-r]").innerHTML = k
        ? "<span class=\"x-ml-now\"><b>Now</b> " + j.k + (step === 6 ? " Nothing is left to guess." : "") + "</span>"
        : "<span><b>It could be</b> " + j.a + "</span><span><b>Or</b> " + j.b + "</span>";
      q("[data-x-ml-prev]").disabled = step === 1;
      var nx = q("[data-x-ml-next]");
      if (step < 6) { nx.textContent = k ? "Next answer" : "Next guess"; nx.dataset.act = "next"; }
      else if (!k) { nx.textContent = "Rewrite as keys"; nx.dataset.act = "keys"; }
      else { nx.textContent = "Back to the prose"; nx.dataset.act = "prose"; }
    }
    function setMode(m, focus) {
      mode = m;
      modes.forEach(function (b) { var on = b.dataset.mode === m; b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      render();
    }
    modes.forEach(function (b, i) {
      b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
      b.addEventListener("keydown", function (e) {
        var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
        if (!d) return; e.preventDefault(); setMode(modes[(i + d + modes.length) % modes.length].dataset.mode, true);
      });
    });
    rows.forEach(function (r) { r.addEventListener("click", function () { step = +r.getAttribute("data-step"); render(); }); });
    q("[data-x-ml-prev]").addEventListener("click", function () { if (step > 1) { step--; render(); } });
    q("[data-x-ml-next]").addEventListener("click", function () {
      var a = this.dataset.act;
      if (a === "next") { step++; render(); }
      else { step = 1; setMode(a === "keys" ? "keys" : "prose"); }
    });
    render();
  });
})();
