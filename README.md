# Fundamente des Glaubens

Öffnen: **index.html** doppelklicken. Läuft ohne Installation und ohne Server, in Firefox, Chrome und Edge.

## Ordner

```
index.html            Startdatei, nichts ändern
README.md             diese Anleitung
assets/style.css      Farben, Schriften, Abstände (oben bei :root)
assets/app.js         das Programm, nichts ändern
inhalte/inhalt.js     Inhaltsverzeichnis: Kapitel und Reihenfolge der Themen
inhalte/vorwort.js    das Vorwort
inhalte/bibel/        eine Datei pro Bibelübersetzung (Schlachter 1951, Elberfelder 1905, Luther 1912)
werkzeuge/verse-holen.py   holt fehlende Bibelverse automatisch (optional)
inhalte/_vorlage.js   Vorlage für ein neues Thema
inhalte/<kapitel>/    ein Ordner pro Kapitel, eine Datei pro Thema
```

## Neues Thema in 2 Schritten

1. `inhalte/_vorlage.js` kopieren, z. B. nach `inhalte/fragen/vergebung.js`, und Text eintragen.
2. In `inhalte/inhalt.js` beim Kapitel `fragen` den Namen `"vergebung",` in die Liste `themen` schreiben.

Seite neu laden, fertig. Die Reihenfolge in der Liste ist die Reihenfolge auf der Seite.

## Schreibregeln

| So schreiben            | Ergebnis                                         |
|-------------------------|--------------------------------------------------|
| Leerzeile               | neuer Absatz                                     |
| `## Überschrift`        | neue Antwort / neuer Abschnitt                   |
| `!! Text`               | Kernaussage (hervorgehoben, auch im „Nur Kernaussagen“-Modus) |
| `> Psalm 23, 4`         | Bibelzitat; der Text kommt aus `inhalte/bibel/`, umschaltbar zwischen den Übersetzungen |
| `\| Zeile`              | Geschichte oder Gedicht, kursiv                  |
| `- Name: Text`          | Beispiel mit fettem Namen                        |
| `**fett**`, `*kursiv*`  | Hervorhebung im Fließtext                        |

Bibelstellen im Fließtext wie `(Hiob 1, 8)` werden automatisch anklickbar, sobald der Vers in den Übersetzungsdateien steht.

## Bibelübersetzungen

Bei jedem Zitat und in jedem Bibelstellen-Fenster kann man live zwischen den Übersetzungen umschalten; die Auswahl gilt für die ganze Seite und wird im Browser gemerkt. Die Reihenfolge (und damit die Standard-Übersetzung) steht oben in `inhalte/inhalt.js` bei `Inhalt.bibeln([...])`.

**Neue Verse:** Einfach `> Römer 8, 28` ins Thema schreiben und danach im Hauptordner

```
python werkzeuge/verse-holen.py
```

ausführen. Das Skript findet alle Stellen, die in den Übersetzungsdateien noch fehlen, und lädt nur diese von api.midvash.com nach (freie Bibeltexte, nur Python nötig, keine Pakete). Wer kein Python nutzen will, kann Verse auch von Hand in `inhalte/bibel/<übersetzung>.js` eintragen. Die Website selbst lädt nie etwas aus dem Internet.

**Weitere Übersetzung:** eine Datei in `inhalte/bibel/` kopieren, `id`, `name`, `quelle` und `api` (Kürzel bei api.midvash.com, z. B. `men` für Menge 1939) anpassen, `verse` leeren (`{}`), die `id` in `Inhalt.bibeln([...])` eintragen und das Skript laufen lassen. Nur Übersetzungen verwenden, die gemeinfrei oder frei lizenziert sind.

Optionale Felder pro Thema: `frage: "…"` (Leitfrage, ohne Anführungszeichen) und `status: "in Arbeit"`.

**Wichtig:** Der Text steht zwischen zwei Backticks `` ` ``. Im Text selbst also keinen Backtick verwenden. Titel und Frage stehen in geraden Anführungszeichen `"…"`; darin deutsche „…“ verwenden, keine geraden.

## Neues Kapitel

In `inhalte/inhalt.js` einen `Inhalt.kapitel({ … })`-Block kopieren, neue `id` vergeben (nur Kleinbuchstaben und Bindestriche), Ordner `inhalte/<id>/` anlegen. `kurz` ist die Beschriftung im Register rechts, `farbe` der kleine Farbakzent.

## Rechtliches

`impressum.html` und `datenschutz.html` sind fertig aufgebaut. Alles, was du noch ergänzen musst, ist orange markiert und beginnt mit `Platzhalter:` (Anschrift, zweiter Kontaktweg, GitHub-Angaben, E-Mail-Anbieter, Rechte an „Fußspuren im Sand“). Die Texte sind keine Rechtsberatung.

Die Seite lädt nichts von fremden Servern: Die Schriften liegen in `assets/schriften/`. Gespeichert werden nur die Hell/Dunkel-Auswahl und die gewählte Bibelübersetzung im Browser.

## Veröffentlichen auf GitHub Pages

1. Settings → Pages → Source: GitHub Actions.
2. Settings → Secrets and variables → Actions → Variables entsprechend anpassen
3. Actions → „Publish Fundamente des Glaubens (gated)“ manuell starten.
4. Für die öffentliche Auffindbarkeit: `noindex,nofollow` in den HTML-Dateien entfernen und `robots.txt` auf `Allow: /` stellen.

Die Vorlage `inhalte/_vorlage.js` wird beim Veröffentlichen automatisch weggelassen.
