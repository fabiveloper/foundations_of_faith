#!/usr/bin/env python3
"""
Holt fehlende Bibelverse automatisch und trägt sie in inhalte/bibel/*.js ein.

So benutzen (im Hauptordner der Website):
    python werkzeuge/verse-holen.py

Das Skript sucht in allen Themen-Dateien nach Bibelzitaten ("> Römer 8, 28")
und Bibelstellen im Text ("(Hiob 1, 8)"), prüft, welche Verse in den
Übersetzungsdateien noch fehlen, und lädt nur diese nach.
Quelle: api.midvash.com (freie, gemeinfreie Übersetzungen). Nur Python, keine Pakete.
Die Website selbst lädt später nichts aus dem Internet; die Verse liegen dann lokal.
"""
import json, os, re, sys, time, urllib.request, urllib.error

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(WURZEL, "inhalte")
API = "https://api.midvash.com/v1"

BUECHER = ["1. Mose","2. Mose","3. Mose","4. Mose","5. Mose","Josua","Richter","Rut","1. Samuel","2. Samuel","1. Könige","2. Könige","1. Chronik","2. Chronik","Esra","Nehemia","Ester","Hiob","Psalm","Sprüche","Prediger","Hoheslied","Jesaja","Jeremia","Klagelieder","Hesekiel","Daniel","Hosea","Joel","Amos","Obadja","Jona","Micha","Nahum","Habakuk","Zefanja","Haggai","Sacharja","Maleachi","Matthäus","Markus","Lukas","Johannes","Apostelgeschichte","Römer","1. Korinther","2. Korinther","Galater","Epheser","Philipper","Kolosser","1. Thessalonicher","2. Thessalonicher","1. Timotheus","2. Timotheus","Titus","Philemon","1. Petrus","2. Petrus","1. Johannes","2. Johannes","3. Johannes","Hebräer","Jakobus","Judas","Offenbarung"]
SONDER = {"1. Mose": "genesis", "2. Mose": "exodus", "3. Mose": "levitikus", "4. Mose": "numeri", "5. Mose": "deuteronomium", "Psalm": "psalmen"}
BUCH_RE = "|".join(re.escape(b) for b in sorted(BUECHER, key=len, reverse=True))
ZITAT_RE = re.compile(rf"^>\s*({BUCH_RE}) (\d+), ?(\d+)(?:-(\d+))?\s*$", re.M)
STELLE_RE = re.compile(rf"({BUCH_RE}) (\d+), ?(\d+)(?:-(\d+))?")


def slug(buch):
    if buch in SONDER:
        return SONDER[buch]
    s = buch.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"^(\d)\. ", r"\1-", s).replace(" ", "-")


def lies_uebersetzung(pfad):
    text = open(pfad, encoding="utf-8").read()
    start = text.rindex("Inhalt.uebersetzung(") + len("Inhalt.uebersetzung(")
    ende = text.rindex(");")
    return text[:start], json.loads(text[start:ende]), text[ende:]


def schreibe_uebersetzung(pfad, kopf, daten, fuss):
    for kap in daten["verse"]:
        daten["verse"][kap] = dict(sorted(daten["verse"][kap].items(), key=lambda x: int(x[0])))
    with open(pfad, "w", encoding="utf-8") as f:
        f.write(kopf + json.dumps(daten, ensure_ascii=False, indent=2) + fuss)


def benoetigte_stellen():
    stellen = set()
    for ordner, _, dateien in os.walk(INHALTE):
        if os.path.basename(ordner) == "bibel":
            continue
        for name in dateien:
            if not name.endswith(".js") or name.startswith("_"):
                continue
            text = open(os.path.join(ordner, name), encoding="utf-8").read()
            for m in list(ZITAT_RE.finditer(text)) + list(STELLE_RE.finditer(text)):
                buch, kap, a, b = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4) or m.group(3))
                stellen.add((buch, kap, a, b))
    return sorted(stellen)


def hole(api, buch, kap, a, b):
    url = f"{API}/{api}/{slug(buch)}/{kap}/{a}" + (f"-{b}" if b != a else "")
    req = urllib.request.Request(url, headers={"User-Agent": "fundamente-des-glaubens/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.load(r)["data"]
    return {str(d["verse"] + i): v.strip().rstrip(" -").strip() for i, v in enumerate(d["verses"])}


def main():
    liste = re.search(r"Inhalt\.bibeln\(\[(.*?)\]\)", open(os.path.join(INHALTE, "inhalt.js"), encoding="utf-8").read(), re.S)
    ids = re.findall(r'"([^"]+)"', liste.group(1)) if liste else []
    stellen = benoetigte_stellen()
    print(f"{len(stellen)} Bibelstellen in den Themen gefunden.")
    for uid in ids:
        pfad = os.path.join(INHALTE, "bibel", f"{uid}.js")
        kopf, daten, fuss = lies_uebersetzung(pfad)
        neu = 0
        for buch, kap, a, b in stellen:
            vorhanden = daten["verse"].get(f"{buch} {kap}", {})
            if all(str(n) in vorhanden for n in range(a, b + 1)):
                continue
            try:
                verse = hole(daten["api"], buch, kap, a, b)
            except (urllib.error.URLError, KeyError, ValueError) as e:
                print(f"  {daten['name']}: {buch} {kap}, {a}-{b} nicht gefunden ({e})")
                continue
            daten["verse"].setdefault(f"{buch} {kap}", {}).update(verse)
            neu += len(verse)
            time.sleep(0.2)
        schreibe_uebersetzung(pfad, kopf, daten, fuss)
        print(f"{daten['name']}: {neu} Verse ergänzt.")
    print("Fertig. Seite neu laden.")


if __name__ == "__main__":
    sys.exit(main())
