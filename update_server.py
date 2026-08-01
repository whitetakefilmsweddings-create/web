import re

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update mappings for update_section_text.php
content = content.replace(
    "if (section_key.startsWith('srv_albums')) fileToUpdate = 'albums-prints.html';",
    "if (section_key.startsWith('srv_albums')) fileToUpdate = 'albums-prints.html';\n    if (section_key.startsWith('gal_')) fileToUpdate = 'gallery.html';"
)

content = content.replace(
    "if (section_key.startsWith('srv_')) page_name = 'services';",
    "if (section_key.startsWith('srv_')) page_name = 'services';\n      if (section_key.startsWith('gal_')) page_name = 'gallery';"
)

# 2. Add GET route for gallery.php right before services.php
gallery_get_route = """app.get('/pannl/gallery.php', checkPannlAuth, async (req, res) => {
  try {
    const [images] = await panlePool.query('SELECT * FROM section_images ORDER BY id ASC');
    const grouped_images = {};
    images.forEach(img => {
      if (!grouped_images[img.page_name]) {
        grouped_images[img.page_name] = [];
      }
      grouped_images[img.page_name].push(img);
    });

    const [textRows] = await panlePool.execute(
      "SELECT section_key, image_path FROM section_images WHERE section_key LIKE 'gal_%'"
    );
    let contentMap = {};
    textRows.forEach(row => {
      contentMap[row.section_key] = row.image_path;
    });

    res.render('pannl/gallery', {
      user: req.session.user,
      images: grouped_images,
      getText: (key) => contentMap[key] || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

"""
content = content.replace(
    "app.get('/pannl/services.php', checkPannlAuth, async (req, res) => {",
    gallery_get_route + "app.get('/pannl/services.php', checkPannlAuth, async (req, res) => {"
)

# 3. Add POST route for add_gallery_place
gallery_post_route = """app.post('/pannl/add_gallery_place', checkPannlAuth, async (req, res) => {
  const { name, state } = req.body;
  if (!name) return res.json({ success: false, message: 'Name is required' });
  
  try {
    const cheerio = require('cheerio');
    const fs = require('fs');
    const path = require('path');
    
    // 1. Update gallery.html
    const filePath = path.join(__dirname, 'gallery.html');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      const $ = cheerio.load(html);
      
      const newCardHtml = `
          <div class="col-lg-3 col-md-4 col-6">
              <a href="wedding-photographer-${name.toLowerCase().replace(/\\s+/g, '-')}.html" class="city-card">
                  <img src="assets/images/portfolio/2.jpg" alt="${name}" loading="lazy">
                  <div class="city-overlay">
                      <h4>${name}</h4>
                      <p>${state || 'Kerala'}</p>
                  </div>
              </a>
          </div>`;
      
      $('.wpo-portfolio-section .row').eq(1).append(newCardHtml);
      fs.writeFileSync(filePath, $.html());
    }
    
    // 2. Generate specific city page
    const templatePath = path.join(__dirname, 'wedding-photographer-thiruvananthapuram.html');
    const newPagePath = path.join(__dirname, `wedding-photographer-${name.toLowerCase().replace(/\\s+/g, '-')}.html`);
    
    if (fs.existsSync(templatePath)) {
      let template = fs.readFileSync(templatePath, 'utf8');
      template = template.replace(/Thiruvananthapuram/g, name);
      template = template.replace(/Trivandrum/g, name);
      fs.writeFileSync(newPagePath, template);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

"""

# Insert POST route before update_section_text.php
content = content.replace(
    "app.post('/pannl/update_section_text.php', checkPannlAuth, async (req, res) => {",
    gallery_post_route + "app.post('/pannl/update_section_text.php', checkPannlAuth, async (req, res) => {"
)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated server.js")
