ejs_code = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery Admin - WhiteTake Films</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #000; color: #fff; display: flex; margin: 0; min-height: 100vh; }
        .sidebar { width: 250px; background: #111; padding: 30px 0; border-right: 1px solid #333; display: flex; flex-direction: column; }
        .sidebar .logo { font-size: 20px; font-weight: 900; letter-spacing: 2px; text-align: center; margin-bottom: 40px; color: #fff; text-decoration: none; }
        .sidebar a { display: block; padding: 15px 30px; color: #aaa; text-decoration: none; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; }
        .sidebar a:hover, .sidebar a.active { background: #222; color: #fff; border-left: 3px solid #fff; }
        .content { flex-grow: 1; padding: 50px; max-width: 900px; margin: 0 auto; overflow-y: auto; }
        .page-header h1 { font-size: 32px; font-weight: 900; margin: 0 0 10px 0; }
        .page-header p { color: #888; font-size: 15px; margin-bottom: 40px; }
        .section-card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
        .section-card-title { font-size: 16px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-size: 12px; font-weight: 600; color: #888; margin-bottom: 8px; text-transform: uppercase; }
        input[type="text"], textarea, input[type="file"] { width: 100%; padding: 12px; background: #000; border: 1px solid #333; border-radius: 6px; color: #fff; font-family: inherit; font-size: 14px; margin-bottom: 10px; }
        .btn { background: #fff; color: #000; padding: 10px 20px; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
        .btn-danger { background: #ff4c4c; color: #fff; }
        .upload-status { font-size: 12px; margin-top: 5px; min-height: 18px; }
        .success { color: #4caf50; }
        .error { color: #f44336; }
        
        /* Grid for existing places */
        .places-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .place-card { background: #000; border: 1px solid #333; padding: 15px; border-radius: 8px; text-align: center; }
        .place-card img { width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px; }
        .place-card h4 { margin: 0 0 5px 0; font-size: 15px; }
        .place-card p { margin: 0 0 15px 0; font-size: 12px; color: #888; }
        .btn-small { padding: 6px 12px; font-size: 10px; width: 100%; }
    </style>
</head>
<body>

    <!-- Sidebar -->
    <div class="sidebar">
        <a href="/pannl/index.php" class="logo">WHITETAKEFILMS</a>
        <a href="/pannl/index.php">Home Page</a>
        <a href="/pannl/about.php">About Page</a>
        <a href="/pannl/services.php">Service Pages</a>
        <a href="/pannl/gallery.php" class="active">Gallery Page</a>
        <a href="/pannl/logout.php" style="margin-top: 50px; background: #ff4c4c; color: #fff; text-align: center;">SIGN OUT</a>
    </div>

    <!-- Main Content -->
    <div class="content">
        <div class="page-header">
            <h1>Gallery Page Editor</h1>
            <p>Update the hero text and manage city locations for the main Gallery Page.</p>
        </div>
        
        <div class="section-card">
            <div class="section-card-title">Gallery Hero Section</div>
            
            <form class="text-update-form form-group" data-key="gal_hero_subtitle">
                <label>Subtitle / Tagline</label>
                <input type="text" name="text_value" value="<%= getText('gal_hero_subtitle') || 'Pan-India Coverage' %>" required>
                <button type="submit" class="btn">Save Subtitle</button>
                <div class="upload-status" id="text-status-gal_hero_subtitle"></div>
            </form>

            <form class="text-update-form form-group" data-key="gal_hero_title">
                <label>Main Title (HTML allowed for breaks/spans)</label>
                <textarea name="text_value" rows="3" style="font-family: monospace;"><%= getText('gal_hero_title') || 'Wedding Photographer<br><span style=\"font-style: italic; color: #333;\">Across India</span>' %></textarea>
                <button type="submit" class="btn">Save Title</button>
                <div class="upload-status" id="text-status-gal_hero_title"></div>
            </form>

            <form class="text-update-form form-group" data-key="gal_hero_desc">
                <label>Description</label>
                <textarea name="text_value" rows="3"><%= getText('gal_hero_desc') || "Kerala's trusted wedding photographers — covering 50+ cities across India with candid, cinematic storytelling." %></textarea>
                <button type="submit" class="btn">Save Description</button>
                <div class="upload-status" id="text-status-gal_hero_desc"></div>
            </form>
        </div>

        <div class="section-card">
            <div class="section-card-title">Manage Gallery Places</div>
            
            <form id="add-place-form" class="form-group">
                <label>Add a New City/Location Card</label>
                <input type="text" id="new_place_name" placeholder="City Name (e.g. Mumbai)" required>
                <input type="text" id="new_place_state" placeholder="State (e.g. Maharashtra)" required>
                <input type="file" id="new_place_image" accept="image/*" required>
                <button type="submit" class="btn btn-danger">Add New Place</button>
                <div id="add-place-status" class="upload-status"></div>
                <p style="font-size: 12px; color: #777; margin-top: 15px;">Adding a place will upload the cover image, automatically update the gallery page grid, AND generate a dedicated SEO page for that city!</p>
            </form>

            <div class="section-card-title" style="margin-top: 50px; border-top: 1px solid #333; padding-top: 20px;">Existing Places</div>
            <div class="places-grid">
                <% if(typeof places !== 'undefined' && places.length > 0) { %>
                    <% places.forEach(function(place) { %>
                        <div class="place-card" id="place-card-<%= place.name.replace(/\\s+/g, '-') %>">
                            <img src="/<%= place.image %>" alt="<%= place.name %>">
                            <h4><%= place.name %></h4>
                            <p><%= place.state %></p>
                            <button class="btn btn-danger btn-small" onclick="deletePlace('<%= place.name %>')">Remove Place</button>
                        </div>
                    <% }); %>
                <% } else { %>
                    <p style="color: #777; font-size: 14px; text-align: center; width: 100%;">No places found on the gallery page.</p>
                <% } %>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        document.querySelectorAll('.text-update-form').forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const key = this.getAttribute('data-key');
                const val = this.querySelector('[name="text_value"]').value;
                const status = document.getElementById('text-status-' + key);
                
                status.innerText = 'Updating...';
                status.className = 'upload-status';

                fetch('/pannl/update_section_text.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ section_key: key, text_value: val })
                })
                .then(r => r.json())
                .then(d => {
                    if(d.success) {
                        status.innerText = 'Updated successfully!';
                        status.classList.add('success');
                        setTimeout(() => status.innerText = '', 3000);
                    } else {
                        status.innerText = 'Error: ' + d.message;
                        status.classList.add('error');
                    }
                }).catch(err => {
                    status.innerText = 'Error: ' + err.message;
                    status.classList.add('error');
                });
            });
        });

        const addForm = document.getElementById('add-place-form');
        if (addForm) {
            addForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('new_place_name').value;
                const state = document.getElementById('new_place_state').value;
                const fileInput = document.getElementById('new_place_image');
                const status = document.getElementById('add-place-status');
                
                status.innerText = 'Uploading...';
                status.className = 'upload-status';
                
                const formData = new FormData();
                formData.append('name', name);
                formData.append('state', state);
                if (fileInput.files[0]) {
                    formData.append('image', fileInput.files[0]);
                }
                
                fetch('/pannl/add_gallery_place', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        status.classList.add('success');
                        status.innerText = 'Place added successfully!';
                        document.getElementById('new_place_name').value = '';
                        document.getElementById('new_place_state').value = '';
                        fileInput.value = '';
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        status.classList.add('error');
                        status.innerText = 'Error: ' + data.message;
                    }
                })
                .catch(err => {
                    status.classList.add('error');
                    status.innerText = 'Error: ' + err.message;
                });
            });
        }

        function deletePlace(name) {
            if(!confirm('Are you sure you want to remove ' + name + '? This will also delete its SEO page.')) return;
            
            fetch('/pannl/delete_gallery_place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    alert('Place removed successfully!');
                    location.reload();
                } else {
                    alert('Error removing place: ' + data.message);
                }
            })
            .catch(err => {
                alert('Error: ' + err.message);
            });
        }
    </script>
</body>
</html>
"""

with open('views/pannl/gallery.ejs', 'w', encoding='utf-8') as f:
    f.write(ejs_code)
