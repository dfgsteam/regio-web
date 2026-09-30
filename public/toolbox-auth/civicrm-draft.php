<?php
/**
 * Server-side endpoint to create CiviCRM Drafts (Mailing or SMS Activity)
 * Protected by Authentik Toolbox session cookie.
 */
header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/config.php';

// Verify signed cookie
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
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Nicht autorisiert. Bitte neu in der Toolbox anmelden.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ungültiges JSON']);
    exit;
}

$type = $input['type'] ?? '';
$groupId = intval($input['groupId'] ?? 0);
$campaignName = trim($input['campaignName'] ?? '');

$civiBaseUrl = rtrim((string)($config['civicrm_base_url'] ?? 'https://civi.smj-wegweiser.de'), '/');
$apiKey = (string)($config['civicrm_api_key'] ?? '');
$siteKey = (string)($config['civicrm_site_key'] ?? '');

if (empty($apiKey)) {
    // If running without live key, return mock success
    echo json_encode([
        'success' => true,
        'type' => $type,
        'civicrmId' => rand(100, 999),
        'civiUrl' => $civiBaseUrl . '/civicrm/mailing/browse/unscheduled?reset=1',
        'message' => 'Simulierter Entwurf angelegt (CiviCRM API-Key nicht im PHP hinterlegt)',
    ]);
    exit;
}

function callCiviApi4($baseUrl, $apiKey, $siteKey, $entity, $action, $params) {
    $url = $baseUrl . '/civicrm/ajax/api4/' . $entity . '/' . $action;
    $ch = curl_init($url);
    $headers = [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json',
        'X-Requested-With: XMLHttpRequest',
        'X-Civi-Auth: Bearer ' . $apiKey,
    ];
    if (!empty($siteKey)) {
        $headers[] = 'X-Civi-Key: ' . $siteKey;
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['params' => json_encode($params)]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return ['error' => 'HTTP ' . $httpCode];
    }
    return json_decode($response, true);
}

if ($type === 'email') {
    $subject = trim($input['subject'] ?? '');
    $bodyHtml = $input['bodyHtml'] ?? '';
    if (empty($subject) || empty($bodyHtml) || empty($groupId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Fehlende Felder für E-Mail-Mailing']);
        exit;
    }

    $res = callCiviApi4($civiBaseUrl, $apiKey, $siteKey, 'Mailing', 'create', [
        'values' => [
            'name' => $campaignName . ' (Entwurf)',
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'replyto_email' => 'kontakt@smj-wegweiser.de',
            'from_name' => 'SMJ Wegweiser',
            'groups' => ['include' => [$groupId]],
        ]
    ]);

    if (!empty($res['values'][0]['id'])) {
        $id = $res['values'][0]['id'];
        echo json_encode([
            'success' => true,
            'type' => 'email',
            'civicrmId' => $id,
            'civiUrl' => $civiBaseUrl . '/civicrm/mailing/browse/unscheduled?reset=1',
            'message' => 'Mailing-Entwurf erfolgreich in CiviCRM angelegt (Mailing-ID: ' . $id . ')',
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $res['error_message'] ?? 'Fehler beim Erstellen des Mailings']);
        exit;
    }
}

if ($type === 'sms') {
    $text = trim($input['text'] ?? '');
    if (empty($text) || empty($groupId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Fehlende Felder für SMS-Entwurf']);
        exit;
    }

    $res = callCiviApi4($civiBaseUrl, $apiKey, $siteKey, 'Activity', 'create', [
        'values' => [
            'source_contact_id' => 1021,
            'activity_type_id' => 4,
            'subject' => 'SMS: ' . ($campaignName ?: 'Sammelnachricht'),
            'details' => $text,
            'status_id' => 1,
        ]
    ]);

    if (!empty($res['values'][0]['id'])) {
        $id = $res['values'][0]['id'];
        echo json_encode([
            'success' => true,
            'type' => 'sms',
            'civicrmId' => $id,
            'civiUrl' => $civiBaseUrl . '/civicrm/activity?action=view&reset=1&id=' . $id,
            'message' => 'SMS-Entwurf erfolgreich als Aktivität angelegt (Aktivitäts-ID: ' . $id . ')',
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $res['error_message'] ?? 'Fehler beim Erstellen der SMS']);
        exit;
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Ungültiger Typ']);
