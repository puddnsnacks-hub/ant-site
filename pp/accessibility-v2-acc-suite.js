/* Suite behavior, from the earlier suite.js: sheets, the picture viewer, swipe strips, skill jumps (search and the old header menus left out).
   Classic script: pages open from file://, so no modules and no fetch. The search index is window.SUITE_INDEX. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); };
  var IDX = window.SUITE_INDEX || {projects: [], tag_groups: [], groups: []};
  var TAGS = {}; IDX.tag_groups.forEach(function (g) { g.tags.forEach(function (t) { TAGS[t.id] = t; }); });
  var GROUPS = {}; IDX.groups.forEach(function (g) { GROUPS[g.id] = g.name; });
  var NAVG = {}; (IDX.navgroups || []).forEach(function (g) { NAVG[g.id] = g.name; });   // S1: the Work page groups (featured, case-studies, snacks)
  var REDIR = IDX.group_redirect || {};
  var isWork = doc.body.classList.contains("s-page--work");

  /* the reader's chosen focus style (set on the accessibility page) applies on every page */
  try { var fs = localStorage.getItem("puddn-focus-style"); if (/^(periwinkle|mint|highvis)$/.test(fs || "")) root.setAttribute("data-focus-style", fs); } catch (e) {}

  /* ---------------------------------------------------------------- dialogs (sheets and viewer) */
  var opener = null;
  function openDialog(d, from) {
    if (!d) return;
    opener = from || doc.activeElement;
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else d.setAttribute("open", "");
    root.classList.add("s-noscroll");
    try { history.pushState({sheet: d.id}, ""); d.dataset.pushed = "1"; } catch (e) {}
  }
  function closeDialog(d, viaPop) {
    if (!d || !d.open) return;
    if (d.dataset.pushed && !viaPop) { try { history.back(); return; } catch (e) {} }   // popstate closes it
    delete d.dataset.pushed;
    d.close ? d.close() : d.removeAttribute("open");
  }
  $$("dialog.s-sheet, dialog.s-viewer").forEach(function (d) {
    d.addEventListener("close", function () {
      root.classList.remove("s-noscroll");
      if (d.dataset.pushed) { delete d.dataset.pushed; try { history.back(); } catch (e) {} }
      if (opener && opener.focus && doc.contains(opener)) { try { opener.focus({preventScroll: true}); } catch (e) { opener.focus(); } }
    });
    d.addEventListener("click", function (e) {
      if (e.target === d) { closeDialog(d); return; }            // the backdrop
      var c = e.target.closest("[data-close]"); if (c && d.contains(c)) { e.preventDefault(); closeDialog(d); }
    });
  });
  // keep Tab inside an open sheet or the viewer (the browser would otherwise step out to the document once per cycle)
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var d = $("dialog[open]"); if (!d) return;
    var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', d).filter(function (x) { return x.getClientRects().length; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = doc.activeElement;
    if (e.shiftKey && (a === first || !d.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !d.contains(a))) { e.preventDefault(); first.focus(); }
  });
  window.addEventListener("popstate", function () {
    $$("dialog[open]").forEach(function (d) { if (d.dataset.pushed) { delete d.dataset.pushed; d.close(); } });
    if (isWork) readURL(true);
  });
  doc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open-sheet]");
    if (b) {
      var d = doc.getElementById(b.getAttribute("data-open-sheet"));
      if (d && window.matchMedia("(max-width: 767.98px)").matches || (d && (b.tagName === "BUTTON" || b.hasAttribute("data-sheet-any")))) { e.preventDefault(); openDialog(d, b); }
      return;
    }
    var s = e.target.closest("[data-open-skills]");
    if (s) {
      e.preventDefault();
      if (isWork) {
        var box = $("#search"); if (box) { box.scrollIntoView({block: "start", behavior: reduce ? "auto" : "smooth"}); var inp = $("input", box); if (inp) inp.focus({preventScroll: true}); }
      } else {
        var sk = $("#s-skills"); renderSearch($("[data-search-root]", sk), "sheet"); openDialog(sk, s);
        setTimeout(function () { var i = $("input", sk); if (i && window.matchMedia("(min-width: 768px)").matches) i.focus(); }, 30);
      }
    }
  });
  // contents sheet: close, then go
  $$("[data-close-nav]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var id = a.getAttribute("href").slice(1), d = a.closest("dialog");
      var go = function () { var t = doc.getElementById(id); if (!t) return; markSection(t); t.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
        var h = t.querySelector("h2, h3") || t; h.setAttribute("tabindex", "-1"); h.focus({preventScroll: true}); try { history.replaceState(history.state, "", "#" + id); } catch (er) {} };
      opener = null;
      if (d && d.dataset.pushed) { delete d.dataset.pushed; d.close(); try { history.back(); } catch (er) {} setTimeout(go, 60); }
      else { if (d) d.close(); go(); }
    });
  });

  /* ---------------------------------------------------------------- in-page links scroll smoothly (CSS smooth scrolling is off so deep links land at once) */
  doc.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || a.hasAttribute("data-jump") || a.hasAttribute("data-close-nav")) return;
    var id = decodeURIComponent(a.getAttribute("href").slice(1)), t = id && doc.getElementById(id); if (!t || id === "main") return;
    e.preventDefault(); t.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
    try { history.pushState(null, "", "#" + id); } catch (er) {}
    pin(t, false);
    var h = t.matches("section") ? (t.querySelector("h2, h3") || t) : t; if (!h.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT)$/.test(h.tagName)) h.setAttribute("tabindex", "-1"); h.focus({preventScroll: true});
  });

  /* ---------------------------------------------------------------- skill chips: jump and mark */
  function markSection(t) {
    var s = t.closest(".s-sec") || t; if (!s.classList) return;
    s.classList.remove("is-marked"); void s.offsetWidth; s.classList.add("is-marked");
    setTimeout(function () { s.classList.remove("is-marked"); }, 2600);
  }
  $$("[data-jump]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1), t = doc.getElementById(id); if (!t) return;
      e.preventDefault();
      t.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
      var h = t.querySelector("h2") || t; h.setAttribute("tabindex", "-1"); h.focus({preventScroll: true});
      markSection(t);
      try { history.pushState(null, "", "#" + id); } catch (er) {}
      pin(t, false);
    });
  });
  if (location.hash) { var t0 = doc.getElementById(decodeURIComponent(location.hash.slice(1))); if (t0 && t0.classList.contains("s-sec")) setTimeout(function () { markSection(t0); }, 300); }
  // keep a deep-linked target pinned below the header while fonts and pictures settle (late layout shifts move it),
  // until the reader scrolls or presses a key, or four seconds pass
  (function () {
    if (!location.hash || isWork) return;
    var t = doc.getElementById(decodeURIComponent(location.hash.slice(1))); if (!t) return;
    pin(t, true);
  })();
  function pin(t, initial) {
    var done = false, stop = function () { done = true; };
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, stop, {once: true, passive: true}); });
    var land = function () { if (done) return; var hh = (doc.querySelector(".s-header, .sh") || {offsetHeight: 56}).offsetHeight + 24;
      if (Math.abs(t.getBoundingClientRect().top - hh) > 3) t.scrollIntoView({block: "start", behavior: "auto"}); };
    // hold until every picture above the target has loaded (10 s cap); the reader's own scroll or key cancels it
    var above = $$("img").filter(function (i) { return i.compareDocumentPosition(t) & 4; });
    above.forEach(function (i) { if (i.loading === "lazy") i.loading = "eager"; });
    var settled = function () { return above.every(function (i) { return i.complete; }); };
    if (window.ResizeObserver) { var ro = new ResizeObserver(land); ro.observe(doc.body);
      var t0 = Date.now(), check = setInterval(function () { if (done || Date.now() - t0 > 10000 || (settled() && Date.now() - t0 > 1500)) { clearInterval(check); land(); ro.disconnect(); done = true; } }, 250); }
    above.forEach(function (i) { if (!i.complete) i.addEventListener("load", land, {once: true}); });
    if (initial) { if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(land); window.addEventListener("load", land); }
    else {   // a jump inside the page: load every picture above the target now, so the page stops moving
      $$('img[loading="lazy"]').forEach(function (i) { if (i.compareDocumentPosition(t) & 4) i.loading = "eager"; });
      setTimeout(land, reduce ? 50 : 700); setTimeout(land, 1400);
    }
  }


  /* ---------------------------------------------------------------- keyboard focus never hides under the sticky header or the bottom bar
     (a focused element taller than the window gets scrolled to its bottom edge by the browser; bring its top back into view) */
  // only keyboard focus moves (Tab). A pointer click on body text focuses <main> (tabindex -1) and must never scroll.
  var viaKey = false;
  doc.addEventListener("keydown", function (e) { if (e.key === "Tab") viaKey = true; }, true);
  doc.addEventListener("pointerdown", function () { viaKey = false; }, true);
  doc.addEventListener("focusin", function (e) {
    var el = e.target; if (!viaKey) return;
    if (!el || !el.getBoundingClientRect || el === doc.body || el.id === "main" || el.getAttribute("tabindex") === "-1" || el.closest("dialog, .s-header, .sh, .s-bar")) return;
    var strip = el.closest(".s-skills__list, .s-gal__list[data-strip]");
    if (strip && strip.scrollWidth > strip.clientWidth) { var sr = strip.getBoundingClientRect(), er = el.getBoundingClientRect();
      if (er.left < sr.left + 8) strip.scrollLeft -= sr.left + 16 - er.left; else if (er.right > sr.right - 8) strip.scrollLeft += er.right - sr.right + 40; }
    var hd = doc.querySelector(".s-header, .sh"), bar = doc.querySelector(".s-bar");
    var top = hd ? hd.getBoundingClientRect().bottom : 0, bottom = innerHeight - (bar && bar.offsetParent !== null && getComputedStyle(bar).display !== "none" ? bar.offsetHeight : 0);
    var r = el.getBoundingClientRect();
    if (r.top < top + 4) window.scrollBy(0, r.top - top - 16);
    else if (r.top + Math.min(r.height, 24) > bottom) window.scrollBy(0, r.top + Math.min(r.height, 48) - bottom + 16);
  });

  /* ---------------------------------------------------------------- rail: the current section is the last one whose top has passed a line a third of the way down */
  (function () {
    var links = $$(".s-toc a[href^='#']"); if (!links.length) return;
    var pairs = links.map(function (l) { return [l, doc.getElementById(decodeURIComponent(l.getAttribute("href").slice(1)))]; }).filter(function (x) { return x[1]; });
    var raf = 0, paint = function () {
      var line = innerHeight * 0.33, cur = pairs[0];
      pairs.forEach(function (x) { if (x[1].getBoundingClientRect().top <= line) cur = x; });
      if (innerHeight + scrollY >= doc.documentElement.scrollHeight - 4) { var last = pairs[pairs.length - 1]; if (last[1].getBoundingClientRect().top < innerHeight) cur = last; }
      pairs.forEach(function (x) { if (x === cur) x[0].setAttribute("aria-current", "true"); else x[0].removeAttribute("aria-current"); });
      var id = cur[0].getAttribute("href");
      $$("#s-contents [data-close-nav]").forEach(function (a) { if (a.getAttribute("href") === id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    };
    window.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, {passive: true});
    window.addEventListener("resize", paint); paint();
  })();

  /* ---------------------------------------------------------------- picture viewer */
  var viewer = $("#s-viewer");
  if (viewer) {
    var vImg = $("img", viewer), vCap = $(".s-viewer__cap", viewer), vZoom = $("[data-viewer-zoom]", viewer), vStage = $(".s-viewer__stage", viewer);
    var setZoom = function (on) { viewer.setAttribute("data-zoomed", on ? "true" : "false"); vZoom.setAttribute("aria-pressed", on ? "true" : "false");
      $("[data-zoom-label]", vZoom).textContent = on ? "Fit to screen" : "Actual size"; };
    vZoom.addEventListener("click", function () { setZoom(viewer.getAttribute("data-zoomed") !== "true"); });
    vImg.addEventListener("dblclick", function () { setZoom(viewer.getAttribute("data-zoomed") !== "true"); });
    doc.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-viewer]"); if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var fig = a.closest("figure"), img = $("img", a);
      vImg.src = a.getAttribute("data-full"); vImg.alt = img ? img.alt : "";
      var cap = fig && fig.querySelector(":scope > figcaption");
      vCap.textContent = cap ? cap.textContent : "";
      setZoom(false); vStage.scrollTop = 0; vStage.scrollLeft = 0;
      openDialog(viewer, a);
      setTimeout(function () { $(".s-viewer__close", viewer).focus(); }, 20);
    });
  }

  /* ---------------------------------------------------------------- swipe strips: count, previous, next */
  $$(".s-gal").forEach(function (g) {
    var list = $(".s-gal__list[data-strip]", g), nav = $("[data-gal-nav]", g); if (!list || !nav) return;
    var items = $$(".s-gal__item", list), cur = $("[data-gal-cur]", nav), prev = $("[data-gal-prev]", nav), next = $("[data-gal-next]", nav);
    var index = function () { var l = list.getBoundingClientRect().left, best = 0, bd = 1e9;
      items.forEach(function (it, i) { var d = Math.abs(it.getBoundingClientRect().left - l - parseFloat(getComputedStyle(list).paddingLeft || 0)); if (d < bd) { bd = d; best = i; } });
      if (list.scrollLeft + list.clientWidth >= list.scrollWidth - 4) best = items.length - 1; return best; };
    var paint = function () { var i = index(); cur.textContent = i + 1; prev.disabled = i === 0; next.disabled = i === items.length - 1; };
    var go = function (d) { var i = Math.max(0, Math.min(items.length - 1, index() + d));
      list.scrollTo({left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduce ? "auto" : "smooth"}); };
    prev.addEventListener("click", function () { go(-1); }); next.addEventListener("click", function () { go(1); });
    list.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); go(1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } });
    var raf = 0; list.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, {passive: true});
    paint();
    if (list.hasAttribute("data-strip-phone")) {   // a tab stop only while it actually scrolls sideways
      var tab = function () { if (list.scrollWidth > list.clientWidth + 2) list.setAttribute("tabindex", "0"); else list.removeAttribute("tabindex"); paint(); };
      window.addEventListener("resize", tab); tab();
    }
  });
})();
