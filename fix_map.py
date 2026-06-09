import re

# 1. Update SVG to Black with dark grey stroke
with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

# Change colors to black map
svg = svg.replace('fill="#4f5966"', 'fill="#000000"')
svg = svg.replace("this.style.fill='#4f5966'", "this.style.fill='#000000'")
svg = svg.replace("this.style.fill='#5c6776'", "this.style.fill='#333333'")
svg = svg.replace('stroke="#1b232f"', 'stroke="#333333"')

with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

# 2. Update about.html
with open('c:/Users/admin/Desktop/public_html/about.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make background white and text dark again
html = html.replace('.about-map-section { padding: 100px 0; background: #1b232f; border-bottom: none; }', '.about-map-section { padding: 100px 0; background: #fff; border-bottom: 1px solid #eaeaea; }')
html = html.replace('.about-text-col h2 { font-family: \'Cormorant Garamond\', serif; font-size: clamp(40px, 5vw, 64px); color: #eaeaea; margin-bottom: 20px; line-height: 1.1; }', '.about-text-col h2 { font-family: \'Cormorant Garamond\', serif; font-size: clamp(40px, 5vw, 64px); color: #222; margin-bottom: 20px; line-height: 1.1; }')
html = html.replace('.about-text-col p { font-size: 16px; color: #a5b0bd; line-height: 1.8; margin-bottom: 20px; font-family: \'Mulish\', sans-serif; }', '.about-text-col p { font-size: 16px; color: #666; line-height: 1.8; margin-bottom: 20px; font-family: \'Mulish\', sans-serif; }')

# Make the vertical text blend with white background
html = html.replace('.vertical-text { position: absolute; right: -20px; top: 50%; transform: translateY(-50%) rotate(90deg); font-size: 100px; color: rgba(255,255,255,0.03);', '.vertical-text { position: absolute; right: -20px; top: 50%; transform: translateY(-50%) rotate(90deg); font-size: 100px; color: rgba(0,0,0,0.03);')
html = html.replace('color: #a5b0bd; font-size: 11px; white-space: nowrap; pointer-events: none; font-weight: 700; font-family: \'Mulish\', sans-serif; }', 'color: #333; font-size: 11px; white-space: nowrap; pointer-events: none; font-weight: 700; font-family: \'Mulish\', sans-serif; }')

# Increase z-index of custom-popup just in case
html = html.replace('z-index: 20;', 'z-index: 9999;')
html = html.replace('z-index: 10;', 'z-index: 999;')

# Fix layout to be center aligned (stacked)
old_layout = '''        <div class="row align-items-center">
            <div class="col-lg-5 col-12">
                <div class="about-text-col" data-aos="fade-right" data-aos-duration="1000">'''
new_layout = '''        <div class="row">
            <div class="col-lg-10 col-12 mx-auto text-center mb-5">
                <div class="about-text-col" data-aos="fade-up" data-aos-duration="1000" style="padding-right: 0;">'''

if old_layout in html:
    html = html.replace(old_layout, new_layout)
    html = html.replace('            <div class="col-lg-7 col-12">\n                <div class="map-container"', '        </div>\n        <div class="row">\n            <div class="col-lg-8 col-md-10 mx-auto col-12">\n                <div class="map-container"')

# Add console.log and click handler fixes to JS to ensure popups work
new_js_handler = """                        // Marker click logic
                        marker.addEventListener('click', (e) => {
                            if (e.target.closest('.custom-popup') && !e.target.classList.contains('popup-close-btn')) {
                                return; // don't close if clicking inside popup
                            }
                            // Close all others
                            document.querySelectorAll('.custom-popup').forEach(p => p.classList.remove('active'));
                            // Open this
                            marker.querySelector('.custom-popup').classList.add('active');
                        });"""

html = re.sub(r'// Marker click logic\s*marker\.addEventListener\(\'click\', \(\) => \{.*?\}\);', new_js_handler, html, flags=re.DOTALL)

with open('c:/Users/admin/Desktop/public_html/about.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Applied black map, white centered background, and popup fixes.")
