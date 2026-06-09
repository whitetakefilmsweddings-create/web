import re

# 1. Update SVG
with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

svg = svg.replace('fill="#f5f5f5"', 'fill="#4f5966"')
svg = svg.replace("this.style.fill='#f5f5f5'", "this.style.fill='#4f5966'")
svg = svg.replace("this.style.fill='#eaeaea'", "this.style.fill='#5c6776'")
svg = svg.replace('stroke="#dcdcdc"', 'stroke="#1b232f"')
svg = svg.replace('stroke="#ebebeb"', 'stroke="#1b232f"')

with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

# 2. Update about.html
with open('c:/Users/admin/Desktop/public_html/about.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update CSS colors
html = html.replace('.about-map-section { padding: 100px 0; background: #fff; border-bottom: 1px solid #eaeaea; }', '.about-map-section { padding: 100px 0; background: #1b232f; border-bottom: none; }')
html = html.replace('.about-text-col h2 { font-family: \'Cormorant Garamond\', serif; font-size: clamp(40px, 5vw, 64px); color: #222; margin-bottom: 20px; line-height: 1.1; }', '.about-text-col h2 { font-family: \'Cormorant Garamond\', serif; font-size: clamp(40px, 5vw, 64px); color: #eaeaea; margin-bottom: 20px; line-height: 1.1; }')
html = html.replace('.about-text-col p { font-size: 16px; color: #666; line-height: 1.8; margin-bottom: 20px; font-family: \'Mulish\', sans-serif; }', '.about-text-col p { font-size: 16px; color: #a5b0bd; line-height: 1.8; margin-bottom: 20px; font-family: \'Mulish\', sans-serif; }')

# Update vector-map-bg to remove mask
html = re.sub(r'\.vector-map-bg \{ [^}]+\}', '.vector-map-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 1; }', html)

# Update custom-marker CSS
new_marker_css = """.custom-marker { position: absolute; width: 24px; height: 32px; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="%23d35400"/></svg>') no-repeat center center; background-size: contain; transform: translate(-50%, -100%); cursor: pointer; z-index: 10; border: none; box-shadow: none; border-radius: 0; transition: transform 0.3s; }
    .custom-marker:hover { transform: translate(-50%, -100%) scale(1.1); }
    .custom-marker::after { display: none; }
    .custom-marker-label { position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); color: #a5b0bd; font-size: 11px; white-space: nowrap; pointer-events: none; font-weight: 700; font-family: 'Mulish', sans-serif; }
    .vertical-text { position: absolute; right: -20px; top: 50%; transform: translateY(-50%) rotate(90deg); font-size: 100px; color: rgba(255,255,255,0.03); font-family: 'Cormorant Garamond', serif; pointer-events: none; white-space: nowrap; font-weight: 700; letter-spacing: 5px; }"""

html = re.sub(r'\.custom-marker \{.*?\}\s*\.custom-marker:hover \{.*?\}\s*\.custom-marker::after \{.*?\}', new_marker_css, html, flags=re.DOTALL)

# Add vertical text and label to html and js
if '<div class="vertical-text">South India</div>' not in html:
    html = html.replace('<img src="assets/images/vector_map.svg" class="vector-map-bg" alt="South India Vector Map">', '<div class="vertical-text">South India</div>\n                    <img src="assets/images/vector_map.svg" class="vector-map-bg" alt="South India Vector Map">')

if '<div class="custom-marker-label">' not in html:
    html = html.replace('marker.innerHTML = popupContent;', 'marker.innerHTML = `<div class="custom-marker-label">${pin.title}</div>` + popupContent;')

with open('c:/Users/admin/Desktop/public_html/about.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Applied dark theme map style to SVG and HTML!")
