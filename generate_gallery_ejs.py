import re

with open('views/pannl/gallery.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace titles
content = content.replace('Services Page Configuration', 'Gallery Page Configuration')
content = content.replace('services.php', 'gallery.php')
content = content.replace("section_key.startsWith('srv_')", "section_key.startsWith('gal_')")

# The services page probably has specific sections. Let's write a whole new body inner HTML for the main container.
# Instead of complex regex on the EJS, I will just overwrite the main content block.

new_ejs = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery Page - WhiteTake Films Admin Panel</title>
    <!-- Fonts & Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;600;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- TinyMCE -->
    <script src="https://cdn.tiny.cloud/1/653fpxf9l28gchwpsh0v9c5d01y7558g6i9s74j14x20s89w/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
    <link rel="stylesheet" href="/assets/css/admin.css">
    <style>
        .page-content { padding: 30px; background: #f8f9fa; min-height: 100vh; }
        .section-card { background: #fff; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .section-title { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #444; }
        .form-control { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; }
        .btn-primary { background: #d4af37; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-danger { background: #dc3545; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .places-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .place-card { background: #f8f9fa; border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; }
        .place-card img { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <%- include('partials/sidebar') %>

        <div class="main-content">
            <header class="topbar">
                <div class="topbar-title">
                    <h1>Gallery Page Configuration</h1>
                </div>
            </header>

            <div class="page-content">
                <!-- Hero Section Editor -->
                <div class="section-card">
                    <h2 class="section-title"><i class="fa-solid fa-heading"></i> Hero Section</h2>
                    
                    <div class="form-group">
                        <label>Subtitle / Tagline (e.g. Pan-India Coverage)</label>
                        <textarea id="gal_hero_subtitle" class="tinymce-editor"><%- getText('gal_hero_subtitle') %></textarea>
                        <button class="btn-primary mt-2" onclick="updateText('gal-hero-subtitle', 'gal_hero_subtitle')">Save Subtitle</button>
                    </div>

                    <div class="form-group mt-4">
                        <label>Main Title</label>
                        <textarea id="gal_hero_title" class="tinymce-editor"><%- getText('gal_hero_title') %></textarea>
                        <button class="btn-primary mt-2" onclick="updateText('gal-hero-title', 'gal_hero_title')">Save Title</button>
                    </div>

                    <div class="form-group mt-4">
                        <label>Description Paragraph</label>
                        <textarea id="gal_hero_desc" class="tinymce-editor"><%- getText('gal_hero_desc') %></textarea>
                        <button class="btn-primary mt-2" onclick="updateText('gal-hero-desc', 'gal_hero_desc')">Save Description</button>
                    </div>
                </div>

                <!-- Places Manager -->
                <div class="section-card">
                    <h2 class="section-title"><i class="fa-solid fa-map-location-dot"></i> Manage City Places</h2>
                    
                    <div class="add-place-form" style="background: #fdfdfd; border: 1px solid #eee; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="font-size: 16px; margin-bottom: 15px;">Add New Place</h3>
                        <div style="display: flex; gap: 15px;">
                            <input type="text" id="new_place_name" class="form-control" placeholder="City Name (e.g. Mumbai)">
                            <input type="text" id="new_place_state" class="form-control" placeholder="State/Tag (e.g. Maharashtra)">
                            <button class="btn-primary" onclick="addPlace()">Add Place</button>
                        </div>
                    </div>

                    <div class="places-grid" id="places-grid">
                        <p style="color: #666; font-size: 14px;">Use this interface to manage cities listed in the gallery. Feature coming soon.</p>
                        <!-- Places will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        tinymce.init({
            selector: '.tinymce-editor',
            height: 200,
            menubar: false,
            plugins: ['code'],
            toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | code'
        });

        function updateText(elementId, tinymceId) {
            const content = tinymce.get(tinymceId).getContent();
            fetch('/pannl/update_section_text.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section_key: elementId, text_value: content })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    alert('Updated successfully!');
                } else {
                    alert('Error updating: ' + data.message);
                }
            })
            .catch(err => console.error(err));
        }

        function addPlace() {
            const name = document.getElementById('new_place_name').value;
            const state = document.getElementById('new_place_state').value;
            if(!name) return alert("Please enter a city name");
            
            fetch('/pannl/add_gallery_place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, state })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    alert('Place added successfully!');
                    location.reload();
                } else {
                    alert('Error: ' + data.message);
                }
            });
        }
    </script>
</body>
</html>
"""

with open('views/pannl/gallery.ejs', 'w', encoding='utf-8') as f:
    f.write(new_ejs)
