with open('contact.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace gold colors with white/grays
html = html.replace('#d4af37', '#ffffff')
html = html.replace('#c5a880', '#dddddd')
html = html.replace('rgba(212,175,55,', 'rgba(255,255,255,')
# For the javascript part where the button turns green:
# "btn.style.background = '#4caf50';" -> "btn.style.background = '#ffffff';"
# "btn.style.color = '#fff';" -> "btn.style.color = '#000';"
html = html.replace("btn.style.background = '#4caf50';", "btn.style.background = '#ffffff';")
html = html.replace("btn.style.color = '#fff';", "btn.style.color = '#000';")

with open('contact.html', 'w', encoding='utf-8') as f:
    f.write(html)
