<?php
require_once __DIR__ . '/config/db.php';

try {
    $sql = file_get_contents('update_schema.sql');
    $pdo->exec($sql);
    echo "Database updated successfully: invoice_items table created.";
} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>
