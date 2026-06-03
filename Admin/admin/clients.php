<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireLogin();
requireAdmin();

$search = $_GET['search'] ?? '';
$date = $_GET['date'] ?? '';

$sql = "SELECT * FROM clients WHERE 1=1";
$params = [];

if ($search) {
    $sql .= " AND (name LIKE ? OR username LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($date) {
    $sql .= " AND DATE(created_at) = ?";
    $params[] = $date;
}

$sql .= " ORDER BY created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$clients = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clients - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Clients</h2>
            <a href="create_client.php" class="btn btn-primary" style="width: auto; padding: 10px 20px;">
                <i class="bi bi-plus-lg"></i>
            </a>
        </div>

        <form class="row g-2 mb-4">
            <div class="col-7">
                <input type="text" name="search" class="form-control" placeholder="Search name/user..." value="<?php echo htmlspecialchars($search); ?>">
            </div>
            <div class="col-5">
                <input type="date" name="date" class="form-control" value="<?php echo htmlspecialchars($date); ?>">
            </div>
            <div class="col-12">
                <button type="submit" class="btn btn-outline-dark w-100" style="border-radius: 12px;">Filter Results</button>
            </div>
        </form>

        <?php foreach ($clients as $client): ?>
            <a href="view_client.php?id=<?php echo $client['id']; ?>" class="text-decoration-none text-dark">
                <div class="card p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-1"><?php echo htmlspecialchars($client['name']); ?></h5>
                            <div class="text-label"><?php echo htmlspecialchars($client['username']); ?></div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <form action="delete_client.php" method="POST" onsubmit="return confirm('Are you sure? This will delete the client and all their data permanently.');">
                                <input type="hidden" name="client_id" value="<?php echo $client['id']; ?>">
                                <button type="submit" class="btn btn-sm btn-outline-danger border-0 p-1" title="Delete Client">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </form>
                            <i class="bi bi-chevron-right text-muted"></i>
                        </div>
                    </div>
                </div>
            </a>
        <?php endforeach; ?>

        <?php if (empty($clients)): ?>
            <p class="text-center text-muted mt-5">No clients found matching criteria.</p>
        <?php endif; ?>
    </div>

    <nav class="bottom-nav">
        <a href="dashboard.php" class="nav-item">
            <i class="bi bi-grid"></i>
            <span>Home</span>
        </a>
        <a href="clients.php" class="nav-item active">
            <i class="bi bi-people-fill"></i>
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
