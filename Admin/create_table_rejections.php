<?php
require_once 'config/db.php';

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS client_rejections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        file_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    ";
    $pdo->exec($sql);
    echo "Table 'client_rejections' created successfully.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
