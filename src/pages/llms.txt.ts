import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('SITE_URL is required for llms.txt')

  const url = (path: string) => new URL(path, site).toString()
  const content = `# SMJ Regio Wegweiser

> Die SMJ Regio Wegweiser ist die Schönstatt-Mannesjugend in der Region Wegweiser. Sie organisiert Zeltlager, Wochenenden und weitere Aktionen für Jungen; das Zeltlager richtet sich vor allem an 9- bis 14-Jährige.

Diese Website enthält Informationen für Teilnehmer, Eltern und Interessierte. Veranstaltungstermine, Anmeldelinks und freie Plätze können sich ändern. Für diese Angaben ist immer die jeweilige Veranstaltungsseite maßgeblich. Die interne Leiter-Toolbox gehört nicht zu den öffentlichen Informationen.

## Organisation

- [Startseite](${url('/')}): Überblick über die SMJ Regio Wegweiser.
- [Über uns](${url('/ueber-uns/')}): Herkunft, Arbeitsweise und Jugend leitet Jugend.
- [Grundsätze](${url('/grundsaetze/')}): Die fünf Säulen der SMJ.
- [Team](${url('/team/')}): Menschen und Zuständigkeiten.
- [Kontakt](${url('/kontakt/')}): Zentrale Anlaufstelle.

## Veranstaltungen und Berichte

- [Abenteuer und aktuelle Termine](${url('/abenteuer/')}): Veranstaltungen mit Details und Anmeldestatus.
- [Zeltlager](${url('/abenteuer/zeltlager/')}): Informationen zum jährlich wechselnden Zeltlager.
- [Aktuelles](${url('/aktuelles/')}): Berichte und Rückblicke.
- [Galerie](${url('/galerie/')}): Fotos und Eindrücke.

## Weitere Informationen

- [Sitemap](${url('/sitemap-index.xml')}): Öffentliche Seiten dieser Website.
- [Datenschutz](${url('/datenschutz/')}): Umgang mit personenbezogenen Daten.
- [Impressum](${url('/impressum/')}): Rechtliche Angaben.
`

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
