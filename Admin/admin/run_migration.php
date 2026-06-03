<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/db.php';

echo "<h1>Database Migration</h1>";

try {
    // Add gallery_code column
    echo "Attempting to add 'gallery_code' column...<br>";
    $pdo->exec("ALTER TABLE clients ADD COLUMN gallery_code VARCHAR(50) DEFAULT NULL");
    echo "<strong style='color:green'>Success: Added gallery_code column.</strong><br>";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "<span style='color:orange'>Notice: Column gallery_code already exists.</span><br>";
    } else {
        echo "<strong style='color:red'>Error: " . $e->getMessage() . "</strong><br>";
    }
}

echo "<br>Done.";
?>
