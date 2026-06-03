<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireClient();

$userId = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
$stmt->execute([$userId]);
$client = $stmt->fetch();

// Stats
$invCount = $pdo->prepare("SELECT COUNT(*) FROM invoices WHERE client_id = ? AND status = 'unpaid'");
$invCount->execute([$userId]);
$unpaidCount = $invCount->fetchColumn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container py-4">
        <h2 class="mb-4">Welcome, <?php echo htmlspecialchars($client['name']); ?></h2>

        <div class="row g-3">
            <div class="col-12">
                <a href="gallery.php" class="text-decoration-none">
                    <div class="card p-4 text-center">
                        <i class="bi bi-images mb-3" style="font-size: 3rem; color: var(--primary-color);"></i>
                        <h4>View Gallery</h4>
                        <p class="text-muted">Access your complete photo collection</p>
                    </div>
                </a>
            </div>
            <div class="col-12">
                <a href="invoices.php" class="text-decoration-none">
                    <div class="card p-3 d-flex flex-row justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-receipt me-3" style="font-size: 1.5rem;"></i>
                            <div>
                                <h5 class="mb-0">Invoices</h5>
                                <?php if ($unpaidCount > 0): ?>
                                    <small class="text-danger"><?php echo $unpaidCount; ?> Unpaid</small>
                                <?php else: ?>
                                    <small class="text-muted">All paid</small>
                                <?php endif; ?>
                            </div>
                        </div>
                        <i class="bi bi-chevron-right text-muted"></i>
                    </div>
                </a>
            </div>
        </div>
    </div>

    <nav class="bottom-nav">
        <a href="dashboard.php" class="nav-item active">
            <i class="bi bi-grid-fill"></i>
            <span>Home</span>
        </a>
        <a href="gallery.php" class="nav-item">
            <i class="bi bi-images"></i>
            <span>Gallery</span>
        </a>
        <a href="invoices.php" class="nav-item">
            <i class="bi bi-receipt"></i>
            <span>Invoices</span>
        </a>
        <a href="logout.php" class="nav-item">
            <i class="bi bi-box-arrow-right"></i>
            <span>Logout</span>
        </a>
    </nav>
    <script src="../assets/js/app.js"></script>
</body>
</html>
