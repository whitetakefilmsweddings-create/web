import re

with open('gallery.html', 'r', encoding='utf-8') as f:
    content = f.read()

cities = ['Kochi', 'Thrissur', 'Calicut', 'Kottayam', 'Palakkad', 'Kannur', 'Alappuzha', 'Goa', 'Delhi', 'Bangalore', 'Chennai']

for city in cities:
    pattern = re.compile(r'(<a href=")#gallery(" class="city-card">.*?alt="' + city + r'" loading="lazy">)', re.DOTALL)
    content = pattern.sub(r'\1wedding-photographer-' + city.lower() + r'.html\2', content)

with open('gallery.html', 'w', encoding='utf-8') as f:
    f.write(content)
    
print('Updated gallery.html links.')
