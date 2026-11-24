/* Suite behavior: sheets, the picture viewer, swipe strips, skill jumps, and the skill search.
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
    var land = function () { if (done) return; var hh = (doc.querySelector(".s-header") || {offsetHeight: 56}).offsetHeight + 24;
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
    if (!el || !el.getBoundingClientRect || el === doc.body || el.id === "main" || el.getAttribute("tabindex") === "-1" || el.closest("dialog, .s-header, .s-bar")) return;
    var strip = el.closest(".s-skills__list, .s-gal__list[data-strip]");
    if (strip && strip.scrollWidth > strip.clientWidth) { var sr = strip.getBoundingClientRect(), er = el.getBoundingClientRect();
      if (er.left < sr.left + 8) strip.scrollLeft -= sr.left + 16 - er.left; else if (er.right > sr.right - 8) strip.scrollLeft += er.right - sr.right + 40; }
    var hd = doc.querySelector(".s-header"), bar = doc.querySelector(".s-bar");
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

  /* ---------------------------------------------------------------- search */
  var state = {tags: [], q: "", group: "", any: false};
  function norm(s) { return String(s || "").toLowerCase().replace(/[‘’']/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function qWords(q) { return norm(q).split(" ").filter(function (w) { return w.length > 1; }); }
  function hit(text, w) { return (" " + norm(text) + " ").indexOf(" " + w) !== -1; }
  /* recruiter words -> skill ids (a word may also match page text directly) */
  var SYN = {
    a11y: ["accessibility"], accessible: ["accessibility"], accessibility: ["accessibility"], acessibility: ["accessibility"], accesibility: ["accessibility"], wcag: ["accessibility"], ada: ["accessibility"],
    viz: ["data-visualization", "complex-data"], dataviz: ["data-visualization", "complex-data"], chart: ["data-visualization"], charts: ["data-visualization"], graph: ["data-visualization"], graphs: ["data-visualization"],
    dashboard: ["data-visualization", "complex-data"], dashboards: ["data-visualization", "complex-data"], analytics: ["complex-data", "data-visualization"],
    colorblind: ["color-vision"], colourblind: ["color-vision"], colorblindness: ["color-vision"], daltonism: ["color-vision"],
    game: ["game-ui"], games: ["game-ui"], gaming: ["game-ui"], hud: ["game-ui"],
    llm: ["ai-build-agents", "ai-product-ux"], llms: ["ai-build-agents", "ai-product-ux"], genai: ["ai-build-agents", "ai-product-ux"], agentic: ["ai-build-agents"], agent: ["ai-build-agents"], agents: ["ai-build-agents"], ai: ["ai-build-agents", "ai-product-ux", "ai-fluency"],
    eval: ["evals-and-gates"], evals: ["evals-and-gates"], evaluation: ["evals-and-gates"], evaluations: ["evals-and-gates"], qa: ["evals-and-gates"], lint: ["evals-and-gates"],
    handoff: ["cross-functional"], dev: ["cross-functional"], developer: ["cross-functional"], developers: ["cross-functional"], engineering: ["cross-functional"], engineers: ["cross-functional"], crossfunctional: ["cross-functional"], collaboration: ["cross-functional"],
    figma: ["figma-to-code", "design-tokens"], tokens: ["design-tokens"], token: ["design-tokens"], variables: ["design-tokens"],
    research: ["user-research"], interviews: ["user-research"], personas: ["user-research"], testing: ["usability-testing"], usability: ["usability-testing"], test: ["usability-testing"],
    metrics: ["measured-outcomes"], kpi: ["measured-outcomes"], kpis: ["measured-outcomes"], outcomes: ["measured-outcomes"], results: ["measured-outcomes"], impact: ["measured-outcomes"],
    saas: ["enterprise-b2b"], b2b: ["enterprise-b2b"], enterprise: ["enterprise-b2b"],
    template: ["templates"], templates: ["templates"],
    spec: ["agent-readable-specs", "documentation"], specs: ["agent-readable-specs", "documentation"], specifications: ["agent-readable-specs", "documentation"], docs: ["documentation"], documentation: ["documentation", "agent-readable-specs"],
    workshop: ["ai-fluency"], workshops: ["ai-fluency"], training: ["ai-fluency"], enablement: ["ai-fluency"], teaching: ["ai-fluency"],
    prototype: ["prototyping-in-code"], prototypes: ["prototyping-in-code"], prototyping: ["prototyping-in-code"],
    ia: ["information-architecture"], navigation: ["information-architecture"], taxonomy: ["information-architecture"],
    ios: ["mobile"], android: ["mobile"], phone: ["mobile"], app: ["mobile"], responsive: ["responsive-web"],
    form: ["forms"], forms: ["forms"], email: ["email-lifecycle"], emails: ["email-lifecycle"], crm: ["email-lifecycle"],
    brand: ["brand-systems"], branding: ["brand-systems"], typography: ["typography"], type: ["typography"], fonts: ["typography"], font: ["typography"],
    components: ["component-architecture"], component: ["component-architecture"], theming: ["theming"], themes: ["theming"], governance: ["governance"], adoption: ["governance"],
    illustration: ["illustration"], art: ["ai-art-direction", "illustration"], tools: ["internal-tools"], tooling: ["internal-tools"]
  };
  /* the curator's list (qa/suite/CURATOR.md): single words join SYN, phrases match before single words */
  var MORE = {
    "design system": ["design-systems"], "design systems": ["design-systems"], "ds": ["design-systems"], "foundations": ["design-systems"], "component library": ["design-systems", "component-architecture"],
    "design to code": ["figma-to-code"], "dev mode": ["figma-to-code"], "code connect": ["figma-to-code"], "figma": ["figma-to-code", "design-tokens"],
    "html": ["prototyping-in-code"], "css": ["prototyping-in-code"], "front end": ["prototyping-in-code"], "frontend": ["prototyping-in-code"], "vibe coding": ["prototyping-in-code"], "coded prototype": ["prototyping-in-code"],
    "machine readable": ["agent-readable-specs"], "ai ready": ["agent-readable-specs"], "heuristics": ["agent-readable-specs"], "principles": ["agent-readable-specs"], "guidance": ["agent-readable-specs"], "metadata": ["agent-readable-specs"],
    "guardrails": ["evals-and-gates"], "drift": ["evals-and-gates"], "review agents": ["evals-and-gates"], "quality bar": ["evals-and-gates"], "gates": ["evals-and-gates"],
    "delegation": ["ai-product-ux"], "delegate": ["ai-product-ux"], "supervision": ["ai-product-ux"], "supervise": ["ai-product-ux"], "trust": ["ai-product-ux"], "human in the loop": ["ai-product-ux"], "uncertainty": ["ai-product-ux"], "agent ux": ["ai-product-ux"], "agentic ux": ["ai-product-ux"],
    "internal": ["internal-tools"], "admin": ["internal-tools"], "back office": ["internal-tools"], "operations": ["internal-tools"],
    "ship": ["shipped-end-to-end"], "shipped": ["shipped-end-to-end"], "launch": ["shipped-end-to-end"], "launched": ["shipped-end-to-end"], "end to end": ["shipped-end-to-end"], "zero to one": ["shipped-end-to-end"],
    "skills": ["ai-fluency"], "course": ["ai-fluency"], "certification": ["ai-fluency"], "upskilling": ["ai-fluency"],
    "prompt": ["ai-art-direction"], "prompting": ["ai-art-direction"], "image generation": ["ai-art-direction"], "character sheet": ["ai-art-direction"],
    "character": ["illustration"], "concept art": ["illustration"],
    "user testing": ["usability-testing"], "usertesting": ["usability-testing"], "moderated": ["usability-testing"], "unmoderated": ["usability-testing"], "think aloud": ["usability-testing"], "usability test": ["usability-testing"], "usability testing": ["usability-testing"],
    "discovery": ["user-research"], "ux research": ["user-research"], "user research": ["user-research"], "customer research": ["user-research"], "customer calls": ["user-research"],
    "measurement": ["measured-outcomes"], "data informed": ["measured-outcomes"], "instrument": ["measured-outcomes"], "instrumented": ["measured-outcomes"], "conversion": ["measured-outcomes"],
    "section 508": ["accessibility"], "508": ["accessibility"], "screen reader": ["accessibility"], "keyboard": ["accessibility"], "focus": ["accessibility"], "contrast": ["accessibility", "color-vision"],
    "color blind": ["color-vision"], "color blindness": ["color-vision"], "cvd": ["color-vision"],
    "dense": ["complex-data"], "density": ["complex-data"], "data dense": ["complex-data"], "data heavy": ["complex-data"], "maps": ["complex-data"], "map": ["complex-data"], "geospatial": ["complex-data"],
    "visualization": ["data-visualization"], "visualisation": ["data-visualization"], "heat map": ["data-visualization"], "heatmap": ["data-visualization"], "data viz": ["data-visualization", "complex-data"], "data visualization": ["data-visualization"],
    "clinical": ["enterprise-b2b"], "healthcare": ["enterprise-b2b"], "b2b saas": ["enterprise-b2b"], "internal enterprise": ["enterprise-b2b"],
    "checkout": ["forms"], "validation": ["forms"], "input": ["forms"], "inputs": ["forms"], "multi step": ["forms"],
    "lifecycle": ["email-lifecycle"], "growth": ["email-lifecycle"], "newsletter": ["email-lifecycle"], "newsletters": ["email-lifecycle"], "landing page": ["email-lifecycle", "templates"], "landing pages": ["email-lifecycle", "templates"], "modals": ["email-lifecycle"],
    "style guide": ["brand-systems"], "brand guidelines": ["brand-systems"], "guidelines": ["brand-systems"],
    "typeface": ["typography"], "type system": ["typography"], "type scale": ["typography"],
    "variants": ["component-architecture"], "props": ["component-architecture"], "component api": ["component-architecture"], "api design": ["component-architecture"],
    "dark mode": ["theming"], "white label": ["theming"], "multi brand": ["theming"], "reskin": ["theming"],
    "deprecation": ["governance"], "contribution": ["governance"], "contributing": ["governance"],
    "motion": ["interaction-design"], "animation": ["interaction-design"], "micro interactions": ["interaction-design"], "microinteractions": ["interaction-design"],
    "console": ["game-ui"], "xbox": ["game-ui"], "playstation": ["game-ui"], "controller": ["game-ui"], "menus": ["game-ui"],
    "breakpoints": ["responsive-web"], "adaptive": ["responsive-web"],
    "native": ["mobile"], "iphone": ["mobile"], "touch": ["mobile"],
    "stakeholders": ["cross-functional"], "stakeholder": ["cross-functional"], "partners": ["cross-functional"], "cross functional": ["cross-functional"],
    "self serve": ["templates"]
  };
  Object.keys(MORE).forEach(function (k) { var n = norm(k); SYN[n] = MORE[k].concat((SYN[n] || []).filter(function (x) { return MORE[k].indexOf(x) === -1; })); });
  var PHRASES = Object.keys(SYN).filter(function (k) { return k.indexOf(" ") !== -1; }).sort(function (a, b) { return b.length - a.length; });
  /* a query becomes terms: known phrases first (longest wins), then single words */
  function qTerms(q) {
    var t = " " + norm(q) + " ", terms = [];
    PHRASES.forEach(function (ph) { var i = t.indexOf(" " + ph + " "); if (i !== -1) { terms.push(ph); t = t.slice(0, i) + " " + t.slice(i + ph.length + 1); } });
    t.trim().split(/\s+/).forEach(function (w) { if (w.length > 1 || /\d/.test(w)) terms.push(w); });
    return terms.filter(function (x) { return x; });
  }
  function termTags(w) {   // [synonym ids (ranked), exact tag-name ids, ids whose name merely contains the word]
    var syn = (SYN[w] || []).slice(), exact = [], loose = [];
    Object.keys(TAGS).forEach(function (id) {
      var n = norm(TAGS[id].name), i2 = id.replace(/-/g, " ");
      if (n === w || i2 === w || n.replace(/\s*\(.*$/, "") === w) exact.push(id);
      else if (hit(n + " " + i2, w) && syn.indexOf(id) === -1) loose.push(id);
    });
    return {syn: syn, exact: exact, loose: loose};
  }

  function search(st) {
    var terms = qTerms(st.q), out = [], any = !!st.any;
    if (st.q && !terms.length) return [];                            // a query with no searchable words matches nothing
    var tt = terms.map(function (w) { return {w: w, t: termTags(w)}; });
    IDX.projects.forEach(function (p) {
      if (st.group && p.nav !== st.group) return;
      var rows = p.tags.map(function (t, i) { return {id: t.id, anchor: t.anchor, evidence: t.evidence, weight: t.weight || 2, i: i, name: (TAGS[t.id] || {}).name || t.id}; });
      var tagHits = rows.filter(function (r) { return st.tags.indexOf(r.id) !== -1; });
      if (st.tags.length) {
        if (any ? !tagHits.length : tagHits.length < st.tags.length) return;
      }
      var qRows = [], ok = true, qScore = 0, best = null;
      tt.forEach(function (x) {
        var w = x.w, T = x.t, ranked = [];
        rows.forEach(function (r) {
          var si = T.syn.indexOf(r.id), rank = T.exact.indexOf(r.id) !== -1 ? 0 : (si !== -1 ? 1 : (T.loose.indexOf(r.id) !== -1 ? 2 : (hit(r.evidence, w) ? 3 : -1)));
          if (rank === -1) return;
          ranked.push({r: r, rank: rank, si: si === -1 ? 9 : si});
        });
        var pj = hit(p.name + " " + p.title + " " + p.deck + " " + (GROUPS[p.group] || ""), w);
        if (!ranked.length && !pj) { ok = false; return; }
        ranked.sort(function (a, b) { return a.rank - b.rank || b.r.weight - a.r.weight || a.si - b.si || a.r.i - b.r.i; });
        if (ranked.length) {
          var b0 = ranked[0];
          qScore += (4 - b0.rank) * 10 + b0.r.weight * 3 - b0.si + Math.min(ranked.length - 1, 3);
          if (!best || b0.rank < best.rank || (b0.rank === best.rank && b0.r.weight > best.r.weight)) best = b0;
        } else qScore += 4;
        ranked.forEach(function (o) { if (qRows.indexOf(o.r) === -1) qRows.push(o.r); });
      });
      if (!ok) return;
      var shown = [], seen = {};
      tagHits.slice().sort(function (a, b) { return b.weight - a.weight || a.i - b.i; }).concat(qRows).forEach(function (r) { if (!seen[r.id]) { seen[r.id] = 1; r.hit = true; shown.push(r); } });
      if (!shown.length) shown = rows.slice(0, 3);
      var tScore = tagHits.length * 100 + tagHits.reduce(function (s, r) { return s + r.weight; }, 0);
      var top = st.tags.length === 1 && tagHits.length === 1 && !terms.length ? tagHits[0].weight : (!st.tags.length && terms.length === 1 && best && best.rank <= 1 ? best.r.weight : 0);
      out.push({p: p, rows: shown, score: tScore + qScore, top: top});
    });
    if (st.tags.length || terms.length) out.sort(function (a, b) { return b.score - a.score || a.p.n - b.p.n; });
    return out;
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var d = [], i, j; for (i = 0; i <= a.length; i++) { d[i] = [i]; } for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function nearest(q) {
    var ws = qWords(q), score = {};
    ws.forEach(function (w) {
      var cand = {};
      Object.keys(SYN).forEach(function (k) { var dd = lev(w, k); if (dd <= (w.length > 5 ? 2 : 1)) SYN[k].forEach(function (id) { cand[id] = Math.min(cand[id] == null ? 9 : cand[id], dd); }); });
      Object.keys(TAGS).forEach(function (id) { norm(TAGS[id].name + " " + id.replace(/-/g, " ")).split(" ").forEach(function (tw) {
        if (tw.length < 3) return; var dd = lev(w, tw); if (dd <= (w.length > 5 ? 2 : 1)) cand[id] = Math.min(cand[id] == null ? 9 : cand[id], dd); }); });
      Object.keys(cand).forEach(function (id) { score[id] = Math.min(score[id] == null ? 9 : score[id], cand[id]); });
    });
    return Object.keys(score).filter(function (id) { return TAGS[id]; }).sort(function (a, b) { return score[a] - score[b] || TAGS[b].count - TAGS[a].count; }).slice(0, 5).map(function (id) { return TAGS[id]; });
  }
  function nProj(n) { return n + (n === 1 ? " project" : " projects"); }

  function resultHTML(r, mode, first) {
    var p = r.p, media = "";
    if (mode === "page") media = '<div class="s-res__media" data-frame="' + esc(p.frame) + '">' + (p.thumb ? '<img src="' + esc(p.thumb) + '" alt="" loading="lazy"' + (p.tw ? ' width="' + p.tw + '" height="' + p.th + '"' : "") + ">" : "") + "</div>";
    var ev = r.rows.map(function (x) {
      return '<li><a class="s-ev__link' + (x.hit ? " is-hit" : "") + '" href="' + esc(p.slug) + ".html#" + esc(x.anchor) + '"><span class="s-ev__tag">' + esc(x.name) +
        '</span><span class="s-ev__text">' + esc(x.evidence) + '</span><svg class="aods-icon s-ev__go" data-size="sm" aria-hidden="true"><use href="#pds-arrow-right"></use></svg></a></li>';
    }).join("");
    var strong = first && r.top === 3 ? '<p class="s-res__strong">Strongest evidence</p>' : "";
    return '<li class="s-res">' + media + '<div class="s-res__body">' + strong + '<p class="s-res__group">' + esc(GROUPS[p.group] || "") + '</p><h3 class="s-res__title"><a href="' + esc(p.slug) + '.html">' + esc(p.name) +
      '</a></h3>' + (p.deck ? '<p class="s-res__deck">' + esc(p.deck) + "</p>" : "") + (ev ? '<ul class="s-ev" aria-label="Evidence on the page">' + ev + "</ul>" : "") + "</div></li>";
  }
  /* the main exhibit (the live AODS reference) leads the results for words about references, docs, tokens and themes */
  function featureHTML(st, mode) {
    var F = IDX.feature; if (!F || !st.q || st.tags.length || st.group) return "";
    var terms = qTerms(st.q); if (!terms.length || !terms.some(function (t) { return F.words.indexOf(t) !== -1; })) return "";
    var pre = location.pathname.indexOf("/aods-reference/") !== -1 ? "../../" : "";
    var media = mode === "page" ? '<div class="s-res__media" data-frame="browser">' + (F.thumb ? '<img src="' + esc(F.thumb) + '" alt="" loading="lazy" width="' + F.tw + '" height="' + F.th + '">' : "") + "</div>" : "";
    return '<li class="s-res s-res--feature">' + media + '<div class="s-res__body"><p class="s-res__strong">The main exhibit</p><p class="s-res__group">Design Systems</p>' +
      '<h3 class="s-res__title"><a href="' + esc(F.href) + '">' + esc(F.title) + '</a></h3><p class="s-res__deck">' + esc(F.deck) + '</p>' +
      '<ul class="s-ev"><li><a class="s-ev__link is-hit" href="' + esc(F.href) + '"><span class="s-ev__tag">Live reference</span><span class="s-ev__text">Open it in Puddn, switch to AODS</span><svg class="aods-icon s-ev__go" data-size="sm" aria-hidden="true"><use href="#pds-arrow-right"></use></svg></a></li>' +
      '<li><a class="s-ev__link" href="' + esc(F.case) + '"><span class="s-ev__tag">Case study</span><span class="s-ev__text">How one record serves two readers</span><svg class="aods-icon s-ev__go" data-size="sm" aria-hidden="true"><use href="#pds-arrow-right"></use></svg></a></li></ul></div></li>';
  }
  function chipHTML(t) {
    return '<li><button class="s-tchip" type="button" aria-pressed="false" data-tag="' + esc(t.id) + '">' + esc(t.name) +
      '<span class="s-tchip__n"><span class="aods-sr-only">, </span>' + t.count + '<span class="aods-sr-only"> ' + (t.count === 1 ? "project" : "projects") + '</span></span></button></li>';
  }

  function renderSearch(box, mode) {
    if (!box || box.dataset.ready) return box && box._paint;
    box.dataset.ready = "1";
    var uid = mode === "page" ? "wq" : "sq", nTags = Object.keys(TAGS).length;
    var chips = IDX.tag_groups.map(function (g) {
      return '<div class="s-search__tg"><p class="s-search__tgname" id="' + uid + "-g-" + g.id + '">' + esc(g.name) + '</p><ul class="s-search__chips" aria-labelledby="' + uid + "-g-" + g.id + '">' +
        g.tags.map(chipHTML).join("") + "</ul></div>";
    }).join("");
    var quick = (box.getAttribute("data-quick") || "").split(" ").filter(function (id) { return TAGS[id]; });
    var phone = window.matchMedia("(max-width: 599.98px)").matches;
    box.innerHTML =
      '<div class="s-search" role="search" aria-label="Skills">' +
      '<label class="aods-sr-only" for="' + uid + '">Search projects by skill or word</label>' +
      '<div class="s-search__field"><input class="aods-input" id="' + uid + '" type="search" autocomplete="off" spellcheck="false" placeholder="' + (phone ? "Try: tokens, research" : "Try: tokens, research, accessibility") + '">' +
      '<button class="s-search__clear" type="button" hidden aria-label="Clear search"><svg class="aods-icon" aria-hidden="true"><use href="#pds-close"></use></svg></button>' +
      '<span class="s-search__go" aria-hidden="true"><svg class="aods-icon"><use href="#pds-search"></use></svg></span></div>' +
      (quick.length ? '<ul class="s-search__chips s-search__quick" aria-label="Popular skills">' + quick.map(function (id) { return chipHTML(TAGS[id]); }).join("") + "</ul>" +
        '<p class="s-scrolls-cue s-search__quickcue" aria-hidden="true">Scroll sideways for more skills</p>' : "") +
      '<p class="s-search__status" role="status" aria-live="polite"></p>' +
      (mode === "sheet" ? '<ul class="s-results" data-out></ul><div class="s-search__tags">' + chips + "</div>" : "") + "</div>";
    var out = mode === "sheet" ? $("[data-out]", box) : $("#results");
    var browse = null;
    if (mode === "page") {     // the full list sits after the results, closed at every width
      browse = doc.createElement("details"); browse.className = "s-search__browse";
      browse.innerHTML = '<summary class="s-search__browsesum">All ' + nTags + ' skills</summary><div class="s-search__tags">' + chips + "</div>";
      out.parentNode.insertBefore(browse, out.nextSibling);
    }
    var scope = mode === "page" ? box.parentNode : box;
    var input = $("input", box), clear = $(".s-search__clear", box), status = $(".s-search__status", box);
    var st = mode === "sheet" ? {tags: [], q: "", group: "", any: false} : state;
    var timer = 0;
    function showResults(smooth) {
      if (!out || out.hidden) return;
      var r = out.getBoundingClientRect(), hh = (doc.querySelector(".s-header") || {offsetHeight: 56}).offsetHeight;
      if (mode === "page" && (r.top < hh || r.top > innerHeight * 0.6)) window.scrollBy({top: r.top - hh - 16, behavior: smooth && !reduce ? "smooth" : "auto"});
    }
    function paint(fromURL) {
      input.value !== st.q && (input.value = st.q);
      clear.hidden = !st.q;
      $$(".s-tchip[data-tag]", scope).forEach(function (b) { b.setAttribute("aria-pressed", st.tags.indexOf(b.dataset.tag) !== -1 ? "true" : "false"); });
      var active = st.tags.length || st.q;
      var res = active || st.group ? search(st) : [];
      var parts = [], names = st.tags.map(function (t) { return (TAGS[t] || {}).name || t; });
      if (active) {
        var what = st.tags.length > 1 ? (st.any ? " with any of these skills" : " with all of these skills") : " with evidence";
        if (res.length) parts.push("<span><strong>" + res.length + "</strong> " + (res.length === 1 ? "project" : "projects") + what + (st.group ? " in " + esc(NAVG[st.group] || st.group) : "") + "</span>");
        else if (st.tags.length > 1 && !st.any) parts.push("<span>No project has all of these</span>");
        else parts.push("<span>No projects match</span>");
      } else if (mode === "sheet") {
        parts.push("Pick a skill or type a word.");
      }
      if (st.tags.length) parts.push('<span class="s-search__picked">' + st.tags.map(function (t, i) {
        return '<button class="s-tchip s-tchip--picked" type="button" data-unpick="' + esc(t) + '" aria-label="Remove ' + esc(names[i]) + '">' + esc(names[i]) + ' <svg class="aods-icon" data-size="sm" aria-hidden="true"><use href="#pds-close"></use></svg></button>'; }).join("") + "</span>");
      if (st.tags.length > 1 && st.any) parts.push('<button class="s-search__reset" type="button" data-all>Only projects with all of these</button>');
      if (st.group && !active) parts.push("<span>Showing " + esc(NAVG[st.group] || st.group) + "</span>");
      if (active || st.group) parts.push('<button class="s-search__reset" type="button" data-reset>Show all work</button>');
      status.innerHTML = parts.join(" ");
      $$("[data-unpick]", status).forEach(function (b) { b.addEventListener("click", function () { st.tags.splice(st.tags.indexOf(b.dataset.unpick), 1); if (st.tags.length < 2) st.any = false; commit(true); input.focus(); }); });
      $("[data-any]", status) && $("[data-any]", status).addEventListener("click", function () { st.any = true; commit(true); });
      $("[data-all]", status) && $("[data-all]", status).addEventListener("click", function () { st.any = false; commit(true); });
      $("[data-reset]", status) && $("[data-reset]", status).addEventListener("click", function () { st.tags = []; st.q = ""; st.group = ""; st.any = false; commit(true); input.focus(); });
      if (mode === "page") {
        var wb = $("#browse"), groups = $("#work-groups");
        if (active) {
          out.hidden = false; wb.hidden = true;
          var fx = featureHTML(st, "page");
          out.innerHTML = (res.length || fx) ? '<ul class="s-results">' + fx + res.map(function (r, i) { return resultHTML(r, "page", i === 0 && !fx); }).join("") + "</ul>" : emptyHTML(st.q, st.tags.length > 1 && !st.any);
        } else {
          out.hidden = true; out.innerHTML = ""; wb.hidden = false;
          $$(".s-start, .s-storyrow", wb).forEach(function (x) { x.hidden = !!st.group; });
          $$(".s-wgroup", groups).forEach(function (g) { g.hidden = !!st.group && g.dataset.nav !== st.group; g.classList.toggle("is-target", !!st.group && g.dataset.nav === st.group);
            var all = $(".s-wgroup__all", g); if (all) all.hidden = !st.group;
            if (g._setOpen && st.group) g._setOpen(true); });
        }
      } else {
        var fs2 = active ? featureHTML(st, "sheet") : "";
        out.innerHTML = active ? ((res.length || fs2) ? fs2 + res.map(function (r, i) { return resultHTML(r, "sheet", i === 0 && !fs2); }).join("") : "<li>" + emptyHTML(st.q, st.tags.length > 1 && !st.any) + "</li>") : "";
      }
      $$("[data-near]", out).forEach(function (b) { b.addEventListener("click", function () { st.tags = [b.dataset.near]; st.q = ""; st.any = false; commit(true); }); });
      $$("[data-reset]", out).forEach(function (b) { b.addEventListener("click", function () { st.tags = []; st.q = ""; st.group = ""; st.any = false; commit(true); input.focus(); }); });
      $$("[data-any]", out).forEach(function (b) { b.addEventListener("click", function () { st.any = true; commit(true); }); });
      if (mode === "page" && fromURL === "scroll") {
        if (active) setTimeout(function () { showResults(false); }, 0);
        else if (st.group) { var gh = doc.getElementById("group-" + st.group); if (gh) setTimeout(function () { gh.scrollIntoView({block: "start"}); }, 0); }
      }
    }
    function commit(push) {
      if (mode === "page") writeURL(push);
      paint();
    }
    box._paint = paint; box._st = st;
    input.addEventListener("input", function () { st.q = input.value; clearTimeout(timer); timer = setTimeout(function () { commit(false); }, 160); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); st.q = input.value; commit(true); showResults(true); } });
    clear.addEventListener("click", function () { st.q = ""; input.value = ""; commit(true); input.focus(); });
    scope.addEventListener("click", function (e) {
      var b = e.target.closest(".s-tchip[data-tag]"); if (!b || !scope.contains(b)) return;
      var id = b.dataset.tag, i = st.tags.indexOf(id);
      if (i === -1) st.tags.push(id); else st.tags.splice(i, 1);
      if (st.tags.length < 2) st.any = false;
      var inBrowse = browse && browse.contains(b);
      commit(true);
      if (inBrowse) { browse.open = false; showResults(true); var f = $(".s-res a, .s-empty button", out); if (f) f.focus({preventScroll: true}); }   // show the effect where the reader is
      else showResults(true);
    });
    if (mode === "page") $$(".s-wgroup__all").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); st.group = ""; commit(true);
      var g = a.closest(".s-wgroup"); if (g) { g.scrollIntoView({block: "start"}); var h = $("h2", g); h.setAttribute("tabindex", "-1"); h.focus({preventScroll: true}); } }); });
    paint(mode === "page" ? "scroll" : null);
    return paint;
  }
  function emptyHTML(q, andMiss) {
    if (andMiss) return '<div class="s-empty"><p class="s-empty__t">No project has all of these skills.</p><button class="s-cta" type="button" data-any>Show projects with any of these</button></div>';
    var n = q ? nearest(q) : [];
    return '<div class="s-empty"><p class="s-empty__t">No projects match' + (q ? " “" + esc(q) + "”" : "") + ".</p>" +
      (n.length ? "<p>Nearest skills:</p><ul class=\"s-search__chips\">" + n.map(function (t) { return '<li><button class="s-tchip" type="button" data-near="' + esc(t.id) + '">' + esc(t.name) + ' <span class="s-tchip__n">' + t.count + "</span></button></li>"; }).join("") + "</ul>" : "") +
      '<button class="s-cta" type="button" data-reset>Show all work</button></div>';
  }

  /* URL state on the Work page: ?tag=a&tag=b&q=words&group=ai&any=1 (tag also accepts a comma list) */
  function readURL(repaint) {
    var p = new URLSearchParams(location.search), tags = [];
    p.getAll("tag").forEach(function (v) { v.split(",").forEach(function (x) { x = x.trim(); if (x && TAGS[x] && tags.indexOf(x) === -1) tags.push(x); }); });
    state.tags = tags; state.q = p.get("q") || ""; var gq = p.get("group") || p.get("menu") || ""; gq = REDIR[gq] || gq; state.group = NAVG[gq] ? gq : ""; /* old ?group= values and the menus' ?menu= fallbacks */ state.any = p.get("any") === "1" && tags.length > 1;
    if (repaint) { var b = $("#search"); b && b._paint && b._paint(); }
  }
  function writeURL(push) {
    var p = new URLSearchParams();
    state.tags.forEach(function (t) { p.append("tag", t); });
    if (state.any && state.tags.length > 1) p.set("any", "1");
    if (state.q) p.set("q", state.q);
    if (state.group) p.set("group", state.group);
    var s = p.toString(), url = location.pathname + (s ? "?" + s : "");
    try { (push ? history.pushState : history.replaceState).call(history, null, "", url); } catch (e) {}
  }
  /* Work page: each group shows its first six cards; a button reveals the rest (all cards stay in the search index and in print) */
  if (isWork) $$(".s-wgroup").forEach(function (g) {
    var cards = $$(".s-wcard", g), FOLD = 6; if (cards.length <= FOLD + 1) return;
    var list = $(".s-wgroup__list", g), name = $(".s-wgroup__title", g).textContent;
    list.id = list.id || "list-" + (g.dataset.nav || g.dataset.group);
    var wrap = doc.createElement("p"); wrap.className = "s-wgroup__more";
    var btn = doc.createElement("button"); btn.type = "button"; btn.className = "s-wgroup__toggle"; btn.setAttribute("aria-controls", list.id);
    wrap.appendChild(btn); list.parentNode.insertBefore(wrap, list.nextSibling);
    var set = function (open) {
      cards.forEach(function (c, i) { c.classList.toggle("is-folded", !open && i >= FOLD); });
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = (open ? "Show fewer" : "All " + cards.length + " in " + esc(name)) + ' <svg class="aods-icon" data-size="sm" aria-hidden="true"><use href="#pds-chevron-' + (open ? "up" : "down") + '"></use></svg>';
    };
    g._setOpen = set;
    btn.addEventListener("click", function () { var open = btn.getAttribute("aria-expanded") !== "true"; set(open); if (open) { var a = $("a", cards[FOLD]); if (a) a.focus(); } });
    set(false);
  });

  /* tables that scroll sideways show their cue only when they overflow */
  $$(".s-table--scroll").forEach(function (t) {
    var w = $(".s-table__wrap", t), cue = $(".s-table__cue", t);
    var check = function () { var o = w.scrollWidth > w.clientWidth + 2; cue.hidden = !o; w.classList.toggle("is-overflow", o && w.scrollLeft + w.clientWidth < w.scrollWidth - 2); };
    w.addEventListener("scroll", check, {passive: true}); window.addEventListener("resize", check); check();
  });


  /* ---------------------------------------------------------------- S1 header menus (his Figma 536:5528)
     Each trigger is a link without JS; here it becomes a disclosure button (aria-expanded, aria-controls).
     Click, Enter or Space opens; Escape closes and returns focus; an outside click, focus leaving the panel,
     or opening another menu closes it. Hover never opens. Panels overlay the page (no layout shift). */
  (function () {
    var hd = $(".s-hd"); if (!hd) return;
    var trig = $$("[data-hd-trigger]", hd), open = null;
    trig.forEach(function (t) {
      t.setAttribute("role", "button"); t.setAttribute("aria-expanded", "false");
      t.dataset.href = t.getAttribute("href"); t.removeAttribute("href"); t.setAttribute("tabindex", "0");
    });
    function panel(t) { return doc.getElementById(t.getAttribute("aria-controls")); }
    function close(focusBack) {
      if (!open) return;
      var t = open; open = null;
      t.setAttribute("aria-expanded", "false"); var p = panel(t); if (p) p.hidden = true;
      hd.classList.remove("is-open"); hd.removeAttribute("data-open");
      if (focusBack) t.focus();
    }
    function show(t) {
      if (open === t) { close(false); return; }
      close(false);
      var p = panel(t); if (!p) return;
      p.hidden = false; t.setAttribute("aria-expanded", "true"); open = t;
      hd.classList.add("is-open"); hd.setAttribute("data-open", t.getAttribute("data-hd-trigger"));
    }
    trig.forEach(function (t) {
      t.addEventListener("click", function (e) { e.preventDefault(); show(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); show(t); }
        else if (e.key === "ArrowDown" && open !== t) { e.preventDefault(); show(t); var f = $("a, button", panel(t)); if (f) f.focus(); }
      });
    });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); close(true); } });
    doc.addEventListener("click", function (e) { if (open && !e.target.closest("[data-hd-panel]") && !e.target.closest("[data-hd-trigger]")) close(false); });
    hd.addEventListener("focusout", function (e) {
      if (!open) return;
      var to = e.relatedTarget; if (!to) return;
      if (to === open || panel(open).contains(to)) return;
      // Tab from the trigger goes into its panel first (visual order), then on to the next bar item
      close(false);
    });
    // Tab from an open trigger moves into its panel; Tab off the panel's last link returns to the next bar item
    hd.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !open) return;
      var p = panel(open), f = $$("a[href], button", p).filter(function (x) { return x.getClientRects().length; });
      if (!f.length) return;
      if (!e.shiftKey && doc.activeElement === open) { e.preventDefault(); f[0].focus(); }
      else if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); open.focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) {
        var all = $$("a[href], button, [data-hd-trigger]", hd).filter(function (x) { return x.getClientRects().length && !p.contains(x); });
        var nxt = all[all.indexOf(open) + 1]; e.preventDefault(); var t0 = open; close(false); (nxt || t0).focus();
      }
    });
    window.addEventListener("resize", function () { if (open && !open.getClientRects().length) close(false); });
  })();

  if (isWork) { readURL(false); renderSearch($("#search"), "page"); if (location.hash === "#search") { var i = $("#search input"); if (i) i.focus(); } }
})();
