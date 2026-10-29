/*
  INHALTSVERZEICHNIS
  ==================
  Hier stehen alle Kapitel in der Reihenfolge, in der sie auf der Seite erscheinen.
  "themen" listet die Dateien im Ordner inhalte/<id>/ (ohne ".js"), in der gewünschten Reihenfolge.

  Neues Thema hinzufügen:
    1. Datei inhalte/_vorlage.js kopieren, z. B. nach inhalte/fragen/mein-thema.js
    2. Den Dateinamen ("mein-thema") hier unten in die passende "themen"-Liste eintragen.
  Fertig. Seite neu laden.

  Neues Kapitel: einen Block "Inhalt.kapitel({ ... })" kopieren, eine neue "id" vergeben,
  einen Ordner inhalte/<id>/ anlegen und dort die Themen-Dateien ablegen.
  "kurz" ist die Beschriftung im Register am rechten Rand, "farbe" der kleine Farbakzent.
*/

// Bibelübersetzungen: Dateien in inhalte/bibel/. Die erste ist die Standard-Übersetzung,
// beim Zitat kann man live zwischen allen umschalten.
Inhalt.bibeln(["schlachter-1951", "elberfelder-1905", "luther-1912"]);

Inhalt.kapitel({
  id: "fragen",
  farbe: "#484397",
  kurz: "Fragen",
  titel: "Biblische Perspektiven auf existenzielle Fragen",
  einleitung: `Der christliche Glaube muss sich gerade in den Krisen des Lebens bewähren. In diesem Abschnitt werden die schwierigsten Fragen der Menschheit direkt mit der Bibel beantwortet. Dabei zeigt sich: Gott weicht unseren Fragen nicht aus, sondern gibt uns Halt und Hoffnung inmitten einer zerbrochenen Welt.`,
  themen: [
    "theodizee",
    "leid-unschuldiger",
    "unerhoerte-gebete",
    "deus-absconditus",
    "praedestination",
    "schoepfung",
    "fuelle-der-zeit",
  ],
});

Inhalt.kapitel({
  id: "jesus",
  farbe: "#814697",
  kurz: "Jesus",
  titel: "Jesus Christus – Leben auf der Erde",
  einleitung: ``,
  themen: [
    "nathanael",
  ],
});

Inhalt.kapitel({
  id: "gleichnisse",
  farbe: "#3AA932",
  kurz: "Gleichnisse",
  titel: "Gleichnisse von Jesus",
  einleitung: `In diesem Kapitel gehe ich auf verschiedene Gleichnisse ein, die Jesus seinen Jüngern damals zum besseren Verständnis der Nächstenliebe und anderer Verhaltensweisen vorgestellt hat.`,
  themen: [
    "reicher-kornbauer",
  ],
});

Inhalt.kapitel({
  id: "alltag",
  farbe: "#00ABC3",
  kurz: "Alltag",
  titel: "Spuren des Glaubens im Spiegel der Welt",
  einleitung: `Biblische Wahrheiten lassen sich oft auf verblüffende Weise in der Realität und in Biografien bedeutender Persönlichkeiten wiederfinden. Diese Beispiele aus Geschichte, Politik, Wissenschaft, Technik und Sport zeigen, dass christliche Prinzipien wie Hoffnung und Ausdauer universelle Gesetzmäßigkeiten sind, die auch heute noch in der Welt sichtbar werden.`,
  themen: [
    "knopf-im-ohr",
    "scheitern",
    "zentripetalkraft",
    "fussspuren",
    "zwei-woelfe",
    "seidenteppich",
    "kaputter-krug",
    "wissen",
  ],
});

Inhalt.kapitel({
  id: "buecher",
  farbe: "#E22086",
  kurz: "Bücher",
  titel: "Die Reihenfolge der Bücher in der Luther-Bibel",
  einleitung: ``,
  themen: [
    "reihenfolge",
  ],
});
