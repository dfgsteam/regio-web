export interface InstagramPost {
  id: string
  image: string
  alt: string
  location: string
  caption: string
  date: string
  likes: number
  comments: number
  tags: string[]
  url: string
}

export const instagramPosts: InstagramPost[] = [
  {
    id: 'post-1',
    image: '/placeholders/story.svg',
    alt: 'Pilgerreise der Wegweiser nach Cambrai',
    location: 'Cambrai, Frankreich',
    caption: '80 Kilometer zu Fuß von Lille nach Cambrai auf den Spuren von Josef Engling. Blasen an den Füßen, Regen im Nacken, aber offene Türen bei Gastfamilien und unbezahlbarer Teamgeist! 🎒🇫🇷',
    date: '03. Dez 2024',
    likes: 184,
    comments: 19,
    tags: ['#smjwegweiser', '#pilgerreise', '#josefengling', '#cambrai', '#gemeinschaft'],
    url: 'https://www.instagram.com/regio.wegweiser/',
  },
  {
    id: 'post-2',
    image: '/placeholders/reel.svg',
    alt: 'Lagerfeuer im Wiesental bei Thalwenden',
    location: 'Wiesental bei Thalwenden',
    caption: 'Dreck an den Schuhen. Rauch in den Klamotten. Geschichten im Kopf. Zehn Tage ohne Handy und Steckdose – dafür mit den besten Leuten am Lagerfeuer. 🔥🏕️',
    date: '18. Jul 2024',
    likes: 247,
    comments: 32,
    tags: ['#zeltlager', '#wiesental', '#thalwenden', '#lagerfeuer', '#abenteuer'],
    url: 'https://www.instagram.com/regio.wegweiser/',
  },
  {
    id: 'post-3',
    image: '/placeholders/group.svg',
    alt: 'Gruppenleiterrunde im Kleinen Paradies',
    location: 'Kleines Paradies, Heiligenstadt',
    caption: 'Jugend leitet Jugend! Planungswochenende und Regiokonferenz – das Leitungsteam bereitet die nächste Saison vor. Volle Motivation für 2026! ⚔️📋',
    date: '28. Sep 2024',
    likes: 156,
    comments: 14,
    tags: ['#regiokonferenz', '#jugendleitetjugend', '#smj', '#team', '#eichsfeld'],
    url: 'https://www.instagram.com/regio.wegweiser/',
  },
  {
    id: 'post-4',
    image: '/placeholders/camp-hero.svg',
    alt: 'Wegweiser des Schattens Banner',
    location: 'Wiesental bei Thalwenden',
    caption: 'Das Zeltlagermotto 2026 steht fest: WEGWEISER DES SCHATTENS. 08. bis 17. Juli im Wiesental. Bist du bereit für die Nachtmissionen? Anmeldung ab sofort geöffnet! 🌲🌑',
    date: '15. Jan 2026',
    likes: 312,
    comments: 48,
    tags: ['#zeltlager2026', '#wegweiserdesschattens', '#motto', '#anmeldung', '#sommerlager'],
    url: 'https://www.instagram.com/regio.wegweiser/',
  },
  {
    id: 'post-5',
    image: '/placeholders/wide.svg',
    alt: 'Morgendämmerung über dem Zeltlager',
    location: 'Sandsteinfelsen Thalwenden',
    caption: 'Morgenstille über den Sandsteinfelsen, kurz bevor das Lager erwacht und der Kessel über dem Feuer brodelt. Natur pur im Eichsfeld. 🌄🌲',
    date: '14. Jul 2024',
    likes: 219,
    comments: 17,
    tags: ['#eichsfeld', '#sonnenaufgang', '#draussenzuhause', '#naturerlebnis'],
    url: 'https://www.instagram.com/regio.wegweiser/',
  },
  {
    id: 'post-6',
    image: '/placeholders/hero.svg',
    alt: 'Geländespiel im Wald',
    location: 'Heiligenstadt / Uder',
    caption: 'Actionwochenende: Zwei Teams, ein Wald, Fahnenklau und volles Tempo bis zur letzten Sekunde. Zusammenhalt wird hier nicht erklärt, sondern gelebt! 🏃‍♂️⚡',
    date: '22. Nov 2024',
    likes: 198,
    comments: 23,
    tags: ['#actionwochenende', '#geländespiel', '#fahnenjagd', '#mannesjugend'],
    url: 'https://www.instagram.com/regio.wegweiser/',
  },
]
