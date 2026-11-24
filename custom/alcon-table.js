/* Alcon patient table: five real states of one component. No network. */
(function () {
  var S = [
    ["table-default", "table-default-phone", "The Planner patient table in its default state: each patient row holds two lines, OD in blue and OS in yellow, each with its own surgery date and activity link, then primary surgeon, surgery location and action icons.", "Default. One row per patient, one line per eye, so every date and action belongs to a named eye."],
    ["table-assign", "table-assign-phone", "The patient table with an Assign Surgeon picker open inline on one row: a search field above a scrolling list of surgeon names.", "Assign surgeon. Picked inside the row, with search, without leaving the list."],
    ["table-menu", "table-menu-phone", "The patient table with a menu open from the Primary Surgeon column header: Hide Column, Sort A-Z, Sort Z-A, and a searchable Filter by Surgeons checklist.", "Column menu. Hide, sort and filter live on the column they act on."],
    ["table-hidden", "table-hidden-phone", "The patient table with the Primary Surgeon column hidden, collapsed to a thin handle, and Surgery Location taking its width.", "Primary Surgeon hidden. The column collapses to a handle and Surgery Location takes its width."],
    ["table-expanded", "table-expanded-phone", "The patient table with one row expanded below it: a strip of stages from Patient Information to Post-Op and Measurements Schedule, with an OD line in blue and an OS line in yellow, each stage marked Completed or showing the plan, and an Order Measurements button on the OD line.", "Row expanded. The pipeline opens under the patient, split by eye, so each eye can sit at a different stage."]
  ];
  document.querySelectorAll("[data-x-alcon-table]").forEach(function (root) {
    var a = root.querySelector(".x-alcon-table__shot"), img = a.querySelector("img"), src2 = a.querySelector("source"), cap = root.querySelector(".x-alcon-table__cap");
    var btns = [].slice.call(root.querySelectorAll("button[data-state]"));
    function pick(b) {
      var s = S[+b.dataset.state], src = "img/alcon/" + s[0] + ".jpg";
      btns.forEach(function (x) { var on = x === b; x.setAttribute("aria-checked", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; });
      if (src2) src2.srcset = "img/alcon/" + s[1] + ".jpg";
      img.src = src; img.alt = s[2]; a.href = src; a.setAttribute("data-full", src); cap.textContent = s[3];
      try { b.scrollIntoView({ inline: "nearest", block: "nearest" }); } catch (e) {}
    }
    btns.forEach(function (b, i) {
      b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
      b.addEventListener("click", function () { pick(b); });
      b.addEventListener("keydown", function (e) {
        var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
        if (!d) return; e.preventDefault(); var n = btns[(i + d + btns.length) % btns.length]; pick(n); n.focus();
      });
    });
  });
})();
