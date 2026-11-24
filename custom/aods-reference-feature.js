/* AODS reference feature: two radio groups (theme, view) swap real captures of the reference and carry theme and view into every link.
   Classic script, no network beyond the page's own images, keyboard and touch. */
(function () {
  var REF = "aods-reference/docs/index.html";
  var CHANGED = "aods-reference/docs/changed.html";   /* the bundle's "What changed" view: the rewritten globals, old and new */
  var NAME = { pds: "Puddn", aods: "AODS" };
  var NOW = {
    pds: "chocolate dark surfaces, teal-green accents, Fraunces figures and Afacad Flux labels.",
    aods: "navy dark surfaces, copper accents, Lato figures and Outfit labels."
  };
  var SURF = { pds: "chocolate", aods: "navy" };
  /* per view: capture file stem (desk, phone), entry hash, the quiet link, where the capture lands, and the picture */
  var VIEW = {
    dark: { desk: "dark", phone: "dark", hash: "#c-button", quiet: ["See what changes", CHANGED], at: "the dark surface",
      alt: function (t) { return "at the button entry's dark surface: every button variant inside a " + SURF[t] + " card."; },
      altp: function (t) { return "at the button entry's dark surface: the small buttons inside a " + SURF[t] + " card."; } },
    stat: { desk: "stat", phone: "stat", hash: "#c-stat", quiet: ["Stat entry"], at: "the stat entry",
      alt: function () { return "at the stat entry: three figures with units and labels, on the light ground and inside a dark card."; } },
    button: { desk: "button", phone: "button", hash: "#c-button", quiet: ["Button entry"], at: "the button entry",
      alt: function () { return "at the button entry: every button variant at three sizes, disabled and with icons, on the light ground."; },
      altp: function () { return "at the button entry: the small buttons on the light ground."; } },
    contract: { desk: "contract", phone: "button", hash: "#c-button", quiet: ["Button entry"], at: "the button entry",
      alt: function () { return "the button specimen on the light ground: six variants at three sizes, disabled and with icons."; },
      altp: function () { return "the button specimen at phone width: the small buttons on the light ground."; } }
  };

  document.querySelectorAll("[data-x-aods-reference]").forEach(function (root) {
    var state = { pick: root.getAttribute("data-pick") || "pds", view: root.getAttribute("data-view") || "dark" };
    var imgs = [].slice.call(root.querySelectorAll(".x-aods-reference__img"));
    var open = root.querySelector("[data-x-open]"), entry = root.querySelector("[data-x-entry]"), shot = root.querySelector("[data-x-shot]");
    var nowName = root.querySelector(".x-aods-reference__now-name"), nowText = root.querySelector(".x-aods-reference__now-text");
    var warmed = false, cache = {}, ticket = 0;
    /* the host page's slug (aods, work), so the reference's back link returns to it */
    var slug = (location.pathname.split("/").pop() || "").replace(/\.html?$/, "");
    var from = /^[a-z0-9-]+$/.test(slug) ? "&from=" + slug : "";

    function src(size, pick, view) { return "img/aods/ref-" + VIEW[view][size] + "-" + pick + (size === "phone" ? "-phone" : "") + ".jpg"; }
    function load(url) {   /* one decoded image per file, so a swap paints at once and the frame never collapses */
      if (!cache[url]) {
        var i = new Image(); i.decoding = "async"; i.src = url;
        cache[url] = (i.decode ? i.decode() : Promise.resolve()).then(function () { return i; }, function () { return i; });
      }
      return cache[url];
    }
    function warm() {
      if (warmed) return; warmed = true;
      var size = window.matchMedia("(max-width: 767.98px)").matches ? "phone" : "desk";
      ["pds", "aods"].forEach(function (p) { Object.keys(VIEW).forEach(function (v) { load(src(size, p, v)); }); });
    }
    function href(pick, hash) { return REF + "?theme=" + pick + from + (hash || ""); }
    function render() {
      var v = VIEW[state.view], t = state.pick, mine = ++ticket;
      root.setAttribute("data-pick", t); root.setAttribute("data-view", state.view);
      imgs.forEach(function (img) {
        var size = img.getAttribute("data-size"), url = src(size, t, state.view);
        var alt = (size === "phone" ? "The AODS reference at phone width in " : "The AODS reference in ") + NAME[t] + " " +
          ((size === "phone" && v.altp) ? v.altp(t) : v.alt(t));
        if (state.view === "contract") alt = "In " + NAME[t] + ", " + ((size === "phone" && v.altp) ? v.altp(t) : v.alt(t));
        load(url).then(function (i) {
          if (mine !== ticket) return;
          if (i.naturalWidth) { img.width = i.naturalWidth; img.height = i.naturalHeight; }
          img.src = url; img.alt = alt;
        });
      });
      nowName.textContent = NAME[t];
      nowText.textContent = NOW[t];
      open.href = href(t, v.hash);
      shot.href = href(t, v.hash);
      shot.setAttribute("aria-label", "Open the documentation in " + NAME[t] + " at " + v.at);
      entry.textContent = v.quiet[0];
      entry.href = v.quiet[1] ? v.quiet[1].replace(/(\.html)(#|$)/, "$1?theme=" + t + from + "$2") : href(t, v.hash);
    }
    function group(sel, key) {
      var btns = [].slice.call(root.querySelectorAll("button[" + sel + "]"));
      function pick(b, focus) {
        btns.forEach(function (x) { var on = x === b; x.setAttribute("aria-checked", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; });
        if (focus) b.focus();
        if (state[key] === b.getAttribute(sel)) return;
        state[key] = b.getAttribute(sel); render();
      }
      btns.forEach(function (b, i) {
        b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
        b.addEventListener("click", function () { warm(); pick(b, false); });
        b.addEventListener("pointerenter", warm);
        b.addEventListener("focus", warm);
        b.addEventListener("keydown", function (e) {
          var n = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") n = btns[(i + 1) % btns.length];
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = btns[(i - 1 + btns.length) % btns.length];
          else if (e.key === "Home") n = btns[0]; else if (e.key === "End") n = btns[btns.length - 1];
          if (n) { e.preventDefault(); pick(n, true); }
        });
      });
    }
    group("data-pick", "pick");
    group("data-view", "view");
    root.addEventListener("touchstart", warm, { passive: true });
    render();
  });
})();
