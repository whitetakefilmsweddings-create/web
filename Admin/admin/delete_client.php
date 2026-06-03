<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireLogin();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['client_id'] ?? 0;
    
    if (!$id) {
        die("Invalid Client ID");
    }

    try {
        // Appointments need manual deletion if not set to cascade
        $pdo->prepare("DELETE FROM appointments WHERE client_id = ?")->execute([$id]);
        
        // Delete Client
        // Invoices will auto-delete due to ON DELETE CASCADE
        $pdo->prepare("DELETE FROM clients WHERE id = ?")->execute([$id]);
        
        header("Location: clients.php?msg=client_deleted");
        exit;
    } catch (PDOException $e) {
        die("Error deleting client: " . $e->getMessage());
    }
} else {
    header("Location: clients.php"); // Redirect if accessed directly
    exit;
}
