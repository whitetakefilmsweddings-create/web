<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireLogin();
requireAdmin();

$invoices = $pdo->query("
    SELECT i.*, c.name as client_name 
    FROM invoices i 
    JOIN clients c ON i.client_id = c.id 
    ORDER BY i.created_at DESC
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoices - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Invoices</h2>
            <a href="create_invoice.php" class="btn btn-primary" style="width: auto; padding: 10px 20px;">
                <i class="bi bi-plus-lg"></i>
            </a>
        </div>

        <?php foreach ($invoices as $inv): ?>
            <div class="card p-3">
                <div class="d-flex justify-content-between">
                    <div>
                        <div class="text-label">To: <?php echo htmlspecialchars($inv['client_name']); ?></div>
                        <h5 class="mb-1"><?php echo htmlspecialchars($inv['title']); ?></h5>
                        <div class="text-muted small"><?php echo date('M d, Y', strtotime($inv['created_at'])); ?></div>
                    </div>
                    <div class="text-end">
                        <div class="d-flex flex-column align-items-end">
                            <a href="edit_invoice.php?id=<?php echo $inv['id']; ?>" class="btn btn-sm btn-outline-primary mb-2 py-0 px-1">
                                <i class="bi bi-pencil small"></i>
                            </a>
                            <div class="stat-value" style="font-size: 20px;">₹<?php echo number_format($inv['amount'], 2); ?></div>
                            <?php 
                            $badgeClass = match($inv['status']) {
                                'paid' => 'bg-success',
                                'unpaid' => 'bg-danger',
                                default => 'bg-warning text-dark'
                            };
                            ?>
                            <span class="badge <?php echo $badgeClass; ?>"><?php echo ucfirst($inv['status']); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>

        <?php if (empty($invoices)): ?>
            <p class="text-center text-muted mt-5">No invoices found.</p>
        <?php endif; ?>
    </div>

    <nav class="bottom-nav">
        <a href="dashboard.php" class="nav-item">
            <i class="bi bi-grid"></i>
            <span>Home</span>
        </a>
        <a href="clients.php" class="nav-item">
            <i class="bi bi-people"></i>
            <span>Clients</span>
        </a>
        <a href="invoices.php" class="nav-item active">
            <i class="bi bi-receipt-fill"></i>
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
