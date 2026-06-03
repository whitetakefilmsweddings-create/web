<?php
// api.php - Public API to Fetch Image Mappings for the Frontend
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow CORS in case it is queried from preview environments

$page = isset($_GET['page']) ? $_GET['page'] : '';

try {
    if (!empty($page)) {
        $stmt = $conn->prepare("SELECT `section_key`, `image_path` FROM `section_images` WHERE `page_name` = ?");
        $stmt->execute([$page]);
    } else {
        $stmt = $conn->prepare("SELECT `section_key`, `image_path` FROM `section_images`");
        $stmt->execute();
    }
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Structure response as simple key -> path map
    $images = [];
    foreach ($results as $row) {
        $images[$row['section_key']] = $row['image_path'];
    }
    
    echo json_encode([
        'success' => true,
        'page' => $page,
        'images' => $images
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
