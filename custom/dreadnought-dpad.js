(function () {
  function init() {
    var root = document.getElementById("x-dreadnought");
    if (!root || root.getAttribute("data-ready")) return;
    root.setAttribute("data-ready", "1");

    var tabs = [
      { name: "Loadouts", slots: [
        { name: "Weapons", options: ["Particle Turrets", "None"], eq: 0 },
        { name: "Module", options: ["Siege Mode III", "Flechette Missiles III", "Anti-Missile Lasers II", "Mobile Cloak III"], eq: 1 },
        { name: "Officer", options: ["Weapons 101", "Navigation 101", "Communication 101"], eq: 0 }
      ] },
      { name: "Appearance", slots: [
        { name: "Coating", options: ["Jupiter Arms (Blue)", "None"], eq: 0 },
        { name: "Pattern", options: ["Nautilus Stripes", "Splinter Camo", "None"], eq: 0 },
        { name: "Forecastle", options: ["Selesia", "None"], eq: 0 },
        { name: "Bridge", options: ["Nox", "None"], eq: 1 }
      ] },
      { name: "Details", slots: [] }
    ];
    var st = { tab: 1, slot: 1, level: "slot", opt: 0, layout: "revised" };
    st.opt = tabs[1].slots[1].eq;

    var tabsEl = root.querySelector("#x-dreadnought-tabs");
    var grid = root.querySelector("#x-dreadnought-grid");
    var help = root.querySelector("#x-dreadnought-help");
    var log = root.querySelector("#x-dreadnought-log");
    var pad = root.querySelector("#x-dreadnought-pad");
    var lastPointer = "mouse";

    function T() { return tabs[st.tab]; }
    function S() { return T().slots[st.slot]; }

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function renderTabs() {
      tabsEl.innerHTML = "";
      tabs.forEach(function (t, i) {
        var b = el("button", "x-dreadnought__tab", t.name);
        b.type = "button";
        b.setAttribute("data-tab", i);
        b.setAttribute("aria-pressed", i === st.tab ? "true" : "false");
        tabsEl.appendChild(b);
      });
    }

    function optButton(s, si, oi, current) {
      var b = el("button", "x-dreadnought__opt");
      b.type = "button";
      b.setAttribute("data-slot", si);
      b.setAttribute("data-opt", oi);
      var eq = s.eq === oi;
      b.classList.toggle("is-equipped", eq);
      b.classList.toggle("is-current", current);
      b.setAttribute("aria-pressed", eq ? "true" : "false");
      b.setAttribute("aria-label", s.name + ", " + s.options[oi] + (eq ? ", equipped" : ""));
      b.appendChild(el("span", "x-dreadnought__name", s.options[oi]));
      if (eq) b.appendChild(el("span", "x-dreadnought__eq", "Equipped"));
      return b;
    }

    function render(focus) {
      renderTabs();
      grid.innerHTML = "";
      grid.setAttribute("aria-label", T().name + " menu, " + (st.layout === "revised" ? "revised layout" : "greybox layout"));
      var t = T();
      if (!t.slots.length) {
        grid.appendChild(el("p", "x-dreadnought__empty", "Details opens the ship's own page: its stats, ability tree and description."));
        help.textContent = "L1 and R1 move between Loadouts, Appearance and Details.";
        return;
      }
      var target = null;
      var ship = el("div", "x-dreadnought__ship");
      ship.setAttribute("aria-hidden", "true");
      ship.appendChild(el("span", "x-dreadnought__label", "Ship"));
      grid.appendChild(ship);
      if (st.layout === "revised") {
        var row = el("div", "x-dreadnought__optrow");
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", S().name + " options");
        row.classList.toggle("is-open", st.level === "option");
        row.style.setProperty("--x-dn-slot", st.slot);
        row.style.setProperty("--x-dn-n", t.slots.length);
        S().options.forEach(function (o, oi) {
          var cur = st.level === "option" && oi === st.opt;
          var b = optButton(S(), st.slot, oi, cur);
          b.tabIndex = cur ? 0 : -1;
          if (cur) target = b;
          row.appendChild(b);
        });
        grid.appendChild(row);
        var slots = el("div", "x-dreadnought__slots");
        slots.style.setProperty("--x-dn-n", t.slots.length);
        t.slots.forEach(function (s, si) {
          var b = el("button", "x-dreadnought__slot");
          b.type = "button";
          b.setAttribute("data-slot", si);
          var cur = si === st.slot;
          b.classList.toggle("is-section", cur);
          b.classList.toggle("is-current", cur && st.level === "slot");
          b.tabIndex = cur && st.level === "slot" ? 0 : -1;
          b.setAttribute("aria-label", s.name + " slot, " + s.options[s.eq] + " equipped");
          b.appendChild(el("span", "x-dreadnought__name", s.options[s.eq]));
          b.appendChild(el("span", "x-dreadnought__label", s.name));
          if (cur && st.level === "slot") target = b;
          slots.appendChild(b);
        });
        grid.appendChild(slots);
        help.textContent = "Left and right choose a slot. Up opens its options in a row above it, where left and right choose. Action equips. Back returns to the slot and keeps what was equipped.";
      } else {
        var cols = el("div", "x-dreadnought__cols");
        cols.style.setProperty("--x-dn-n", t.slots.length);
        t.slots.forEach(function (s, si) {
          var col = el("div", "x-dreadnought__col");
          col.setAttribute("role", "group");
          col.setAttribute("aria-label", s.name);
          col.classList.toggle("is-section", si === st.slot);
          s.options.forEach(function (o, oi) {
            var cur = si === st.slot && oi === st.opt;
            var b = optButton(s, si, oi, cur);
            b.tabIndex = cur ? 0 : -1;
            if (cur) target = b;
            col.appendChild(b);
          });
          col.appendChild(el("p", "x-dreadnought__label x-dreadnought__label--col", s.name));
          cols.appendChild(col);
        });
        grid.appendChild(cols);
        help.textContent = "Left and right choose a section. Up and down choose its option in a column above it. Action equips. Back returns to the equipped option.";
      }
      if (focus && target) target.focus();
      else if (target && target.parentNode.classList.contains('x-dreadnought__optrow')) {
        var r = target.parentNode;
        r.scrollLeft = Math.max(0, target.offsetLeft - (r.clientWidth - target.offsetWidth) / 2);
      }
    }

    function setMapText() {
      var p = root.querySelector('[data-cell="opt-pad"]');
      var k = root.querySelector('[data-cell="opt-key"]');
      if (st.layout === "revised") { p.textContent = "Up, then left and right"; k.textContent = "↑, then ← →, or click"; }
      else { p.textContent = "D-pad up, down"; k.textContent = "↑ ↓ keys, or click"; }
    }

    function light(row, source) {
      var rows = root.querySelectorAll(".x-dreadnought__map tbody tr");
      for (var i = 0; i < rows.length; i++) rows[i].classList.toggle("is-lit", rows[i].getAttribute("data-row") === row);
      root.setAttribute("data-source", source);
    }

    var who = { pad: "Controller", key: "Keyboard", mouse: "Mouse", touch: "Touch" };

    function run(cmd, source, focus) {
      var t = T(), row = "", msg = "";
      var n = t.slots.length;
      if (cmd === "l1" || cmd === "r1") {
        st.tab = (st.tab + (cmd === "r1" ? 1 : tabs.length - 1)) % tabs.length;
        st.slot = 0; st.level = "slot";
        st.opt = T().slots.length ? T().slots[0].eq : 0;
        row = "tabs"; msg = T().name + " menu";
      } else if (!n) {
        row = cmd === "back" ? "back" : ""; msg = "Details has no slots here (use L1 or R1)";
      } else if (st.layout === "revised") {
        if (cmd === "left" || cmd === "right") {
          var d = cmd === "right" ? 1 : -1;
          if (st.level === "slot") {
            st.slot = (st.slot + d + n) % n; st.opt = S().eq;
            row = "section"; msg = S().name + " slot";
          } else {
            var m = S().options.length;
            st.opt = (st.opt + d + m) % m;
            row = "option"; msg = S().options[st.opt] + " in the " + S().name + " row";
          }
        } else if (cmd === "up") {
          if (st.level === "slot") { st.level = "option"; st.opt = S().eq; }
          row = "option"; msg = S().name + " options open above the slot";
        } else if (cmd === "down") {
          st.level = "slot"; row = "section"; msg = "back on the " + S().name + " slot";
        } else if (cmd === "act") {
          if (st.level === "slot") { st.level = "option"; st.opt = S().eq; msg = S().name + " options open above the slot"; }
          else { S().eq = st.opt; msg = S().options[st.opt] + " equipped on " + S().name; }
          row = "act";
        } else if (cmd === "back") {
          if (st.level === "option") { st.level = "slot"; st.opt = S().eq; msg = "back to the " + S().name + " slot, " + S().options[S().eq] + " kept"; }
          else msg = "Back on a slot leaves the screen (not in this illustration)";
          row = "back";
        }
      } else {
        if (cmd === "left" || cmd === "right") {
          st.slot = (st.slot + (cmd === "right" ? 1 : n - 1)) % n; st.opt = S().eq;
          row = "section"; msg = S().name + " section";
        } else if (cmd === "up" || cmd === "down") {
          var mm = S().options.length;
          st.opt = (st.opt + (cmd === "down" ? 1 : mm - 1)) % mm;
          row = "option"; msg = S().options[st.opt] + " in the " + S().name + " column";
        } else if (cmd === "act") {
          S().eq = st.opt; row = "act"; msg = S().options[st.opt] + " equipped on " + S().name;
        } else if (cmd === "back") {
          st.opt = S().eq; row = "back"; msg = "back to the equipped " + S().options[st.opt];
        }
      }
      render(focus);
      light(row, source);
      log.textContent = who[source] + ": " + msg + ".";
    }

    var keys = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Enter: "act", " ": "act", Escape: "back", Backspace: "back" };

    grid.addEventListener("keydown", function (e) {
      var cmd = keys[e.key];
      if (!cmd) return;
      if (e.key === "Escape") e.stopPropagation();
      e.preventDefault();
      run(cmd, "key", true);
    });
    pad.addEventListener("keydown", function (e) {
      var cmd = keys[e.key];
      if (!cmd || cmd === "act" || cmd === "back") return; /* Enter and Space press the focused pad button */
      e.preventDefault();
      run(cmd, "key", false);
    });
    function noteType(e) { lastPointer = e.pointerType === "touch" || e.pointerType === "pen" ? "touch" : "mouse"; }
    root.addEventListener("pointerdown", noteType);

    grid.addEventListener("click", function (e) {
      if (e.detail === 0) return; /* keyboard activation is handled on keydown */
      var o = e.target.closest(".x-dreadnought__opt");
      var s = e.target.closest(".x-dreadnought__slot");
      if (o) {
        st.slot = +o.getAttribute("data-slot"); st.opt = +o.getAttribute("data-opt");
        st.level = "option";
        run("act", lastPointer, false);
      } else if (s) {
        var si = +s.getAttribute("data-slot");
        st.slot = si; st.level = "slot";
        run("act", lastPointer, false);
      }
    });
    tabsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]");
      if (!b) return;
      st.tab = +b.getAttribute("data-tab"); st.slot = 0; st.level = "slot";
      st.opt = T().slots.length ? T().slots[0].eq : 0;
      render(false);
      light("tabs", e.detail === 0 ? "key" : lastPointer);
      log.textContent = who[e.detail === 0 ? "key" : lastPointer] + ": " + T().name + " menu.";
    });
    pad.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cmd]");
      if (b) run(b.getAttribute("data-cmd"), "pad", false);
    });
    root.querySelector(".x-dreadnought__switch").addEventListener("click", function (e) {
      var b = e.target.closest("[data-layout]");
      if (!b) return;
      st.layout = b.getAttribute("data-layout");
      st.level = "slot"; if (T().slots.length) st.opt = S().eq;
      root.setAttribute("data-layout", st.layout);
      var segs = root.querySelectorAll(".x-dreadnought__seg");
      for (var i = 0; i < segs.length; i++) segs[i].setAttribute("aria-pressed", segs[i] === b ? "true" : "false");
      setMapText(); render(false); light("", "none");
      log.textContent = st.layout === "revised"
        ? "Revised layout: options rise in a row above the selected slot."
        : "Greybox layout: every slot stacks its options in a column.";
    });

    setMapText();
    render(false);
    light("", "none");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
