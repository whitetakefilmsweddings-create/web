with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the specific hardcoded white background styling in couples-session-section that was added in a previous change.
html = html.replace('background: #ffffff', 'background: #000000')

# Also fix text colors in couples group if they were changed
html = html.replace('color: #000000; /* Dark text for white background */', '')
html = html.replace('.couples-desc { color: #333333; }', '')
html = html.replace('.couples-btn { color: #000000; border-color: #000000; }', '')
html = html.replace('.couples-btn:hover { background: #000000; color: #ffffff; }', '')

# Specifically looking for the hardcoded inline style in couples group 
search_str = """                  <div class="couples-group" style="background: #ffffff; padding: 40px; border-radius: 12px;">"""
replace_str = """                  <div class="couples-group">"""
html = html.replace(search_str, replace_str)

# Change text colors back to white for the dark theme
html = html.replace('<h1 class="couples-title" id="home-about-title" style="color: #000;">Behind the Lens</h1>', '<h1 class="couples-title" id="home-about-title">Behind the Lens</h1>')
html = html.replace('<div class="couples-desc" id="home-about-desc" style="color: #333;">', '<div class="couples-desc" id="home-about-desc">')


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
