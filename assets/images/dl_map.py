import urllib.request

url = "https://simplemaps.com/static/svg/in/in.svg"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response, open('c:/Users/admin/Desktop/public_html/assets/images/vector_map.svg', 'wb') as out_file:
        data = response.read()
        out_file.write(data)
    print("Downloaded successfully.")
except Exception as e:
    print(f"Error: {e}")
