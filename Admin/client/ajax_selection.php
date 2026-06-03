<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/auth.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$clientId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

$fileId = $data['file_id'] ?? null;
$action = $data['action'] ?? null; // 'select' or 'deselect'

if (!$fileId || !$action) {
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

try {
    if ($action === 'select') {
        // Check if already selected
        $stmt = $pdo->prepare("SELECT id FROM client_selections WHERE client_id = ? AND file_id = ?");
        $stmt->execute([$clientId, $fileId]);
        if (!$stmt->fetch()) {
            $stmt = $pdo->prepare("INSERT INTO client_selections (client_id, file_id) VALUES (?, ?)");
            $stmt->execute([$clientId, $fileId]);
        }
    } elseif ($action === 'deselect') {
        $stmt = $pdo->prepare("DELETE FROM client_selections WHERE client_id = ? AND file_id = ?");
        $stmt->execute([$clientId, $fileId]);
    }
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
