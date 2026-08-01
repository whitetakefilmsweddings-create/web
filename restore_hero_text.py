import re

with open('gallery.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_text = """
            <div class="slide-content" style="text-align: center; max-width: 800px; margin: 0 auto;">
                <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 50px; backdrop-filter: blur(5px);">
                    <i class="fa fa-map-marker" style="color: #fff; font-size: 14px;"></i>
                    <span style="color: #fff; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;">Pan-India Coverage</span>
                </div>
                
                <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 56px; color: #fff; line-height: 1.1; margin-bottom: 24px;">Wedding Photographer<br><span style="font-style: italic; color: #f0f0f0;">Across India</span></h1>
                
                <p style="color: #ddd; font-size: 18px; max-width: 600px; margin: 0 auto 40px; font-family: 'Mulish', sans-serif; line-height: 1.6;">Kerala's trusted wedding photographers — covering 50+ cities across India with candid, cinematic storytelling.</p>
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <a href="https://wa.me/918714128539" target="_blank" style="display: inline-flex; align-items: center; gap: 10px; background: #fff; color: #000; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-family: 'Outfit', sans-serif; transition: all 0.3s ease; text-decoration: none;">
                        <i class="fa fa-whatsapp"></i> Chat on WhatsApp
                    </a>
                    <a href="contact.html" style="display: inline-flex; align-items: center; gap: 10px; background: transparent; color: #fff; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-family: 'Outfit', sans-serif; transition: all 0.3s ease; text-decoration: none; border: 1px solid #fff;">
                        Get a Free Quote
                    </a>
                </div>
            </div>
"""

pattern = re.compile(r'<div class="slide-content">.*?</div>\s*</div>\s*</div>', re.DOTALL)
content = pattern.sub(new_text + '\n        </div>', content)

with open('gallery.html', 'w', encoding='utf-8') as f:
    f.write(content)
    
print("Restored original text over video background.")
