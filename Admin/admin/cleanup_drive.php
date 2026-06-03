<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/db.php';
require_once '../config/auth.php';
requireAdmin();

$clientId = $_GET['client_id'] ?? null;
$type = $_GET['type'] ?? 'gallery'; // 'gallery' or 'face_ai'

if (!$clientId) {
    die("Client ID required");
}

// Fetch Client
$stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
$stmt->execute([$clientId]);
$client = $stmt->fetch();

if (!$client) {
    die("Client not found");
}

// Determine Folder ID based on type
$folderId = ($type === 'face_ai') ? ($client['ai_folder_id'] ?? '') : ($client['folder_id'] ?? '');
$folderName = ($type === 'face_ai') ? "Face AI Folder" : "Gallery Folder";

if (!$folderId) {
    die("No $folderName configured for this client.");
}

$msg = '';
$error = '';

// Handle Deletion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_files'])) {
    $filesToDelete = $_POST['files'] ?? [];

    if (count($filesToDelete) > 0) {
        try {
            require_once '../config/google_drive.php';
            $drive = new GoogleDrive();
            
            $deletedCount = 0;
            $failedCount = 0;

            $lastError = '';
            foreach ($filesToDelete as $fileId) {
                try {
                    $drive->deleteFile($fileId);
                    $deletedCount++;
                } catch (Exception $e) {
                    $failedCount++;
                    $lastError = $e->getMessage();
                }
            }

            $msg = "Successfully deleted $deletedCount images.";
            if ($failedCount > 0) {
                $msg .= " Failed to delete $failedCount images.";
                if ($lastError) {
                    $error = "Last Error: " . $lastError . " (Likely Permission Issue: Did you SHARE the folder with the Service Account email?)";
                }
            }

        } catch (Exception $e) {
            $error = "Drive Error: " . $e->getMessage();
        }
    } else {
        $error = "No files selected for deletion.";
    }
}

// Fetch Files
$files = [];
try {
    require_once '../config/google_drive.php';
    $drive = new GoogleDrive();
    $dFiles = $drive->getFiles($folderId);

    foreach ($dFiles as $file) {
        // Filter for images/videos only, skip folders
        $mime = $file->getMimeType();
        if ($mime === 'application/vnd.google-apps.folder') {
            continue;
        }
        
        $files[] = [
            'id' => $file->getId(),
            'name' => $file->getName(),
            'src' => str_replace('=s220', '=s600', $file->getThumbnailLink() ?? ''),
            'mime' => $mime
        ];
    }

} catch (Exception $e) {
    $error = "Error fetching files: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cleanup <?php echo $folderName; ?> - <?php echo htmlspecialchars($client['name']); ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        :root {
            --ios-bg: #F2F2F7;
            --ios-card: #FFFFFF;
            --ios-blue: #007AFF;
            --ios-red: #FF3B30;
            --ios-gray: #8E8E93;
            --ios-separator: #C6C6C8;
        }
        body { 
            background-color: var(--ios-bg); 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            padding-bottom: 100px; /* Space for bottom bar */
        }
        
        /* Navigation */
        .glass-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(242, 242, 247, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 0.5px solid rgba(0,0,0,0.1);
            padding: 15px 0;
            margin-bottom: 15px;
        }

        /* Grid Layout */
        .gallery-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 10px; 
            padding: 0 10px;
        }
        
        /* Mobile adjustment for 2 columns strictly */
        @media (max-width: 576px) {
            .gallery-grid {
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                padding: 0 8px;
            }
        }

        .gallery-item { 
            position: relative;
            background: var(--ios-card);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: none; /* iOS Photos style is flat in grid */
            transition: transform 0.2s;
            aspect-ratio: 1;
        }
        
        .gallery-item.selected {
            transform: scale(0.95);
            box-shadow: 0 0 0 2px var(--ios-blue);
        }

        .img-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
        }
        .img-wrapper img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }

        /* iOS Selection Circle */
        .checkbox-overlay {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 10;
        }
        .selection-circle {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1.5px solid rgba(255,255,255,0.8);
            background: rgba(0,0,0,0.2);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            transition: all 0.2s;
        }
        .gallery-item.selected .selection-circle {
            background: var(--ios-blue);
            border-color: var(--ios-blue);
        }
        .gallery-item.selected .selection-circle::after {
            content: '✓';
            color: white;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            font-weight: bold;
        }
        
        /* Hidden real checkbox */
        .file-checkbox {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: 20;
            cursor: pointer;
        }

        /* Bottom Fixed Action Bar */
        .bottom-actions {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 0.5px solid rgba(0,0,0,0.1);
            padding: 12px 20px;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
            padding-bottom: max(12px, env(safe-area-inset-bottom));
        }

        /* Buttons & Badges */
        .btn-ios {
            border-radius: 20px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 15px;
            transition: all 0.2s;
        }
        .btn-primary-ios {
            background-color: var(--ios-blue);
            color: white;
            border: none;
        }
        .btn-danger-ios {
            background-color: var(--ios-card);
            color: var(--ios-red);
            border: none;
        }
        .btn-danger-ios:disabled {
            color: var(--ios-gray);
            background: transparent;
        }

        .badge-ios {
            position: absolute;
            bottom: 6px;
            left: 6px;
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 10px;
            background: rgba(0,0,0,0.6);
            color: white;
            backdrop-filter: blur(4px);
        }
        .badge-ios.duplicate { color: #FFCC00; background: rgba(0,0,0,0.7); }
        .badge-ios.blinking { color: #FF3B30; background: rgba(0,0,0,0.7); }
    </style>
</head>
<body>
<body>
    <form method="POST" id="cleanupForm" onsubmit="return confirm('WARNING: You are about to DELETE ' + document.querySelectorAll('.file-checkbox:checked').length + ' images. Are you sure?');">
        <input type="hidden" name="delete_files" value="1">

        <!-- Sticky Glass Header -->
        <div class="glass-header">
            <div class="container d-flex justify-content-between align-items-center">
                <a href="view_client.php?id=<?php echo $client['id']; ?>" class="text-decoration-none" style="color: var(--ios-blue);">
                    <i class="bi bi-chevron-left"></i> Back
                </a>
                <div class="text-center">
                    <h6 class="mb-0 fw-bold"><?php echo $folderName; ?></h6>
                    <small style="color: var(--ios-gray); font-size: 0.75rem;"><?php echo htmlspecialchars($client['name']); ?></small>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown" style="width: 32px; height: 32px;">
                        <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg" style="border-radius: 12px;">
                        <li><h6 class="dropdown-header">Smart Select</h6></li>
                        <li><a class="dropdown-item" href="#" onclick="selectByClass('is-blinking')">Select Blinking</a></li>
                        <li><a class="dropdown-item" href="#" onclick="selectByClass('is-duplicate')">Select Duplicates</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="toggleSelectAll()">Select All</a></li>
                    </ul>
                </div>
            </div>
            
            <!-- Messages / Status -->
            <div class="container mt-2">
                 <div id="ai-status" class="d-none"></div>
                 <?php if ($msg) echo "<div class='alert alert-success py-1 px-2 small mb-0 rounded-pill d-inline-block'>$msg</div>"; ?>
                 <?php if ($error) echo "<div class='alert alert-danger py-1 px-2 small mb-0 rounded-pill d-inline-block'>$error</div>"; ?>
            </div>
        </div>

        <div class="container px-0">
            <?php if (count($files) > 0): ?>
                <div class="gallery-grid">
                    <?php foreach ($files as $f): ?>
                        <div class="gallery-item" id="card-<?php echo $f['id']; ?>">
                            <div class="checkbox-overlay">
                                <div class="selection-circle" id="circle-<?php echo $f['id']; ?>"></div>
                            </div>
                            <!-- Full Card Click -->
                            <input type="checkbox" name="files[]" value="<?php echo $f['id']; ?>" class="file-checkbox" onchange="updateSelection(this)">
                            
                            <div class="img-wrapper">
                                <img src="<?php echo $f['src']; ?>" loading="lazy" alt="img">
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-folder2-open display-1"></i>
                    <p class="mt-3">Folder is empty</p>
                </div>
            <?php endif; ?>
        </div>

        <!-- Spacer for bottom bar -->
        <div style="height: 60px;"></div>

        <!-- Bottom Action Bar -->
        <div class="bottom-actions">
            <span class="fw-bold" style="color: var(--ios-gray); font-size: 14px;" id="selectionCount">0 Selected</span>
            
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-ios btn-light" onclick="startAiScan()">
                    <i class="bi bi-stars" style="color: var(--ios-blue);"></i> AI Scan
                </button>
                <button type="submit" class="btn btn-ios btn-danger-ios" id="deleteBtn" disabled>
                    <i class="bi bi-trash"></i> Delete
                </button>
            </div>
        </div>

    </form>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Face API -->
    <script defer src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
    <script>
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        let modelsLoaded = false;

        // UI Helpers
        function toggleSelectAll() {
            const checkboxes = document.querySelectorAll('.file-checkbox');
            // Check if all are already selected
            const allSelected = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(cb => {
                cb.checked = !allSelected;
                updateVisuals(cb);
            });
            updateCount();
        }

        function updateSelection(checkbox) {
            updateVisuals(checkbox);
            updateCount();
        }

        function updateVisuals(checkbox) {
            const card = document.getElementById('card-' + checkbox.value);
            if (checkbox.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }

        function updateCount() {
            const count = document.querySelectorAll('.file-checkbox:checked').length;
            document.getElementById('selectionCount').textContent = count + ' Selected';
            document.getElementById('deleteBtn').disabled = (count === 0);
            
            if (count > 0) {
                 document.getElementById('deleteBtn').innerHTML = `<i class="bi bi-trash-fill"></i> Delete (${count})`;
            } else {
                 document.getElementById('deleteBtn').innerHTML = `<i class="bi bi-trash"></i> Delete`;
            }
        }

        function selectByClass(className) {
            const checkboxes = document.querySelectorAll('.file-checkbox');
            checkboxes.forEach(cb => {
                const card = document.getElementById('card-' + cb.value);
                if (card.classList.contains(className)) {
                    cb.checked = true;
                    updateVisuals(cb);
                }
            });
            updateCount();
        }

        // --- AI LOGIC ---

        async function loadModels() {
            if (modelsLoaded) return true;
            status("Loading AI Models...", "info");
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL) 
                ]);
                modelsLoaded = true;
                status("AI Ready.", "success");
                return true;
            } catch (e) {
                console.error(e);
                status("Failed to load AI.", "danger");
                alert("Could not load AI models. Check console.");
                return false;
            }
        }

        function status(msg, type = 'info') {
            const el = document.getElementById('ai-status');
            el.className = `d-inline-block small px-3 py-1 rounded-pill bg-light text-secondary border`;
            if (type === 'success') el.className = `d-inline-block small px-3 py-1 rounded-pill bg-success text-white`;
            if (type === 'danger') el.className = `d-inline-block small px-3 py-1 rounded-pill bg-danger text-white`;
            el.textContent = msg;
            el.classList.remove('d-none');
        }

        async function startAiScan() {
            if (!await loadModels()) return;

            const items = Array.from(document.querySelectorAll('.gallery-item'));
            if (items.length === 0) return;

            status("Scanning images... 0%", "info");
            
            // Previous image for duplicate detection
            let prevImgData = null; 
            let processed = 0;

            for (const item of items) {
                const imgEl = item.querySelector('img');
                const id = item.id;
                
                // --- 1. Load Image ---
                let img;
                try {
                    img = await urlToImage(imgEl.src);
                } catch(e) {
                    console.log("Skip " + id);
                    incrementProgress(items.length, ++processed);
                    continue;
                }

                // --- 2. Duplicate Detection (Simple Perceptual Diff) ---
                // Resize to 32x32 grayscale for comparison
                const currentImgData = getImageData(img);
                
                if (prevImgData) {
                    const diff = getDifference(prevImgData, currentImgData);
                    // TIGHTENED THRESHOLD: 3% (was 5%)
                    // This ensures we only flag images that are effectively identical (burst shots)
                    // and avoids flagging merely "similar" poses.
                    if (diff < 3.0) {
                        markAsDuplicate(item);
                    }
                }
                prevImgData = currentImgData;

                // --- 3. Blink Detection ---
                try {
                    // Increased Score Threshold to 0.7 to ignore blurry/bad faces
                    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.7 }))
                        .withFaceLandmarks(true); 
                    
                    let blinkingFound = false;
                    for (const d of detections) {
                        const leftEye = d.landmarks.getLeftEye();
                        const rightEye = d.landmarks.getRightEye();
                        const leftEAR = getEAR(leftEye);
                        const rightEAR = getEAR(rightEye);

                        // STRICTER LOGIC:
                        // 1. Both eyes must be contributing (Average < 0.19)
                        // 2. Both eyes must be reasonably closed individually (< 0.25) to avoid winks
                        // This filters out "looking down" where eyes are narrow but not closed.
                        const avgEAR = (leftEAR + rightEAR) / 2;
                        
                        if (avgEAR < 0.19 && leftEAR < 0.25 && rightEAR < 0.25) {
                           blinkingFound = true;
                           // console.log(`Blink Detected: ${id} (L:${leftEAR.toFixed(2)} R:${rightEAR.toFixed(2)} Avg:${avgEAR.toFixed(2)})`);
                           break; 
                        }
                    }

                    if (blinkingFound) {
                        markAsBlinking(item);
                    }

                } catch (e) {
                    console.error("Face err:", e);
                }

                incrementProgress(items.length, ++processed);
                
                // Clean up
                img.remove();
            }

            status("Scan Complete.", "success");
        }

        function incrementProgress(total, current) {
            const p = Math.round((current / total) * 100);
            status(`Scanning... ${p}%`, "info");
        }

        function markAsDuplicate(item) {
            item.classList.add('is-duplicate');
            addBadge(item, 'Duplicate', 'warning');
        }

        function markAsBlinking(item) {
            item.classList.add('is-blinking');
            addBadge(item, 'Blinking', 'danger');
        }

        function addBadge(item, text, color) {
            let container = item.querySelector('.badges-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'badges-container';
                container.style.cssText = 'position:absolute; bottom:6px; left:6px; z-index:5; display:flex; gap:2px;';
                item.appendChild(container);
            }
            const badge = document.createElement('span');
            // color mapping e.g. 'warning' -> 'duplicate', 'danger' -> 'blinking'
            const type = (color === 'warning') ? 'duplicate' : 'blinking';
            badge.className = `badge-ios ${type}`;
            badge.textContent = text;
            container.appendChild(badge);
        }

        // --- Helper: URL to Image ---
        function urlToImage(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = url;
            });
        }

        // --- Helper: EAR Calculation ---
        function getEAR(eye) {
            // eye is array of 6 points
            const A = dist(eye[1], eye[5]);
            const B = dist(eye[2], eye[4]);
            const C = dist(eye[0], eye[3]);
            return (A + B) / (2.0 * C);
        }

        function dist(p1, p2) {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }

        // --- Helper: Image Data & Diff ---
        function getImageData(img) {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 32, 32);
            const data = ctx.getImageData(0, 0, 32, 32).data;
            // Convert to grayscale avg
            let gray = [];
            for (let i = 0; i < data.length; i += 4) {
                gray.push((data[i] + data[i+1] + data[i+2]) / 3);
            }
            return gray;
        }

        function getDifference(data1, data2) {
            let diff = 0;
            for (let i = 0; i < data1.length; i++) {
                diff += Math.abs(data1[i] - data2[i]);
            }
            // Normalize (0-255 * 1024 pixels)
            return (diff / (255 * 1024)) * 100; // Returns percentage diff
        }

    </script>
</body>
</html>
