<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/db.php';
require_once '../config/auth.php';
requireClient();

$userId = $_SESSION['user_id'];
$folderId = $_GET['folder'] ?? null; 

// Fetch Client Info
$stmt = $pdo->prepare("SELECT folder_id, name FROM clients WHERE id = ?");
$stmt->execute([$userId]);
$client = $stmt->fetch();

$rootFolderId = $client['folder_id'];
$error = '';
$files = [];
$zipFileId = null;

// 1. Fetch Selections
$selections = [];
$stmt = $pdo->prepare("SELECT file_id FROM client_selections WHERE client_id = ?");
$stmt->execute([$userId]);
$selections = $stmt->fetchAll(PDO::FETCH_COLUMN);

// 2. Fetch Files
if ($selections) {
    try {
        require_once '../config/google_drive.php';
        $drive = new GoogleDrive();
        
        foreach ($selections as $fileId) {
            $file = $drive->getFileMetadata($fileId);
            
            if ($file) {
                $mime = $file->getMimeType();
                // Skip folders or zips just in case (though selections should be images)
                if ($mime === 'application/vnd.google-apps.folder' || strpos($mime, 'application/zip') !== false) {
                    continue;
                }

                $files[] = [
                    'id' => $file->getId(),
                    'name' => $file->getName(),
                    'type' => 'image',
                    'src' => str_replace('=s220', '=s600', $file->getThumbnailLink() ?? ''),
                    'link' => '#'
                ];
            }
        }
    } catch (Exception $e) {
        $error = "Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Selections - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
    <style>
        body { background-color: #ffffff; color: #000; }
        
        /* Copy grid styles from gallery.php */
        .gallery-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(var(--grid-item-size, 150px), 1fr)); 
            gap: 2px; 
            --grid-item-size: 150px; 
            touch-action: pan-y;
        }
        @media (max-width: 768px) {
            .gallery-grid { --grid-item-size: 80px; }
        }
        .gallery-item { 
            aspect-ratio: 1; 
            overflow: hidden; 
            cursor: pointer; 
            position: relative; 
            background: #f0f0f0;
        }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .gallery-item:hover img { transform: scale(1.02); }

        .download-btn {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(255,255,255,0.9);
            width: 40px; height: 40px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            opacity: 0; 
            transition: all 0.3s;
            color: black;
            z-index: 10;
        }
        .download-btn:hover { background: white; transform: scale(1.1); color: black; }
        .gallery-item:hover .download-btn { opacity: 1; }

        .lightbox { display: none; position: fixed; z-index: 2000; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); justify-content: center; align-items: center; backdrop-filter: blur(5px); }
        .lightbox img { max-width: 90%; max-height: 90vh; object-fit: contain; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
        .close-lightbox { position: absolute; top: 25px; right: 30px; color: white; font-size: 45px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
        .close-lightbox:hover { opacity: 1; }
    </style>
</head>
<body>
    <div class="container py-4" style="padding-bottom: 80px;">
        <div class="d-flex align-items-center mb-4">
            <h2 class="mb-0 fw-bold">My Selections</h2>
            <div class="ms-auto bg-light rounded-pill px-3 py-1 border">
                <span class="fw-bold"><?php echo count(array_filter($files, fn($f) => $f['type'] === 'image')); ?></span> Photos
            </div>
        </div>
        
        <?php if ($error): ?>
            <div class="alert alert-warning"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <!-- Images Grid -->
        <div class="gallery-grid">
            <?php foreach ($files as $f): ?>
                <?php if ($f['type'] === 'image'): ?>
                    <div class="gallery-item" onclick="openLightbox('<?php echo $f['src']; ?>', '<?php echo $f['id']; ?>', '<?php echo addslashes($f['name']); ?>')">
                        <img src="<?php echo $f['src']; ?>" loading="lazy">
                        <a href="download.php?id=<?php echo $f['id']; ?>&name=<?php echo urlencode($f['name']); ?>" class="download-btn" onclick="event.stopPropagation()" title="Download Image">
                            <i class="bi bi-download"></i>
                        </a>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
        
        <?php if (count($files) === 0): ?>
            <div class="text-center py-5">
                <p class="text-muted">No selected photos found. Go to the gallery to select photos.</p>
                <a href="gallery.php" class="btn btn-primary rounded-pill">Go to Gallery</a>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Lightbox -->
    <div class="lightbox" id="lightbox" onclick="if(event.target===this) closeLightbox()">
        <span class="close-lightbox" onclick="closeLightbox()">&times;</span>
        <img id="lightbox-img" src="">
        <a id="lightbox-dl" href="#" class="btn btn-light rounded-pill px-4 py-2 position-absolute" style="bottom: 30px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); font-weight: 600;">
            <i class="bi bi-cloud-download me-2"></i> Download Original
        </a>
    </div>

    <!-- Nav -->
    <nav class="bottom-nav">
        <a href="dashboard.php" class="nav-item">
            <i class="bi bi-grid"></i>
            <span>Home</span>
        </a>
        <a href="gallery.php" class="nav-item">
            <i class="bi bi-images"></i>
            <span>Gallery</span>
        </a>
        <a href="selections.php" class="nav-item active">
            <i class="bi bi-check2-square"></i>
            <span>Selections</span>
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
    
    <script>
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxDl = document.getElementById('lightbox-dl');
        
        function openLightbox(src, id, name) { 
            lightboxImg.src = src; 
            lightboxDl.href = 'download.php?id=' + id + '&name=' + encodeURIComponent(name);
            lightbox.style.display = 'flex'; 
        }
        function closeLightbox() { lightbox.style.display = 'none'; }
    </script>
</body>
</html>
