/* AGID query builder stepper: the real mock frames, in the order the rail reveals them. No network. */
(function () {
  var F = [
    ["mock-start", 682, "Start.", "Three filters wait on the rail: data set, years and geography type. Run Query stays gray until there is something to run.", "Data Explorer mock, empty: a gray left rail with Data Set(s), Year(s) and Geography Type buttons and a grayed-out Run Query, beside a large intro panel."],
    ["mock-dataset", 692, "1 · Data set.", "One data set, picked from a list of radio buttons. Confirm closes the pane and leaves the choice on the rail.", "The Select a Data Sets pane open beside the rail: a list of data sets as radio buttons with State Performance Reports selected, and a Confirm button."],
    ["mock-years", 702, "2 · Years.", "Years open as a column of checkboxes. The data set already sits on the rail as a chip under a button that counts it.", "The Select Years pane: a column of year checkboxes from 2022 down to 2013. On the rail, Data Set(s) [1] with a State Performance Reports chip."],
    ["mock-geo", 738, "3 · Geography.", "Geography comes in four kinds: National, States & Territories, Tribal Organizations by Name and by State. Run Query turns blue once there is a query to run.", "The Select Geographic Area pane with four buttons: National, States and Territories, Tribal Organizations by Name, Tribal Organizations by State. The rail shows year chips 2022, 2021 and 2020 and a blue Run Query."],
    ["mock-states", 1202, "4 · States.", "States and territories open in three columns of checkboxes. Each check becomes a chip on the rail.", "A three-column list of state and territory checkboxes with Arizona, Colorado and Utah checked, next to the geographic area pane and the rail."],
    ["mock-elements", 942, "5 · Elements.", "Only now does Data Elements appear. Four buckets open into a tree with a type-to-filter box, Select All, and a count on every branch.", "The Data Elements panes: four buckets (Demographics, Services, Funding, Programs), then a searchable tree with Meals and Nutrition [0/6] expanded to Select All, Congregate Meals, Home Delivered Meals and Nutrition Education."],
    ["explorer-results", 1155, "6 · Results.", "Every choice stays on the rail as a chip under a counted button, beside the table it produced. Each filter clears on its own, and Clear All Selections resets the query.", "The finished query: chips for the data set, three years, three states and three meal services on the rail, and a sortable table of states by year on the right."]
  ];
  document.querySelectorAll("[data-x-agid-query]").forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var panel = root.querySelector('[role="tabpanel"]');
    var say = root.querySelector(".x-agid-query__say");
    var cap = root.querySelector(".x-agid-query__fig figcaption"), img = root.querySelector("img"), src = root.querySelector("source"), link = root.querySelector(".x-agid-query__frame");
    var warmed = false;
    function warm() {
      if (warmed) return; warmed = true;
      F.forEach(function (f) { var i = new Image(); i.src = "img/agid/" + f[0] + ".jpg"; });
    }
    function pick(n, focus) {
      var f = F[n];
      tabs.forEach(function (t, i) {
        var on = i === n;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", tabs[n].id);
      img.src = "img/agid/" + f[0] + ".jpg";
      img.height = f[1]; img.width = f[0] === "explorer-results" ? 1800 : 1600;
      link.setAttribute("href", "img/agid/" + f[0] + ".jpg"); link.setAttribute("data-full", "img/agid/" + f[0] + ".jpg");
      img.alt = f[4]; cap.textContent = f[2] + " " + f[3] + " Design mock.";
      src.srcset = "img/agid/" + (f[0] === "explorer-results" ? "step-results" : f[0]) + "-phone.jpg";
      say.innerHTML = "";
      var b = document.createElement("strong"); b.textContent = f[2];
      say.appendChild(b); say.appendChild(document.createTextNode(" " + f[3]));
      if (focus) tabs[n].focus();
      var strip = tabs[n].parentNode;
      if (strip.scrollWidth > strip.clientWidth) strip.scrollLeft = Math.max(0, tabs[n].offsetLeft - strip.offsetLeft - 16);
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener("click", function () { warm(); pick(i); });
      t.addEventListener("pointerenter", warm);
      t.addEventListener("keydown", function (e) {
        var cur = tabs.indexOf(document.activeElement), n = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (cur + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (cur - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = tabs.length - 1;
        if (n < 0) return;
        e.preventDefault(); warm(); pick(n, true);
      });
    });
  });
})();
