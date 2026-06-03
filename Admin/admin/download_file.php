<?php
// admin/download_file.php
ini_set('max_execution_time', 0);

require_once '../config/db.php';
require_once '../config/auth.php';
require_once '../config/google_drive.php';
requireAdmin();

$fileId = $_GET['file_id'] ?? null;
if (!$fileId) {
    die("File ID required");
}

try {
    $drive = new GoogleDrive();
    
    // 1. Get Metadata (Filename & Size if possible)
    $file = $drive->getFileMetadata($fileId);
    if (!$file) {
        die("File not found or access denied.");
    }
    
    // 2. Prepare Headers
    header('Content-Description: File Transfer');
    header('Content-Type: ' . $file->getMimeType());
    header('Content-Disposition: attachment; filename="' . $file->getName() . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    
    // 3. Stream Content
    $out = fopen('php://output', 'w');
    if ($out) {
        $drive->downloadFile($fileId, $out);
        fclose($out);
    } else {
        die("Could not open output stream.");
    }

} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>
