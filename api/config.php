<?php
/**
 * ============================================
 * UPSC Academia - Database Configuration
 * ============================================
 * MySQL connection for Hostinger hosting
 * Dual-write system: Google Sheets + MySQL
 * ============================================
 */

// ─── DATABASE CREDENTIALS ───────────────────────────────────────────
// Hostinger MySQL Database
define('DB_HOST', 'localhost');  // Hostinger uses localhost for MySQL
define('DB_NAME', 'u667809186_academia');
define('DB_USER', 'u667809186_academia');
define('DB_PASS', '@Rahul198.');  // ⚠️ Replace with your actual password
define('DB_CHARSET', 'utf8mb4');

// ─── CORS CONFIGURATION ────────────────────────────────────────────
// Allowed origins for cross-origin requests
$allowed_origins = [
    'https://upscacademia.in',
    'https://www.upscacademia.in',
    'https://academiaclass.in',
    'https://www.academiaclass.in',
    'http://localhost',
    'http://127.0.0.1',
    'null'  // Allow file:// protocol (local development)
];

// ─── SET CORS HEADERS ───────────────────────────────────────────────
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Allow any origin in development (tighten in production if needed)
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ─── DATABASE CONNECTION ────────────────────────────────────────────
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]);
        exit();
    }
}
