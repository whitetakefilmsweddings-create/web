<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireClient();

$userId = $_SESSION['user_id'];
$invoices = $pdo->prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC");
$invoices->execute([$userId]);
$invoices = $invoices->fetchAll();
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
        <h2 class="mb-4">My Invoices</h2>

        <?php foreach ($invoices as $inv): ?>
            <div class="card p-3">
                <div class="d-flex justify-content-between">
                    <div>
                        <h5 class="mb-1"><?php echo htmlspecialchars($inv['title']); ?></h5>
                        <div class="text-muted small"><?php echo date('M d, Y', strtotime($inv['created_at'])); ?></div>
                        
                            <a href="invoice_view.php?id=<?php echo $inv['id']; ?>" class="btn btn-sm btn-outline-dark mt-2" style="width: auto; padding: 5px 10px;">
                                <i class="bi bi-eye me-1"></i>View Invoice
                            </a>
                    </div>
                    <div class="text-end">
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
        <a href="gallery.php" class="nav-item">
            <i class="bi bi-images"></i>
            <span>Gallery</span>
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
