import re

with open('views/pannl/about.ejs', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Leaflet CSS/JS
text = re.sub(r'<!-- Leaflet Map Assets -->.*?</style>', '''<!-- Vector Map Assets -->
    <style>
        .map-card { background-color: #111; border: 1px solid #1c1c1c; border-radius: 16px; padding: 25px; transition: transform 0.3s; }
        .map-card-title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #fff; border-bottom: 1px solid #222; padding-bottom: 10px; margin-bottom: 15px; }
        
        .vector-map-wrapper { position: relative; width: 100%; max-width: 400px; margin: 0 auto 20px auto; border-radius: 12px; background: #fff; overflow: hidden; border: 1px solid #333; cursor: crosshair; }
        .vector-map-img { width: 100%; display: block; }
        .admin-map-pin { position: absolute; width: 16px; height: 16px; background: #000; border: 2px solid #fff; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        
        .pin-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-top: 20px; }
        .pin-item { background: #050505; border: 1px solid #222; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 8px; }
        .pin-item img { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; }
        .pin-item-title { font-weight: 700; color: #fff; font-size: 14px; }
        .pin-item-desc { color: #888; font-size: 12px; }
        .pin-delete-btn { background: #ff4a4a; color: #fff; border: none; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; text-align: center; }
    </style>''', text, flags=re.DOTALL)

# Replace the Map UI
map_ui_old = '''<div id="admin-map"></div>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="pin-lat" placeholder="Latitude" readonly style="background: #000; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; flex: 1; font-family: monospace; font-size: 12px;">
                        <input type="text" id="pin-lng" placeholder="Longitude" readonly style="background: #000; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; flex: 1; font-family: monospace; font-size: 12px;">
                    </div>'''

map_ui_new = '''<div class="vector-map-wrapper" id="admin-map-wrapper">
                        <img src="/assets/images/vector_map.svg" class="vector-map-img" alt="Map">
                        <div class="admin-map-pin" id="admin-marker" style="left: 50%; top: 50%;"></div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="pin-x" placeholder="X %" readonly style="background: #000; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; flex: 1; font-family: monospace; font-size: 12px;">
                        <input type="text" id="pin-y" placeholder="Y %" readonly style="background: #000; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; flex: 1; font-family: monospace; font-size: 12px;">
                    </div>'''
text = text.replace(map_ui_old, map_ui_new)

# Replace lat/lng output in list
text = text.replace('<%= pin.lat %>, <%= pin.lng %>', 'X: <%= pin.pos_x %>%, Y: <%= pin.pos_y %>%')

# Replace JS logic
js_logic_old_pattern = r'// --- Interactive Map Editor Logic ---.*?function deleteMapPin'
js_logic_new = '''// --- Vector Map Editor Logic ---
        document.addEventListener('DOMContentLoaded', function() {
            const mapWrapper = document.getElementById('admin-map-wrapper');
            const adminMarker = document.getElementById('admin-marker');
            const pinXInput = document.getElementById('pin-x');
            const pinYInput = document.getElementById('pin-y');
            
            if (mapWrapper) {
                // Default center
                pinXInput.value = '50.00';
                pinYInput.value = '50.00';
                
                mapWrapper.addEventListener('click', function(e) {
                    const rect = mapWrapper.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const percentX = (x / rect.width) * 100;
                    const percentY = (y / rect.height) * 100;
                    
                    adminMarker.style.left = percentX + '%';
                    adminMarker.style.top = percentY + '%';
                    
                    pinXInput.value = percentX.toFixed(2);
                    pinYInput.value = percentY.toFixed(2);
                });
            }
            
            const addPinForm = document.getElementById('add-pin-form');
            if (addPinForm) {
                addPinForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const title = document.getElementById('pin-title').value;
                    const desc = document.getElementById('pin-desc').value;
                    const posX = document.getElementById('pin-x').value;
                    const posY = document.getElementById('pin-y').value;
                    const fileInput = document.getElementById('pin-image');
                    const status = document.getElementById('pin-status');
                    
                    if (!posX || !posY) {
                        status.style.color = '#ff4a4a';
                        status.innerText = 'Please click on the map to select a location.';
                        return;
                    }
                    
                    if (!fileInput.files || !fileInput.files[0]) {
                        status.style.color = '#ff4a4a';
                        status.innerText = 'Please select an image.';
                        return;
                    }
                    
                    status.style.color = '#aaa';
                    status.innerText = 'Uploading...';
                    
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('description', desc);
                    formData.append('pos_x', posX);
                    formData.append('pos_y', posY);
                    formData.append('image', fileInput.files[0]);
                    
                    fetch('/pannl/add_map_pin', {
                        method: 'POST',
                        body: formData
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            status.style.color = '#4aff4a';
                            status.innerText = 'Map pin added successfully!';
                            setTimeout(() => window.location.reload(), 1000);
                        } else {
                            status.style.color = '#ff4a4a';
                            status.innerText = 'Error: ' + res.message;
                        }
                    })
                    .catch(err => {
                        status.style.color = '#ff4a4a';
                        status.innerText = 'Server error.';
                    });
                });
            }
        });
        
        function deleteMapPin'''

text = re.sub(js_logic_old_pattern, js_logic_new, text, flags=re.DOTALL)

with open('views/pannl/about.ejs', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated about.ejs')
