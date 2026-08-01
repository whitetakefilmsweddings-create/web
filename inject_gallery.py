import glob

html_files = glob.glob('*.html')
for f in html_files:
    if f == 'index.html': continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'drive-gallery.js' not in content:
        new_content = content.replace('<script src="assets/js/script.js"></script>', '<script src="assets/js/drive-gallery.js"></script>\n<script src="assets/js/script.js"></script>')
        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Added drive-gallery.js to {f}')
