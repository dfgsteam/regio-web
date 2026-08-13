# AGENTS.md

## Project Overview

This repository contains the new website for **SMJ Regio Wegweiser**.

The site is a highly visual, content-driven Astro website with strong scroll storytelling, an outdoor/adventure aesthetic, event data prepared for CiviCRM integration, and a yearly customizable Zeltlager campaign system.

The existing website at `https://smj-wegweiser.de/` is primarily a **content source**, not a visual or technical reference.

The new site should feel like an adventure brand first and a youth organization website second.

Primary audience:

- boys aged 9–14
- parents as an important secondary audience
- older participants for selected special events

The main visual direction is:

- outdoor
- expedition
- rough
- young
- bold
- masculine without looking military
- cinematic
- editorial
- highly animated

Primary homepage claim direction:

> RAUS. INS ABENTEUER.

---

## Core Technology

Use the following stack unless there is a strong technical reason not to.

- Astro 5
- TypeScript
- Tailwind CSS v4
- GSAP
- GSAP ScrollTrigger
- Astro Content Collections
- MDX
- Lucide icons
- Astro Islands only when actual client-side state is required
- Astro Node adapter for server-side endpoints and future CiviCRM integration
- Docker for production delivery

Do **not** introduce React, Vue, Svelte, Three.js, a CMS, or a large component library without explicit approval.

The default implementation should prefer:

- Astro components
- semantic HTML
- CSS
- small TypeScript modules
- GSAP only where motion adds meaningful value

---

## General Engineering Principles

Prefer simple, explicit architecture over abstraction for its own sake.

Keep the frontend bundle small.

Avoid client-side JavaScript when static HTML is sufficient.

Keep data access separate from presentation.

Use strongly typed content and domain models.

Components should be reusable where repetition is real, but avoid creating generic abstractions prematurely.

Do not reproduce generic SaaS component patterns.

Avoid components such as generic `Card`, `CardHeader`, `CardBody` abstractions unless they genuinely improve reuse.

Instead prefer domain-specific components such as:

```text
EventCard
CampHero
FieldJournalEntry
ParentInfoSection
AdventureTeaser
PillarStory
```

---

## Project Structure

Target structure:

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

Keep feature-specific files close together.

Do not place all components into a single flat folder.

---

## Routing

Expected main routes:

```text
/
├── /abenteuer/
│   ├── /zeltlager/
│   ├── /zeltlager/[year]/
│   └── /[special-event-slug]/
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

The Schönstatt background should be integrated into `/ueber-uns/` instead of becoming a major top-level navigation item.

---

## Homepage Philosophy

The homepage is a **scroll-driven story**, not a list of independent content blocks.

The primary audience for the emotional storytelling is boys aged 9–14.

Parents receive a deliberate secondary information layer later in the page.

The homepage should roughly follow this narrative:

```text
1. Hero / Der Ruf
2. Was erwartet dich?
3. Expedition Reel
4. Die fünf Säulen
5. Events
6. Zeltlager
7. Eltern
8. Glaube
9. Journal / letzte Beiträge
10. Finaler CTA
```

Do not make the homepage feel institutional.

Prefer direct language, short phrases, bold headlines, real experiences and strong imagery.

---

## Copy Style

Homepage copy may be bold, short and direct.

Good direction:

```text
DRECK AN DEN SCHUHEN.
RAUCH IN DEN KLAMOTTEN.
GESCHICHTEN IM KOPF.
```

Avoid bureaucratic introductions such as:

```text
Die Schönstatt-Mannesjugend Regio Wegweiser ist eine katholische Jugendorganisation...
```

Institutional explanations belong further down the page or on dedicated content pages.

The Christian identity must not be hidden, but the homepage narrative should lead with:

- adventure
- community
- challenge
- responsibility
- growth

Faith should appear naturally as part of the experience rather than as the first sales message.

---

## Design System

The default visual direction uses:

```css
--forest-950: #111713;
--forest-900: #182019;
--paper:      #F1EBDD;
--sand:       #C9BA99;
--orange:     #FF5A1F;
--ember:      #D73B17;
--muted:      #8D9389;
```

These values may be refined during implementation.

Visual vocabulary:

- dark forest tones
- warm off-white
- signal orange
- paper texture
- film grain
- topographic lines
- coordinates
- maps
- stamps
- handwritten annotations
- tape / sticker elements
- rough image crops
- bold condensed display type

Do not turn the site into a clean white corporate website.

Do not use gradients, glassmorphism or generic startup aesthetics unless there is a very deliberate reason.

---

## Typography

Use three conceptual typography layers:

### Display

Large condensed bold font.

Used for major statements and chapter transitions.

Example:

```text
RAUS.
INS
ABENTEUER.
```

### Body

Highly readable modern sans-serif.

Used for normal content and parent information.

### Utility / Expedition

Optional monospace or technical-looking font.

Use sparingly for:

```text
FIELD NOTE 03
TAG 7
06:14 UHR
N 51° 22' 44"
```

Do not overuse the utility font.

---

## Animation Principles

Animation is a major part of the experience.

Use:

- GSAP
- ScrollTrigger

Do not use animation everywhere.

There are three motion levels.

### Signature Motion

Use for only a few major sequences:

- Hero → expedition/map transition
- Expedition Reel
- Five pillars sequence
- Zeltlager campaign moment

### Supporting Motion

Use for:

- image reveals
- text reveals
- parallax
- layered cards
- section transitions

### Micro Motion

Use for:

- buttons
- navigation
- hover states
- cursor feedback

The site should feel cinematic, not chaotic.

---

## GSAP Architecture

Do not scatter large animation setup blocks across Astro components.

Prefer dedicated files:

```text
src/scripts/animations/
├── hero.ts
├── expedition-reel.ts
├── pillars.ts
├── journal.ts
├── navigation.ts
└── cleanup.ts
```

Each animation module should:

- initialize only when the required DOM exists
- scope selectors to its own section
- clean up ScrollTriggers
- work with resize and responsive breakpoints
- respect reduced motion
- avoid leaking event listeners
- avoid global selectors where possible

Use `gsap.context()` or equivalent scoping patterns where appropriate.

Always clean up created ScrollTriggers.

---

## Scroll Behavior

Do not implement scroll-jacking.

The user must retain normal browser scrolling.

Pinning is allowed.

Scrubbing is allowed.

Horizontal sequences driven by vertical scrolling are allowed.

The page should never trap the user inside an interaction.

Avoid excessively long pinned sections.

---

## Reduced Motion

`prefers-reduced-motion` support is mandatory.

When reduced motion is enabled:

- disable scrubbing
- disable long pinned animations
- remove strong parallax
- avoid large scale/rotation movement
- keep all content visible
- preserve the entire information hierarchy

Use both CSS and JavaScript handling where necessary.

Example:

```css
@media (prefers-reduced-motion: reduce) {
  /* simplified motion */
}
```

Use GSAP matchMedia or an equivalent pattern.

---

## Responsive Motion

Do not simply shrink desktop animation timelines for mobile.

Mobile may use a completely different layout and animation strategy.

Example:

Desktop:

```text
vertical scroll
→ pinned section
→ horizontal image sequence
```

Mobile:

```text
normal vertical flow
→ large images
→ subtle parallax
→ text reveals
```

Performance on mid-range smartphones matters more than reproducing every desktop effect.

---

## Navigation

Desktop navigation may begin transparent over the hero.

It can transition into a compact navigation during scrolling.

Suggested top-level items:

```text
Start
Abenteuer
Über uns
Grundsätze
Team
Journal
```

Primary CTA:

```text
NÄCHSTES ABENTEUER →
```

Mobile navigation should use a fullscreen overlay and may have experimental visual treatment.

Suggested numbering:

```text
01 Abenteuer
02 Über uns
03 Grundsätze
04 Team
05 Journal
```

Accessibility must not be sacrificed for experimentation.

---

## Events

Regular events will eventually come from CiviCRM.

Initially use mock data.

The UI must not depend directly on CiviCRM response shapes.

Use an abstraction similar to:

```ts
interface EventProvider {
  getEvents(): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
}
```

Initial implementation:

```text
MockEventProvider
```

Future implementation:

```text
CiviCrmEventProvider
```

Suggested event model:

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

Regular events do not need elaborate landing pages.

Typical event UI includes:

- title
- date
- location
- age group
- teaser
- registration / details CTA

---

## CiviCRM

Keep all CiviCRM code isolated.

Preferred structure:

```text
src/lib/civicrm/
├── client.ts
├── events.ts
├── mapper.ts
├── types.ts
└── mock.ts
```

Expected environment variables may include:

```text
CIVICRM_BASE_URL
CIVICRM_API_KEY
CIVICRM_SITE_KEY
```

Never expose CiviCRM secrets in the browser.

Normalize CiviCRM data into internal domain models before passing it into UI components.

Do not make UI components consume raw CiviCRM payloads.

Plan for caching.

The site must remain usable when CiviCRM is temporarily unavailable.

A future implementation may use:

```text
CiviCRM
→ server fetch
→ normalize
→ cache
→ Astro
```

---

## Zeltlager Architecture

The Zeltlager is not a normal event page.

It is an annual campaign.

Default target age:

```text
9–14
```

The theme may change completely every year.

Examples:

```text
Piraten
Expedition
Wilder Westen
Abenteuer
Mittelalter
```

The yearly visual theme must not affect the global SMJ website design.

Architecture:

```text
SMJ Design System
        ↓
Zeltlager Design System
        ↓
Annual Campaign Theme
```

---

## Zeltlager Content

Store yearly camps in Astro Content Collections / MDX.

Example:

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

Suggested frontmatter:

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

---

## Zeltlager Components

Most yearly camp pages should reuse stable components.

Examples:

```astro
<CampHero />
<CampFacts />
<CampStory />
<CampGallery />
<CampParents />
<CampFaq />
<CampRegistration />
```

However, yearly campaigns must be able to inject unique MDX components.

Example:

```mdx
<PirateMap />
```

or:

```mdx
<ExpeditionRoute />
```

The goal is approximately:

- 80–90% reusable structure
- 10–20% yearly visual experimentation

Do not hardcode one camp theme into shared components.

---

## Special Event for Older Participants

There may be one additional major special event for older participants.

It may not happen every year.

Do not reserve an empty slot for it.

Model it with configuration such as:

```yaml
active: true
featured: true
```

When inactive:

```yaml
active: false
```

The homepage and event page must automatically close the layout gap.

---

## Content Collections

At minimum:

```text
posts
camps
specialEvents
```

Editorial content should remain in Git / MDX.

Live event data should come through the event provider abstraction.

Keep this boundary clear:

```text
Editorial content → Git / MDX
Live events        → CiviCRM
```

---

## Journal

The gallery should behave more like a **Field Journal** than a standard photo gallery.

Prefer:

- large photography
- mixed landscape and portrait images
- asymmetrical layouts
- year-based grouping
- short field notes
- event labels
- occasional horizontal storytelling

Example:

```text
TAG 04
22:37 UHR

Das Feuer hat den Regen überlebt.
```

Avoid huge grids of tiny thumbnails.

---

## Posts

Posts are secondary content.

The homepage should show only a small selection of recent posts, likely the latest three.

Store posts as MDX.

Suggested fields:

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

Do not turn the project into a news portal.

---

## Parent Experience

Parents are a major secondary audience.

The homepage should contain a dedicated section such as:

```text
UND WAS SAGEN
DEINE ELTERN DAZU?
```

Parent-focused information should be calmer and more structured.

Typical questions:

```text
WER PASST AUF?
WAS KOSTET ES?
WAS MUSS MIT?
WOFÜR STEHT DIE SMJ?
```

Event pages should also include event-specific parent information where relevant.

---

## Team and Contact

There is one central contact point for the organization.

Events may have dedicated contacts.

Do not expose unnecessary personal contact data across the site.

The team page should emphasize:

- the people behind the activities
- youth-leading-youth
- responsibility
- experience
- trust

Avoid a sterile employee directory.

---

## Forms

V1 contact form should use an Astro server endpoint.

Example:

```text
POST /api/contact
```

Implement:

- server-side validation
- honeypot
- spam protection
- rate limiting where practical
- mail transport
- accessible error states

A mailto link may exist only as fallback.

---

## Images

Use Astro image optimization.

Prefer:

- AVIF
- WebP
- responsive `srcset`
- lazy loading outside critical viewport
- preloading only for truly critical hero imagery

Do not ship multi-megabyte original JPEGs directly to mobile devices.

Image slots should have explicit intended ratios.

Examples:

```text
Hero:
landscape
minimum ~2400px source width

Story:
portrait / 4:5

Journal:
mixed portrait and landscape
```

Actual photography will be supplied later.

Until then, placeholders must preserve intended framing and aspect ratios.

---

## Performance

The site may be animation-heavy, but performance is a requirement.

Targets:

```text
LCP < 2.5s
CLS < 0.1
```

Keep initial JavaScript as small as practical.

Avoid:

- unnecessary hydration
- autoplay video on mobile
- huge canvas effects
- Three.js
- excessive blur filters
- dozens of simultaneous ScrollTriggers
- expensive layout thrashing

Test on lower-end mobile devices.

---

## Accessibility

Awwwards-style visuals do not justify inaccessible behavior.

Required:

- semantic HTML
- correct heading hierarchy
- keyboard navigation
- visible focus states
- good contrast
- meaningful alt text
- reduced motion support
- accessible mobile navigation
- no information communicated only through motion
- no scroll traps

Interactive elements must use actual links/buttons.

Do not make `div` elements behave as buttons.

---

## SEO

Each relevant page should support:

```text
title
description
canonical
OpenGraph
structured data
```

Use schema.org where useful.

Examples:

- `Organization`
- `Event`
- `Article`

Create:

- sitemap
- robots.txt
- redirects from old WordPress URLs where necessary

---

## Tailwind

Use Tailwind CSS v4 for layout, utilities and design tokens.

Avoid a giant design-system abstraction.

Useful reusable primitives may include:

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

Do not recreate Bootstrap-like component APIs.

---

## Icons

Use Lucide.

Keep icon usage restrained.

The visual identity should primarily come from:

- typography
- photography
- texture
- composition
- motion

not from large quantities of UI icons.

---

## CI/CD

The repository should support automated validation and deployment.

Expected pipeline:

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

Use GitHub Actions or GitLab CI depending on repository hosting.

Do not merge code that fails:

- TypeScript checks
- Astro checks
- build
- linting

---

## Docker

Prepare production for Astro Node.

High-level architecture:

```text
Node container
↓
Astro server / hybrid output
↓
reverse proxy
```

Content-heavy pages may still be prerendered.

Server mode is primarily required for:

- contact endpoints
- future CiviCRM access
- server-side integration logic

---

## Environment Variables

Secrets must never be committed.

Keep a documented `.env.example`.

Potential values:

```text
CIVICRM_BASE_URL=
CIVICRM_API_KEY=
CIVICRM_SITE_KEY=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=
MAIL_TO=
```

Do not place real credentials in documentation, fixtures or tests.

---

## Testing and Quality

Before considering a feature complete, verify:

### Desktop

- Chrome
- Firefox
- Safari

### Mobile

- iOS Safari
- Chrome Android

### Additional

- keyboard navigation
- reduced motion
- slow network
- narrow screens
- low-end mobile performance
- empty event states
- CiviCRM failure states
- missing optional images
- missing special event
- Zeltlager yearly theme override

---

## Code Style

Use TypeScript strict mode.

Prefer explicit types at domain boundaries.

Avoid `any`.

Prefer small functions.

Use descriptive names.

Avoid deep nesting.

Do not create helper abstractions that are only used once unless they materially improve readability.

Keep Astro components focused.

Separate:

```text
data fetching
domain mapping
presentation
animation
```

Do not mix all four responsibilities into one page component.

---

## Comments

Comments should explain **why**, not restate what the code does.

Good:

```ts
// Keep this value below the header transition threshold so the
// navigation finishes before the next pinned section begins.
```

Bad:

```ts
// Set opacity to 0
element.style.opacity = '0'
```

---

## Content Migration

When migrating content from the old website:

- preserve factual meaning
- modernize language
- shorten unnecessarily institutional copy
- do not blindly copy WordPress markup
- remove obsolete formatting
- verify team and contact data before publishing
- separate evergreen content from event-specific information

The old site is a source, not the implementation reference.

---

## What Not to Build in V1

Do not add the following without explicit approval:

- CMS
- React
- Vue
- Svelte
- Three.js
- WebGL-heavy scenes
- user accounts
- event administration UI
- visual page builder
- WordPress compatibility layer
- custom analytics platform

---

## Definition of Done

A V1 is considered structurally successful when:

1. The website runs on Astro 5.
2. Content pages are managed through MDX / Content Collections.
3. Posts can be added through MDX.
4. Regular events are displayed through an abstract event provider.
5. Mock event data can later be replaced with CiviCRM without rebuilding the UI.
6. A Zeltlager year can be created from a new MDX content entry and theme configuration.
7. Each Zeltlager year can have a distinct visual identity.
8. A variable special event can be enabled or omitted without leaving layout gaps.
9. Desktop and mobile have intentionally different animation strategies.
10. Reduced-motion users receive the full content without heavy motion.
11. CI/CD and Docker deployment are prepared.
12. The homepage feels like an adventure experience rather than a generic youth organization website.

---

## Final Rule

Whenever there is a conflict between:

```text
visual spectacle
and
clarity / accessibility / performance
```

choose the solution that preserves the strong visual idea **without sacrificing usability**.

The site should feel bold and memorable, but it must still be fast, understandable and robust.
