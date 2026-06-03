<?php
require_once 'config/db.php';

try {
    $pdo->exec("ALTER TABLE clients ADD COLUMN ai_folder_id VARCHAR(255) DEFAULT NULL AFTER folder_id");
    echo "Column ai_folder_id added successfully.";
} catch (PDOException $e) {
    echo "Error (might already exist): " . $e->getMessage();
}
?>
