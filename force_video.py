import os
import re

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
            
        # Hide the image
        content = re.sub(r'(<img id="srv-[a-z]+-img"[^>]*)style="([^"]*)"', r'\1style="\2; display: none;"', content)
        
        # Show the iframe and add a dummy youtube link
        content = re.sub(r'(<iframe id="srv-[a-z]+-yt" src=")(" style="[^"]*display: )none(;)', r'\1https://www.youtube.com/embed/ScMzIvxBSi4\2block\3', content)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Updated {filename}")
    except Exception as e:
        print(f"Error updating {filename}: {e}")
