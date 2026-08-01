with open('assets/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Find the couples-btn and theme-btn styles
import re
couples_btn = re.search(r'\.couples-btn\s*\{([^}]+)\}', css)
theme_btn_s4 = re.search(r'\.theme-btn-s4\s*\{([^}]+)\}', css)
theme_btn = re.search(r'\.theme-btn\b[^{]*\{([^}]+)\}', css)

print("couples-btn:", couples_btn.group(1).strip() if couples_btn else "NOT FOUND")
print("theme-btn-s4:", theme_btn_s4.group(1).strip() if theme_btn_s4 else "NOT FOUND")
print("theme-btn:", theme_btn.group(1).strip() if theme_btn else "NOT FOUND")
