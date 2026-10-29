// Hell/Dunkel vor dem ersten Zeichnen setzen (kein Aufblitzen).
// Ohne eigene Wahl folgt die Seite der Einstellung von Browser/System.
(function () {
  var wahl = null;
  try { wahl = localStorage.getItem("fdg-modus"); } catch (e) {}
  var system = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (wahl === "dunkel" || (wahl !== "hell" && system)) document.documentElement.classList.add("dark");
})();
