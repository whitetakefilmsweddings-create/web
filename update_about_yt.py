with open('views/pannl/about.ejs', 'r', encoding='utf-8') as f:
    text = f.read()

yt_html = """
        <!-- YouTube Video Editor Section -->
        <div class="page-header" id="youtube-feed" style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 40px;">
            <h1>YouTube Feed Editor</h1>
            <p>Manage the 3x2 grid of YouTube Videos. Enter standard YouTube video URLs (e.g. <code>https://www.youtube.com/watch?v=F384n1wXQoY</code>).</p>
        </div>

        <div class="sections-container" style="margin-bottom: 60px;">
            <% if (typeof feeds !== 'undefined' && feeds) { 
                const ytFeeds = feeds.filter(f => f.feed_key.startsWith('about_yt_'));
            %>
                <% ytFeeds.forEach(function(feed, index) { 
                    const ytLabels = {
                        'about_yt_1': 'YouTube Slot 1 (Row 1, Col 1)',
                        'about_yt_2': 'YouTube Slot 2 (Row 1, Col 2)',
                        'about_yt_3': 'YouTube Slot 3 (Row 1, Col 3)',
                        'about_yt_4': 'YouTube Slot 4 (Row 2, Col 1)',
                        'about_yt_5': 'YouTube Slot 5 (Row 2, Col 2)',
                        'about_yt_6': 'YouTube Slot 6 (Row 2, Col 3)'
                    };
                    const label = ytLabels[feed.feed_key] || `Custom YouTube Slot (${feed.feed_key.replace('about_yt_', '')})`;
                %>
                    <div class="section-card" id="feed-card-<%= feed.feed_key %>" style="gap: 15px;">
                        <div class="section-card-title" style="display: flex; align-items: center; gap: 8px;">
                            <i class="fa-brands fa-youtube" style="color: #ff0000;"></i> <%= label %>
                        </div>
                        
                        <div style="background-color: #050505; border: 1px solid #222; border-radius: 8px; padding: 12px; font-size: 13px; color: #888;">
                            <div style="margin-bottom: 5px; font-weight: 600; color: #aaa;">Current Link:</div>
                            <div id="url-text-<%= feed.feed_key %>" style="word-break: break-all; font-family: monospace; max-height: 80px; overflow-y: auto;"><%= feed.post_url %></div>
                        </div>

                        <form class="feed-update-form" data-key="<%= feed.feed_key %>" style="display: flex; flex-direction: column; gap: 10px;">
                            <textarea name="post_url" placeholder="Paste YouTube Video Link" required rows="3"
                                      style="background: #000; border: 1px solid #333; color: #fff; padding: 10px 12px; border-radius: 8px; font-family: inherit; font-size: 13px; resize: vertical;"><%= feed.post_url %></textarea>
                            
                            <div class="upload-status" id="feed-status-<%= feed.feed_key %>" style="font-size: 12px; text-align: center;"></div>
                            
                            <div style="display: flex; gap: 10px;">
                                <button type="submit" class="upload-btn" style="background: #ff0000; color: #fff; flex-grow: 1;">Save Link</button>
                                <button type="button" class="upload-btn" onclick="handleDeleteSlot('<%= feed.feed_key %>')" style="background: #222; color: #ff4a4a; border: 1px solid #333; padding: 12px 15px;"><i class="fa fa-trash"></i></button>
                            </div>
                        </form>
                    </div>
                <% }) %>
            <% } %>

            <!-- Add New YouTube Slot Card -->
            <div class="section-card" id="add-card-yt" style="border: 2px dashed #333; min-height: 250px; display: flex; flex-direction: column; justify-content: center; background: transparent;">
                <div id="add-trigger-yt" style="text-align: center; color: #aaa; cursor: pointer;" onclick="toggleAddForm('yt', true)">
                    <i class="fa fa-plus-circle" style="font-size: 40px; margin-bottom: 10px; color: #ff0000;"></i>
                    <div style="font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">Add New YouTube Slot</div>
                </div>
                <div id="add-form-yt" style="display: none; flex-direction: column; gap: 12px; height: 100%;">
                    <div class="section-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Add YouTube Slot</span>
                        <i class="fa-solid fa-xmark" style="cursor: pointer; color: #888;" onclick="toggleAddForm('yt', false)"></i>
                    </div>
                    <form onsubmit="handleAddSlot(event, 'about_yt')" style="display: flex; flex-direction: column; gap: 10px; flex-grow: 1;">
                        <textarea name="post_url" placeholder="Paste YouTube Video Link" required rows="3"
                                  style="background: #000; border: 1px solid #333; color: #fff; padding: 10px 12px; border-radius: 8px; font-family: inherit; font-size: 13px; resize: vertical; flex-grow: 1;"></textarea>
                        <button type="submit" class="upload-btn" style="background: #ff0000; color: #fff;">Add Slot</button>
                    </form>
                </div>
            </div>
        </div>
"""

new_text = text.replace('    <script>', yt_html + '\n    <script>')

# I also need to make sure the JS in about.ejs has handleAddSlot, handleDeleteSlot, etc.
# Wait! Does about.ejs have those functions? Let's check.
if 'function handleAddSlot' not in new_text:
    print('WARNING: about.ejs is missing handleAddSlot. Will inject JS.')
    
    # Let's extract the JS functions from index.ejs
    with open('views/pannl/index.ejs', 'r', encoding='utf-8') as f_index:
        idx_text = f_index.read()
    
    import re
    # We want to extract handleAddSlot, handleDeleteSlot, toggleAddForm, handleFeedUpdate
    js_match = re.search(r'(async function handleAddSlot.*?)</script>', idx_text, re.DOTALL)
    if js_match:
        js_code = js_match.group(1)
        new_text = new_text.replace('    <script>', '    <script>\n' + js_code)
    else:
        print('Could not find JS in index.ejs!')

with open('views/pannl/about.ejs', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('about.ejs updated with YouTube panel.')
