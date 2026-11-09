/* =========================================================
   Fundamente des Glaubens – Handy-Ansicht
   Ergänzt app.js auf kleinen Bildschirmen, ohne app.js zu ändern:
   Leiste unten, Kapitel-Kacheln auf der Startseite,
   mitlaufende Antwort-Leiste auf Themenseiten.
   ========================================================= */
(function () {
  "use strict";

  // Same breakpoints as in style.css
  const handy = window.matchMedia("(max-width: 1023px)");

  const ICON = {
    start: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    kapitel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h10"/></svg>',
    suche: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    mond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sonne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  };

  const istDunkel = () => document.documentElement.classList.contains("dark");

  /* ---------- Bottom tab bar ---------- */
  function leiste() {
    let nav = document.querySelector(".m-leiste");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "m-leiste";
      nav.setAttribute("aria-label", "Navigation");
      nav.innerHTML = `
        <a href="#/" data-m="start">${ICON.start}<span>Start</span></a>
        <button type="button" data-aktion="menue">${ICON.kapitel}<span>Inhalt</span></button>
        <button type="button" data-aktion="suche">${ICON.suche}<span>Suchen</span></button>
        <button type="button" data-m="modus"><span class="m-icon"></span><span class="m-text"></span></button>`;
      document.body.appendChild(nav);
      // Delegate theme switching to the existing header button, so app.js stays the single source of truth
      nav.querySelector('[data-m="modus"]').addEventListener("click", () => {
        document.querySelector('.kopf [data-aktion="modus"]')?.click();
        modusKnopf();
      });
    }
    modusKnopf();
    const start = location.hash === "" || location.hash === "#/" || location.hash === "#";
    nav.querySelector('[data-m="start"]').classList.toggle("aktiv", start);
  }

  function modusKnopf() {
    const k = document.querySelector('.m-leiste [data-m="modus"]');
    if (!k) return;
    k.querySelector(".m-icon").innerHTML = istDunkel() ? ICON.sonne : ICON.mond;
    k.querySelector(".m-text").textContent = istDunkel() ? "Hell" : "Dunkel";
  }

  /* ---------- Chapter tiles on the start page ---------- */
  function kacheln() {
    const main = document.getElementById("inhalt");
    const einband = main?.querySelector(".einband");
    if (!einband || main.querySelector(".m-kapitel")) return;
    const reiter = [...document.querySelectorAll(".register .reiter")];
    if (!reiter.length) return;
    const sec = document.createElement("section");
    sec.className = "m-kapitel";
    sec.innerHTML = `<h2>Kapitel</h2><div class="m-kacheln">${reiter.map((r) => {
      const href = r.getAttribute("href") || "";
      // "#/k/<id>" for chapters, "#/t/<id>/<topic>" when a chapter has only one topic
      const id = href.split("/")[2];
      const anzahl = new Set([...main.querySelectorAll(`a[href^="#/t/${id}/"]`)].map((a) => a.getAttribute("href"))).size;
      const name = r.querySelector("span:last-child")?.textContent || id;
      return `<a class="m-kachel" href="${href}" style="${r.getAttribute("style") || ""}">
        <span class="m-kachel-name">${name}</span>
        <span class="m-kachel-zahl">${anzahl} ${anzahl === 1 ? "Thema" : "Themen"}</span>
      </a>`;
    }).join("")}</div>`;
    einband.after(sec);
  }

  /* ---------- Sticky answer chips on topic pages ---------- */
  let beobachter = null;
  function chips() {
    const kasten = document.querySelector("#inhalt .inhalt-kasten");
    if (!kasten || document.querySelector(".m-chips")) return;
    const knoepfe = [...kasten.querySelectorAll(".sprungliste [data-sprung]")];
    const abschnitte = knoepfe.map((k) => document.getElementById(k.dataset.sprung)).filter(Boolean);
    if (abschnitte.length < 2) return;
    const leiste = document.createElement("div");
    leiste.className = "m-chips";
    leiste.innerHTML = `<div class="m-chips-spur">${knoepfe.map((k, i) =>
      `<button type="button" data-sprung="${k.dataset.sprung}"><span class="m-nr">${i + 1}</span>${k.textContent}</button>`).join("")}</div>`;
    kasten.before(leiste);

    const spur = leiste.firstElementChild;
    const markiere = (id) => {
      spur.querySelectorAll("button").forEach((b) => {
        const an = b.dataset.sprung === id;
        b.classList.toggle("aktiv", an);
        if (an) spur.scrollTo({ left: b.offsetLeft - 16, behavior: "smooth" });
      });
    };
    beobachter?.disconnect();
    beobachter = new IntersectionObserver((eintraege) => {
      const sichtbar = eintraege.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (sichtbar[0]) markiere(sichtbar[0].target.id);
    }, { rootMargin: "-130px 0px -55% 0px" });
    abschnitte.forEach((a) => beobachter.observe(a));
  }

  /* ---------- Re-apply after every redraw of app.js ---------- */
  let geplant = false;
  function anwenden() {
    geplant = false;
    document.documentElement.classList.toggle("handy", handy.matches);
    if (!handy.matches) return;
    leiste();
    kacheln();
    chips();
  }
  const planen = () => { if (!geplant) { geplant = true; requestAnimationFrame(anwenden); } };

  new MutationObserver(planen).observe(document.getElementById("app"), { childList: true, subtree: true });
  window.addEventListener("hashchange", planen);
  handy.addEventListener("change", planen);
  planen();
})();
