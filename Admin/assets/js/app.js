// assets/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // Add simple touch feedback
    const touchElements = document.querySelectorAll('.card, .btn');
    
    touchElements.forEach(el => {
        el.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });
        el.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });
});
