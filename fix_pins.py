import re

with open('c:/Users/admin/Desktop/public_html/about.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the pos_x and pos_y to lat and lng
html = html.replace('wrapper.style.left = pin.pos_x + \'%\';', 'wrapper.style.left = (pin.pos_x !== undefined ? pin.pos_x : pin.lat) + \'%\';')
html = html.replace('wrapper.style.top = pin.pos_y + \'%\';', 'wrapper.style.top = (pin.pos_y !== undefined ? pin.pos_y : pin.lng) + \'%\';')

# Fix the broken image URL logic
old_img_logic = 'const imageHtml = pin.image_path ? `<img src="/${pin.image_path}" class="popup-card-img">` : `<div class="popup-card-img" style="background: #eee;"></div>`;'
new_img_logic = '''const imgSrc = pin.image_path ? (pin.image_path.startsWith('http') ? pin.image_path : '/' + pin.image_path) : '';
                        const imageHtml = pin.image_path ? `<img src="${imgSrc}" class="popup-card-img">` : `<div class="popup-card-img" style="background: #eee;"></div>`;'''

html = html.replace(old_img_logic, new_img_logic)

with open('c:/Users/admin/Desktop/public_html/about.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed pin positions and image URLs!")
