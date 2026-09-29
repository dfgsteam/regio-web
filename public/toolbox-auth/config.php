<?php
/** Runtime settings for the PHP host; the Astro build does not load these. */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'config.php') {
    http_response_code(403);
    exit('Access Denied');
}

$settingNames = [
    'AUTHENTIK_URL',
    'AUTHENTIK_CLIENT_ID',
    'AUTHENTIK_CLIENT_SECRET',
    'TOOLBOX_APP_SECRET',
    'TOOLBOX_REDIRECT_URI',
    'TOOLBOX_ALLOWED_GROUPS',
];
$settings = [];

foreach ($settingNames as $name) {
    $value = getenv($name);
    if ($value !== false && $value !== '') {
        $settings[$name] = $value;
    }
}

// Server environment wins. Prefer a private file beside the web root; also
// accept the document-root .env protected by Apache for shared hosting.
foreach ([dirname(__DIR__, 2) . '/.env', dirname(__DIR__) . '/.env'] as $envPath) {
    if (!is_file($envPath) || !is_readable($envPath)) {
        continue;
    }
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        if (!preg_match('/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/', $line, $match)) {
            continue;
        }
        $name = $match[1];
        if (!in_array($name, $settingNames, true) || isset($settings[$name])) {
            continue;
        }
        $value = trim($match[2]);
        if (strlen($value) >= 2 &&
            (($value[0] === '"' && substr($value, -1) === '"') ||
             ($value[0] === "'" && substr($value, -1) === "'"))) {
            $value = substr($value, 1, -1);
        }
        $settings[$name] = $value;
    }
}

$clientId = trim($settings['AUTHENTIK_CLIENT_ID'] ?? '');
$clientSecret = $settings['AUTHENTIK_CLIENT_SECRET'] ?? '';
$appSecret = $settings['TOOLBOX_APP_SECRET'] ?? '';
$redirectUri = trim($settings['TOOLBOX_REDIRECT_URI'] ?? '');
$allowedGroups = array_values(array_filter(array_map(
    'trim',
    explode(',', $settings['TOOLBOX_ALLOWED_GROUPS'] ?? '')
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
    'authentik_url' => rtrim($settings['AUTHENTIK_URL'] ?? 'https://auth.smj-wegweiser.de', '/'),
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri' => $redirectUri,
    'app_secret' => $appSecret,
    'cookie_name' => 'smj_toolbox_session',
    'cookie_expire' => 8 * 3600,
    'allowed_groups' => $allowedGroups,
];
