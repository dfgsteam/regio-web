import type { Event, EventProvider } from './types'

const mockEvents: Event[] = [
  {
    id: 'actionwochenende-fruehjahr',
    title: 'Actionwochenende Frühjahr',
    slug: 'actionwochenende-fruehjahr',
    start: new Date('2027-04-16T16:00:00'),
    end: new Date('2027-04-18T14:00:00'),
    location: 'Heiligenstadt',
    ageMin: 9,
    ageMax: 14,
    teaser: 'Ein Wochenende voller Geländespiel, Feuer und ersten Bewährungsproben.',
    description:
      'Freitagabend Ankommen, Sonntagmittag kaputt nach Hause. Dazwischen: Geländespiele im Dunkeln, Kochen am Feuer und eine Gruppe, die zusammenwächst.',
    registrationUrl: 'https://smj-wegweiser.de/anmeldung-actionwochenende',
    registrationDeadline: new Date('2027-04-01'),
    category: 'weekend',
    contact: { name: 'Regio-Wegweiser Team', email: 'kontakt@smj-wegweiser.de' },
  },
  {
    id: 'actionwochenende-sommer',
    title: 'Actionwochenende Sommer',
    slug: 'actionwochenende-sommer',
    start: new Date('2027-06-25T16:00:00'),
    end: new Date('2027-06-27T14:00:00'),
    location: 'Thalwenden',
    ageMin: 9,
    ageMax: 14,
    teaser: 'Sommer, Wiese, Wettkampf – das Wochenende kurz vor dem großen Ding.',
    description:
      'Das letzte große Wochenende vor dem Zeltlager: Teamspiele, Bauprojekte und ein Abend, an dem die Planen für den Sommer geprobt werden.',
    registrationUrl: 'https://smj-wegweiser.de/anmeldung-actionwochenende-sommer',
    registrationDeadline: new Date('2027-06-10'),
    category: 'weekend',
    contact: { name: 'Regio-Wegweiser Team', email: 'kontakt@smj-wegweiser.de' },
  },
  {
    id: 'sterntreffen-2027',
    title: 'Sterntreffen 2027',
    slug: 'sterntreffen-2027',
    start: new Date('2027-10-01T17:00:00'),
    end: new Date('2027-10-03T13:00:00'),
    location: 'Wegweiserheim, Heiligenstadt',
    ageMin: 15,
    teaser: 'Das Wochenende für alle, die aus dem Zeltlager-Alter raus sind.',
    description:
      'Werkstattrunden, Feuer, ehrliche Gespräche: das Sterntreffen bringt zusammen, die beim Zeltlager groß geworden sind und selbst Verantwortung tragen wollen.',
    registrationUrl: 'https://smj-wegweiser.de/anmeldung-sterntreffen',
    registrationDeadline: new Date('2027-09-01'),
    category: 'special',
    contact: { name: 'Regio-Wegweiser Team', email: 'kontakt@smj-wegweiser.de' },
  },
]

export class MockEventProvider implements EventProvider {
  async getEvents(): Promise<Event[]> {
    return mockEvents
  }

  async getEvent(id: string): Promise<Event | null> {
    return mockEvents.find((event) => event.id === id) ?? null
  }
}
