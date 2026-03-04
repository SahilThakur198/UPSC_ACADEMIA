<?php
/**
 * ============================================
 * UPSC Academia - PHP API Router
 * ============================================
 * Mirrors the Google Apps Script (Code.gs) actions
 * for dual-write to MySQL database.
 * 
 * Supported actions:
 *   - enroll       → Saves demo class booking to `leads` table
 *   - signup       → Saves staff signup to `users` table
 *   - registerAdmitted → Saves admitted student data to `student_registrations` table
 *   - getLeads     → Fetches all leads (for staff dashboard)
 *   - getRegistrations → Fetches all online-registered students
 *   - health       → Returns API health status
 * ============================================
 */

require_once __DIR__ . '/config.php';

// ─── PARSE REQUEST ──────────────────────────────────────────────────
$action = '';
$data = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check for JSON body first
    $rawInput = file_get_contents('php://input');
    $jsonData = json_decode($rawInput, true);

    if ($jsonData && isset($jsonData['action'])) {
        $action = $jsonData['action'];
        $data = isset($jsonData['data']) ? $jsonData['data'] : [];
        // If data is a string (JSON-encoded), decode it
        if (is_string($data)) {
            $data = json_decode($data, true) ?: [];
        }
    } else {
        // URL-encoded form data (application/x-www-form-urlencoded)
        $action = isset($_POST['action']) ? $_POST['action'] : '';
        $dataRaw = isset($_POST['data']) ? $_POST['data'] : '{}';
        $data = json_decode($dataRaw, true) ?: [];
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $dataRaw = isset($_GET['data']) ? $_GET['data'] : '{}';
    $data = json_decode($dataRaw, true) ?: [];
}

// ─── ROUTE REQUEST ──────────────────────────────────────────────────
$result = ['success' => false, 'message' => 'Invalid action: ' . $action];

switch ($action) {
    case 'enroll':
        $result = processEnrollment($data);
        break;
    case 'signup':
        $result = processSignup($data);
        break;
    case 'registerAdmitted':
        $result = processAdmittedRegistration($data);
        break;
    case 'getLeads':
        $result = getLeads();
        break;
    case 'getRegistrations':
        $result = getRegistrations();
        break;
    case 'health':
        $result = healthCheck();
        break;
    default:
        $result = ['success' => false, 'message' => 'Unknown action: ' . $action];
        break;
}

echo json_encode($result);
exit();


// =============================================
// ACTION HANDLERS
// =============================================

/**
 * Process enrollment (demo class booking)
 * Mirrors Code.gs processEnrollment()
 */
function processEnrollment($data)
{
    try {
        $pdo = getDBConnection();

        $name = sanitize($data['name'] ?? $data['enrollName'] ?? '');
        $email = sanitize($data['email'] ?? $data['enrollEmail'] ?? '');
        $phone = sanitize($data['phone'] ?? $data['enrollPhone'] ?? '');
        $course = sanitize($data['course'] ?? '');

        if (empty($name) || empty($email) || empty($phone)) {
            return ['success' => false, 'message' => 'Name, email, and phone are required.'];
        }

        $stmt = $pdo->prepare("
            INSERT INTO leads (name, email, phone, course, status, created_at)
            VALUES (:name, :email, :phone, :course, 'New', NOW())
        ");

        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':course' => $course,
        ]);

        return ['success' => true, 'message' => 'Enrollment saved to database.', 'id' => $pdo->lastInsertId()];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'DB Error: ' . $e->getMessage()];
    }
}

/**
 * Process staff signup
 * Mirrors Code.gs processSignup()
 */
function processSignup($data)
{
    try {
        $pdo = getDBConnection();

        $name = sanitize($data['name'] ?? '');
        $email = sanitize($data['email'] ?? '');
        $password = $data['password'] ?? '';  // Don't sanitize password (may contain special chars)

        if (empty($name) || empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'Name, email, and password are required.'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Please enter a valid email address.'];
        }

        // Check if email already exists
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $checkStmt->execute([':email' => strtolower($email)]);
        if ($checkStmt->fetch()) {
            return ['success' => false, 'message' => 'Email already registered in database.'];
        }

        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password, access_level, admin_consent, created_at)
            VALUES (:name, :email, :password, 'Allowed', 0, NOW())
        ");

        $stmt->execute([
            ':name' => $name,
            ':email' => strtolower($email),
            ':password' => $password,  // Stored as plaintext (matching GAS behavior)
        ]);

        return ['success' => true, 'message' => 'Signup saved to database.', 'id' => $pdo->lastInsertId()];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'DB Error: ' . $e->getMessage()];
    }
}

/**
 * Process admitted student registration
 * Mirrors Code.gs processAdmittedRegistration()
 */
function processAdmittedRegistration($data)
{
    try {
        $pdo = getDBConnection();

        $mid = sanitize($data['mid'] ?? '');
        $whatsapp_number = sanitize($data['whatsapp_number'] ?? '');
        $email = sanitize($data['email'] ?? '');
        $address = sanitize($data['address'] ?? '');

        // Honeypot check
        if (!empty($data['website'])) {
            return ['success' => false, 'message' => 'Registration failed.'];
        }

        if (empty($mid)) {
            return ['success' => false, 'message' => 'Missing Mahajyoti ID.'];
        }

        // Check if already registered in DB
        $checkStmt = $pdo->prepare("SELECT id FROM student_registrations WHERE mahajyoti_id = :mid AND online_registered = 1 LIMIT 1");
        $checkStmt->execute([':mid' => $mid]);
        if ($checkStmt->fetch()) {
            return ['success' => false, 'message' => 'Already registered in database. Duplicate not allowed.'];
        }

        // Use UPSERT: Insert if new, Update if exists
        $stmt = $pdo->prepare("
            INSERT INTO student_registrations (mahajyoti_id, whatsapp_number, email, full_address, online_registered, registration_date, created_at)
            VALUES (:mid, :whatsapp, :email, :address, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                whatsapp_number = :whatsapp2,
                email = :email2,
                full_address = :address2,
                online_registered = 1,
                registration_date = NOW()
        ");

        $stmt->execute([
            ':mid' => $mid,
            ':whatsapp' => $whatsapp_number,
            ':email' => $email,
            ':address' => $address,
            ':whatsapp2' => $whatsapp_number,
            ':email2' => $email,
            ':address2' => $address,
        ]);

        return ['success' => true, 'message' => 'Registration saved to database.', 'id' => $pdo->lastInsertId()];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'DB Error: ' . $e->getMessage()];
    }
}

/**
 * Get all leads (demo class bookings)
 * Mirrors Code.gs getLeadsFromSheet()
 */
function getLeads()
{
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->query("SELECT * FROM leads ORDER BY created_at DESC");
        $leads = $stmt->fetchAll();

        // Format to match GAS response structure
        $formatted = array_map(function ($row) {
            return [
                'id' => $row['id'],
                'timestamp' => $row['created_at'],
                'name' => $row['name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'course' => $row['course'],
                'status' => $row['status'],
            ];
        }, $leads);

        return ['success' => true, 'leads' => $formatted];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'DB Error: ' . $e->getMessage()];
    }
}

/**
 * Get all online-registered students
 * Mirrors Code.gs getRegistrationsFromSheet()
 */
function getRegistrations()
{
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->query("SELECT * FROM student_registrations WHERE online_registered = 1 ORDER BY registration_date DESC");
        $registrations = $stmt->fetchAll();

        // Format to match GAS response structure
        $formatted = array_map(function ($row) {
            return [
                'id' => $row['id'],
                'reg_id' => $row['mahajyoti_id'],
                'name' => $row['candidate_name'] ?? '',
                'percentile' => $row['percentile_scores'] ?? '',
                'dob' => $row['dob'] ?? '',
                'gender' => $row['gender'] ?? '',
                'category' => $row['category'] ?? '',
                'mob_no' => $row['mob_no'] ?? '',
                'batch_name' => $row['batch_name'] ?? '',
                'whatsapp_number' => $row['whatsapp_number'] ?? '',
                'email' => $row['email'] ?? '',
                'address' => $row['full_address'] ?? '',
                'registration_date' => $row['registration_date'] ?? '',
            ];
        }, $registrations);

        return ['success' => true, 'registrations' => $formatted];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'DB Error: ' . $e->getMessage()];
    }
}

/**
 * Health check endpoint
 */
function healthCheck()
{
    try {
        $pdo = getDBConnection();
        $pdo->query("SELECT 1");
        return [
            'success' => true,
            'message' => '🚀 UPSC Academia Database API is Live!',
            'database' => 'Connected',
            'timestamp' => date('c'),
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'message' => 'Database connection failed.',
            'error' => $e->getMessage(),
        ];
    }
}


// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Sanitize input: strip tags, trim, limit length
 */
function sanitize($value)
{
    if (empty($value))
        return '';
    return mb_substr(strip_tags(trim($value)), 0, 500, 'UTF-8');
}
