<?php
/**
 * SERD Master API Router (PHP / Apache for XAMPP & phpMyAdmin)
 * Handles all REST API routes under /api
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendCorsHeaders();

// Determine requested route
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

// Extract path relative to api directory
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove directory prefix if nested (e.g., /serd/api or /api)
if (strpos($path, $scriptName) === 0) {
    $path = substr($path, strlen($scriptName));
} else {
    $scriptDir = dirname($scriptName);
    if ($scriptDir !== '/' && strpos($path, $scriptDir) === 0) {
        $path = substr($path, strlen($scriptDir));
    }
}

// Also check query param fallback e.g. ?route=health
if (isset($_GET['route'])) {
    $path = '/' . ltrim($_GET['route'], '/');
}

$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Route Dispatcher
if ($path === '' || $path === '/' || $path === '/health') {
    require __DIR__ . '/health.php';
    exit();
}

if ($path === '/profile') {
    require __DIR__ . '/profile.php';
    exit();
}

if ($path === '/contacts/broadcast-safe' || $path === '/broadcast') {
    require __DIR__ . '/broadcast.php';
    exit();
}

if ($path === '/telemetry/units' || $path === '/telemetry') {
    require __DIR__ . '/telemetry.php';
    exit();
}

// Incidents routing:
// /incidents
// /incidents/:id
// /incidents/:id/status
if (preg_match('#^/incidents(?:/([^/]+))?(?:/(status))?$#', $path, $matches)) {
    if (!empty($matches[1])) {
        $_GET['id'] = $matches[1];
    }
    if (!empty($matches[2]) && $matches[2] === 'status') {
        $_GET['action'] = 'status';
    }
    require __DIR__ . '/incidents.php';
    exit();
}

// Route not found
jsonResponse([
    'success' => false,
    'error' => 'Endpoint not found',
    'requestedPath' => $path,
    'availableEndpoints' => [
        'GET  /api/health',
        'GET  /api/incidents',
        'POST /api/incidents',
        'GET  /api/incidents/{id}',
        'PATCH/POST /api/incidents/{id}/status',
        'POST /api/contacts/broadcast-safe',
        'GET  /api/profile',
        'POST /api/profile',
        'GET  /api/telemetry/units'
    ]
], 404);
