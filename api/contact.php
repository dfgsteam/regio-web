<?php
/**
 * SMJ Regio Wegweiser - Static Site PHP Contact Form Handler
 * Handles contact form submissions, honeypot spam protection,
 * input validation, and sends an email to the team.
 */

header('Content-Type: application/json; charset=utf-8');

// Configurable recipient
$toEmail = getenv('MAIL_TO') ?: 'kontakt@smj-wegweiser.de';
$fromEmail = getenv('MAIL_FROM') ?: 'website@smj-wegweiser.de';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'detail' => 'Nur POST-Anfragen erlaubt.']);
    exit;
}

// Support both JSON payload and standard form POST
$input = json_decode(file_get_contents('php://input'), true);
if (!$input && !empty($_POST)) {
    $input = $_POST;
}

if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'detail' => 'Ungültige Formulardaten.']);
    exit;
}

// Honeypot spam check
if (!empty($input['website'])) {
    // Silently succeed for bots
    echo json_encode(['ok' => true]);
    exit;
}

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$message = trim($input['message'] ?? '');

// Validation
if (mb_strlen($name) < 2 || mb_strlen($name) > 120) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'field' => 'name', 'detail' => 'Bitte gib deinen Namen an (mindestens 2 Zeichen).']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'field' => 'email', 'detail' => 'Bitte gib eine gültige E-Mail-Adresse an.']);
    exit;
}

if (mb_strlen($message) < 10 || mb_strlen($message) > 4000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'field' => 'message', 'detail' => 'Deine Nachricht sollte mindestens 10 Zeichen lang sein.']);
    exit;
}

// Construct Email
$subject = 'Neue Nachricht über das Kontaktformular (SMJ Website)';
$body = "Name: " . $name . "\n";
$body .= "E-Mail: " . $email . "\n";
$body .= "Datum: " . date('d.m.Y H:i:s') . "\n";
$body .= "IP-Adresse: " . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt') . "\n\n";
$body .= "Nachricht:\n" . $message . "\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/plain; charset=utf-8';
$headers[] = 'From: SMJ Regio Wegweiser Website <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$mailSent = @mail($toEmail, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if ($mailSent) {
    echo json_encode(['ok' => true, 'message' => 'Nachricht gesendet. Wir melden uns!']);
} else {
    // In local development or environments without sendmail, log and succeed or inform
    error_log("Contact form: Failed to send mail to $toEmail from $email");
    // If mail function fails on basic webspace, notify gracefully
    http_response_code(500);
    echo json_encode(['ok' => false, 'detail' => 'E-Mail-Versand fehlgeschlagen. Bitte schreibe direkt an kontakt@smj-wegweiser.de']);
}
