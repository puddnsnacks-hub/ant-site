/* SnacksPath: the unit anatomy as tabs. No network, keyboard and touch. */
(function () {
  document.querySelectorAll("[data-x-snackspath-anat]").forEach(function (root) {
    var panel = root.querySelector('[role="tabpanel"]'), tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var nameEl = panel.querySelector("[data-name]"), forEl = panel.querySelector("[data-for-text]"), exEl = panel.querySelector("[data-ex-text]");
    function pick(t) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; });
      nameEl.textContent = t.textContent; forEl.textContent = t.getAttribute("data-for"); exEl.textContent = t.getAttribute("data-ex");
      panel.setAttribute("aria-labelledby", t.id);
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
      t.addEventListener("click", function () { pick(t); });
      t.addEventListener("keydown", function (e) {
        var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0, n = null;
        if (e.key === "Home") n = tabs[0]; else if (e.key === "End") n = tabs[tabs.length - 1]; else if (d) n = tabs[(i + d + tabs.length) % tabs.length];
        if (!n) return; e.preventDefault(); pick(n); n.focus();
      });
    });
  });
})();
