# Buildplan – SMJ Regio Wegweiser

## 1. Zielbild

Die Website soll sich für einen 9–14-jährigen Jungen **nicht wie die Website eines Jugendverbandes anfühlen**, sondern wie der Einstieg in etwas, bei dem er dabei sein will.

**Hauptclaim:**  
**RAUS. INS ABENTEUER.**

Darunter keine institutionelle Erklärung, sondern beispielsweise:

> Zeltlager. Lagerfeuer. Wettkämpfe. Freunde.  
> Zehn Tage, die anders sind als alles davor.

Die eigentliche Erklärung „Wer ist die SMJ?“ kommt erst später.

Für Eltern existiert parallel eine zweite Informationsebene: Betreuung, Team, christliche Werte, Altersgruppen, Organisation, Ansprechpartner, FAQ und Anmeldung.

---

## 2. Visuelle Richtung

### Grunddesign

**Outdoor / Expedition / rau / jung / männlich**, aber nicht militärisch und nicht künstlich „extreme“.

Designsystem:

- sehr dunkles Waldgrün / Fast-Schwarz
- warmes Off-White statt Reinweiß
- Signalorange als primärer Akzent
- gelegentlich Sand-/Steintöne
- grobe Papierstrukturen
- Film Grain
- topografische Linien
- Koordinaten
- Kartenfragmente
- Stempel
- handgezeichnete Markierungen
- Tape-/Sticker-Elemente
- ausgeschnitten wirkende Bilder
- sehr große condensed Display-Typografie

Das bestehende Logo wird zunächst übernommen.

### Grundpalette

```css
--forest-950: #111713;
--forest-900: #182019;
--paper:      #F1EBDD;
--sand:       #C9BA99;
--orange:     #FF5A1F;
--ember:      #D73B17;
--muted:      #8D9389;
```

---

## 3. Typografie

**Display Font:** extrem kräftig, condensed, plakativ.

Für:

```text
RAUS.
INS
ABENTEUER.
```

**Text Font:** sehr gut lesbarer moderner Sans-Serif.

Dazu optional eine dritte, sparsam eingesetzte Ebene für Expeditions-/Dokumentationscharakter:

```text
N 51° 22' 44"
E 10° 08' 17"

FIELD NOTE 03
TAG 7
06:14 UHR
```

Diese kann Monospace sein.

---

## 4. Informationsarchitektur

Die neue Navigation:

```text
Start
Abenteuer
Über uns
Grundsätze
Team
Journal

[ NÄCHSTES ABENTEUER → ]
```

Im großen Menü ergänzen wir:

```text
Kontakt
Impressum
Datenschutz
```

`Schönstatt` wird **keine Hauptnavigation mehr**. Die Inhalte werden in „Über uns“ integriert.

Technische Routen ungefähr:

```text
/
├── /abenteuer/
│   ├── /zeltlager/
│   ├── /zeltlager/2027/
│   └── /sonderevent-slug/
│
├── /ueber-uns/
├── /grundsaetze/
├── /team/
├── /journal/
│   └── /[slug]/
├── /galerie/
├── /kontakt/
├── /impressum/
└── /datenschutz/
```

`/zeltlager/` kann automatisch auf das aktuelle Lagerjahr zeigen oder eine kleine Übersicht bieten.

---

## 5. Die Startseite als Story

Die Homepage besteht nicht einfach aus Sektionen untereinander, sondern aus **Kapiteln**.

### Kapitel 01 – Der Ruf

Fullscreen.

Großes Foto oder später eventuell kurzer Video-Loop.

Darüber:

```text
SMJ REGIO WEGWEISER

RAUS.
INS ABENTEUER.

↓ LOS GEHT'S
```

Sehr wenig UI.

Beim ersten Scrollen bleibt der Hero zunächst gepinnt.

Das Bild zoomt minimal.

Der Text trennt sich.

Topografische Linien erscheinen.

Die Website verwandelt sich langsam von einem Foto in eine **Expeditionskarte**.

Das wird unser erster Signature Effect.

---

## 6. Scroll Sequence #1 – „Raus“

GSAP ScrollTrigger:

```text
0–20 %
Hero stabil

20–40 %
RAUS. bewegt sich nach links
INS ABENTEUER. nach rechts

40–60 %
Foto wird leicht entsättigt / dunkler

60–80 %
Topografische Linien fahren über das Bild

80–100 %
Karte öffnet sich in nächste Section
```

Kein Scroll-Jacking.

Der Benutzer scrollt weiterhin ganz normal.

Desktop stark inszeniert.

Mobile erhält eine eigene reduzierte Animation.

---

## 7. Kapitel 02 – „Was erwartet dich?“

Jetzt erzählen wir zuerst für die Jungs.

Nicht:

> Die Schönstatt-Mannesjugend ist …

Sondern etwa:

```text
DRECK AN DEN SCHUHEN.
RAUCH IN DEN KLAMOTTEN.
GESCHICHTEN IM KOPF.
```

Große Bilder wechseln beim Scrollen.

Dazu kurze Begriffe:

```text
GEMEINSCHAFT
FEUER
WETTKAMPF
NATUR
GLAUBE
VERANTWORTUNG
```

---

## 8. Scroll Sequence #2 – Expedition Reel

Eine horizontale, gepinnte Bildsequenz.

Beim vertikalen Scrollen zieht ein riesiger horizontaler „Filmstreifen“ vorbei:

```text
[ Lagerfeuer ]
      [ Geländespiel ]
            [ Kochen ]
                  [ Gemeinschaft ]
                         [ Gebet ]
                               [ Zelt ]
```

Große Fotografien.

Teilweise überlappend.

Handschriftliche Beschriftungen.

Koordinaten und kleine Field Notes.

Am Ende:

**„UND DU MITTENDRIN.“**

---

## 9. Kapitel 03 – Die fünf Säulen

Die bestehenden Grundsätze werden deutlich kürzer und visueller erzählt.

Eine Scroll-Sequenz:

```text
01
ZUSAMMENHALT

Du musst hier nicht irgendwer sein.
Du musst nur dabei sein.
```

Dann:

```text
02
VERANTWORTUNG
```

```text
03
WACHSEN
```

```text
04
MANNSEIN
```

```text
05
GLAUBE
```

Jeder Begriff bekommt:

- ein starkes Foto
- einen Satz
- ein kleines grafisches Symbol
- einen Story-Moment

CTA:

**„Wofür wir stehen →“**

führt zu `/grundsaetze/`.

---

## 10. Grundsätze-Seite

Hier dürfen die Inhalte tiefer gehen, aber nicht mehr als lange Textblöcke.

Stattdessen:

```text
GEMEINSCHAFT
→ Kernbotschaft
→ kurze Erklärung
→ konkretes Beispiel aus dem SMJ-Alltag

VERANTWORTUNG
→ Kernbotschaft
→ kurze Erklärung
→ Beispiel
```

---

## 11. Kapitel 04 – Events

Headline:

```text
DEIN NÄCHSTES
ABENTEUER.
```

Zunächst Platzhalterdaten.

Beispiel:

```text
ACTIONWOCHENENDE

17.–19. OKTOBER
HEILIGENSTADT

9–14 JAHRE

[ MEHR ERFAHREN ]
```

Regelmäßige Events sind kompakt.

Keine aufwendige Landingpage notwendig.

---

## 12. Event-Datenmodell

Die UI soll niemals wissen, ob Daten aus Mock-Dateien oder CiviCRM kommen.

```ts
interface EventProvider {
  getEvents(): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
}
```

Zunächst:

```text
MockEventProvider
```

Später:

```text
CiviCrmEventProvider
```

Eventmodell:

```ts
interface Event {
  id: string
  title: string
  slug: string

  start: Date
  end: Date

  location?: string

  ageMin?: number
  ageMax?: number

  teaser?: string
  description?: string

  registrationUrl?: string
  registrationDeadline?: Date

  category:
    | 'weekend'
    | 'camp'
    | 'special'

  contact?: EventContact
}
```

---

## 13. CiviCRM-Vorbereitung

Eigener Service:

```text
src/lib/civicrm/
├── client.ts
├── events.ts
├── mapper.ts
├── types.ts
└── mock.ts
```

Konfiguration über Environment Variables:

```text
CIVICRM_BASE_URL
CIVICRM_API_KEY
CIVICRM_SITE_KEY
```

CiviCRM-Daten werden beim Build bzw. serverseitig transformiert.

Credentials landen niemals im Browser.

---

## 14. Das Zeltlager

Das Zeltlager bekommt eine Sonderstellung.

Grundzielgruppe:

**9–14 Jahre.**

Es ist keine normale Eventseite.

Es ist eine **jährliche Kampagne innerhalb der Website.**

---

## 15. Zeltlager-Themes

Entscheidend ist die Trennung:

```text
SMJ Design System
        ↓
Zeltlager Design System
        ↓
Jahrestheme
```

Beispiel:

```text
2027
PIRATEN

2028
EXPEDITION

2029
WILDER WESTEN
```

Das Jahresthema verändert nicht die normale Website.

Content:

```text
src/content/camps/
├── 2026.mdx
├── 2027.mdx
└── 2028.mdx
```

Assets:

```text
src/assets/camps/
├── 2026/
├── 2027/
└── 2028/
```

---

## 16. Camp-Theme-Konfiguration

Beispielsweise:

```yaml
year: 2027

title: Zeltlager 2027
motto: Die verlorene Expedition

date:
  start: 2027-07-09
  end: 2027-07-18

age:
  min: 9
  max: 14

location:
  name: Wiesenthal bei Thalwenden

theme:
  id: expedition

  colors:
    background: "#182019"
    foreground: "#F1EBDD"
    accent: "#E2A93B"

  assets:
    hero: "./hero.jpg"
    texture: "./map.webp"

registration:
  enabled: true
  url: "..."
```

Damit kann jedes Jahr anders aussehen, ohne Komponenten neu zu bauen.

---

## 17. Sonderkomponenten im Camp-MDX

Für 80–90 % reichen Standardbausteine.

```astro
<CampHero />
<CampFacts />
<CampStory />
<CampGallery />
<CampParents />
<CampFaq />
<CampRegistration />
```

Für ein besonderes Motto können in MDX Dinge ergänzt werden:

```mdx
<PirateMap />

## Die Mission

...
```

oder:

```mdx
<ExpeditionRoute />
```

Dadurch gibt es **keine gestalterische Sackgasse**.

---

## 18. Sonderveranstaltung für Ältere

Separat vom Zeltlager.

Zielgruppe typischerweise:

```text
15+
```

Content-Konfiguration:

```yaml
featured: true
active: true
```

Existiert das Event in einem Jahr nicht:

```yaml
active: false
```

Dann wird es **nirgendwo als leerer Platzhalter dargestellt**.

---

## 19. Kapitel 05 – Zeltlager-Teaser

Das Zeltlager bekommt auf der Homepage eine extrem große Fläche.

Nicht normale Eventcard.

Beispielsweise:

```text
DAS GROSSE DING.

10 TAGE.
KEIN ALLTAG.

ZELTLAGER 2027
```

Großes Bild.

Beim Scrollen klappt eine Art Karte/Poster auf.

CTA:

**„ZUM ZELTLAGER →“**

---

## 20. Kapitel 06 – Eltern

Dramaturgischer Wechsel.

Headline:

```text
UND WAS SAGEN
DEINE ELTERN DAZU?
```

Dann sachlicher und ruhiger.

Vier Kernfragen:

```text
WER PASST AUF?

WAS KOSTET ES?

WAS MUSS MIT?

WOFÜR STEHT DIE SMJ?
```

Dazu Vertrauen durch das Team.

---

## 21. Teamseite

Nicht mehr:

```text
Foto
Name
E-Mail
```

sondern:

**„DIE, DIE DAS HIER MÖGLICH MACHEN.“**

Großes Gruppenbild.

Danach Leitung.

Danach Erklärung des Jugend-für-Jugend-Prinzips.

Zentrale Anlaufstelle.

Bei Veranstaltungen können zusätzliche Kontakte ausgespielt werden.

---

## 22. Kapitel 07 – Glaube

Nicht verstecken, aber auch nicht als ersten institutionellen Block platzieren.

Zum Beispiel:

```text
ABENTEUER IST MEHR
ALS ACTION.
```

Bildwechsel vom wilden Tag zum ruhigen Lagerfeuer / Kapelle / Nacht.

Dann:

```text
Gemeinschaft.
Stille.
Gebet.
Fragen.
Glaube, der zum Leben gehört.
```

---

## 23. Über-uns-Seite

Hier bündeln wir:

```text
Was ist die SMJ?
Regio Wegweiser
Schönstatt
Wie funktioniert unsere Jugendarbeit?
Jugend leitet Jugend
Wo kommen wir her?
```

Nicht sechs institutionelle Unterseiten.

Eine gut erzählte Seite.

---

## 24. Field Journal

Die bisherige Galerie wird kein Raster aus vielen kleinen Bildern.

Stattdessen:

# FIELD JOURNAL

Jahr:

```text
2027
```

darunter beispielsweise:

```text
ZELTLAGER
ACTIONWOCHENENDE
STERNTREFFEN
```

Große Fotostrecken.

Asymmetrisches Layout.

Teilweise horizontal.

Kleine Notizen:

```text
TAG 04
22:37 UHR

Das Feuer hat den Regen überlebt.
```

---

## 25. Beiträge

Astro Content Collections.

```text
src/content/posts/
├── pilgerreise-wegweiser.mdx
├── regio-konferenz.mdx
└── ...
```

Schema:

```ts
{
  title,
  description,
  publishedAt,
  author,
  image,
  tags,
  draft
}
```

Die Homepage zeigt nur die **letzten drei Beiträge**.

Kein dominantes Newsportal.

---

## 26. Scroll Sequence #3 – Journal

Die drei neuesten Geschichten werden als übereinanderliegende Karten präsentiert.

Beim Scrollen:

```text
Card 1 hebt sich an
→ Card 2 erscheint
→ Card 3 erscheint
```

---

## 27. Finale Homepage-Sequence

Am Ende wieder große Emotion.

Zum Beispiel Nachtaufnahme + Feuer.

Riesiger Text:

```text
NÄCHSTES MAL
BIST DU DABEI.
```

Darunter:

**Nächstes Abenteuer ansehen**

und sekundär:

**Fragen? Schreib uns.**

Footer danach ruhig und funktional.

---

## 28. Navigation

Desktop initially transparent über Hero.

Beim Scrollen verwandelt sie sich in eine kompakte Navigation.

Das Logo bleibt.

Der Menü-Button darf experimenteller sein.

Mobile:

Fullscreen Overlay.

Eher:

```text
01 Abenteuer
02 Über uns
03 Grundsätze
04 Team
05 Journal
```

Im Hintergrund bewegen sich subtil Kartenelemente.

---

## 29. Cursor

Desktop optional kleiner Custom Cursor.

Normal:

```text
●
```

Auf Bild:

```text
ANSEHEN ↗
```

Auf Event:

```text
LOS →
```

Nur bei Geräten mit echtem Pointer.

---

## 30. Animation Architecture

Technisch:

```text
GSAP
└── ScrollTrigger
```

Struktur:

```text
src/scripts/animations/
├── hero.ts
├── expedition-reel.ts
├── pillars.ts
├── journal.ts
├── navigation.ts
└── cleanup.ts
```

Astro lädt diese Scripts nur dort, wo sie tatsächlich benötigt werden.

---

## 31. Motion-Prinzip

Drei Kategorien.

### Signature

Nur 3–4 Stellen:

- Hero → Karte
- Expedition Reel
- Säulen
- Zeltlager-Kampagnenmoment

### Supporting

Kleinere:

- Image reveal
- Text reveal
- Parallax
- Card movement

### Micro

- Buttons
- Navigation
- Hover
- Cursor

---

## 32. Reduced Motion

Pflicht.

```css
@media (prefers-reduced-motion: reduce) {
  ...
}
```

Und im JS:

```ts
gsap.matchMedia()
```

Bei Reduced Motion:

- kein Scrubbing
- kein Pinning
- kein starker Parallax
- Inhalte trotzdem vollständig sichtbar

---

## 33. Mobile

Mobile wird **nicht Desktop in klein**.

Beispiel:

Desktop:

```text
PIN → horizontal scrub
```

Mobile:

```text
vertikale Bilder
+
leichter parallax
+
text reveal
```

---

## 34. Projektstruktur

```text
src/
├── components/
│   ├── common/
│   ├── navigation/
│   ├── home/
│   ├── events/
│   ├── camp/
│   ├── journal/
│   └── sections/
│
├── content/
│   ├── posts/
│   ├── camps/
│   ├── special-events/
│   └── config.ts
│
├── layouts/
│   ├── BaseLayout.astro
│   ├── ContentLayout.astro
│   ├── PostLayout.astro
│   └── CampLayout.astro
│
├── lib/
│   ├── civicrm/
│   └── events/
│
├── pages/
│
├── scripts/
│   └── animations/
│
├── styles/
│   ├── global.css
│   ├── typography.css
│   └── textures.css
│
└── assets/
    ├── textures/
    ├── images/
    └── camps/
```

---

## 35. Astro Islands

So wenig wie möglich.

Die meisten Sachen bleiben:

```text
.astro
HTML
CSS
GSAP
```

Islands nur dort, wo echter Zustand benötigt wird.

Zum Beispiel:

```text
EventFilter
MobileNavigation
GalleryLightbox
```

Keine React-/Vue-Abhängigkeit.

---

## 36. Tailwind

Tailwind v4 für Layout und Design Tokens.

Keine riesige Component Library.

Reusable primitives:

```text
Container
Section
Eyebrow
Button
ImageFrame
Texture
Sticker
Coordinates
Marquee
```

SaaS-Ästhetik vermeiden.

---

## 37. Bilder

Bis die echten Bilder vorhanden sind, werden Bildslots bewusst vorbereitet.

Jeder Slot bekommt später definierte Anforderungen:

```text
Hero:
Landscape
min. ~2400 px
Personengruppe / Action
Motivzentrum beachten

Story:
Portrait
4:5

Journal:
Landscape + Portrait Mix
```

---

## 38. Bildoptimierung

Astro `<Image />`.

Generierte:

```text
AVIF
WebP
responsive srcset
```

Hero ggf. preload.

Journal-Bilder lazy.

---

## 39. Performance Budget

Trotz der Animationen klare Ziele:

```text
LCP < 2.5s
CLS < 0.1

Initial JS:
so klein wie sinnvoll

Keine Videos ungefragt auf Mobile
Keine riesigen Canvas/WebGL-Spielereien
```

Kein Three.js in V1.

---

## 40. Accessibility

Trotz Awwwards-Anspruch:

- semantische HTML-Struktur
- vollständige Tastaturnavigation
- sichtbare Focus States
- Kontrastprüfung
- Alt-Texte
- Reduced Motion
- keine Informationen ausschließlich über Animation
- keine Animation, die das normale Scrollen blockiert

---

## 41. SEO

Jede Seite:

```text
title
description
canonical
OpenGraph
structured data
```

Events später zusätzlich als `Event` Schema.org Markup.

Beiträge als `Article`.

Organisation als `Organization`.

---

## 42. Kontakt

Eine zentrale Kontaktseite:

```text
DU HAST FRAGEN?
MELD DICH.
```

Zentrale Anlaufstelle.

Kontaktformular.

Eventseiten können separat einen spezifischen Ansprechpartner anzeigen.

---

## 43. Formular

V1:

Astro API Endpoint.

```text
POST /api/contact
```

Serverseitig:

- Validation
- Honeypot
- Rate Limit / Spam-Schutz
- Mailversand

Mailto nur als Fallback.

---

## 44. CI/CD

Pipeline ungefähr:

```text
git push
   ↓
lint
   ↓
typecheck
   ↓
astro check
   ↓
build
   ↓
Docker image
   ↓
deploy
```

GitHub Actions oder GitLab CI, abhängig vom Repository.

---

## 45. Docker

Produktion als Astro Node Adapter, falls serverseitige API-Routen benötigt werden.

Da Kontaktformular und später dynamische CiviCRM-Abfragen dazukommen, Aufbau auf **Astro Node** vorbereiten.

```text
Node Container
↓
Astro SSR / hybrid
↓
Reverse Proxy
```

Contentseiten können trotzdem vollständig prerendered sein.

---

## 46. CiviCRM-Caching

Nicht bei jedem Pageview CiviCRM anfragen.

```text
CiviCRM
   ↓
server fetch
   ↓
normalize
   ↓
cache
   ↓
Astro
```

Wenn CiviCRM kurzfristig nicht erreichbar ist, soll die Website nicht kaputt sein.

Optional können zuletzt erfolgreiche Eventdaten weiter verwendet werden.

---

## 47. Content Collections

Mindestens:

```text
posts
camps
specialEvents
```

Eventdaten aus CiviCRM kommen nicht in dieselbe Collection, sondern durch den Event Provider.

```text
Redaktionelle Inhalte → Git / MDX

Live-Veranstaltungen → CiviCRM
```

---

## 48. Was aus der bestehenden Website übernommen wird

**Inhaltlich übernehmen bzw. überarbeiten:**

- SMJ-Beschreibung
- Grundsätze / fünf Säulen
- Schönstatt-Hintergrund
- Teamstruktur
- zentrale Kontaktdaten
- relevante Beiträge
- Impressum
- Datenschutz
- bestehende Veranstaltungslogik

**Nicht übernehmen:**

- WordPress-Struktur
- Kalender-Iframe
- bestehendes Theme
- bestehende Card-Layouts
- bestehende Typografie
- Navigation
- Seitenkomposition
- visuelle Hierarchie

---

## 49. Umsetzung in Phasen

### Phase 1 – Foundation

- Astro 5
- Tailwind v4
- TypeScript strict
- Content Collections
- GSAP
- Lucide
- Basislayout
- Fonts
- Design Tokens
- Navigation
- SEO-Grundlage

### Phase 2 – Static Content

- Über uns
- Grundsätze
- Team
- Kontakt
- Journal
- Beitragsdetail

### Phase 3 – Homepage Story

- Hero
- Expedition sequence
- SMJ Story
- 5 Säulen
- Events
- Zeltlager Teaser
- Elternsection
- Glaube
- Journal
- Final CTA

### Phase 4 – Events

- `EventProvider`
- Mockdaten
- Eventcards
- Eventübersicht
- Eventdetail
- Anmelde-CTA
- Event-Ansprechpartner
- Altersfilter

### Phase 5 – Zeltlager-System

- Camp Content Collection
- CampLayout
- Theme API
- Standard-Komponenten
- erstes Demo-Jahrestheme

### Phase 6 – Field Journal

- Galeriesystem
- Responsive Images
- Jahrgangsansicht
- Story-Komposition
- Lightbox nur falls sinnvoll

### Phase 7 – CiviCRM

- echter Adapter
- Mapping
- Caching
- Fehlerbehandlung
- Registration URLs
- Test gegen echte Events

### Phase 8 – Fotos

- Platzhalter gezielt ersetzen
- Crop, Reihenfolge, Bildwirkung und Animation auf echtes Material abstimmen

### Phase 9 – QA

Desktop:

```text
Chrome
Firefox
Safari
```

Mobile:

```text
iOS Safari
Chrome Android
```

Zusätzlich:

```text
Reduced Motion
Keyboard
Slow Network
Low-end Mobile
```

### Phase 10 – Deployment

- CI/CD
- Docker Image
- Environment-Konfiguration
- Preview/Staging
- Production
- Redirects von alten WordPress-URLs
- Sitemap
- Robots
- Analytics optional

---

## 50. Wichtigste Architekturentscheidung

Die Website besteht aus **drei Systemen**:

```text
1. SMJ BRAND SITE
   dauerhaftes Design

2. EVENT SYSTEM
   CiviCRM-getrieben

3. CAMP CAMPAIGN SYSTEM
   jährliches Design + MDX
```

Ein Westernlager kann komplett anders aussehen als ein Piratenlager.

Trotzdem müssen weder Navigation noch Homepage noch Eventsystem jedes Jahr neu gebaut werden.

---

## Was V1 bewusst nicht enthält

- kein CMS
- kein React
- kein WebGL
- keine Useraccounts
- kein eigener Event-Admin
- kein komplizierter visueller Page Builder
- kein WordPress

MDX + Git reichen für die redaktionellen Änderungen.

CiviCRM bleibt die Quelle für Veranstaltungen.

---

## Definition of Done für V1

Am Ende sollte man:

1. die komplette Website mit Astro betreiben können,
2. Beiträge über MDX hinzufügen können,
3. ein neues Zeltlagerjahr über eine einzelne MDX-Datei und ein Theme anlegen können,
4. ein variables 15+-Sonderevent aktivieren oder komplett ausblenden können,
5. reguläre Events über einen austauschbaren Provider darstellen,
6. später CiviCRM anschließen können, ohne die UI umzubauen,
7. jährlich neue Zeltlager-Artworks hinzufügen können,
8. eine Startseite haben, die sich **nicht nach Jugendverbands-Template, sondern nach Abenteuer anfühlt**.
