-- =========================================================================
-- SERD (Smart Emergency Response & Dispatch) - MySQL Database Schema
-- Optimized for XAMPP (phpMyAdmin) and standalone MySQL 5.7+ / 8.0+ / MariaDB
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `serd_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `serd_db`;

-- 1. Incidents Table (Computer-Aided Dispatch incidents)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` VARCHAR(32) NOT NULL,
  `code` VARCHAR(16) NOT NULL DEFAULT '10-79',
  `type` VARCHAR(128) NOT NULL,
  `priority` ENUM('critical', 'urgent', 'standard') NOT NULL DEFAULT 'critical',
  `location` VARCHAR(255) NOT NULL,
  `reported_time` VARCHAR(32) NOT NULL,
  `patient_name` VARCHAR(128) NOT NULL,
  `recommended_unit` VARCHAR(64) NOT NULL DEFAULT 'Ambulance Unit 04',
  `distance_km` DECIMAL(5,2) NOT NULL DEFAULT 0.48,
  `eta_mins` DECIMAL(5,1) NOT NULL DEFAULT 2.0,
  `route_algorithm` VARCHAR(64) NOT NULL DEFAULT 'Dijkstra (Optimal Node Path)',
  `status` ENUM('pending', 'dispatched', 'en_route', 'on_scene', 'resolved') NOT NULL DEFAULT 'dispatched',
  `latitude` DECIMAL(10,7) NOT NULL DEFAULT 14.6780,
  `longitude` DECIMAL(10,7) NOT NULL DEFAULT 120.5390,
  `details` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Profile Table (Medical CAD Pass & Emergency info)
CREATE TABLE IF NOT EXISTS `user_profile` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(128) NOT NULL DEFAULT 'Barry Allen',
  `display_name` VARCHAR(64) NOT NULL DEFAULT 'Barry',
  `email` VARCHAR(128) NOT NULL DEFAULT 'barry.allen@balanga911.gov.ph',
  `phone` VARCHAR(32) NOT NULL DEFAULT '+63 917 555 0199',
  `birthdate` DATE NULL DEFAULT '1992-04-12',
  `blood_type` VARCHAR(16) NOT NULL DEFAULT 'O+',
  `height_cm` INT NOT NULL DEFAULT 180,
  `weight_kg` INT NOT NULL DEFAULT 75,
  `address` VARCHAR(255) NOT NULL DEFAULT '142 Rizal St, Poblacion, Balanga City, Bataan',
  `city` VARCHAR(64) NOT NULL DEFAULT 'Balanga City',
  `chronic_conditions` TEXT NULL,
  `emergency_contact_name` VARCHAR(128) NOT NULL DEFAULT 'Iris West-Allen',
  `emergency_contact_relation` VARCHAR(64) NOT NULL DEFAULT 'Spouse',
  `emergency_contact_phone` VARCHAR(32) NOT NULL DEFAULT '+63 918 555 0144',
  `profile_completion_pct` INT NOT NULL DEFAULT 100,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Allergies Table
CREATE TABLE IF NOT EXISTS `allergies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL DEFAULT 1,
  `allergen` VARCHAR(128) NOT NULL,
  `reaction` VARCHAR(128) NOT NULL,
  `severity` VARCHAR(32) NOT NULL DEFAULT 'Moderate',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Emergency Apparatus / Units Telemetry Table
CREATE TABLE IF NOT EXISTS `telemetry_units` (
  `id` VARCHAR(32) NOT NULL PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'station_ready',
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `speed_kmh` INT NOT NULL DEFAULT 0,
  `battery_pct` INT NOT NULL DEFAULT 100,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Safety Broadcasts Log Table
CREATE TABLE IF NOT EXISTS `safety_broadcasts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `status` VARCHAR(32) NOT NULL DEFAULT 'Delivered',
  `caller_name` VARCHAR(128) NOT NULL,
  `recipients_notified` INT NOT NULL DEFAULT 4,
  `network_latency_ms` INT NOT NULL DEFAULT 82,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- Initial Seed Data
-- =========================================================================

-- Seed User Profile
INSERT INTO `user_profile` (`id`, `full_name`, `display_name`, `email`, `phone`, `birthdate`, `blood_type`, `height_cm`, `weight_kg`, `address`, `city`, `chronic_conditions`, `emergency_contact_name`, `emergency_contact_relation`, `emergency_contact_phone`, `profile_completion_pct`)
VALUES (1, 'Barry Allen', 'Barry', 'barry.allen@balanga911.gov.ph', '+63 917 555 0199', '1992-04-12', 'O+', 180, 75, '142 Rizal St, Poblacion, Balanga City, Bataan', 'Balanga City', 'None Reported', 'Iris West-Allen', 'Spouse', '+63 918 555 0144', 100)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Seed Allergies
DELETE FROM `allergies` WHERE `user_id` = 1;
INSERT INTO `allergies` (`user_id`, `allergen`, `reaction`, `severity`) VALUES
(1, 'Penicillin', 'Anaphylaxis / Rash', 'Severe'),
(1, 'Sulfa Drugs', 'Mild Hives', 'Moderate');

-- Seed Telemetry Units
INSERT INTO `telemetry_units` (`id`, `name`, `type`, `status`, `latitude`, `longitude`, `speed_kmh`, `battery_pct`) VALUES
('MED-04', 'Ambulance Unit 04', 'Paramedic ALS', 'en_route', 14.6795000, 120.5360000, 42, 94),
('ENG-02', 'Bataan Engine 02', 'Fire Apparatus', 'station_ready', 14.6730000, 120.5310000, 0, 99),
('POL-07', 'Balanga Patrol 07', 'Police Cruiser', 'patrolling', 14.6820000, 120.5400000, 28, 88)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `latitude` = VALUES(`latitude`), `longitude` = VALUES(`longitude`);

-- Seed Incidents
INSERT INTO `incidents` (`id`, `code`, `type`, `priority`, `location`, `reported_time`, `patient_name`, `recommended_unit`, `distance_km`, `eta_mins`, `route_algorithm`, `status`, `latitude`, `longitude`, `details`) VALUES
('CAD-1042', '10-79', 'Medical Emergency (Cardiac/Dyspnea)', 'critical', '142 Rizal St, Poblacion, Balanga', '11:58 PM', 'Barry Allen (34M)', 'Ambulance Unit 04', 0.48, 2.0, 'Dijkstra (Optimal Node Path)', 'dispatched', 14.6780000, 120.5390000, 'Patient experiencing chest tightness and difficulty breathing.'),
('CAD-1041', '10-70', 'Structure Fire Alert', 'critical', 'Capitol Compound, San Jose, Balanga', '11:42 PM', 'Caller Reported Smoke', 'Engine 02 (Bataan Central)', 1.80, 4.2, 'A* Shortest Urban Path', 'en_route', 14.6730000, 120.5310000, 'Heavy black smoke observed from commercial warehouse.'),
('CAD-1040', '10-50', 'Vehicular Collision (2-Car)', 'urgent', 'Roman Superhighway Cor. Tenejero', '11:15 PM', '2 Injured (Conscious)', 'Rescue Unit 01', 2.40, 5.8, 'Contraction Hierarchies', 'on_scene', 14.6850000, 120.5450000, 'Two sedans collided near intersection. Lane partially blocked.')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);
