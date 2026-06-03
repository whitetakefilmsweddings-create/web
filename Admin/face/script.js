// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const stepSelfie = document.getElementById('step-selfie');
const stepResults = document.getElementById('step-results');
const stepOptions = document.getElementById('step-options');
const totalGalleryCount = document.getElementById('total-gallery-count');
const progressPercent = document.getElementById('progress-percent');
const scannerContainer = document.getElementById('scanner-container');

// Selfie Input
const tabButtons = document.querySelectorAll('.tab-btn');
const inputViews = document.querySelectorAll('.input-view');
const videoFeed = document.getElementById('video-feed');
const captureBtn = document.getElementById('capture-btn');
const selfieInput = document.getElementById('selfie-input');
const selfieDropArea = document.getElementById('selfie-drop-area');
const selfiePreviewContainer = document.getElementById('selfie-preview-container');
const selfieImg = document.getElementById('selfie-img');
const retakeBtn = document.getElementById('retake-btn');
const faceCheckStatus = document.getElementById('face-check-status');
const actionButtons = document.getElementById('action-buttons');

// Hidden / Logic Inputs
const gdriveFolderInput = document.getElementById('gdrive-folder');
const gdriveApiKeyInput = document.getElementById('gdrive-api-key');
const thresholdSlider = document.getElementById('threshold-slider');
const startSearchBtn = document.getElementById('start-search-btn');

// Results
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const resultsGrid = document.getElementById('results-grid');
const matchCountBadge = document.getElementById('match-count-badge');
const downloadAllBtn = document.getElementById('download-all-btn');
const themeToggle = document.getElementById('theme-toggle');

// State
let modelsLoaded = false;
let selfieDescriptor = null;
let galleryFiles = [];
let matchedImages = [];
let stream = null;
let folderId = null;

// Config
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const BATCH_SIZE = 5;

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    // Global Error Handler
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        alert("System Error: " + msg);
        return false;
    };

    initTheme();

    // Check if FaceAPI loaded
    if (typeof faceapi === 'undefined') {
        alert("CRITICAL: AI Core failed to load. Please check your internet connection and refresh.");
        updateStatus("Failed to load AI Core.");
        return;
    }

    // Load Timeout Watchdog
    const loadTimeout = setTimeout(() => {
        if (!modelsLoaded) {
            alert("Loading is taking too long. Please check your connection.");
            updateStatus("Connection slow... keeping trying...");
        }
    }, 15000);

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const folderIdParam = urlParams.get('folder_id'); // Main Config

    // If no folder ID, we can't do much (unless manual entry was allowed, but we hid it)
    if (!folderIdParam) {
        alert("Invalid Link: No Event Folder ID provided. Please contact the administrator.");
    } else {
        folderId = folderIdParam;
        gdriveFolderInput.value = folderId;
    }

    // API KEY Logic: Use default in HTML or override if needed. 
    // Ideally, this should be proxied, but for client-side demo:
    const apiKeyParam = urlParams.get('api_key');
    if (apiKeyParam) gdriveApiKeyInput.value = apiKeyParam;

    await loadModels();
    clearTimeout(loadTimeout);

    // Auto-Fetch Gallery if folder ID exists
    if (folderId) {
        fetchGoogleDriveFiles(folderId, gdriveApiKeyInput.value);
    }
});

// --- Initialization ---

async function loadModels() {
    try {
        updateStatus('Initializing AI...');

        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Needed for Fast Mode
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL), // Needed for Fast Mode Landmarks
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        modelsLoaded = true;
        console.log('Models loaded');

        // Hide overlay only after models load
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);

        setupEventListeners();
        startCamera(); // Auto-start camera
    } catch (error) {
        console.error('Error loading models:', error);
        alert("Error loading AI models. Please refresh.");
    }
}

function updateStatus(text) {
    const p = loadingOverlay.querySelector('p');
    if (p) p.innerText = text;
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

// --- Event Listeners ---

function setupEventListeners() {
    // Theme
    themeToggle.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });

    // Tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            inputViews.forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            document.getElementById(`${target}-view`).classList.add('active');

            if (target === 'camera') startCamera();
            else stopCamera();
        });
    });

    // Capture
    captureBtn.addEventListener('click', captureSelfie);
    retakeBtn.addEventListener('click', resetSelfie);

    // Upload
    selfieDropArea.addEventListener('click', () => selfieInput.click());
    selfieInput.addEventListener('change', (e) => {
        if (e.target.files.length) processSelfieFile(e.target.files[0]);
    });

    // Search
    startSearchBtn.addEventListener('click', startProcess);

    // Download
    downloadAllBtn.addEventListener('click', downloadAllMatches);
}

// --- Camera ---

async function startCamera() {
    if (selfieDescriptor) return;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        videoFeed.srcObject = stream;
        videoFeed.onloadedmetadata = () => {
            console.log("Camera started successfully");
        };
    } catch (err) {
        console.error("Camera error:", err);
        alert("Could not access camera. Please allow camera permissions or try uploading a photo.");
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

function captureSelfie() {
    if (!videoFeed.srcObject || videoFeed.readyState !== 4) { // HAVE_ENOUGH_DATA
        // Try anyway if readyState is 0 but stream is active? No.
        // But some browsers might be tricky. Let's not block unless sure.
        // Actually, if we capture when not ready, we get black frame.
        if (videoFeed.readyState < 2) {
            alert("Camera not ready. Please wait or try refreshing.");
            return;
        }
    }

    // Check if video is actually playing (not paused)
    if (videoFeed.paused || videoFeed.ended) {
        alert("Camera stream paused or ended. Refresh and try again.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoFeed.videoWidth;
    canvas.height = videoFeed.videoHeight;
    canvas.getContext('2d').drawImage(videoFeed, 0, 0);
    setSelfiePreview(canvas.toDataURL('image/jpeg'));
    stopCamera();
}

function processSelfieFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setSelfiePreview(e.target.result);
    reader.onerror = () => alert("Error reading file.");
    reader.readAsDataURL(file);
}

// --- Modified Flow ---

function setSelfiePreview(src) {
    // Hide inputs
    document.querySelector('.tabs').style.display = 'none';
    inputViews.forEach(v => v.classList.remove('active'));

    selfiePreviewContainer.classList.remove('hidden');
    selfieImg.src = src;

    // Analyze
    analyzeSelfie(selfieImg);
}

async function analyzeSelfie(imgElement) {
    if (!imgElement.complete) await new Promise(resolve => imgElement.onload = resolve);

    // Initial check
    faceCheckStatus.innerHTML = '<span style="color:var(--text-color)">Analyzing face...</span>';

    try {
        const detection = await faceapi.detectSingleFace(imgElement, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            faceCheckStatus.innerHTML = '<span style="color:var(--error-color)">No face detected. Try again.</span>';
            alert("No face detected. Please ensure your face is clearly visible.");

            // Show retry options
            document.getElementById('action-buttons').classList.remove('hidden');
            document.getElementById('start-search-btn').classList.add('hidden'); // Hide search, only retake
            return;
        }

        selfieDescriptor = detection.descriptor;
        faceCheckStatus.innerHTML = '<span style="color:var(--success-color)">Face detected!</span>';

        // Show Options instead of buttons directly
        setTimeout(() => {
            selfiePreviewContainer.classList.add('hidden'); // Hide preview to un-clutter
            stepOptions.classList.remove('hidden');
        }, 1000);
    } catch (e) {
        console.error(e);
        alert("Error analyzing face: " + e.message);
        faceCheckStatus.innerHTML = '<span style="color:var(--error-color)">Error. Try again.</span>';
        document.getElementById('action-buttons').classList.remove('hidden');
    }
}

function resetSelfie() {
    selfieDescriptor = null;
    selfiePreviewContainer.classList.add('hidden');
    stepOptions.classList.add('hidden'); // Hide options
    actionButtons.classList.add('hidden');

    // Show inputs
    document.querySelector('.tabs').style.display = 'flex';
    const activeTab = document.querySelector('.tab-btn.active').dataset.target;
    document.getElementById(`${activeTab}-view`).classList.add('active');

    if (activeTab === 'camera') startCamera();

    faceCheckStatus.innerHTML = '<div class="spinner" style="width: 24px; height: 24px; border-width: 2px; margin: 0 auto;"></div>';
}

// --- Mode Selection ---

function selectMode(mode) {
    selectedMode = mode;
    stepOptions.classList.add('hidden');
    startProcess();
}

// --- Google Drive Fetch (Background) ---

// --- Logging ---
function log(msg, type = 'info') {
    console.log(`[${type}] ${msg}`);
    const logDiv = document.getElementById('debug-log-content');
    if (logDiv) {
        const entry = document.createElement('div');
        entry.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
        if (type === 'error') entry.style.color = '#ff5555';
        else if (type === 'success') entry.style.color = '#55ff55';
        logDiv.appendChild(entry);
        logDiv.parentElement.scrollTop = logDiv.parentElement.scrollHeight;
    }
}

// --- Google Drive Fetch (Background) ---

async function fetchGoogleDriveFiles(id, apiKey) {
    log(`Fetching Gallery ID: ${id}...`);
    // updateStatus("Fetching gallery..."); // Don't block UI

    const baseQuery = `'${id}' in parents and mimeType contains 'image/' and trashed = false`;
    const fields = "files(id, name, thumbnailLink, webContentLink)";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(baseQuery)}&key=${apiKey}&fields=${fields}&pageSize=1000`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (data.files) {
            const driveFiles = data.files.map(f => ({
                source: 'gdrive',
                name: f.name,
                url: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+$/, '=s1350') : f.webContentLink, // RESTORED: High Res for accuracy
                originalLink: f.webContentLink
            }));
            galleryFiles = driveFiles;
            log(`Loaded ${galleryFiles.length} images.`, 'success');
            totalGalleryCount.innerText = galleryFiles.length; // Live update stats
        } else {
            log("No files found in Drive.", 'error');
        }
    } catch (error) {
        log(`Fetch error: ${error.message}`, 'error');
        alert("Gallery Error: " + error.message);
    }
}

// --- Wake Lock API ---
let wakeLock = null;

async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock was released');
        });
        console.log('Wake Lock is active');
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

async function releaseWakeLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

// --- Search Process ---

async function startProcess() {
    if (!selfieDescriptor) return;

    // Prevent Sleep
    requestWakeLock();

    if (galleryFiles.length === 0) {
        alert("Still loading event photos... Please wait a moment and try again.");
        stepOptions.classList.remove('hidden'); // Go back
        return;
    }

    stepSelfie.classList.add('hidden');
    stepResults.classList.remove('hidden');
    scannerContainer.classList.remove('hidden'); // Show scanner
    totalGalleryCount.innerText = galleryFiles.length;

    resultsGrid.innerHTML = '';
    matchedImages = [];
    let processed = 0;

    // Config based on Mode
    let options;
    let threshold;

    if (selectedMode === 'fast') {
        // Fast: TinyFace, lower resolution, slightly looser threshold
        options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.45 }); // Safer resolution for mobile
        threshold = 0.45;
    } else {
        // Accurate: SSD (if possible, else TinyFace high res), strict threshold
        // Note: SSD is very slow on JS CPU. Let's use TinyFace with High Res for "Accurate" in this context to ensure usability
        // or actually use SSD if performance permits. Let's try SSD for "Accurate" as requested.
        options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        threshold = 0.45;
    }

    // Process Loop
    // OPTIMIZATION: Reduce batch size to 1 to prevent UI freeze and ensure accurate logging
    // Browser JS is single threaded. Parallel promises just queue up macrotasks.

    // Dynamic Batch Sizing
    let currentBatchSize = 1; // Start safe at 1
    let i = 0;

    while (i < galleryFiles.length) {
        // Cap max batch size based on mode
        const maxBatch = selectedMode === 'fast' ? 5 : 1;
        const actualBatchSize = Math.min(currentBatchSize, maxBatch);

        const batch = galleryFiles.slice(i, i + actualBatchSize);
        const batchStartTime = performance.now();

        // Wait for batch to finish
        await Promise.all(batch.map(async (file) => {
            let img = null;
            try {
                progressText.innerText = `Scanning: ${file.name}`;

                // Load Image with Timeout
                img = await urlToImage(file.url);

                // Extra check for valid image dimensions
                if (img.naturalWidth < 50 || img.naturalHeight < 50) {
                    log(`Skipping ${file.name}: Image too small`, 'warning');
                    return;
                }

                // Detect
                // Use detectSingleFace for speed if we only care about if THE user is in it?
                // No, we need to match against ALL faces in the image.
                // But detectAllFaces is heavy.

                let detections;
                if (selectedMode === 'fast') {
                    detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.45 }))
                        .withFaceLandmarks() // Use HEAVY landmarks for better alignment/recognition
                        .withFaceDescriptors();
                } else {
                    detections = await faceapi.detectAllFaces(img, options)
                        .withFaceLandmarks()
                        .withFaceDescriptors();
                }

                // Compare
                let bestMatch = null;
                for (const d of detections) {
                    const dist = faceapi.euclideanDistance(selfieDescriptor, d.descriptor);
                    if (dist < threshold) {
                        if (!bestMatch || dist < bestMatch.distance) bestMatch = { distance: dist };
                    }
                }

                if (bestMatch) {
                    log(`MATCH: ${file.name} (Dist: ${bestMatch.distance.toFixed(2)})`, 'success');
                    addMatchToGrid(file);
                    matchedImages.push(file);
                    matchCountBadge.innerText = matchedImages.length;
                    downloadAllBtn.classList.remove('hidden');
                }

            } catch (e) {
                log(`Error processing ${file.name}: ${e.message}`, 'error');
            } finally {
                if (img) {
                    img.src = '';
                    img.remove();
                    img = null;
                }
            }

            processed++;
            updateProgress(processed, galleryFiles.length);
        }));

        // precise garbage collection helper (yield to main thread)
        await new Promise(r => setTimeout(r, 10)); // Tiny pause to let UI breathe

        // --- ADAPTIVE LOGIC ---
        const batchDuration = performance.now() - batchStartTime;
        const avgTimePerImg = batchDuration / actualBatchSize;

        // If fast (< 200ms) and not maxed, scale up
        if (avgTimePerImg < 200 && currentBatchSize < maxBatch) {
            currentBatchSize++;
            // log(`Speeding up! Batch: ${currentBatchSize}`, 'success');
        }
        // If slow (> 500ms) and not min, scale down
        else if (avgTimePerImg > 500 && currentBatchSize > 1) {
            currentBatchSize--;
            // log(`Slowing down... Batch: ${currentBatchSize}`, 'warning');
        }

        i += actualBatchSize;
    }

    progressText.innerText = `Search Complete. Found ${matchedImages.length} photos.`;
    progressBar.style.background = 'var(--primary-color)';
    scannerContainer.classList.add('hidden'); // Hide scanner when done

    // Release Lock
    releaseWakeLock();
}

function updateProgress(current, total) {
    const p = Math.round((current / total) * 100);
    progressBar.style.width = `${p}%`;
    progressPercent.innerText = `${current} / ${total}`;
}

function addMatchToGrid(file) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
        <img src="${file.url}" loading="lazy">
        <div class="btn-group">
            <a href="${file.originalLink}" target="_blank" class="action-icon" title="View Fullsize">
                <i class="ri-eye-line"></i>
            </a>
            <a href="${file.originalLink}" download class="action-icon" title="Download">
                <i class="ri-download-2-line"></i>
            </a>
        </div>
    `;
    resultsGrid.appendChild(card);
}

function urlToImage(url) {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.crossOrigin = "anonymous";
        // Timeout
        const timer = setTimeout(() => reject(new Error("Image Load Timeout")), 8000);

        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = (e) => {
            clearTimeout(timer);
            reject(new Error("Image Load Error"));
        };
        img.src = url;
    });
}

function downloadAllMatches() {
    if (confirm(`Download ${matchedImages.length} photos? Popups must be allowed.`)) {
        matchedImages.forEach((file, i) => {
            setTimeout(() => {
                window.open(file.originalLink, '_blank');
            }, i * 500);
        });
    }
}
