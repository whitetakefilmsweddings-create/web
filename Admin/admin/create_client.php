<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once '../config/db.php';
require_once '../config/auth.php';
requireLogin();
requireAdmin();

$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $username = $_POST['username'];
    $password = $_POST['password'];
    $folder_id = $_POST['folder_id'] ?? null; // Allow null

    if ($name && $email && $username && $password) { // folder_id is optional
        // $hash = password_hash($password, PASSWORD_DEFAULT); 
        try {
            $stmt = $pdo->prepare("INSERT INTO clients (name, email, username, password, folder_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $email, $username, $password, $folder_id]);
            header("Location: clients.php");
            exit;
        } catch (Exception $e) {
            $msg = "Error: " . $e->getMessage();
        }
    } else {
        $msg = "Please fill all required fields";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Client - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container py-4">
        <a href="clients.php" class="text-decoration-none text-muted mb-3 d-block">
            <i class="bi bi-arrow-left me-2"></i>Back to Clients
        </a>
        
        <h2 class="mb-4">New Client</h2>
        
        <?php if ($msg): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($msg); ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="mb-3">
                <label class="form-label text-label">Full Name</label>
                <input type="text" name="name" class="form-control" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label text-label">Email</label>
                <input type="email" name="email" class="form-control" required>
            </div>

            <div class="mb-3">
                <label class="form-label text-label">Private Username</label>
                <input type="text" name="username" class="form-control" required>
            </div>

            <div class="mb-3">
                <label class="form-label text-label">Password</label>
                <input type="text" name="password" class="form-control" required value="<?php echo bin2hex(random_bytes(4)); ?>">
            </div>

            <div class="mb-3">
                <label class="form-label text-label">Google Drive Folder ID (Optional)</label>
                <input type="text" name="folder_id" class="form-control" placeholder="Paste the ID from the Google Drive URL">
            </div>

            <button type="submit" class="btn btn-primary">Create Client</button>
        </form>
    </div>
    <script src="../assets/js/app.js"></script>
</body>
</html>
