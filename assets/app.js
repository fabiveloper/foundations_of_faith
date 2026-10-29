/* =========================================================
   Fundamente des Glaubens – Programm
   Normalerweise musst du hier nichts ändern.
   Inhalte liegen im Ordner "inhalte/", siehe LIESMICH.md.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. Inhalte einsammeln ---------- */
  const daten = { kapitel: [], vorwort: "", bibelListe: [], bibeln: [] };
  let aktuellesKapitel = null;
  let aktuelleBibel = null;

  window.Inhalt = {
    kapitel(k) { daten.kapitel.push({ ...k, themenObjekte: [] }); },
    thema(t) {
      if (!aktuellesKapitel) return;
      aktuellesKapitel.themenObjekte.push({ ...t, _datei: aktuellesKapitel._ladeDatei });
    },
    vorwort(text) { daten.vorwort = text; },
    bibeln(liste) { daten.bibelListe = liste; },
    uebersetzung(u) { daten.bibeln.push(u); },
  };

  function ladeSkript(pfad) {
    return new Promise((ok) => {
      const s = document.createElement("script");
      s.src = pfad;
      s.onload = () => ok(true);
      s.onerror = () => { console.warn("Datei nicht gefunden:", pfad); ok(false); };
      document.body.appendChild(s);
    });
  }

  async function ladeAlles() {
    await ladeSkript("inhalte/inhalt.js");
    await ladeSkript("inhalte/vorwort.js");
    for (const id of daten.bibelListe) await ladeSkript(`inhalte/bibel/${id}.js`);
    daten.bibeln.sort((a, b) => daten.bibelListe.indexOf(a.id) - daten.bibelListe.indexOf(b.id));
    const gemerkt = (() => { try { return localStorage.getItem("fdg-bibel"); } catch (e) { return null; } })();
    aktuelleBibel = daten.bibeln.find((b) => b.id === gemerkt) || daten.bibeln[0] || null;
    for (const k of daten.kapitel) {
      aktuellesKapitel = k;
      for (const name of k.themen || []) {
        k._ladeDatei = name;
        const vorher = k.themenObjekte.length;
        const gefunden = await ladeSkript(`inhalte/${k.id}/${name}.js`);
        if (!gefunden || k.themenObjekte.length === vorher) {
          k.themenObjekte.push({ titel: name, text: "", status: "in Arbeit", _datei: name, _fehlt: true });
        }
      }
    }
    aktuellesKapitel = null;
    aufbereiten();
  }

  /* ---------- 2. Text-Format lesen ---------- */
  const BUECHER = ["1. Mose","2. Mose","3. Mose","4. Mose","5. Mose","Josua","Richter","Rut","1. Samuel","2. Samuel","1. Könige","2. Könige","1. Chronik","2. Chronik","Esra","Nehemia","Ester","Hiob","Psalm","Sprüche","Prediger","Hoheslied","Jesaja","Jeremia","Klagelieder","Hesekiel","Daniel","Hosea","Joel","Amos","Obadja","Jona","Micha","Nahum","Habakuk","Zefanja","Haggai","Sacharja","Maleachi","Matthäus","Markus","Lukas","Johannes","Apostelgeschichte","Römer","1. Korinther","2. Korinther","Galater","Epheser","Philipper","Kolosser","1. Thessalonicher","2. Thessalonicher","1. Timotheus","2. Timotheus","Titus","Philemon","1. Petrus","2. Petrus","1. Johannes","2. Johannes","3. Johannes","Hebräer","Jakobus","Judas","Offenbarung"];
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const BUCH_RE = BUECHER.slice().sort((a, b) => b.length - a.length).map(escRe).join("|");
  const STELLE_RE = new RegExp(`(${BUCH_RE}) (\\d+)(?:-(\\d+))?(?:, ?(\\d+(?:-\\d+)?))?`, "g");

  function zerlege(text) {
    // Ergebnis: { einleitung: [bloecke], abschnitte: [{titel, id, bloecke}] }
    const zeilen = (text || "").replace(/\r/g, "").split("\n");
    const erg = { einleitung: [], abschnitte: [] };
    let ziel = erg.einleitung;
    let absatz = null, bibel = null, geschichte = null, kern = null;
    const schliessen = () => {
      if (absatz) ziel.push({ typ: "absatz", text: absatz.join(" ") });
      if (kern) ziel.push({ typ: "kern", text: kern.join(" ") });
      if (bibel) ziel.push(bibel);
      if (geschichte) ziel.push(geschichte);
      absatz = bibel = geschichte = kern = null;
    };
    for (const roh of zeilen) {
      const z = roh.trim();
      if (!z) { schliessen(); continue; }
      if (z.startsWith("## ")) {
        schliessen();
        const titel = z.slice(3).trim();
        const abschnitt = { titel, id: kennung(titel), bloecke: [] };
        erg.abschnitte.push(abschnitt);
        ziel = abschnitt.bloecke;
        continue;
      }
      if (z.startsWith(">")) {
        const inhalt = z.replace(/^>\s?/, "");
        if (!bibel) { schliessen(); bibel = { typ: "bibel", stelle: inhalt, verse: [], ...zerlegeStelle(inhalt) }; continue; }
        const m = inhalt.match(/^(\d+(?:-\d+)?),?\s+(.*)$/);
        bibel.verse.push(m ? { n: m[1], text: m[2] } : { n: "", text: inhalt });
        continue;
      }
      if (z.startsWith("|")) {
        if (!geschichte) { schliessen(); geschichte = { typ: "geschichte", zeilen: [] }; }
        geschichte.zeilen.push(z.replace(/^\|\s?/, ""));
        continue;
      }
      if (z.startsWith("!!")) { schliessen(); kern = [z.replace(/^!!\s?/, "")]; continue; }
      if (z.startsWith("- ")) { schliessen(); ziel.push({ typ: "beispiel", text: z.slice(2) }); continue; }
      if (kern) { kern.push(z); continue; }
      if (bibel || geschichte) schliessen();
      (absatz ||= []).push(z);
    }
    schliessen();
    return erg;
  }

  const kennung = (s) =>
    s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ---------- 3. Aufbereiten ---------- */
  let alleThemen = [];
  let kerne = [];
  let suchIndex = [];

  function zerlegeStelle(text) {
    // "1. Petrus 2, 21-24" -> { buch, kap, bereich }
    const m = text.match(new RegExp(`^(${BUCH_RE}) (\\d+)(?:, ?(\\d+(?:-\\d+)?))?$`));
    return m ? { buch: m[1], kap: m[2], bereich: m[3] || "" } : {};
  }

  function aufbereiten() {
    for (const k of daten.kapitel) {
      k.themenListe = k.themenObjekte.map((t) => {
        const inhalt = zerlege(t.text);
        const leer = !inhalt.einleitung.length && !inhalt.abschnitte.length;
        return {
          ...t, inhalt, kapitel: k,
          slug: t._datei || kennung(t.titel),
          entwurf: leer,
          inArbeit: leer || (t.status || "").toLowerCase() === "in arbeit",
        };
      });
    }
    alleThemen = daten.kapitel.flatMap((k) => k.themenListe);
    kerne = alleThemen.flatMap((t) =>
      t.inhalt.abschnitte.flatMap((a) => a.bloecke.filter((b) => b.typ === "kern" && b.text.length < 220).map((b) => ({ text: b.text, thema: t })))
    );
    suchIndex = alleThemen.map((t) => ({
      thema: t,
      heu: [t.titel, t.frage || "", t.text || ""].join(" ").toLowerCase(),
    }));
    starte();
  }

  // Verse einer Stelle in einer Übersetzung: [{n, text}] oder null
  function versFuer(buch, kap, bereich, bibel = aktuelleBibel) {
    const kapitel = bibel?.verse?.[`${buch} ${kap}`];
    if (!kapitel) return null;
    const alle = Object.entries(kapitel).map(([n, text]) => ({ n, text })).sort((a, b) => a.n - b.n);
    if (!bereich) return alle.length ? alle : null;
    const [a, b] = bereich.split("-").map(Number);
    const treffer = alle.filter((v) => Number(v.n) >= a && Number(v.n) <= (b || a));
    return treffer.length ? treffer : null;
  }
  const irgendwoVorhanden = (buch, kap, bereich) => daten.bibeln.some((b) => versFuer(buch, kap, bereich, b));

  /* ---------- 4. HTML-Bausteine ---------- */
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const ICON = {
    suche: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    mond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    sonne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    menue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    zu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    pfeil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    zurueck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px;vertical-align:-3px"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    vor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px;vertical-align:-3px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  function textZeile(roh) {
    // escapen, dann **fett**, *kursiv*, Bibelstellen
    let s = esc(roh);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");
    return s.replace(STELLE_RE, (ganz, buch, kap, kapBis, bereich) => {
      const verse = kapBis ? null : irgendwoVorhanden(buch, kap, bereich);
      if (!verse) return `<span class="stelle-ohne" style="color:var(--blau)">${ganz}</span>`;
      return `<span role="button" tabindex="0" class="stelle" data-buch="${esc(buch)}" data-kap="${kap}" data-bereich="${bereich || ""}">${ganz}</span>`;
    });
  }

  function block(b, gedicht) {
    switch (b.typ) {
      case "absatz": return `<p class="absatz">${textZeile(b.text)}</p>`;
      case "kern": return `<aside class="kern"><p class="label">Kernaussage</p><p>${textZeile(b.text)}</p></aside>`;
      case "bibel": return `<figure class="bibel" data-stelle="${esc(b.stelle)}">${bibelInnen(b)}</figure>`;
      case "geschichte":
        if (gedicht) {
          const strophen = [];
          for (let i = 0; i < b.zeilen.length; i += 4) strophen.push(b.zeilen.slice(i, i + 4));
          return `<div class="gedicht">${strophen.map((s) => `<div>${s.map((z) => `<p>${esc(z)}</p>`).join("")}</div>`).join("")}</div>`;
        }
        return `<div class="geschichte">${b.zeilen.map((z) => `<p>${textZeile(z)}</p>`).join("")}</div>`;
      case "beispiel": {
        const i = b.text.indexOf(": ");
        return i > 0
          ? `<p class="absatz"><strong>${esc(b.text.slice(0, i))}:</strong> ${textZeile(b.text.slice(i + 2))}</p>`
          : `<p class="absatz">${textZeile(b.text)}</p>`;
      }
      default: return "";
    }
  }

  function wechsler() {
    if (daten.bibeln.length < 2) return "";
    return `<div class="wechsler" role="group" aria-label="Bibelübersetzung">${daten.bibeln.map((u) =>
      `<button type="button" data-bibel="${esc(u.id)}" aria-pressed="${u === aktuelleBibel}">${esc(u.name)}</button>`).join("")}</div>`;
  }

  function bibelInnen(b) {
    // Eigener Wortlaut direkt im Thema (alte Schreibweise mit Versen) hat Vorrang
    const eigen = b.verse.length ? b.verse : null;
    const verse = eigen || (b.buch ? versFuer(b.buch, b.kap, b.bereich) : null);
    const text = verse
      ? `<blockquote>${verse.map((v) => `<span class="vers">${esc(v.n)}</span>${esc(v.text)} `).join("")}</blockquote>`
      : `<p class="bibel-fehlt">In dieser Übersetzung ist die Stelle noch nicht hinterlegt.</p>`;
    return `
      <div class="bibel-kopf"><figcaption>${esc(b.stelle)}</figcaption>${eigen ? "" : wechsler()}</div>
      ${text}
      ${!eigen && aktuelleBibel ? `<p class="bibel-quelle">${esc(aktuelleBibel.quelle || aktuelleBibel.name)}</p>` : ""}`;
  }

  const themaLink = (t) => `#/t/${t.kapitel.id}/${t.slug}`;
  const kapitelLink = (k) => (k.themenListe.length === 1 ? themaLink(k.themenListe[0]) : `#/k/${k.id}`);
  const marke = (k, text, klein) => `<span class="kapitelmarke${klein ? " marke-klein" : ""}" style="--kapitel:${esc(k.farbe || "var(--blau)")}">${esc(text)}</span>`;
  const abzeichen = (t) => (t.inArbeit ? ` <span class="abzeichen">in Arbeit</span>` : "");
  const frageText = (t) => (t.frage ? `„${esc(t.frage)}“` : "");

  function anriss(t) {
    const b = [...t.inhalt.einleitung, ...t.inhalt.abschnitte.flatMap((a) => a.bloecke)].find((x) => ["absatz", "geschichte", "bibel"].includes(x.typ));
    if (!b) return "";
    if (b.typ === "geschichte") return b.zeilen.join(" ");
    if (b.typ === "bibel") return (b.verse.length ? b.verse : versFuer(b.buch, b.kap, b.bereich) || []).map((v) => v.text).join(" ");
    return b.text;
  }

  /* ---------- 5. Seiten ---------- */
  function seiteStart() {
    const [erstes, ...rest] = daten.kapitel;
    const tag = Math.floor(Date.now() / 86400000);
    const raster = rest.filter((k) => k.themenListe.length >= 3);
    const kompakt = rest.filter((k) => k.themenListe.length < 3);
    return `
      <div class="seite">
        <section class="einband">
          <div class="einband-rahmen"><div class="einband-innen">
            <div>
              <p class="label">Ein persönlicher Wegweiser</p>
              <h1 class="titel glanz">Fundamente<br>des Glaubens</h1>
              <p class="untertitel">Bibelstellen und Antworten auf Fragen zum Glauben, festgehalten, um immer wieder darauf zurückgreifen zu können.</p>
              <div class="einband-knoepfe">
                <button type="button" class="knopf-hell" data-aktion="suche">${ICON.suche} Wonach suchst du?</button>
                ${daten.vorwort ? `<a class="knopf-umriss" href="#/vorwort">Vorwort lesen</a>` : ""}
              </div>
            </div>
            ${kerne.length ? `<div class="gedanke" data-index="${tag % kerne.length}">${gedankeHtml(tag % kerne.length)}</div>` : ""}
          </div></div>
        </section>

        ${erstes ? `
        <section class="bereich"><div class="breit">
          ${marke(erstes, erstes.titel)}
          <div class="raster raster-2">
            ${erstes.themenListe.map((t) => `
              <a class="frage-eintrag" href="${themaLink(t)}">
                <span class="oben">${esc(t.titel)}${abzeichen(t)}</span>
                <span class="frage-text">${frageText(t) || esc(t.titel)}</span>
                ${!t.inArbeit && t.inhalt.abschnitte.length > 1 ? `<span class="mehr">${t.inhalt.abschnitte.length} Antworten ${ICON.pfeil}</span>` : ""}
              </a>`).join("")}
          </div>
        </div></section>` : ""}

        ${raster.map((k) => `
        <section class="bereich getoent"><div class="breit">
          ${marke(k, k.titel)}
          <div class="raster raster-3">
            ${k.themenListe.map((t) => `
              <a class="anriss" href="${themaLink(t)}">
                <span class="anriss-titel">${esc(t.titel)}${abzeichen(t)}</span>
                <span class="anriss-text">${esc(anriss(t))}</span>
              </a>`).join("")}
          </div>
        </div></section>`).join("")}

        ${kompakt.length ? `
        <section class="bereich"><div class="breit spalten-3">
          ${kompakt.map((k) => `
            <div class="liste">
              ${marke(k, k.kurz)}
              ${k.themenListe.map((t) => `<a class="liste-eintrag" href="${themaLink(t)}">${esc(t.titel)}${abzeichen(t)}</a>`).join("")}
            </div>`).join("")}
        </div></section>` : ""}
      </div>`;
  }

  function gedankeHtml(i) {
    const k = kerne[i];
    return `
      <p class="label">Gedanke für heute</p>
      <p class="gedanke-text seite">${textZeile(k.text)}</p>
      <div class="gedanke-fuss">
        <a href="${themaLink(k.thema)}">${marke(k.thema.kapitel, k.thema.titel, true)}</a>
        <button type="button" class="knopf-klein" data-aktion="naechster-gedanke">Nächster Gedanke</button>
      </div>`;
  }

  function seiteKapitel(k) {
    const einl = zerlege(k.einleitung || "");
    return `
      <div class="seite artikel"><div class="spalte">
        ${marke(k, "Kapitel")}
        <h1>${esc(k.titel)}</h1>
        ${einl.einleitung.length ? `<div class="fluss einleitung">${einl.einleitung.map((b) => block(b)).join("")}</div>` : ""}
        <div class="abschnitte">
          ${k.themenListe.map((t) => `
            <a class="frage-eintrag" href="${themaLink(t)}">
              <span class="anriss-titel" style="font-size:2rem">${esc(t.titel)}${abzeichen(t)}</span>
              ${t.frage ? `<span class="frage-text" style="font-size:1.3rem;color:var(--gedaempft)">${frageText(t)}</span>` : ""}
            </a>`).join("")}
        </div>
      </div></div>`;
  }

  function seiteThema(t, modus) {
    const i = alleThemen.indexOf(t);
    const vor = alleThemen[i - 1], nach = alleThemen[i + 1];
    const { einleitung, abschnitte } = t.inhalt;
    const kernAbschnitte = abschnitte.filter((a) => a.bloecke.some((b) => b.typ === "kern"));
    const kannKurz = kernAbschnitte.length > 1;
    const kurz = modus === "kern" && kannKurz;
    const gedicht = t.darstellung === "gedicht";
    return `
      <article class="seite artikel"><div class="spalte">
        <div class="band-halter" aria-hidden="true"><div class="band"></div></div>
        <a href="${kapitelLink(t.kapitel)}">${marke(t.kapitel, t.kapitel.kurz)}</a>
        <h1>${esc(t.titel)}</h1>
        ${t.inArbeit && !t.entwurf ? `<p style="margin:1rem 0 0"><span class="abzeichen">in Arbeit</span></p>` : ""}
        ${t.frage ? `<p class="leitfrage">${frageText(t)}</p>` : ""}
        ${t.entwurf ? `<div class="leer"><strong>Noch in Arbeit</strong><span>Hier fehlen noch Gedanken und Bibelstellen.</span></div>` : `
          ${kannKurz ? `
          <div class="inhalt-kasten">
            <div class="zeile">
              <p class="label">${abschnitte.length} Antworten</p>
              <div class="umschalter" role="group" aria-label="Darstellung">
                <button type="button" data-modus="voll" aria-pressed="${!kurz}">Ganzer Text</button>
                <button type="button" data-modus="kern" aria-pressed="${kurz}">Nur Kernaussagen</button>
              </div>
            </div>
            <ol class="sprungliste">${abschnitte.map((a) => `<li><button type="button" data-sprung="${a.id}">${esc(a.titel)}</button></li>`).join("")}</ol>
          </div>` : ""}
          ${einleitung.length && !kurz ? `<div class="fluss einleitung">${einleitung.map((b) => block(b, gedicht)).join("")}</div>` : ""}
          <div class="abschnitte${kurz ? " kurz" : ""}">
            ${abschnitte.map((a) => kurz
              ? `<section class="abschnitt" id="${a.id}"><h2>${esc(a.titel)}</h2>${a.bloecke.filter((b) => b.typ === "kern").map((b) => block(b)).join("")}</section>`
              : `<section class="abschnitt" id="${a.id}"><h2>${esc(a.titel)}</h2>${a.bloecke.map((b) => block(b, gedicht)).join("")}</section>`
            ).join("")}
          </div>`}
        <nav class="blaettern" aria-label="Weiterblättern">
          ${vor ? `<a href="${themaLink(vor)}"><span class="richtung">${ICON.zurueck} Zurück</span><span class="ziel">${esc(vor.titel)}</span></a>` : ""}
          ${nach ? `<a class="weiter" href="${themaLink(nach)}"><span class="richtung">Weiter ${ICON.vor}</span><span class="ziel">${esc(nach.titel)}</span></a>` : ""}
        </nav>
      </div></article>`;
  }

  function seiteVorwort() {
    const z = zerlege(daten.vorwort);
    const erstes = alleThemen[0];
    return `
      <article class="seite brief"><div class="spalte">
        <p class="label">Vorwort</p>
        <h1>Warum es diese Seite gibt</h1>
        <div class="fluss">${z.einleitung.map((b) => block(b)).join("")}</div>
        ${erstes ? `<div class="brief-fuss"><a class="knopf-blau" href="${themaLink(erstes)}">Mit der ersten Frage beginnen ${ICON.vor}</a></div>` : ""}
      </div></article>`;
  }

  /* ---------- 6. Rahmen: Kopf, Register, Fuß ---------- */
  function rahmen() {
    const dunkel = document.documentElement.classList.contains("dark");
    return `
      <header class="kopf">
        <a class="marke" href="#/">Fundamente des Glaubens</a>
        <div class="kopf-aktionen">
          ${daten.vorwort ? `<a class="knopf-geist nur-breit" href="#/vorwort">Vorwort</a>` : ""}
          <button type="button" class="knopf-geist" data-aktion="suche" aria-label="Suchen">${ICON.suche}<span class="nur-breit">Suchen</span></button>
          <button type="button" class="knopf-geist" data-aktion="modus" aria-label="${dunkel ? "Heller Modus" : "Dunkler Modus"}">${dunkel ? ICON.sonne : ICON.mond}</button>
          <button type="button" class="knopf-geist nur-mobil" data-aktion="menue" aria-label="Inhalt">${ICON.menue}</button>
        </div>
      </header>
      <nav class="register" aria-label="Kapitel"></nav>
      <main id="inhalt"></main>
      <footer class="fuss"><div class="breit">
        <p><strong>Private, persönliche Website</strong>Diese Seite ist ein rein privates Projekt. Sie ist kein Angebot einer Kirche, Gemeinde oder Glaubensgemeinschaft, steht mit keiner in Verbindung und wird von keiner verantwortet. Alle Inhalte geben ausschließlich meine persönliche Sicht wieder.</p>
        <div class="links">
          ${daten.vorwort ? `<a href="#/vorwort">Vorwort</a>` : ""}
          <a href="impressum.html">Impressum</a>
          <a href="datenschutz.html">Datenschutz</a>
        </div>
      </div></footer>`;
  }

  function register(aktivId) {
    document.querySelector(".register").innerHTML = daten.kapitel.map((k) => `
      <a class="reiter${k.id === aktivId ? " aktiv" : ""}" href="${kapitelLink(k)}" style="--kapitel:${esc(k.farbe || "var(--blau)")}"${k.id === aktivId ? ' aria-current="page"' : ""}>
        <span class="kante" aria-hidden="true"></span><span>${esc(k.kurz || k.titel)}</span>
      </a>`).join("");
  }

  /* ---------- 7. Navigation ---------- */
  let modus = "voll";
  function route() {
    const teile = location.hash.replace(/^#\/?/, "").split("/");
    if (teile[0] === "t") {
      const t = alleThemen.find((x) => x.kapitel.id === teile[1] && x.slug === teile[2]);
      if (t) return { art: "thema", t };
    }
    if (teile[0] === "k") {
      const k = daten.kapitel.find((x) => x.id === teile[1]);
      if (k) return { art: "kapitel", k };
    }
    if (teile[0] === "vorwort") return { art: "vorwort" };
    return { art: "start" };
  }

  function zeichne(scrollen = true) {
    const r = route();
    const main = document.getElementById("inhalt");
    main.innerHTML =
      r.art === "thema" ? seiteThema(r.t, modus) :
      r.art === "kapitel" ? seiteKapitel(r.k) :
      r.art === "vorwort" ? seiteVorwort() : seiteStart();
    register(r.art === "thema" ? r.t.kapitel.id : r.art === "kapitel" ? r.k.id : null);
    document.title = r.art === "thema" ? `${r.t.titel} · Fundamente des Glaubens` : "Fundamente des Glaubens";
    schliesseBlase();
    if (scrollen) window.scrollTo(0, 0);
    band();
  }

  /* ---------- 8. Interaktion ---------- */
  let blase = null;
  function schliesseBlase() { if (blase) { blase.remove(); blase = null; } }
  function fuelleBlase() {
    const k = blase._von;
    const verse = versFuer(k.dataset.buch, k.dataset.kap, k.dataset.bereich);
    blase.innerHTML = `
      <p class="label">${esc(k.textContent)}</p>
      ${verse ? verse.map((v) => `<p><span class="vers">${esc(v.n)}</span>${esc(v.text)}</p>`).join("") : `<p class="bibel-fehlt">In dieser Übersetzung noch nicht hinterlegt.</p>`}
      <div class="blase-fuss">${wechsler()}</div>
      ${aktuelleBibel ? `<p class="bibel-quelle">${esc(aktuelleBibel.quelle || aktuelleBibel.name)}</p>` : ""}`;
  }

  function wechsleBibel(id) {
    const neu = daten.bibeln.find((b) => b.id === id);
    if (!neu || neu === aktuelleBibel) return;
    aktuelleBibel = neu;
    try { localStorage.setItem("fdg-bibel", id); } catch (e) {}
    // alle Zitate auf der Seite neu füllen, ohne die Seite neu aufzubauen
    const r = route();
    if (r.art === "thema") {
      const bloecke = [...r.t.inhalt.einleitung, ...r.t.inhalt.abschnitte.flatMap((a) => a.bloecke)].filter((b) => b.typ === "bibel");
      document.querySelectorAll(".bibel[data-stelle]").forEach((el) => {
        const b = bloecke.find((x) => x.stelle === el.dataset.stelle);
        if (b) el.innerHTML = bibelInnen(b);
      });
    }
    if (blase) fuelleBlase();
  }

  function zeigeBlase(knopf) {
    schliesseBlase();
    blase = document.createElement("div");
    blase.className = "blase";
    blase.setAttribute("role", "dialog");
    blase._von = knopf;
    fuelleBlase();
    document.body.appendChild(blase);
    const r = knopf.getBoundingClientRect();
    const breite = blase.offsetWidth;
    const links = Math.min(Math.max(16, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - breite - 16);
    blase.style.left = `${links}px`;
    blase.style.top = `${r.bottom + window.scrollY + 8}px`;
  }

  function band() {
    const el = document.querySelector(".band");
    if (!el) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    el.style.height = `calc(48px + ${p} * (100vh - 200px))`;
  }

  function suche() {
    const schleier = document.createElement("div");
    schleier.className = "schleier";
    schleier.innerHTML = `<div class="suche" role="dialog" aria-label="Suchen"><input type="search" placeholder="Frage, Thema oder Stichwort …" aria-label="Suchbegriff"><div class="treffer"></div></div>`;
    document.body.appendChild(schleier);
    const eingabe = schleier.querySelector("input");
    const liste = schleier.querySelector(".treffer");
    let markiert = 0;
    const zu = () => { schleier.remove(); document.removeEventListener("keydown", tasten, true); };
    const aktualisiere = () => {
      const woerter = eingabe.value.toLowerCase().split(/\s+/).filter(Boolean);
      const treffer = suchIndex.filter((e) => woerter.every((w) => e.heu.includes(w))).map((e) => e.thema);
      markiert = 0;
      if (!treffer.length) { liste.innerHTML = `<div class="nichts">Nichts gefunden.</div>`; return; }
      liste.innerHTML = daten.kapitel.map((k) => {
        const hier = treffer.filter((t) => t.kapitel === k);
        if (!hier.length) return "";
        return `<div class="gruppe">${esc(k.kurz || k.titel)}</div>` + hier.map((t) => `
          <a href="${themaLink(t)}"><span class="t1">${esc(t.titel)}</span>${t.frage ? `<span class="t2">${esc(t.frage)}</span>` : ""}</a>`).join("");
      }).join("");
      markiere();
    };
    const markiere = () => liste.querySelectorAll("a").forEach((a, i) => a.classList.toggle("markiert", i === markiert));
    const tasten = (e) => {
      const links = liste.querySelectorAll("a");
      if (e.key === "Escape") { e.preventDefault(); zu(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); markiert = Math.min(markiert + 1, links.length - 1); markiere(); links[markiert]?.scrollIntoView({ block: "nearest" }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); markiert = Math.max(markiert - 1, 0); markiere(); links[markiert]?.scrollIntoView({ block: "nearest" }); }
      else if (e.key === "Enter" && links[markiert]) { e.preventDefault(); location.hash = links[markiert].getAttribute("href"); zu(); }
    };
    document.addEventListener("keydown", tasten, true);
    schleier.addEventListener("click", (e) => { if (e.target === schleier || e.target.closest("a")) zu(); });
    eingabe.addEventListener("input", aktualisiere);
    aktualisiere();
    eingabe.focus();
  }

  function menue() {
    const r = route();
    const schleier = document.createElement("div");
    schleier.className = "schleier";
    schleier.style.padding = "0";
    schleier.innerHTML = `
      <div class="menue" role="dialog" aria-label="Inhalt">
        <button type="button" class="knopf-geist schliessen" aria-label="Schließen">${ICON.zu}</button>
        <h2>Inhalt</h2>
        <nav>
          ${daten.vorwort ? `<a class="eintrag" href="#/vorwort">Vorwort</a>` : ""}
          ${daten.kapitel.map((k) => `
            <div class="gruppe">${marke(k, k.kurz || k.titel)}
              ${k.themenListe.map((t) => `<a class="eintrag${r.t === t ? " aktiv" : ""}" href="${themaLink(t)}">${esc(t.titel)}</a>`).join("")}
            </div>`).join("")}
        </nav>
      </div>`;
    document.body.appendChild(schleier);
    schleier.addEventListener("click", (e) => { if (e.target === schleier || e.target.closest("a") || e.target.closest(".schliessen")) schleier.remove(); });
  }

  function starte() {
    const app = document.getElementById("app");
    app.innerHTML = rahmen();

    document.addEventListener("click", (e) => {
      const wahl = e.target.closest("[data-bibel]");
      if (wahl) { e.preventDefault(); wechsleBibel(wahl.dataset.bibel); return; }
      const stelle = e.target.closest(".stelle");
      if (stelle) { e.preventDefault(); blase && blase._von === stelle ? schliesseBlase() : zeigeBlase(stelle); return; }
      if (blase && !e.target.closest(".blase")) schliesseBlase();

      const aktion = e.target.closest("[data-aktion]")?.dataset.aktion;
      if (aktion === "suche") return suche();
      if (aktion === "menue") return menue();
      if (aktion === "modus") {
        const dunkel = document.documentElement.classList.toggle("dark");
        localStorage.setItem("fdg-modus", dunkel ? "dunkel" : "hell");
        const k = e.target.closest("[data-aktion]");
        k.innerHTML = dunkel ? ICON.sonne : ICON.mond;
        k.setAttribute("aria-label", dunkel ? "Heller Modus" : "Dunkler Modus");
        return;
      }
      if (aktion === "naechster-gedanke") {
        const box = document.querySelector(".gedanke");
        const i = (Number(box.dataset.index) + 1) % kerne.length;
        box.dataset.index = i;
        box.innerHTML = gedankeHtml(i);
        return;
      }
      const m = e.target.closest("[data-modus]");
      if (m) { modus = m.dataset.modus; zeichne(false); return; }
      const sprung = e.target.closest("[data-sprung]");
      if (sprung) { document.getElementById(sprung.dataset.sprung)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (!document.querySelector(".suche")) suche(); }
      if (e.key === "Escape") schliesseBlase();
      if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("stelle")) { e.preventDefault(); e.target.click(); }
    });
    window.addEventListener("hashchange", () => { modus = "voll"; zeichne(); });
    window.addEventListener("scroll", band, { passive: true });
    window.addEventListener("resize", () => { band(); schliesseBlase(); });
    zeichne(false);
  }

  ladeAlles();
})();
