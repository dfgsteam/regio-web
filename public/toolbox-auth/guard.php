<?php
/**
 * Authentik Kryptografischer PHP-Guard
 * Prüft bei jedem Aufruf von /toolbox/*, /flyer/* und /social/* die digitale Signatur.
 */

// Konfiguration laden
$config = require __DIR__ . '/config.php';

// 1. Cookie auslesen und kryptografisch verifizieren
$cookieName = $config['cookie_name'];
$rawCookie = $_COOKIE[$cookieName] ?? null;

$isAuthenticated = false;
$userPayload = null;

if ($rawCookie && strpos($rawCookie, '.') !== false) {
    list($b64Payload, $signature) = explode('.', $rawCookie, 2);
    
    // Berechne erwartete HMAC-SHA256 Signatur
    $expectedSignature = hash_hmac('sha256', $b64Payload, $config['app_secret']);

    // Timing-sicherer Vergleich zur Abwehr von Timing-Angriffen
    if (hash_equals($expectedSignature, $signature)) {
        $decoded = json_decode(base64_decode($b64Payload), true);
        if ($decoded && isset($decoded['exp']) && $decoded['exp'] > time()) {
            $isAuthenticated = true;
            $userPayload = $decoded;
        }
    }
}

// 2. Nicht eingeloggt oder Signatur ungültig: Zum Login umleiten
if (!$isAuthenticated) {
    $requestedUri = $_GET['path'] ?? $_SERVER['REQUEST_URI'] ?? '/toolbox/';
    // Endlosschleifen ausschließen
    if (strpos($requestedUri, '/toolbox-auth/') !== false) {
        $requestedUri = '/toolbox/';
    }
    
    $loginUrl = '/toolbox-auth/login.php?return_to=' . urlencode($requestedUri);
    header('Location: ' . $loginUrl, true, 302);
    exit;
}

// 3. Eingeloggt: Zieldatei sicher ermitteln und ausliefern
$docRoot = realpath(__DIR__ . '/..');
$rawPath = $_GET['path'] ?? $_SERVER['REQUEST_URI'] ?? '/toolbox/';
$urlPath = parse_url($rawPath, PHP_URL_PATH);
$cleanPath = ltrim(preg_replace('#/+#', '/', $urlPath), '/');

// Kandidaten für Astro Static Output (.html oder Verzeichnis/index.html)
$candidates = [
    $docRoot . '/' . $cleanPath,
    $docRoot . '/' . rtrim($cleanPath, '/') . '/index.html',
    $docRoot . '/' . $cleanPath . '.html',
];

$targetFile = null;
foreach ($candidates as $cand) {
    $real = realpath($cand);
    // Verhindere Path Traversal: Datei muss existieren und strikt im docRoot liegen
    if ($real && is_file($real) && strpos($real, $docRoot) === 0) {
        $targetFile = $real;
        break;
    }
}

// Wenn keine passende Datei gefunden wurde -> 404
if (!$targetFile) {
    http_response_code(404);
    $errorPage = $docRoot . '/404.html';
    if (is_file($errorPage)) {
        include $errorPage;
    } else {
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>404 Not Found</title></head><body><h1>404 - Seite nicht gefunden</h1></body></html>';
    }
    exit;
}

// MIME-Type festlegen
$extension = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
$mimeTypes = [
    'html' => 'text/html; charset=UTF-8',
    'json' => 'application/json; charset=UTF-8',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'avif' => 'image/avif',
    'css'  => 'text/css; charset=UTF-8',
    'js'   => 'application/javascript; charset=UTF-8',
    'ics'  => 'text/calendar; charset=UTF-8',
    'txt'  => 'text/plain; charset=UTF-8',
];

$contentType = $mimeTypes[$extension] ?? 'text/html; charset=UTF-8';
header('Content-Type: ' . $contentType);
header('Cache-Control: private, no-cache, no-store, must-revalidate');

// Datei direkt streamen
readfile($targetFile);
exit;
