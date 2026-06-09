import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

leaflet_assets = """
    <!-- Leaflet Map Assets -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
"""
text = re.sub(r'(</head>)', leaflet_assets + r'\n\1', text)

about_map_section = """
<!-- start of about-map-section -->
<style>
    .about-map-section { padding: 100px 0; background: #fff; border-bottom: 1px solid #eaeaea; }
    .about-text-col { display: flex; flex-direction: column; justify-content: center; padding-right: 50px; }
    .about-text-col h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px, 5vw, 64px); color: #222; margin-bottom: 20px; line-height: 1.1; }
    .about-text-col p { font-size: 16px; color: #666; line-height: 1.8; margin-bottom: 20px; font-family: 'Mulish', sans-serif; }
    .map-container { width: 100%; height: 550px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1; border: 1px solid #eee; overflow: hidden; position: relative; }
    
    /* Custom Leaflet Popup styling to match screenshot */
    .leaflet-popup-content-wrapper { padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
    .leaflet-popup-content { margin: 0; width: 220px !important; }
    .popup-card-img { width: 100%; height: 140px; object-fit: cover; }
    .popup-card-body { padding: 15px; }
    .popup-card-price { position: absolute; top: 105px; left: 10px; color: #fff; font-weight: 800; font-size: 14px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 99; }
    .popup-card-badge { position: absolute; top: 105px; right: 10px; background: #ffc107; color: #000; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; z-index: 99; }
    .popup-card-title { font-weight: 700; font-size: 14px; color: #222; margin-bottom: 5px; font-family: 'Mulish', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .popup-card-desc { font-size: 11px; color: #888; margin-bottom: 10px; line-height: 1.4; }
    .popup-card-btn { display: block; width: 100%; text-align: center; background: #00a896; color: #fff; padding: 8px 0; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; text-decoration: none; transition: background 0.3s; }
    .popup-card-btn:hover { background: #028a7b; color: #fff; }
    .leaflet-container a.leaflet-popup-close-button { color: #fff; top: 10px; right: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

    /* Custom Map Marker */
    .custom-marker { background: #00a896; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; }
    .custom-marker::after { content: ''; width: 6px; height: 6px; background: #fff; border-radius: 50%; }
    
    @media (max-width: 991px) {
        .about-text-col { padding-right: 15px; margin-bottom: 40px; }
        .map-container { height: 400px; }
    }
</style>

<section class="about-map-section">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-5 col-12">
                <div class="about-text-col" data-aos="fade-right" data-aos-duration="1000">
                    <h5 style="color: #c5a880; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 13px; margin-bottom: 15px;">About Us</h5>
                    <h2>Crafting Eternal Memories Across the Globe</h2>
                    <p>We are a passionate team of destination wedding photographers dedicated to capturing the raw, authentic emotions of your special day. From intimate gatherings in the hills of Kerala to grand celebrations in royal palaces, we travel wherever your love story takes us.</p>
                    <p>Explore our interactive map to see some of the beautiful destinations we've had the honor of shooting at. Every pin represents a unique love story, frozen in time with our cinematic approach.</p>
                </div>
            </div>
            <div class="col-lg-7 col-12">
                <div class="map-container" id="frontend-map" data-aos="fade-left" data-aos-duration="1000"></div>
            </div>
        </div>
    </div>
</section>
<!-- end of about-map-section -->
"""
# Assuming the hero section ends with </section> then a newline, then <!-- end of wpo-about-section -->
# But wait, earlier I checked it ends with </section> then many newlines, then <!-- end of wpo-about-section -->
match = re.search(r'</section>[\s]*<!-- end of wpo-about-section -->', text)
if match:
    text = text.replace(match.group(0), '</section>\n' + about_map_section + '\n<!-- end of wpo-about-section -->')
else:
    # Try finding <!-- end of wpo-about-section -->
    text = text.replace('<!-- end of wpo-about-section -->', about_map_section + '\n<!-- end of wpo-about-section -->')


js_logic = """
<script>
document.addEventListener('DOMContentLoaded', function() {
    const mapElement = document.getElementById('frontend-map');
    if (mapElement && typeof L !== 'undefined') {
        const map = L.map('frontend-map', { scrollWheelZoom: false }).setView([10.8505, 76.2711], 6);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        fetch('/api/map_pins')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.pins) {
                    const bounds = [];
                    data.pins.forEach(pin => {
                        const lat = parseFloat(pin.lat);
                        const lng = parseFloat(pin.lng);
                        bounds.push([lat, lng]);

                        const customIcon = L.divIcon({
                            className: 'custom-marker',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        });

                        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
                        
                        const imageHtml = pin.image_path ? `<img src="/${pin.image_path}" class="popup-card-img">` : `<div class="popup-card-img" style="background: #eee;"></div>`;
                        
                        const popupContent = `
                            <div class="popup-card">
                                <div style="position: relative;">
                                    ${imageHtml}
                                    <div class="popup-card-badge">Featured</div>
                                </div>
                                <div class="popup-card-body">
                                    <div class="popup-card-title">${pin.title}</div>
                                    <div class="popup-card-desc">${pin.description}</div>
                                    <a href="gallery.html" class="popup-card-btn">View Gallery</a>
                                </div>
                            </div>
                        `;

                        marker.bindPopup(popupContent, { minWidth: 220, closeButton: true });
                    });
                    
                    if (bounds.length > 0) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                    }
                }
            })
            .catch(err => console.error('Error fetching map pins:', err));
    }
});
</script>
"""
text = re.sub(r'(</body>)', js_logic + r'\n\1', text)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated about.html')
