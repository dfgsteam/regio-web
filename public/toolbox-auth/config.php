<?php
// Retired public helper. Keep this file to overwrite older FTP deployments.
http_response_code(403);
header('Cache-Control: no-store');
exit('Access Denied');
