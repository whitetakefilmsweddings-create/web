with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

parts = text.split('<section class="couples-session-section"')
if len(parts) == 2:
    # check if ends with <style>...</style>\n
    import re
    first_part = parts[0]
    # find the last <style> tag
    idx = first_part.rfind('<style>')
    if idx != -1:
        # Check if this style block contains 'couples' (which means it's our injected one)
        if 'couples' in first_part[idx:]:
            first_part = first_part[:idx]
    
    new_text = first_part + '<section class="couples-session-section reveal-active reveal-section"' + parts[1]
    
    with open('about.html', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('Fixed about.html successfully')
else:
    print('couples-session-section not exactly 1 split?', len(parts))
