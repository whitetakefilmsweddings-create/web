from bs4 import BeautifulSoup

with open('camrin_contact.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
main_content = soup.find('main', class_='min-h-screen')

if main_content:
    with open('camrin_contact_clean.html', 'w', encoding='utf-8') as f:
        f.write(str(main_content))
    print("Successfully extracted main contact content.")
else:
    print("Could not find main element.")
