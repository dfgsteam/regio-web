<?php
/**
 * Authentik Login-Initiator
 * Erzeugt kryptografischen CSRF-State und leitet zu Authentik weiter.
 */
session_start();
$config = require __DIR__ . '/config.php';

// Zufälligen CSRF-Token (State) erzeugen
$state = bin2hex(random_bytes(16));
$_SESSION['oauth2_state'] = $state;

// Gewünschte Zieladresse nach erfolgreichem Login merken
$returnTo = $_GET['return_to'] ?? '/toolbox/';
// Erlaube nur sichere interne Weiterleitungen innerhalb der Toolbox
if (!preg_match('#^/toolbox#', $returnTo)) {
    $returnTo = '/toolbox/';
}
$_SESSION['oauth2_return_to'] = $returnTo;

// Authentik Authorization URL zusammensetzen
$authUrl = rtrim($config['authentik_url'], '/') . '/application/o/authorize/?' . http_build_query([
    'client_id'     => $config['client_id'],
    'response_type' => 'code',
    'scope'         => 'openid profile email',
    'redirect_uri'  => $config['redirect_uri'],
    'state'         => $state,
]);

header('Location: ' . $authUrl, true, 302);
exit;
