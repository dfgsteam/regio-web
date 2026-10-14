import type { ImageMetadata } from 'astro'
import kilianPortrait from '../assets/images/team/kilian-schlosser.png'
import vinzenzPortrait from '../assets/images/team/vinzenz-hupe.png'
import jonathanPortrait from '../assets/images/team/jonathan-hunold.png'
import juliusPortrait from '../assets/images/team/julius.png'
import rainerPortrait from '../assets/images/team/rainer.png'
import christianPortrait from '../assets/images/team/christian.png'
import silasPortrait from '../assets/images/team/silas.png'
import immoPortrait from '../assets/images/team/immo.png'
import nilsPortrait from '../assets/images/team/nils.png'
import fietePortrait from '../assets/images/team/fiete.png'
import nathanelPortrait from '../assets/images/team/nathanel.png'
import lukasPortrait from '../assets/images/team/lukas.png'
import hannesPortrait from '../assets/images/team/hannes.png'
import toniPortrait from '../assets/images/team/toni.png'

export interface TeamMember {
  role: string
  badge: string
  name: string
  email: string
  image: ImageMetadata | string
  description: string
}

export interface GroupLeader {
  name: string
  image: ImageMetadata | string
}

export const leadershipTeam: TeamMember[] = [
  {
    role: 'Regiosprecher',
    badge: 'Regiosprecher',
    name: 'Kilian Schlosser',
    email: 'kilian.schlosser@smj-wegweiser.de',
    image: kilianPortrait,
    description:
      'Koordination der Regio Wegweiser, Vernetzung und Gesamtverantwortung für die Aktionen vor Ort.',
  },
  {
    role: '1. Diözesanleiter',
    badge: 'Diözesanleitung',
    name: 'Vinzenz Hupe',
    email: 'vinzenz.hupe@smj-wegweiser.de',
    image: vinzenzPortrait,
    description:
      'Vertretung auf Diözesanebene, Aus- und Weiterbildung der Gruppenleiter sowie Jahresplanung.',
  },
  {
    role: '2. Diözesanleiter',
    badge: 'Diözesanleitung',
    name: 'Jonathan Hunold',
    email: 'jonathan.hunold@smj-wegweiser.de',
    image: jonathanPortrait,
    description:
      'Unterstützung der Leitung, Organisation von Wochenenden und Begleitung neuer Gruppenleiter.',
  },
  {
    role: 'Geistliche Begleitung',
    badge: 'Begleitung',
    name: 'Rainer Marius Gotter',
    email: 'kontakt@smj-wegweiser.de',
    image: rainerPortrait,
    description:
      'Geistliche Impulse, Gottesdienste, Andachten und seelsorgliche Begleitung der Freizeiten.',
  },
  {
    role: 'Finanzen',
    badge: 'Finanzen',
    name: 'Julian Hupe',
    email: 'julian.hupe@smj-wegweiser.de',
    image: '/team/avatar-silhouette.svg',
    description:
      'Lagerbeiträge, Zuschüsse, Materialkasse und transparente Abrechnung aller Freizeiten.',
  },
  {
    role: 'Öffentlichkeitsarbeit',
    badge: 'Öffentlichkeit',
    name: 'Christian Watterott',
    email: 'kontakt@smj-wegweiser.de',
    image: christianPortrait,
    description:
      'Pressearbeit, Social Media und Außendarstellung der Regio Wegweiser.',
  },
  {
    role: 'Technische Verwaltung',
    badge: 'Technik',
    name: 'Julius Hunold',
    email: 'kontakt@smj-wegweiser.de',
    image: juliusPortrait,
    description: 'Betreuung der Website und der digitalen Werkzeuge der Region.',
  },
]

export const groupLeaders: GroupLeader[] = [
  { name: 'Silas', image: silasPortrait },
  { name: 'Immo', image: immoPortrait },
  { name: 'Valentin', image: '/team/avatar-silhouette.svg' },
  { name: 'Nils', image: nilsPortrait },
  { name: 'Magnus', image: '/team/avatar-silhouette.svg' },
  { name: 'Fiete', image: fietePortrait },
  { name: 'Nathanael', image: nathanelPortrait },
  { name: 'Lukas', image: lukasPortrait },
  { name: 'Jakob', image: '/team/avatar-silhouette.svg' },
  { name: 'Hannes', image: hannesPortrait },
  { name: 'Dominik', image: '/team/avatar-silhouette.svg' },
  { name: 'Maxi', image: '/team/avatar-silhouette.svg' },
  { name: 'Toni', image: toniPortrait },
]

/**
 * Gibt die beiden Diözesanleiter (1. und 2. Diözesanleiter) zurück
 */
export function getDioezesanleiter(): TeamMember[] {
  return leadershipTeam.filter(
    (m) => m.badge === 'Diözesanleitung' || m.role.toLowerCase().includes('diözesanleiter')
  )
}
