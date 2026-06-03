<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config/google_drive.php';

echo "<h1>Drive Auth Debugger</h1>";

$keyFile = __DIR__ . '/config/service_account.json';

if (!file_exists($keyFile)) {
    echo "<p style='color:red'><strong>CRITICAL ERROR:</strong> <code>config/service_account.json</code> NOT FOUND.</p>";
    echo "<p>Please create the service account in Google Cloud Console, download the JSON key, rename it, and upload it to the config folder.</p>";
    exit;
} else {
    echo "<p style='color:green'>Found <code>service_account.json</code>.</p>";
}

$creds = json_decode(file_get_contents($keyFile), true);
if (!$creds || !isset($creds['client_email'])) {
    echo "<p style='color:red'><strong>ERROR:</strong> JSON file is invalid or missing 'client_email'.</p>";
    exit;
}

echo "<p><strong>Service Account Email:</strong> <code>" . $creds['client_email'] . "</code></p>";
echo "<p>Make sure this email is added as an <strong>Editor</strong> to your Google Drive folder.</p>";

echo "<hr>";

try {
    echo "<h3>Attempting Authentication...</h3>";
    $drive = new GoogleDrive();
    
    // We can't easily check internal state, so let's try a write operation or a specific read that requires auth.
    // Actually, listing files with the Service Account will only show files SHARED with it.
    
    echo "<h3>Listing Files (viewable by Service Account)...</h3>";
    // We don't have a folder ID handy unless we hardcode one or fetch from DB. 
    // Let's just list *everything* the service account can see.
    // Logic in GoogleDrive::getFiles uses a specific folder ID query.
    // Let's try to instantiate and check if it throws.
    
    echo "<p>Auth seems plausible (no immediate crash). </p>";
    
    echo "<h3>Test: Create a Text File</h3>";
    // Let's try to create a file to prove write access? 
    // Wait, the class doesn't have create method yet.
    // Let's try to DELETE a non-existent file to see the error code.
    
    try {
        $drive->deleteFile('TEST_NON_EXISTENT_ID');
    } catch (Exception $e) {
        echo "<p><strong>Response from Delete Attempt:</strong> " . $e->getMessage() . "</p>";
        if (strpos($e->getMessage(), '404') !== false) {
             echo "<p style='color:green'><strong>SUCCESS:</strong> Got 404. This means Auth WORKED, but file was missing (expected).</p>";
        } elseif (strpos($e->getMessage(), '403') !== false) {
             echo "<p style='color:red'><strong>permission ERROR (403):</strong> Service Account authorized, but lacks permission. Did you share the folder?</p>";
        } elseif (strpos($e->getMessage(), '401') !== false) {
             echo "<p style='color:red'><strong>AUTH ERROR (401):</strong> Token invalid. System clock or Key issue.</p>";
        } else {
             echo "<p>Unknown response.</p>";
        }
    }

} catch (Exception $e) {
    echo "<p style='color:red'><strong>Fatal Error:</strong> " . $e->getMessage() . "</p>";
}
?>
