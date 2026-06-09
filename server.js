const express = require('express');
const proxy = require('express-http-proxy');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const { tdsPool, panlePool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Internal Microservices Ports
const FRONTEND_PORT = 3001;
const PORTAL_PORT = 3002;
const PANNL_PORT = 3003;
const ASSETS_PORT = 3004;

process.env.FRONTEND_PORT = FRONTEND_PORT;
process.env.PORTAL_PORT = PORTAL_PORT;
process.env.PANNL_PORT = PANNL_PORT;
process.env.ASSETS_PORT = ASSETS_PORT;

// Spawns all microservices
function startMicroservices() {
  const services = [
    { name: 'Frontend', path: path.join(__dirname, 'services/frontend/index.js') },
    { name: 'Portal', path: path.join(__dirname, 'services/portal/index.js') },
    { name: 'Pannl', path: path.join(__dirname, 'services/pannl/index.js') },
    { name: 'Assets', path: path.join(__dirname, 'services/assets/index.js') }
  ];

  services.forEach(service => {
    console.log(`[Gateway] Spawning ${service.name} service...`);
    const proc = fork(service.path, [], { env: process.env });
    
    proc.on('close', (code) => {
      console.error(`[Gateway] ${service.name} service exited with code ${code}`);
    });
  });
}

// ----------------------------------------------------
// DATABASE INITIALIZATION & MIGRATIONS
// ----------------------------------------------------
async function initDatabases() {
  try {
    // 1. Setup u406992830_tds Schema
    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        folder_id VARCHAR(255) DEFAULT NULL,
        ai_folder_id VARCHAR(255) DEFAULT NULL,
        gallery_code VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('paid', 'unpaid', 'pending') DEFAULT 'unpaid',
        pdf_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        description VARCHAR(255) NOT NULL,
        quantity INT DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      );
    `);

    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS client_selections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        file_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS client_rejections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        file_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    await tdsPool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        appointment_date DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    // Insert/Sync Default Admin
    const adminEmail = 'admin@whitetakefilms';
    const adminPass = 'Whitetake@924';
    const [admins] = await tdsPool.query('SELECT * FROM admins WHERE email = ?', [adminEmail]);
    if (admins.length === 0) {
      await tdsPool.query('INSERT INTO admins (email, password) VALUES (?, ?)', [adminEmail, adminPass]);
    } else {
      await tdsPool.query('UPDATE admins SET password = ? WHERE email = ?', [adminPass, adminEmail]);
    }

    // 2. Setup u406992830_panle Schema
    await panlePool.query(`
      CREATE TABLE IF NOT EXISTS section_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_name VARCHAR(50) NOT NULL,
        section_key VARCHAR(50) NOT NULL UNIQUE,
        image_path LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const defaults = [
      ['home', 'intimate_1', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg'],
      ['home', 'intimate_2', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg'],
      ['home', 'intimate_3', 'https://weddingbellsstories.com/media_library/weddingbells-image-6tfhrz.jpg'],
      ['home', 'intimate_logo_bg', 'pannl/uploads/img_intimate_1_1780509901722.jpg'],
      ['about', 'about_title_bg', 'pic/service/Wedding%20Photography%20copy.webp'],
      ['about', 'about_hero_video', 'ScMzIvxBSi4'],
      ['about', 'about_intimate_1', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg'],
      ['about', 'about_intimate_2', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg'],
      ['about', 'about_intimate_3', 'https://weddingbellsstories.com/media_library/weddingbells-image-6tfhrz.jpg'],
      ['about', 'about_intimate_logo_bg', 'pannl/uploads/img_intimate_1_1780509901722.jpg'],
      ['cinematic-wedding-films', 'cinematic_wedding_films_title_bg', 'pic/service/Cinematic%20Wedding%20Films.webp'],
      ['wedding-photography', 'wedding_photography_title_bg', 'pic/service/Wedding%20Photography%20copy.webp'],
      ['pre-wedding-shoots', 'pre_wedding_shoots_title_bg', 'pic/service/Pre-Wedding%20Shoots.webp'],
      ['engagement-reception', 'engagement_reception_title_bg', 'pic/service/Engagement%20_Reception.webp'],
      ['drone-coverage', 'drone_coverage_title_bg', 'pic/service/dron.webp'],
      ['albums-prints', 'albums_prints_title_bg', 'pic/service/album.webp'],
      ['gallery', 'gallery_title_bg', 'assets/images/slider/s3.jpg'],
      ['contact', 'contact_title_bg', 'assets/images/slider/s3.jpg'],
      ['home', 'feature_image', 'assets/images/slider/s3.jpg'],
      ['home', 'feature_video', 'https://www.youtube.com/watch?v=F384n1wXQoY'],
      // Services Accordion
      ['home', 'services_accordion_1', 'pic/service/Wedding%20Photography%20copy.webp'],
      ['home', 'services_accordion_2', 'pic/service/Pre-Wedding%20Shoots.webp'],
      ['home', 'services_accordion_3', 'pic/service/Engagement%20_Reception.webp'],
      ['home', 'services_accordion_4', 'pic/service/Cinematic%20Wedding%20Films.webp'],
      ['home', 'services_accordion_5', 'pic/service/dron.webp'],
      ['home', 'services_accordion_6', 'pic/service/album.webp'],
      // Story Cards
      ['home', 'story_img_1', 'pic/Your Love, Our Passion/pic1.webp'],
      ['home', 'story_names_1', 'ANEENA & GARY'],
      ['home', 'story_subtitle_1', 'Blooms and Belonging: A Timeless Romance'],
      ['home', 'story_desc_1', "Some love stories don't need grand declarations to be understood: they are felt in the very air surrounding a couple. With Aneena and Gary, the connection they share radiates a simple kind..."],
      ['home', 'story_link_1', '#'],
      ['home', 'story_img_2', 'pic/Your Love, Our Passion/pic2.webp'],
      ['home', 'story_names_2', 'JOSEPH & NAINA'],
      ['home', 'story_subtitle_2', 'A Tapestry of Emerald and Earth'],
      ['home', 'story_desc_2', "Some love stories don't just unfold; they breathe with the landscape that surrounds them. For Joseph and Naina, their union felt less like a planned ceremony and more like a natural progre..."],
      ['home', 'story_link_2', '#'],
      ['home', 'story_img_3', 'pic/Your Love, Our Passion/pic3.webp'],
      ['home', 'story_names_3', 'NIRANJANA & NIRANJ'],
      ['home', 'story_subtitle_3', 'After you entered my life I never looked back'],
      ['home', 'story_desc_3', "December was in full swing when the families of Niranj and Niranjana came together for their d-day in the vibrant city of Kochi. The couple was made for each other, as exemplified by the similar..."],
      ['home', 'story_link_3', '#'],
      ['home', 'story_img_4', 'pic/Your Love, Our Passion/pic4.webp'],
      ['home', 'story_names_4', 'SHERLIN & LINAKAR'],
      ['home', 'story_subtitle_4', 'When you find your secret keeper for eternity'],
      ['home', 'story_desc_4', "Sherlin and Linakar exchanged their wedding vows amidst the awe-inspiring ambience at Fort Kochi Church. Through our lens, we captured their transition from two different people to one. It was a..."],
      ['home', 'story_link_4', '#'],
      ['home', 'story_img_5', ''], ['home', 'story_names_5', ''], ['home', 'story_subtitle_5', ''], ['home', 'story_desc_5', ''], ['home', 'story_link_5', '#'],
      ['home', 'story_img_6', ''], ['home', 'story_names_6', ''], ['home', 'story_subtitle_6', ''], ['home', 'story_desc_6', ''], ['home', 'story_link_6', '#'],
      ['home', 'story_img_7', ''], ['home', 'story_names_7', ''], ['home', 'story_subtitle_7', ''], ['home', 'story_desc_7', ''], ['home', 'story_link_7', '#'],
      ['home', 'story_img_8', ''], ['home', 'story_names_8', ''], ['home', 'story_subtitle_8', ''], ['home', 'story_desc_8', ''], ['home', 'story_link_8', '#'],
      ['home', 'story_img_9', ''], ['home', 'story_names_9', ''], ['home', 'story_subtitle_9', ''], ['home', 'story_desc_9', ''], ['home', 'story_link_9', '#'],
      ['home', 'story_img_10', ''], ['home', 'story_names_10', ''], ['home', 'story_subtitle_10', ''], ['home', 'story_desc_10', ''], ['home', 'story_link_10', '#']
    ];
    for (const row of defaults) {
      await panlePool.query('INSERT IGNORE INTO section_images (page_name, section_key, image_path) VALUES (?, ?, ?)', row);
    }
    // Initialize Favorite slots
    for (let i = 1; i <= 30; i++) {
      await panlePool.query('INSERT IGNORE INTO section_images (page_name, section_key, image_path) VALUES (?, ?, ?)', ['home', `favorite_${i}`, '']);
    }
    await panlePool.query("DELETE FROM section_images WHERE section_key IN ('about_middle', 'about_right')");
    try {
      await panlePool.query('ALTER TABLE section_images MODIFY COLUMN image_path LONGTEXT NOT NULL');
    } catch (migrateErr) {
      console.log('Database migration info:', migrateErr.message);
    }

    // 3. Setup Instagram feeds table
    await panlePool.query(`
      CREATE TABLE IF NOT EXISTS instagram_feeds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feed_key VARCHAR(50) NOT NULL UNIQUE,
        post_url TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Setup map pins table
    await panlePool.query(`
      CREATE TABLE IF NOT EXISTS map_pins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_path LONGTEXT,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [existingPins] = await panlePool.query('SELECT COUNT(*) as count FROM map_pins');
    if (existingPins[0].count === 0) {
      const defaultPins = [
        ['Kochi Backwaters', 'A beautiful waterfront wedding', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg', 9.9312, 76.2673],
        ['Munnar Tea Gardens', 'Misty hills and intimate vows', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg', 10.0892, 77.0595],
        ['Ooty Hill Station', 'Classic vintage wedding style', 'https://weddingbellsstories.com/media_library/weddingbells-image-6tfhrz.jpg', 11.4102, 76.6950],
        ['Mahabalipuram Beach', 'Sunset shores in Tamil Nadu', 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg', 12.6208, 80.1945],
        ['Chennai Royal Palace', 'Grandeur and elegance', 'https://weddingbellsstories.com/media_library/weddingbells-image-i0m2s5.jpg', 13.0827, 80.2707]
      ];
      for (const pin of defaultPins) {
        await panlePool.query('INSERT INTO map_pins (title, description, image_path, lat, lng) VALUES (?, ?, ?, ?, ?)', pin);
      }
    }

    try {
      const fallbackUrl = 'https://weddingbellsstories.com/media_library/weddingbells-image-qksaeq.jpg';
      await panlePool.query('UPDATE map_pins SET image_path = ? WHERE image_path LIKE "pannl/uploads/%"', [fallbackUrl]);
      await panlePool.query('UPDATE map_pins SET image_path = ? WHERE LOWER(title) LIKE "%kochi%"', [fallbackUrl]);
    } catch (e) {
      console.error('Migration error:', e);
    }
    
    try {
      await panlePool.query('ALTER TABLE instagram_feeds MODIFY COLUMN post_url TEXT NOT NULL');
    } catch (e) {}

    const defaultFeeds = [
      ['feed_1', 'https://www.instagram.com/p/C69mP3-v4Oa/'],
      ['feed_2', 'https://www.instagram.com/p/C67R0C0vhDk/'],
      ['feed_3', 'https://www.instagram.com/p/C64s4WpvpC3/'],
      ['feed_4', 'https://www.instagram.com/p/C62IexBvIq4/'],
      ['feed_5', 'https://www.instagram.com/p/C6zc9F6PCW5/'],
      ['feed_6', 'https://www.instagram.com/p/C6w4kPvvbT5/'],
      ['yt_1', 'https://www.youtube.com/watch?v=F384n1wXQoY'],
      ['yt_2', 'https://www.youtube.com/watch?v=F384n1wXQoY'],
      ['yt_3', 'https://www.youtube.com/watch?v=F384n1wXQoY'],
      ['yt_4', 'https://www.youtube.com/watch?v=F384n1wXQoY'],
      ['yt_5', 'https://www.youtube.com/watch?v=F384n1wXQoY'],
      ['yt_6', 'https://www.youtube.com/watch?v=F384n1wXQoY']
    ];
    for (const row of defaultFeeds) {
      await panlePool.query('INSERT IGNORE INTO instagram_feeds (feed_key, post_url) VALUES (?, ?)', row);
    }

    console.log('Databases initialized and updated.');
  } catch (err) {
    console.error('Error during database initialization/migrations:', err);
  }
}

// ----------------------------------------------------
// BASE64 ASSETS MIGRATION TO BINARY & CACHE
// ----------------------------------------------------
async function migrateBase64Assets() {
  try {
    // Ensure assets table exists before migrating
    await panlePool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(64) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        data LONGBLOB NOT NULL,
        size_bytes INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Helper to process and save Base64 strings
    async function saveBinaryAsset(base64Str) {
      const parts = base64Str.split(';base64,');
      if (parts.length < 2) return null;
      
      const header = parts[0];
      const mimeType = header.replace('data:', '');
      const dataBuffer = Buffer.from(parts[1], 'base64');
      
      let ext = 'jpg';
      if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('png')) ext = 'png';
      
      const hash = crypto.createHash('sha256').update(dataBuffer).digest('hex');
      const filename = `${hash}.${ext}`;
      
      // Save to assets database table
      await panlePool.query(
        `INSERT IGNORE INTO assets (id, filename, mime_type, data, size_bytes) VALUES (?, ?, ?, ?, ?)`,
        [hash, filename, mimeType, dataBuffer, dataBuffer.length]
      );
      
      // Cache locally on disk
      const cacheDir = path.join(__dirname, 'uploads/cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(path.join(cacheDir, filename), dataBuffer);
      
      return `/api/assets/file/${filename}`;
    }

    // 1. Migrate section_images Base64
    const [secImages] = await panlePool.query('SELECT id, section_key, image_path FROM section_images WHERE image_path LIKE "data:image/%"');
    for (const row of secImages) {
      console.log(`[Migration] Migrating Base64 for section key: ${row.section_key}...`);
      const assetUrl = await saveBinaryAsset(row.image_path);
      if (assetUrl) {
        await panlePool.query('UPDATE section_images SET image_path = ? WHERE id = ?', [assetUrl, row.id]);
      }
    }

    // 2. Migrate map_pins Base64
    const [pins] = await panlePool.query('SELECT id, title, image_path FROM map_pins WHERE image_path LIKE "data:image/%"');
    for (const row of pins) {
      console.log(`[Migration] Migrating Base64 for map pin title: ${row.title}...`);
      const assetUrl = await saveBinaryAsset(row.image_path);
      if (assetUrl) {
        await panlePool.query('UPDATE map_pins SET image_path = ? WHERE id = ?', [assetUrl, row.id]);
      }
    }

    console.log('[Migration] Base64 assets migration completed.');
  } catch (err) {
    console.error('[Migration] Error during Base64 assets migration:', err);
  }
}

// ----------------------------------------------------
// GATEWAY PROXY ROUTING
// ----------------------------------------------------

// Route to Asset Microservice (AIP)
app.use('/api/assets', proxy(`http://localhost:${ASSETS_PORT}`));

// Route to Portal Microservice
app.use('/Admin', proxy(`http://localhost:${PORTAL_PORT}`));

// Route to Pannl CMS Microservice
app.use('/pannl', proxy(`http://localhost:${PANNL_PORT}`));

// Route all other requests to Frontend Microservice
app.use('/', proxy(`http://localhost:${FRONTEND_PORT}`));

// Gateway Server Start
app.listen(PORT, async () => {
  console.log(`Gateway / Proxy Server is running on http://localhost:${PORT}`);
  
  // 1. Initialize schemas
  await initDatabases();
  
  // 2. Run Base64 data migration to binary store
  await migrateBase64Assets();
  
  // 3. Spin up all independent sub-services
  startMicroservices();
});
