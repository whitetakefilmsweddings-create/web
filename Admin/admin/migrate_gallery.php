<?php
require_once '../config/db.php';

try {
    // Add gallery_code column
    $pdo->exec("ALTER TABLE clients ADD COLUMN gallery_code VARCHAR(50) DEFAULT NULL");
    echo "Success: Added gallery_code column.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Notice: Column gallery_code already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
