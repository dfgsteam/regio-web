<?php
/** Serve only files below /toolbox/ after checking the signed session. */
$config = require __DIR__ . '/config.php';

// Apache preserves the original request URI across its internal rewrite.
// A query parameter must never select a file on disk.
$requestedUri = $_SERVER['REQUEST_URI'] ?? '';
$urlPath = is_string($requestedUri) ? parse_url($requestedUri, PHP_URL_PATH) : false;
if (!is_string($urlPath) || !preg_match('#^/toolbox(?:/|$)#', $urlPath)) {
    http_response_code(404);
    exit('Not Found');
}

$rawCookie = $_COOKIE[$config['cookie_name']] ?? null;
$isAuthenticated = false;
if (is_string($rawCookie) && strpos($rawCookie, '.') !== false) {
    [$b64Payload, $signature] = explode('.', $rawCookie, 2);
    $expectedSignature = hash_hmac('sha256', $b64Payload, $config['app_secret']);
    if (hash_equals($expectedSignature, $signature)) {
        $decoded = base64_decode($b64Payload, true);
        $payload = $decoded !== false ? json_decode($decoded, true) : null;
        $isAuthenticated = is_array($payload) &&
            !empty($payload['sub']) &&
            isset($payload['exp']) &&
            is_int($payload['exp']) &&
            $payload['exp'] > time();
    }
}

if (!$isAuthenticated) {
    header('Cache-Control: no-store');
    header('Location: /toolbox-auth/login.php?return_to=' . rawurlencode($requestedUri), true, 302);
    exit;
}

$docRoot = realpath(__DIR__ . '/..');
$toolboxRoot = $docRoot !== false ? realpath($docRoot . '/toolbox') : false;
if ($toolboxRoot === false) {
    http_response_code(503);
    exit('Toolbox derzeit nicht verfügbar.');
}

$cleanPath = ltrim(preg_replace('#/+#', '/', $urlPath), '/');
if (is_dir($docRoot . '/' . $cleanPath) && substr($urlPath, -1) !== '/') {
    header('Location: ' . $urlPath . '/', true, 301);
    exit;
}

$candidates = [
    $docRoot . '/' . rtrim($cleanPath, '/') . '/index.html',
    $docRoot . '/' . $cleanPath,
    $docRoot . '/' . $cleanPath . '.html',
];
$mimeTypes = [
    'html' => 'text/html; charset=UTF-8',
    'pdf' => 'application/pdf',
    'png' => 'image/png',
];

foreach ($candidates as $candidate) {
    $real = realpath($candidate);
    if ($real === false || !is_file($real) || !str_starts_with($real, $toolboxRoot . DIRECTORY_SEPARATOR)) {
        continue;
    }
    $extension = strtolower(pathinfo($real, PATHINFO_EXTENSION));
    if (!isset($mimeTypes[$extension])) {
        continue;
    }
    header('Content-Type: ' . $mimeTypes[$extension]);
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    readfile($real);
    exit;
}

http_response_code(404);
header('Cache-Control: no-store');
exit('Not Found');
