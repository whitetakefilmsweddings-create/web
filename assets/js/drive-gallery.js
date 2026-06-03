/**
 * Google Drive Gallery Loader
 * Loads images from a specific public Google Drive folder for the Gallery page
 */

// Google Drive API Configuration
const API_KEY = 'AIzaSyAxoP_13cWEwsr0jzH4Tj51yWPe7f-SNEQ';
const GALLERY_FOLDER_ID = '1GL61rygEfYc1r1xZVxGFzMlAioOYWKyM'; // User provided folder

const DRIVE_BASE_URL = 'https://drive.google.com/uc?export=view&id=';
const DRIVE_THUMBNAIL_URL = 'https://drive.google.com/thumbnail?id=';

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
 * Get direct image URL from Google Drive file ID
 */
function getDriveImageUrl(file, size = 'full') {
    if (!file.thumbnailLink) {
        return `${DRIVE_BASE_URL}${file.id}`;
    }

    const baseUrl = file.thumbnailLink.split('=')[0];

    if (size === 'thumbnail') {
        return `${baseUrl}=s400`;
    }
    return `${baseUrl}=s0`; // Original size
}

/**
 * Create a gallery item HTML for an image
 */
function createGalleryItem(imageUrl, altText = 'Gallery Image') {
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
 * Create a footer instagram item HTML
 */
function createFooterItem(imageUrl, altText = 'Instagram Image') {
    return `
        <li>
            <a href="${imageUrl}" class="fancybox" data-fancybox-group="footer-gall">
                <img src="${imageUrl}" alt="${altText}" loading="lazy">
            </a>
        </li>
    `;
}

/**
 * Initialize the Gallery Page
 */
async function initGallery(files) {
    const container = document.querySelector('.gallery-container');
    if (!container) return;

    console.log('Initializing Main Gallery...');

    if (!files || files.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>No images found.</p></div>';
        return;
    }

    let galleryHTML = '';
    files.forEach((file) => {
        galleryHTML += createGalleryItem(getDriveImageUrl(file), file.name);
    });

    container.innerHTML = galleryHTML;
}

/**
 * Initialize the Footer Instagram Widget
 */
async function initFooterInstagram(files) {
    const container = document.getElementById('instagram-footer-list');
    if (!container) return;

    console.log('Initializing Footer Instagram...');

    // Take first 6 files
    const footerFiles = files.slice(0, 6);

    let footerHTML = '';
    footerFiles.forEach((file) => {
        // Use thumbnail size to save bandwidth
        footerHTML += createFooterItem(getDriveImageUrl(file, 'thumbnail'), file.name);
    });

    container.innerHTML = footerHTML;
}

const ABOUT_FOLDER_ID = '1QfXgZ76rDOwOqMJ2QewHqgW_tFTVUbZ-'; // About section folder

/**
 * Initialize the About Section Gallery (Paged Grid Carousel)
 */
async function initAboutGallery(files) {
    const container = document.getElementById('about-gallery-grid');
    if (!container) return;

    console.log('Initializing About Gallery Paged Grid...');

    if (!files || files.length === 0) {
        container.innerHTML = '<p>No images found.</p>';
        return;
    }

    // Chunk files into groups of 5
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < files.length; i += chunkSize) {
        chunks.push(files.slice(i, i + chunkSize));
    }

    // Build Carousel HTML Structure
    let galleryHTML = '<div class="about-gallery-slider owl-carousel owl-theme">';

    chunks.forEach((chunk) => {
        // Only render chunks that have enough images to look decent (at least 3?)
        // Or just render all. If a chunk has < 5, the CSS nth-child logic will just hide missing ones or show blanks.
        // Let's ensure we fill gaps if needed? No, just render what we have.

        galleryHTML += '<div class="item"><div class="about-gallery-page">';

        chunk.forEach((file) => {
            galleryHTML += `
                <div class="about-grid-item">
                    <img src="${getDriveImageUrl(file)}" alt="${file.name}" loading="lazy">
                </div>
            `;
        });

        galleryHTML += '</div></div>';
    });

    galleryHTML += '</div>';
    container.innerHTML = galleryHTML;

    // Initialize Owl Carousel
    if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
        var $carousel = $('.about-gallery-slider');
        $carousel.owlCarousel({
            loop: true,
            margin: 0,
            nav: false,
            dots: false,
            autoplay: true,
            autoplayTimeout: 10000, // 10s delay
            smartSpeed: 800,
            items: 1, // Show 1 "Page" (Grid) at a time
            // animateOut: 'fadeOut', // Removed fade to allow slide effect if preferred, or just to clean up
        });
    }
}

/**
 * Main Initialization
 */
async function init() {
    // Check if we need to load anything
    const hasGallery = document.querySelector('.gallery-container');
    const hasFooter = document.getElementById('instagram-footer-list');
    const hasAbout = document.getElementById('about-gallery-grid');

    if (!hasGallery && !hasFooter && !hasAbout) return;

    // Fetch files for Main Gallery and Footer
    if (hasGallery || hasFooter) {
        const files = await listFiles(GALLERY_FOLDER_ID);

        if (hasGallery) {
            await initGallery(files);
        }

        if (hasFooter) {
            await initFooterInstagram(files);
        }
    }

    // Fetch files for About Section
    if (hasAbout) {
        const aboutFiles = await listFiles(ABOUT_FOLDER_ID);
        await initAboutGallery(aboutFiles);
    }

    // Re-initialize fancybox globally if needed
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

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);
