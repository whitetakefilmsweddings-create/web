import re

# Read index.html to extract hero section
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

hero_match = re.search(r'(<!-- start of hero -->.*?<!-- end of wpo-hero-slide-section-->)', index_content, re.DOTALL)
if not hero_match:
    print("Hero not found in index.html")
    exit(1)
hero_section = hero_match.group(1)

# Modify the title to be relevant to the gallery, maybe?
# The user said "add this type hero section for the gallery" and showed the screenshot with "CRAFTING UNFORGETTABLE MOMENTS".
# I'll leave the exact HTML since they want "this type". I might change "CRAFTING" to "OUR GALLERY" or leave it. I'll leave it as is to match the screenshot exactly.

# Read gallery.html
with open('gallery.html', 'r', encoding='utf-8') as f:
    gallery_content = f.read()

# Replace the camrin-hero with the new hero section
pattern = re.compile(r'<!-- Start Hero Section -->.*?<!-- Start Stats Section -->', re.DOTALL)
new_gallery_content = pattern.sub(f'{hero_section}\n\n        <!-- Start Stats Section -->', gallery_content)

with open('gallery.html', 'w', encoding='utf-8') as f:
    f.write(new_gallery_content)
    
print("Updated gallery.html with video hero section")
