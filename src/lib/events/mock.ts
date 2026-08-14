import type { Event, EventProvider } from './types'

const mockEvents: Event[] = [
  {
    id: 'actionwochenende-1',
    title: 'Actionwochenende 1',
    slug: 'actionwochenende-1',
    start: new Date('2026-01-30T16:00:00'),
    end: new Date('2026-02-01T15:00:00'),
    location: 'Klause 2.0, Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 9,
    ageMax: 15,
    price: '35 € (inkl. Vollverpflegung, Übernachtung & Material)',
    teaser: 'Raus aus dem Alltag, rein ins Erlebnis: Ein winterliches Wochenende voller Action, Spaß und echter Gemeinschaft.',
    description:
      'Wenn die Feiertage vorbei sind und der Winter richtig angekommen ist, wird es Zeit für etwas, worauf man sich freuen kann: ein Wochenende voller Action, Spaß und echter Gemeinschaft in der Klause 2.0 in Heiligenstadt!\n\nZusammen erleben wir spannende Aktionen, lustige Spiele, gemeinsames Kochen, gemütliche Abende und jede Menge Abenteuer. Raus aus dem Alltag, rein ins Erlebnis – genau der richtige Neustart ins neue Jahr.\n\nP.S.: Bring gern einen Freund mit – gemeinsam macht’s noch mehr Spaß!',
    highlights: [
      'Spannende Aktionen & Geländespiele',
      'Gemeinsames Kochen & Küchencrew',
      'Gemütliche Abende & Kaminfeuer',
      '100% handyfreie Zeit – echte Gemeinschaft',
    ],
    packingList: [
      'Persönliche Sachen, Hausschuhe & Kulturbeutel',
      'Krankenkassenkarte & Impfausweis',
      'Wetterfeste Abenteuerkleidung & feste Schuhe (für draußen)',
      'Schlafsack oder Bettbezug und Bettlaken (Leihgebühr: 5 €)',
      'Taschenlampe oder Kopflampe',
    ],
    image: '/placeholders/story.svg',
    registrationUrl: 'https://smj-wegweiser.de/civicrm/event/register/?cid=0&reset=1&id=56',
    category: 'weekend',
    contact: {
      name: 'Jonathan & Vinzenz',
      role: 'Diözesanleitung',
      email: 'vinzenz.hupe@smj-wegweiser.de',
    },
  },
  {
    id: 'familientag-2026',
    title: 'Familientag im Rahmen der BDKJ Sozialaktion',
    slug: 'familientag-2026',
    start: new Date('2026-04-25T09:00:00'),
    end: new Date('2026-04-26T18:00:00'),
    location: 'Heilbad Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    teaser: 'Spiel, Spaß und Spannung für die ganze Familie im Rahmen der Sozialaktion.',
    description:
      'Gemeinsamer Aktionstag für Kinder, Jugendliche und Familien mit bunten Mitmachstationen, Grillen und Begegnung.',
    category: 'general',
    contact: {
      name: 'SMJ Regio Wegweiser',
      role: 'Organisationsteam',
      email: 'kontakt@smj-wegweiser.de',
    },
  },
  {
    id: 'actionwochenende-2',
    title: 'Actionwochenende 2',
    slug: 'actionwochenende-2',
    start: new Date('2026-05-08T16:00:00'),
    end: new Date('2026-05-10T13:00:00'),
    location: 'Klause 2.0, Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 9,
    ageMax: 15,
    price: '35 € (inkl. Vollverpflegung, Übernachtung & Material)',
    teaser: 'Frühling, Natur & Teamgeist: Das zweite große Actionwochenende des Jahres.',
    description:
      'Draußen im Wald die ersten warmen Tage nutzen: Geländespiele, Kochen über offenem Feuer und Vorbereitung auf das große Sommerzeltlager!\n\nP.S.: Bring gern einen Freund mit – gemeinsam macht’s mehr Spaß!',
    highlights: [
      'Geländespiel im Wald & Taktik-Challenges',
      'Kochen & Grillen am offenen Feuer',
      'Gemeinschaft & Kaminabend',
      '100% handyfreie Zeit',
    ],
    packingList: [
      'Persönliche Sachen, Hausschuhe & Kulturbeutel',
      'Krankenkassenkarte & Impfausweis',
      'Wetterfeste Abenteuerkleidung & feste Schuhe',
      'Schlafsack oder Bettbezug und Bettlaken (Leihgebühr: 5 €)',
      'Taschenlampe oder Kopflampe',
    ],
    image: '/placeholders/wide.svg',
    registrationUrl: 'https://smj-wegweiser.de/civicrm/event/register/?id=57&reset=1',
    category: 'weekend',
    contact: {
      name: 'Jonathan & Vinzenz',
      role: 'Diözesanleitung',
      email: 'vinzenz.hupe@smj-wegweiser.de',
    },
  },
  {
    id: 'zeltlager-2026',
    title: 'Zeltlager 2026 – Wegweiser des Schattens',
    slug: 'zeltlager',
    start: new Date('2026-07-08T14:00:00'),
    end: new Date('2026-07-17T13:00:00'),
    location: 'Zeltplatz Wiesental, Thalwenden',
    address: 'Birkenfelder Str., 37318 Uder-Thalwenden',
    ageMin: 9,
    ageMax: 14,
    teaser: '10 Tage Zeltdorf, Sandsteinfelsen, Nachtwache & packende Geländespiele: Das Hauptevent des Jahres im Wiesental!',
    description:
      'Zehn Tage draußen im Wiesental bei Thalwenden. Zehn Tage Zeltstadt, Nachtüberfälle, Felsenklettern, Fahnenklau, Kochen über offenem Feuer und das große Lagermotto: Wegweiser des Schattens. Unser absolutes Jahreshighlight für alle Jungs von 9 bis 14 Jahren!',
    highlights: [
      'Zeltdorf im malerischen Wiesental',
      'Nachtwache, Bundesfeuer & Fackelläufe',
      'Großes Lagerspiel nach Motto-Storyline',
      '100% handyfreie Natur- und Gemeinschaftserfahrung',
    ],
    packingList: [
      'Warmer Schlafsack & dicke Isomatte / Luftbett',
      'Wanderstiefel, feste Schuhe & Gummistiefel',
      'Regenfeste Kleidung, warme Jacke & Badesachen',
      'Essgeschirr, Becher & Besteck im Stoffbeutel',
      'Taschenlampe / Kopflampe mit Ersatzbatterien',
      'Krankenkassenkarte & Impfausweis',
    ],
    image: '/placeholders/camp-hero.svg',
    registrationUrl: '/abenteuer/zeltlager/2026/',
    category: 'camp',
    contact: {
      name: 'Vinzenz Hupe & Kilian Schlosser',
      role: 'Lagerleitung',
      email: 'vinzenz.hupe@smj-wegweiser.de',
    },
  },
  {
    id: 'sterntreffen',
    title: 'Sterntreffen',
    slug: 'sterntreffen',
    start: new Date('2026-08-28T15:00:00'),
    end: new Date('2026-08-30T14:00:00'),
    location: 'Klause 2.0, Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 15,
    ageMax: 25,
    price: '35 € (inkl. Vollverpflegung & Programm)',
    teaser: 'Das Wochenende für alle ab 15 Jahren, die aus dem Zeltlager-Alter raus sind und Verantwortung übernehmen.',
    description:
      'Das Sterntreffen bringt alle Jugendlichen und jungen Erwachsenen zusammen, die der SMJ Regio Wegweiser verbunden sind: Ehemalige Zeltlager-Teilnehmer, Gruppenleiter und Interessierte. Ein Wochenende für tiefgehende Werkstattrunden, Austausch auf Augenhöhe, Visionen für die Region, Kaminabende und gelebten Glauben.',
    highlights: [
      'Zukunftswerkstatt & Regionalkonferenz',
      'Leitungs- & Gruppenleiter-Impulse',
      'Lange Kaminabende & ehrlicher Austausch',
      'Gottesdienst & Gemeinschaft',
    ],
    packingList: [
      'Schlafsack & Hausschuhe',
      'Kleidung für drinnen und draußen',
      'Notizbuch / Schreibzeug',
      'Musikinstrumente (falls vorhanden)',
      'Krankenkassenkarte',
    ],
    image: '/placeholders/story.svg',
    registrationUrl: 'https://smj-wegweiser.de/civicrm/event/register/?reset=1&id=59',
    category: 'special',
    contact: {
      name: 'Jonathan Hunold',
      role: '2. Diözesanleiter',
      email: 'jonathan.hunold@smj-wegweiser.de',
    },
  },
  {
    id: 'actionwochenende-3',
    title: 'Actionwochenende 3',
    slug: 'actionwochenende-3',
    start: new Date('2026-11-20T16:00:00'),
    end: new Date('2026-11-22T15:00:00'),
    location: 'Klause 2.0, Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 9,
    ageMax: 15,
    price: '35 € (inkl. Vollverpflegung, Übernachtung & Material)',
    teaser: 'Der Jahresabschluss: Kaminabende, Nachtgeländespiel und Gemeinschaft in der Klause 2.0.',
    description:
      'Das dritte Actionwochenende schließt das Jahr ab: Ein starkes Wochenende in der Klause 2.0 mit Nachtmissionen im Wald, gemütlichen Abenden am Kamin und tollem Essen.',
    highlights: [
      'Nachtgeländespiel im Wald mit Fackeln',
      'Burger & Kochen am Feuer',
      'Gemütliche Kaminabende',
      '100% analoge Auszeit',
    ],
    packingList: [
      'Persönliche Sachen, Hausschuhe & Kulturbeutel',
      'Krankenkassenkarte & Impfausweis',
      'Warme Winterkleidung & feste Schuhe',
      'Schlafsack oder Bettbezug und Bettlaken (Leihgebühr: 5 €)',
      'Taschenlampe oder Kopflampe',
    ],
    image: '/placeholders/story.svg',
    registrationUrl: 'https://smj-wegweiser.de/civicrm/event/register/?reset=1&id=58',
    category: 'weekend',
    contact: {
      name: 'Jonathan & Vinzenz',
      role: 'Diözesanleitung',
      email: 'vinzenz.hupe@smj-wegweiser.de',
    },
  },
]

export class MockEventProvider implements EventProvider {
  async getEvents(): Promise<Event[]> {
    return mockEvents
  }

  async getEvent(id: string): Promise<Event | null> {
    return mockEvents.find((event) => event.id === id || event.slug === id) ?? null
  }
}
