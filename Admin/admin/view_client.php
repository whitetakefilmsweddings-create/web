<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
requireLogin();
requireAdmin();

$id = $_GET['id'] ?? 0;
// Fetch Client
$stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
$stmt->execute([$id]);
$client = $stmt->fetch();

if (!$client) {
    die("Client not found");
}

// Handle Updates
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_profile'])) {
        $name = $_POST['name'];
        $email = $_POST['email'];
        $username = $_POST['username'];
        $password = $_POST['password'];

        $sql = "UPDATE clients SET name = ?, email = ?, username = ?, password = ? WHERE id = ?";
        $pdo->prepare($sql)->execute([$name, $email, $username, $password, $id]);
        $msg = "Profile updated!";
        // Refresh
        $stmt->execute([$id]);
        $client = $stmt->fetch();
    }

    if (isset($_POST['update_gallery'])) {
        $folder_id = $_POST['folder_id'];
        $gallery_code = $_POST['gallery_code'];

        $sql = "UPDATE clients SET folder_id = ?, gallery_code = ? WHERE id = ?";
        $pdo->prepare($sql)->execute([$folder_id, $gallery_code, $id]);
        $msg = "Gallery settings updated!";
        // Refresh
        $stmt->execute([$id]);
        $client = $stmt->fetch();
    }

    if (isset($_POST['update_face_ai'])) {
        $ai_folder_id = $_POST['ai_folder_id'];
        
        $sql = "UPDATE clients SET ai_folder_id = ? WHERE id = ?";
        $pdo->prepare($sql)->execute([$ai_folder_id, $id]);
        $msg = "Face AI settings updated!";
        // Refresh
        $stmt->execute([$id]);
        $client = $stmt->fetch();
    }
    
    if (isset($_POST['add_appointment'])) {
        $date = $_POST['app_date'];
        $time = $_POST['app_time'];
        $fullDate = $date . ' ' . $time;
        $pdo->prepare("INSERT INTO appointments (client_id, appointment_date) VALUES (?, ?)")->execute([$id, $fullDate]);
        $msg = "Appointment added!";
    }

    if (isset($_POST['create_invoice'])) {
        $title = $_POST['inv_title'];
        $status = 'unpaid';
        $items = $_POST['items'] ?? []; 

        if ($title && count($items) > 0) {
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalAmount += floatval($item['price']) * intval($item['qty']);
            }

            try {
                $pdo->beginTransaction();
                
                // Insert Invoice
                $stmt = $pdo->prepare("INSERT INTO invoices (client_id, title, amount, status) VALUES (?, ?, ?, ?)");
                $stmt->execute([$id, $title, $totalAmount, $status]);
                $invoice_id = $pdo->lastInsertId();

                // Insert Items
                $stmtItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)");
                foreach ($items as $item) {
                    $itemTotal = floatval($item['price']) * intval($item['qty']);
                    $stmtItem->execute([
                        $invoice_id,
                        $item['desc'],
                        $item['qty'],
                        $item['price'],
                        $itemTotal
                    ]);
                }
                
                $pdo->commit();
                $msg = "Invoice created!";
            } catch(PDOException $e) {
                $pdo->rollBack();
                $msg = "Error: " . $e->getMessage();
            }
        } else {
             $msg = "Please add at least one item.";
        }
    }

    if (isset($_POST['delete_invoice'])) {
        $inv_id = $_POST['invoice_id'];
        $pdo->prepare("DELETE FROM invoices WHERE id = ?")->execute([$inv_id]);
        $msg = "Invoice deleted!";
    }
}

// Fetch Related Data
$invoices = $pdo->prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC");
$invoices->execute([$id]);
$invoices = $invoices->fetchAll();

$appointments = $pdo->prepare("SELECT * FROM appointments WHERE client_id = ? ORDER BY appointment_date ASC");
$appointments->execute([$id]);
$appointments = $appointments->fetchAll();

// Stats
$totalInv = count($invoices);
$totalApp = count($appointments);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Client - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container py-4">
        <a href="clients.php" class="text-decoration-none text-muted mb-3 d-block">
            <i class="bi bi-arrow-left me-2"></i>Back to Clients
        </a>

        <h2 class="mb-4"><?php echo htmlspecialchars($client['name']); ?></h2>
        
        <?php if ($msg): ?>
            <div class="alert alert-success"><?php echo $msg; ?></div>
        <?php endif; ?>

        <!-- Stats Row -->
        <div class="row g-3 mb-4">
            <div class="col-6">
                <div class="card p-3 text-center">
                    <h3 class="mb-0"><?php echo $totalApp; ?></h3>
                    <small class="text-muted">Appointments</small>
                </div>
            </div>
            <div class="col-6">
                <div class="card p-3 text-center">
                    <h3 class="mb-0"><?php echo $totalInv; ?></h3>
                    <small class="text-muted">Invoices</small>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-pills mb-3 nav-fill" id="pills-tab" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#details">Details</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#gallery">Gallery</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#appointments">Appts</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#invoices">Invoices</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#faceai">Face AI</button>
            </li>
        </ul>

        <div class="tab-content">
            
            <!-- Client Details & Credentials -->
            <div class="tab-pane fade show active" id="details">
                <div class="card p-3">
                    <h5 class="mb-3">Credentials & Info</h5>
                    <form method="POST">
                        <input type="hidden" name="update_profile" value="1">
                        <div class="mb-3">
                            <label class="text-label">Name</label>
                            <input type="text" name="name" class="form-control" value="<?php echo htmlspecialchars($client['name']); ?>">
                        </div>
                        <div class="mb-3">
                            <label class="text-label">Email</label>
                            <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($client['email']); ?>">
                        </div>
                        <div class="mb-3">
                            <label class="text-label">Username</label>
                            <input type="text" name="username" class="form-control" value="<?php echo htmlspecialchars($client['username']); ?>">
                        </div>
                        <div class="mb-3">
                            <label class="text-label">Password (Plain)</label>
                            <input type="text" name="password" class="form-control" value="<?php echo htmlspecialchars($client['password']); ?>">
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <button type="submit" class="btn btn-primary">Update Profile</button>
                    </form>
                    <form action="delete_client.php" method="POST" onsubmit="return confirm('CRITICAL WARNING: This will permanently delete this client AND ALL associated invoices and data. This action cannot be undone. Are you sure?');">
                        <input type="hidden" name="client_id" value="<?php echo $client['id']; ?>">
                        <button type="submit" class="btn btn-danger">Delete Client</button>
                    </form>
                    </div>
                </div>
            </div>

            <!-- Gallery Settings -->
            <div class="tab-pane fade" id="gallery">
                <div class="card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="mb-0">Gallery Configuration</h5>
                        <div class="d-flex gap-2">
                             <a href="cleanup_drive.php?client_id=<?php echo $id; ?>&type=gallery" class="btn btn-outline-danger">
                                <i class="bi bi-trash"></i> Cleanup Drive
                            </a>
                            <a href="client_selection.php?id=<?php echo $id; ?>" class="btn btn-outline-primary">
                                <i class="bi bi-grid-3x3"></i> View Selections
                            </a>
                        </div>
                    </div>
                    
                    <form method="POST">
                        <input type="hidden" name="update_gallery" value="1">
                        
                        <!-- Drive Link Input with Auto-Parse -->
                        <div class="mb-4">
                            <label class="text-label">Google Drive Folder Link</label>
                            <input type="text" name="folder_id" id="driveLink" class="form-control" 
                                   value="<?php echo htmlspecialchars($client['folder_id']); ?>" 
                                   placeholder="Paste full Google Drive URL here..."
                                   oninput="parseDriveLink(this)">
                            <small class="text-muted d-block mt-1">Paste the full URL, we'll extract the ID automatically.</small>
                            <?php if($client['folder_id']): ?>
                                <small class="d-block mt-1"><a href="https://drive.google.com/drive/folders/<?php echo htmlspecialchars($client['folder_id']); ?>" target="_blank">Test Link</a></small>
                            <?php endif; ?>
                        </div>

                        <!-- Access Code Section -->
                        <div class="mb-4 p-3 bg-light rounded">
                            <label class="text-label mb-2">Gallery Access Code</label>
                            <div class="input-group mb-3">
                                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                                <input type="text" name="gallery_code" id="galleryCode" class="form-control" placeholder="Enter or Generate Code" value="<?php echo htmlspecialchars($client['gallery_code'] ?? ''); ?>">
                                <button class="btn btn-outline-secondary" type="button" onclick="generateCode()">Generate</button>
                            </div>
                            <small class="text-muted">Required for client execution.</small>
                        </div>

                        <button type="submit" class="btn btn-primary px-4 mb-4">Save Gallery Settings</button>

                        <hr>

                        <!-- Share Buttons -->
                         <label class="text-label mb-2 d-block">Share with Client</label>
                        <?php 
                            $galleryUrl = "http://" . $_SERVER['HTTP_HOST'] . "/client/login.php?code=" . ($client['gallery_code'] ?? ''); 
                            $shareText = urlencode("Hello " . $client['name'] . ",\n\nHere is the direct link to your photo gallery:\n" . $galleryUrl . "\n\n(Access Code: " . ($client['gallery_code'] ?? 'PENDING') . ")");
                        ?>
                        <div class="d-flex gap-2">
                            <a href="https://wa.me/?text=<?php echo $shareText; ?>" target="_blank" class="btn btn-success flex-grow-1">
                                <i class="bi bi-whatsapp me-2"></i>WhatsApp
                            </a>
                            <a href="mailto:<?php echo $client['email']; ?>?subject=Your Photo Gallery&body=<?php echo $shareText; ?>" class="btn btn-outline-secondary flex-grow-1">
                                <i class="bi bi-envelope me-2"></i>Email
                            </a>
                        </div>
                    </form>
                </div>

                </div>
            </div>
            </div>

            <script>
                function generateCode() {
                    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                    document.getElementById('galleryCode').value = code;
                }

                function parseDriveLink(input) {
                    const val = input.value;
                    // Regex to find ID between 'folders/' and '?' or end of string
                    const match = val.match(/folders\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        input.value = match[1]; // Auto-replace URL with ID
                    }
                }
            </script>

            <!-- Appointments -->
            <div class="tab-pane fade" id="appointments">
                <div class="card p-3 mb-3">
                    <h5 class="mb-3">Add Appointment</h5>
                    <form method="POST">
                        <input type="hidden" name="add_appointment" value="1">
                        <div class="row g-2">
                            <div class="col-7">
                                <input type="date" name="app_date" class="form-control" required>
                            </div>
                            <div class="col-5">
                                <input type="time" name="app_time" class="form-control" required>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-outline-dark w-100">Add</button>
                            </div>
                        </div>
                    </form>
                </div>

                <?php foreach ($appointments as $app): ?>
                    <div class="card p-3 mb-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0"><?php echo date('M d, Y', strtotime($app['appointment_date'])); ?></h6>
                                <small class="text-muted"><?php echo date('h:i A', strtotime($app['appointment_date'])); ?></small>
                            </div>
                            <span class="badge bg-info text-dark"><?php echo $app['status']; ?></span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Invoices -->
            <div class="tab-pane fade" id="invoices">
                <div class="d-grid mb-3">
                    <a href="create_invoice.php?client_id=<?php echo $id; ?>" class="btn btn-outline-dark">
                        <i class="bi bi-plus-circle me-2"></i>Create New Invoice
                    </a>
                </div>

                <?php foreach ($invoices as $inv): ?>
                    <div class="card p-3 mb-2">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6><?php echo htmlspecialchars($inv['title']); ?></h6>
                                <small class="text-muted"><?php echo date('m/d/y', strtotime($inv['created_at'])); ?></small>
                            </div>
                            <div class="text-end">
                                <div>₹<?php echo $inv['amount']; ?></div>
                                <span class="badge bg-secondary"><?php echo $inv['status']; ?></span>
                                <div class="mt-2 d-flex gap-1 justify-content-end">
                                    <a href="../client/invoice_view.php?id=<?php echo $inv['id']; ?>" target="_blank" class="btn btn-sm btn-outline-primary" style="padding: 2px 8px;" title="View Invoice">
                                        <i class="bi bi-eye"></i>
                                    </a>
                                    <a href="edit_invoice.php?id=<?php echo $inv['id']; ?>" class="btn btn-sm btn-outline-secondary" style="padding: 2px 8px;" title="Edit Invoice">
                                        <i class="bi bi-pencil"></i>
                                    </a>
                                    <form method="POST" onsubmit="return confirm('Are you sure you want to delete this invoice?');" style="display:inline;">
                                        <input type="hidden" name="delete_invoice" value="1">
                                        <input type="hidden" name="invoice_id" value="<?php echo $inv['id']; ?>">
                                        <button type="submit" class="btn btn-sm btn-outline-danger" style="padding: 2px 8px;" title="Delete Invoice">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let itemIndex = 1;

        function addItem() {
            const html = `
                <tr>
                    <td><input type="text" name="items[${itemIndex}][desc]" class="form-control form-control-sm" required></td>
                    <td><input type="number" step="0.01" name="items[${itemIndex}][price]" class="form-control form-control-sm price-input" required oninput="calcRow(this)"></td>
                    <td><input type="number" name="items[${itemIndex}][qty]" class="form-control form-control-sm qty-input" value="1" required oninput="calcRow(this)"></td>
                    <td><input type="text" class="form-control form-control-sm row-total" readonly value="0.00"></td>
                    <td>
                        <button type="button" class="btn btn-danger btn-sm p-0 px-1" onclick="this.closest('tr').remove(); calcTotal();">&times;</button>
                    </td>
                </tr>
            `;
            document.getElementById('itemsList').insertAdjacentHTML('beforeend', html);
            itemIndex++;
        }

        function calcRow(input) {
            const row = input.closest('tr');
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
            const total = price * qty;
            row.querySelector('.row-total').value = total.toFixed(2);
            calcTotal();
        }

        function calcTotal() {
            let total = 0;
            document.querySelectorAll('.row-total').forEach(input => {
                total += parseFloat(input.value) || 0;
            });
            document.getElementById('grandTotal').textContent = total.toFixed(2);
        }
    </script>
</body>
</html>

            <!-- Face AI Tab -->
            <div class="tab-pane fade" id="faceai">
                <div class="card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="mb-0"><i class="bi bi-camera-fill me-2"></i>Event Photo Download (FaceFind)</h5>
                        <a href="cleanup_drive.php?client_id=<?php echo $id; ?>&type=face_ai" class="btn btn-outline-danger btn-sm">
                            <i class="bi bi-trash"></i> Cleanup Drive
                        </a>
                    </div>

                    <form method="POST" class="mb-4">
                        <input type="hidden" name="update_face_ai" value="1">
                        
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            This feature allows guests to find their photos using AI Face Recognition.
                            Set a separate Google Drive folder for these event photos if needed.
                        </div>

                        <!-- AI Folder Input -->
                        <div class="mb-4">
                            <label class="text-label">Face AI Google Drive Folder Link</label>
                            <input type="text" name="ai_folder_id" id="aiDriveLink" class="form-control" 
                                   value="<?php echo htmlspecialchars($client['ai_folder_id'] ?? ''); ?>" 
                                   placeholder="Paste Google Drive URL for Event Photos..."
                                   oninput="parseDriveLink(this)">
                            <small class="text-muted d-block mt-1">Paste the full URL, we'll extract the ID automatically.</small>
                            <?php if(!empty($client['ai_folder_id'])): ?>
                                <small class="d-block mt-1"><a href="https://drive.google.com/drive/folders/<?php echo htmlspecialchars($client['ai_folder_id']); ?>" target="_blank">Test Link</a></small>
                            <?php endif; ?>
                        </div>

                        <button type="submit" class="btn btn-primary px-4">Save Face AI Settings</button>
                    </form>

                    <hr>

                    <?php 
                        // Logic to link to the face app using ai_folder_id
                        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                        $host = $_SERVER['HTTP_HOST'];
                        $basePath = dirname(dirname($_SERVER['PHP_SELF']));
                        $basePath = rtrim($basePath, '/\\');
                        
                        $faceAppUrl = $protocol . "://" . $host . $basePath . "/face/index.html";
                        if (!empty($client['ai_folder_id'])) {
                            $faceAppUrl .= "?folder_id=" . $client['ai_folder_id'];
                        }
                        
                        $shareTextFace = urlencode("Find your photos from the event using Face AI:\n" . $faceAppUrl);
                    ?>

                    <div class="mb-3">
                        <label class="text-label">Direct Link for Guests</label>
                        <div class="input-group">
                            <input type="text" class="form-control" value="<?php echo htmlspecialchars($faceAppUrl); ?>" readonly id="faceLink">
                            <button class="btn btn-outline-secondary" type="button" onclick="navigator.clipboard.writeText(document.getElementById('faceLink').value)">
                                <i class="bi bi-clipboard"></i> Copy
                            </button>
                            <a href="<?php echo htmlspecialchars($faceAppUrl); ?>" target="_blank" class="btn btn-outline-primary">
                                <i class="bi bi-box-arrow-up-right"></i> Open
                            </a>
                        </div>
                    </div>

                    <div class="d-flex gap-2">
                        <a href="https://wa.me/?text=<?php echo $shareTextFace; ?>" target="_blank" class="btn btn-success flex-grow-1">
                            <i class="bi bi-whatsapp me-2"></i>Share on WhatsApp
                        </a>
                        <button type="button" class="btn btn-outline-dark flex-grow-1" onclick="toggleQr()">
                            <i class="bi bi-qr-code me-2"></i>Show QR Code
                        </button>
                    </div>

                    <div id="qr-container" class="text-center mt-3 d-none">
                        <img id="qr-image" src="" alt="QR Code" class="img-fluid border rounded p-2">
                    </div>

                    <script>
                        function toggleQr() {
                            const container = document.getElementById('qr-container');
                            const img = document.getElementById('qr-image');
                            const url = document.getElementById('faceLink').value;
                            
                            if (container.classList.contains('d-none')) {
                                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
                                container.classList.remove('d-none');
                            } else {
                                container.classList.add('d-none');
                            }
                        }
                    </script>
                </div>
            </div>
</html>
