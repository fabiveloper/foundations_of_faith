// Hell/Dunkel vor dem ersten Zeichnen setzen (kein Aufblitzen)
try { if (localStorage.getItem("fdg-modus") === "dunkel") document.documentElement.classList.add("dark"); } catch (e) {}
