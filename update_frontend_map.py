import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update text content
new_text_content = '''
                    <h5 style="color: #c5a880; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 13px; margin-bottom: 15px;">About WhiteTake Films</h5>
                    <h2 style="font-size: clamp(32px, 4vw, 48px); margin-bottom: 25px;">Capturing Timeless Stories With Elegance & Emotion</h2>
                    <p>At WhiteTake Films, we believe every wedding is a once-in-a-lifetime story that deserves to be captured with elegance, emotion, and authenticity. Based in Trivandrum, we are a premium wedding photography and filmmaking team dedicated to transforming beautiful moments into timeless memories.</p>
                    <p>With over <strong>250+ happy couples served</strong> and <strong>300+ events successfully covered</strong>, we have built our reputation on trust, creativity, and exceptional client satisfaction. Our passion goes beyond taking photographs—we craft visual stories that preserve emotions, relationships, and unforgettable moments for generations to come.</p>
                    <p>What sets WhiteTake Films apart is our commitment to delivering results that go beyond expectations. Along with premium photography, cinematic wedding films, and luxury album design, we are known for our <strong>fast and reliable delivery process</strong>.</p>
                    <p><strong>Trusted by 250+ couples, covering 300+ events, delivering premium memories across India — WhiteTake Films is where beautiful moments become timeless stories.</strong></p>
'''

# Find the old text col content and replace it
text = re.sub(r'<h5 style="color: #c5a880.*?</p>\s*</div>', new_text_content.strip() + '\n                </div>', text, flags=re.DOTALL)


# 2. Replace Leaflet CSS/JS and add Vector Map CSS
vector_map_css = '''
    /* Vector Map Styles */
    .map-container { width: 100%; height: auto; padding-bottom: 100%; border-radius: 12px; z-index: 1; border: none; overflow: visible; position: relative; background: transparent; box-shadow: none; }
    .vector-map-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0.9; }
    
    .custom-marker { position: absolute; background: #000; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.4); width: 20px; height: 20px; transform: translate(-50%, -50%); cursor: pointer; transition: transform 0.3s; z-index: 10; }
    .custom-marker:hover { transform: translate(-50%, -50%) scale(1.2); }
    .custom-marker::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background: #fff; border-radius: 50%; }
    
    /* Popup styling */
    .custom-popup { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(20px); width: 240px; background: #fff; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 20; padding: 0; overflow: hidden; pointer-events: none; }
    .custom-popup.active { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); pointer-events: auto; }
    
    .popup-card-stars { color: #333; font-size: 12px; margin-bottom: 5px; }
    .popup-card-img { width: 100%; height: 140px; object-fit: cover; }
    .popup-card-body { padding: 15px; }
    .popup-card-price { position: absolute; top: 105px; left: 10px; color: #fff; font-weight: 800; font-size: 14px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 99; }
    .popup-card-badge { position: absolute; top: 105px; right: 10px; background: #000; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; z-index: 99; }
    .popup-card-title { font-weight: 700; font-size: 14px; color: #222; margin-bottom: 5px; font-family: 'Mulish', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .popup-card-desc { font-size: 11px; color: #888; margin-bottom: 10px; line-height: 1.4; }
    
    .popup-close-btn { position: absolute; top: 10px; right: 10px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); cursor: pointer; font-size: 18px; z-index: 100; font-weight: bold; }
'''
# Remove leaflet assets from head
text = re.sub(r'<!-- Leaflet Map Assets -->.*?</script>', '', text, flags=re.DOTALL)
# Replace map container css with vector map css
text = re.sub(r'\.map-container \{.*?\}', vector_map_css.strip(), text, flags=re.DOTALL)
# Remove old leaflet popup css
text = re.sub(r'/\* Custom Leaflet Popup styling.*?\*/.*?(/\* Custom Map Marker \*/)', r'\1', text, flags=re.DOTALL)
# Remove leaflet custom marker CSS since we redefine it
text = re.sub(r'/\* Custom Map Marker \*/.*?@media', '@media', text, flags=re.DOTALL)

# 3. Update HTML Map Container
new_html_map = '''<div class="map-container" id="frontend-map" data-aos="fade-left" data-aos-duration="1000">
                    <img src="assets/images/vector_map.svg" class="vector-map-bg" alt="South India Vector Map">
                    <div id="pins-layer"></div>
                </div>'''
text = re.sub(r'<div class="map-container".*?</div>', new_html_map.strip(), text, flags=re.DOTALL)

# 4. Replace Leaflet JS Logic with custom JS Logic
new_js_logic = '''<script>
document.addEventListener('DOMContentLoaded', function() {
    const pinsLayer = document.getElementById('pins-layer');
    if (pinsLayer) {
        fetch('/api/map_pins')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.pins) {
                    let firstPin = true;
                    
                    data.pins.forEach(pin => {
                        const marker = document.createElement('div');
                        marker.className = 'custom-marker';
                        marker.style.left = pin.pos_x + '%';
                        marker.style.top = pin.pos_y + '%';
                        
                        const imageHtml = pin.image_path ? `<img src="/${pin.image_path}" class="popup-card-img">` : `<div class="popup-card-img" style="background: #eee;"></div>`;
                        
                        const popupContent = `
                            <div class="custom-popup ${firstPin ? 'active' : ''}">
                                <div class="popup-close-btn">&times;</div>
                                <div style="position: relative;">
                                    ${imageHtml}
                                    <div class="popup-card-price">Starts at ₹50,000</div>
                                    <div class="popup-card-badge">Featured</div>
                                </div>
                                <div class="popup-card-body">
                                    <div class="popup-card-title">${pin.title}</div>
                                    <div class="popup-card-stars">
                                        <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star-half-alt"></i>
                                    </div>
                                    <div class="popup-card-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pin.description}</div>
                                    <div style="display: flex; gap: 10px; margin-bottom: 10px; font-size: 11px; color: #555;">
                                        <span><i class="fa fa-camera"></i> 3 Shooters</span>
                                        <span><i class="fa fa-video"></i> Cinematic</span>
                                    </div>
                                    <div style="display: flex; gap: 5px;">
                                        <a href="gallery.html" style="flex: 1; text-align: center; background: #000; color: #fff; padding: 6px; border-radius: 16px; font-size: 11px; text-decoration: none; font-weight: bold; transition: 0.3s;">View Gallery</a>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        marker.innerHTML = popupContent;
                        
                        // Close btn logic
                        const closeBtn = marker.querySelector('.popup-close-btn');
                        closeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            marker.querySelector('.custom-popup').classList.remove('active');
                        });
                        
                        // Marker click logic
                        marker.addEventListener('click', () => {
                            // Close all others
                            document.querySelectorAll('.custom-popup').forEach(p => p.classList.remove('active'));
                            // Open this
                            marker.querySelector('.custom-popup').classList.add('active');
                        });
                        
                        pinsLayer.appendChild(marker);
                        firstPin = false;
                    });
                }
            })
            .catch(err => console.error('Error fetching map pins:', err));
    }
});
</script>'''

text = re.sub(r'<script>\s*document\.addEventListener\(\'DOMContentLoaded\', function\(\) \{\s*const mapElement = document\.getElementById\(\'frontend-map\'\);.*?</script>', new_js_logic.strip(), text, flags=re.DOTALL)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated about.html frontend map')
