/* AGID heat map under eight simulated kinds of color vision: Michael's own renders from the 2024 study. No network. */
(function () {
  var D = {
    normal: ["Non-colorblind.", "Typical color vision, the map as designed."],
    protanomaly: ["Protanomaly.", "Reduced sensitivity to red."],
    deuteranomaly: ["Deuteranomaly.", "Reduced sensitivity to green."],
    protanopia: ["Protanopia.", "No sensitivity to red."],
    deuteranopia: ["Deuteranopia.", "No sensitivity to green."],
    tritanomaly: ["Tritanomaly.", "Reduced sensitivity to blue."],
    tritanopia: ["Tritanopia.", "No sensitivity to blue."],
    achromatopsia: ["Achromatopsia.", "No color at all. The eight striped steps still read by stripe density and direction, and the four solids step from light to dark."]
  };
  document.querySelectorAll("[data-x-agid-vision]").forEach(function (root) {
    var btns = [].slice.call(root.querySelectorAll('[role="radio"]'));
    var img = root.querySelector(".x-agid-vision__frame img");
    var src = root.querySelector(".x-agid-vision__frame source");
    var link = root.querySelector(".x-agid-vision__frame");
    var cap = root.querySelector(".x-agid-vision__fig figcaption");
    var phone = window.matchMedia("(max-width: 767px)");
    var now = root.querySelector(".x-agid-vision__now");
    var warmed = false;
    function warm() { if (warmed) return; warmed = true; btns.forEach(function (b) { var i = new Image(); i.src = "img/agid/heatmap-" + b.dataset.v + (phone.matches ? "-phone" : "") + ".jpg"; }); }
    function pick(b, focus) {
      var v = b.dataset.v, d = D[v];
      btns.forEach(function (x) { var on = x === b; x.setAttribute("aria-checked", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; });
      root.setAttribute("data-v", v);
      img.src = "img/agid/heatmap-" + v + ".jpg";
      src.srcset = "img/agid/heatmap-" + v + "-phone.jpg";
      var full = "img/agid/heatmap-" + v + ".jpg"; link.setAttribute("href", full); link.setAttribute("data-full", full);
      img.alt = "The same heat map of the United States simulated for " + d[0].replace(".", "").toLowerCase() + ", with its twelve-step legend from 0 to 10k and the label " + d[0].replace(".", "") + " at the lower left.";
      cap.textContent = d[0] + " " + d[1];
      now.innerHTML = ""; var s = document.createElement("strong"); s.textContent = d[0];
      now.appendChild(s); now.appendChild(document.createTextNode(" " + d[1]));
      if (focus) b.focus();
      var strip = b.parentNode;
      if (strip.scrollWidth > strip.clientWidth) strip.scrollLeft = Math.max(0, b.offsetLeft - strip.offsetLeft - 16);
    }
    btns.forEach(function (b, i) {
      b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
      b.addEventListener("pointerenter", warm);
      b.addEventListener("click", function () { warm(); pick(b); });
      b.addEventListener("keydown", function (e) {
        var n = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % btns.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + btns.length) % btns.length;
        else if (e.key === "Home") n = 0; else if (e.key === "End") n = btns.length - 1;
        if (n < 0) return; e.preventDefault(); warm(); pick(btns[n], true);
      });
    });
  });
})();
