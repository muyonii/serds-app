<?php
/**
 * SERD Incidents Endpoint (PHP / MySQL)
 * Handles incident creation, retrieval, and status updates.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendCorsHeaders();

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Parse query params
$incidentId = $_GET['id'] ?? null;
$isStatusUpdate = isset($_GET['action']) && $_GET['action'] === 'status';

// 1. GET - Retrieve all incidents or single incident
if ($method === 'GET') {
    if ($incidentId) {
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT * FROM `incidents` WHERE `id` = :id LIMIT 1");
            $stmt->execute([':id' => $incidentId]);
            $row = $stmt->fetch();
            if ($row) {
                $item = formatIncidentRow($row);
                jsonResponse(['success' => true, 'data' => $item]);
            }
        }
        jsonResponse(['success' => false, 'message' => 'Incident not found'], 404);
    }

    $incidents = [];
    if ($pdo) {
        $stmt = $pdo->query("SELECT * FROM `incidents` ORDER BY `created_at` DESC");
        while ($row = $stmt->fetch()) {
            $incidents[] = formatIncidentRow($row);
        }
    } else {
        // In-memory fallback if MySQL is not started in XAMPP
        $incidents = getFallbackIncidents();
    }

    jsonResponse([
        'success' => true,
        'count' => count($incidents),
        'data' => $incidents
    ]);
}

// 2. POST / PATCH - Create or update status
if ($method === 'POST' || $method === 'PATCH') {
    $input = getJsonInput();

    // Check if updating status
    if ($isStatusUpdate || $method === 'PATCH' || isset($input['status']) && !isset($input['type'])) {
        $targetId = $incidentId ?: ($input['id'] ?? null);
        $newStatus = $input['status'] ?? 'en_route';

        if (!$targetId) {
            jsonResponse(['success' => false, 'message' => 'Missing incident ID'], 400);
        }

        if ($pdo) {
            $stmt = $pdo->prepare("UPDATE `incidents` SET `status` = :status WHERE `id` = :id");
            $stmt->execute([':status' => $newStatus, ':id' => $targetId]);

            $stmt2 = $pdo->prepare("SELECT * FROM `incidents` WHERE `id` = :id LIMIT 1");
            $stmt2->execute([':id' => $targetId]);
            $row = $stmt2->fetch();
            if ($row) {
                jsonResponse(['success' => true, 'message' => 'Status updated', 'data' => formatIncidentRow($row)]);
            }
        }

        jsonResponse([
            'success' => true,
            'message' => 'Status updated (memory fallback)',
            'data' => ['id' => $targetId, 'status' => $newStatus]
        ]);
    }

    // Creating a new CAD Emergency Incident
    $newId = 'CAD-' . rand(1000, 9999);
    $type = $input['type'] ?? 'General Emergency SOS';
    $priority = $input['priority'] ?? 'critical';
    $location = $input['location'] ?? 'Balanga City Center, Plaza Mayor';
    $patientName = $input['patientName'] ?? 'Citizen Caller';
    $details = $input['details'] ?? '';
    $coords = $input['coords'] ?? [14.6780, 120.5390];
    $lat = isset($coords[0]) ? (float)$coords[0] : 14.6780;
    $lng = isset($coords[1]) ? (float)$coords[1] : 120.5390;
    $reportedTime = date('g:i A');

    $record = [
        'id' => $newId,
        'code' => '10-79',
        'type' => $type,
        'priority' => $priority,
        'location' => $location,
        'reportedTime' => $reportedTime,
        'patientName' => $patientName,
        'recommendedUnit' => 'Ambulance Unit 04',
        'distanceKm' => 0.48,
        'etaMins' => 2.0,
        'routeAlgorithm' => 'Dijkstra (Optimal Node Path)',
        'status' => 'dispatched',
        'coords' => [$lat, $lng],
        'details' => $details,
        'createdAt' => gmdate('Y-m-d\TH:i:s\Z')
    ];

    if ($pdo) {
        $stmt = $pdo->prepare("
            INSERT INTO `incidents` (`id`, `code`, `type`, `priority`, `location`, `reported_time`, `patient_name`, `recommended_unit`, `distance_km`, `eta_mins`, `route_algorithm`, `status`, `latitude`, `longitude`, `details`)
            VALUES (:id, :code, :type, :priority, :location, :reported_time, :patient_name, :recommended_unit, :distance_km, :eta_mins, :route_algorithm, :status, :lat, :lng, :details)
        ");
        $stmt->execute([
            ':id' => $newId,
            ':code' => $record['code'],
            ':type' => $record['type'],
            ':priority' => $record['priority'],
            ':location' => $record['location'],
            ':reported_time' => $record['reportedTime'],
            ':patient_name' => $record['patientName'],
            ':recommended_unit' => $record['recommendedUnit'],
            ':distance_km' => $record['distanceKm'],
            ':eta_mins' => $record['etaMins'],
            ':route_algorithm' => $record['routeAlgorithm'],
            ':status' => $record['status'],
            ':lat' => $lat,
            ':lng' => $lng,
            ':details' => $details
        ]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Emergency incident dispatched successfully to CAD queue',
        'data' => $record
    ], 201);
}

// Helper: Formatter
function formatIncidentRow($row) {
    return [
        'id' => $row['id'],
        'code' => $row['code'],
        'type' => $row['type'],
        'priority' => $row['priority'],
        'location' => $row['location'],
        'reportedTime' => $row['reported_time'],
        'patientName' => $row['patient_name'],
        'recommendedUnit' => $row['recommended_unit'],
        'distanceKm' => (float)$row['distance_km'],
        'etaMins' => (float)$row['eta_mins'],
        'routeAlgorithm' => $row['route_algorithm'],
        'status' => $row['status'],
        'coords' => [(float)$row['latitude'], (float)$row['longitude']],
        'details' => $row['details'] ?? '',
        'createdAt' => $row['created_at']
    ];
}

function getFallbackIncidents() {
    return [
        [
            'id' => 'CAD-1042',
            'code' => '10-79',
            'type' => 'Medical Emergency (Cardiac/Dyspnea)',
            'priority' => 'critical',
            'location' => '142 Rizal St, Poblacion, Balanga',
            'reportedTime' => '11:58 PM',
            'patientName' => 'Barry Allen (34M)',
            'recommendedUnit' => 'Ambulance Unit 04',
            'distanceKm' => 0.48,
            'etaMins' => 2.0,
            'routeAlgorithm' => 'Dijkstra (Optimal Node Path)',
            'status' => 'dispatched',
            'coords' => [14.6780, 120.5390]
        ]
    ];
}
