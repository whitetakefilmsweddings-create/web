<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/google_drive.php';

try {
    $drive = new GoogleDrive();
    if (method_exists($drive, 'getFileContent')) {
        echo "PASS: getFileContent method exists.\n";
    } else {
        echo "FAIL: getFileContent method MISSING.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
