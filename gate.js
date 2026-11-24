/* The front door. Every page loads this first. Without the pass it sends the visitor to gate.html.
   It does nothing when the site is opened from a folder (file://), so drafts on a computer open as before.
   This is a door, not a vault: it runs in the browser, so it keeps out visitors who were not given the password,
   but it does not protect the files from someone who goes looking for them. */
(function () {
  if (location.protocol === "file:") return;
  var s = document.currentScript, root = s.src.replace(/gate\.js(\?.*)?$/, "");
  var ok = null; try { ok = localStorage.getItem("ant-pass"); } catch (e) {}
  var want = window.GATE && window.GATE.hash ? window.GATE.hash.slice(0, 24) : null;
  if (want && ok === want) return;
  document.documentElement.style.visibility = "hidden";
  var here = location.href.slice(root.length);
  location.replace(root + "gate.html" + (here && here !== "index.html" ? "?to=" + encodeURIComponent(here) : ""));
})();
