# DESIGN.md

## Purpose

This document defines the visual and interaction design system for the **SMJ Regio Wegweiser** website.

It complements `AGENTS.md`.

`AGENTS.md` defines how the project should be engineered.  
`DESIGN.md` defines how the project should **look, feel and move**.

The design must communicate:

> Adventure first. Organization second.

The website should feel like opening an expedition journal, entering a camp or discovering a place you want to be part of.

It must not feel like a church website template, a youth association template, a SaaS landing page, a generic Tailwind website, a corporate NGO website or a clean startup portfolio.

## Design Objective

The primary emotional target is a boy aged **9–14**.

The desired first reaction is:

> Da will ich mit.

The secondary audience is parents.

Their desired reaction is:

> Das sieht außergewöhnlich aus, aber gleichzeitig vertrauenswürdig und gut organisiert.

These two requirements must coexist.

## Brand Personality

The SMJ Regio Wegweiser visual identity should feel adventurous, outdoor, rough, energetic, authentic, young, masculine, communal, confident, handmade, imperfect and cinematic.

It should **not** feel militaristic, aggressive, childish, cartoonish, glossy, luxurious, corporate, overly religious in visual cliché or artificially “extreme”.

## Core Creative Direction

The permanent SMJ website uses an **Expedition / Field Journal aesthetic**.

Visual references include expedition maps, topographic maps, field journals, trail markings, analog photography, camp documentation, outdoor equipment, stamped documents, handwritten field notes, coordinates, labels, folded maps, rough paper, tape and weathered surfaces.

These references should be abstracted into a modern digital design.

## Primary Claim

Current primary direction:

# RAUS. INS ABENTEUER.

Possible supporting copy:

> Zeltlager. Lagerfeuer. Wettkämpfe. Freunde.  
> Zehn Tage, die anders sind als alles davor.

Communication principle:

**short, physical, direct, emotional.**

## Color System

Initial permanent SMJ palette:

```css
:root {
  --forest-950: #111713;
  --forest-900: #182019;
  --paper: #F1EBDD;
  --sand: #C9BA99;
  --orange: #FF5A1F;
  --ember: #D73B17;
  --muted: #8D9389;
}
```

### Primary roles

- Forest: major backgrounds, navigation, dark sections, cinematic sequences, footer
- Paper: primary text on dark backgrounds, light editorial sections
- Signal Orange: primary CTA, markers, labels, interaction feedback
- Sand: quiet editorial areas and parent-focused content

Prefer roughly:

```text
70% dark / neutral
20% paper / sand
10% accent
```

## Zeltlager Color Independence

The annual Zeltlager campaign may define its own palette.

The yearly theme may substantially deviate from the permanent SMJ palette, but must preserve accessibility, usability, registration clarity and global navigation integrity.

The annual theme must not leak into unrelated pages.

## Typography

Use three conceptual layers.

### Display

Condensed, heavy, uppercase-friendly, bold, compact and with a strong silhouette.

Used for heroes, chapter headings, event campaigns and major CTAs.

### Body

Modern, highly readable sans-serif.

Target readable line length:

```text
55–75 characters
```

### Utility / Expedition

Optional monospace or technical font.

Use sparingly for:

```text
FIELD NOTE 03
TAG 07
06:14 UHR
51°22'44"N
10°08'17"E
```

## Typography Scale

Prefer fluid `clamp()`-based sizing.

```text
Hero Display: 8–16vw desktop
Section Display: 5–10vw desktop
Large Heading: 3–6rem
Heading: 2–4rem
Body Large: 1.2–1.5rem
Body: 1rem–1.125rem
Utility: 0.7–0.9rem
```

## Layout Philosophy

Layouts should feel editorial rather than component-grid-driven.

Prefer large empty spaces, overlapping imagery, asymmetric compositions, visual tension, full-bleed photography, varying section rhythm and oversized typography.

Avoid repetitive equal-card layouts.

## Grid

Recommended:

```text
Desktop: 12 columns
Tablet: 8 columns
Mobile: 4 columns
```

Components may visually break out of the grid.

## Container Strategy

Use three conceptual widths:

```text
content
wide
full
```

## Section Rhythm

The homepage should alternate between tension, release, motion, stillness, dark, light, dense and empty.

Do not make every section equally spectacular.

## Photography

Prioritize real participants, action, physical interaction, nature, weather, dirt, fire, tents, cooking, games, hikes, groups, quiet moments and camp atmosphere.

Avoid generic stock photography.

Photography should feel close, physical, spontaneous, documentary, imperfect and alive.

## Image Ratios

Hero:

```text
landscape
16:9 or wider
minimum source width approximately 2400px
```

Story:

```text
4:5
```

Journal:

```text
3:2
4:5
1:1
16:9
```

## Texture

Possible textures:

- paper grain
- subtle film grain
- map paper
- scratched ink
- photocopy artifacts
- fabric
- weathered print

Textures must not reduce readability.

## Topographic Lines

Use for scroll transitions, section dividers, event decoration, navigation overlay and campaign backgrounds.

Keep them decorative.

## Maps and Coordinates

Use coordinates, route lines, location markers, contour lines, arrows and compass references.

Do not turn the interface into a literal navigation app.

## Stamps and Labels

Examples:

```text
REGIO WEGWEISER
9–14 JAHRE
FIELD NOTE
ZELTLAGER 2027
```

Use rotation carefully.

## Buttons

Primary CTA examples:

```text
NÄCHSTES ABENTEUER →
JETZT ANMELDEN →
ZUM ZELTLAGER →
```

Avoid rounded SaaS pill buttons.

## Cards

Avoid generic card-heavy layouts.

Prefer domain-specific components:

- EventCard
- JournalEntry
- ParentQuestion
- CampFact

## Navigation

Desktop navigation may begin transparent over the hero.

Primary CTA:

```text
NÄCHSTES ABENTEUER →
```

Mobile uses a fullscreen menu.

Suggested structure:

```text
01 Abenteuer
02 Über uns
03 Grundsätze
04 Team
05 Journal
```

## Custom Cursor

Optional desktop-only feature.

Possible states:

```text
●
ANSEHEN ↗
LOS →
ZIEHEN ↔
```

Never compromise usability.

## Motion Philosophy

Preferred motion characteristics:

- weight
- momentum
- layering
- reveal
- depth
- controlled overshoot

Avoid constant floating, random bouncing or meaningless motion.

## Signature Sequence: Hero

Initial state:

```text
fullscreen photography
SMJ REGIO WEGWEISER
RAUS.
INS ABENTEUER.
```

During scrolling:

```text
0–20%   Hero remains stable
20–40%  headline separates
40–60%  image changes tone
60–80%  topographic elements appear
80–100% transition toward expedition/map language
```

## Signature Sequence: Expedition Reel

Desktop:

- pinned section
- vertical scroll drives horizontal movement
- overlapping photographs
- field notes
- labels
- changing scale

Ending:

# UND DU MITTENDRIN.

## Signature Sequence: Five Pillars

```text
01 ZUSAMMENHALT
02 VERANTWORTUNG
03 WACHSEN
04 MANNSEIN
05 GLAUBE
```

Each receives an image, number, short statement and visual transition.

## Signature Sequence: Zeltlager

The Zeltlager teaser should visibly break from the normal homepage.

Possible interaction:

```text
closed/folded map or poster
↓
scroll
↓
poster unfolds
↓
annual artwork fills viewport
```

## Parent Section

The visual system deliberately calms down.

Use more readable layouts and subtle animation.

Communicate competence, trust, transparency and organization.

## Faith Section

Reflective rather than institutional.

Possible headline:

# ABENTEUER IST MEHR ALS ACTION.

Prefer real photography over cliché religious iconography.

## Field Journal

The gallery should feel like collected memories, not a media library.

Avoid giant uniform thumbnail grids.

## Event UI

Regular events prioritize clarity.

Immediately communicate what, when, where, for whom and what to do next.

## Zeltlager Theme Rules

Annual camp themes may change colors, display typography, textures, illustrations, decorative elements, campaign motion and hero composition.

They must not change accessibility standards, information hierarchy, registration usability, mobile usability or semantic structure.

## Mobile Design

Mobile is a first-class design target.

Do not reproduce every desktop composition.

On mobile:

- reduce pinning
- reduce horizontal sequences
- simplify overlaps
- prioritize photography
- keep text readable

## Accessibility

Required:

- strong contrast
- readable text
- visible focus states
- keyboard navigation
- large touch targets
- semantic hierarchy
- reduced-motion alternative

## Reduced Motion Design

When enabled:

- replace scrub sequences with static compositions
- show final states immediately
- remove long pins
- remove strong parallax
- preserve image hierarchy

## Performance and Design

Before adding a major visual effect ask:

1. Does it strengthen the story?
2. Is it understandable without motion?
3. Does it work on mobile?
4. Can it remain smooth on average hardware?
5. Is it worth its JS/image cost?

If not, simplify it.

## Design Anti-Patterns

Avoid:

- generic hero + three cards
- excessive border radius
- glassmorphism
- gradient blobs
- neon tech aesthetics
- dashboard UI
- endless icon grids
- excessive drop shadows
- autoplay background video everywhere
- every section being full-screen
- animation on every text line
- identical page layouts
- stock photography

## Final Design Test

### Boy Test

Would a 12-year-old think:

> Das sieht nach etwas aus, bei dem ich dabei sein will.

### Parent Test

Can a parent understand who is responsible, what the event is, when it happens, what it costs, how registration works and whom to contact?

### Brand Test

Could the page belong to a random startup or outdoor clothing company?

If yes, add more SMJ-specific character.

### Motion Test

Would the page still work if every animation were disabled?

If no, redesign the information hierarchy.

## Final Principle

The design should combine:

```text
ADVENTURE
+
COMMUNITY
+
ROUGH EDITORIAL DESIGN
+
REAL PHOTOGRAPHY
+
PURPOSEFUL MOTION
+
TRUST
```

The result should feel handcrafted, physical and memorable without becoming difficult to use.
