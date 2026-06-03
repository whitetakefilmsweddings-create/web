<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireLogin();
requireAdmin();

// Fetch stats
$clientCount = $pdo->query("SELECT COUNT(*) FROM clients")->fetchColumn();
$invoiceCount = $pdo->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
$pendingRevenue = $pdo->query("SELECT SUM(amount) FROM invoices WHERE status = 'unpaid'")->fetchColumn() ?: 0;
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
        <h2 class="mb-4">Dashboard</h2>

        <div class="row g-3">
            <div class="col-6">
                <div class="card p-3 h-100">
                    <div class="text-label">Total Clients</div>
                    <div class="stat-value"><?php echo $clientCount; ?></div>
                </div>
            </div>
            <div class="col-6">
                <div class="card p-3 h-100">
                    <div class="text-label">Invoices</div>
                    <div class="stat-value"><?php echo $invoiceCount; ?></div>
                </div>
            </div>
            <div class="col-12">
                <div class="card p-3">
                    <div class="text-label">Pending Revenue</div>
                    <div class="stat-value">₹<?php echo number_format($pendingRevenue, 2); ?></div>
                </div>
            </div>
            <div class="col-12">
                <a href="create_client.php" class="btn btn-primary">
                    <i class="bi bi-person-plus me-2"></i>New Client
                </a>
            </div>
        </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
        <a href="dashboard.php" class="nav-item active">
            <i class="bi bi-grid-fill"></i>
            <span>Home</span>
        </a>
        <a href="clients.php" class="nav-item">
            <i class="bi bi-people"></i>
            <span>Clients</span>
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
