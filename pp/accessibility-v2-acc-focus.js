/* Choose your own focus: one attribute on <html> swaps the three focus tokens for every
   control on the page, the site chrome included. Saved under puddn-focus-style. */
(function () {
  var KEY = "puddn-focus-style";
  var STYLES = ["standard", "periwinkle", "mint", "highvis"];
  var NAMES = { standard: "Standard", periwinkle: "Highlight, periwinkle", mint: "Highlight, mint", highvis: "High visibility" };
  var root = document.documentElement;

  function apply(v) {
    if (v && v !== "standard" && STYLES.indexOf(v) > -1) root.setAttribute("data-focus-style", v);
    else root.removeAttribute("data-focus-style");
  }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var saved = stored();
  if (STYLES.indexOf(saved) < 0) saved = "standard";
  apply(saved);

  function init() {
    var box = document.getElementById("x-accessibility-choices");
    if (!box) return;
    var live = document.getElementById("x-accessibility-live");
    var r = box.querySelector('input[value="' + saved + '"]');
    if (r) r.checked = true;
    box.addEventListener("change", function (e) {
      var v = e.target && e.target.value;
      if (STYLES.indexOf(v) < 0) return;
      apply(v);
      store(v);
      if (live) live.textContent = NAMES[v] + " focus ring, on every control on this page.";
    });
    var form = document.getElementById("x-accessibility-try");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = document.getElementById("x-accessibility-status");
      if (st) st.textContent = "Nothing sent. The form is here for the ring.";
    });
    box.addEventListener("focusin", function (e) {
      var card = e.target.closest && e.target.closest(".x-accessibility-choice");
      if (card) card.scrollIntoView({ block: "nearest" });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
