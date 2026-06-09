import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

with open('new_intimate.html', 'r', encoding='utf-8') as f:
    new_html = f.read()

# Replace the section
new_text = re.sub(r'<section class=\"couples-session-section.*?</section>', new_html, text, flags=re.DOTALL)

# Add CSS link
if 'wedding-bells.css' not in new_text:
    new_text = new_text.replace('</head>', '    <link href="assets/css/wedding-bells.css" rel="stylesheet">\n</head>')

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Applied new HTML and CSS to about.html')
