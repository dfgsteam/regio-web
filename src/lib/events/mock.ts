import type { Event, EventProvider } from './types'

const mockEvents: Event[] = [
  {
    id: 'actionwochenende-fruehjahr',
    title: 'Actionwochenende Frühjahr',
    slug: 'actionwochenende-fruehjahr',
    start: new Date('2027-04-16T16:00:00'),
    end: new Date('2027-04-18T14:00:00'),
    location: 'Wegweiserheim Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 9,
    ageMax: 14,
    price: '35 € (inkl. Vollverpflegung, Übernachtung & Material)',
    teaser: 'Ein ganzes Wochenende voller Geländespiel, Feuer, Handwerk und ersten Bewährungsproben.',
    description:
      'Freitagnachmittag ankommen, Sonntagmittag glücklich und ausgepowert nach Hause: Beim Actionwochenende im Frühjahr starten wir gemeinsam ins neue Jahr. Auf dem Programm stehen actionreiche Geländespiele im Wald, Kochen und Grillen am offenen Feuer, Holzarbeiten und eine unschlagbare Gemeinschaft. Ideal auch für alle, die zum ersten Mal SMJ-Luft schnuppern wollen!',
    highlights: [
      'Nachtgeländespiel im Wald mit Fackeln',
      'Gemeinsames Kochen & Burger am Lagerfeuer',
      'Bau- und Schnitz-Challenge in Teams',
      '100% handyfreie Zeit – echtes Abenteuer',
    ],
    packingList: [
      'Schlafsack & Spannbettlaken / Isomatte',
      'Wetterfeste Kleidung & feste Schuhe (für draußen im Wald)',
      'Hausschuhe & Wechselkleidung',
      'Taschenlampe oder Kopflampe',
      'Kulturbeutel & Handtuch',
      'Krankenkassenkarte & Impfausweis',
    ],
    image: '/placeholders/story.svg',
    registrationUrl: 'https://smj-wegweiser.de/anmeldung-actionwochenende',
    registrationDeadline: new Date('2027-04-05'),
    category: 'weekend',
    contact: {
      name: 'Kilian Schlosser',
      role: 'Regiosprecher',
      email: 'kilian.schlosser@smj-wegweiser.de',
    },
  },
  {
    id: 'actionwochenende-sommer',
    title: 'Actionwochenende Sommer',
    slug: 'actionwochenende-sommer',
    start: new Date('2027-06-25T16:00:00'),
    end: new Date('2027-06-27T14:00:00'),
    location: 'Zeltplatz Wiesental, Thalwenden',
    address: 'Birkenfelder Str., 37318 Uder-Thalwenden',
    ageMin: 9,
    ageMax: 14,
    price: '35 € (inkl. Vollverpflegung, Zelt & Material)',
    teaser: 'Sommer, Zeltplatz, Wettkampf – das große Vorbereitungswochenende kurz vor dem Zeltlager.',
    description:
      'Das letzte große Wochenende vor dem Sommerzeltlager! Wir treffen uns direkt auf dem Zeltplatz im Wiesental bei Thalwenden. Hier testen wir die Zelte, üben erste Lagerbauten, tragen packende Wettkämpfe aus und stimmen uns bei langen Abenden am Lagerfeuer auf das große Zeltlager ein.',
    highlights: [
      'Erste Zeltübernachtung im Wiesental',
      'Großes Strategie-Geländespiel im Felsenareal',
      'Lagerfeuer-Küche mit Kesselgulasch',
      'Vorbereitung auf das Zeltlagermotto',
    ],
    packingList: [
      'Warmer Schlafsack & robuste Isomatte',
      'Feste Wanderschuhe & Gummistiefel',
      'Wetterfeste Regenkleidung & warme Jacke',
      'Kopflampe / Taschenlampe mit vollen Batterien',
      'Taschenmesser (falls vorhanden)',
      'Krankenkassenkarte & persönliche Medikamente',
    ],
    image: '/placeholders/wide.svg',
    registrationUrl: 'https://smj-wegweiser.de/anmeldung-actionwochenende-sommer',
    registrationDeadline: new Date('2027-06-15'),
    category: 'weekend',
    contact: {
      name: 'Vinzenz Hupe',
      role: '1. Diözesanleiter',
      email: 'vinzenz.hupe@smj-wegweiser.de',
    },
  },
  {
    id: 'sterntreffen-2027',
    title: 'Sterntreffen 2027',
    slug: 'sterntreffen-2027',
    start: new Date('2027-10-01T17:00:00'),
    end: new Date('2027-10-03T13:00:00'),
    location: 'Wegweiserheim Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    ageMin: 15,
    ageMax: 25,
    price: '40 € (inkl. Vollverpflegung & Programm)',
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
    registrationUrl: 'https://smj-wegweiser.de/anmeldung-sterntreffen',
    registrationDeadline: new Date('2027-09-15'),
    category: 'special',
    contact: {
      name: 'Jonathan Hunold',
      role: '2. Diözesanleiter',
      email: 'jonathan.hunold@smj-wegweiser.de',
    },
  },
  {
    id: 'regiokonferenz-2027',
    title: 'Regiokonferenz der Wegweiser',
    slug: 'regiokonferenz-2027',
    start: new Date('2027-11-13T10:00:00'),
    end: new Date('2027-11-13T17:00:00'),
    location: 'Wegweiserheim Heiligenstadt',
    address: 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt',
    teaser: 'Die jährliche Konferenz aller Gruppenleiter, Mitarbeiter und Freunde der Region Wegweiser.',
    description:
      'Rückblick auf das vergangene Zeltlagerjahr, Neuwahlen der Diözesanleitung, Ausblick auf kommende Aktionen und gemeinsamer Austausch bei Kaffee und Kuchen.',
    category: 'general',
    contact: {
      name: 'Kilian Schlosser',
      role: 'Regiosprecher',
      email: 'kilian.schlosser@smj-wegweiser.de',
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
