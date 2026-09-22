<?php
/**
 * SERD Health & Diagnostic Endpoint (PHP / Apache / MySQL)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendCorsHeaders();

$pdo = getDbConnection();
$dbStatus = 'disconnected';
$activeIncidents = 0;
$dbError = null;

if ($pdo) {
    $dbStatus = 'connected';
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM `incidents` WHERE `status` != 'resolved'");
        $row = $stmt->fetch();
        $activeIncidents = (int)($row['cnt'] ?? 0);
    } catch (Exception $e) {
        $dbError = $e->getMessage();
    }
}

jsonResponse([
    'status' => 'ok',
    'backend' => 'php',
    'platform' => 'Apache / PHP (XAMPP)',
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Apache',
    'database' => [
        'status' => $dbStatus,
        'driver' => 'MySQL (PDO)',
        'host' => DB_HOST . ':' . DB_PORT,
        'name' => DB_NAME,
        'error' => $dbError
    ],
    'cadStatus' => 'ONLINE',
    'activeIncidents' => $activeIncidents,
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
]);
