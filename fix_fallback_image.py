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
            
        content = content.replace('src="pic/Our resent work/IMG_4246.JPG"', 'src="assets/images/service/img-1.jpg"')
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Updated {filename}")
    except Exception as e:
        print(f"Error updating {filename}: {e}")
