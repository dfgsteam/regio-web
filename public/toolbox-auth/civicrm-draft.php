<?php
// Retired endpoint. Keep this file so FTP deployments replace older copies.
http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['success' => false, 'message' => 'Dieser Endpunkt ist nicht mehr verfügbar.']);
