import re

files = [
    'wedding-photography.html',
    'cinematic-wedding-films.html',
    'pre-wedding-shoots.html',
    'engagement-reception.html',
    'drone-coverage.html',
    'albums-prints.html'
]

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Remove wpo-page-title section
        pattern_title = re.compile(r'<section class="wpo-page-title">.*?</section>\s*<!-- end page-title -->', re.DOTALL)
        content = pattern_title.sub('', content)
        
        # Remove wpo-portfolio-section
        pattern_portfolio = re.compile(r'<!-- start wpo-portfolio-section -->.*?<!-- end wpo-portfolio-section -->', re.DOTALL)
        content = pattern_portfolio.sub('', content)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Updated {filename}")
    except Exception as e:
        print(f"Error updating {filename}: {e}")
