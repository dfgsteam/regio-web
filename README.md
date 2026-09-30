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
| `npm run dev:toolbox` | Erzeugt die lokale PHP-Konfiguration außerhalb des Projekts aus `.env` und startet die Toolbox auf `localhost:4321` |
| `npm run build` | Erstellt das produktionsbereite statische Bundle im `/dist`-Verzeichnis |
| `npm run preview` | Lokale Vorschau des erstellten Produktions-Builds |
| `npm run check` | Führt Astro- und TypeScript-Typprüfungen durch |
| `npm run sync:calendar` | Synchronisiert externe Termine/Kalenderdaten |
| `npm run sync:civicrm` | Holt Anmeldestart, Meldeschluss und Belegung über CiviCRM APIv4 |

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

Die 20 neuesten veröffentlichten Beiträge stehen außerdem unter `/rss.xml` als RSS-Feed bereit. Der Feed wird beim Build aktualisiert und ist im Seitenkopf sowie im Footer verlinkt.

### 3. Termine & Events verwalten

Google Calendar liefert Titel, Zeit und Ort über `scripts/sync-calendar.mjs` nach `src/data/events.json`.
CiviCRM liefert Anmeldestart, Meldeschluss und Belegung über APIv4 nach `src/data/civi-registration.json`. Beide Datenquellen werden beim Build zusammengeführt. Die feste CiviCRM-Adresse ist `https://civi.smj-wegweiser.de`.
Vorhandene Civi-Anmeldelinks im Kalender enthalten bereits die Event-ID. Ohne Link erfolgt eine Zuordnung nur bei eindeutig gleichem Titel und Veranstaltungstag. Bei abweichenden Namen lässt sich `civiEventId` in `src/data/event-overrides.json` setzen. Der statische Build aktualisiert die Belegung stündlich; CiviCRM entscheidet beim eigentlichen Absenden der Anmeldung über freie Plätze.

---

#### 🛠️ A. Sonderregeln (Overrides) für einzelne Events erstellen
In [`src/data/event-overrides.json`](src/data/event-overrides.json) können beliebige Eigenschaften eines Events anhand seines Slugs (oder der Google-UID) überschrieben werden:

```json
{
  "actionwochenende-1-2026": {
    "price": "35 €",
    "ageMin": 9,
    "ageMax": 14,
    "civiEventId": 60,
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
- **Porträts:** Freigestellte PNGs (ohne Hintergrund) unter `src/assets/images/team/[name].png` ablegen; Astro erzeugt daraus WebP-Dateien für die Website.
- **Rollen:** Einheitlich als `Diözesanleitung` oder `Regiosprecher` deklariert.

### 5. Bilder & Assets verwalten
* **Startseiten-Bilder:** Die Originale liegen unter `src/assets/images/home/`.
* **Automatische Optimierung:** Astro erzeugt beim Build responsive Größen in AVIF und WebP. Fotos unter `public/` werden dagegen unverändert ausgeliefert.
* **Instagram-Medien:** `npm run sync:instagram` speichert Fotos und Video-Vorschaubilder als WebP unter `public/images/instagram/` sowie Videos als MP4 unter `public/videos/instagram/`. Videos laden erst beim Abspielen.

---

## 🔒 Datenschutz & Rechtliches

### Leiter-Toolbox absichern

Für lokale CiviCRM-Gruppen und Kontakte `npm run dev:toolbox` verwenden. Der Befehl benötigt `php-cgi` sowie die Authentik- und CiviCRM-Werte in `.env` und erzeugt eine geschützte PHP-Kopie mit Konfiguration im temporären Verzeichnis des Betriebssystems **außerhalb des Astro-Projekts**. Ein leeres `TOOLBOX_ALLOWED_GROUPS` erlaubt lokal wie die Repo-Variable `*` jeden erfolgreich bei dieser Authentik-Anwendung angemeldeten Nutzer. In Authentik muss für den verwendeten OAuth-Client zusätzlich die Redirect-URI `http://localhost:4321/toolbox-auth/callback.php` zugelassen sein. Danach die Toolbox auf `http://localhost:4321/toolbox/` öffnen und bei Authentik anmelden. Der PHP-Proxy akzeptiert nur Verbindungen vom eigenen Rechner; ohne gültiges signiertes Sitzungs-Cookie liefert die CiviCRM-API weiterhin HTTP 401. Für die normale Seitenentwicklung ohne Live-Daten bleibt `npm run dev` verfügbar.

Die Toolbox unter `/toolbox/` wird auf dem Apache-Webhosting über `public/.htaccess` und `public/toolbox-auth/guard.php` geschützt. Der FTP-Zugang startet im gemeinsamen Elternordner von `public/` und `private/`; **nur `public/` ist als Webverzeichnis konfiguriert**. Schon `npm run build` trennt die Ausgaben: Die allgemeine Website liegt in `dist/`, die Toolbox-Seiten, PDFs und Grafiken in `dist-private/toolbox/`. Beim Deployment kommen außerdem der interne PHP-Konfigurationshelfer und die Schlüsseldatei nach `private/`. In `public/` liegen nur die aufrufbaren PHP-Endpunkte und allgemeine Website-Dateien. Alte öffentliche `config.php`- und `generated-config.php`-Dateien werden mit sperrenden Platzhaltern überschrieben. `TOOLBOX_REDIRECT_URI` wird aus `SITE_URL` berechnet. Eine separate Server-`.env` wird nicht gelesen und ist nicht erforderlich. Fehlt ein Pflichtwert oder schlägt der Upload nach `private/` fehl, wird die Website nicht hochgeladen; ohne gültige Konfiguration bleibt die Toolbox gesperrt. Mit `TOOLBOX_ALLOWED_GROUPS=*` erhält jeder Benutzer Zugang, der sich bei der konfigurierten Authentik-Anwendung erfolgreich anmeldet. Ohne Anmeldung bleibt die Toolbox geschützt.

Die private PHP-Konfiguration enthält Geheimnisse und darf nicht ins Repository oder Webverzeichnis gelangen. Der FTP-Login muss beide Geschwisterordner erreichen. Wenn er direkt in `public/` startet, muss sein Startverzeichnis auf den Elternordner geändert oder ein passender FTP-Zugang eingerichtet werden. Apache muss zusätzlich die mitgelieferte `.htaccess` ausführen. Nach der Bereitstellung `/toolbox-auth/login.php` aufrufen: Bei gültiger Konfiguration erfolgt eine Weiterleitung zu Authentik; andernfalls HTTP 503. Eine früher manuell hochgeladene `.env` auf dem Server wird nicht mehr benötigt und sollte entfernt werden.

Der Authentik-Provider muss die erlaubten Gruppen im `groups`-Feld der Userinfo-Antwort liefern. Nach dem Einrichten den Zugriff ohne Cookie auf eine Toolbox-Seite, eine PDF-Datei und ein Social-Bild prüfen: Jede Anfrage muss zum Login führen. Auch das produktive Hosting muss `.htaccess` und PHP tatsächlich ausführen; ein reiner Static-Host schützt diese Dateien nicht.

Gruppen, Kontakte und CiviCRM-Entwürfe laufen zur Laufzeit über `toolbox-auth/civicrm-api.php`. Der PHP-Endpunkt liest API-Schlüssel ausschließlich aus der beim Deployment erzeugten Konfiguration. Kampagnenseiten und Muster-PDFs enthalten keine echten CiviCRM-Kontakte. Ohne `CIVICRM_API_KEY` bleibt die Toolbox erreichbar, aber die CiviCRM-Funktionen melden einen Konfigurationsfehler. Der frühere Endpunkt `civicrm-draft.php` liefert nach dem nächsten Upload nur noch HTTP 410.

Da frühere Versionen Zugangsdaten und einen Cookie-Schlüssel im Repository enthielten, **Authentik-Client-Secret und Toolbox-App-Secret vor der nächsten Freischaltung rotieren**. Bereits ausgestellte Toolbox-Cookies werden mit dem neuen Schlüssel ungültig.

Das öffentliche Repository darf keine gebauten Toolbox-Dateien veröffentlichen. Der frühere `prod`-Branch mit solchen Dateien wurde entfernt; externe Kopien bereits veröffentlichter Inhalte werden dadurch nicht gelöscht.

- **Kein Cookie-Banner notwendig:** Die Seite setzt weder Tracking- noch Marketing-Cookies und lädt keine Drittanbieter-Skripte nach.
- **100 % Self-Hosted Fonts:** Keine Google-Fonts-Serververbindungen (DSGVO-konform).
- **Kontaktformular:** Server-Endpunkt mit Spam-Schutz und serverseitiger Validierung.

---

## 🚢 CI/CD & Deployment

Über GitHub Actions (`.github/workflows/deploy.yml`) wird das Projekt automatisch validiert und bereitgestellt:

```text
git push auf 'main'
   ↓
Dependencies, Kalender-Sync & CiviCRM-Sync
   ↓
Astro & TypeScript Check (0 Fehler)
   ↓
Astro Build
   ↓
Toolbox-PHP-Konfiguration aus GitHub Secrets erzeugen
   ↓
Verschlüsselter FTPS-Upload auf dem Webspace
```

---

## 🔑 Umgebungsvariablen

GitHub Actions erzeugt die statischen Seiten und die PHP-Konfiguration und lädt beides per FTPS hoch. Auf dem Webserver muss keine `.env` gepflegt werden. Die Werte bleiben in GitHub Secrets und Variablen; nur die zum PHP-Betrieb benötigten Werte werden in die geschützte PHP-Konfigurationsdatei eingebaut.

### GitHub Actions: Build und Deployment

Unter **Repository → Settings → Secrets and variables → Actions** eintragen:

| Bereich | Name | Verwendung |
| --- | --- | --- |
| **Secret** | `FTP_PASSWORD` | FTPS-Upload; ohne Passwort wird der Upload übersprungen. |
| **Secret** | `CIVICRM_API_KEY` | Anmeldedaten beim Build synchronisieren und Toolbox-API zur Laufzeit betreiben; ohne Key bleibt der vorhandene Cache erhalten und die Toolbox-CiviCRM-Funktionen sind nicht verfügbar. |
| **Secret**, falls benötigt | `CIVICRM_SITE_KEY` | Nur wenn CiviCRM AuthX einen Site-Key verlangt. |
| **Secret** | `AUTHENTIK_CLIENT_ID` | Client-ID für den Toolbox-Login. |
| **Secret** | `AUTHENTIK_CLIENT_SECRET` | Client-Secret für den Toolbox-Login. |
| **Secret** | `TOOLBOX_APP_SECRET` | Mindestens 32 zufällige Zeichen für signierte Toolbox-Sitzungen. |
| **Variable** | `SITE_URL` | Canonical-Links, Sitemap und QR-Ziele; ohne Wert `https://smj-wegweiser.de`. |
| **Variable** | `TOOLBOX_ALLOWED_GROUPS` | Exakte Authentik-Gruppennamen **ohne eckige Klammern**, mehrere durch Komma getrennt, z. B. `smj`; oder `*` für alle angemeldeten Authentik-Nutzer. `[]` ist keine gültige Freigabe. |
| **Variable** | `CIVICRM_LEGACY_LINKS_ENABLED` | Nach Abschaltung des alten CiviCRM auf `false` setzen; sonst bleiben nicht zugeordnete alte Anmeldelinks aktiv. |
| **Variable**, optional | `AUTHENTIK_URL` | Authentik-Basis-URL; ohne Wert `https://auth.smj-wegweiser.de`. |
| **Variable**, optional | `CALENDAR_ICS_URL` | Anderer Kalender-Feed; ohne Wert wird der hinterlegte Google-Kalender genutzt. |
| **Variablen**, optional | `PUBLIC_MATOMO_URL`, `PUBLIC_MATOMO_SITE_ID` | Andere Matomo-Instanz oder Site-ID; ohne Werte gelten die Standardwerte im Code. |

Für lokale Builds und Syncs dient [`.env.example`](.env.example) als Vorlage für eine ignorierte `.env` oder `.env.local` im Projektroot. `INSTAGRAM_ACCESS_TOKEN` und `GEMINI_API_KEY` werden nur für einen **manuellen** `npm run sync:instagram` gebraucht; dieser Schritt läuft nicht im Deploy-Workflow. Die lokale `.env` gehört nicht auf den Webserver.

### Webserver: PHP-Laufzeit

Auf dem Webserver müssen PHP 8+, die PHP-Erweiterung cURL, PHP-Sessions und Apache-Rewrites (`mod_rewrite`, `AllowOverride`) aktiv sein. Der Deploy-Workflow lädt zuerst die Toolbox-Dateien und Konfiguration nach `private/` und danach die Website nach `public/`. Im neuen `public/` liegen keine Toolbox-HTML-, PDF- oder Grafikdateien. Alte Toolbox-Dateien im bisherigen Webverzeichnis müssen nach der Umstellung entfernt werden. Danach prüft der Workflow per HEAD-Anfrage, dass `/toolbox-auth/generated-config.php` HTTP 403 liefert, die Toolbox-API ohne Sitzung HTTP 401 und `/toolbox/` eine Login-Weiterleitung. `private/` darf keine URL und keinen Web-Alias haben; die tatsächliche Ordnerzuordnung muss auf dem Webspace einmalig geprüft werden.

Die PHP-Formulare für Kontakt und Newsletter nutzen ohne zusätzliche Konfiguration die im Code hinterlegten Mailadressen und PHP `mail()`. Optional können `MAIL_TO` und `MAIL_FROM` weiterhin in der PHP-Serverumgebung gesetzt werden; `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER` und `MAIL_PASSWORD` werden aktuell nicht verwendet.

---

© 2026 **SMJ Regio Wegweiser** · Schönstatt-Mannesjugend Diözese Erfurt
