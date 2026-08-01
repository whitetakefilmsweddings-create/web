import urllib.request
import re

url = 'https://camrinfilms.com/contact'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        with open('camrin_contact.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Saved to camrin_contact.html")
except Exception as e:
    print(f'Error fetching URL: {e}')
