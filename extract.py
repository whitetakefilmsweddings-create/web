with open('index.html', 'rb') as f:
    text = f.read().decode('utf-8', errors='ignore')

idx1 = text.find('<section class="couples-session-section')
idx2 = text.find('<!-- end of wpo-about-section -->')

if idx1 != -1 and idx2 != -1:
    section = text[idx1:idx2 + len('<!-- end of wpo-about-section -->')]
    section = section.replace('id="intimate-img-1"', 'id="about-intimate-img-1"')
    section = section.replace('id="intimate-img-2"', 'id="about-intimate-img-2"')
    section = section.replace('id="intimate-img-3"', 'id="about-intimate-img-3"')
    section = section.replace('<h1 class="couples-title">Behind the Lens</h1>', '<h1 class="couples-title">INTIMATE WEDDING</h1>')
    section = section.replace('<div class="couples-subtitle">About us</div>', '<div class="couples-subtitle">Showcase</div>')
    section = section.replace('class="solid-logo"', 'id="about-intimate-logo-bg" class="solid-logo"')
    with open('temp_intimate.html', 'w', encoding='utf-8') as out:
        out.write(section)
    print('Saved to temp_intimate.html')
else:
    print('Not found')
