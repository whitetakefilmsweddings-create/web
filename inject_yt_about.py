import re

with open('about.html', 'r', encoding='utf-8') as f:
    text = f.read()

yt_html = """
    <!-- start youtube-feed-section -->
    <style>
        .instagram-feed-section {
            padding-top: 80px;
            padding-bottom: 90px;
            position: relative;
            z-index: 1;
            border-top: 1px solid #eaeaea;
            border-bottom: 1px solid #eaeaea;
            background: #ffffff;
        }
        .instagram-feed-section .couples-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: clamp(36px, 5vw, 64px) !important;
            margin-bottom: 20px;
            color: #555555;
        }
        .insta-subtitle {
            font-size: 18px;
            color: #666666;
            max-width: 650px;
            margin: 0 auto 30px auto;
            line-height: 1.6;
            font-family: "Cormorant Garamond", serif;
        }
        .instagram-card {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .instagram-card img {
            width: 100%;
            height: auto;
            aspect-ratio: 16/9;
            object-fit: cover;
            display: block;
            transition: transform 0.4s ease;
        }
        .instagram-card:hover img {
            transform: scale(1.05);
        }
        .insta-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .instagram-card:hover .insta-overlay {
            opacity: 1;
        }
        .insta-overlay i {
            color: #fff;
            font-size: 48px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
            transition: transform 0.3s ease;
        }
        .instagram-card:hover .insta-overlay i {
            transform: scale(1.1);
        }
    </style>

    <section class="instagram-feed-section section-padding" id="about-youtube-feed">
        <div class="container">
            <div class="row">
                <div style="width: 100%; text-align: center; margin-bottom: 50px;">
                    <h1 class="couples-title">Our Featured Videos</h1>
                    <div class="insta-subtitle">Real moments, real couples. Watch our cinematic films from weddings across Kerala.</div>
                </div>
            </div>
            <div class="row" id="youtube-grid">
                <!-- YouTube feed cards will be loaded here dynamically -->
            </div>
        </div>
    </section>
    
    <!-- Modal for YouTube Popup -->
    <div id="ytModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; align-items:center; justify-content:center; flex-direction:column; padding:20px;">
        <div style="position:relative; width:100%; max-width:900px; background:transparent; border-radius:12px;">
            <div style="position:absolute; top:-40px; right:0; color:#fff; font-size:30px; cursor:pointer;" onclick="closeYTPopup()">&times;</div>
            <div id="ytModalContent" style="width:100%;"></div>
        </div>
    </div>
    <!-- end youtube-feed-section -->
"""

new_text = text.replace('<!-- start of wpo-site-footer-section -->', yt_html + '\n<!-- start of wpo-site-footer-section -->')

# Now add the JS logic to the existing fetch
js_logic = """
                    // Handle YouTube Feeds for About Page
                    if (res.success && res.feeds && res.feeds.length > 0) {
                        const gridContainer = document.getElementById('youtube-grid');
                        
                        function getYoutubeVideoId(url) {
                            let videoId = null;
                            const cleanUrl = url.trim();
                            if (cleanUrl.includes('youtube.com/watch')) {
                                const match = cleanUrl.match(/[?&]v=([^&#]+)/);
                                if (match) videoId = match[1];
                            } else if (cleanUrl.includes('youtu.be/')) {
                                const parts = cleanUrl.split('/');
                                videoId = parts[parts.length - 1].split('?')[0];
                            } else if (cleanUrl.includes('youtube.com/embed/')) {
                                const parts = cleanUrl.split('/');
                                videoId = parts[parts.length - 1].split('?')[0];
                            } else if (cleanUrl.includes('youtube.com/shorts/')) {
                                const parts = cleanUrl.split('/');
                                videoId = parts[parts.length - 1].split('?')[0];
                            }
                            return videoId;
                        }

                        window.openYTPopup = function(id) {
                            const modal = document.getElementById('ytModal');
                            const content = document.getElementById('ytModalContent');
                            if (!modal || !content) return;
                            content.innerHTML = `
                                <iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" 
                                        width="100%" 
                                        height="315" 
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                        allowfullscreen
                                        style="border-radius: 12px; background: #000; border: none; display: block; margin: 0 auto; aspect-ratio: 16 / 9; height: auto;">
                                </iframe>
                            `;
                            modal.style.display = 'flex';
                        };

                        window.closeYTPopup = function() {
                            const modal = document.getElementById('ytModal');
                            const content = document.getElementById('ytModalContent');
                            if (modal) modal.style.display = 'none';
                            if (content) content.innerHTML = '';
                        };

                        gridContainer.innerHTML = '';
                        res.feeds.forEach(feed => {
                            if (feed.feed_key.startsWith('about_yt_')) {
                                const mediaId = getYoutubeVideoId(feed.post_url);
                                if (mediaId) {
                                    const coverUrl = `https://img.youtube.com/vi/${mediaId}/hqdefault.jpg`;
                                    const feedCol = document.createElement('div');
                                    feedCol.className = 'col-lg-4 col-md-6 col-12';
                                    feedCol.innerHTML = `
                                        <div class="instagram-card" onclick="window.openYTPopup('${mediaId}')">
                                            <img src="${coverUrl}" alt="YouTube Cover">
                                            <div class="insta-overlay">
                                                <i class="fa fa-play-circle"></i>
                                            </div>
                                        </div>
                                    `;
                                    gridContainer.appendChild(feedCol);
                                }
                            }
                        });
                    }
"""

if '// Handle YouTube Feeds for About Page' not in new_text:
    new_text = new_text.replace('                    }', js_logic + '                    }', 1)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('about.html updated with YouTube feeds')
