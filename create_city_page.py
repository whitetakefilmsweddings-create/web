import re

# 1. Create wedding-photographer-thiruvananthapuram.html
with open('gallery.html', 'r', encoding='utf-8') as f:
    gallery_content = f.read()

# Update Title and Meta
page_content = gallery_content.replace(
    "<title>Our Gallery | WhiteTake Films - Captured Moments</title>",
    "<title>Wedding Photographer in Thiruvananthapuram | WhiteTake Films</title>"
).replace(
    '<meta name="description"\n        content="Browse our portfolio of stunning wedding photography, pre-wedding shoots, and cinematic moments captured by WhiteTake Films across Kerala.">',
    '<meta name="description"\n        content="Wedding photography in Thiruvananthapuram by WhiteTake Films. Temple ceremonies, coastal receptions and candid coverage across Kerala\'s capital city.">'
).replace(
    '<li class="active">\n                                            <a href="gallery.html">Gallery</a>\n                                        </li>',
    '<li>\n                                            <a href="gallery.html">Gallery</a>\n                                        </li>'
)

new_sections = """
        <!-- Start Hero Section -->
        <section class="camrin-hero" style="position: relative; padding: 120px 0 80px; overflow: hidden; background-color: #fdfdfd; border-bottom: 1px solid #eaeaea;">
            <div style="position: absolute; inset: 0; background-image: url('assets/images/portfolio/2.jpg'); background-size: cover; background-position: center; opacity: 0.15;"></div>
            <div style="position: absolute; top: -100px; right: -50px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%); pointer-events: none;"></div>
            
            <div class="container text-center" style="position: relative; z-index: 10;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px;">
                    <i class="fa fa-map-marker" style="color: #000; font-size: 14px;"></i>
                    <span style="color: #000; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;">Thiruvananthapuram, Kerala</span>
                </div>
                
                <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 56px; color: #000; line-height: 1.1; margin-bottom: 24px;">Wedding Photographer in<br><span style="font-style: italic; color: #333;">Thiruvananthapuram</span></h1>
                
                <p style="color: #555; font-size: 18px; max-width: 800px; margin: 0 auto 40px; font-family: 'Mulish', sans-serif; line-height: 1.6;">There is a weight to weddings in Thiruvananthapuram, known across South India as Trivandrum, that you rarely find elsewhere in Kerala. Ancient temples, families with roots that go back many generations, and a coastline at Kovalam that turns gold and deep pink when the sun goes down. The city does not rush. The ceremonies are observed with full attention. And the photographs that come from days like these are the ones families hold on to for a very long time.</p>
                
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
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; color: #000; margin-bottom: 5px;">10+</h2>
                            <p style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Years of Experience</p>
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
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; color: #000; margin-bottom: 5px;">20+</h2>
                            <p style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Cities Covered</p>
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

        <!-- Start SEO Content Section -->
        <section style="padding: 80px 0; background-color: #fdfdfd;">
            <div class="container" style="max-width: 800px;">
                <div style="color: #444; font-size: 16px; line-height: 1.8; font-family: 'Mulish', sans-serif;">
                    <p style="margin-bottom: 20px;">Thiruvananthapuram carries a formality in its weddings that reflects its history. This is where the state's institutions, its courts, its oldest families, have been rooted for centuries. The celebrations here are serious in the best sense of the word. Nobody rushes. The rituals are completed with care and the photographs taken during them are treated as documents that will matter for decades.</p>
                    <p style="margin-bottom: 20px;">The temple wedding ceremonies in this city are among the most precisely observed in Kerala. The rituals follow sequences that have remained unchanged through many generations. Covering them requires a wedding photographer in Trivandrum who knows when to move, when to stay completely still, and when to step back entirely. The photographs that come from that restraint are usually the ones families prize the most.</p>
                    <p style="margin-bottom: 20px;">The coastline near Thiruvananthapuram changes everything about a wedding visually. Kovalam and the resort belt along the southern Kerala coast have a quality of evening light that is hard to describe and easy to see in the photographs. The Arabian Sea at sunset, the warm tones of a beachside reception, the colour that builds in the sky between six and seven in the evening: candid wedding photography responds to all of it.</p>
                    <p style="margin-bottom: 20px;">A temple ceremony in the morning followed by a coastal reception at dusk is a pattern we see often in Thiruvananthapuram. These two settings require a completely different approach from the photography team. Restraint and patience in the temple. Movement, positioning, and an instinct for changing light at the beach. We work comfortably across both within the same day.</p>
                </div>
            </div>
        </section>

        <!-- Start Venues Section -->
        <section style="padding: 60px 0; background-color: #f9f9f9; border-top: 1px solid #eaeaea; border-bottom: 1px solid #eaeaea;">
            <div class="container" style="max-width: 800px; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                    <div style="height: 1px; width: 40px; background-color: #000;"></div>
                    <span style="color: #000; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;">Venues</span>
                    <div style="height: 1px; width: 40px; background-color: #000;"></div>
                </div>
                <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #000; margin-bottom: 10px;">Wedding Venues in Thiruvananthapuram</h2>
                <p style="color: #666; font-size: 15px; margin-bottom: 40px;">Venues where we have photographed and would love to shoot</p>
                
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #eaeaea; padding: 10px 20px; border-radius: 50px;">
                        <i class="fa fa-check-circle" style="color: #000;"></i> <span style="color: #333; font-size: 14px; font-weight: 500;">Vivanta Trivandrum</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #eaeaea; padding: 10px 20px; border-radius: 50px;">
                        <i class="fa fa-check-circle" style="color: #000;"></i> <span style="color: #333; font-size: 14px; font-weight: 500;">Uday Samudra</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #eaeaea; padding: 10px 20px; border-radius: 50px;">
                        <i class="fa fa-check-circle" style="color: #000;"></i> <span style="color: #333; font-size: 14px; font-weight: 500;">Leela Kovalam</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #eaeaea; padding: 10px 20px; border-radius: 50px;">
                        <i class="fa fa-check-circle" style="color: #000;"></i> <span style="color: #333; font-size: 14px; font-weight: 500;">Hycinth Hotel</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #eaeaea; padding: 10px 20px; border-radius: 50px;">
                        <i class="fa fa-check-circle" style="color: #000;"></i> <span style="color: #333; font-size: 14px; font-weight: 500;">O by Tamara</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Start FAQ Section -->
        <style>
            .faq-item {
                background: #fff;
                border: 1px solid #eaeaea;
                border-radius: 12px;
                margin-bottom: 15px;
                overflow: hidden;
            }
            .faq-question {
                padding: 20px;
                font-weight: 600;
                color: #000;
                font-size: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }
            .faq-answer {
                padding: 0 20px 20px;
                color: #555;
                font-size: 15px;
                line-height: 1.6;
                display: none;
            }
            .faq-question.active + .faq-answer {
                display: block;
            }
            .faq-question i {
                transition: transform 0.3s ease;
            }
            .faq-question.active i {
                transform: rotate(180deg);
            }
        </style>

        <section style="padding: 80px 0; background-color: #fdfdfd;">
            <div class="container" style="max-width: 800px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                        <div style="height: 1px; width: 40px; background-color: #000;"></div>
                        <span style="color: #000; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;">FAQ</span>
                        <div style="height: 1px; width: 40px; background-color: #000;"></div>
                    </div>
                    <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #000;">Frequently Asked Questions</h2>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="this.classList.toggle('active')">
                        How much does wedding photography cost in Thiruvananthapuram?
                        <i class="fa fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        Wedding photography in Thiruvananthapuram with WhiteTake Films is custom-priced based on your coverage days, crew size, and deliverables. Contact us for a tailored quote for your special day.
                    </div>
                </div>
                <div class="faq-item">
                    <div class="faq-question" onclick="this.classList.toggle('active')">
                        Is WhiteTake Films available for weddings outside Thiruvananthapuram?
                        <i class="fa fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        Yes. While we are based in Trivandrum and capture many beautiful weddings here, we regularly travel across Kerala and all over India for destination weddings.
                    </div>
                </div>
                <div class="faq-item">
                    <div class="faq-question" onclick="this.classList.toggle('active')">
                        How far in advance should I book my wedding photographer?
                        <i class="fa fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        We recommend booking 6–12 months in advance, especially during the peak wedding season (October–February). Securing your date early ensures our team's availability.
                    </div>
                </div>
            </div>
        </section>
"""

pattern = re.compile(r'<!-- Start Hero Section -->.*?<!-- start wpo-portfolio-section -->', re.DOTALL)
page_content = pattern.sub(new_sections + "\n        <!-- start wpo-portfolio-section -->", page_content)

with open('wedding-photographer-thiruvananthapuram.html', 'w', encoding='utf-8') as f:
    f.write(page_content)
    
# 2. Update gallery.html to link to the new page
gallery_content = gallery_content.replace(
    '<a href="#gallery" class="city-card">\n                                <img src="assets/images/portfolio/2.jpg" alt="Thiruvananthapuram" loading="lazy">',
    '<a href="wedding-photographer-thiruvananthapuram.html" class="city-card">\n                                <img src="assets/images/portfolio/2.jpg" alt="Thiruvananthapuram" loading="lazy">'
)

with open('gallery.html', 'w', encoding='utf-8') as f:
    f.write(gallery_content)
    
print("Created wedding-photographer-thiruvananthapuram.html and updated gallery.html")
