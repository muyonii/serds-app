<?php
/**
 * SERD Telemetry Units Endpoint (PHP / MySQL)
 * Returns active emergency apparatus GPS telemetry.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendCorsHeaders();

$pdo = getDbConnection();
$units = [];

if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM `telemetry_units` ORDER BY `id` ASC");
        while ($row = $stmt->fetch()) {
            $units[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'type' => $row['type'],
                'status' => $row['status'],
                'coords' => [(float)$row['latitude'], (float)$row['longitude']],
                'speedKmh' => (int)$row['speed_kmh'],
                'batteryPct' => (int)$row['battery_pct']
            ];
        }
    } catch (Exception $e) {
        $units = [];
    }
}

// Fallback if database empty or offline
if (empty($units)) {
    $units = [
        ['id' => 'MED-04', 'name' => 'Ambulance Unit 04', 'type' => 'Paramedic ALS', 'status' => 'en_route', 'coords' => [14.6795, 120.5360], 'speedKmh' => 42, 'batteryPct' => 94],
        ['id' => 'ENG-02', 'name' => 'Bataan Engine 02', 'type' => 'Fire Apparatus', 'status' => 'station_ready', 'coords' => [14.6730, 120.5310], 'speedKmh' => 0, 'batteryPct' => 99],
        ['id' => 'POL-07', 'name' => 'Balanga Patrol 07', 'type' => 'Police Cruiser', 'status' => 'patrolling', 'coords' => [14.6820, 120.5400], 'speedKmh' => 28, 'batteryPct' => 88]
    ];
}

jsonResponse([
    'success' => true,
    'count' => count($units),
    'units' => $units
]);
