import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

# The section is <section class="c-wrap couples-session-section reveal-active reveal-section"> ... </section>
# But let's check what it actually is in about.html right now
match = re.search(r'<section class="c-wrap.*?</section>', text, re.DOTALL)
if match:
    new_text = text.replace(match.group(0), '')
    with open('about.html', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('Removed section from about.html')
else:
    print('Section not found in about.html')
