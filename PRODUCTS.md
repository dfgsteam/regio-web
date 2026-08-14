# PRODUCTS.md

## Purpose

This document defines the product structure, audiences, content domains, feature scope and behavioral rules for the **SMJ Regio Wegweiser** website.

It complements:

- `AGENTS.md` — engineering rules
- `DESIGN.md` — visual and interaction rules

This document answers:

> What are we building, for whom, and what should it do?

## Product Vision

The website should make it easy for a boy to discover the SMJ, become excited about participating and find his next event.

At the same time, parents must quickly gain enough confidence and information to allow participation.

The website combines:

```text
INSPIRATION
+
INFORMATION
```

For boys:

> Da will ich mit.

For parents:

> Da kann ich mein Kind guten Gewissens hinschicken.

## Primary Audiences

### Boys aged 9–14

Primary audience.

Typical questions:

- Was machen die da?
- Ist das cool?
- Wer ist dabei?
- Gibt es Zeltlager?
- Wann ist das nächste Treffen?
- Wie sieht das aus?
- Muss ich schon jemanden kennen?

They should receive photography, stories, adventure, community, short explanations and clear event CTAs.

### Parents

Important secondary audience.

Typical questions:

- Wer betreut mein Kind?
- Wer steckt hinter der SMJ?
- Was sind die Werte?
- Wie läuft eine Veranstaltung ab?
- Wie alt sind die Teilnehmer?
- Was kostet es?
- Wo findet es statt?
- Was muss mein Kind mitbringen?
- Wer ist Ansprechpartner?
- Wie funktioniert die Anmeldung?

### Older Participants

Some special events target older teenagers and young men.

Typical target:

```text
15+
```

There may be years without such a special event.

## Core Product Areas

The website consists conceptually of three products.

```text
1. SMJ BRAND SITE
2. EVENT SYSTEM
3. ZELTLAGER CAMPAIGN SYSTEM
```

## Product 1 – SMJ Brand Site

Responsibilities:

- explain what SMJ Regio Wegweiser is
- communicate values
- introduce the team
- explain Schönstatt background
- build trust
- show recent experiences
- direct users toward events

Primary routes:

```text
/
├── /ueber-uns/
├── /grundsaetze/
├── /team/
├── /journal/
├── /galerie/
├── /kontakt/
├── /impressum/
└── /datenschutz/
```

## Homepage

The homepage is the main acquisition experience.

Primary job:

> create interest and move the visitor toward participation.

Secondary jobs:

- explain core values
- establish trust
- surface upcoming events
- highlight the Zeltlager
- show recent activity
- answer initial parent concerns

## Homepage Story

Expected narrative:

```text
01 DER RUF
RAUS. INS ABENTEUER.

02 DAS ERLEBNIS
What does SMJ actually feel like?

03 GEMEINSCHAFT
Show experiences rather than explain organization.

04 WOFÜR WIR STEHEN
Five pillars.

05 DEIN NÄCHSTES ABENTEUER
Upcoming events.

06 ZELTLAGER
Annual major campaign.

07 FÜR ELTERN
Trust and practical information.

08 GLAUBE
Faith as natural part of the experience.

09 FIELD JOURNAL
Recent stories.

10 CTA
NÄCHSTES MAL BIST DU DABEI.
```

## About

`/ueber-uns/` consolidates:

- What is SMJ?
- What is Regio Wegweiser?
- Schönstatt
- Christian identity
- how youth work operates
- youth-leading-youth
- history/background where useful

## Principles

`/grundsaetze/` explains the five core pillars:

```text
01 Zusammenhalt
02 Verantwortung
03 Wachsen
04 Mannsein
05 Glaube
```

Each principle should contain a short core statement, concise explanation and concrete real-world example.

## Team

`/team/` establishes trust.

Primary content:

- group image
- leadership
- youth leaders
- youth-leading-youth principle
- experience / training
- central contact

## Contact

`/kontakt/` provides one central contact point.

Individual events may define additional contacts.

## Journal

The Journal represents editorial stories and recent activity.

Examples:

- reports
- trips
- Zeltlager retrospectives
- pilgrimages
- Regio activities
- special experiences

Content is stored as MDX.

The homepage should surface only the latest few entries.

## Field Journal / Gallery

The photo experience is not primarily an archive.

Its product goal is:

> show what participating actually feels like.

Organize primarily around year, event and story.

## Product 2 – Event System

The Event System handles normal upcoming activities.

Eventually the source of truth is **CiviCRM**.

Until integration is complete, use mock data through the same domain interface.

## Event Categories

Minimum categories:

```text
weekend
camp
special
```

## Regular Events

Regular events require:

- title
- date
- location
- age
- short description
- registration link
- optional registration deadline
- optional event-specific contact

They generally do not require highly customized campaign pages.

## Event Overview

`/abenteuer/` is the main event discovery page.

Primary goals:

1. show what happens next
2. communicate age suitability
3. make registration easy

Events should primarily be sorted chronologically.

## Event Data Contract

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

The internal model is the product contract.

CiviCRM response structures are implementation details.

## Event Provider

```ts
interface EventProvider {
  getEvents(): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
}
```

Initial:

```text
MockEventProvider
```

Future:

```text
CiviCrmEventProvider
```

No page or visual component should care which provider produced the data.

## Event Registration

Regular events may link directly to CiviCRM registration.

Some events may have an intermediate detail page.

The product model must support both.

## Event Contacts

Conceptually:

```text
event.contact
    ↓
if present: show event contact

otherwise
    ↓
use central contact
```

## Event Failure Behavior

If CiviCRM cannot be reached:

- evergreen pages remain available
- cached event data may be used
- clear fallback behavior should exist
- credentials/errors must never be exposed

## Product 3 – Zeltlager Campaign System

The Zeltlager is:

- a major annual event
- primarily for ages 9–14
- one of the strongest acquisition opportunities
- visually different every year
- dependent on an annual theme

It must not be modeled as merely another EventCard.

## Annual Theme Requirement

The Zeltlager theme can change substantially every year.

Examples:

```text
Piraten
Expedition
Wilder Westen
Mittelalter
```

Separate:

```text
content structure
from
annual campaign appearance
```

The global SMJ site should not require redesign when the annual camp theme changes.

## Zeltlager Content Model

Each year receives an MDX entry.

Example:

```text
src/content/camps/2027.mdx
```

Expected content includes:

- year
- title
- motto
- date
- location
- age
- registration
- theme configuration
- parent information
- FAQ
- story
- media
- optional special sections

## Zeltlager Standard Sections

```text
CampHero
CampFacts
CampStory
CampExperience
CampGallery
CampParents
CampFaq
CampRegistration
```

## Zeltlager Custom Sections

Annual campaigns may inject unique components.

Examples:

```text
PirateMap
ExpeditionRoute
WantedPoster
MissionBriefing
```

Target:

```text
80–90% shared
10–20% annual custom work
```

## Zeltlager Registration

Important information:

- date
- age
- location
- price if applicable
- registration deadline
- registration CTA
- event contact

Annual artwork must never obscure these basics.

## Zeltlager Parent Information

Possible topics:

- supervision
- leaders
- accommodation
- food
- safety
- packing
- arrival
- departure
- costs
- contact
- faith / program
- FAQ

## Special Event Product

In addition to the Zeltlager, one major special event for older participants may exist.

Typical target:

```text
15+
```

This event may have its own landing page, campaign styling and exist only in selected years.

Configuration:

```yaml
active: true
```

or:

```yaml
active: false
```

Inactive means completely absent from promotional layouts.

## Content Ownership

### Git / MDX

For:

- evergreen pages
- principles
- posts
- Journal stories
- Zeltlager campaigns
- special campaign content

### CiviCRM

For:

- regular live events
- dates
- registration
- event-specific operational information where available

## Content Update Frequency

### Rare

- About
- principles
- general organization information

### Occasional

- team
- contact information
- posts
- Journal

### Annual

- Zeltlager campaign
- major special event

### Frequent

- regular events through CiviCRM

## Static Content Strategy

A CMS is not required for V1.

Use Astro Content Collections and MDX.

Do not add a CMS unless editing requirements materially change.

## Homepage Event Logic

Homepage event presentation should prioritize:

```text
next relevant event
+
Zeltlager
+
active major special event
```

Do not show an overwhelming full calendar on the homepage.

## Variable Special Event Logic

If the event exists:

```text
homepage → show campaign teaser
```

If not:

```text
homepage → omit section → surrounding layout closes naturally
```

## Age Logic

General Zeltlager target:

```text
9–14
```

Regular events may define their own ranges.

Special events may target:

```text
15+
```

Never globally assume every event has the same age range.

## Parent Journey

Every important event page must independently answer:

```text
What?
When?
Where?
Age?
Who is responsible?
What does it cost?
How do I register?
Who can I contact?
```

## Boy Journey

```text
Homepage
↓
visual story
↓
Zeltlager / Event
↓
photos + experience
↓
event facts
↓
registration / parent discussion
```

## Parent Journey

```text
Google / Homepage
↓
Event
↓
facts
↓
parent information
↓
team / values if needed
↓
registration
```

## Calls to Action

Primary:

```text
NÄCHSTES ABENTEUER →
JETZT ANMELDEN →
ZUM ZELTLAGER →
MEHR ERFAHREN →
```

Secondary:

```text
WOFÜR WIR STEHEN →
TEAM KENNENLERNEN →
FRAGEN? SCHREIB UNS →
```

Avoid vague CTAs when a specific action is possible.

## Contact Form

V1 requires a basic contact form.

Potential fields:

```text
Name
E-Mail
Nachricht
```

Do not require unnecessary personal information.

## Search

Site-wide search is not required for V1.

## Accounts

No visitor accounts, participant login, parent portal or internal leader login.

## Payments

No custom payment system.

Use the external/CiviCRM registration process where applicable.

## Event Administration

No custom event administration interface.

CiviCRM remains responsible for operational event management.

## Analytics

Optional.

If added, prefer privacy-conscious analytics.

Useful questions:

- which events receive interest?
- do visitors reach registration?
- which content attracts visitors?
- does the Zeltlager campaign convert?

## SEO Product Requirements

Important discoverable entities:

- SMJ Regio Wegweiser
- Zeltlager
- upcoming events
- Schönstatt-Mannesjugend
- relevant regional activity
- individual articles

## Legacy Migration

Potentially migrate:

- evergreen SMJ information
- principles
- Schönstatt explanation
- team information
- contact information
- useful posts
- legal pages
- event concepts

Do not migrate:

- WordPress implementation
- visual layout
- embedded calendar UI
- outdated content
- obsolete formatting
- unnecessary plugin-generated markup

## Redirects

Important legacy URLs should receive redirects when the new site launches.

## V1 Scope

V1 includes:

- Astro website
- homepage storytelling
- About
- principles
- team
- contact
- Journal/posts
- Field Journal
- event overview
- event details
- mock event provider
- CiviCRM-ready architecture
- Zeltlager campaign system
- variable special event
- responsive design
- reduced motion
- SEO basics
- Docker
- CI/CD

## V1 Explicit Non-Goals

V1 does not include:

- CMS
- user accounts
- internal administration
- custom event management
- custom payment system
- social network
- comments
- forum
- complex site search
- React application architecture
- visual page builder
- native mobile app

## CiviCRM Integration Phase

The initial product should be fully usable with mock event data.

Later integration replaces:

```text
MockEventProvider
```

with:

```text
CiviCrmEventProvider
```

without redesigning event cards, event pages, homepage event sections, filters or registration CTAs.

## Content Resilience

If no event image exists:

```text
render designed fallback
```

If no special event exists:

```text
remove section
```

If an event has no dedicated contact:

```text
use central contact
```

If CiviCRM is temporarily unavailable:

```text
use safe fallback / cached data
```

## Product Quality Bar

Evaluate each feature from three perspectives.

### Participant

Can a boy understand why this is interesting?

### Parent

Can a parent understand what they need to know?

### Organizer

Can the SMJ maintain the content without rebuilding the website?

## Success Criteria

The product is successful when:

- visitors immediately understand that SMJ means real shared experiences
- upcoming activities are easy to discover
- Zeltlager feels like the annual flagship event
- parents can quickly find trustworthy information
- annual Zeltlager themes can change without redesigning the global site
- regular events can later come from CiviCRM without changing the frontend
- content can be maintained through MDX and Git
- the website remains fast despite its visual ambition

## Final Product Principle

Whenever deciding whether to add a feature, ask:

> Does this help someone join, understand, trust or remember the SMJ?

If the answer is no, the feature probably does not belong in V1.

The website's job is to turn:

```text
INTEREST
→
EXCITEMENT
→
TRUST
→
PARTICIPATION
```
