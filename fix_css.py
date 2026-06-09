import re

def update_css(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove mask from .map-container
    content = re.sub(r'-webkit-mask-image: radial-gradient\([^)]+\); mask-image: radial-gradient\([^)]+\); ', '', content)
    
    # Add mask to .vector-map-bg
    if 'mask-image' not in content:
        content = content.replace(
            '.vector-map-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0.9; }',
            '.vector-map-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0.9; -webkit-mask-image: radial-gradient(circle at center, black 60%, transparent 100%); mask-image: radial-gradient(circle at center, black 60%, transparent 100%); }'
        )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_css('c:/Users/admin/Desktop/public_html/about.html')
update_css('c:/Users/admin/Desktop/public_html/update_frontend_map.py')

print("Updated CSS to apply softer mask to vector-map-bg")
