/**
 * Dynamic Header Background Image Loader
 * Fetches the background image for the page header title section from the admin panel database
 */
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    let pageName = '';

    // Map the pathname to the database page_name
    if (path.includes('about.html') || path.endsWith('/about')) {
        pageName = 'about';
    } else if (path.includes('wedding-photography.html') || path.endsWith('/wedding-photography')) {
        pageName = 'wedding-photography';
    } else if (path.includes('cinematic-wedding-films.html') || path.endsWith('/cinematic-wedding-films')) {
        pageName = 'cinematic-wedding-films';
    } else if (path.includes('pre-wedding-shoots.html') || path.endsWith('/pre-wedding-shoots')) {
        pageName = 'pre-wedding-shoots';
    } else if (path.includes('engagement-reception.html') || path.endsWith('/engagement-reception')) {
        pageName = 'engagement-reception';
    } else if (path.includes('drone-coverage.html') || path.endsWith('/drone-coverage')) {
        pageName = 'drone-coverage';
    } else if (path.includes('albums-prints.html') || path.endsWith('/albums-prints')) {
        pageName = 'albums-prints';
    } else if (path.includes('gallery.html') || path.endsWith('/gallery')) {
        pageName = 'gallery';
    } else if (path.includes('contact.html') || path.endsWith('/contact')) {
        pageName = 'contact';
    }

    if (pageName) {
        const headerSection = document.querySelector('.wpo-page-title');
        if (headerSection) {
            fetch('/pannl/api.php?page=' + pageName)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.images) {
                        // Find the title background image key
                        const bgKey = Object.keys(data.images).find(k => k.endsWith('_title_bg'));
                        if (bgKey && data.images[bgKey]) {
                            let imgPath = data.images[bgKey];
                            
                            // Format path
                            if (!imgPath.match(/^https?:\/\//) && !imgPath.startsWith('/')) {
                                imgPath = '/' + imgPath;
                            }
                            
                            // Apply background image
                            headerSection.style.backgroundImage = 'url("' + imgPath + '")';
                            headerSection.style.backgroundSize = 'cover';
                            headerSection.style.backgroundPosition = 'center';
                            
                            // Mark as custom set so Google Drive script doesn't overwrite it
                            headerSection.setAttribute('data-custom-bg-set', 'true');
                        }
                    }
                })
                .catch(err => console.error('Error loading custom header image:', err));
        }
    }
});
