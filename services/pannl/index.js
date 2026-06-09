const express = require('express');
const session = require('express-session');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { panlePool, sessionStore } = require('../../config/db');

const app = express();
const PORT = process.env.PANNL_PORT || 3003;

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Shared Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'whitetake_films_express_secret_2026',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Setup Multer temp folder
const tempUploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}
const upload = multer({ dest: tempUploadDir });

// Setup Cache folder for direct writes
const cacheDir = path.join(__dirname, '../../uploads/cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Authentication Middleware Helper
function checkPannlAuth(req, res, next) {
  if (!req.session.adminLoggedIn) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.redirect('/pannl/login.php');
  }
  next();
}

// Helper to calculate SHA-256 hash of a buffer
function getBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper to save binary asset to assets table and cache it locally
async function saveAsset(buffer, originalFilename, mimeType, ext) {
  const hash = getBufferHash(buffer);
  const filename = `${hash}.${ext}`;
  
  // Insert to DB assets table
  await panlePool.query(
    `INSERT IGNORE INTO assets (id, filename, mime_type, data, size_bytes) VALUES (?, ?, ?, ?, ?)`,
    [hash, filename, mimeType, buffer, buffer.length]
  );
  
  // Save locally in cache folder
  const cachePath = path.join(cacheDir, filename);
  fs.writeFileSync(cachePath, buffer);
  
  return `/api/assets/file/${filename}`;
}

// ----------------------------------------------------
// PANNL CMS ROUTES
// ----------------------------------------------------
app.get('/pannl', (req, res) => res.redirect('/pannl/index.php'));

app.get('/pannl/login.php', (req, res) => {
  if (req.session.adminLoggedIn) {
    return res.redirect('/pannl/index.php');
  }
  res.render('pannl/login', { error: '' });
});

app.post('/pannl/login.php', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'Noufal@2026';

  if (password === adminPass) {
    req.session.adminLoggedIn = true;
    res.redirect('/pannl/index.php');
  } else {
    res.render('pannl/login', { error: 'Invalid admin password. Please try again.' });
  }
});

app.get('/pannl/logout.php', (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect('/pannl/login.php');
});

app.get('/pannl/Image_admin', checkPannlAuth, (req, res) => {
  // Return the Image_admin configuration/static file
  res.sendFile(path.join(__dirname, '../../Image_admin'));
});

app.get('/pannl/index.php', checkPannlAuth, async (req, res) => {
  try {
    const [images] = await panlePool.query('SELECT * FROM section_images ORDER BY id ASC');
    const grouped_images = {};
    images.forEach(img => {
      if (!grouped_images[img.page_name]) {
        grouped_images[img.page_name] = [];
      }
      grouped_images[img.page_name].push(img);
    });

    const [feeds] = await panlePool.query('SELECT * FROM instagram_feeds ORDER BY id ASC');

    res.render('pannl/index', { grouped_images, feeds });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Admin Add Map Pin
app.post('/pannl/add_map_pin', checkPannlAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, pos_x, pos_y } = req.body;
    let image_path = '';
    
    if (req.file) {
      const tempPath = req.file.path;
      
      const buffer = await sharp(tempPath)
        .resize(800, 600, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      fs.unlinkSync(tempPath);
      
      // Save binary asset and get URL instead of base64
      image_path = await saveAsset(buffer, req.file.originalname, 'image/jpeg', 'jpg');
    }
    
    // Save pos_x/pos_y into lat/lng fields to preserve current MySQL schema compatibility
    await panlePool.query(
      'INSERT INTO map_pins (title, description, image_path, lat, lng) VALUES (?, ?, ?, ?, ?)', 
      [title, description, image_path, pos_x || 50.0, pos_y || 50.0]
    );
    res.json({ success: true, path: image_path });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: false, message: err.message });
  }
});

// Admin Delete Map Pin
app.post('/pannl/delete_map_pin', checkPannlAuth, async (req, res) => {
  try {
    const { id } = req.body;
    await panlePool.query('DELETE FROM map_pins WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/pannl/about.php', checkPannlAuth, async (req, res) => {
  try {
    const [images] = await panlePool.query('SELECT * FROM section_images ORDER BY id ASC');
    const grouped_images = {};
    images.forEach(img => {
      if (!grouped_images[img.page_name]) {
        grouped_images[img.page_name] = [];
      }
      grouped_images[img.page_name].push(img);
    });

    const [feeds] = await panlePool.query('SELECT * FROM instagram_feeds WHERE feed_key LIKE "about_yt_%" ORDER BY id ASC');

    const [map_pins] = await panlePool.query('SELECT * FROM map_pins ORDER BY id DESC');
    
    // Map lat/lng database fields to pos_x/pos_y for the frontend template
    const mappedPins = map_pins.map(pin => ({
      id: pin.id,
      title: pin.title,
      description: pin.description,
      image_path: pin.image_path,
      pos_x: pin.lat,
      pos_y: pin.lng,
      created_at: pin.created_at
    }));

    res.render('pannl/about', { grouped_images, feeds, map_pins: mappedPins });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/pannl/update_feed.php', checkPannlAuth, async (req, res) => {
  const { feed_key, post_url } = req.body;
  if (!feed_key || !post_url) {
    return res.json({ success: false, message: 'Missing parameters' });
  }
  try {
    await panlePool.execute(
      'UPDATE instagram_feeds SET post_url = ? WHERE feed_key = ?',
      [post_url, feed_key]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/pannl/update_section_text.php', checkPannlAuth, async (req, res) => {
  const { section_key, text_value } = req.body;
  if (!section_key) {
    return res.json({ success: false, message: 'Missing parameters' });
  }
  try {
    await panlePool.execute(
      'UPDATE section_images SET image_path = ? WHERE section_key = ?',
      [text_value || '', section_key]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/pannl/add_feed.php', checkPannlAuth, async (req, res) => {
  const { type, post_url } = req.body;
  if (!type || !post_url) {
    return res.json({ success: false, message: 'Missing parameters' });
  }
  try {
    const timestamp = Date.now();
    const feed_key = type === 'about_yt' ? `about_yt_${timestamp}` : type === 'yt' ? `yt_${timestamp}` : `feed_${timestamp}`;
    await panlePool.execute(
      'INSERT INTO instagram_feeds (feed_key, post_url) VALUES (?, ?)',
      [feed_key, post_url]
    );
    res.json({ success: true, feed_key });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/pannl/delete_feed.php', checkPannlAuth, async (req, res) => {
  const { feed_key } = req.body;
  if (!feed_key) {
    return res.json({ success: false, message: 'Missing parameters' });
  }
  try {
    await panlePool.execute(
      'DELETE FROM instagram_feeds WHERE feed_key = ?',
      [feed_key]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/pannl/delete_image.php', checkPannlAuth, async (req, res) => {
  const { section_key } = req.body;
  if (!section_key) {
    return res.json({ success: false, message: 'Missing section key' });
  }
  try {
    await panlePool.execute(
      'UPDATE section_images SET image_path = "" WHERE section_key = ?',
      [section_key]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Image upload and processing using sharp, saving as binary asset instead of Base64
app.post('/pannl/upload.php', checkPannlAuth, upload.single('image'), async (req, res) => {
  const sectionKey = req.body.section_key;
  if (!sectionKey) {
    return res.json({ success: false, message: 'Missing section key' });
  }
  if (!req.file) {
    return res.json({ success: false, message: 'Upload failed or no file sent' });
  }

  const tempPath = req.file.path;

  // Validate size limit (10MB)
  const sizeLimit = 10 * 1024 * 1024;
  if (req.file.size > sizeLimit) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return res.json({ success: false, message: 'Image exceeds the 10MB size limit.' });
  }

  const isFavorite = sectionKey.startsWith('favorite_') || sectionKey.startsWith('story_img_');
  const targetWidth = 1080;
  const targetHeight = isFavorite ? 1080 : 1350;

  try {
    // Sharp center crop resize and compress
    const buffer = await sharp(tempPath)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 90 }) // default to webp format for CMS uploads to optimize speed!
      .toBuffer();

    fs.unlinkSync(tempPath);

    // Save as binary asset and get Asset URL
    const assetUrl = await saveAsset(buffer, req.file.originalname, 'image/webp', 'webp');

    // Update section_images in DB
    await panlePool.execute(
      'UPDATE section_images SET image_path = ? WHERE section_key = ?',
      [assetUrl, sectionKey]
    );

    res.json({ success: true, path: assetUrl });
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.json({ success: false, message: err.message });
  }
});

// API config for CMS sections
app.get('/pannl/api.php', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const page = req.query.page;
  try {
    let results = [];
    if (page) {
      [results] = await panlePool.execute('SELECT section_key, image_path FROM section_images WHERE page_name = ?', [page]);
    } else {
      [results] = await panlePool.query('SELECT section_key, image_path FROM section_images');
    }

    const images = {};
    results.forEach(row => {
      if (row.image_path) {
        images[row.section_key] = row.image_path;
      }
    });

    let feeds = [];
    if (!page || page === 'home') {
      const [feedRows] = await panlePool.query('SELECT feed_key, post_url FROM instagram_feeds WHERE feed_key LIKE "yt_%" OR feed_key LIKE "feed_%" ORDER BY id ASC');
      feeds = feedRows;
    } else if (page === 'about') {
      const [feedRows] = await panlePool.query('SELECT feed_key, post_url FROM instagram_feeds WHERE feed_key LIKE "about_yt_%" ORDER BY id ASC');
      feeds = feedRows;
    }

    res.json({
      success: true,
      images: images,
      feeds: feeds
    });
  } catch (err) {
    res.json({ success: false, message: `Database error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Pannl CMS Microservice running on http://localhost:${PORT}`);
});
