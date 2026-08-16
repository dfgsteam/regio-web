# SMJ Regio Wegweiser – Website

Die neue, moderne Webpräsenz der **Schönstatt-Mannesjugend (SMJ) Regio Wegweiser** (Diözese Erfurt). Entwickelt als scroll-getriebene Abenteuer-Brand mit starkem Storytelling, interaktiven Expeditions-Elementen, barrierefreier Architektur und DSGVO-konformem Design ohne Tracking.

---

## 🧭 Inhaltsverzeichnis

- [SMJ Regio Wegweiser – Website](#smj-regio-wegweiser--website)
  - [🧭 Inhaltsverzeichnis](#-inhaltsverzeichnis)
  - [🌲 Vision \& Konzept](#-vision--konzept)
  - [⚡ Tech Stack](#-tech-stack)
  - [📁 Projektstruktur](#-projektstruktur)
  - [🚀 Quickstart \& Entwicklung](#-quickstart--entwicklung)
    - [Voraussetzungen](#voraussetzungen)
    - [Installation \& Server starten](#installation--server-starten)
    - [Verfügbare Skripte](#verfügbare-skripte)
  - [📝 Inhalte pflegen](#-inhalte-pflegen)
    - [1. Neues Zeltlager / Kampagne anlegen](#1-neues-zeltlager--kampagne-anlegen)
    - [2. Journal-Beiträge \& News erstellen](#2-journal-beiträge--news-erstellen)
    - [3. Termine \& Events pflegen](#3-termine--events-pflegen)
    - [4. Teammitglieder anpassen](#4-teammitglieder-anpassen)
    - [5. Bilder \& Assets verwalten](#5-bilder--assets-verwalten)
  - [🔒 Datenschutz \& Rechtliches](#-datenschutz--rechtliches)
  - [🚢 CI/CD \& Deployment](#-cicd--deployment)
  - [🔑 Umgebungsvariablen](#-umgebungsvariablen)

---

## 🌲 Vision & Konzept

Die Website positioniert die SMJ Regio Wegweiser primär als **Abenteuermarke** für Jungs im Alter von 9–14 Jahren und sekundär als verlässliche, transparente Plattform für Eltern:

- **Look & Feel:** Outdoor, Expedition, rau, waldgrün, Signal-Orange, topografische Höhenlinien, Filmkorn, Papiertexturen und Stempel.
- **Storytelling:** Die Startseite folgt einer durchgehenden Erzählung (*Hero → Was erwartet dich? → Expedition Reel → Die 5 Säulen → Events → Zeltlager → Eltern → Glaube → Journal → Call to Action*).
- **Zwei Informationsebenen:** Jungs erleben packende Visuals und kurze Claims; Eltern & Interessierte erhalten per Klick tiefe Einblicke (z. B. pädagogische Dossiers der 5 Säulen).

---

## ⚡ Tech Stack

- **Framework:** [Astro 5](https://astro.build/) (Static Site Generation / vorbereitet für Node Hybrid)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + Custom Design Tokens & Texture-Utilities
- **Typografie:** 100 % selbst gehostet über `@fontsource` (*Anton, Inter Variable, Space Mono, Caveat, Kalam*)
- **Animationen:** [GSAP 3](https://gsap.com/) & ScrollTrigger mit sauberer Modul-Trennung und `prefers-reduced-motion`-Unterstützung
- **Content:** Astro Content Collections & MDX mit Typsicherheit über [Zod](https://zod.dev/)
- **Icons:** [Lucide Astro](https://lucide.dev/)
- **Build & CI/CD:** GitHub Actions (Automatischer Sync, Typecheck, Build und Deployment)

---

## 📁 Projektstruktur

```text
regio-web/
├── .github/workflows/        # CI/CD Workflows (Auto-Deploy & Kalender-Sync)
├── public/                   # Statische Assets (Favicons, Logos, Team-Porträts, Web-Bilder)
│   ├── images/               # Web-Bilder (home, saeulen-monument, etc.)
│   ├── team/                 # Freigestellte Porträts & Teamfotos
│   └── placeholders/         # Fallback-Vektor-Platzhalter
├── src/
│   ├── assets/               # Quell-Assets (Bilder, Vektoren)
│   ├── components/
│   │   ├── camp/             # Komponenten für Zeltlager-Seiten
│   │   ├── common/           # Buttons, Container, ImageFrame, Header, Footer
│   │   ├── events/           # Event-Karten, Kalender-Feed & Filter
│   │   ├── home/             # Startseiten-Sektionen (Hero, Reel, Pillars, Faith, etc.)
│   │   └── navigation/       # Header, Navigation, Footer
│   ├── content/              # MDX Content Collections
│   │   ├── camps/            # Jährliche Zeltlager (2026.mdx, 2027.mdx)
│   │   ├── posts/            # Journal-Artikel & News
│   │   └── special-events/   # Besondere Sonderaktionen
│   ├── data/                 # Lokale Daten (z. B. Event-Fallbacks)
│   ├── layouts/              # Astro Layouts (BaseLayout, ContentLayout, CampLayout)
│   ├── lib/                  # Logik & Provider (Events, CiviCRM, Kalender, Mail)
│   ├── pages/                # File-based Routing (Start, Abenteuer, Team, Grundsätze...)
│   ├── scripts/animations/   # Scoped GSAP Animations-Module
│   └── styles/               # Globales CSS, Topografie, Texturen, Schriftarten
├── astro.config.mjs          # Astro Konfiguration
└── package.json
```

---

## 🚀 Quickstart & Entwicklung

### Voraussetzungen
- Node.js `>= 22`
- NPM `>= 10`

### Installation & Server starten
```bash
# 1. Repository klonen
git clone https://github.com/dfgsteam/regio-web.git
cd regio-web

# 2. Abhängigkeiten installieren
npm install

# 3. Lokalen Entwicklungsserver starten (http://localhost:4321)
npm run dev
```

### Verfügbare Skripte

| Befehl | Beschreibung |
| :--- | :--- |
| `npm run dev` | Startet den lokalen Astro Dev-Server mit Hot-Reloading |
| `npm run build` | Erstellt das produktionsbereite statische Bundle im `/dist`-Verzeichnis |
| `npm run preview` | Lokale Vorschau des erstellten Produktions-Builds |
| `npm run check` | Führt Astro- und TypeScript-Typprüfungen durch |
| `npm run sync:calendar` | Synchronisiert externe Termine/Kalenderdaten |

---

## 📝 Inhalte pflegen

### 1. Neues Zeltlager / Kampagne anlegen
Jedes Zeltlager wird als eigene Datei in `src/content/camps/[YEAR].mdx` angelegt:

```yaml
---
year: 2027
title: "Zeltlager 2027"
motto: "Die verlorene Expedition"
date:
  start: 2027-07-09
  end: 2027-07-18
age:
  min: 9
  max: 14
location:
  name: "Wiesenthal bei Thalwenden"
  coordinates: "51.3542° N, 10.0418° E"
theme:
  id: "expedition"
  colors:
    background: "#182019"
    foreground: "#F1EBDD"
    accent: "#FF5A1F"
registration:
  enabled: true
  url: "https://anmeldung.smj-wegweiser.de"
---
```

### 2. Journal-Beiträge & News verwalten (Erstellen & Deaktivieren)
Artikel werden unter `src/content/posts/[slug].mdx` abgelegt (oder automatisch via `npm run sync:instagram` aus Instagram erzeugt):

```yaml
---
title: "Im Wiesental rauchen die Colts"
publishedAt: 2026-08-01
author: "Leitungsteam"
description: "Rückblick auf unser großes Sommer-Zeltlager."
image:
  src: "/images/posts/western-lager.jpg"
  alt: "Lagerfeuerrunde im Zeltlager"
tags: ["Zeltlager", "Rückblick"]
draft: false
disabled: false
---

Hier steht der Artikelinhalt im Markdown-Format...
```

#### 🚫 Wie deaktiviere ich einen Post?
Um einen Beitrag von der Website auszublenden (ohne die Datei löschen zu müssen):
1. Öffne die gewünschte `.mdx`-Datei in [`src/content/posts/`](src/content/posts/).
2. Setze im Kopfbereich (Frontmatter) entweder:
   * **`draft: true`**
   * **`disabled: true`**
   * oder **`active: false`**

*Sobald einer dieser Werte gesetzt ist, wird der Post beim Build automatisch von der Startseite, aus der Übersicht (`/aktuelles/`) und aus allen Feeds entfernt.*

### 3. Termine & Events verwalten

Die Website verfügt über ein zweistufiges Event-System:
1. **Automatischer Sync (`scripts/sync-calendar.mjs`):** Gleicht Google Calendar / CiviCRM (`.ics`) ab und schreibt saubere Daten nach `src/data/events.json`.
2. **Sonderregeln & Overrides (`src/data/event-overrides.json` & `src/data/event-defaults.json`):** Ermöglicht das gezielte Überschreiben, Erweitern oder Ausblenden von Terminen ohne den Kalender zu manipulieren.

---

#### 🛠️ A. Sonderregeln (Overrides) für einzelne Events erstellen
In [`src/data/event-overrides.json`](src/data/event-overrides.json) können beliebige Eigenschaften eines Events anhand seines Slugs (oder der Google-UID) überschrieben werden:

```json
{
  "actionwochenende-1-2026": {
    "price": "35 €",
    "ageMin": 9,
    "ageMax": 14,
    "registrationUrl": "https://anmeldung.smj-wegweiser.de/action-1",
    "highlights": [
      "Großes Geländespiel im Wald",
      "Klettern & Pfadfinder-Techniken",
      "Lagerfeuer & Gitarrenrunde"
    ],
    "packingList": [
      "Schlafsack & Isomatte",
      "Feste Wanderschuhe & wetterfeste Kleidung",
      "Hausschuhe & Kulturbeutel",
      "Taschenlampe & Trinkflasche"
    ],
    "contact": {
      "name": "Vinzenz Hupe & Team",
      "role": "Wochenend-Leitung",
      "email": "vinzenz.hupe@smj-wegweiser.de"
    }
  }
}
```

*Globale Standardwerte pro Kategorie (z. B. Standard-Packlisten für alle `weekend`- oder `sterntreffen`-Events) liegen in [`src/data/event-defaults.json`](src/data/event-defaults.json).*

---

#### ➕ B. Events außerhalb eines Abgleichs manuell anlegen
Wenn ein Termin unabhängig vom Google Kalender / CiviCRM direkt auf der Website erscheinen soll, kann er einfach als JSON-Objekt in [`src/data/events.json`](src/data/events.json) eingetragen werden:

```json
{
  "id": "sonder-expedition-2026",
  "title": "Sonder-Expedition Harz",
  "slug": "sonder-expedition-2026",
  "start": "2026-10-09T16:00:00.000Z",
  "end": "2026-10-11T14:00:00.000Z",
  "location": "Braunlage / Harz",
  "address": "Wanderheim Harz, 38700 Braunlage",
  "ageMin": 12,
  "ageMax": 16,
  "price": "45 €",
  "teaser": "Drei Tage Trekking und Orientierung im Hochharz.",
  "description": "Gemeinsam packen wir den Rucksack und ziehen drei Tage durch die Wildnis des Harzes...",
  "category": "special",
  "registrationUrl": "https://anmeldung.smj-wegweiser.de",
  "contact": {
    "name": "Kilian Schlosser",
    "role": "Tourenleiter",
    "email": "kilian.schlosser@smj-wegweiser.de"
  }
}
```

---

#### 🚫 C. Events deaktivieren oder ausblenden
Um einen Termin von der Website auszublenden (z. B. wenn er ausfällt oder noch nicht öffentlich sein soll), gibt es zwei einfache Wege:

1. **Über Overrides:** In [`src/data/event-overrides.json`](src/data/event-overrides.json) `"disabled": true` setzen:
   ```json
   {
     "altes-oder-abgesagtes-event-2026": {
       "disabled": true
     }
   }
   ```
2. **Direkt in `events.json`:** Dem Event `"disabled": true` hinzufügen.
3. **Bei Zeltlager-Jahren (`src/content/camps/*.mdx`):** Im Frontmatter `active: false` setzen.

*Deaktivierte Events werden beim Build automatisch aus allen Übersichten, Teasern und Kalender-Feeds herausgefiltert.*

---

#### 🌐 D. Events online aufrufen (URLs & Routen)

Jeder Termin erhält eine saubere, suchmaschinenfreundliche URL:

| Event-Typ | URL-Schema | Beispiel |
| :--- | :--- | :--- |
| **Alle Events Übersicht** | `/abenteuer/` | `https://smj-wegweiser.de/abenteuer/` |
| **Einzelnes Event** | `/abenteuer/[slug]/` | `https://smj-wegweiser.de/abenteuer/actionwochenende-1-2026/` |
| **Aktuelles Zeltlager** | `/abenteuer/zeltlager/` | `https://smj-wegweiser.de/abenteuer/zeltlager/` |
| **Zeltlager-Archiv** | `/abenteuer/zeltlager/[year]/` | `https://smj-wegweiser.de/abenteuer/zeltlager/2026/` |
| **iCal Kalender-Abo** | `/calendar.ics` | `https://smj-wegweiser.de/calendar.ics` |

*Hinweis: Alte WordPress-URLs (z. B. `/veranstaltungen/`, `/zeltlager/`, `/aktuelles/[slug]/`) werden serverseitig automatisch mit 301-Redirects auf die neuen URLs weitergeleitet.*

---

### 4. Teammitglieder anpassen
Das Leitungsteam wird zentral in [`src/pages/team/index.astro`](src/pages/team/index.astro) im Array `teamMembers` verwaltet:
- **Porträts:** Freigestellte PNGs (ohne Hintergrund) unter `public/team/[name].png` ablegen.
- **Rollen:** Einheitlich als `Diözesanleitung` oder `Regiosprecher` deklariert.

### 5. Bilder & Assets verwalten
* **Startseiten-Bilder:** Liegen sauber geordnet unter `public/images/home/`.
* **Automatische Optimierung:** Astro optimiert Bilder beim Build für moderne Web-Formate (WebP/AVIF).

---

## 🔒 Datenschutz & Rechtliches

- **Kein Cookie-Banner notwendig:** Die Seite setzt weder Tracking- noch Marketing-Cookies und lädt keine Drittanbieter-Skripte nach.
- **100 % Self-Hosted Fonts:** Keine Google-Fonts-Serververbindungen (DSGVO-konform).
- **Kontaktformular:** Server-Endpunkt mit Spam-Schutz und serverseitiger Validierung.

---

## 🚢 CI/CD & Deployment

Über GitHub Actions (`.github/workflows/deploy.yml`) wird das Projekt automatisch validiert und bereitgestellt:

```text
git push auf 'main'
   ↓
Dependencies & Kalender-Sync
   ↓
Astro & TypeScript Check (0 Fehler)
   ↓
Astro Build
   ↓
Deploy auf 'prod'-Branch
   ↓
FTP-Upload auf dem Webspace
```

---

## 🔑 Umgebungsvariablen

Für die lokale Entwicklung und Produktion (`.env`):

```bash
# Basis-URL
SITE_URL=https://smj-wegweiser.de

# CiviCRM Anbindung (Server-side)
CIVICRM_BASE_URL=
CIVICRM_API_KEY=
CIVICRM_SITE_KEY=

# E-Mail Transport für Kontaktanfragen
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=kontakt@smj-wegweiser.de
MAIL_PASSWORD=secret
MAIL_FROM=no-reply@smj-wegweiser.de
MAIL_TO=kontakt@smj-wegweiser.de
```

---

© 2026 **SMJ Regio Wegweiser** · Schönstatt-Mannesjugend Diözese Erfurt
