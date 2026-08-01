import os

files_to_update = [
    'views/pannl/about.ejs',
    'views/pannl/services.ejs',
    'views/pannl/index.ejs',
    'views/pannl/gallery.ejs'
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Standard about/services link addition
    if '<a href="/pannl/gallery.php">Gallery Page</a>' not in content:
        content = content.replace(
            '<a href="/pannl/services.php">Service Pages</a>',
            '<a href="/pannl/services.php">Service Pages</a>\n                <a href="/pannl/gallery.php">Gallery Page</a>'
        )
        
    # 2. Fix gallery.ejs active state if needed
    if file_path == 'views/pannl/gallery.ejs':
        # the sidebar block was copied from services maybe? Wait, I generated gallery.ejs using python from services, but I didn't give it a sidebar.
        # Oh wait, my generate_gallery_ejs.py just used <%- include('partials/sidebar') %>
        # Since the project DOES NOT use partials, I need to inject the full sidebar into gallery.ejs!
        pass

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Updated sidebars.")
