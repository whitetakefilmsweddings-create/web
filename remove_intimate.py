import re

# 1. Update about.ejs
with open('views/pannl/about.ejs', 'r', encoding='utf-8') as f:
    about_ejs = f.read()

# Replace the intimate wedding block
about_ejs = re.sub(r'<!-- ── About Intimate Wedding Section ── -->.*?</div>\s*</div>\s*</div>\s*<!-- YouTube Video Editor Section -->', '</div>\n\n\n        <!-- YouTube Video Editor Section -->', about_ejs, flags=re.DOTALL)
with open('views/pannl/about.ejs', 'w', encoding='utf-8') as f:
    f.write(about_ejs)

# 2. Update about.html
with open('about.html', 'r', encoding='utf-8') as f:
    about_html = f.read()

about_html = re.sub(r'<section class=\"c-wrap couples-session-section.*?</section>', '', about_html, flags=re.DOTALL)
with open('about.html', 'w', encoding='utf-8') as f:
    f.write(about_html)

# 3. Update server.js
with open('server.js', 'r', encoding='utf-8') as f:
    server_js = f.read()

server_js = re.sub(r'// Auto-insert any missing intimate showcase images.*?for \(const row of defaultIntimate\) \{\s*await panlePool\.query[^\}]*\}\s*\}', '', server_js, flags=re.DOTALL)
with open('server.js', 'w', encoding='utf-8') as f:
    f.write(server_js)

print('Successfully removed Intimate Wedding section from about.html, about.ejs, and server.js')
