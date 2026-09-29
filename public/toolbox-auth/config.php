<?php
/** Runtime settings for the PHP host; the Astro build does not load these. */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'config.php') {
    http_response_code(403);
    exit('Access Denied');
}

$clientId = trim((string) getenv('AUTHENTIK_CLIENT_ID'));
$clientSecret = (string) getenv('AUTHENTIK_CLIENT_SECRET');
$appSecret = (string) getenv('TOOLBOX_APP_SECRET');
$redirectUri = trim((string) getenv('TOOLBOX_REDIRECT_URI'));
$allowedGroups = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) getenv('TOOLBOX_ALLOWED_GROUPS'))
)));

// An incomplete configuration must keep the toolbox locked.
if ($clientId === '' || $clientSecret === '' || strlen($appSecret) < 32 ||
    !preg_match('#^https://[^/]+/toolbox-auth/callback\.php$#', $redirectUri) ||
    $allowedGroups === []) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    exit('Toolbox derzeit nicht verfügbar.');
}

return [
    'authentik_url' => rtrim((string) (getenv('AUTHENTIK_URL') ?: 'https://auth.smj-wegweiser.de'), '/'),
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri' => $redirectUri,
    'app_secret' => $appSecret,
    'cookie_name' => 'smj_toolbox_session',
    'cookie_expire' => 8 * 3600,
    'allowed_groups' => $allowedGroups,
];
