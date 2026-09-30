<?php
/**
 * Authentik Logout Handler
 * Löscht das signierte Session-Cookie und leitet zur Startseite weiter.
 */
$config = require dirname(__DIR__, 2) . '/private/config.php';

// Cookie löschen
setcookie($config['cookie_name'], '', [
    'expires'  => time() - 86400,
    'path'     => '/',
    'secure'   => $config['cookie_secure'],
    'httponly' => true,
    'samesite' => 'Lax',
]);

// Weiterleitung zur Website-Startseite
header('Location: /?logout=1', true, 302);
exit;
