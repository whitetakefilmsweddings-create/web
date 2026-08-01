with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update GET route for gallery.php
get_route_search = """app.get('/pannl/gallery.php', checkPannlAuth, async (req, res) => {
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
});"""

get_route_replace = """app.get('/pannl/gallery.php', checkPannlAuth, async (req, res) => {
  try {
    const [textRows] = await panlePool.execute(
      "SELECT section_key, image_path FROM section_images WHERE section_key LIKE 'gal_%'"
    );
    let contentMap = {};
    textRows.forEach(row => {
      contentMap[row.section_key] = row.image_path;
    });

    const cheerio = require('cheerio');
    const fs = require('fs');
    const path = require('path');
    let places = [];
    
    const filePath = path.join(__dirname, 'gallery.html');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      const $ = cheerio.load(html);
      
      $('.wpo-portfolio-section .row').eq(1).find('.col-lg-3').each((i, el) => {
        const link = $(el).find('.city-card').attr('href') || '';
        const name = $(el).find('h4').text() || '';
        const state = $(el).find('p').text() || '';
        const image = $(el).find('img').attr('src') || '';
        
        if (name) {
          places.push({ name, state, link, image });
        }
      });
    }

    res.render('pannl/gallery', {
      user: req.session.user,
      getText: (key) => contentMap[key] || '',
      places: places
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});"""

content = content.replace(get_route_search, get_route_replace)

# 2. Update POST route for add_gallery_place
post_route_search = """app.post('/pannl/add_gallery_place', checkPannlAuth, async (req, res) => {
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
              <a href="wedding-photographer-${name.toLowerCase().replace(/\s+/g, '-')}.html" class="city-card">
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
    const newPagePath = path.join(__dirname, `wedding-photographer-${name.toLowerCase().replace(/\s+/g, '-')}.html`);
    
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
});"""

post_route_replace = """app.post('/pannl/add_gallery_place', checkPannlAuth, upload.single('image'), async (req, res) => {
  const name = req.body.name;
  const state = req.body.state;
  if (!name) return res.json({ success: false, message: 'Name is required' });
  
  try {
    const cheerio = require('cheerio');
    const fs = require('fs');
    const path = require('path');
    
    let finalImagePath = 'assets/images/portfolio/2.jpg';
    
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const newFileName = 'city_' + Date.now() + ext;
      const targetPath = path.join(__dirname, 'uploads', newFileName);
      
      fs.renameSync(req.file.path, targetPath);
      finalImagePath = 'uploads/' + newFileName;
    }
    
    // 1. Update gallery.html
    const filePath = path.join(__dirname, 'gallery.html');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      const $ = cheerio.load(html);
      
      const newCardHtml = `
          <div class="col-lg-3 col-md-4 col-6">
              <a href="wedding-photographer-${name.toLowerCase().replace(/\\s+/g, '-')}.html" class="city-card">
                  <img src="${finalImagePath}" alt="${name}" loading="lazy">
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
    if (req.file && require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
    res.json({ success: false, message: err.message });
  }
});

app.post('/pannl/delete_gallery_place', checkPannlAuth, async (req, res) => {
  const { name } = req.body;
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
      
      $('.wpo-portfolio-section .row').eq(1).find('.col-lg-3').each((i, el) => {
        if ($(el).find('h4').text() === name) {
          $(el).remove();
        }
      });
      
      fs.writeFileSync(filePath, $.html());
    }
    
    // 2. Delete specific city page
    const pageToDelete = path.join(__dirname, `wedding-photographer-${name.toLowerCase().replace(/\\s+/g, '-')}.html`);
    if (fs.existsSync(pageToDelete)) {
      fs.unlinkSync(pageToDelete);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});"""

content = content.replace(post_route_search, post_route_replace)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)
