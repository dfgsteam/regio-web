import type { Event, EventProvider } from './types'

export const mockEvents: Event[] = [
  {
    id: 'mock-camp-2026',
    title: 'Zeltlager 2026 – Wegweiser des Schattens',
    slug: 'zeltlager-2026',
    start: new Date('2026-07-08T14:00:00'),
    end: new Date('2026-07-18T13:00:00'),
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
    registrationUrl: 'https://smj-wegweiser.de/civicrm/event/register/?reset=1&id=55',
    category: 'camp',
    contact: {
      name: 'Vinzenz Hupe & Kilian Schlosser',
      role: 'Lagerleitung',
      email: 'vinzenz.hupe@smj-wegweiser.de',
    },
  },
  {
    id: 'mock-weekend-2026',
    title: 'Actionwochenende I',
    slug: 'actionwochenende-1-2026',
    start: new Date('2026-04-17T17:00:00'),
    end: new Date('2026-04-19T14:00:00'),
    location: 'Klause 2.0, Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 9,
    ageMax: 14,
    price: '30 € (inkl. Verpflegung & Übernachtung)',
    teaser: 'Drei Tage Vollgas rund um die Klause 2.0 mit Geländespielen, Lagerfeuer und Gemeinschaft.',
    description:
      'Drei Tage voller Action, Spaß und Abenteuer rund um die Klause 2.0. Wir starten mit Geländespielen im Wald, kochen gemeinsam am offenen Feuer und testen unseren Teamgeist bei spannenden Nachtaktionen.',
    highlights: [
      'Geländespiele im Wald & Nachtaktionen',
      'Lagerfeuer, Stockbrot & Geschichten',
      'Gemeinschaft & Übernachtung in der Klause 2.0',
    ],
    packingList: [
      'Schlafsack & Bettlaken / Kissenbezug',
      'Feste Schuhe & wetterfeste Kleidung',
      'Hausschuhe & Waschzeug',
      'Taschenlampe',
    ],
    image: '/placeholders/story.svg',
    registrationUrl: 'https://smj-wegweiser.de/civicrm/event/register/?reset=1&id=54',
    category: 'weekend',
    contact: {
      name: 'Regioteam',
      role: 'Wochenendleitung',
      email: 'team@smj-wegweiser.de',
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
