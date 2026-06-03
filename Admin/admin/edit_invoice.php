<?php
require_once '../config/db.php';
require_once '../config/auth.php';
requireLogin();
requireAdmin();

$invoice_id = $_GET['id'] ?? null;
if (!$invoice_id) {
    header("Location: invoices.php");
    exit;
}

// Fetch invoice details
$stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
$stmt->execute([$invoice_id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    header("Location: invoices.php");
    exit;
}

// Fetch invoice items
$stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
$stmt->execute([$invoice_id]);
$items_existing = $stmt->fetchAll();

// Fetch clients with details
$clients = $pdo->query("SELECT * FROM clients ORDER BY name ASC")->fetchAll();
$clientsJson = json_encode($clients);
$itemsJson = json_encode($items_existing);

$msg = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $client_id = $_POST['client_id'];
    $title = $_POST['title'];
    $status = $_POST['status'];
    $items = $_POST['items'] ?? []; 

    $totalAmount = 0;
    foreach ($items as $item) {
        $totalAmount += floatval($item['price']) * intval($item['qty']);
    }

    if ($client_id && $title && count($items) > 0) {
        try {
            $pdo->beginTransaction();

            // Update invoice
            $stmt = $pdo->prepare("UPDATE invoices SET client_id = ?, title = ?, amount = ?, status = ? WHERE id = ?");
            $stmt->execute([$client_id, $title, $totalAmount, $status, $invoice_id]);

            // Delete existing items and re-insert
            $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?")->execute([$invoice_id]);

            $stmtItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)");
            foreach ($items as $item) {
                $price = !empty($item['price']) ? floatval($item['price']) : 0;
                $qty = !empty($item['qty']) ? intval($item['qty']) : 1;
                $itemTotal = $price * $qty;
                
                $stmtItem->execute([
                    $invoice_id,
                    $item['desc'],
                    $qty,
                    $price,
                    $itemTotal
                ]);
            }

            $pdo->commit();
            header("Location: invoices.php");
            exit;
        } catch (PDOException $e) {
            $pdo->rollBack();
            $msg = "Error: " . $e->getMessage();
        }
    } else {
        $msg = "Please fill all fields and add at least one item.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Invoice - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../template/style.css" rel="stylesheet"> 
    <style>
        body { background: #f0f2f5; }
        
        /* Desktop Split View */
        @media (min-width: 769px) {
            body { height: 100vh; overflow: hidden; }
            .preview-pane {
                background: #cdcdcd;
                padding: 20px;
                overflow-y: auto;
                border-bottom: 2px solid #ddd;
                height: 60vh;
            }
            .editor-pane {
                background: #fff;
                padding: 20px;
                height: 40vh;
                overflow-y: auto;
                box-shadow: 0 -5px 15px rgba(0,0,0,0.05);
            }
            .invoice-paper {
                transform: scale(0.9);
                transform-origin: top center;
            }
        }

        /* Mobile Stacked View */
        @media (max-width: 768px) {
            body { height: auto; overflow-y: auto; }
            .preview-pane {
                background: #cdcdcd;
                padding: 15px 0;
                border-bottom: 1px solid #ddd;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                min-height: 400px;
            }
            .editor-pane {
                background: #fff;
                padding: 15px;
                height: auto;
                padding-bottom: 80px;
            }
            .invoice-paper {
                transform-origin: top center;
                margin: 0;
            }
            
            .editor-pane .btn-primary, 
            .editor-pane .btn-secondary {
                width: 100%;
                display: block;
                margin-bottom: 10px;
                color: #000 !important;
                background-color: #fff;
                border-color: #ccc;
            }
            .editor-pane .btn-primary:hover,
            .editor-pane .btn-secondary:hover {
                background-color: #eee;
            }

            .editor-pane .d-flex.justify-content-between {
                display: block !important;
            }
            .editor-pane .fw-bold.fs-5 {
                text-align: center;
                margin-top: 10px;
                display: block;
            }

            .btn-sm {
                padding: 8px 12px;
                font-size: 1rem;
            }

            .editor-pane .btn-outline-secondary.position-absolute {
                position: static !important;
                margin: 0 0 15px 0 !important;
                width: auto;
                display: inline-block;
            }
        }

        .invoice-paper {
            background: white;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            width: 800px;
            min-height: 1000px;
            flex-shrink: 0;
            margin-left: auto;
            margin-right: auto;
        }
        
        .text-main { color: #000; }
        .bg-main { background-color: #000; }
        thead { border-bottom: 2px solid #000 !important; }
        
        .table-responsive {
            -webkit-overflow-scrolling: touch;
        }
    </style>
</head>
<body class="d-flex flex-column">

    <!-- LIVE PREVIEW SECTION (TOP) -->
    <div class="preview-pane" id="previewContainer">
        <div class="d-none d-md-block text-center mb-2 text-muted fw-bold">LIVE PREVIEW</div>
        
        <div class="invoice-paper" id="invoicePreview">
            <div class="py-4">
                <div class="px-5 py-4">
                    <!-- Header -->
                    <table class="w-100 border-0">
                        <tr>
                            <td class="align-top" style="width: 50%;">
                                <img src="../assets/logo.png?v=<?php echo time(); ?>" style="height: 90px; object-fit: contain;">
                            </td>
                            <td class="align-top text-end">
                                <div style="font-size: 0.875rem;">
                                    <table class="ms-auto">
                                        <tr>
                                            <td class="pe-3 text-muted text-end">Date</td>
                                            <td class="fw-bold text-main text-end"><?php echo date('F d, Y', strtotime($invoice['created_at'])); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="pe-3 text-muted text-end">Invoice #</td>
                                            <td class="fw-bold text-main text-end">INV-<?php echo str_pad($invoice['id'], 4, '0', STR_PAD_LEFT); ?></td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- From / To -->
                <div class="bg-light px-5 py-4" style="font-size: 0.875rem;">
                    <table class="w-100">
                        <tr>
                            <td class="align-top" style="width: 50%;">
                                <div class="text-secondary">
                                    <p class="fw-bold mb-0">WhiteTake Films</p>
                                    <p class="mb-0">Film & Photography Services</p>
                                    <p class="mb-0">contact@whitetake.com</p>
                                    <p class="mb-0">Kerala, India</p>
                                </div>
                            </td>
                            <td class="align-top text-end" style="width: 50%;">
                                <div class="text-secondary" id="previewClient">
                                    <p class="fw-bold mb-0">Select a Client</p>
                                    <p class="mb-0">...</p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Items Table -->
                <div class="px-5 py-4" style="font-size: 0.875rem;">
                    <table class="w-100 mb-4">
                        <thead style="border-bottom: 2px solid #000;">
                            <tr>
                                <th class="py-2 ps-3 text-main">#</th>
                                <th class="py-2 text-main">Description</th>
                                <th class="py-2 text-end text-main">Price</th>
                                <th class="py-2 text-center text-main">Qty.</th>
                                <th class="py-2 text-end text-main">Total</th>
                            </tr>
                        </thead>
                        <tbody id="previewItems">
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5" class="pt-3">
                                    <table class="w-100">
                                        <tr>
                                            <td style="width: 60%;"></td>
                                            <td>
                                                <table class="w-100">
                                                    <tr>
                                                        <td class="p-2 fw-bold text-end border-top border-dark border-bottom border-2">Total:</td>
                                                        <td class="p-2 text-end fw-bold border-top border-dark border-bottom border-2">₹<span id="previewTotal">0.00</span></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="mt-4 text-secondary">
                        <p class="fw-bold text-main mb-1">Notes</p>
                        <p class="fst-italic">Thank you for your business!</p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center text-secondary small py-2 mt-5 bg-light border-top">
                    WhiteTake Films <span class="mx-2">|</span> contact@whitetake.com
                </div>

            </div>
        </div>
    </div>


    <!-- EDITOR SECTION (BOTTOM) -->
    <div class="editor-pane position-relative">
        <a href="invoices.php" class="btn btn-outline-secondary btn-sm position-absolute top-0 start-0 m-3" style="z-index: 10;">&larr; Exit</a>
        
        <form method="POST" class="container">
            <h5 class="mb-3 text-center">Invoice Editor</h5>

            <?php if ($msg): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($msg); ?></div>
            <?php endif; ?>

            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Client</label>
                    <select name="client_id" id="clientSelect" class="form-select form-select-sm" required onchange="updateClient()">
                        <option value="">Select Client</option>
                        <?php foreach ($clients as $client): ?>
                            <option value="<?php echo $client['id']; ?>" <?php echo $client['id'] == $invoice['client_id'] ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($client['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Title</label>
                    <input type="text" name="title" id="titleInput" class="form-control form-control-sm" value="<?php echo htmlspecialchars($invoice['title']); ?>" required oninput="updateItems()">
                </div>
                <div class="col-md-4">
                     <label class="form-label small fw-bold">Status</label>
                     <select name="status" class="form-select form-select-sm">
                        <option value="unpaid" <?php echo $invoice['status'] == 'unpaid' ? 'selected' : ''; ?>>Unpaid</option>
                        <option value="paid" <?php echo $invoice['status'] == 'paid' ? 'selected' : ''; ?>>Paid</option>
                        <option value="pending" <?php echo $invoice['status'] == 'pending' ? 'selected' : ''; ?>>Pending</option>
                    </select>
                </div>
            </div>

            <hr class="my-3">

            <label class="form-label small fw-bold">Items</label>
            <div class="table-responsive" style="max-height: 150px; overflow-y:auto;">
                <table class="table table-sm table-bordered mb-2">
                    <tbody id="editorItems">
                    </tbody>
                </table>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mt-2">
                <button type="button" class="btn btn-secondary btn-sm" onclick="addItem()">+ Add Item</button>
                <div class="fw-bold fs-5">Total: ₹<span id="editorTotal">0.00</span></div>
            </div>
            
            <div class="text-center mt-3">
                <button type="submit" class="btn btn-primary px-5">Update Invoice</button>
            </div>
        </form>
    </div>

    <script>
        const clientsData = <?php echo $clientsJson; ?>;
        const initialItems = <?php echo $itemsJson; ?>;
        let itemIndex = 0;

        // Dynamic Resize for Mobile
        function resizePreview() {
            const container = document.getElementById('previewContainer');
            const paper = document.getElementById('invoicePreview');
            if (!container || !paper) return;

            const containerWidth = container.offsetWidth;
            const paperWidth = 800;
            
            if (containerWidth < paperWidth + 40) {
                const scale = (containerWidth - 20) / paperWidth; 
                paper.style.transform = `scale(${scale})`;
                const heightReduction = paper.offsetHeight * (1 - scale);
                paper.style.marginBottom = `-${heightReduction}px`;
            } else {
                paper.style.transform = 'scale(0.9)'; 
                paper.style.marginBottom = '0';
            }
        }

        window.addEventListener('resize', resizePreview);
        window.addEventListener('load', resizePreview);

        function updateClient() {
            const id = document.getElementById('clientSelect').value;
            const client = clientsData.find(c => c.id == id);
            const previewEl = document.getElementById('previewClient');
            
            if (client) {
                previewEl.innerHTML = `
                    <p class="fw-bold mb-0">${client.name}</p>
                    <p class="mb-0">${client.email}</p>
                `;
            } else {
                previewEl.innerHTML = `
                    <p class="fw-bold mb-0">Select a Client</p>
                    <p class="mb-0">...</p>
                `;
            }
        }

        function addItem(desc = '', price = '', qty = 1) {
            const html = `
                <tr>
                    <td><input type="text" name="items[${itemIndex}][desc]" class="form-control form-control-sm" placeholder="Description" value="${desc}" required oninput="updateItems()"></td>
                    <td width="100"><input type="number" step="0.01" name="items[${itemIndex}][price]" class="form-control form-control-sm price-input" placeholder="Price" value="${price}" required oninput="updateItems()"></td>
                    <td width="70"><input type="number" name="items[${itemIndex}][qty]" class="form-control form-control-sm qty-input" value="${qty}" required oninput="updateItems()"></td>
                    <td width="40"><button type="button" class="btn btn-danger btn-sm py-0" onclick="removeRow(this)">&times;</button></td>
                </tr>
            `;
            document.getElementById('editorItems').insertAdjacentHTML('beforeend', html);
            itemIndex++;
            updateItems();
        }

        function removeRow(btn) {
            btn.closest('tr').remove();
            updateItems();
        }

        function updateItems() {
            const rows = document.querySelectorAll('#editorItems tr');
            const previewTbody = document.getElementById('previewItems');
            previewTbody.innerHTML = '';
            
            let grandTotal = 0;
            let counter = 1;

            rows.forEach(row => {
                const desc = row.querySelector('input[name*="[desc]"]').value || '';
                const priceValue = row.querySelector('input[name*="[price]"]').value;
                const qtyValue = row.querySelector('input[name*="[qty]"]').value;
                
                const price = parseFloat(priceValue) || 0;
                const qty = parseFloat(qtyValue) || 0;
                const total = price * qty;
                grandTotal += total;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-2 ps-3 border-bottom">${counter}</td>
                    <td class="py-2 border-bottom">${desc}</td>
                    <td class="py-2 text-end border-bottom">₹${price.toFixed(2)}</td>
                    <td class="py-2 text-center border-bottom">${qty}</td>
                    <td class="py-2 text-end border-bottom">₹${total.toFixed(2)}</td>
                `;
                previewTbody.appendChild(tr);
                counter++;
            });

            document.getElementById('previewTotal').textContent = grandTotal.toFixed(2);
            document.getElementById('editorTotal').textContent = grandTotal.toFixed(2);
        }

        // Initialize
        if (initialItems && initialItems.length > 0) {
            initialItems.forEach(item => {
                addItem(item.description, item.unit_price, item.quantity);
            });
        } else {
            addItem();
        }
        updateClient(); 
        resizePreview();
    </script>
</body>
</html>
