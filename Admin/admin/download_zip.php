<?php
// admin/download_zip.php
ini_set('max_execution_time', 0); // No time limit
ini_set('memory_limit', '1024M'); // Keep high just in case

require_once '../config/db.php';
require_once '../config/auth.php';
require_once '../config/google_drive.php';
requireAdmin();

$clientId = $_GET['client_id'] ?? null;
if (!$clientId) {
    die("Client ID required");
}

// Fetch Client Info
$stmt = $pdo->prepare("SELECT name FROM clients WHERE id = ?");
$stmt->execute([$clientId]);
$clientName = $stmt->fetchColumn();

if (!$clientName) {
    die("Client not found");
}

$zipName = "WhiteTake_Selections_" . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $clientName) . ".zip";

// Fetch Selections
$stmt = $pdo->prepare("SELECT file_id FROM client_selections WHERE client_id = ?");
$stmt->execute([$clientId]);
$selections = $stmt->fetchAll(PDO::FETCH_COLUMN);

$totalFiles = count($selections);

// Range / Batch Logic
$start = isset($_GET['start']) ? (int)$_GET['start'] : 1;
$end = isset($_GET['end']) ? (int)$_GET['end'] : $totalFiles;

// Validation
if ($start < 1) $start = 1;
if ($end > $totalFiles) $end = $totalFiles;
if ($start > $end) {
    die("Invalid range: Start cannot be greater than End.");
}

$offset = $start - 1;
$length = $end - $start + 1;

$batchSelections = array_slice($selections, $offset, $length);

if (empty($batchSelections)) {
    die("No files found in this range.");
}

$rangeStr = ($start === 1 && $end === $totalFiles) ? "" : "_Target_{$start}-{$end}";
$zipName = "WhiteTake_Selections_" . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $clientName) . $rangeStr . ".zip";

// Create temp zip
$tmpDir = sys_get_temp_dir();
$zipParams = uniqid();
$zipPath = $tmpDir . '/' . $zipParams . '.zip';
$downloadDir = $tmpDir . '/' . $zipParams . '_files';

if (!mkdir($downloadDir) && !is_dir($downloadDir)) {
    die("Failed to create temp directory");
}

$zip = new ZipArchive();

if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    die("Cannot create zip");
}

$drive = new GoogleDrive();

try {
    foreach ($batchSelections as $fileId) {
        // Fetch metadata for name
        $file = $drive->getFileMetadata($fileId);
        
        if ($file) {
            $localPath = $downloadDir . '/' . $file->getId();
            $handle = fopen($localPath, 'w+');
            
            if ($handle) {
                if ($drive->downloadFile($fileId, $handle)) {
                    fclose($handle);
                    $zip->addFile($localPath, $file->getName());
                } else {
                    fclose($handle);
                    @unlink($localPath);
                }
            }
        }
    }
    
    $zip->close();
    
    // Cleanup Downloaded Files
    $files = glob($downloadDir . '/*');
    foreach ($files as $file) {
        if (is_file($file)) unlink($file);
    }
    rmdir($downloadDir);
    
    // Stream ZIP
    if (file_exists($zipPath)) {
        // Disable output buffering
        if (ob_get_level()) ob_end_clean();
        
        header('Content-Description: File Transfer');
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zipName . '"');
        header('Content-Length: ' . filesize($zipPath));
        header('Pragma: public');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        
        readfile($zipPath);
        unlink($zipPath); // Cleanup Zip
        exit;
    } else {
        die("Error creating zip file.");
    }

} catch (Exception $e) {
    // Cleanup on error
    if (is_dir($downloadDir)) {
        $files = glob($downloadDir . '/*');
        foreach ($files as $file) {
             if (is_file($file)) unlink($file);
        }
        rmdir($downloadDir);
    }
    if (file_exists($zipPath)) unlink($zipPath);
    
    die("Error: " . $e->getMessage());
}
?>
