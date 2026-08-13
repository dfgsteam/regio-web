# AGENTS.md — hunold24-skeleton

Arbeitsauftrag für Coding-Agenten/Entwickler, die dieses Skeleton bauen oder
warten. Ziel: ein Git-Template-Repo, das bei jeder neuen hunold24/dfgsteam-
Produkt-App per `git clone` als Startpunkt dient und Mandant/License/Auth
vollständig regelt.

Baue die Phasen in Reihenfolge (siehe `BUILDPLAN.md`). Jede Phase muss
eigenständig lauffähig/testbar sein, bevor die nächste beginnt.

---

## Nicht verhandelbare Prinzipien

1. Kein Code-Pfad spricht Authentik direkt an, außer dem OIDC-Login-Flow
   (Phase 4). Nutzer-/Gruppenverwaltung läuft ausschließlich über die
   Control-Plane User-API.
2. Rechte/Rollen innerhalb der App gehören der App. Control-Plane liefert nur
   Mandantenzugehörigkeit + Admin-Flag.
3. Entitlements werden fertig gemerged empfangen, lokal gecacht, fachlich
   durchgesetzt — nie selbst zusammengeführt.
4. Alle Calls zwischen App und Control-Plane (beide Richtungen) sind
   HMAC-signiert nach dem unten definierten Canonical-String-Schema.
5. Provisioning-Endpunkte sind **synchron**: Signatur/Nonce/Timestamp/
   Idempotency prüfen → sofort verarbeiten → antworten. Kein Messenger-
   Dispatch dazwischen.

---

## Signatur-Konvention (beide Richtungen)

Header pro Call:

| Header | Inhalt |
|---|---|
| `X-Signature` | HMAC-SHA256 (hex) über Canonical String, Secret = `WEBHOOK_SECRET` |
| `X-Timestamp` | Unix-Sekunden |
| `X-Nonce` | 32 Hex-Zeichen, einmalig |
| `Idempotency-Key` | Pflicht bei mutierenden Calls |
| `X-Product` | nur bei Calls AN Control-Plane: `PRODUCT_SLUG` |

Canonical String:
```
METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY
```

```php
$canonical = implode("\n", [strtoupper($method), $path, $timestamp, $nonce, $body]);
$signature = hash_hmac('sha256', $canonical, $webhookSecret);
// Verifikation: hash_equals(), NIE ==
```

Als Empfänger prüfen (sonst 401):
- Signatur via `hash_equals`
- Timestamp innerhalb ±300s
- Nonce noch nicht gesehen (Redis-Set, TTL 5 min)
- `Idempotency-Key`: siehe unten

## Idempotency-Store (Postgres, `idempotency_records`)

Vor Verarbeitung eines mutierenden Requests:

```php
$existing = $idempotencyRepository->find($idempotencyKey);
if ($existing !== null) {
    if ($existing->requestHash !== hash('sha256', $rawBody)) {
        throw new IdempotencyConflictException(); // -> 409 idempotency_conflict
    }
    return new JsonResponse($existing->responseBody, $existing->responseStatus);
}
// ... Request normal verarbeiten ...
$idempotencyRepository->store($idempotencyKey, $requestHash, $status, $responseBody);
```

Cleanup: Scheduler-Job löscht Einträge älter als 7 Tage.

---

## Phase 1 — Signatur-Infrastruktur

Baue:
- `App\Security\Hmac\HmacSignatureVerifier` — prüft eingehende Requests
- `App\Security\Hmac\HmacSignatureSigner` — signiert ausgehende Requests
  (genutzt vom `LicenseAppClient` aus Phase 3)
- `App\Security\Hmac\NonceGuard` (Redis-backed)
- `App\Entity\IdempotencyRecord` + Migration + `IdempotencyGuard`-Service

Als Symfony-`RequestSubscriber` oder Controller-Argument-Resolver
implementieren, damit Phase 2 die Prüfung nicht pro Endpoint dupliziert.

---

## Phase 2 — Provisioning-Contract (eingehend)

Vier Endpunkte, alle unter `App\Controller\ProvisioningController`, alle
durch die Guards aus Phase 1 abgesichert:

### `POST /provisioning/tenant`
Request: `externalTenantId`, `slug`, `plan`, `entitlements` (JSON, fertig
gemerged), `admin.email`.

Ablauf: `Tenant`-Entity anlegen (Mapping `externalTenantId` → interne ID),
`entitlements` als JSON persistieren, `status = active`. Admin-User wird
NICHT hier angelegt — das passiert JIT beim ersten OIDC-Login (Phase 4).
Antwort `201`: `{"appInternalId": "<interne ID>"}`. Bei Wiederholung
(gleicher Idempotency-Key) `200` mit gespeicherter Antwort.

### `PATCH /provisioning/tenant/{externalTenantId}`
Actions: `suspend`, `resume`, `updateEntitlements`.
- `suspend`/`resume`: `Tenant.status` setzen — Zugriff wird über
  `TenantAccessVoter` (prüft `status === active`) app-seitig durchgesetzt.
- `updateEntitlements`: `entitlements`-JSON ersetzen (kompletter neuer Satz,
  nicht mergen).
Unbekannter Tenant → `404`.

### `DELETE /provisioning/tenant/{externalTenantId}`
Deprovisionieren. Idempotent — bereits gelöschter Tenant → `200`.

### `GET /provisioning/tenant/{externalTenantId}/usage`
```json
{"metrics": {"<entitlement_key>": <aktueller_wert>}}
```
**App-spezifisch zu implementieren** — das Skeleton liefert nur ein
`UsageMetricsProviderInterface`, das jede Produkt-App konkret umsetzt (z. B.
`max_users` = Anzahl aktiver `TenantMembership`-Zeilen).

Contract gilt erst als fertig, wenn `contract-kit/verify.php` grün läuft.

---

## Phase 3 — User-API-Client (ausgehend)

`App\Service\LicenseAppClient`:

```php
public function createUser(string $externalTenantId, string $email, string $name, bool $isAdmin): CreatedUser;
public function updateUserAdminFlag(string $externalTenantId, string $userId, bool $isAdmin): void;
public function deleteUser(string $externalTenantId, string $userId): void;
public function getTenant(string $externalTenantId): TenantStatus;
```

Jeder Call signiert (Phase 1, `HmacSignatureSigner`), inkl. `X-Product:
{PRODUCT_SLUG}`. `createUser()` speichert `userId` +
`authentikUserId`/`username` in `TenantMembership.licenseAppUserId` für
spätere PATCH/DELETE-Calls.

Fehler-Mapping (RFC 7807, Feld `code`) auf `LicenseAppException`-Subklassen:

| code | Exception | UI-Reaktion |
|---|---|---|
| `seat_limit_exceeded` | `SeatLimitExceededException` | "Limit erreicht — Upgrade nötig", kein Retry |
| `tenant_suspended` | `TenantSuspendedException` | Mandant gesperrt anzeigen |
| `tenant_not_found` | `TenantNotFoundException` | Konfigurationsfehler loggen |
| `product_scope_violation` | `ProductScopeViolationException` | Bug-Alert (falscher Tenant/Product) |
| `validation_failed` | `ValidationFailedException` | Eingabefehler im UI |
| `idempotency_conflict` | `IdempotencyConflictException` | Bug-Alert |
| `unauthorized` | `UnauthorizedException` | Signatur/Secret/Uhrzeit prüfen |

---

## Phase 4 — Authentik OIDC Login

**Wortgleich aus dem Integrations-Dokument übernehmen** (Teil 3 des
Original-Prompts) — Stack, Konfiguration, Klassennamen, Routen sind dort
bereits vollständig spezifiziert und nicht zu verändern:

- `composer require knpuniversity/oauth2-client-bundle:^2.20`
- `config/packages/knpu_oauth2_client.yaml` — Client-Key `authentik`
- Routen: `login`, `login_authentik`, `oidc_callback`, `app_logout`
- `src/Security/OidcAuthenticator.php`
- `src/Security/GroupRoleMapper.php` — Regex-Mapping:
  - `app_{slug}_admin` (exakt, zuerst prüfen) → globaler Admin, alle Mandanten
  - `app_{slug}` (exakt) → Basiszugang
  - `tenant_{slug}_{tenantSlug}` → Mitgliedschaft
  - `tenant_{slug}_{tenantSlug}_admin` → Mandanten-Admin
  - `{slug}` = injizierter `PRODUCT_SLUG`, nie hardcoden
- `src/Security/UserProvisioner.php` — JIT-Anlage, Dedup-Key = lowercased E-Mail
- Dev-Login (nur `when@dev`, compile-time gegatet):
  - `src/Controller/Dev/DevLoginController.php`
  - `src/Security/Dev/DevLoginAuthenticator.php`
  - `src/Security/Dev/DevUserProvider.php` (3 Demo-User, Passwort `dev`)
  - `templates/security/dev_login.html.twig`
- Login-Button-Text wortwörtlich: **"Login mit Hunold24 Auth"**

Beim JIT-Login (`UserProvisioner`): pro `tenant_…`-Gruppentreffer eine
`TenantMembership`-Zeile anlegen/aktualisieren (verknüpft mit dem lokalen
`Tenant` über `externalTenantId` — falls der Tenant hier noch nicht bekannt
ist, ist das ein Konfigurationsfehler: Login ablehnen + loggen, da
Provisioning laut Prinzip 5 immer vor dem ersten Login gelaufen sein muss).

---

## Phase 5 — Tenant-Kontext & Scoping

- `App\Tenant\CurrentTenant` — hält aktiven Tenant für den Request, gesetzt:
  - automatisch bei genau einer `TenantMembership`
  - per Tenant-Wechsel-UI, wenn mehrere vorhanden (Session-Wert
    `current_tenant_id`)
- `TenantContextSubscriber` (kernel.request, früh) — lädt `CurrentTenant`
  aus Session, leitet bei fehlendem/ungültigem Tenant auf Auswahl-Screen um
- Doctrine-Filter (`SQLFilter`) scoped alle `Tenant`-abhängigen Entities
  automatisch auf `CurrentTenant`
- `TenantAccessVoter` — verweigert Zugriff, wenn `Tenant.status !== active`

---

## Phase 6 — Reconciliation

`App\Command\ReconcileTenantsCommand`, täglich per Symfony Scheduler:

```
für jeden lokalen Tenant:
  GET {LIZENZ_APP_URL}/api/tenants/{externalTenantId}  (signiert)
  falls status oder entitlements abweichen:
    lokal korrigieren
    loggen (Abweichung + alter/neuer Wert)
```

Dient als Sicherheitsnetz, falls ein `PATCH /provisioning/tenant/...`-Call
mal nicht ankam. Läuft unabhängig vom synchronen Contract aus Phase 2.

**Healthchecks.io-Anbindung**: nach erfolgreichem Lauf `HealthchecksClient::ping()`
aufrufen (Check-URL aus `.env`, analog zum bestehenden Muster in anderen
Projekten). Bei Exception im Job **kein** Ping — Healthchecks.io meldet dann
automatisch nach Ablauf des Grace-Periods.

## Phase 6a — Lokales Fixture-Tooling

`App\Command\Dev\ProvisionFakeTenantCommand` (nur `when@dev` registriert,
analog zum Dev-Login-Pattern aus Phase 4):

```
bin/console app:dev:provision-fake-tenant [--suspend] [--entitlements=key:val,...]
```

Ruft intern denselben Service-Code auf, den auch `ProvisioningController`
nutzt (kein Logik-Duplikat) — simuliert also `POST /provisioning/tenant`
bzw. `PATCH .../tenant/{id}` ohne HTTP-Roundtrip und ohne echte Control-
Plane-Instanz. Nützlich für lokale Entwicklung und für Tests des
Reconciliation-Jobs (bewusst abweichenden Zustand erzeugen und prüfen, ob
Phase 6 ihn korrigiert).

---

## Phase 7 — Verbindungstest

- Sicherstellen, dass `contract-kit/verify.php <baseUrl> <webhookSecret>`
  gegen Staging grün läuft (inkl. Signatur-Ablehnung, Idempotenz-Checks,
  Replay-Schutz: gleiche Nonce zweimal → `401`)
- README-Abschnitt für neue Apps: wie man den Verbindungstest von
  Control-Plane-Seite auslöst (`/admin/connections` bzw.
  `bin/console app:connections:check`)

---

## Sicherheits- & Betriebs-Ergänzungen (gelten übergreifend)

- `TenantAccessVoter` (Phase 5) muss bei **jedem** Request greifen, nicht
  nur beim Login — ein `suspend`-Call muss auch bei bereits eingeloggten
  Nutzern sofort wirken.
- Server-Uhren müssen NTP-synchron sein (Voraussetzung für die ±300s-HMAC-
  Toleranz) — im README als Setup-Voraussetzung dokumentieren.
- Rate-Limiting (Symfony RateLimiter) auf `/provisioning/*` als
  Zusatzschutz einplanen.
- `WEBHOOK_SECRET`-Rotation: Verifier akzeptiert optional zusätzlich
  `WEBHOOK_SECRET_PREVIOUS` während eines Übergangsfensters.
- Logging rund um Provisioning-/User-API-Calls immer mit
  `Idempotency-Key` als Correlation-ID versehen.
- `CHANGELOG.md` im Skeleton pflegen — einziger Weg, um Fixes nachträglich
  gezielt in bereits laufende Apps zu übernehmen (kein zentrales Update
  wie bei einem Composer-Package).

## Phase 0b — UI-Basis (Tabler.io, Symfony UX, Icons)

- **Tabler.io** als CSS-Framework, per AssetMapper lokal vendored (kein
  Node-Build-Zwang, kein CDN-Zugriff zur Laufzeit).
- **Symfony UX** (Turbo + Stimulus) für Interaktivität. Tablers eigenes
  Bootstrap-JS (Sidebar, Dropdowns, Modals) wird **nicht** direkt verwendet
  — stattdessen eigene, schlanke Stimulus-Controller (`sidebar_controller.js`,
  `dropdown_controller.js`, ...), damit es nicht zu doppelten JS-
  Interaktionsschichten kommt und Turbo-Navigation sauber funktioniert.
- **Icons: Lucide**, eingebunden über eine Twig-Funktion `icon(name, class)`,
  die das SVG inline rendert (`App\Twig\IconExtension`). Kein Icon-Font.
- `templates/base.html.twig`: Tabler-Sidebar+Topbar-Layout für eingeloggte
  Bereiche. Separates schlankes Layout für Login-Screens (Phase 4), gleiche
  Tabler-CSS-Basis, aber ohne Sidebar/Navigation.
- Viewport-Meta, Favicon-Set, `manifest.json` als Basis-Webapp-Grundlage.
  Kein Offline-/Service-Worker-Anspruch im Skeleton (das bleibt optional
  und App-spezifisch, wie das `/field`-PWA bei D2D-Platform).

---

## Phase 8 — Mail-Versand

- `symfony/mailer`, `MAILER_DSN` als Env-Var.
- `App\Command\TestMailCommand` (`bin/console app:mail:test <empfänger>`)
  — schickt eine Test-Mail über den konfigurierten Transport, meldet Erfolg/
  Fehler klar (Transport-Verbindungstest, analog zum Gedanken aus Phase 7).
- `templates/emails/base.html.twig`: eigenes, **inline-gestyltes**
  Table-Layout im Tabler-Farb-/Font-Schema — kein `<link>` auf die Tabler-
  CSS-Datei, da E-Mail-Clients externes/globales CSS nicht zuverlässig
  unterstützen. Farbwerte/Radii als Twig-Variablen, damit sie mit dem
  Web-Layout im Tabler-Look übereinstimmen.
- `templates/emails/notification.html.twig` als Beispiel-Vorlage, von der
  aus app-spezifische Mails (Einladungen, Hinweise, Reports) abgeleitet
  werden.

---

1. Alle vier Provisioning-Endpunkte implementiert, Contract-Kit grün.
2. Nutzeranlage läuft über `LicenseAppClient`; `seat_limit_exceeded` sauber
   im UI behandelt; `userId` in `TenantMembership` gespeichert.
3. Entitlements lokal gecacht, fachlich durchgesetzt; `updateEntitlements`
   greift ohne Neustart.
4. Login läuft über `knpuniversity/oauth2-client-bundle`, exakte Routen-/
   Klassennamen wie oben.
5. `GroupRoleMapper` mappt korrekt; JIT-Anlage funktioniert; Dev-Login mit
   3 Demo-Usern funktioniert ohne Authentik-Verbindung.
6. Multi-Tenant-User können zwischen Mandanten wechseln; Doctrine-Filter
   scoped korrekt.
7. Reconciliation-Job läuft im Scheduler und korrigiert simulierte
   Abweichungen.
8. Kein Code-Pfad ruft Authentik direkt auf außer dem OIDC-Login.
9. Replay-Schutz nachweisbar: wiederholter Request mit gleicher Nonce → 401.
