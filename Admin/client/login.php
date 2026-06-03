<?php
require_once '../config/db.php';
require_once '../config/auth.php';

if (isLoggedIn() && isset($_SESSION['role']) && $_SESSION['role'] === 'client') {
    header("Location: dashboard.php");
    exit;
}

$error = '';

// Handle Code Login (Magic Link)
if (isset($_GET['code'])) {
    $code = $_GET['code'];
    $stmt = $pdo->prepare("SELECT * FROM clients WHERE gallery_code = ?");
    $stmt->execute([$code]);
    $client = $stmt->fetch();

    if ($client) {
        $_SESSION['user_id'] = $client['id'];
        $_SESSION['role'] = 'client';
        $_SESSION['gallery_access_' . $client['id']] = true; // Auto-unlock gallery
        header("Location: gallery.php");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Code Login
    if (isset($_POST['access_code'])) {
        $code = $_POST['access_code'];
        $stmt = $pdo->prepare("SELECT * FROM clients WHERE gallery_code = ?");
        $stmt->execute([$code]);
        $client = $stmt->fetch();

        if ($client) {
            $_SESSION['user_id'] = $client['id'];
            $_SESSION['role'] = 'client';
            $_SESSION['gallery_access_' . $client['id']] = true;
            header("Location: gallery.php");
            exit;
        } else {
            $error = "Invalid Access Code";
        }
    } 
    // 2. Standard Login
    elseif (isset($_POST['username'])) {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM clients WHERE username = ?");
        $stmt->execute([$username]);
        $client = $stmt->fetch();

        if ($client && $password === $client['password']) {
            $_SESSION['user_id'] = $client['id'];
            $_SESSION['role'] = 'client';
            header("Location: dashboard.php");
            exit;
        } else {
            $error = "Invalid credentials";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Login - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container login-container">
        <div class="text-center mb-4">
            <img src="../assets/logo.png" alt="WhiteTake Films" style="max-height: 80px; width: auto;">
        </div>
        
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <div class="card p-3 mb-4 shadow-sm border-0">
            <h6 class="text-uppercase text-muted small fw-bold mb-3">Quick Gallery Access</h6>
            <form method="POST">
                <div class="input-group mb-2">
                    <input type="text" name="access_code" class="form-control" placeholder="Enter Gallery Code" required>
                    <button type="submit" class="btn btn-dark">View Photos</button>
                </div>
            </form>
        </div>

        <div class="position-relative mb-4">
            <hr>
            <span class="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">OR CLIENT LOGIN</span>
        </div>

        <form method="POST">
            <div class="mb-3">
                <label class="form-label text-label">Username</label>
                <input type="text" name="username" class="form-control" required>
            </div>
            <div class="mb-4">
                <label class="form-label text-label">Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-outline-primary w-100">Login to Dashboard</button>
        </form>
    </div>
</body>
</html>
