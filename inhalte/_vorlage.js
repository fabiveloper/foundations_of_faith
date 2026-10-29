/*
  VORLAGE FÜR EIN NEUES THEMA
  ===========================
  1. Diese Datei kopieren, z. B. nach inhalte/fragen/mein-thema.js
  2. In inhalte/inhalt.js beim passenden Kapitel "mein-thema" in die Liste "themen" eintragen.
  3. Seite neu laden.

  Schreibregeln im Text (zwischen den beiden ` Zeichen):

    Leerzeile               trennt Absätze
    ## Überschrift          beginnt eine neue Antwort / einen neuen Abschnitt
    !! Text                 Kernaussage (farbig hervorgehoben)
    > 1. Petrus 2, 21-24    Bibelzitat: nur die Stelle angeben, der Text kommt
                            automatisch aus den Übersetzungen in inhalte/bibel/
                            (fehlende Verse holt "python werkzeuge/verse-holen.py")
    | Zeile                 Geschichte oder Gedicht (kursiv, Zeile für Zeile)
    - Name: Text            Beispiel mit fettem Namen
    **fett**  *kursiv*      Hervorhebungen im Fließtext

  Bibelstellen im Fließtext wie (Hiob 1, 8) werden automatisch anklickbar,
  sobald der Vers in den Übersetzungsdateien steht.

  Optionale Felder:
    frage: "…"              Die Leitfrage (ohne Anführungszeichen, die kommen automatisch)
    status: "in Arbeit"     Markiert das Thema als unfertig
*/
Inhalt.thema({
  titel: "Titel des Themas",
  frage: "Welche Frage beantwortet dieses Thema?",
  status: "in Arbeit",
  text: `
Ein einleitender Absatz (optional).

## Erste Antwort

Hier steht der Gedanke. Eine Bibelstelle wie (Psalm 23, 2) wird automatisch erkannt.

> Psalm 23, 4

!! Die Kernaussage dieser Antwort in ein, zwei Sätzen.

## Zweite Antwort

Noch ein Gedanke …
`
});
