<?php
/**
 * Authentik Logout Handler
 * Löscht das signierte Session-Cookie und leitet zur Startseite weiter.
 */
$config = require __DIR__ . '/config.php';

// Cookie löschen
setcookie($config['cookie_name'], '', [
    'expires'  => time() - 86400,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);

// Weiterleitung zur Website-Startseite
header('Location: /?logout=1', true, 302);
exit;
