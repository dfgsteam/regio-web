export interface GalleryImage {
  src: string
  alt: string
  ratio: '16:10' | '4:5' | '3:2' | '5:3'
  meta?: string
  note?: string
}

export interface GalleryEvent {
  name: string
  images: GalleryImage[]
}

export interface GalleryYear {
  year: number
  events: GalleryEvent[]
}

// Mock gallery until real photography arrives.
// Replaces src/lib/journal/gallery.ts with data from an asset pipeline later.
export const galleryYears: GalleryYear[] = [
  {
    year: 2027,
    events: [
      {
        name: 'Winterlager',
        images: [
          {
            src: '/placeholders/journal-landscape.svg',
            alt: 'Platzhalterbild – verschneites Zeltdorf',
            ratio: '16:10',
            meta: 'TAG 01 · 16:40 UHR',
            note: 'Das Zeltdorf steht. Es schneit wieder.',
          },
          {
            src: '/placeholders/journal-portrait.svg',
            alt: 'Platzhalterbild – Gesicht im Licht des Feuers',
            ratio: '4:5',
            meta: 'TAG 02 · 22:37 UHR',
            note: 'Das Feuer hat den Regen überlebt.',
          },
          {
            src: '/placeholders/journal-landscape.svg',
            alt: 'Platzhalterbild – Morgennebel über der Wiese',
            ratio: '16:10',
            meta: 'TAG 03 · 06:14 UHR',
          },
        ],
      },
      {
        name: 'Actionwochenende',
        images: [
          {
            src: '/placeholders/journal-portrait.svg',
            alt: 'Platzhalterbild – Geländespiel im Wald',
            ratio: '4:5',
            meta: 'TAG 1 · 14:05 UHR',
            note: 'Zwei Teams. Ein Wald. Keine Schonung.',
          },
          {
            src: '/placeholders/journal-landscape.svg',
            alt: 'Platzhalterbild – Siegerpose am Ziel',
            ratio: '16:10',
            meta: 'TAG 2 · 11:22 UHR',
          },
        ],
      },
    ],
  },
  {
    year: 2026,
    events: [
      {
        name: 'Zeltlager Piraten',
        images: [
          {
            src: '/placeholders/journal-landscape.svg',
            alt: 'Platzhalterbild – selbstgebautes Floß im Wasser',
            ratio: '16:10',
            meta: 'TAG 04 · 15:18 UHR',
            note: 'Die Flotte hält. Fast.',
          },
          {
            src: '/placeholders/journal-portrait.svg',
            alt: 'Platzhalterbild – Flagge am Mast',
            ratio: '4:5',
            meta: 'TAG 06 · 09:40 UHR',
          },
          {
            src: '/placeholders/journal-landscape.svg',
            alt: 'Platzhalterbild – Abend am Strand',
            ratio: '16:10',
            meta: 'TAG 09 · 21:03 UHR',
            note: 'Der Schatz war die Gruppe. Ich weiß, kitschig. Stimmt aber.',
          },
        ],
      },
      {
        name: 'Pilgerreise',
        images: [
          {
            src: '/placeholders/journal-portrait.svg',
            alt: 'Platzhalterbild – Weg durchs Feld',
            ratio: '4:5',
            meta: 'TAG 03 · 10:00 UHR',
          },
          {
            src: '/placeholders/journal-landscape.svg',
            alt: 'Platzhalterbild – Abendandacht',
            ratio: '16:10',
            meta: 'TAG 05 · 20:30 UHR',
            note: 'Stille, die man hören kann.',
          },
        ],
      },
    ],
  },
]
