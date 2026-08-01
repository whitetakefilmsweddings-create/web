import re

# 1. Read base template
with open('views/pannl/services.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Add Gallery Page to the sidebar for the new template (and set it active if we want, but services will also be active, which is fine since they are grouped)
if '<a href="/pannl/gallery.php">Gallery Page</a>' not in content:
    content = content.replace(
        '<a href="/pannl/services.php">Service Pages</a>',
        '<a href="/pannl/services.php">Service Pages</a>\n                <a href="/pannl/gallery.php">Gallery Page</a>'
    )

# 3. Replace the content-area completely
new_content_area = """
        <div class="content-area">
        <div class="page-header" id="gallery">
            <h1>Gallery Page Editor</h1>
            <p>Update the hero text and manage city locations for the main Gallery Page.</p>
        </div>
        
        <div class="sections-container" style="margin-bottom: 40px;">
            <!-- Hero Section -->
            <div class="section-card">
                <div class="section-card-title">Gallery Hero Section</div>
                
                <form class="text-update-form" data-key="gal_hero_subtitle" style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 11px; color: #777;">Subtitle / Tagline</label>
                    <input type="text" name="text_value" value="<%= getText('gal_hero_subtitle') || 'Pan-India Coverage' %>" required style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px;">
                    <button type="submit" class="upload-btn" style="padding: 8px;">Save Subtitle</button>
                    <div class="upload-status" id="text-status-gal_hero_subtitle"></div>
                </form>

                <form class="text-update-form" data-key="gal_hero_title" style="display: flex; flex-direction: column; gap: 5px; margin-top: 15px;">
                    <label style="font-size: 11px; color: #777;">Main Title (HTML allowed for breaks/spans)</label>
                    <textarea name="text_value" rows="3" style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px; font-family: monospace;"><%= getText('gal_hero_title') || 'Wedding Photographer<br><span style=\"font-style: italic; color: #333;\">Across India</span>' %></textarea>
                    <button type="submit" class="upload-btn" style="padding: 8px;">Save Title</button>
                    <div class="upload-status" id="text-status-gal_hero_title"></div>
                </form>

                <form class="text-update-form" data-key="gal_hero_desc" style="display: flex; flex-direction: column; gap: 5px; margin-top: 15px;">
                    <label style="font-size: 11px; color: #777;">Description</label>
                    <textarea name="text_value" rows="3" style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px; font-family: sans-serif;"><%= getText('gal_hero_desc') || \"Kerala's trusted wedding photographers — covering 50+ cities across India with candid, cinematic storytelling.\" %></textarea>
                    <button type="submit" class="upload-btn" style="padding: 8px;">Save Description</button>
                    <div class="upload-status" id="text-status-gal_hero_desc"></div>
                </form>
            </div>

            <!-- Manage Cities Section -->
            <div class="section-card">
                <div class="section-card-title">Manage Gallery Places</div>
                
                <form id="add-place-form" style="display: flex; flex-direction: column; gap: 10px;">
                    <label style="font-size: 11px; color: #777;">Add a New City/Location Card</label>
                    <input type="text" id="new_place_name" placeholder="City Name (e.g. Mumbai)" required style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px;">
                    <input type="text" id="new_place_state" placeholder="State (e.g. Maharashtra)" required style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px;">
                    <button type="submit" class="upload-btn" style="padding: 8px; background: #ff0000; color: #fff;">Add New Place</button>
                    <div id="add-place-status" style="font-size: 12px; margin-top: 5px; color: #ff0000;"></div>
                </form>
                
                <p style="font-size: 12px; color: #777; margin-top: 15px;">Adding a place will automatically update the gallery page grid AND generate a dedicated SEO page for that city!</p>
            </div>
        </div>
        </div>
"""

content = re.sub(r'<div class="content-area">.*?</div>\s*(<!-- ── Scripts ── -->|</script>|</body>)', new_content_area + r'\n    \1', content, flags=re.DOTALL)

# Add script for add-place
add_place_script = """
<script>
document.getElementById('add-place-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('new_place_name').value;
    const state = document.getElementById('new_place_state').value;
    const status = document.getElementById('add-place-status');
    status.innerText = 'Processing...';
    
    fetch('/pannl/add_gallery_place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, state: state })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            status.style.color = '#4aff4a';
            status.innerText = 'Place added successfully!';
            document.getElementById('new_place_name').value = '';
            document.getElementById('new_place_state').value = '';
        } else {
            status.innerText = 'Error: ' + data.message;
        }
    })
    .catch(err => {
        status.innerText = 'Error: ' + err.message;
    });
});
</script>
"""

content = content.replace('</body>', add_place_script + '\n</body>')

with open('views/pannl/gallery.ejs', 'w', encoding='utf-8') as f:
    f.write(content)
print("Generated views/pannl/gallery.ejs")
