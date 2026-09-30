import type { CampaignEventData } from './types'

function splitFact(label: string, value: string): [string, string] {
  if (!value) return ['', '']
  if (label === 'WANN') {
    const match = value.match(/^(.*?)(?:\s+(\d{4}))?$/)
    if (match && match[1] && match[2]) return [match[1], match[2]]
  } else if (label === 'WO') {
    const parts = value.split(/,\s*/)
    if (parts.length >= 2 && parts[0]) return [parts[0], parts.slice(1).join(', ')]
  } else if (label === 'WER') {
    const match = value.match(/^(.*?)(?:\s*\((.*?)\))?$/)
    if (match && match[1] && match[2]) return [match[1], match[2]]
    if (!value.toLowerCase().includes('jungs')) return [value, 'FÜR JUNGS']
  } else if (label === 'BEITRAG') {
    const match = value.match(/^(\d+(?:[.,]\d+)?\s*€?)(?:\s*(.*))?$/i)
    if (match && match[1]) {
      const val = match[1].endsWith('€') ? match[1] : `${match[1]} €`
      return [val, match[2] || 'INKL. VERPFLEGUNG']
    }
  }
  return [value, '']
}

export function generateCampaignEmailHtml(event: CampaignEventData): string {
  const primaryColor = '#FF5A1F'
  const forestDark = '#111713'
  const forestCard = '#182019'
  const textLight = '#F1EBDD'
  const textMuted = '#C9BA99'

  const [date1, date2] = splitFact('WANN', event.dateStr)
  const [loc1, loc2] = splitFact('WO', event.locationStr)
  const [age1, age2] = splitFact('WER', event.ageStr)
  const [price1, price2] = splitFact('BEITRAG', event.priceStr)

  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.title} – SMJ Regio Wegweiser</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, h1, p, a, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f0c;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #F1EBDD;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      display: block;
    }
    a {
      color: #FF5A1F;
      text-decoration: underline;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .fact-stack {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 12px !important;
      }
      .hero-title {
        font-size: 32px !important;
        line-height: 1.08 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 8px; background-color: #0b0f0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center>
    <!-- Main Card Container -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: ${forestDark}; border-radius: 12px; overflow: hidden; border: 1px solid #28372b; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
      
      <!-- Signal Orange Top Border Accent -->
      <tr>
        <td height="5" style="background-color: ${primaryColor}; font-size: 1px; line-height: 1px;">&nbsp;</td>
      </tr>

      <!-- Header Bar: Logo & Organization -->
      <tr>
        <td style="background-color: ${forestCard}; padding: 20px 32px; border-bottom: 1px solid #233126;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" align="left">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-right: 12px;">
                      <img src="https://regio.hnld.de/logo_wegweiser_white.png" alt="SMJ Logo" width="38" height="33" style="display: block; width: 38px; height: 33px; border: 0;" />
                    </td>
                    <td valign="middle">
                      <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: ${primaryColor}; letter-spacing: 2px; text-transform: uppercase; line-height: 1;">
                        SMJ REGIO WEGWEISER
                      </div>
                      <div style="font-family: -apple-system, sans-serif; font-size: 11px; color: ${textMuted}; font-weight: bold; letter-spacing: 1px; margin-top: 2px; text-transform: uppercase;">
                        Katholische Schönstatt-Mannesjugend
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" align="right">
                <span style="display: inline-block; background-color: ${primaryColor}; color: #111713; font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 12px; font-weight: bold; padding: 5px 12px; border-radius: 4px; letter-spacing: 1.5px; text-transform: uppercase;">
                  ${event.category || 'AKTION'}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero Section -->
      <tr>
        <td class="mobile-padding" style="padding: 36px 32px 20px 32px;">
          <!-- Eyebrow -->
          <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 15px; color: ${primaryColor}; letter-spacing: 2px; margin-bottom: 8px;">
            // RAUS. INS ABENTEUER.
          </div>
          <!-- Big Bold Title -->
          <h1 class="hero-title" style="margin: 0; font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 42px; line-height: 1.05; color: ${textLight}; letter-spacing: 1px; text-transform: uppercase;">
            ${event.title}
          </h1>
          <!-- Quick Date & Location Strip -->
          <div style="font-family: -apple-system, sans-serif; font-size: 15px; color: ${textMuted}; font-weight: bold; margin-top: 12px;">
            📅 ${event.dateStr} &nbsp;&bull;&nbsp; 📍 ${event.locationStr}
          </div>
        </td>
      </tr>

      <!-- Dashed Expedition Divider -->
      <tr>
        <td style="padding: 4px 32px 20px 32px;">
          <div style="border-top: 1px dashed #2D3B2F; height: 1px; font-size: 1px; line-height: 1px;">&nbsp;</div>
        </td>
      </tr>

      <!-- Personal Salutation & Adventure Intro -->
      <tr>
        <td class="mobile-padding" style="padding: 0 32px 26px 32px; font-size: 16px; line-height: 1.65; color: #E5DFD1;">
          <p style="margin: 0 0 14px 0; font-weight: bold; font-size: 19px; color: #FFFFFF;">
            Hallo {contact.first_name|Abenteurer}!
          </p>
          <p style="margin: 0 0 16px 0;">
            bist du bereit für die nächste große Aktion mit der SMJ? Es wird wieder Zeit für echte Natur, Dreck an den Schuhen, knisterndes Lagerfeuer, packende Geländespiele und unvergessliche Tage draußen mit anderen Jungs!
          </p>
          <p style="margin: 0; font-weight: bold; color: ${primaryColor}; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
            Hier sind alle Fakten auf einen Blick:
          </p>
        </td>
      </tr>

      <!-- 4 Structured Fact Cards (2x2 Grid) -->
      <tr>
        <td class="mobile-padding" style="padding: 0 32px 28px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <!-- Row 1: WANN & WO -->
            <tr>
              <!-- Card 1: WANN -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: ${forestCard}; border-radius: 8px; border: 1px solid #2D3B2F; border-left: 5px solid ${primaryColor}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">// WANN</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: #FFFFFF; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${date1}</div>
                ${date2 ? `<div style="font-size: 13px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${date2}</div>` : ''}
              </td>
              <td width="4%" class="fact-stack" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <!-- Card 2: WO -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: ${forestCard}; border-radius: 8px; border: 1px solid #2D3B2F; border-left: 5px solid ${primaryColor}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">// WO</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: #FFFFFF; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${loc1}</div>
                ${loc2 ? `<div style="font-size: 13px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${loc2}</div>` : ''}
              </td>
            </tr>
            <tr><td colspan="3" height="12" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
            <!-- Row 2: WER & BEITRAG -->
            <tr>
              <!-- Card 3: WER -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: ${forestCard}; border-radius: 8px; border: 1px solid #2D3B2F; border-left: 5px solid ${primaryColor}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">// WER</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: #FFFFFF; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${age1}</div>
                ${age2 ? `<div style="font-size: 13px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${age2}</div>` : ''}
              </td>
              <td width="4%" class="fact-stack" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <!-- Card 4: BEITRAG -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: ${forestCard}; border-radius: 8px; border: 1px solid #2D3B2F; border-left: 5px solid ${primaryColor}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">// BEITRAG</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: #FFFFFF; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${price1}</div>
                ${price2 ? `<div style="font-size: 13px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${price2}</div>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Highlights 3-Pills Bar -->
      <tr>
        <td class="mobile-padding" style="padding: 0 32px 30px 32px;">
          <div style="background-color: ${forestCard}; border: 1px solid #2D3B2F; border-radius: 6px; padding: 12px 16px; text-align: center; font-size: 14px; font-weight: bold; color: ${textLight};">
            🔥 Lagerfeuer &amp; Action &nbsp;&bull;&nbsp; 🌲 100% Natur &nbsp;&bull;&nbsp; ⚔️ Jugend leitet Jugend
          </div>
        </td>
      </tr>

      <!-- Big Primary CTA Button -->
      <tr>
        <td class="mobile-padding" style="padding: 0 32px 34px 32px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="background-color: ${primaryColor}; border-radius: 8px; box-shadow: 0 6px 18px rgba(255,90,31,0.35);">
                <a href="${event.registrationUrl}" target="_blank" style="display: block; padding: 18px 28px; font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 22px; color: #111713; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase;">
                  JETZT ONLINE ANMELDEN &rarr;
                </a>
              </td>
            </tr>
          </table>
          <div style="font-size: 13px; color: #8D9389; margin-top: 12px; text-align: center; font-family: -apple-system, sans-serif;">
            Begrenzte Plätze &bull; Direktanmeldung unter <a href="${event.registrationUrl}" style="color: ${primaryColor}; font-weight: bold; text-decoration: underline;">smj-wegweiser.de</a>
          </div>
        </td>
      </tr>

      <!-- Parents Assurance Trust Box -->
      <tr>
        <td class="mobile-padding" style="padding: 0 32px 32px 32px;">
          <div style="background-color: ${forestCard}; border-radius: 8px; padding: 20px 22px; border: 1px solid #2e4334; border-left: 5px solid #25D366;">
            <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 15px; color: #25D366; letter-spacing: 1px; margin-bottom: 8px;">
              // WICHTIGER HINWEIS FÜR DEINE ELTERN:
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #D5CFBE;">
              Liebe Eltern, alle Details zu unserem geschulten ehrenamtlichen Leitungsteam (Präventionsschulung &amp; Erste Hilfe), Vollverpflegung, Übernachtung und die vollständige Packliste finden Sie auf unserer Aktionsseite.
            </div>
          </div>
        </td>
      </tr>

      <!-- Footer & CiviCRM Unsubscribe Tokens -->
      <tr>
        <td style="background-color: #0b0f0c; padding: 28px 32px; border-top: 1px solid #1f2b21; font-size: 12px; line-height: 1.6; color: #8D9389; text-align: center;">
          <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 15px; color: ${primaryColor}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
            SMJ REGIO WEGWEISER
          </div>
          <div style="color: #B0A998; margin-bottom: 4px;">
            Katholische Schönstatt-Mannesjugend &bull; Diözesen Fulda, Erfurt, Magdeburg &amp; Dresden-Meißen
          </div>
          <div style="margin-bottom: 8px;">
            Pater-Kentenich-Weg 3 (Klause 2.0) &bull; 37308 Heilbad Heiligenstadt
          </div>
          <div>
            Web: <a href="https://smj-wegweiser.de" style="color: #F1EBDD; text-decoration: underline;">smj-wegweiser.de</a> &bull; E-Mail: <a href="mailto:kontakt@smj-wegweiser.de" style="color: #F1EBDD; text-decoration: underline;">kontakt@smj-wegweiser.de</a>
          </div>
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #1a241c; font-size: 11px; color: #6a746a;">
            Du erhältst diese Einladung als registrierter Teilnehmer oder Interessent der SMJ Wegweiser.<br>
            <a href="{action.unsubscribeUrl}" style="color: #8D9389; text-decoration: underline;">Von zukünftigen E-Mails abmelden</a> &bull; 
            <a href="https://smj-wegweiser.de/impressum" style="color: #8D9389; text-decoration: underline;">Impressum</a> &bull; 
            <a href="https://smj-wegweiser.de/datenschutz" style="color: #8D9389; text-decoration: underline;">Datenschutz</a>
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`
}
