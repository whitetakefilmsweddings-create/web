import os
import re

services = {
    'wedding-photography.html': ('wedding', 'Wedding Photography', 'Every glance, every tear, every burst of laughter — captured as it happens.', "Our photography style blends candid storytelling with timeless portraiture. We believe the most powerful images are never posed — they're stolen from real moments."),
    'cinematic-wedding-films.html': ('cinema', 'Cinematic Wedding Films', 'Your love story, told like a timeless movie.', 'We craft beautiful, cinematic wedding films that let you relive the magic, emotions, and vows of your big day with a premium feel.'),
    'pre-wedding-shoots.html': ('prewedding', 'Pre-Wedding Shoots', 'Celebrate your connection before the vows.', 'Relaxed, creative, and beautiful photo sessions that capture your unique chemistry in stunning locations before the wedding rush begins.'),
    'engagement-reception.html': ('engagement', 'Engagement & Reception', 'The beginning of forever and the ultimate celebration.', 'From ring exchanges to the final dance, we document the joy, family bonds, and epic moments of your engagement and reception parties.'),
    'drone-coverage.html': ('drone', 'Drone Coverage', 'Breathtaking aerial perspectives of your celebration.', 'Elevate your wedding story with cinematic drone footage that captures the scale, venue beauty, and grandeur of your events from above.'),
    'albums-prints.html': ('albums', 'Albums & Prints', 'Tangible memories crafted with premium quality.', 'Preserve your legacy in beautifully designed, handcrafted albums and prints that you can hold and pass down through generations.')
}

template = """        <!-- Service Description - Dark Theme Redesign -->
        <section class="service-dark-section" style="background: #0f1014; padding: 100px 0;">
            <div class="container">
                <div class="row align-items-center">
                    <!-- Left: Large Image -->
                    <div class="col-lg-5 col-md-12 mb-5 mb-lg-0">
                        <div class="service-feature-image" style="border-radius: 20px; overflow: hidden; position: relative;">
                            <img id="srv-{prefix}-img" src="assets/images/service/{filename_no_ext}.jpg" alt="{subtitle}" style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 4/5;">
                        </div>
                    </div>
                    <!-- Right: Text & Grid -->
                    <div class="col-lg-7 col-md-12 ps-lg-5">
                        <h4 class="service-subtitle" id="srv-{prefix}-subtitle" style="color: #c0aa83; font-family: 'Mulish', sans-serif; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; font-weight: 600;">{subtitle}</h4>
                        
                        <h2 class="service-title" id="srv-{prefix}-title" style="color: #ffffff; font-family: 'Cormorant Garamond', serif; font-size: 42px; line-height: 1.2; margin-bottom: 25px; font-weight: 300;">{title}</h2>
                        
                        <div class="service-desc" id="srv-{prefix}-desc" style="color: #999999; font-family: 'Mulish', sans-serif; font-size: 16px; line-height: 1.8; margin-bottom: 40px;">
                            {desc}
                        </div>
                        
                        <!-- 2x3 Feature Grid -->
                        <div class="row">
                            <!-- Box 1 -->
                            <div class="col-md-6 mb-4">
                                <div class="service-grid-box" style="background: #1a1b20; border: 1px solid #2a2b30; border-radius: 12px; padding: 25px; height: 100%; transition: all 0.3s ease;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <i class="fi flaticon-gallery" style="color: #c0aa83; font-size: 24px; margin-top: 3px;"></i>
                                        <div>
                                            <h4 id="srv-{prefix}-f1-title" style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Feature 1</h4>
                                            <p id="srv-{prefix}-f1-desc" style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Description for this feature goes here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Box 2 -->
                            <div class="col-md-6 mb-4">
                                <div class="service-grid-box" style="background: #1a1b20; border: 1px solid #2a2b30; border-radius: 12px; padding: 25px; height: 100%; transition: all 0.3s ease;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <i class="fi flaticon-wedding-rings" style="color: #c0aa83; font-size: 24px; margin-top: 3px;"></i>
                                        <div>
                                            <h4 id="srv-{prefix}-f2-title" style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Feature 2</h4>
                                            <p id="srv-{prefix}-f2-desc" style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Description for this feature goes here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Box 3 -->
                            <div class="col-md-6 mb-4">
                                <div class="service-grid-box" style="background: #1a1b20; border: 1px solid #2a2b30; border-radius: 12px; padding: 25px; height: 100%; transition: all 0.3s ease;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <i class="fi flaticon-heart" style="color: #c0aa83; font-size: 24px; margin-top: 3px;"></i>
                                        <div>
                                            <h4 id="srv-{prefix}-f3-title" style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Feature 3</h4>
                                            <p id="srv-{prefix}-f3-desc" style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Description for this feature goes here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Box 4 -->
                            <div class="col-md-6 mb-4">
                                <div class="service-grid-box" style="background: #1a1b20; border: 1px solid #2a2b30; border-radius: 12px; padding: 25px; height: 100%; transition: all 0.3s ease;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <i class="fi flaticon-edit" style="color: #c0aa83; font-size: 24px; margin-top: 3px;"></i>
                                        <div>
                                            <h4 id="srv-{prefix}-f4-title" style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Feature 4</h4>
                                            <p id="srv-{prefix}-f4-desc" style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Description for this feature goes here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Box 5 -->
                            <div class="col-md-6 mb-4 mb-md-0">
                                <div class="service-grid-box" style="background: #1a1b20; border: 1px solid #2a2b30; border-radius: 12px; padding: 25px; height: 100%; transition: all 0.3s ease;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <i class="fi flaticon-gallery" style="color: #c0aa83; font-size: 24px; margin-top: 3px;"></i>
                                        <div>
                                            <h4 id="srv-{prefix}-f5-title" style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Feature 5</h4>
                                            <p id="srv-{prefix}-f5-desc" style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Description for this feature goes here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Box 6 -->
                            <div class="col-md-6">
                                <div class="service-grid-box" style="background: #1a1b20; border: 1px solid #2a2b30; border-radius: 12px; padding: 25px; height: 100%; transition: all 0.3s ease;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <i class="fi flaticon-camera" style="color: #c0aa83; font-size: 24px; margin-top: 3px;"></i>
                                        <div>
                                            <h4 id="srv-{prefix}-f6-title" style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Feature 6</h4>
                                            <p id="srv-{prefix}-f6-desc" style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Description for this feature goes here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .service-grid-box:hover {{
                    background: #22232a !important;
                    border-color: #c0aa83 !important;
                    transform: translateY(-5px);
                }}
            </style>
        </section>"""

for filename, data in services.items():
    prefix, subtitle, title, desc = data
    filename_no_ext = filename.replace('.html', '')
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_html = template.format(prefix=prefix, subtitle=subtitle, title=title, desc=desc, filename_no_ext=filename_no_ext)
    
    # Replace the old service-description section
    pattern = re.compile(r'<!-- Service Description -->.*?<!-- start wpo-portfolio-section -->', re.DOTALL)
    
    content = pattern.sub(new_html + '\\n\\n        <!-- start wpo-portfolio-section -->', content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Updated {filename}")
