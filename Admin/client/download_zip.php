<?php
// client/download_zip.php
ini_set('max_execution_time', 300); // Allow 5 minutes
ini_set('memory_limit', '512M');

require_once '../config/db.php';
require_once '../config/auth.php';
require_once '../config/google_drive.php';
requireClient();

if (!isset($_GET['folder_id']) || !isset($_GET['folder_name'])) {
    die("Invalid request");
}

$folderId = $_GET['folder_id'];
$folderName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $_GET['folder_name']); // Sanitize
$zipName = "WhiteTake_" . $folderName . ".zip";

// Create temp zip
$zipPath = sys_get_temp_dir() . '/' . uniqid() . '.zip';
$zip = new ZipArchive();

if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    die("Cannot create zip");
}

$drive = new GoogleDrive();

try {
    // 1. Get all files in folder
    $files = $drive->getFiles($folderId);
    
    // 2. Add files to zip
    foreach ($files as $file) {
        if ($file->getMimeType() !== 'application/vnd.google-apps.folder') {
            $content = $drive->getFileContent($file->getId());
            if ($content) {
                $zip->addFromString($file->getName(), $content);
            }
        }
    }
    
    $zip->close();
    
    // 3. Stream ZIP
    if (file_exists($zipPath)) {
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zipName . '"');
        header('Content-Length: ' . filesize($zipPath));
        readfile($zipPath);
        unlink($zipPath); // Cleanup
        exit;
    } else {
        die("Error creating zip file.");
    }

} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>
