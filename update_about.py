import sys
import re

with open('views/pannl/about.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Sidebar Links
content = content.replace('<a href="#home">Home Page</a>', '<a href="/pannl/index.php">Home Page</a>')
content = content.replace('<li class="menu-item active">', '<li class="menu-item">')
content = content.replace('<a href="#about-page">About Page</a>', '<a href="/pannl/about.php">About Page</a>')
content = content.replace('<li class="menu-item">\n                <a href="/pannl/about.php">About Page</a>\n            </li>', '<li class="menu-item active">\n                <a href="/pannl/about.php">About Page</a>\n            </li>')

# Fix submenu links
content = content.replace('href="#instagram-feed"', 'href="/pannl/index.php#instagram-feed"')
content = content.replace('href="#youtube-feed"', 'href="/pannl/index.php#youtube-feed"')
content = content.replace('href="#favorite-moments"', 'href="/pannl/index.php#favorite-moments"')

# 2. Extract content area to replace
new_content_area = '''    <div class="content-area">
        <div class="page-header" id="about">
            <h1>About Page Editor</h1>
            <p>Upload new images and update text for the About Us page sections.</p>
        </div>
        
        <!-- ── About Page Hero Video Section ── -->
        <div class="page-header" id="about-hero" style="margin-top: 20px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
            <h2>About Hero Video Link</h2>
        </div>

        <div class="sections-container" style="margin-bottom: 40px;">
            <% if (grouped_images && grouped_images['about']) { %>
                <% grouped_images['about'].filter(img => img.section_key === 'about_hero_video').forEach(function(img) { %>
                    <div class="section-card" id="card-<%= img.section_key %>">
                        <div class="section-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>About Hero Video Link</span>
                            <span style="background: #222; color: #c5a880; font-size: 11px; padding: 3px 8px; border-radius: 12px; border: 1px solid #333; text-transform: none;"><%= img.section_key %></span>
                        </div>
                        
                        <div style="background-color: #050505; border: 1px solid #222; border-radius: 8px; padding: 12px; font-size: 13px; color: #888;">
                            <div style="margin-bottom: 5px; font-weight: 600; color: #aaa;">Current Link / ID:</div>
                            <div id="url-text-<%= img.section_key %>" style="word-break: break-all; font-family: monospace; max-height: 80px; overflow-y: auto;"><%= img.image_path %></div>
                        </div>

                        <form class="text-update-form" data-key="<%= img.section_key %>" style="display: flex; flex-direction: column; gap: 10px;">
                            <textarea name="text_value" placeholder="Paste YouTube Video Link or ID" required rows="3"
                                      style="background: #000; border: 1px solid #333; color: #fff; padding: 10px 12px; border-radius: 8px; font-family: inherit; font-size: 13px; resize: vertical;"><%= img.image_path %></textarea>
                            
                            <div class="upload-status" id="text-status-<%= img.section_key %>" style="font-size: 12px; text-align: center;"></div>
                            
                            <button type="submit" class="upload-btn" style="background: #ff0000; color: #fff;">Save Link</button>
                        </form>
                    </div>
                <% }) %>
            <% } %>
        </div>

        <!-- ── About Intimate Wedding Section ── -->
        <div class="page-header" id="about-intimate" style="margin-top: 60px; border-top: 1px solid #1a1a1a; padding-top: 40px;">
            <h2>Intimate Wedding Showcase</h2>
            <p>Edit the images and logo background for the Intimate Wedding showcase on the About page.</p>
        </div>

        <div class="sections-container" style="margin-bottom: 60px;">
            <% if (grouped_images && grouped_images['about']) { %>
                <% grouped_images['about'].filter(img => img.section_key.startsWith('about_intimate_')).forEach(function(img) { 
                    const labels = {
                        'about_intimate_1': 'Card 1 (Krishna & Connor)',
                        'about_intimate_2': 'Card 2 (Sai & Aishwarya)',
                        'about_intimate_3': 'Card 3 (Reshma & Rajiv)',
                        'about_intimate_logo_bg': 'Logo Circle Background'
                    };
                    const label = labels[img.section_key] || img.section_key;
                    
                    let preview_src = img.image_path;
                    if (!preview_src.match(/^https?:\\/\\//) && !preview_src.startsWith('data:')) {
                        preview_src = '/' + preview_src;
                    }
                %>
                    <div class="section-card" id="card-<%= img.section_key %>">
                        <div class="section-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                            <span><%= label %></span>
                            <span style="background: #222; color: #c5a880; font-size: 11px; padding: 3px 8px; border-radius: 12px; border: 1px solid #333; text-transform: none;"><%= img.section_key %></span>
                        </div>
                        
                        <div class="img-preview">
                            <img src="<%= preview_src %>" alt="Preview" id="preview-img-<%= img.section_key %>">
                        </div>
                        
                        <div class="size-info">Output Size: 1080 x 1350 px</div>
                        
                        <form class="upload-form" data-key="<%= img.section_key %>">
                            <div class="file-input-wrapper">
                                <span class="file-input-label" id="file-label-<%= img.section_key %>">Choose Image</span>
                                <input type="file" name="image" accept="image/*" required onchange="handleFileSelect(this, '<%= img.section_key %>')">
                            </div>
                            
                            <div class="progress-bar-container" id="progress-container-<%= img.section_key %>">
                                <div class="progress-bar" id="progress-bar-<%= img.section_key %>"></div>
                            </div>
                            
                            <div class="upload-status" id="status-<%= img.section_key %>"></div>
                            
                            <button type="submit" class="upload-btn">Upload & Crop</button>
                        </form>
                    </div>
                <% }) %>
            <% } %>
        </div>
    </div>
'''

content = re.sub(r'<div class="content-area">.*</div>\s*<script>', new_content_area + '\n    <script>', content, flags=re.DOTALL)

with open('views/pannl/about.ejs', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated about.ejs successfully.")
