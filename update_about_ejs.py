with open('views/pannl/about.ejs', 'r', encoding='utf-8') as f:
    text = f.read()

import re

leaflet_assets = """
    <!-- Leaflet Map Assets -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        .map-card { background-color: #111; border: 1px solid #1c1c1c; border-radius: 16px; padding: 25px; transition: transform 0.3s; }
        .map-card-title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #fff; border-bottom: 1px solid #222; padding-bottom: 10px; margin-bottom: 15px; }
        #admin-map { height: 300px; width: 100%; border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; z-index: 1; }
        .pin-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-top: 20px; }
        .pin-item { background: #050505; border: 1px solid #222; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 8px; }
        .pin-item img { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; }
        .pin-item-title { font-weight: 700; color: #fff; font-size: 14px; }
        .pin-item-desc { color: #888; font-size: 12px; }
        .pin-delete-btn { background: #ff4a4a; color: #fff; border: none; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; text-align: center; }
    </style>
"""
text = re.sub(r'(</head>)', leaflet_assets + r'\n\1', text)

map_html = """
        <!-- Interactive Map Editor Section -->
        <div class="page-header" id="about-map" style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 40px;">
            <h1>Interactive Map Editor</h1>
            <p>Add map pins for your destination weddings to be displayed on the About Us page.</p>
        </div>

        <div class="map-card" style="margin-bottom: 60px;">
            <div class="map-card-title">Add a New Location Pin</div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 30px;">
                <!-- Left: Map to pick location -->
                <div style="flex: 1; min-width: 300px;">
                    <p style="font-size: 13px; color: #aaa; margin-bottom: 10px;">Click anywhere on the map to set the exact pin location.</p>
                    <div id="admin-map"></div>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="pin-lat" placeholder="Latitude" readonly style="background: #000; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; flex: 1; font-family: monospace; font-size: 12px;">
                        <input type="text" id="pin-lng" placeholder="Longitude" readonly style="background: #000; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; flex: 1; font-family: monospace; font-size: 12px;">
                    </div>
                </div>

                <!-- Right: Form -->
                <div style="flex: 1; min-width: 300px;">
                    <form id="add-pin-form" style="display: flex; flex-direction: column; gap: 15px;">
                        <div>
                            <label style="display: block; font-size: 12px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Title</label>
                            <input type="text" id="pin-title" placeholder="e.g. Destination: Kurmathoor Mana" required style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Short Description</label>
                            <input type="text" id="pin-desc" placeholder="e.g. KRISHNA & CONNOR" required style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Popup Cover Image</label>
                            <div class="file-input-wrapper" style="height: 40px;">
                                <span class="file-input-label" id="pin-file-label">Choose Image</span>
                                <input type="file" id="pin-image" accept="image/*" required onchange="document.getElementById('pin-file-label').innerText = this.files[0] ? this.files[0].name : 'Choose Image'">
                            </div>
                        </div>
                        <button type="submit" class="upload-btn" style="background: #ff0000; color: #fff; margin-top: 10px;">Add Map Pin</button>
                        <div id="pin-status" style="font-size: 12px; text-align: center; margin-top: 5px;"></div>
                    </form>
                </div>
            </div>

            <div class="map-card-title" style="margin-top: 40px; border-top: 1px solid #222; padding-top: 30px;">Current Map Pins</div>
            <div class="pin-list" id="current-pins">
                <% if (typeof map_pins !== 'undefined' && map_pins.length > 0) { %>
                    <% map_pins.forEach(function(pin) { %>
                        <div class="pin-item" id="pin-card-<%= pin.id %>">
                            <% if(pin.image_path) { %><img src="/<%= pin.image_path %>" alt="Pin Image"><% } %>
                            <div class="pin-item-title"><%= pin.title %></div>
                            <div class="pin-item-desc"><%= pin.description %></div>
                            <div style="font-family: monospace; font-size: 11px; color: #555;"><i class="fa fa-map-marker-alt"></i> <%= pin.lat %>, <%= pin.lng %></div>
                            <button class="pin-delete-btn" onclick="deleteMapPin(<%= pin.id %>)"><i class="fa fa-trash"></i> Remove Pin</button>
                        </div>
                    <% }) %>
                <% } else { %>
                    <p style="color: #555; font-size: 13px;">No map pins added yet.</p>
                <% } %>
            </div>
        </div>
"""

text = re.sub(r'(<!-- YouTube Video Editor Section -->)', map_html + r'\n        \1', text)

js_logic = """
        // --- Interactive Map Editor Logic ---
        let adminMap, adminMarker;
        
        document.addEventListener('DOMContentLoaded', function() {
            const mapContainer = document.getElementById('admin-map');
            if (mapContainer && typeof L !== 'undefined') {
                adminMap = L.map('admin-map').setView([10.8505, 76.2711], 6);
                
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(adminMap);
                
                adminMarker = L.marker([10.8505, 76.2711]).addTo(adminMap);
                document.getElementById('pin-lat').value = '10.850500';
                document.getElementById('pin-lng').value = '76.271100';
                
                adminMap.on('click', function(e) {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    adminMarker.setLatLng([lat, lng]);
                    document.getElementById('pin-lat').value = lat.toFixed(6);
                    document.getElementById('pin-lng').value = lng.toFixed(6);
                });
            }
            
            const addPinForm = document.getElementById('add-pin-form');
            if (addPinForm) {
                addPinForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const title = document.getElementById('pin-title').value;
                    const desc = document.getElementById('pin-desc').value;
                    const lat = document.getElementById('pin-lat').value;
                    const lng = document.getElementById('pin-lng').value;
                    const fileInput = document.getElementById('pin-image');
                    const status = document.getElementById('pin-status');
                    
                    if (!lat || !lng) {
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
                    formData.append('lat', lat);
                    formData.append('lng', lng);
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
        
        function deleteMapPin(id) {
            if (!confirm('Are you sure you want to delete this map pin?')) return;
            fetch('/pannl/delete_map_pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            })
            .then(r => r.json())
            .then(res => {
                if(res.success) {
                    const card = document.getElementById('pin-card-' + id);
                    if (card) card.remove();
                } else {
                    alert('Error: ' + res.message);
                }
            });
        }
"""
text = re.sub(r'(</script>\s*</body>)', js_logic + r'\n\1', text)

with open('views/pannl/about.ejs', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated about.ejs')
