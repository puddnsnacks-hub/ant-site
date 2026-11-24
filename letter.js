/* The letter (L1): a short note from Michael at the door of a live app or system.
   One self-contained component for the suite and the bundled AODS reference. No dependencies, no network.
   Data: <script type="application/json" id="letters-data"> in the page, or window.PUDDN_LETTERS (letters-data.js).
   Public API: window.PuddnLetter . If this file fails, the page is unchanged:
   no letter markup exists until open() builds it, and links keep their own href. */
(function () {
  "use strict";
  var doc = document, win = window;
  var ME = doc.currentScript && doc.currentScript.src;          // assets resolve against this file, at any depth
  var KEY = "puddn-letter:";                                     // localStorage: puddn-letter:<id> = "seen"
  var DATA = null, memSeen = {}, storeOK = true, cur = null, uid = 0;

  function data() {
    if (DATA) return DATA;
    try { var el = doc.getElementById("letters-data"); if (el) DATA = JSON.parse(el.textContent); } catch (e) { DATA = null; }
    if (!DATA && win.PUDDN_LETTERS) DATA = win.PUDDN_LETTERS;
    return DATA;
  }
  function letter(id) {
    var d = data(); if (!d) return null;
    for (var i = 0; i < d.letters.length; i++) if (d.letters[i].id === id) return d.letters[i];
    return null;
  }
  function urlSeen() { return /(?:^|[?&])letter=seen(?:&|$)/.test(location.search.slice(1)); }
  function seen(id) {
    if (memSeen[id] || urlSeen()) return true;
    try { return localStorage.getItem(KEY + id) === "seen"; } catch (e) { storeOK = false; return false; }
  }
  function markSeen(id) {
    memSeen[id] = true;
    try { localStorage.setItem(KEY + id, "seen"); storeOK = localStorage.getItem(KEY + id) === "seen"; } catch (e) { storeOK = false; }
    return storeOK;
  }
  function abs(rel) { try { return ME ? new URL(rel, ME).href : rel; } catch (e) { return rel; } }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var CLOSE_SVG = '<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false"><path opacity="0.22" fill-rule="evenodd" d="M16.7904 14.5903L8.55039 6.21031L6.23039 7.67031L14.5404 16.8803L5.90039 25.6603L7.98039 27.0003L16.4404 18.9903L24.4204 27.8303L26.6804 24.6503L18.8604 16.7003L27.5004 8.52031L25.6804 5.57031L16.7904 14.5903Z" fill="currentColor"/><path fill-rule="evenodd" d="M15.2904 13.0903L7.05039 4.71031L4.73039 6.17031L13.0404 15.3803L4.40039 24.1603L6.48039 25.5003L14.9404 17.4903L22.9204 26.3303L25.1804 23.1503L17.3604 15.2003L26.0004 7.02031L24.1804 4.07031L15.2904 13.0903Z" fill="currentColor"/></svg>';

  /* open(id, opts): opts.page (bundle entry page, picks opening_by_page), opts.href/target/rel (the primary is then a real link),
     opts.secondary (true: add a plain "Close"), opts.trigger (focus returns here), opts.onDismiss(reason: "continue" | "close") */
  function open(id, opts) {
    opts = opts || {};
    var d = data(), L = letter(id);
    if (!d || !L) return false;
    var D = doc.createElement("dialog");
    if (typeof D.showModal !== "function") return false;          // no modal support: the link just works
    if (cur) close("close");
    var n = ++uid, ids = { lbl: "pl-lbl-" + n, name: "pl-name-" + n, greet: "pl-greet-" + n };
    D.className = "pl-letter";
    D.setAttribute("aria-labelledby", ids.lbl + " " + ids.name + " " + ids.greet);
    D.setAttribute("data-letter", id);

    var sheet = el("div", "pl-letter__sheet");
    // letterhead
    var head = el("header", "pl-letter__head");
    var lbl = el("span", "pl-letter__sr", "A letter from"); lbl.id = ids.lbl;
    head.appendChild(lbl);
    if (d.mark) {
      var img = el("img", "pl-letter__mark");
      img.src = abs(d.mark); if (d.mark3x) img.srcset = abs(d.mark) + " 2x, " + abs(d.mark3x) + " 3x";
      img.alt = ""; img.width = 40; img.height = 51; img.decoding = "async";
      head.appendChild(img);
    }
    var hd = el("div", "pl-letter__who");
    var nm = el("p", "pl-letter__name", d.site.name); nm.id = ids.name;
    hd.appendChild(nm);
    if (d.site.role) hd.appendChild(el("p", "pl-letter__role", d.site.role));
    if (d.site.email) { var em = el("a", "pl-letter__email", d.site.email); em.href = "mailto:" + d.site.email; hd.appendChild(em); }
    head.appendChild(hd);
    var x = el("button", "pl-letter__close"); x.type = "button"; x.innerHTML = CLOSE_SVG + '<span class="pl-letter__sr">Close the letter</span>';
    head.appendChild(x);
    sheet.appendChild(head);

    // body
    var body = el("div", "pl-letter__body"); body.tabIndex = -1;
    var g = el("p", "pl-letter__greet", L.greeting); g.id = ids.greet; body.appendChild(g);
    var opening = (opts.page && L.opening_by_page && L.opening_by_page[opts.page]) || L.opening_default;
    if (opening) body.appendChild(el("p", "pl-letter__p", opening));
    (L.paragraphs || []).forEach(function (t) { body.appendChild(el("p", "pl-letter__p", t)); });
    if (L.bullets && L.bullets.length) {
      if (L.bullets_lead) body.appendChild(el("p", "pl-letter__p pl-letter__lead", L.bullets_lead));
      var ul = el("ul", "pl-letter__list");
      L.bullets.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      body.appendChild(ul);
    }
    if (d.offer) body.appendChild(el("p", "pl-letter__p pl-letter__offer", d.offer));
    if (d.signoff) body.appendChild(el("p", "pl-letter__signoff", d.signoff));
    if (d.signature) body.appendChild(el("p", "pl-letter__sig", d.signature));
    sheet.appendChild(body);

    // actions and the footer line
    var foot = el("footer", "pl-letter__foot");
    var acts = el("div", "pl-letter__acts");
    var prim;
    if (opts.href) {
      prim = el("a", "pl-letter__primary", opts.primary || L.primary);
      prim.href = opts.href;
      if (opts.target) prim.target = opts.target;
      if (opts.rel) prim.rel = opts.rel;
    } else {
      prim = el("button", "pl-letter__primary", opts.primary || L.primary); prim.type = "button";
    }
    acts.appendChild(prim);
    if (opts.secondary) { var sec = el("button", "pl-letter__secondary", "Close"); sec.type = "button"; acts.appendChild(sec); }
    foot.appendChild(acts);
    var line = d.footer_line || "";
    if (line || (d.draft && L.draft)) {
      var fl = el("p", "pl-letter__line", line);
      if (d.draft && L.draft) {
        var dm = el("span", "pl-letter__draft"); dm.title = "Draft copy";
        dm.appendChild(el("span", "pl-letter__sr", " (draft)"));
        fl.appendChild(doc.createTextNode(line ? " " : ""));
        fl.appendChild(dm);
        fl.appendChild(el("span", "pl-letter__drafttext", "Draft letter, awaiting his edit."));
      }
      foot.appendChild(fl);
    }
    sheet.appendChild(foot);
    D.appendChild(sheet);

    var ret = opts.trigger || doc.activeElement;
    cur = { D: D, id: id, opts: opts, ret: ret, done: false };
    x.addEventListener("click", function () { close("close"); });
    if (sec) sec.addEventListener("click", function () { close("close"); });
    prim.addEventListener("click", function () {
      markSeen(id);
      if (opts.href) { if (cur && (!opts.target || opts.target === "_self")) cur.keepFocus = true; setTimeout(function () { close("continue"); }, 0); }   // let the link navigate
      else close("continue");
    });
    D.addEventListener("cancel", function (e) { e.preventDefault(); close("close"); });
    D.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(D.querySelectorAll("a[href], button"), function (n) { return n.offsetParent !== null || n === doc.activeElement; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && (doc.activeElement === a || doc.activeElement === body)) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    D.addEventListener("click", function (e) { if (e.target === D) close("close"); });   // the backdrop
    doc.body.appendChild(D);
    doc.documentElement.classList.add("pl-lock");
    D.showModal();
    body.focus({ preventScroll: true });
    body.scrollTop = 0;
    return true;
  }

  function focusable(n) { return n && n.isConnected && typeof n.focus === "function" && n !== doc.body && (n.offsetParent !== null || n.tagName === "MAIN"); }
  function close(reason) {
    if (!cur || cur.done) return;
    var c = cur; c.done = true; cur = null;
    markSeen(c.id);                                              // read once, by either way out: the link just works after
    try { c.D.close(); } catch (e) {}
    if (c.D.parentNode) c.D.parentNode.removeChild(c.D);
    doc.documentElement.classList.remove("pl-lock");
    if (!c.keepFocus) {
      var r = c.ret;
      if (!focusable(r) && r && r.closest) {                     // a menu that closed behind the letter: its trigger
        var p = r.closest("[id]"), t = p && doc.querySelector('[aria-controls="' + p.id + '"]');
        if (focusable(t)) r = t;
      }
      if (!focusable(r)) r = doc.querySelector("main");
      if (r) { try { r.focus({ preventScroll: true }); } catch (e) {} }
    }
    if (typeof c.opts.onDismiss === "function") { try { c.opts.onDismiss(reason); } catch (e) {} }
  }

  /* entry(id, {page, focus}): the bundle's first-entry letter. Shows once: not if seen (storage) or the URL carries letter=seen.
     After it, a deep link's #hash target is focused and scrolled to. Returns true if shown. */
  function entry(id, o) {
    o = o || {};
    if (seen(id)) return false;
    return open(id, { page: o.page, trigger: o.focus || doc.querySelector("main"), onDismiss: function (why) {
      markSeen(id);
      var h = location.hash && doc.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (h) { h.scrollIntoView(); if (h.tabIndex < 0 && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(h.tagName)) h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      if (typeof o.onDismiss === "function") o.onDismiss(why);
    } });
  }

  /* carry(a): add letter=seen to one same-bundle link (call it on links when storageOK() is false) */
  function carry(a) {
    var h = a.getAttribute("href"); if (!h || /^(#|mailto:|https?:|javascript:)/i.test(h) || /[?&]letter=seen/.test(h)) return;
    var i = h.indexOf("#"), base = i < 0 ? h : h.slice(0, i), frag = i < 0 ? "" : h.slice(i);
    a.setAttribute("href", base + (base.indexOf("?") < 0 ? "?" : "&") + "letter=seen" + frag);
  }

  // suite wiring: external letters intercept their links once; reopen controls open a page's letter
  function matchExternal(a) {
    var d = data(); if (!d || !a.href) return null;
    for (var i = 0; i < d.letters.length; i++) {
      var L = d.letters[i];
      if (L.kind !== "external" || !L.href_match) continue;
      if (a.href.indexOf(L.href_match) >= 0 && !(L.href_exclude && a.href.indexOf(L.href_exclude) >= 0)) return L;
    }
    return null;
  }
  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.closest(".pl-letter")) return;
    var L = matchExternal(a);
    if (!L || seen(L.id)) return;
    if (open(L.id, { href: a.href, target: a.target, rel: a.rel, trigger: a })) e.preventDefault();
  }
  function wireReopen() {
    var bs = doc.querySelectorAll("[data-letter-open]");
    Array.prototype.forEach.call(bs, function (b) {
      var row = b.closest("[data-letter-row]"); if (row) row.hidden = false;
      b.hidden = false;
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var id = b.getAttribute("data-letter-open"), L = letter(id), href = b.getAttribute("data-letter-href"), t = b.getAttribute("data-letter-target"), rel = b.getAttribute("data-letter-rel");
        if (!href && L && L.kind === "external") {                 // the page's own link to the app
          var as = doc.querySelectorAll("a[href]");
          for (var i = 0; i < as.length; i++) if (!as[i].closest(".pl-letter") && matchExternal(as[i]) === L) { href = as[i].href; t = as[i].target; rel = as[i].rel; break; }
          if (!href) { href = "https://" + L.href_match; rel = "noopener"; }
        }
        open(id, { page: b.getAttribute("data-letter-page"), href: href, target: t, rel: rel, secondary: true, trigger: b });
      });
    });
  }

  win.PuddnLetter = { open: open, close: function () { close("close"); }, entry: entry, seen: seen, markSeen: markSeen, carry: carry,
    storageOK: function () { return storeOK; }, data: data, storageKey: function (id) { return KEY + id; } };
  doc.addEventListener("click", onClick);
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", wireReopen); else wireReopen();
})();
