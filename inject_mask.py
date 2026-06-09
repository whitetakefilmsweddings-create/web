import re

with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

defs_block = """
    <defs>
        <radialGradient id="fadeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="50%" stop-color="white" stop-opacity="1" />
            <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
        <mask id="edgeFade">
            <rect x="160" y="420" width="260" height="270" fill="url(#fadeGrad)" />
        </mask>
    </defs>
    <g mask="url(#edgeFade)">
"""

svg = svg.replace('viewBox="160 420 260 270">\n', 'viewBox="160 420 260 270">\n' + defs_block)
svg = svg.replace('\n</svg>', '\n    </g>\n</svg>')

with open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

print("Added SVG mask to the detailed map!")
