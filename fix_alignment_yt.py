import re
import os

files = [
    'wedding-photography.html',
    'cinematic-wedding-films.html',
    'pre-wedding-shoots.html',
    'engagement-reception.html',
    'drone-coverage.html',
    'albums-prints.html'
]

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 1. Fix alignment (padding)
        content = content.replace('style="background: #ffffff; padding: 100px 0;"', 'style="background: #ffffff; padding: 180px 0 100px;"')
        
        # 2. Add YouTube iframe
        prefix = filename.split('-')[0]
        if prefix == 'cinematic': prefix = 'cinema'
        if prefix == 'engagement': prefix = 'engagement'
        if prefix == 'drone': prefix = 'drone'
        if prefix == 'albums': prefix = 'albums'
        
        old_media = f'<img id="srv-{prefix}-img" src="pic/Our resent work/IMG_4246.JPG"'
        if prefix == 'pre': 
            old_media = f'<img id="srv-prewedding-img" src="pic/Our resent work/IMG_4246.JPG"'
            prefix = 'prewedding'
        
        # We need to replace the image block with image + iframe
        pattern = re.compile(rf'(<div class="service-feature-image"[^>]*>)\s*<img id="srv-{prefix}-img"([^>]*)>\s*</div>', re.DOTALL)
        
        new_media = f"""\\1
                            <img id="srv-{prefix}-img"\\2>
                            <iframe id="srv-{prefix}-yt" src="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; display: none;" allowfullscreen></iframe>
                        </div>"""
        
        content = pattern.sub(new_media, content)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Updated {filename}")
    except Exception as e:
        print(f"Error updating {filename}: {e}")
