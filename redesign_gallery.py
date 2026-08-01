import re

with open('gallery.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace everything between <!-- start wpo-page-title --> and <!-- start wpo-portfolio-section -->
# Actually we will replace the wpo-page-title and inject our new sections before wpo-portfolio-section

new_sections = """
        <!-- Start Hero Section -->
        <section class="camrin-hero" style="position: relative; padding: 120px 0 80px; overflow: hidden; background-color: #fdfdfd; border-bottom: 1px solid #eaeaea;">
            <div style="position: absolute; top: -100px; right: -50px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%); pointer-events: none;"></div>
            
            <div class="container text-center" style="position: relative; z-index: 10;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px;">
                    <i class="fa fa-map-marker" style="color: #000; font-size: 14px;"></i>
                    <span style="color: #000; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;">Pan-India Coverage</span>
                </div>
                
                <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 56px; color: #000; line-height: 1.1; margin-bottom: 24px;">Wedding Photographer<br><span style="font-style: italic; color: #333;">Across India</span></h1>
                
                <p style="color: #555; font-size: 18px; max-width: 600px; margin: 0 auto 40px; font-family: 'Mulish', sans-serif; line-height: 1.6;">Kerala's trusted wedding photographers — covering 50+ cities across India with candid, cinematic storytelling.</p>
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <a href="https://wa.me/918714128539" target="_blank" style="display: inline-flex; align-items: center; gap: 10px; background: #000; color: #fff; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-family: 'Outfit', sans-serif; transition: all 0.3s ease; text-decoration: none; border: 1px solid #000;">
                        <i class="fa fa-whatsapp"></i> Chat on WhatsApp
                    </a>
                    <a href="contact.html" style="display: inline-flex; align-items: center; gap: 10px; background: transparent; color: #000; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-family: 'Outfit', sans-serif; transition: all 0.3s ease; text-decoration: none; border: 1px solid #000;">
                        Get a Free Quote
                    </a>
                </div>
            </div>
        </section>

        <!-- Start Stats Section -->
        <section style="padding: 60px 0; background-color: #fff; border-bottom: 1px solid #eaeaea;">
            <div class="container">
                <div class="row" style="text-align: center;">
                    <div class="col-md-3 col-6 mb-4 mb-md-0">
                        <div style="padding: 20px; border-right: 1px solid #eaeaea;">
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; color: #000; margin-bottom: 5px;">50+</h2>
                            <p style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Cities Covered</p>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-4 mb-md-0">
                        <div style="padding: 20px; border-right: 1px solid #eaeaea;">
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; color: #000; margin-bottom: 5px;">1000+</h2>
                            <p style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Weddings Captured</p>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div style="padding: 20px; border-right: 1px solid #eaeaea;">
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; color: #000; margin-bottom: 5px;">10+</h2>
                            <p style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Years of Experience</p>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div style="padding: 20px;">
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; color: #000; margin-bottom: 5px;">4.9 ★</h2>
                            <p style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Google Rating</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Start Cities Grid Section -->
        <style>
            .city-card {
                position: relative;
                border-radius: 16px;
                overflow: hidden;
                aspect-ratio: 4/3;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                text-decoration: none;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid #eaeaea;
                margin-bottom: 20px;
                background-color: #000;
            }
            .city-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            }
            .city-card img {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover;
                opacity: 0.6;
                transition: opacity 0.4s ease, transform 0.4s ease;
            }
            .city-card:hover img {
                opacity: 0.4;
                transform: scale(1.05);
            }
            .city-card .overlay-gradient {
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
                z-index: 1;
            }
            .city-card .content {
                position: relative;
                z-index: 2;
                padding: 20px;
            }
            .city-card h4 {
                color: #fff;
                font-family: 'Outfit', sans-serif;
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 5px;
                transition: color 0.3s ease;
            }
            .city-card:hover h4 {
                color: #eaeaea;
            }
            .city-card p {
                color: #aaa;
                font-size: 12px;
                margin: 0;
                font-family: 'Mulish', sans-serif;
            }
            .city-card .view-text {
                display: flex;
                align-items: center;
                gap: 5px;
                margin-top: 10px;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                color: #fff;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .city-card:hover .view-text {
                opacity: 1;
                transform: translateY(0);
            }
        </style>

        <section style="padding: 80px 0; background-color: #f9f9f9;">
            <div class="container">
                <div style="text-align: center; margin-bottom: 50px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                        <div style="height: 1px; width: 40px; background-color: #000;"></div>
                        <span style="color: #000; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;">Find Your City</span>
                        <div style="height: 1px; width: 40px; background-color: #000;"></div>
                    </div>
                    <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 36px; color: #000;">All Cities We Cover</h2>
                    <p style="color: #666; font-size: 15px; margin-top: 10px;">Click your city to see our work and get a custom quote</p>
                </div>

                <!-- Kerala -->
                <div style="margin-bottom: 40px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                        <i class="fa fa-map-marker" style="color: #000; font-size: 18px;"></i>
                        <h3 style="font-family: 'Outfit', sans-serif; font-size: 24px; margin: 0; color: #000;">Kerala</h3>
                        <div style="height: 1px; flex: 1; background-color: #eaeaea;"></div>
                    </div>
                    <div class="row">
                        <!-- Kochi -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/1.jpg" alt="Kochi" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Kochi</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Thiruvananthapuram -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/2.jpg" alt="Thiruvananthapuram" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Thiruvananthapuram</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Thrissur -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/3.jpg" alt="Thrissur" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Thrissur</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Calicut -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/4.jpg" alt="Calicut" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Calicut</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Kottayam -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/5.jpg" alt="Kottayam" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Kottayam</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Palakkad -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/6.jpg" alt="Palakkad" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Palakkad</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Kannur -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/7.jpg" alt="Kannur" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Kannur</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <!-- Alappuzha -->
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/8.jpg" alt="Alappuzha" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Alappuzha</h4>
                                    <p>Kerala</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Metro Cities -->
                <div style="margin-bottom: 40px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                        <i class="fa fa-map-marker" style="color: #000; font-size: 18px;"></i>
                        <h3 style="font-family: 'Outfit', sans-serif; font-size: 24px; margin: 0; color: #000;">Destination & Metro</h3>
                        <div style="height: 1px; flex: 1; background-color: #eaeaea;"></div>
                    </div>
                    <div class="row">
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/9.jpg" alt="Goa" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Goa</h4>
                                    <p>Destination Wedding</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/10.jpg" alt="Delhi" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Delhi</h4>
                                    <p>Metro City</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/11.jpg" alt="Bangalore" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Bangalore</h4>
                                    <p>Karnataka</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                        <div class="col-lg-3 col-md-4 col-sm-6">
                            <a href="#gallery" class="city-card">
                                <img src="assets/images/portfolio/12.jpg" alt="Chennai" loading="lazy">
                                <div class="overlay-gradient"></div>
                                <div class="content">
                                    <h4>Chennai</h4>
                                    <p>Tamil Nadu</p>
                                    <div class="view-text">View <i class="fa fa-chevron-right" style="font-size: 9px;"></i></div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
"""

pattern = re.compile(r'<!-- start wpo-page-title -->.*?<!-- end page-title -->', re.DOTALL)
new_content = pattern.sub(new_sections, content)

with open('gallery.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("Updated gallery.html")
