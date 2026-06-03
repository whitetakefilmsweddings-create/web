<?php
require_once '../config/db.php';

$email = 'admin@whitetake.com';
$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if admin exists
    $check = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
    $check->execute([$email]);
    
    if ($check->rowCount() > 0) {
        // Update existing
        $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = ?");
        $stmt->execute([$hash, $email]);
        echo "Password updated successfully for $email.<br>";
    } else {
        // Insert new
        $stmt = $pdo->prepare("INSERT INTO admins (email, password) VALUES (?, ?)");
        $stmt->execute([$email, $hash]);
        echo "Admin account created successfully for $email.<br>";
    }
    
    echo "New Password: <strong>$password</strong><br>";
    echo "<a href='login.php'>Go to Login</a>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
