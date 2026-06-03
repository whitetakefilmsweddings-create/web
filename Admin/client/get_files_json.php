<?php
// client/get_files_json.php
require_once '../config/auth.php';
requireClient();

header('Content-Type: application/json');

if (!isset($_GET['folder_id'])) {
    echo json_encode(['error' => 'No folder ID']);
    exit;
}

$folderId = $_GET['folder_id'];
require_once '../config/google_drive.php';

try {
    $drive = new GoogleDrive();
    $files = $drive->getFiles($folderId);
    
    $cleanFiles = [];
    foreach ($files as $f) {
        if ($f->getMimeType() !== 'application/vnd.google-apps.folder') {
            $cleanFiles[] = [
                'id' => $f->getId(),
                'name' => $f->getName(),
                'mime' => $f->getMimeType()
            ];
        }
    }
    
    echo json_encode(['success' => true, 'files' => $cleanFiles]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
