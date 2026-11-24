/* The list of what isn't there: two rounds, one toggle. No network. */
(function () {
  document.querySelectorAll("[data-x-three-writers-absent]").forEach(function (root) {
    var btns = [].slice.call(root.querySelectorAll("button[data-round]"));
    function pick(r) {
      root.setAttribute("data-round", r);
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-round") === r ? "true" : "false"); });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { pick(b.getAttribute("data-round")); }); });
  });
})();
