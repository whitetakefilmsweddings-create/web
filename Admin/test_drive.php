<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config/google_drive.php';

echo "<h1>Google Drive API Test</h1>";

// 1. Setup
$drive = new GoogleDrive();
$folderId = '13fHHVm4BYF2ggueAhANj7GHa4INThUuM'; // The ID we saw earlier

echo "<h3>Target Folder: $folderId</h3>";

try {
    // 2. Test specific folder
    echo "<h4>Attempting to list files in folder...</h4>";
    $optParams = array(
        'pageSize' => 5,
        'fields' => 'files(id, name, mimeType)',
        'q' => "'$folderId' in parents"
    );
    
    // We need to access the private service object, but we can't.
    // Let's rely on the class method but modify it temporarily OR just use the class if we can.
    // Since GoogleDrive class hides $service, checking if I can use reflection or just instantiate raw client here.
    
    $client = new Google_Client();
    $client->setDeveloperKey('AIzaSyAxoP_13cWEwsr0jzH4Tj51yWPe7f-SNEQ');
    $service = new Google_Service_Drive($client);
    
    $results = $service->files->listFiles($optParams);
    $files = $results->getFiles();

    echo "<strong>Count: " . count($files) . "</strong><br>";
    if (count($files) == 0) {
        echo "<span style='color:red'>Result is empty. This usually means the API Key cannot see the folder (Permission denied).</span><br>";
        echo "Please ensure the folder on Google Drive is set to <strong>'Anyone with the link'</strong>.";
    } else {
        echo "<ul>";
        foreach ($files as $file) {
            echo "<li>Found: " . $file->getName() . " (" . $file->getMimeType() . ")</li>";
        }
        echo "</ul>";
    }

} catch (Exception $e) {
    echo "<strong style='color:red'>API Error: " . $e->getMessage() . "</strong>";
}
?>
