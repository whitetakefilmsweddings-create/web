<?php
require_once '../config/db.php';
require_once '../config/auth.php';

// Start session if not already started (auth.php might do it, but good to be safe if auth logic varies)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$id = $_GET['id'] ?? 0;

if (!$id) {
    die("Invalid Invoice ID");
}

// Fetch Invoice
$stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
$stmt->execute([$id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    die("Invoice not found");
}

// Fetch Client
$stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
$stmt->execute([$invoice['client_id']]);
$client = $stmt->fetch();

// Security Check
$isAdmin = isAdmin();
$isClient = isset($_SESSION['role']) && $_SESSION['role'] === 'client';

if (!$isAdmin && !$isClient) {
    header("Location: ../index.php");
    exit;
}

if ($isClient && $_SESSION['user_id'] != $invoice['client_id']) {
    die("Unauthorized access to this invoice.");
}


// Fetch Items
$stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
$stmt->execute([$id]);
$items = $stmt->fetchAll();

// If no items found (old invoice), create a fallback item
if (count($items) === 0) {
    $items[] = [
        'description' => $invoice['title'],
        'unit_price' => $invoice['amount'],
        'quantity' => 1,
        'total' => $invoice['amount']
    ];
}

$subtotal = 0;
foreach ($items as $item) {
    $subtotal += $item['total'];
}
$vat = 0; 
$total = $subtotal + $vat;

$date = date('F d, Y', strtotime($invoice['created_at']));
$invoiceNo = "INV-" . str_pad($invoice['id'], 5, '0', STR_PAD_LEFT);

?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice <?php echo $invoiceNo; ?></title>
  <link rel="stylesheet" href="../template/style.css" type="text/css" media="all" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
  <style>
      @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .invoice-container { box-shadow: none; border: none; }
      }
      body {
          background: #f3f4f6;
      }
      .actions-bar {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1000;
      }
      .btn-action {
          padding: 10px 20px;
          border-radius: 50px;
          border: none;
          color: white;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
      }
      .btn-print { background-color: #4f46e5; }
      .btn-whatsapp { background-color: #25D366; }
      .btn-back { background-color: #6b7280; }
      
      .invoice-wrapper {
          max-width: 800px;
          margin: 40px auto;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      
      /* Black & White Theme Overrides */
      .text-main { color: #000 !important; }
      .bg-main { background-color: #000 !important; }
      .border-main { border-color: #000 !important; }
  </style>
</head>

<body>
    
  <div class="actions-bar no-print">
      <a href="javascript:history.back()" class="btn-action btn-back">
          <i class="bi bi-arrow-left"></i> Back
      </a>
      <button onclick="window.print()" class="btn-action btn-print">
          <i class="bi bi-printer"></i> Print
      </button>
      <button onclick="sharePdf()" id="shareBtn" class="btn-action btn-whatsapp">
          <i class="bi bi-share-fill"></i> Share PDF
      </button>
  </div>

  <div class="invoice-wrapper" id="invoiceContent">
    <div class="py-4">
      <div class="px-14 py-6">
        <table class="w-full border-collapse border-spacing-0">
          <tbody>
            <tr>
              <td class="w-full align-top">
                <div>
                  <img src="../assets/logo.png?v=<?php echo time(); ?>" style="height: 90px; object-fit: contain;" />
                </div>
              </td>

              <td class="align-top">
                <div class="text-sm">
                  <table class="border-collapse border-spacing-0">
                    <tbody>
                      <tr>
                        <td class="border-r pr-4">
                          <div>
                            <p class="whitespace-nowrap text-slate-400 text-right">Date</p>
                            <p class="whitespace-nowrap font-bold text-main text-right"><?php echo $date; ?></p>
                          </div>
                        </td>
                        <td class="pl-4">
                          <div>
                            <p class="whitespace-nowrap text-slate-400 text-right">Invoice #</p>
                            <p class="whitespace-nowrap font-bold text-main text-right"><?php echo $invoiceNo; ?></p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-slate-100 px-14 py-6 text-sm">
        <table class="w-full border-collapse border-spacing-0">
          <tbody>
            <tr>
              <td class="w-1/2 align-top">
                <div class="text-sm text-neutral-600">
                  <p class="font-bold">WhiteTake Films</p>
                  <p>Film & Photography Services</p>
                  <p>contact@whitetake.com</p>
                  <p>Kerala, India</p>
                </div>
              </td>
              <td class="w-1/2 align-top text-right">
                <div class="text-sm text-neutral-600">
                  <p class="font-bold"><?php echo htmlspecialchars($client['name']); ?></p>
                  <p><?php echo htmlspecialchars($client['email']); ?></p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-14 py-10 text-sm text-neutral-700">
        <table class="w-full border-collapse border-spacing-0">
          <thead>
            <tr>
              <td class="border-b-2 border-main pb-3 pl-3 font-bold text-main">#</td>
              <td class="border-b-2 border-main pb-3 pl-2 font-bold text-main">Description</td>
              <td class="border-b-2 border-main pb-3 pl-2 text-right font-bold text-main">Price</td>
              <td class="border-b-2 border-main pb-3 pl-2 text-center font-bold text-main">Qty.</td>
              <td class="border-b-2 border-main pb-3 pl-2 text-right font-bold text-main">Total</td>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($items as $index => $item): ?>
            <tr>
              <td class="border-b py-3 pl-3"><?php echo $index + 1; ?></td>
              <td class="border-b py-3 pl-2"><?php echo htmlspecialchars($item['description']); ?></td>
              <td class="border-b py-3 pl-2 text-right">₹<?php echo number_format($item['unit_price'], 2); ?></td>
              <td class="border-b py-3 pl-2 text-center"><?php echo $item['quantity']; ?></td>
              <td class="border-b py-3 pl-2 text-right">₹<?php echo number_format($item['total'], 2); ?></td>
            </tr>
            <?php endforeach; ?>
            <tr>
              <td colspan="5">
                <table class="w-full border-collapse border-spacing-0">
                  <tbody>
                    <tr>
                      <td class="w-full"></td>
                      <td>
                        <table class="w-full border-collapse border-spacing-0">
                          <tbody>
                            <tr>
                              <td class="p-3 border-t-2 border-b-2 border-black text-right font-bold">Total:</td>
                              <td class="p-3 border-t-2 border-b-2 border-black text-right font-bold">₹<?php echo number_format($total, 2); ?></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-14 py-10 text-sm text-neutral-700">
        <p class="text-main font-bold">Notes</p>
        <p class="italic">Thank you for your business!</p>
      </div>

      <footer class="fixed bottom-0 left-0 bg-slate-100 w-full text-neutral-600 text-center text-xs py-3">
        WhiteTake Films
        <span class="text-slate-300 px-2">|</span>
        contact@whitetake.com
      </footer>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    async function sharePdf() {
        const element = document.getElementById('invoiceContent');
        const btn = document.getElementById('shareBtn');
        const originalContent = btn.innerHTML;
        const filename = '<?php echo $invoiceNo; ?>.pdf';

        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Generate PDF Blob
            const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
            const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

            // Check if Web Share API is supported and can share files
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: 'Invoice from WhiteTake Films',
                    text: 'Please find attached the invoice.',
                });
            } else {
                // Fallback: Download the PDF
                const link = document.createElement('a');
                link.href = URL.createObjectURL(pdfBlob);
                link.download = filename;
                link.click();
                URL.revokeObjectURL(link.href);
                alert('Your device does not support direct PDF sharing. The invoice has been downloaded instead.');
            }
        } catch (error) {
            console.error('Error generating/sharing PDF:', error);
            if (error.name !== 'AbortError') {
                alert('An error occurred while trying to share the PDF.');
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
  </script>
</body>

</html>
