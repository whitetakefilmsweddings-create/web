<?php
// config.php - Database Configuration & Initialization
define('DB_HOST', 'localhost');
define('DB_NAME', 'u406992830_panle');
define('DB_USER', 'u406992830_panle');
define('DB_PASS', 'Noufal@2026');

// Set up admin panel password
define('ADMIN_PASSWORD', 'Noufal@2026');

try {
    $conn = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if not exists (if privilege exists, otherwise will skip/catch)
    $conn->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
} catch (PDOException $e) {
    // Database creation might be blocked on shared hosts, which is fine since the database u406992830_panle is pre-created by Hostinger.
}

try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if not exists
    $table_sql = "
    CREATE TABLE IF NOT EXISTS `section_images` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `page_name` VARCHAR(50) NOT NULL,
        `section_key` VARCHAR(50) NOT NULL UNIQUE,
        `image_path` VARCHAR(255) NOT NULL,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $conn->exec($table_sql);
    
    // Populate default values if empty
    $check = $conn->query("SELECT COUNT(*) FROM `section_images`")->fetchColumn();
    if ($check == 0) {
        $defaults = [
            ['home', 'intimate_1', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg'],
            ['home', 'intimate_2', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg'],
            ['home', 'intimate_3', 'https://weddingbellsstories.com/media_library/weddingbells-image-6tfhrz.jpg'],
            ['home', 'about_middle', 'assets/images/about.jpg'],
            ['home', 'about_right', 'assets/images/couple/3.jpg']
        ];
        
        $stmt = $conn->prepare("INSERT INTO `section_images` (`page_name`, `section_key`, `image_path`) VALUES (?, ?, ?)");
        foreach ($defaults as $row) {
            $stmt->execute($row);
        }
    }
} catch (PDOException $e) {
    // If DB connection fails, display warning.
    die("Database Connection Error: " . $e->getMessage());
}
?>
