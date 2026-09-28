<?php
/**
 * Authentik OAuth2 Callback Handler
 * Tauscht den Authorization Code gegen Tokens, prüft User-Daten und setzt das signierte Session-Cookie.
 */
session_start();
$config = require __DIR__ . '/config.php';

// 1. Fehler von Authentik abfangen
$error = $_GET['error'] ?? null;
if ($error) {
    http_response_code(400);
    $desc = htmlspecialchars($_GET['error_description'] ?? 'Authentik hat den Login abgebrochen.');
    echo '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Login-Fehler</title></head>';
    echo '<body style="font-family:sans-serif;padding:2rem;background:#182019;color:#F1EBDD;">';
    echo '<h2>Authentik Login-Fehler</h2><p>' . $desc . '</p>';
    echo '<p><a href="/toolbox-auth/login.php" style="color:#FF5A1F;">Erneut versuchen</a></p></body></html>';
    exit;
}

// 2. CSRF-State und Code prüfen
$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;
$savedState = $_SESSION['oauth2_state'] ?? null;

if (!$code || !$state || empty($savedState) || !hash_equals($savedState, $state)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Sicherheitsfehler</title></head>';
    echo '<body style="font-family:sans-serif;padding:2rem;background:#182019;color:#F1EBDD;">';
    echo '<h2>Sicherheitsfehler (CSRF)</h2><p>Die Sitzung ist abgelaufen oder der Sicherheitstoken war ungültig.</p>';
    echo '<p><a href="/toolbox-auth/login.php" style="color:#FF5A1F;">Jetzt neu anmelden &rarr;</a></p></body></html>';
    exit;
}

// 3. Code gegen Access-Token tauschen (Token Endpoint)
$tokenUrl = rtrim($config['authentik_url'], '/') . '/application/o/token/';
$postData = [
    'grant_type'    => 'authorization_code',
    'code'          => $code,
    'redirect_uri'  => $config['redirect_uri'],
    'client_id'     => $config['client_id'],
    'client_secret' => $config['client_secret'],
];

$ch = curl_init($tokenUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($postData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT        => 15,
]);
$tokenResponse = curl_exec($ch);
$tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr       = curl_error($ch);
curl_close($ch);

if ($tokenHttpCode !== 200 || !$tokenResponse) {
    http_response_code(502);
    echo '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Authentik-Fehler</title></head>';
    echo '<body style="font-family:sans-serif;padding:2rem;background:#182019;color:#F1EBDD;">';
    echo '<h2>Authentik Token-Austausch fehlgeschlagen (HTTP ' . $tokenHttpCode . ')</h2>';
    echo '<pre>' . htmlspecialchars($curlErr ?: $tokenResponse) . '</pre>';
    echo '<p><a href="/toolbox-auth/login.php" style="color:#FF5A1F;">Erneut versuchen</a></p></body></html>';
    exit;
}

$tokenData = json_decode($tokenResponse, true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(502);
    die('Kein Access Token von Authentik erhalten.');
}

// 4. Benutzerprofil bei Authentik abfragen (Userinfo Endpoint)
$userinfoUrl = rtrim($config['authentik_url'], '/') . '/application/o/userinfo/';
$ch = curl_init($userinfoUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $accessToken,
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT        => 15,
]);
$userResponse = curl_exec($ch);
$userHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($userHttpCode !== 200 || !$userResponse) {
    http_response_code(502);
    die('Konnte Benutzerprofil von Authentik nicht laden (HTTP ' . $userHttpCode . ').');
}

$userInfo = json_decode($userResponse, true);

// 5. Optionale Gruppenprüfung
if (!empty($config['allowed_groups'])) {
    $userGroups = $userInfo['groups'] ?? [];
    $hasAccess = count(array_intersect($config['allowed_groups'], $userGroups)) > 0;
    if (!$hasAccess) {
        http_response_code(403);
        echo '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Zugriff verweigert</title></head>';
        echo '<body style="font-family:sans-serif;padding:2rem;background:#182019;color:#F1EBDD;">';
        echo '<h2>Zugriff verweigert</h2>';
        echo '<p>Dein Authentik-Benutzerkonto ist leider nicht in der Gruppe der berechtigten Leiter.</p>';
        echo '<p><a href="/" style="color:#FF5A1F;">Zurück zur Startseite</a></p></body></html>';
        exit;
    }
}

// 6. Kryptografisch signiertes Session-Cookie erstellen (HMAC-SHA256)
$expiresAt = time() + (int)($config['cookie_expire'] ?? 2592000);
$payload = [
    'sub'      => $userInfo['sub'] ?? 'unknown',
    'username' => $userInfo['preferred_username'] ?? $userInfo['name'] ?? 'Leiter',
    'email'    => $userInfo['email'] ?? '',
    'exp'      => $expiresAt,
];

$b64Payload = base64_encode(json_encode($payload));
$signature = hash_hmac('sha256', $b64Payload, $config['app_secret']);
$cookieValue = $b64Payload . '.' . $signature;

$isHttps = (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['HTTPS'] == 1)) ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

setcookie($config['cookie_name'], $cookieValue, [
    'expires'  => $expiresAt,
    'path'     => '/',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);

// 7. Weiterleitung zur gewünschten Seite
$returnTo = $_SESSION['oauth2_return_to'] ?? '/toolbox/';
unset($_SESSION['oauth2_state'], $_SESSION['oauth2_return_to']);

header('Location: ' . $returnTo, true, 302);
exit;
