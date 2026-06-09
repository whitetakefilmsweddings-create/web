import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add Stars to the CSS
css_injection = '''
    .popup-card-stars { color: #ffc107; font-size: 12px; margin-bottom: 5px; }
'''
text = text.replace('.leaflet-popup-content-wrapper { padding: 0;', css_injection + '    .leaflet-popup-content-wrapper { padding: 0;')

# Update the Map Center and Zoom to South India
text = text.replace('setView([10.8505, 76.2711], 6)', 'setView([10.5, 77.5], 6)')

# Update the Popup HTML to include rating stars and text exactly like Zillow
popup_replacement = '''const popupContent = `
                            <div class="popup-card">
                                <div style="position: relative;">
                                    ${imageHtml}
                                    <div class="popup-card-price" style="font-size: 16px;">Starts at ₹50,000</div>
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
                                        <button onclick="document.querySelector('.leaflet-popup-close-button').click()" style="flex: 1; background: #fff; border: 1px solid #ddd; padding: 6px; border-radius: 16px; font-size: 11px; color: #555; cursor: pointer; font-weight: bold;">Close</button>
                                        <a href="gallery.html" style="flex: 1; text-align: center; background: #00a896; color: #fff; padding: 6px; border-radius: 16px; font-size: 11px; text-decoration: none; font-weight: bold;">View</a>
                                    </div>
                                </div>
                            </div>
                        `;'''

text = re.sub(r'const popupContent = `.*?`;', popup_replacement, text, flags=re.DOTALL)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(text)

# Now update server.js to insert default pins
with open('server.js', 'r', encoding='utf-8') as f:
    server_text = f.read()

seed_script = '''
      const [existingPins] = await panlePool.query('SELECT COUNT(*) as count FROM map_pins');
      if (existingPins[0].count === 0) {
        const defaultPins = [
          ['Kochi Backwaters', 'A beautiful waterfront wedding', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg', 9.9312, 76.2673],
          ['Munnar Tea Gardens', 'Misty hills and intimate vows', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg', 10.0892, 77.0595],
          ['Ooty Hill Station', 'Classic vintage wedding style', 'https://weddingbellsstories.com/media_library/weddingbells-image-6tfhrz.jpg', 11.4102, 76.6950],
          ['Mahabalipuram Beach', 'Sunset shores in Tamil Nadu', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg', 12.6208, 80.1945],
          ['Chennai Royal Palace', 'Grandeur and elegance', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg', 13.0827, 80.2707]
        ];
        for (const pin of defaultPins) {
          await panlePool.query('INSERT INTO map_pins (title, description, image_path, lat, lng) VALUES (?, ?, ?, ?, ?)', pin);
        }
      }
'''

# Insert right after the CREATE TABLE for map_pins
server_text = re.sub(r'(CREATE TABLE IF NOT EXISTS map_pins[\s\S]*?\)\s*`);)', r'\1\n' + seed_script, server_text)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(server_text)

print('Updated both about.html and server.js')
