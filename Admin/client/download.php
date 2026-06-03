<?php
// client/download.php
require_once '../config/auth.php';
requireClient(); // Ensure logged in

if (!isset($_GET['id']) || !isset($_GET['name'])) {
    die("Invalid request");
}

$fileId = $_GET['id'];
$fileName = basename($_GET['name']); // Sanitize
$apiKey = 'AIzaSyAxoP_13cWEwsr0jzH4Tj51yWPe7f-SNEQ';

// Stream file to browser
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Transfer-Encoding: binary');

$url = "https://www.googleapis.com/drive/v3/files/$fileId?alt=media&key=" . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// Look ma, no CURLOPT_RETURNTRANSFER! This streams directly to output.
curl_exec($ch);
curl_close($ch);
exit;
?>
