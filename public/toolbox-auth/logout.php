<?php
/**
 * Authentik Logout Handler
 * Löscht das signierte Session-Cookie und leitet zur Startseite weiter.
 */
$config = require __DIR__ . '/config.php';

$isHttps = (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['HTTPS'] == 1)) ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

// Cookie löschen
setcookie($config['cookie_name'], '', [
    'expires'  => time() - 86400,
    'path'     => '/',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);

// Weiterleitung zur Website-Startseite
header('Location: /?logout=1', true, 302);
exit;
