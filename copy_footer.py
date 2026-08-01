import glob
import re

with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()

pat = re.compile(r'<footer class="wpo-site-footer">.*?</footer>', re.DOTALL)
idx_ft = pat.search(idx)
if not idx_ft:
    print('Footer not found in index.html')
    exit(1)
idx_ft_html = idx_ft.group()

html_files = glob.glob('*.html')
for f in html_files:
    if f == 'index.html': continue
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        new_content = pat.sub(idx_ft_html, content)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated footer in {f}')
    except Exception as e:
        print(f'Failed on {f}: {e}')
