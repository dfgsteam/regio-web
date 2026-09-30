<?php
/**
 * Dynamic CiviCRM APIv4 Proxy for Leiter-Toolbox
 * 
 * Provides authenticated, server-side CiviCRM data access:
 * - GET  ?action=groups               Fetch active groups & smartgroups
 * - GET  ?action=contacts&group_id=X  Fetch ALL contacts in group (limit: 0, no truncation)
 * - POST ?action=draft                Create Mailing or SMS activity draft
 *
 * Keeps CiviCRM credentials 100% secure server-side.
 */

error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$config = require __DIR__ . '/config.php';

// Verify signed session cookie
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

// In local development, allow authenticated access for testing
$isLocalDev = (
    ($_SERVER['SERVER_NAME'] ?? '') === 'localhost' ||
    ($_SERVER['HTTP_HOST'] ?? '') === 'localhost:4321' ||
    str_starts_with($_SERVER['HTTP_HOST'] ?? '', 'localhost') ||
    str_starts_with($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') ||
    getenv('APP_ENV') === 'development' ||
    getenv('NODE_ENV') === 'development'
);
if (!$isAuthenticated && $isLocalDev) {
    $isAuthenticated = true;
}

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Nicht autorisiert. Bitte in der Toolbox neu anmelden.']);
    exit;
}

$civiBaseUrl = rtrim((string)($config['civicrm_base_url'] ?? 'https://civi.smj-wegweiser.de'), '/');
$apiKey = (string)($config['civicrm_api_key'] ?? '');
$siteKey = (string)($config['civicrm_site_key'] ?? '');

// Fallback to environment variables if not present in config file
if (empty($apiKey)) {
    $apiKey = (string)(getenv('CIVICRM_API_KEY') ?: ($_ENV['CIVICRM_API_KEY'] ?? ''));
}
if (empty($siteKey)) {
    $siteKey = (string)(getenv('CIVICRM_SITE_KEY') ?: ($_ENV['CIVICRM_SITE_KEY'] ?? ''));
}

// Low-level helper to execute CiviCRM APIv4 calls
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    if (PHP_VERSION_ID < 80500) {
        @curl_close($ch);
    }

    if ($curlErr) {
        return ['error' => 'cURL Error: ' . $curlErr];
    }
    if ($httpCode !== 200 || !$response) {
        return ['error' => 'HTTP ' . $httpCode, 'raw' => $response];
    }
    return json_decode($response, true);
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ----------------------------------------------------
// 1. GET GROUPS
// ----------------------------------------------------
if ($action === 'groups') {
    if (empty($apiKey)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'CIVICRM_API_KEY fehlt in der Server-Konfiguration.']);
        exit;
    }

    $res = callCiviApi4($civiBaseUrl, $apiKey, $siteKey, 'Group', 'get', [
        'select' => ['id', 'name', 'title', 'description', 'saved_search_id', 'is_active'],
        'where' => [['is_active', '=', true], ['is_hidden', '=', false]],
        'orderBy' => ['title' => 'ASC'],
        'limit' => 50,
    ]);

    if (!empty($res['values'])) {
        $groups = [];
        foreach ($res['values'] as $g) {
            $groups[] = [
                'id' => intval($g['id']),
                'name' => $g['name'],
                'title' => $g['title'],
                'description' => $g['description'] ?? '',
                'isSmart' => !empty($g['saved_search_id']),
            ];
        }
        echo json_encode(['success' => true, 'groups' => $groups]);
        exit;
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $res['error_message'] ?? 'Fehler beim Laden der Gruppen']);
    exit;
}

// ----------------------------------------------------
// 2. GET CONTACTS FOR GROUP (LIMIT 0 = NO TRUNCATION)
// ----------------------------------------------------
if ($action === 'contacts') {
    $groupId = intval($_GET['group_id'] ?? 0);
    if ($groupId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ungültige oder fehlende group_id']);
        exit;
    }

    if (empty($apiKey)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'CIVICRM_API_KEY fehlt in der Server-Konfiguration.']);
        exit;
    }

    // Query Contact with groups IN [groupId] and limit: 0 (ALL contacts!)
    $res = callCiviApi4($civiBaseUrl, $apiKey, $siteKey, 'Contact', 'get', [
        'select' => [
            'id',
            'display_name',
            'first_name',
            'last_name',
            'birth_date',
            'email_primary.email',
            'phone_primary.phone',
            'address_primary.street_address',
            'address_primary.postal_code',
            'address_primary.city',
            'test.Name_Mutter',
            'test.Name_Vater',
        ],
        'where' => [
            ['groups', 'IN', [$groupId]],
            ['is_deleted', '=', false],
        ],
        'orderBy' => [
            'last_name' => 'ASC',
            'first_name' => 'ASC',
        ],
        'limit' => 0, // No limit: fetch all contacts!
    ]);

    if (isset($res['values']) && is_array($res['values'])) {
        $contacts = [];
        $now = new DateTime();

        foreach ($res['values'] as $c) {
            $firstName = trim($c['first_name'] ?? '');
            $lastName = trim($c['last_name'] ?? '');
            $displayName = trim($c['display_name'] ?? '');

            if (empty($firstName) && !empty($displayName)) {
                $parts = explode(' ', $displayName, 2);
                $firstName = $parts[0] ?? '';
                if (empty($lastName)) {
                    $lastName = $parts[1] ?? '';
                }
            }

            $street = trim($c['address_primary.street_address'] ?? ($c['address_primary']['street_address'] ?? ''));
            $postalCode = trim($c['address_primary.postal_code'] ?? ($c['address_primary']['postal_code'] ?? ''));
            $city = trim($c['address_primary.city'] ?? ($c['address_primary']['city'] ?? ''));

            $email = trim($c['email_primary.email'] ?? ($c['email_primary']['email'] ?? ''));
            $phone = trim($c['phone_primary.phone'] ?? ($c['phone_primary']['phone'] ?? ''));

            $mother = trim($c['test.Name_Mutter'] ?? '');
            $father = trim($c['test.Name_Vater'] ?? '');
            $parentParts = array_filter([$mother, $father]);
            $parentNames = !empty($parentParts) ? implode(' & ', $parentParts) : null;

            $hasValidAddress = (!empty($street) && !empty($postalCode) && !empty($city));

            $age = null;
            $birthDate = $c['birth_date'] ?? null;
            if (!empty($birthDate)) {
                try {
                    $bdate = new DateTime($birthDate);
                    $diff = $now->diff($bdate);
                    $age = $diff->y;
                } catch (Exception $e) {
                    $age = null;
                }
            }

            $contacts[] = [
                'id' => intval($c['id']),
                'displayName' => $displayName ?: trim($firstName . ' ' . $lastName),
                'firstName' => $firstName,
                'lastName' => $lastName,
                'salutation' => !empty($firstName) ? 'Lieber ' . $firstName : 'Lieber Teilnehmer',
                'formalSalutation' => !empty($lastName) ? 'Liebe Familie ' . $lastName : 'Liebe Eltern',
                'parentNames' => $parentNames,
                'birthDate' => $birthDate,
                'age' => $age,
                'address' => $hasValidAddress ? [
                    'street' => $street,
                    'postalCode' => $postalCode,
                    'city' => $city,
                ] : null,
                'email' => !empty($email) ? $email : null,
                'phone' => !empty($phone) ? $phone : null,
                'hasValidAddress' => $hasValidAddress,
                'hasValidEmail' => !empty($email),
                'hasValidPhone' => !empty($phone),
            ];
        }

        echo json_encode([
            'success' => true,
            'groupId' => $groupId,
            'count' => count($contacts),
            'contacts' => $contacts,
        ]);
        exit;
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $res['error_message'] ?? 'Fehler beim Laden der Kontakte']);
    exit;
}

// Helper to strip 4-byte UTF-8 emojis that break MySQL tables without utf8mb4
function sanitizeUtf8ForCivi($text) {
    if (!is_string($text)) return $text;
    return preg_replace('/[\x{10000}-\x{10FFFF}]/u', '', $text);
}

// ----------------------------------------------------
// 3. POST CREATE DRAFT (MAILING OR SMS ACTIVITY)
// ----------------------------------------------------
if ($action === 'draft' || $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ungültiges JSON-Payload']);
        exit;
    }

    $type = $input['type'] ?? '';
    $groupId = intval($input['groupId'] ?? 0);
    $campaignName = sanitizeUtf8ForCivi(trim($input['campaignName'] ?? ''));

    if ($type === 'email') {
        $subject = sanitizeUtf8ForCivi(trim($input['subject'] ?? ''));
        $bodyHtml = sanitizeUtf8ForCivi($input['bodyHtml'] ?? '');
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
                'civiUrl' => $civiBaseUrl . '/civicrm/a/#/mailing/' . $id,
                'message' => 'Mailing-Entwurf erfolgreich in CiviCRM angelegt (Mailing-ID: ' . $id . ')',
            ]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $res['error_message'] ?? ($res['error'] ?? 'Fehler beim Erstellen des Mailings'),
                'civiUrl' => $civiBaseUrl . '/civicrm/mailing/browse/unscheduled?reset=1',
            ]);
            exit;
        }
    }

    if ($type === 'sms') {
        $text = sanitizeUtf8ForCivi(trim($input['text'] ?? ''));
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
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unbekannte Aktion']);
