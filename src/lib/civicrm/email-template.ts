import type { CampaignEventData } from './types'

export function generateCampaignEmailHtml(event: CampaignEventData): string {
  const primaryColor = '#FF5A1F'
  const forestDark = '#111713'
  const paperBg = '#F5EFE1'

  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.title} - SMJ Regio Wegweiser</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f0c;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111713;
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
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .fact-col {
        display: block !important;
        width: 100% !important;
        margin-bottom: 12px !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .hero-title {
        font-size: 32px !important;
        line-height: 1.1 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #0b0f0c;">
  <center>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 3px solid ${primaryColor};">
      
      <!-- Top Header Bar -->
      <tr>
        <td style="background-color: ${forestDark}; padding: 22px 32px; border-bottom: 3px solid ${primaryColor};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" align="left">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-right: 12px;">
                      <img src="https://smj-wegweiser.de/logo_wegweiser_white.svg" alt="SMJ Logo" width="38" height="33" style="display: block; width: 38px; height: 33px; border: 0;" />
                    </td>
                    <td valign="middle">
                      <span style="font-family: Impact, -apple-system, sans-serif; font-size: 20px; color: ${primaryColor}; letter-spacing: 2px; text-transform: uppercase;">SMJ REGIO WEGWEISER</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" align="right">
                <span style="display: inline-block; background-color: ${primaryColor}; color: #111713; font-family: Impact, -apple-system, sans-serif; font-size: 13px; font-weight: bold; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">${event.category || 'AKTION'}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero Eyebrow & Headline -->
      <tr>
        <td class="mobile-padding" style="padding: 36px 36px 16px 36px;">
          <div style="font-family: Impact, -apple-system, sans-serif; font-size: 16px; color: ${primaryColor}; letter-spacing: 1.5px; margin-bottom: 8px;">// RAUS. INS ABENTEUER.</div>
          <h1 class="hero-title" style="margin: 0; font-family: Impact, -apple-system, sans-serif; font-size: 40px; line-height: 1.05; color: ${forestDark}; letter-spacing: 1px; text-transform: uppercase;">
            ${event.title}
          </h1>
          ${event.subtitle ? `<div style="font-family: Impact, -apple-system, sans-serif; font-size: 18px; color: ${primaryColor}; letter-spacing: 1px; margin-top: 6px; text-transform: uppercase;">// ${event.subtitle}</div>` : ''}
        </td>
      </tr>

      <!-- Personal Salutation & Adventure Intro -->
      <tr>
        <td class="mobile-padding" style="padding: 12px 36px 24px 36px; font-size: 16px; line-height: 1.6; color: #2D3B2F;">
          <p style="margin: 0 0 16px 0; font-weight: bold; font-size: 18px; color: ${forestDark};">
            Hallo {contact.first_name|Abenteurer}!
          </p>
          <p style="margin: 0 0 16px 0;">
            bist du bereit für die nächste große Aktion mit der SMJ? Es wird Zeit für echte Natur, knisterndes Lagerfeuer, packende Geländespiele und unvergessliche Tage draußen mit anderen Jungs!
          </p>
          <p style="margin: 0;">
            Hier sind alle wichtigen Eckdaten auf einen Blick:
          </p>
        </td>
      </tr>

      <!-- Fact Cards Grid -->
      <tr>
        <td class="mobile-padding" style="padding: 0 36px 28px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <!-- WANN -->
              <td class="fact-col" width="48%" valign="top" style="background-color: ${forestDark}; border-radius: 8px; border-left: 6px solid ${primaryColor}; padding: 14px 16px; margin-bottom: 12px;">
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">📅 WANN</div>
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 20px; color: #F1EBDD; letter-spacing: 0.5px; margin-top: 4px;">${event.dateStr}</div>
              </td>
              <td width="4%" class="fact-col" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <!-- WO -->
              <td class="fact-col" width="48%" valign="top" style="background-color: ${forestDark}; border-radius: 8px; border-left: 6px solid ${primaryColor}; padding: 14px 16px; margin-bottom: 12px;">
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">📍 WO</div>
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 20px; color: #F1EBDD; letter-spacing: 0.5px; margin-top: 4px;">${event.locationStr}</div>
              </td>
            </tr>
            <tr><td colspan="3" height="12" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
            <tr>
              <!-- WER -->
              <td class="fact-col" width="48%" valign="top" style="background-color: ${forestDark}; border-radius: 8px; border-left: 6px solid ${primaryColor}; padding: 14px 16px;">
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">👥 WER</div>
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 20px; color: #F1EBDD; letter-spacing: 0.5px; margin-top: 4px;">${event.ageStr}</div>
              </td>
              <td width="4%" class="fact-col" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <!-- BEITRAG -->
              <td class="fact-col" width="48%" valign="top" style="background-color: ${forestDark}; border-radius: 8px; border-left: 6px solid ${primaryColor}; padding: 14px 16px;">
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 13px; color: ${primaryColor}; letter-spacing: 1.5px;">💶 BEITRAG</div>
                <div style="font-family: Impact, -apple-system, sans-serif; font-size: 20px; color: #F1EBDD; letter-spacing: 0.5px; margin-top: 4px;">${event.priceStr}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button Box -->
      <tr>
        <td class="mobile-padding" style="padding: 0 36px 36px 36px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="background-color: ${primaryColor}; border-radius: 6px;">
                <a href="${event.registrationUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; font-family: Impact, -apple-system, sans-serif; font-size: 20px; color: #111713; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase;">
                  JETZT ONLINE ANMELDEN &rarr;
                </a>
              </td>
            </tr>
          </table>
          <div style="font-size: 13px; color: #667066; margin-top: 10px;">
            Plätze sind begrenzt &bull; Direktanmeldung unter <a href="${event.registrationUrl}" style="color: ${forestDark}; font-weight: bold; text-decoration: underline;">smj-wegweiser.de</a>
          </div>
        </td>
      </tr>

      <!-- Parents Note Box -->
      <tr>
        <td class="mobile-padding" style="padding: 0 36px 32px 36px;">
          <div style="background-color: ${paperBg}; border-radius: 8px; padding: 18px 22px; border: 1px solid #D9CEB8;">
            <div style="font-family: Impact, -apple-system, sans-serif; font-size: 15px; color: ${forestDark}; letter-spacing: 1px; margin-bottom: 6px;">
              // WICHTIGER HINWEIS FÜR DEINE ELTERN:
            </div>
            <div style="font-size: 14px; line-height: 1.5; color: #4A524A;">
              Liebe Eltern, alle Details zu geschulter Betreuung, Vollverpflegung, Anreise sowie die vollständige Packliste finden Sie auf unserer Aktionsseite. Bei Fragen erreichen Sie uns jederzeit über unsere Website.
            </div>
          </div>
        </td>
      </tr>

      <!-- Footer & CiviCRM Unsubscribe Tokens -->
      <tr>
        <td style="background-color: #F0ECE1; padding: 24px 32px; border-top: 1px solid #DDD3C1; font-size: 12px; line-height: 1.5; color: #667066; text-align: center;">
          <div style="font-weight: bold; color: ${forestDark}; margin-bottom: 4px;">
            SMJ Regio Wegweiser &bull; Katholische Schönstatt-Mannesjugend
          </div>
          <div style="margin-bottom: 4px;">
            Pater-Kentenich-Weg 3 (Klause 2.0) &bull; 37308 Heilbad Heiligenstadt
          </div>
          <div>
            Web: <a href="https://smj-wegweiser.de" style="color: ${forestDark}; text-decoration: underline;">smj-wegweiser.de</a> &bull; E-Mail: kontakt@smj-wegweiser.de
          </div>
          <div style="margin-top: 14px; font-size: 11px; color: #889088;">
            Du erhältst diese Nachricht als Teilnehmer oder Interessent der SMJ Wegweiser.<br>
            <a href="{action.unsubscribeUrl}" style="color: #667066; text-decoration: underline;">Vom Verteiler abmelden</a> &bull; 
            <a href="https://smj-wegweiser.de/impressum" style="color: #667066; text-decoration: underline;">Impressum</a> &bull; 
            <a href="https://smj-wegweiser.de/datenschutz" style="color: #667066; text-decoration: underline;">Datenschutz</a>
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`
}
