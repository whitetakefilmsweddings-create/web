<?php
// upload.php - Handle Secure Image Upload and Dynamic 1080x1350 Resizing/Cropping
require_once 'auth.php';
// Restrict to logged-in admins
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$section_key = isset($_POST['section_key']) ? $_POST['section_key'] : '';
if (empty($section_key)) {
    echo json_encode(['success' => false, 'message' => 'Missing section key']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Upload failed or no file sent']);
    exit;
}

$file = $_FILES['image'];
$temp_path = $file['tmp_name'];

// Verify is image
$image_info = getimagesize($temp_path);
if ($image_info === false) {
    echo json_encode(['success' => false, 'message' => 'Uploaded file is not a valid image']);
    exit;
}

$mime = $image_info['mime'];
$source_w = $image_info[0];
$source_h = $image_info[1];

// Create image resource based on mime type
switch ($mime) {
    case 'image/jpeg':
    case 'image/jpg':
        $src_img = imagecreatefromjpeg($temp_path);
        break;
    case 'image/png':
        $src_img = imagecreatefrompng($temp_path);
        break;
    case 'image/webp':
        if (function_exists('imagecreatefromwebp')) {
            $src_img = imagecreatefromwebp($temp_path);
        } else {
            echo json_encode(['success' => false, 'message' => 'WEBP format not supported by PHP GD installation']);
            exit;
        }
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Unsupported image format (use JPEG, PNG or WEBP)']);
        exit;
}

if (!$src_img) {
    echo json_encode(['success' => false, 'message' => 'Failed to process image file']);
    exit;
}

// 1080 x 1350 targets
$target_w = 1080;
$target_h = 1350;
$target_ratio = $target_w / $target_h; // 0.8
$source_ratio = $source_w / $source_h;

// Calculate Crop Coordinates to maintain 1080x1350 Aspect Ratio without stretching
if ($source_ratio > $target_ratio) {
    // Source is wider than target
    $crop_w = (int)($source_h * $target_ratio);
    $crop_h = $source_h;
    $src_x = (int)(($source_w - $crop_w) / 2);
    $src_y = 0;
} else {
    // Source is taller than target
    $crop_w = $source_w;
    $crop_h = (int)($source_w / $target_ratio);
    $src_x = 0;
    $src_y = (int)(($source_h - $crop_h) / 2);
}

// Create destination true color image canvas
$dst_img = imagecreatetruecolor($target_w, $target_h);

// Handle transparency for PNG
if ($mime === 'image/png') {
    imagealphablending($dst_img, false);
    imagesavealpha($dst_img, true);
}

// Perform crop and resize
if (!imagecopyresampled($dst_img, $src_img, 0, 0, $src_x, $src_y, $target_w, $target_h, $crop_w, $crop_h)) {
    echo json_encode(['success' => false, 'message' => 'Resizing operations failed']);
    exit;
}

// Make sure uploads folder exists
$upload_dir = 'uploads';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Generate unique filename
$filename = 'img_' . $section_key . '_' . time() . '.jpg';
$save_path = $upload_dir . '/' . $filename;
$relative_db_path = 'pannl/' . $save_path;

// Save resized/cropped image as JPEG with 90 quality
if (!imagejpeg($dst_img, $save_path, 90)) {
    echo json_encode(['success' => false, 'message' => 'Failed to save final image file']);
    exit;
}

// Free memory resources
imagedestroy($src_img);
imagedestroy($dst_img);

// Update path in database
try {
    $stmt = $conn->prepare("UPDATE `section_images` SET `image_path` = ? WHERE `section_key` = ?");
    $stmt->execute([$relative_db_path, $section_key]);
    
    echo json_encode([
        'success' => true, 
        'path' => $relative_db_path
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database update error: ' . $e->getMessage()]);
}
?>
