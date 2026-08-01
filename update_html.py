import re
import os

hero_html = """
        <!-- Service Hero Section -->
        <section class="static-hero-video wpo-hero-style-3 playing" style="border: none !important; border-bottom: none !important;">
            <div class="video-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; overflow: hidden; background: #000;">
                <img id="{id_prefix}-img" src="assets/images/service/img-1.jpg" alt="Service" style="width: 100%; height: 100%; object-fit: cover; display: none; opacity: 0.8;">
                <iframe id="{id_prefix}-yt" src="https://www.youtube.com/embed/P8fEYT1RoxU?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1" 
                        frameborder="0" 
                        allow="autoplay; fullscreen" 
                        style="width: 100vw; height: 56.25vw; min-height: 100vh; min-width: 177.77vh; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; opacity: 0.8; display: block;">
                </iframe>
            </div>

            <div class="container-fluid">
                <div class="slide-content" style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100vh;">
                    <div class="slide-title">
                        <h2 id="{id_prefix}-title-hero" style="font-family: 'Cormorant Garamond', serif; font-size: 72px; font-weight: 400; text-transform: capitalize; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">Service Title</h2>
                    </div>
                </div>
            </div>
        </section>

        <!-- Service Description - Centered Layout -->
        <section class="service-dark-section" style="background: #ffffff; padding: 100px 0;">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-lg-10 col-md-12 text-center">
                        <h4 class="service-subtitle" id="{id_prefix}-subtitle" style="color: #000000; font-family: 'Mulish', sans-serif; font-size: 16px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; font-weight: 600;">Service Subtitle</h4>
                        <h2 class="service-title" id="{id_prefix}-title" style="color: #000000; font-family: 'Cormorant Garamond', serif; font-size: 48px; line-height: 1.2; margin-bottom: 30px; font-weight: 300;">Service Main Title Goes Here</h2>
                        <div class="service-desc" id="{id_prefix}-desc" style="color: #333333; font-family: 'Mulish', sans-serif; font-size: 18px; line-height: 1.8; margin-bottom: 60px;">
                            Description text for the service goes here.
                        </div>
                    </div>
                </div>
                
                <div class="row justify-content-center">
                    <div class="col-lg-10 col-md-12">
                        <!-- 2x3 Feature Grid -->
                        <div class="row">
"""

pages = {
    'wedding-photography.html': ('srv-wedding', 'Wedding Photography', 'Every glance, every tear, every burst of laughter — captured as it happens.', "Our photography style blends candid storytelling with timeless portraiture. We believe the most powerful images are never posed — they are stolen from real moments."),
    'cinematic-wedding-films.html': ('srv-cinematic', 'Cinematic Wedding Films', 'Your love story, filmed like a masterpiece.', 'Our cinematic films are more than just event coverage; they are beautifully crafted movies starring you.'),
    'pre-wedding-shoots.html': ('srv-prewed', 'Pre-Wedding Shoots', 'Celebrate your romance before the big day.', 'A relaxed, creative session to capture your unique chemistry in a beautiful location of your choice.'),
    'engagement-reception.html': ('srv-engagement', 'Engagement & Reception', 'From the first ring to the final dance.', 'We provide comprehensive coverage of your engagement ceremonies and grand receptions.'),
    'drone-coverage.html': ('srv-drone', 'Drone Coverage', 'Breathtaking aerial views of your grand celebration.', 'Add a cinematic, sweeping perspective to your wedding film with our professional drone coverage.'),
    'albums-prints.html': ('srv-albums', 'Albums & Prints', 'Hold your memories in the highest quality.', 'Our luxury, handcrafted albums are designed to last generations.')
}

for filename, data in pages.items():
    prefix, subtitle, title, desc = data
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            html = f.read()
            
        custom_hero = hero_html.replace('{id_prefix}', prefix)
        custom_hero = custom_hero.replace('Service Title', subtitle)
        custom_hero = custom_hero.replace('Service Subtitle', subtitle)
        custom_hero = custom_hero.replace('Service Main Title Goes Here', title)
        custom_hero = custom_hero.replace('Description text for the service goes here.', desc)

        pattern = re.compile(r'<section class="service-dark-section".*?<!-- 2x3 Feature Grid -->\s*<div class="row">', re.DOTALL)
        
        if pattern.search(html):
            new_html = pattern.sub(custom_hero, html)
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_html)
            print(f'Updated {filename}')
        else:
            print(f'Pattern not found in {filename}')
    except Exception as e:
        print(f'Error processing {filename}: {e}')
