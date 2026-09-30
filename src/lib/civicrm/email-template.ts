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

export function generateCampaignEmailHtml(event: CampaignEventData, options?: { absoluteLogo?: boolean }): string {
  const primaryActionColor = '#FF5A1F'
  const forestDark = '#111713'
  const textBody = '#2D372F'
  const textMuted = '#5A655C'
  const bgCanvas = '#F4F0E6'
  const bgCard = '#FFFFFF'
  const borderLight = '#E5DFD5'
  const logoUrl = options?.absoluteLogo ? 'https://regio.hnld.de/logo_wegweiser_dark.png' : '/logo_wegweiser_dark.png'

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
      background-color: ${bgCanvas};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: ${textBody};
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
      color: ${forestDark};
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
<body style="margin: 0; padding: 28px 8px; background-color: ${bgCanvas}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textBody};">
  <center>
    <!-- Main Card Container -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: ${bgCard}; border-radius: 8px; overflow: hidden; border: 1px solid ${borderLight}; box-shadow: 0 4px 20px rgba(17,23,19,0.06);">

      <!-- Header Bar: Authentic Outdoor Organization Lockup (Clean, No Orange Slop) -->
      <tr>
        <td style="background-color: #FFFFFF; padding: 24px 32px 20px 32px; border-bottom: 1px solid #ECE7DE;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" align="left">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-right: 14px;">
                      <img src="${logoUrl}" alt="SMJ Logo" width="42" height="37" style="display: block; width: 42px; height: 37px; border: 0;" />
                    </td>
                    <td valign="middle">
                      <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: ${forestDark}; letter-spacing: 2px; text-transform: uppercase; line-height: 1;">
                        SMJ REGIO WEGWEISER
                      </div>
                      <div style="font-family: -apple-system, sans-serif; font-size: 11px; color: ${textMuted}; font-weight: 700; letter-spacing: 1.5px; margin-top: 3px; text-transform: uppercase;">
                        Schönstatt-Mannesjugend
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" align="right">
                <span style="display: inline-block; background-color: ${forestDark}; color: #F1EBDD; font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 11px; font-weight: bold; padding: 6px 12px; border-radius: 4px; letter-spacing: 1.5px; text-transform: uppercase;">
                  ${event.category || 'AKTION'}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero Section -->
      <tr>
        <td class="mobile-padding" style="padding: 32px 32px 18px 32px;">
          <!-- Subdued Tracked Eyebrow -->
          <div style="font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: ${textMuted}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">
            // OFFIZIELLE EINLADUNG
          </div>
          <!-- Big Bold Title -->
          <h1 class="hero-title" style="margin: 0; font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 38px; line-height: 1.1; color: ${forestDark}; letter-spacing: 1px; text-transform: uppercase;">
            ${event.title}
          </h1>
          <!-- Quick Date & Location Strip -->
          <div style="font-family: -apple-system, sans-serif; font-size: 15px; color: #4A554D; font-weight: 600; margin-top: 14px; line-height: 1.4;">
            📅 ${event.dateStr} &nbsp;&bull;&nbsp; 📍 ${event.locationStr}
          </div>
        </td>
      </tr>

      <!-- Dashed Expedition Divider -->
      <tr>
        <td style="padding: 4px 32px 22px 32px;">
          <div style="border-top: 1px dashed #DCD5C9; height: 1px; font-size: 1px; line-height: 1px;">&nbsp;</div>
        </td>
      </tr>

      <!-- Personal Salutation & Adventure Intro -->
      <tr>
        <td class="mobile-padding" style="padding: 0 32px 26px 32px; font-size: 16px; line-height: 1.65; color: ${textBody};">
          <p style="margin: 0 0 14px 0; font-weight: bold; font-size: 19px; color: ${forestDark};">
            Hallo {contact.first_name|Abenteurer}!
          </p>
          <p style="margin: 0 0 16px 0;">
            bist du bereit für die nächste große Aktion mit der SMJ? Es wird wieder Zeit für echte Natur, Dreck an den Schuhen, packende Geländespiele und unvergessliche Tage draußen mit anderen Jungs!
          </p>
          <p style="margin: 0; font-weight: bold; color: ${forestDark}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px;">
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
              <td class="fact-stack" width="48%" valign="top" style="background-color: #FAF8F4; border-radius: 6px; border: 1px solid ${borderLight}; border-left: 4px solid ${forestDark}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 12px; color: ${textMuted}; letter-spacing: 1.5px;">// WANN</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: ${forestDark}; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${date1}</div>
                ${date2 ? `<div style="font-size: 12px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${date2}</div>` : ''}
              </td>
              <td width="4%" class="fact-stack" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <!-- Card 2: WO -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: #FAF8F4; border-radius: 6px; border: 1px solid ${borderLight}; border-left: 4px solid ${forestDark}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 12px; color: ${textMuted}; letter-spacing: 1.5px;">// WO</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: ${forestDark}; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${loc1}</div>
                ${loc2 ? `<div style="font-size: 12px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${loc2}</div>` : ''}
              </td>
            </tr>
            <tr><td colspan="3" height="12" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
            <!-- Row 2: WER & BEITRAG -->
            <tr>
              <!-- Card 3: WER -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: #FAF8F4; border-radius: 6px; border: 1px solid ${borderLight}; border-left: 4px solid ${forestDark}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 12px; color: ${textMuted}; letter-spacing: 1.5px;">// WER</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: ${forestDark}; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${age1}</div>
                ${age2 ? `<div style="font-size: 12px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${age2}</div>` : ''}
              </td>
              <td width="4%" class="fact-stack" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <!-- Card 4: BEITRAG -->
              <td class="fact-stack" width="48%" valign="top" style="background-color: #FAF8F4; border-radius: 6px; border: 1px solid ${borderLight}; border-left: 4px solid ${forestDark}; padding: 14px 16px;">
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 12px; color: ${textMuted}; letter-spacing: 1.5px;">// BEITRAG</div>
                <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 20px; color: ${forestDark}; letter-spacing: 0.5px; margin-top: 4px; line-height: 1.15; text-transform: uppercase;">${price1}</div>
                ${price2 ? `<div style="font-size: 12px; color: ${textMuted}; font-weight: bold; margin-top: 3px; text-transform: uppercase;">${price2}</div>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Big Primary CTA Button -->
      <tr>
        <td class="mobile-padding" style="padding: 10px 32px 36px 32px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="background-color: ${primaryActionColor}; border-radius: 6px; box-shadow: 0 4px 14px rgba(255,90,31,0.25);">
                <a href="${event.registrationUrl}" target="_blank" style="display: block; padding: 18px 28px; font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 21px; color: #111713; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase;">
                  JETZT ONLINE ANMELDEN &rarr;
                </a>
              </td>
            </tr>
          </table>
          <div style="font-size: 13px; color: #68736B; margin-top: 12px; text-align: center; font-family: -apple-system, sans-serif;">
            Begrenzte Plätze &bull; Direktanmeldung unter <a href="${event.registrationUrl}" style="color: ${forestDark}; font-weight: bold; text-decoration: underline;">smj-wegweiser.de</a>
          </div>
        </td>
      </tr>

      <!-- Footer & CiviCRM Unsubscribe Tokens -->
      <tr>
        <td style="background-color: #FAF8F4; padding: 24px 32px; border-top: 1px solid #ECE7DE; font-size: 12px; line-height: 1.6; color: #68736B; text-align: center;">
          <div style="font-family: Impact, Arial Black, -apple-system, sans-serif; font-size: 14px; color: ${forestDark}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
            SMJ REGIO WEGWEISER
          </div>
          <div style="color: #4A554D; margin-bottom: 4px;">
            Schönstatt-Mannesjugend im Bistum Erfurt
          </div>
          <div style="margin-bottom: 8px;">
            Pater-Kentenich-Weg 3 &bull; 37308 Heilbad Heiligenstadt
          </div>
          <div style="margin-bottom: 12px;">
            <a href="https://smj-wegweiser.de" style="color: ${forestDark}; font-weight: bold; text-decoration: underline;">smj-wegweiser.de</a> &bull; <a href="mailto:kontakt@smj-wegweiser.de" style="color: ${forestDark}; font-weight: bold; text-decoration: underline;">kontakt@smj-wegweiser.de</a>
          </div>
          <div style="font-size: 11px; color: #8D9389;">
            <a href="{action.unsubscribeUrl}" style="color: #68736B; text-decoration: underline;">Abmelden</a> &bull; 
            <a href="https://smj-wegweiser.de/impressum" style="color: #68736B; text-decoration: underline;">Impressum</a> &bull; 
            <a href="https://smj-wegweiser.de/datenschutz" style="color: #68736B; text-decoration: underline;">Datenschutz</a>
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`
}
