<?php
/**
 * Authentik Konfiguration für SMJ Regio Wegweiser (Netcup Webhosting)
 * 
 * Trage hier deine Authentik-Daten ein.
 * Du findest diese in Authentik unter Applications -> Providers -> [Dein OAuth2 Provider].
 */

// Direkten Webzugriff auf die Config-Datei sperren
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'config.php') {
    http_response_code(403);
    die('Access Denied');
}

// Prüfe auf HTTPS (auch hinter Reverse-Proxies wie bei Netcup/Plesk)
$isHttps = (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['HTTPS'] == 1)) ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$protocol = $isHttps ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'smj-wegweiser.de';

return [
    // 1. Deine Authentik Basis-URL (ohne Slash am Ende)
    // Beispiel: 'https://auth.smj-wegweiser.de' oder 'https://authentik.deine-domain.de'
    'authentik_url' => getenv('AUTHENTIK_URL') ?: 'https://auth.smj-wegweiser.de',

    // 2. Client ID aus deinem Authentik OAuth2 Provider
    'client_id'     => getenv('AUTHENTIK_CLIENT_ID') ?: 'HIER_AUTHENTIK_CLIENT_ID_EINTRAGEN',

    // 3. Client Secret aus deinem Authentik OAuth2 Provider
    'client_secret' => getenv('AUTHENTIK_CLIENT_SECRET') ?: 'HIER_AUTHENTIK_CLIENT_SECRET_EINTRAGEN',

    // 4. Redirect URI (muss exakt so in Authentik bei den Redirect URIs hinterlegt sein)
    'redirect_uri'  => $protocol . '://' . $host . '/toolbox-auth/callback.php',

    // 5. Geheimer Schlüssel für die HMAC-SHA256 Signatur des Session-Cookies.
    // Dieser Schlüssel verhindert jedes Manipulieren oder Fälschen des Cookies.
    // Bitte vor dem Produktivgang durch eine lange zufällige Zeichenkette ersetzen!
    'app_secret'    => getenv('TOOLBOX_APP_SECRET') ?: 'smj_wegweiser_secure_key_kryptografisch_signiert_v1_98f4e2b0',

    // 6. Name und Gültigkeit des Cookies
    'cookie_name'   => 'smj_toolbox_session',
    'cookie_expire' => 30 * 86400, // 30 Tage gültig

    // 7. Optionale Gruppenbeschränkung (leer = alle authentifizierten Benutzer erlaubt)
    // Beispiel: ['Leiter', 'authentik Admins']
    'allowed_groups'=> [],
];
