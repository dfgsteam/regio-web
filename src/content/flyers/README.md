# Flyer-Anpassungen für einzelne Termine

In diesem Ordner können individuelle Texte und Einstellungen für einzelne Flyer hinterlegt werden.

## Funktionsweise
1. Standardmäßig ziehen alle Flyer ihre Texte automatisch aus den Vorlagen in `src/data/flyer-templates.json` (Aktionswochenende, Sterntreffen, Zeltlager, Standard).
2. Möchtest du für einen bestimmten Termin (z. B. `actionwochenende-1-2026` oder `sterntreffen-2026`) individuelle Texte oder geänderte Highlights hinterlegen, erstelle hier einfach eine Datei mit dem Slug des Termins:
   `src/content/flyers/<slug>.json`
3. Alle Felder darin sind optional. Felder, die du nicht angibst, werden automatisch aus dem Termin bzw. der Vorlage übernommen.

## Mögliche Felder
```json
{
  "subtitle": "Individuelle Unterzeile oder Motto",
  "categoryLabel": "Eigene Kategorie (z. B. Jubiläum)",
  "description": "Ausführlicher Beschreibungstext für diesen konkreten Termin...",
  "highlights": [
    {
      "title": "Erster Programmpunkt",
      "desc": "Kurze Erklärung..."
    },
    {
      "title": "Zweiter Programmpunkt",
      "desc": "Kurze Erklärung..."
    },
    {
      "title": "Dritter Programmpunkt",
      "desc": "Kurze Erklärung..."
    }
  ],
  "packingList": [
    "Besondere Ausrüstung",
    "Gummistiefel"
  ],
  "notes": "Besonderer Hinweis für Eltern oder Teilnehmer"
}
```
