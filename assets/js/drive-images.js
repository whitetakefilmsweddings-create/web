/**
 * Google Drive Image Loader
 * Loads images from public Google Drive folders for service pages
 */

// Google Drive API Configuration
const API_KEY = 'AIzaSyAxoP_13cWEwsr0jzH4Tj51yWPe7f-SNEQ';
const MAIN_SERVICES_FOLDER_ID = '13fHHVm4BYF2ggueAhANj7GHa4INThUuM';

const DRIVE_BASE_URL = 'https://drive.google.com/uc?export=view&id=';
const DRIVE_THUMBNAIL_URL = 'https://drive.google.com/thumbnail?id=';

// Specific folder IDs (highest priority)
const CATEGORY_FOLDER_IDS = {
    'wedding-photography': '14SkCh6lHHdrgDqqZOMiBnFzdkfRYEbRW',
    'pre-wedding-shoots': '1lJT9IBd-KSm2sArIKe0a1Jxk6Nzfxr1I',
    'engagement-reception': '1va2IqFft49uV_TsDazvfXp36BYyFZTNQ',
    'cinematic-wedding-films': '18r8uAW0ejeQN10QBsIXgUY07Ha-E_E3G',
    'albums-prints': '1obPr4wlABP64T-lZQOwAdoQrZ5v46Izh',
    'drone-coverage': '1fUF8iuuokUO4lSbNJx9kQwp-p081aYqn',
    // Add other IDs here if you want to skip name-based discovery
};

// Service folder names (fallback) - These match the subfolder names in your main Drive folder
const CATEGORY_NAMES = {
    'wedding-photography': 'Wedding Photography',
    'cinematic-wedding-films': 'Cinematic Wedding Films',
    'pre-wedding-shoots': 'Pre-Wedding Shoots',
    'engagement-reception': 'Engagement & Reception',
    'drone-coverage': 'Drone Coverage',
    'albums-prints': 'Albums & Prints'
};

/**
 * Lists files in a specific Google Drive folder using API v3
 */
async function listFiles(folderId) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name,thumbnailLink)&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error('Error fetching file list from Google Drive:', error);
        return [];
    }
}

/**
 * Finds a subfolder by name within the main Services folder
 */
async function findSubfolder(folderName) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${MAIN_SERVICES_FOLDER_ID}'+in+parents+and+name='${folderName}'+and+mimeType='application/vnd.google-apps.folder'&fields=files(id)&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
        console.error(`Error finding subfolder ${folderName}:`, error);
        return null;
    }
}

/**
 * Get direct image URL from Google Drive file ID
 */
function getDriveImageUrl(file, size = 'full') {
    if (!file.thumbnailLink) {
        // Fallback to basic link if thumbnailLink is missing
        return `${DRIVE_BASE_URL}${file.id}`;
    }

    // Replace the default size parameter (usually =s220) with high-quality parameters
    // =s0 provides the original resolution
    const baseUrl = file.thumbnailLink.split('=')[0];

    if (size === 'thumbnail') {
        return `${baseUrl}=s400`;
    }
    return `${baseUrl}=s0`;
}

/**
 * Create a gallery item HTML for an image
 */
function createGalleryItem(imageUrl, altText = 'Service Image') {
    return `
        <div class="grid">
            <div class="img-holder">
                <a href="${imageUrl}" class="fancybox" data-fancybox-group="gall-1">
                    <img src="${imageUrl}" alt="${altText}" class="img img-responsive" loading="lazy">
                </a>
            </div>
        </div>
    `;
}

/**
 * Initialize a service page by category
 */
async function initServicePage(category, galleryContainerId) {
    console.log(`Initializing page for ${category}...`);

    // 1. Check for specific folder ID first
    let subfolderId = CATEGORY_FOLDER_IDS[category];

    // 2. If no specific ID, try to find it by name in the main folder
    if (!subfolderId) {
        const folderName = CATEGORY_NAMES[category];
        if (folderName) {
            console.log(`Searching for folder named "${folderName}"...`);
            subfolderId = await findSubfolder(folderName);
        }
    }

    if (!subfolderId) {
        console.warn(`No folder found for ${category}. Ensure CATEGORY_FOLDER_IDS is set or folder exists in Drive.`);
        return;
    }

    const files = await listFiles(subfolderId);
    if (files.length === 0) {
        console.warn(`No images found in Drive folder for ${category} (ID: ${subfolderId}).`);
        return;
    }

    // Set Hero Background
    const heroFile = files.find(f => f.name.toLowerCase().includes('hero')) || files[0];
    const heroSection = document.querySelector('.wpo-page-title');
    if (heroSection && heroFile) {
        heroSection.style.backgroundImage = `url('${getDriveImageUrl(heroFile)}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
    }

    // Load Gallery
    const container = document.getElementById(galleryContainerId);
    if (container) {
        let galleryHTML = '';
        files.forEach((file) => {
            galleryHTML += createGalleryItem(getDriveImageUrl(file), file.name);
        });

        container.innerHTML = galleryHTML;

        // Re-initialize fancybox
        if (typeof $ !== 'undefined' && $.fn.fancybox) {
            $(".fancybox").fancybox({
                openEffect: 'elastic',
                closeEffect: 'elastic',
                helpers: {
                    title: { type: 'inside' }
                }
            });
        }
    }
}

// Export functions for window
window.DriveImages = {
    init: initServicePage
};
