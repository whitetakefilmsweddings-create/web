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
$action = $data['action'] ?? null; // 'reject' or 'restore'

if (!$fileId || !$action) {
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

try {
    if ($action === 'reject') {
        // Check if already rejected
        $stmt = $pdo->prepare("SELECT id FROM client_rejections WHERE client_id = ? AND file_id = ?");
        $stmt->execute([$clientId, $fileId]);
        if (!$stmt->fetch()) {
            $stmt = $pdo->prepare("INSERT INTO client_rejections (client_id, file_id) VALUES (?, ?)");
            $stmt->execute([$clientId, $fileId]);
        }
    } elseif ($action === 'restore') {
        $stmt = $pdo->prepare("DELETE FROM client_rejections WHERE client_id = ? AND file_id = ?");
        $stmt->execute([$clientId, $fileId]);
    }
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
