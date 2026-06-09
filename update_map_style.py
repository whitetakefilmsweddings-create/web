import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace colors
text = text.replace('color: #ffc107;', 'color: #333;') # Stars color
text = text.replace('background: #ffc107; color: #000;', 'background: #000; color: #fff;') # Badge color
text = text.replace('background: #00a896; color: #fff;', 'background: #000; color: #fff;') # Button and Marker color
text = text.replace('background: #028a7b; color: #fff;', 'background: #333; color: #fff;') # Button hover
text = text.replace('background: #00a896; border: 3px solid #fff;', 'background: #000; border: 3px solid #fff;') # Marker

# Add auto-open logic
auto_open_logic = """
                        if (!window.firstMarker) window.firstMarker = marker;
                    });
                    
                    if (bounds.length > 0) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                    }
                    
                    if (window.firstMarker) {
                        window.firstMarker.openPopup();
                    }
"""

text = re.sub(r'\}\);\s*if \(bounds\.length > 0\) \{\s*map\.fitBounds\(bounds, \{ padding: \[50, 50\], maxZoom: 12 \}\);\s*\}', auto_open_logic, text)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('about.html updated')
