<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/db.php';
require_once '../config/auth.php';
requireAdmin();

$clientId = $_GET['id'] ?? null;
if (!$clientId) {
    die("Client ID required");
}

// Fetch Client Info
$stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
$stmt->execute([$clientId]);
$client = $stmt->fetch();

if (!$client) {
    die("Client not found");
}

$folderId = $client['folder_id'];
$files = [];
$error = '';
$successMsg = '';

// Fetch Selections
$selections = [];
$stmt = $pdo->prepare("SELECT file_id FROM client_selections WHERE client_id = ?");
$stmt->execute([$clientId]);
$selections = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Handle Deletion of UNSELECTED files
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_unselected'])) {
    
    try {
        require_once '../config/google_drive.php';
        $drive = new GoogleDrive();
        
        // Re-fetch all files to determine what is currently unselected
        $dFiles = $drive->getFiles($folderId);
        $unselectedIds = [];
        
        foreach ($dFiles as $file) {
            $mime = $file->getMimeType();
            if ($mime === 'application/vnd.google-apps.folder' || strpos($mime, 'application/zip') !== false) {
                continue;
            }
            if (!in_array($file->getId(), $selections)) {
                $unselectedIds[] = $file->getId();
            }
        }

        if (count($unselectedIds) > 0) {
            $deletedCount = 0;
            $failedCount = 0;

            foreach ($unselectedIds as $fileId) {
                try {
                    $drive->deleteFile($fileId);
                    $deletedCount++;
                } catch (Exception $e) {
                    $failedCount++;
                }
            }
            
            $successMsg = "Deleted $deletedCount files. " . ($failedCount > 0 ? "Failed to delete $failedCount files." : "");
        } else {
            $error = "No unselected files to delete.";
        }

    } catch (Exception $e) {
        $error = "Drive Error: " . $e->getMessage();
    }
}

// Fetch Files (for display)
// Fetch Files (for display)
$realSelectedFiles = [];
if ($selections) {
    try {
        if (!class_exists('GoogleDrive')) {
            require_once '../config/google_drive.php';
        }
        $drive = new GoogleDrive();
        foreach ($selections as $fid) {
            $f = $drive->getFileMetadata($fid);
            if ($f) {
                 $realSelectedFiles[] = [
                    'id' => $f->getId(),
                    'name' => $f->getName(),
                    'src' => str_replace('=s220', '=s600', $f->getThumbnailLink() ?? '')
                ];
            }
        }
    } catch (Exception $e) {
        $error = "Error fetching selections: " . $e->getMessage();
    }
}

if ($folderId) {
    try {
        if (!class_exists('GoogleDrive')) {
            require_once '../config/google_drive.php';
        }
        $drive = new GoogleDrive();
        $dFiles = $drive->getFiles($folderId);
        
        foreach ($dFiles as $file) {
            $mime = $file->getMimeType();
            if ($mime === 'application/vnd.google-apps.folder' || strpos($mime, 'application/zip') !== false) {
                continue;
            }

            $isSelected = in_array($file->getId(), $selections);
            
            $files[] = [
                'id' => $file->getId(),
                'name' => $file->getName(),
                'src' => str_replace('=s220', '=s600', $file->getThumbnailLink() ?? ''),
                'is_selected' => $isSelected
            ];
        }
    } catch (Exception $e) {
        $error = "Error fetching files: " . $e->getMessage();
    }
}

// Separate lists
$selectedFiles = $realSelectedFiles; 
$unselectedFiles = array_filter($files, fn($f) => !$f['is_selected']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selections - <?php echo htmlspecialchars($client['name']); ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { background-color: #f4f6f9; }
        .gallery-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); 
            gap: 10px; 
        }
        .gallery-item { 
            aspect-ratio: 1; 
            overflow: hidden; 
            border-radius: 4px;
            background: #fff;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
        .filename-badge {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 4px;
            font-size: 0.75rem;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .gallery-item.unselected {
            opacity: 0.6;
            filter: grayscale(100%);
        }
        .status-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
        }
        .badge-selected { background: #198754; }
        .badge-selected { background: #198754; }
        .badge-unselected { background: #6c757d; }
        .download-btn {
            position: absolute;
            top: 5px;
            left: 5px;
            background: rgba(255, 255, 255, 0.8);
            color: #333;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            text-decoration: none;
            transition: all 0.2s;
            z-index: 10;
        }
        .download-btn:hover {
            background: #0d6efd;
            color: white;
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <div class="container py-5">
        <div class="d-flex align-items-center mb-4">
            <a href="view_client.php?id=<?php echo $client['id']; ?>" class="btn btn-outline-secondary me-3"><i class="bi bi-arrow-left"></i> Back</a>
            <div>
                <h2 class="mb-0 fw-bold">Client Selections</h2>
                <p class="text-muted mb-0">Client: <?php echo htmlspecialchars($client['name']); ?></p>
            </div>
            <div class="ms-auto">
                <span class="badge bg-success fs-5"><?php echo count($selectedFiles); ?> Selected</span>
                <span class="badge bg-secondary fs-5 ms-2"><?php echo count($unselectedFiles); ?> Unselected</span>
            </div>
        </div>

        <?php 
        $totalSelected = count($selectedFiles);
        if ($totalSelected > 0): 
            $BATCH_SIZE = 20;
            $batches = ceil($totalSelected / $BATCH_SIZE);
        ?>
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0 fw-bold"><i class="bi bi-cloud-download"></i> Download Options</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <!-- Automatic Batches -->
                        <div class="col-md-7">
                            <h6 class="small text-muted mb-2">Pre-Split Batches (Standard)</h6>
                            <div class="d-flex flex-wrap gap-2">
                                <?php for ($i = 1; $i <= $batches; $i++): 
                                    $start = ($i - 1) * $BATCH_SIZE + 1;
                                    $end = min($i * $BATCH_SIZE, $totalSelected);
                                ?>
                                    <a href="download_zip.php?client_id=<?php echo $clientId; ?>&start=<?php echo $start; ?>&end=<?php echo $end; ?>" 
                                       class="btn btn-outline-primary btn-sm">
                                        <i class="bi bi-file-zip"></i> Part <?php echo $i; ?> (<?php echo "$start-$end"; ?>)
                                    </a>
                                <?php endfor; ?>
                            </div>

                             <!-- Download All Individually -->
                            <div class="mt-3 border-top pt-2">
                                <h6 class="small text-muted mb-2">Power Download (Individual Files)</h6>
                                <button onclick="downloadAllFiles()" class="btn btn-outline-success btn-sm">
                                    <i class="bi bi-download"></i> Download All Selected Individually (Auto)
                                </button>
                                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                                    <i class="bi bi-info-circle"></i> Requires "Pop-ups Allowed". Files will download sequentially.
                                </small>
                            </div>
                        </div>

                        <!-- Custom Range -->
                        <div class="col-md-5 border-start">
                            <h6 class="small text-muted mb-2">Custom Range</h6>
                            <form action="download_zip.php" method="GET" class="row g-2 align-items-center" target="_blank">
                                <input type="hidden" name="client_id" value="<?php echo $clientId; ?>">
                                <div class="col-auto">
                                    <input type="number" name="start" class="form-control form-control-sm" placeholder="Start" min="1" max="<?php echo $totalSelected; ?>" required style="width: 80px;">
                                </div>
                                <div class="col-auto">to</div>
                                <div class="col-auto">
                                    <input type="number" name="end" class="form-control form-control-sm" placeholder="End" min="1" max="<?php echo $totalSelected; ?>" required style="width: 80px;">
                                </div>
                                <div class="col-auto">
                                    <button type="submit" class="btn btn-primary btn-sm">Download</button>
                                </div>
                            </form>
                            <small class="text-muted d-block mt-1">Total Selected: <?php echo $totalSelected; ?></small>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
        </div>

        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        <?php if ($successMsg): ?>
            <div class="alert alert-success"><?php echo htmlspecialchars($successMsg); ?></div>
        <?php endif; ?>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-4" id="myTab" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="selected-tab" data-bs-toggle="tab" data-bs-target="#selected" type="button" role="tab">Selected Photos</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="all-tab" data-bs-toggle="tab" data-bs-target="#all" type="button" role="tab">All Photos (Manage)</button>
            </li>
        </ul>

        <div class="tab-content" id="myTabContent">
            <!-- Selected Tab -->
            <div class="tab-pane fade show active" id="selected" role="tabpanel">
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                         <?php if (count($selectedFiles) > 0): ?>
                            <div class="gallery-grid">
                                <?php foreach ($selectedFiles as $f): ?>
                                    <div class="gallery-item" title="<?php echo htmlspecialchars($f['name']); ?>">
                                        <a href="download_file.php?file_id=<?php echo $f['id']; ?>" class="download-btn" title="Download" target="_blank">
                                            <i class="bi bi-download"></i>
                                        </a>
                                        <img src="<?php echo $f['src']; ?>" loading="lazy">
                                        <div class="filename-badge"><?php echo htmlspecialchars($f['name']); ?></div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="alert alert-info">No photos selected yet.</div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- All Photos Tab -->
            <div class="tab-pane fade" id="all" role="tabpanel">
                 <div class="card shadow-sm border-0">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">All Photos</h5>
                        <?php if (count($unselectedFiles) > 0): ?>
                            <form method="POST" onsubmit="return confirm('WARNING: This will PERMANENTLY DELETE all unselected photos from Google Drive. Ensure the client has finished selecting. This cannot be undone. Are you sure?');">
                                <button type="submit" name="delete_unselected" class="btn btn-danger btn-sm">
                                    <i class="bi bi-trash"></i> Delete <?php echo count($unselectedFiles); ?> Unselected Photos
                                </button>
                            </form>
                        <?php else: ?>
                             <button class="btn btn-secondary btn-sm" disabled>No Unselected Photos to Delete</button>
                        <?php endif; ?>
                    </div>
                    <div class="card-body">
                         <?php if (count($files) > 0): ?>
                            <div class="gallery-grid">
                                <?php foreach ($files as $f): ?>
                                    <div class="gallery-item <?php echo $f['is_selected'] ? '' : 'unselected'; ?>" title="<?php echo htmlspecialchars($f['name']); ?>">
                                        <a href="download_file.php?file_id=<?php echo $f['id']; ?>" class="download-btn" title="Download" target="_blank">
                                            <i class="bi bi-download"></i>
                                        </a>
                                        <img src="<?php echo $f['src']; ?>" loading="lazy">
                                        <div class="filename-badge"><?php echo htmlspecialchars($f['name']); ?></div>
                                        <?php if ($f['is_selected']): ?>
                                            <div class="status-badge badge-selected"><i class="bi bi-check"></i> Selected</div>
                                        <?php else: ?>
                                            <div class="status-badge badge-unselected">Unselected</div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="alert alert-info">No photos found.</div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const selectedFileIds = <?php echo json_encode(array_column($selectedFiles, 'id')); ?>;

        function downloadAllFiles() {
            if (!confirm(`This will start downloading ${selectedFileIds.length} files individually. Please ensure you have allowed pop-ups for this site. Continue?`)) {
                return;
            }

            let index = 0;
            const delay = 1500; // 1.5 seconds delay between downloads

            function downloadNext() {
                if (index >= selectedFileIds.length) {
                    alert("All downloads initiated!");
                    return;
                }

                const fileId = selectedFileIds[index];
                const url = `download_file.php?file_id=${fileId}`;
                
                // Create invisible iframe to trigger download
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);
                
                // Cleanup iframe after a while
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 60000); // 1 minute

                index++;
                setTimeout(downloadNext, delay);
            }

            downloadNext();
        }
    </script>
</body>
</html>
