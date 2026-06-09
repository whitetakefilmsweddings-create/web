import re

# 1. Fix SVG ViewBox to be perfectly square
with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

svg = svg.replace('viewBox="160 420 260 270"', 'viewBox="155 420 270 270"')

with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'w', encoding='utf-8') as f:
    f.write(svg)


# 2. Fix about.html CSS and JS for popups
with open('c:/Users/admin/Desktop/public_html/about.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update CSS for marker wrapper
wrapper_css = """
    /* Map Marker Wrapper */
    .marker-wrapper { position: absolute; transform: translate(-50%, -100%); z-index: 100; cursor: default; }
    .custom-marker { width: 24px; height: 32px; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="%23d35400"/></svg>') no-repeat center center; background-size: contain; cursor: pointer; transition: transform 0.3s; margin: 0 auto; }
    .custom-marker:hover { transform: scale(1.1); }
    .custom-marker-label { color: #333; font-size: 11px; white-space: nowrap; pointer-events: none; font-weight: 700; font-family: 'Mulish', sans-serif; text-align: center; margin-top: 5px; text-shadow: 0 0 3px #fff; }
    
    /* Popup styling */
    .custom-popup { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%) translateY(20px); width: 240px; background: #fff; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 9999; padding: 0; overflow: hidden; pointer-events: none; cursor: default; }
    .custom-popup.active { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); pointer-events: auto; }
"""

# Replace old CSS
html = re.sub(r'\.custom-marker \{ position: absolute;.*?\.custom-popup\.active \{.*?\}', wrapper_css.strip(), html, flags=re.DOTALL)


# Update JS logic
new_js = """
                    data.pins.forEach(pin => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'marker-wrapper';
                        wrapper.style.left = pin.pos_x + '%';
                        wrapper.style.top = pin.pos_y + '%';
                        
                        const imageHtml = pin.image_path ? `<img src="/${pin.image_path}" class="popup-card-img">` : `<div class="popup-card-img" style="background: #eee;"></div>`;
                        
                        const popupContent = `
                            <div class="custom-marker"></div>
                            <div class="custom-marker-label">${pin.title}</div>
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
                        
                        wrapper.innerHTML = popupContent;
                        
                        const markerIcon = wrapper.querySelector('.custom-marker');
                        const popup = wrapper.querySelector('.custom-popup');
                        const closeBtn = wrapper.querySelector('.popup-close-btn');
                        
                        // Close button logic
                        closeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            popup.classList.remove('active');
                        });
                        
                        // Marker icon logic
                        markerIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            // Close all others
                            document.querySelectorAll('.custom-popup').forEach(p => p.classList.remove('active'));
                            // Open this
                            popup.classList.add('active');
                        });
                        
                        pinsLayer.appendChild(wrapper);
                        firstPin = false;
                    });
"""

html = re.sub(r'data\.pins\.forEach\(pin => \{.*?firstPin = false;\s*\}\);', new_js.strip(), html, flags=re.DOTALL)

with open('c:/Users/admin/Desktop/public_html/about.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed popups and SVG aspect ratio!")
