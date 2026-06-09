import urllib.request
import re

req = urllib.request.Request('https://weddingbellsstories.com/home', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        css_files = re.findall(r'<link[^>]+href=[\'\"]([^\'\"]+\.css)[\'\"]', html)
        for c in css_files:
            print(c)
except Exception as e:
    print(e)
