<?php
/**
 * SERD Database Connection & Auto-Provisioning Helper
 * Uses PDO MySQL with utf8mb4 encoding.
 */

require_once __DIR__ . '/config.php';

function getDbConnection() {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = DB_HOST;
    $port = DB_PORT;
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;

    try {
        // Connect to server (without database first to auto-create if needed)
        $dsnWithoutDb = "mysql:host=$host;port=$port;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $serverPdo = new PDO($dsnWithoutDb, $user, $pass, $options);
        $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Now connect to the specific database
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, $options);

        // Ensure tables exist
        ensureSchemaExists($pdo);

        return $pdo;
    } catch (PDOException $e) {
        // If connection fails, return null or handle gracefully
        return null;
    }
}

/**
 * Automatically creates tables and seeds default data if tables do not exist
 */
function ensureSchemaExists(PDO $pdo) {
    try {
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'incidents'")->fetchAll();
        if (count($tableCheck) > 0) {
            return; // Already initialized
        }

        // Run schema creation
        $schemaPath = __DIR__ . '/schema.sql';
        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);
            // Remove comments and execute statements
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($statements as $stmt) {
                if (!empty($stmt)) {
                    $pdo->exec($stmt);
                }
            }
        }
    } catch (Exception $e) {
        // Log or silently ignore if permissions prevent
        error_log("Schema auto-init notice: " . $e->getMessage());
    }
}
