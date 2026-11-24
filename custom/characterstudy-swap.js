/* CharacterStudy swap: classic script, no network, keyboard and touch. */
(function () {
  var names = { sarabun: "Sarabun", fira: "Fira Sans", afacad: "Afacad Flux" };
  document.querySelectorAll("[data-x-characterstudy-swap]").forEach(function (root) {
    var frame = root.querySelector(".x-characterstudy-swap__frame"), label = root.querySelector(".x-characterstudy-swap__name");
    var hrow = root.querySelector(".x-characterstudy-swap__row--heading"), hlock = root.querySelector(".x-characterstudy-swap__lock"), timer;
    function refuse(name) {
      clearTimeout(timer); hrow.classList.remove("is-refused"); void hrow.offsetWidth;
      hrow.classList.add("is-refused"); hlock.classList.add("is-refused");
      hlock.textContent = "Locked: Fraunces stays (" + name + " refused)";
      timer = setTimeout(function () { hrow.classList.remove("is-refused"); hlock.classList.remove("is-refused"); hlock.textContent = "Fraunces · 40px · locked"; }, 2200);
    }
    root.querySelectorAll(".x-characterstudy-swap__controls").forEach(function (group) {
      var btns = [].slice.call(group.querySelectorAll("button[data-face]")), heading = group.dataset.role === "heading";
      function focusTo(b) { btns.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; }); b.focus(); }
      function pick(b) {
        if (b.getAttribute("aria-disabled") === "true") { refuse(b.textContent.trim()); return; }
        btns.forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        if (!heading) { frame.setAttribute("data-face", b.dataset.face); label.textContent = names[b.dataset.face] + " · 16px · line height 1.5 locked"; }
      }
      btns.forEach(function (b, i) {
        b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
        b.addEventListener("click", function () { pick(b); });
        b.addEventListener("keydown", function (e) {
          var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
          if (!d) return; e.preventDefault(); var n = btns[(i + d + btns.length) % btns.length]; focusTo(n); pick(n);
        });
      });
    });
  });
})();
