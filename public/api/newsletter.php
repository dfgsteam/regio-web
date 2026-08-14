<?php
/**
 * SMJ Regio Wegweiser - Static Site PHP Newsletter Handler
 */

header('Content-Type: application/json; charset=utf-8');

$toEmail = getenv('MAIL_TO') ?: 'kontakt@smj-wegweiser.de';
$fromEmail = getenv('MAIL_FROM') ?: 'website@smj-wegweiser.de';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'detail' => 'Nur POST-Anfragen erlaubt.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input && !empty($_POST)) {
    $input = $_POST;
}

if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'detail' => 'Ungültige Formulardaten.']);
    exit;
}

if (!empty($input['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$email = trim($input['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'field' => 'email', 'detail' => 'Bitte gib eine gültige E-Mail-Adresse ein.']);
    exit;
}

$subject = 'Neue Newsletter-Anmeldung (SMJ Website)';
$body = "Neue Newsletter-Anmeldung:\n\n";
$body .= "E-Mail: " . $email . "\n";
$body .= "Datum: " . date('d.m.Y H:i:s') . "\n";
$body .= "IP-Adresse: " . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt') . "\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/plain; charset=utf-8';
$headers[] = 'From: SMJ Regio Wegweiser Website <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

@mail($toEmail, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

echo json_encode([
    'ok' => true,
    'message' => 'Vielen Dank! Du bist jetzt für den Wegweiser-Newsletter eingetragen.',
]);
