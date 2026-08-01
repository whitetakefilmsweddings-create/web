import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Change the columns of the existing packages
content = content.replace('<div class="col-lg-5 col-md-10 col-12 mb-4">', '<div class="col-lg-4 col-md-6 col-12 mb-4">')
content = content.replace('<div class="col-lg-6 col-md-10 col-12 mb-4">', '<div class="col-lg-4 col-md-6 col-12 mb-4">')

# Add the new package
new_package_html = """
                <!-- Package 3: Bride Wedding Package -->
                <div class="col-lg-4 col-md-6 col-12 mb-4">
                    <div class="pricing-card" style="background: #fff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; border: 1px solid #eaeaea;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #000; margin-bottom: 10px;">Bride Wedding Package</h3>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 600; color: #000;">
                                ₹49,999/-
                            </div>
                            <div style="font-size: 13px; color: #d32f2f; margin-top: 5px; font-family: 'Mulish', sans-serif; font-weight: bold;">Before booking July 5th: ₹44,999/-</div>
                        </div>
                        
                        <div class="pricing-details" style="flex-grow: 1;">
                            <h4 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #000;">Wedding & Reception</h4>
                            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: 'Mulish', sans-serif; font-size: 14px; color: #333;">
                                <li style="margin-bottom: 10px; color: #000; font-weight: bold; font-size: 13px;">Wedding</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-check" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Traditional Photographer</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-check" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Traditional Videographer</li>
                                <li style="margin-bottom: 10px; color: #000; font-weight: bold; font-size: 13px; margin-top: 15px;">Reception</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-check" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Photographer</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-check" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Videographer</li>
                            </ul>

                            <h4 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #000;">Final Deliverables</h4>
                            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: 'Mulish', sans-serif; font-size: 13px; color: #333;">
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-film" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 2-4 Minute Wedding Highlight Film</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-film" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Full-Length Edited Wedding Film</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-instagram" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Vertical Reels (IG/TikTok Optimized)</li>
                            </ul>

                            <h4 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #000;">Album, Print & Digital</h4>
                            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: 'Mulish', sans-serif; font-size: 13px; color: #333;">
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-book" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 70 Page Classic Album</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-star" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Custom Acrylic / Leather Cover (Both side)</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-usb" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> USB Crystal Drive & Social Media Files</li>
                            </ul>
                            
                            <h4 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #000;">Complimentary</h4>
                            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: 'Mulish', sans-serif; font-size: 13px; color: #333;">
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-camera" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Pre wedding photos only</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-picture-o" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 2 Frame</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-calendar" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Wall Calendar</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-book" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Mini Album</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-usb" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Pendrive with box</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-magic" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Graded photos</li>
                            </ul>

                            <h4 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #000;">Our Special Service</h4>
                            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: 'Mulish', sans-serif; font-size: 13px; color: #333;">
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-cloud" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> 1 Year Google Drive Support</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-cogs" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Dedicated AI Photo Selection Portal</li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;"><i class="fa fa-share-alt" style="color: #000; margin-right: 8px; margin-top: 2px;"></i> Dedicated Photo View & Download Portal</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="contact.html" class="couples-btn" style="width: 100%; display: block; background: #000; color: #fff; border: 1px solid #000;">Book Now</a>
                        </div>
                    </div>
                </div>
"""

# Insert the new package after Package 2 (the dark themed one)
if '<!-- Package 2 -->' in content:
    # Find the end of Package 2 div
    # It ends with two </div> before "</div>" of the row. Wait, let's just insert before '</div>\n        </div>\n        <style>'
    # We can just split by '</div>\n\n            </div>\n        </div>\n        <style>'
    parts = content.split('            </div>\n        </div>\n        <style>')
    if len(parts) == 2:
        new_content = parts[0] + new_package_html + '\n            </div>\n        </div>\n        <style>' + parts[1]
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Successfully added the new package')
    else:
        print('Could not find insertion point')
else:
    print('Package 2 not found')
