/* PORTFOLIO COPY (2026-11-17) · What Puddn changes. Reads every global token's value under each theme from the computed style
   (the house from dist/tokens.css, Puddn from dist/themes/pds.css), compares them, and draws the pairs that differ, grouped, with
   the counts computed here. Then traces three button tokens through their references (dist/tokens.js "raw") to those values.
   Reading a theme sets the theme attribute for one synchronous read and puts it back before the browser paints. */
(function () {
  var T = window.AODS_TOKENS || {}, root = document.documentElement;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var norm = function (v) { return String(v).replace(/["']/g, "").replace(/\s+/g, " ").trim().toLowerCase(); };
  var show = function (v) { return String(v).replace(/["']/g, "").replace(/\s+/g, " ").trim(); };

  var globals = Object.keys(T).filter(function (k) { return T[k].tier === "g"; }).map(function (k) { return T[k].cssVar; });

  /* one synchronous read per theme: "house" removes the attribute, "pds" sets it */
  function read(names, theme) {
    var had = root.getAttribute("data-theme"), out = {};
    if (theme === "pds") root.setAttribute("data-theme", "pds"); else root.removeAttribute("data-theme");
    var cs = getComputedStyle(root);
    names.forEach(function (n) { out[n] = cs.getPropertyValue(n).trim(); });
    if (had === null) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", had);
    return out;
  }
  function rgb(v) {   /* a color string to channels, through the browser's own parser */
    var p = document.createElement("span"); p.style.color = v; document.body.appendChild(p);
    var m = (getComputedStyle(p).color.match(/[\d.]+/g) || []).map(Number); p.remove(); return m;
  }
  function hex(v) {
    if (!/^#|^rgb/i.test(v)) return show(v);
    var m = rgb(v); if (m.length > 3 && m[3] < 1) return show(v);
    return "#" + m.slice(0, 3).map(function (x) { return ("0" + Math.round(x).toString(16)).slice(-2); }).join("");
  }
  function quoteFamily(v) { return show(v).split(",").map(function (f) { f = f.trim(); return /^(serif|sans-serif|monospace|system-ui)$/.test(f) ? f : '"' + f + '"'; }).join(", "); }

  var SAMPLE = "Six questions, answered twice";
  function cell(name, v) {
    if (/^--g-color-/.test(name)) return '<span class="w-val"><span class="w-sw" style="background:' + esc(v) + '"></span><code>' + esc(hex(v)) + "</code></span>";
    if (/^--g-font-family-/.test(name)) return '<span class="w-val"><code>' + esc(show(v)) + '</code></span><span class="w-face" style="font-family:' + esc(quoteFamily(v)) + '">' + SAMPLE + "</span>";
    return '<span class="w-val"><code>' + esc(show(v)) + "</code></span>";
  }

  var GROUPS = [
    { id: "primary", title: "Primary ramp", test: /^--g-color-brand-primary-/, body: "Structure and the dark grounds: the page ink, the dark surfaces and the raised and sunken dark plates." },
    { id: "vivid", title: "Vivid ramp", test: /^--g-color-brand-vivid-/, body: "Action and links: step 50 is the primary button." },
    { id: "accent", title: "Accent ramp", test: /^--g-color-brand-accent-/, body: "Eyebrows, rules and the accent button: the light steps stay cream, the dark steps turn from copper to teal-green." },
    { id: "gray", title: "Gray ramp", test: /^--g-color-brand-gray-/, body: "Text and borders on light grounds, warmed a step." },
    { id: "overlays", title: "Overlays", test: /^--g-color-overlay-/, body: "The scrim and the dark translucent plates, tinted from the primary ramp." },
    { id: "faces", title: "Typefaces", test: /^--g-font-family-/, body: "The five family roles. The documentation faces are not theme globals, so they stay." },
    { id: "type", title: "Type and labels", test: /^--g-/, body: "Label tracking and two large line heights (heading and display)." }
  ];

  function render() {
    var house = read(globals, "house"), pds = read(globals, "pds");
    var changed = globals.filter(function (n) { return norm(house[n]) !== norm(pds[n]); });
    var host = document.getElementById("w-groups"), toc = document.getElementById("w-toc"), used = {};
    var html = "", tocHtml = "";
    GROUPS.forEach(function (g) {
      var all = globals.filter(function (n) { return !used[n] && g.test.test(n); });
      var rows = changed.filter(function (n) { return !used[n] && g.test.test(n); });
      if (g.id === "type") all = rows.slice();   /* the catch-all counts only what moved */
      all.forEach(function (n) { if (g.id !== "type" || rows.indexOf(n) >= 0) used[n] = true; });
      if (!rows.length) return;
      var count = g.id === "type" ? rows.length + " change" : rows.length + " of " + all.length + " change";
      var extra = "";
      if (g.id === "vivid") {   /* the honest line, computed: how many steps move by less than 16 of 255 in every channel */
        var small = rows.filter(function (n) { var a = rgb(house[n]), b = rgb(pds[n]); return [0, 1, 2].every(function (i) { return Math.abs(a[i] - b[i]) < 16; }); }).length;
        extra = '<p class="w-note"><strong>Vivid barely moves.</strong> ' + small + " of its " + all.length + " steps change by less than 16 of 255 in every color channel, so primary buttons and links look alike in both themes. The change shows in the grounds, the accent and the faces.</p>";
      }
      tocHtml += '<li><a href="#' + g.id + '">' + esc(g.title) + "</a></li>";
      html += '<section class="g-section" id="' + g.id + '" aria-labelledby="' + g.id + '-h">' +
        '<p class="g-eyebrow">' + esc(count) + '</p><div class="g-rule"></div>' +
        '<h2 class="g-heading" id="' + g.id + '-h">' + esc(g.title) + '</h2><p class="g-body">' + esc(g.body) + "</p>" + extra +
        '<div class="w-scroll" tabindex="0" role="region" aria-labelledby="' + g.id + '-h"><table class="w-table"><thead><tr><th scope="col">Global token</th><th scope="col">AODS</th><th scope="col" class="w-arrow" aria-hidden="true"></th><th scope="col">Puddn</th></tr></thead><tbody>' +
        rows.map(function (n) {
          return '<tr><th scope="row">' + esc(n) + '</th><td data-label="AODS">' + cell(n, house[n]) + '</td><td class="w-arrow" aria-hidden="true">→</td><td data-label="Puddn">' + cell(n, pds[n]) + "</td></tr>";
        }).join("") + "</tbody></table></div></section>";
    });
    /* at a glance: the four brand ramps as two bands each, AODS over Puddn */
    var glance = '<div class="w-glance" role="img" aria-label="The four brand ramps, AODS above Puddn: primary turns from navy to brown, vivid stays the same teal, accent turns from copper to teal-green in its dark steps, gray warms slightly.">';
    ["primary", "vivid", "accent", "gray"].forEach(function (f) {
      var names = globals.filter(function (n) { return n.indexOf("--g-color-brand-" + f + "-") === 0; });
      var band = function (vals) { return '<span class="w-band">' + names.map(function (n) { return '<span style="background:' + esc(vals[n]) + '"></span>'; }).join("") + "</span>"; };
      glance += '<span class="w-glance__row"><span class="w-glance__name">' + f + "</span>" + band(house) + band(pds) + "</span>";
    });
    glance += '<span class="w-glance__key"><span>AODS</span><span>Puddn</span></span></div>';
    tocHtml += '<li><a href="#trace">Trace a button</a></li>';
    host.innerHTML = html; toc.innerHTML = tocHtml;
    document.getElementById("w-glance").innerHTML = glance;
    document.getElementById("w-sum").innerHTML = "<strong>" + changed.length + " of " + globals.length + " global values differ.</strong> " +
      "Every semantic and component token keeps the same reference in both themes, and the component CSS and markup are the same files.";

    /* trace: component → semantic → global → value, through each token's raw reference */
    var key = function (cssVar) { for (var k in T) if (T[k].cssVar === cssVar) return k; return null; };
    var ref = function (k) { var m = T[k] && /^\{(.+)\}$/.exec(T[k].raw || ""); return m ? m[1] : null; };
    var trace = [["c.button.primary-fill", "Primary fill"], ["c.button.accent-fill", "Accent fill"], ["c.button.font-family", "Label face"]];
    var tbody = document.querySelector("#w-trace tbody"), out = "";
    trace.forEach(function (tr) {
      var c = tr[0]; if (!T[c]) return;
      var s = ref(c), g = s && ref(s); if (!g || !T[g]) return;
      var gv = T[g].cssVar, hv = read([gv], "house")[gv], pv = read([gv], "pds")[gv];
      out += "<tr><th scope=\"row\"><span class=\"w-chain\"><code>" + esc(T[c].cssVar) + "</code></span><span class=\"w-tier\"> " + esc(tr[1]) + "</span></th>" +
        '<td data-label="Semantic"><code>' + esc(T[s].cssVar) + '</code></td><td data-label="Global"><code>' + esc(gv) + "</code></td>" +
        '<td data-label="AODS">' + cell(gv, hv) + '</td><td data-label="Puddn">' + cell(gv, pv) + "</td></tr>";
    });
    tbody.innerHTML = out;
    void key;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render); else render();
})();
