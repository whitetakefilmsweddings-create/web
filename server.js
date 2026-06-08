const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const crypto = require('crypto');
require('dotenv').config();

const { tdsPool, panlePool } = require('./config/db');
const GoogleDrive = require('./config/google_drive');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser & Session
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'whitetake_films_express_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Setup Multer temp folder
const uploadDir = path.join(__dirname, 'uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: 'uploads/temp/' });

// Serves Static Files/Directories
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/pic', express.static(path.join(__dirname, 'pic')));
app.use('/Admin/assets', express.static(path.join(__dirname, 'Admin/assets')));
app.use('/Admin/template', express.static(path.join(__dirname, 'Admin/template')));
app.use('/face', express.static(path.join(__dirname, 'Admin/face')));
app.use('/pannl/uploads', express.static(path.join(__dirname, 'pannl/uploads')));

// Serve Root Static Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/:page.html', (req, res, next) => {
  const filePath = path.join(__dirname, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next();
  }
});

// Authentication Middleware Helpers
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/Admin/client/login.php');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.redirect('/Admin/admin/login.php');
  }
  next();
}

function requireClient(req, res, next) {
  if (!req.session.userId || req.session.role !== 'client') {
    return res.redirect('/Admin/client/login.php');
  }
  next();
}

function checkPannlAuth(req, res, next) {
  if (!req.session.adminLoggedIn) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.redirect('/pannl/login.php');
  }
  next();
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
      // Story Card 1
      ['home', 'story_img_1', 'pic/Your Love, Our Passion/pic1.webp'],
      ['home', 'story_names_1', 'ANEENA & GARY'],
      ['home', 'story_subtitle_1', 'Blooms and Belonging: A Timeless Romance'],
      ['home', 'story_desc_1', "Some love stories don't need grand declarations to be understood: they are felt in the very air surrounding a couple. With Aneena and Gary, the connection they share radiates a simple kind..."],
      ['home', 'story_link_1', '#'],
      // Story Card 2
      ['home', 'story_img_2', 'pic/Your Love, Our Passion/pic2.webp'],
      ['home', 'story_names_2', 'JOSEPH & NAINA'],
      ['home', 'story_subtitle_2', 'A Tapestry of Emerald and Earth'],
      ['home', 'story_desc_2', "Some love stories don't just unfold; they breathe with the landscape that surrounds them. For Joseph and Naina, their union felt less like a planned ceremony and more like a natural progre..."],
      ['home', 'story_link_2', '#'],
      // Story Card 3
      ['home', 'story_img_3', 'pic/Your Love, Our Passion/pic3.webp'],
      ['home', 'story_names_3', 'NIRANJANA & NIRANJ'],
      ['home', 'story_subtitle_3', 'After you entered my life I never looked back'],
      ['home', 'story_desc_3', "December was in full swing when the families of Niranj and Niranjana came together for their d-day in the vibrant city of Kochi. The couple was made for each other, as exemplified by the similar..."],
      ['home', 'story_link_3', '#'],
      // Story Card 4
      ['home', 'story_img_4', 'pic/Your Love, Our Passion/pic4.webp'],
      ['home', 'story_names_4', 'SHERLIN & LINAKAR'],
      ['home', 'story_subtitle_4', 'When you find your secret keeper for eternity'],
      ['home', 'story_desc_4', "Sherlin and Linakar exchanged their wedding vows amidst the awe-inspiring ambience at Fort Kochi Church. Through our lens, we captured their transition from two different people to one. It was a..."],
      ['home', 'story_link_4', '#'],
      // Story Card 5
      ['home', 'story_img_5', ''],
      ['home', 'story_names_5', ''],
      ['home', 'story_subtitle_5', ''],
      ['home', 'story_desc_5', ''],
      ['home', 'story_link_5', '#'],
      // Story Card 6
      ['home', 'story_img_6', ''],
      ['home', 'story_names_6', ''],
      ['home', 'story_subtitle_6', ''],
      ['home', 'story_desc_6', ''],
      ['home', 'story_link_6', '#'],
      // Story Card 7
      ['home', 'story_img_7', ''],
      ['home', 'story_names_7', ''],
      ['home', 'story_subtitle_7', ''],
      ['home', 'story_desc_7', ''],
      ['home', 'story_link_7', '#'],
      // Story Card 8
      ['home', 'story_img_8', ''],
      ['home', 'story_names_8', ''],
      ['home', 'story_subtitle_8', ''],
      ['home', 'story_desc_8', ''],
      ['home', 'story_link_8', '#'],
      // Story Card 9
      ['home', 'story_img_9', ''],
      ['home', 'story_names_9', ''],
      ['home', 'story_subtitle_9', ''],
      ['home', 'story_desc_9', ''],
      ['home', 'story_link_9', '#'],
      // Story Card 10
      ['home', 'story_img_10', ''],
      ['home', 'story_names_10', ''],
      ['home', 'story_subtitle_10', ''],
      ['home', 'story_desc_10', ''],
      ['home', 'story_link_10', '#']
    ];
    for (const row of defaults) {
      await panlePool.query('INSERT IGNORE INTO section_images (page_name, section_key, image_path) VALUES (?, ?, ?)', row);
    }
    // Initialize 30 placeholder records for Our Favorite Moments gallery
    for (let i = 1; i <= 30; i++) {
      await panlePool.query('INSERT IGNORE INTO section_images (page_name, section_key, image_path) VALUES (?, ?, ?)', ['home', `favorite_${i}`, '']);
    }
    // Clean up deprecated home page sections no longer in use
    await panlePool.query("DELETE FROM section_images WHERE section_key IN ('about_middle', 'about_right')");
    // Run schema migration to change image_path column to LONGTEXT if it's currently VARCHAR(255)
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

    
    // Ensure existing table structure is migrated to TEXT
    try {
      await panlePool.query('ALTER TABLE instagram_feeds MODIFY COLUMN post_url TEXT NOT NULL');
    } catch (e) {
      // Ignore error if it's already updated or fails due to other reasons
    }
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
// LEGACY ROUTE MAPPINGS
// ----------------------------------------------------

// Admin Redirects
app.get('/Admin', (req, res) => res.redirect('/Admin/admin/dashboard.php'));
app.get('/Admin/index.php', (req, res) => res.redirect('/Admin/admin/dashboard.php'));

// ADMIN ACTIONS
app.get('/Admin/admin/login.php', (req, res) => {
  if (req.session.userId && req.session.role === 'admin') {
    return res.redirect('/Admin/admin/dashboard.php');
  }
  res.render('admin/login', { error: '' });
});

app.post('/Admin/admin/login.php', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await tdsPool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = rows[0];

    if (admin && password === admin.password) {
      req.session.userId = admin.id;
      req.session.role = 'admin';
      return res.redirect('/Admin/admin/dashboard.php');
    } else {
      res.render('admin/login', { error: 'Invalid credentials' });
    }
  } catch (err) {
    res.render('admin/login', { error: err.message });
  }
});

app.get('/Admin/admin/logout.php', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/Admin/admin/login.php');
  });
});

app.get('/Admin/admin/dashboard.php', requireAdmin, async (req, res) => {
  try {
    const [[{ clientCount }]] = await tdsPool.query('SELECT COUNT(*) as clientCount FROM clients');
    const [[{ invoiceCount }]] = await tdsPool.query('SELECT COUNT(*) as invoiceCount FROM invoices');
    const [[{ pendingRevenue }]] = await tdsPool.query("SELECT SUM(amount) as pendingRevenue FROM invoices WHERE status = 'unpaid'");
    
    res.render('admin/dashboard', {
      clientCount,
      invoiceCount,
      pendingRevenue: pendingRevenue || 0
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/clients.php', requireAdmin, async (req, res) => {
  const search = req.query.search || '';
  const date = req.query.date || '';
  let sql = 'SELECT * FROM clients WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR username LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (date) {
    sql += ' AND DATE(created_at) = ?';
    params.push(date);
  }
  sql += ' ORDER BY created_at DESC';

  try {
    const [clients] = await tdsPool.execute(sql, params);
    res.render('admin/clients', { clients, search, date });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/create_client.php', requireAdmin, (req, res) => {
  const randPassword = crypto.randomBytes(4).toString('hex');
  res.render('admin/create_client', { msg: '', password: randPassword });
});

app.post('/Admin/admin/create_client.php', requireAdmin, async (req, res) => {
  const { name, email, username, password, folder_id } = req.body;
  if (name && email && username && password) {
    try {
      await tdsPool.execute(
        'INSERT INTO clients (name, email, username, password, folder_id) VALUES (?, ?, ?, ?, ?)',
        [name, email, username, password, folder_id || null]
      );
      res.redirect('/Admin/admin/clients.php');
    } catch (err) {
      res.render('admin/create_client', { msg: err.message, password });
    }
  } else {
    res.render('admin/create_client', { msg: 'Please fill all required fields', password });
  }
});

app.get('/Admin/admin/view_client.php', requireAdmin, async (req, res) => {
  const id = req.query.id || 0;
  try {
    const [clients] = await tdsPool.execute('SELECT * FROM clients WHERE id = ?', [id]);
    const client = clients[0];
    if (!client) return res.status(404).send('Client not found');

    const [invoices] = await tdsPool.execute('SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC', [id]);
    const [appointments] = await tdsPool.execute('SELECT * FROM appointments WHERE client_id = ? ORDER BY appointment_date ASC', [id]);

    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host');
    const galleryUrl = `${protocol}://${host}/Admin/client/login.php?code=${client.gallery_code || ''}`;
    const shareText = `Hello ${client.name},\n\nHere is the direct link to your photo gallery:\n${galleryUrl}\n\n(Access Code: ${client.gallery_code || 'PENDING'})`;

    let faceAppUrl = `${protocol}://${host}/face/index.html`;
    if (client.ai_folder_id) {
      faceAppUrl += `?folder_id=${client.ai_folder_id}`;
    }
    const shareTextFace = `Find your photos from the event using Face AI:\n${faceAppUrl}`;

    res.render('admin/view_client', {
      client,
      msg: req.session.flashMsg || '',
      invoices,
      appointments,
      totalInv: invoices.length,
      totalApp: appointments.length,
      faceAppUrl,
      shareText,
      shareTextFace
    });
    req.session.flashMsg = null;
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/admin/view_client.php', requireAdmin, async (req, res) => {
  const id = req.query.id || 0;
  try {
    if (req.body.update_profile) {
      const { name, email, username, password } = req.body;
      await tdsPool.execute(
        'UPDATE clients SET name = ?, email = ?, username = ?, password = ? WHERE id = ?',
        [name, email, username, password, id]
      );
      req.session.flashMsg = 'Profile updated!';
    } else if (req.body.update_gallery) {
      const { folder_id, gallery_code } = req.body;
      await tdsPool.execute(
        'UPDATE clients SET folder_id = ?, gallery_code = ? WHERE id = ?',
        [folder_id, gallery_code, id]
      );
      req.session.flashMsg = 'Gallery settings updated!';
    } else if (req.body.update_face_ai) {
      const { ai_folder_id } = req.body;
      await tdsPool.execute(
        'UPDATE clients SET ai_folder_id = ? WHERE id = ?',
        [ai_folder_id, id]
      );
      req.session.flashMsg = 'Face AI settings updated!';
    } else if (req.body.add_appointment) {
      const { app_date, app_time } = req.body;
      const fullDate = `${app_date} ${app_time}`;
      await tdsPool.execute('INSERT INTO appointments (client_id, appointment_date) VALUES (?, ?)', [id, fullDate]);
      req.session.flashMsg = 'Appointment added!';
    } else if (req.body.delete_invoice) {
      const { invoice_id } = req.body;
      await tdsPool.execute('DELETE FROM invoices WHERE id = ?', [invoice_id]);
      req.session.flashMsg = 'Invoice deleted!';
    }
    res.redirect(`/Admin/admin/view_client.php?id=${id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/admin/delete_client.php', requireAdmin, async (req, res) => {
  const id = req.body.client_id || 0;
  if (!id) return res.status(400).send('Invalid Client ID');
  try {
    await tdsPool.execute('DELETE FROM appointments WHERE client_id = ?', [id]);
    await tdsPool.execute('DELETE FROM clients WHERE id = ?', [id]);
    res.redirect('/Admin/admin/clients.php?msg=client_deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/client_selection.php', requireAdmin, async (req, res) => {
  const clientId = req.query.id;
  if (!clientId) return res.status(400).send('Client ID required');

  try {
    const [clients] = await tdsPool.execute('SELECT * FROM clients WHERE id = ?', [clientId]);
    const client = clients[0];
    if (!client) return res.status(404).send('Client not found');

    const folderId = client.folder_id;

    // Fetch Selections
    const [selRows] = await tdsPool.execute('SELECT file_id FROM client_selections WHERE client_id = ?', [clientId]);
    const selections = selRows.map(r => r.file_id);

    const drive = new GoogleDrive();
    let files = [];
    let selectedFiles = [];
    let error = '';

    if (folderId) {
      try {
        const dFiles = await drive.getFiles(folderId);
        for (const file of dFiles) {
          const mime = file.getMimeType();
          if (mime === 'application/vnd.google-apps.folder' || mime.includes('zip')) {
            continue;
          }
          const isSelected = selections.includes(file.getId());
          const cleanFile = {
            id: file.getId(),
            name: file.getName(),
            src: (file.getThumbnailLink() || '').replace('=s220', '=s600'),
            is_selected: isSelected
          };
          files.push(cleanFile);
          if (isSelected) {
            selectedFiles.push(cleanFile);
          }
        }
      } catch (driveErr) {
        error = `Drive Error: ${driveErr.message}`;
      }
    }

    const unselectedFiles = files.filter(f => !f.is_selected);

    res.render('admin/client_selection', {
      client,
      files,
      selectedFiles,
      unselectedFiles,
      clientId,
      error,
      successMsg: req.session.flashSuccess || ''
    });
    req.session.flashSuccess = null;
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/admin/client_selection.php', requireAdmin, async (req, res) => {
  const clientId = req.query.id;
  if (!clientId) return res.status(400).send('Client ID required');

  try {
    const [clients] = await tdsPool.execute('SELECT folder_id FROM clients WHERE id = ?', [clientId]);
    const client = clients[0];
    if (!client) return res.status(404).send('Client not found');
    const folderId = client.folder_id;

    const [selRows] = await tdsPool.execute('SELECT file_id FROM client_selections WHERE client_id = ?', [clientId]);
    const selections = selRows.map(r => r.file_id);

    const drive = new GoogleDrive();
    const dFiles = await drive.getFiles(folderId);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const file of dFiles) {
      const mime = file.getMimeType();
      if (mime === 'application/vnd.google-apps.folder' || mime.includes('zip')) {
        continue;
      }
      if (!selections.includes(file.getId())) {
        try {
          await drive.deleteFile(file.getId());
          deletedCount++;
        } catch (delErr) {
          failedCount++;
        }
      }
    }

    req.session.flashSuccess = `Deleted ${deletedCount} files. ${failedCount > 0 ? `Failed to delete ${failedCount} files.` : ''}`;
    res.redirect(`/Admin/admin/client_selection.php?id=${clientId}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/cleanup_drive.php', requireAdmin, async (req, res) => {
  const clientId = req.query.client_id;
  const type = req.query.type || 'gallery';
  if (!clientId) return res.status(400).send('Client ID required');

  try {
    const [clients] = await tdsPool.execute('SELECT * FROM clients WHERE id = ?', [clientId]);
    const client = clients[0];
    if (!client) return res.status(404).send('Client not found');

    const folderId = (type === 'face_ai') ? (client.ai_folder_id || '') : (client.folder_id || '');
    const folderName = (type === 'face_ai') ? 'Face AI Folder' : 'Gallery Folder';

    if (!folderId) return res.status(400).send(`No ${folderName} configured.`);

    const drive = new GoogleDrive();
    let files = [];
    let error = '';

    try {
      const dFiles = await drive.getFiles(folderId);
      for (const file of dFiles) {
        const mime = file.getMimeType();
        if (mime === 'application/vnd.google-apps.folder') continue;

        files.push({
          id: file.getId(),
          name: file.getName(),
          src: (file.getThumbnailLink() || '').replace('=s220', '=s600'),
          mime
        });
      }
    } catch (driveErr) {
      error = `Drive Error: ${driveErr.message}`;
    }

    res.render('admin/cleanup_drive', {
      client,
      folderName,
      files,
      msg: req.session.flashCleanMsg || '',
      error: error || req.session.flashCleanErr || ''
    });
    req.session.flashCleanMsg = null;
    req.session.flashCleanErr = null;
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/admin/cleanup_drive.php', requireAdmin, async (req, res) => {
  const clientId = req.query.client_id;
  const filesToDelete = req.body.files || [];

  if (!clientId) return res.status(400).send('Client ID required');

  try {
    const drive = new GoogleDrive();
    let deletedCount = 0;
    let failedCount = 0;
    let lastError = '';

    for (const fileId of filesToDelete) {
      try {
        await drive.deleteFile(fileId);
        deletedCount++;
      } catch (err) {
        failedCount++;
        lastError = err.message;
      }
    }

    req.session.flashCleanMsg = `Successfully deleted ${deletedCount} images.`;
    if (failedCount > 0) {
      req.session.flashCleanErr = `Failed to delete ${failedCount} images. Last Error: ${lastError}`;
    }
    res.redirect(`/Admin/admin/cleanup_drive.php?client_id=${clientId}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/download_file.php', requireAdmin, async (req, res) => {
  const fileId = req.query.file_id;
  if (!fileId) return res.status(400).send('File ID required');

  try {
    const drive = new GoogleDrive();
    const meta = await drive.getFileMetadata(fileId);
    if (!meta) return res.status(404).send('File not found');

    res.setHeader('Content-Description', 'File Transfer');
    res.setHeader('Content-Type', meta.getMimeType());
    res.setHeader('Content-Disposition', `attachment; filename="${meta.getName()}"`);

    const stream = await drive.downloadFileStream(fileId);
    stream.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/download_zip.php', requireAdmin, async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).send('Client ID required');

  try {
    const [clients] = await tdsPool.execute('SELECT name FROM clients WHERE id = ?', [clientId]);
    const clientName = clients[0]?.name;
    if (!clientName) return res.status(404).send('Client not found');

    const [selRows] = await tdsPool.execute('SELECT file_id FROM client_selections WHERE client_id = ?', [clientId]);
    const selections = selRows.map(r => r.file_id);

    const totalFiles = selections.length;
    let start = parseInt(req.query.start || 1);
    let end = parseInt(req.query.end || totalFiles);

    if (start < 1) start = 1;
    if (end > totalFiles) end = totalFiles;

    const batchSelections = selections.slice(start - 1, end);
    const rangeStr = (start === 1 && end === totalFiles) ? '' : `_Target_${start}-${end}`;
    const zipName = `WhiteTake_Selections_${clientName.replace(/[^a-zA-Z0-9_\-]/g, '_')}${rangeStr}.zip`;

    res.attachment(zipName);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const drive = new GoogleDrive();
    for (const fileId of batchSelections) {
      try {
        const meta = await drive.getFileMetadata(fileId);
        if (meta) {
          const stream = await drive.downloadFileStream(fileId);
          archive.append(stream, { name: meta.getName() });
        }
      } catch (err) {
        console.error(`Error zipping file ${fileId}:`, err.message);
      }
    }
    await archive.finalize();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/admin/create_invoice.php', requireAdmin, async (req, res) => {
  const selected_client_id = req.query.client_id || '';
  try {
    const [clients] = await tdsPool.query('SELECT * FROM clients ORDER BY name ASC');
    res.render('admin/create_invoice', {
      clients,
      selected_client_id,
      msg: ''
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/admin/create_invoice.php', requireAdmin, async (req, res) => {
  const { client_id, title, status, items } = req.body;
  const parsedItems = items ? Object.values(items) : [];

  let totalAmount = 0;
  parsedItems.forEach(item => {
    totalAmount += parseFloat(item.price || 0) * parseInt(item.qty || 1);
  });

  if (client_id && title && parsedItems.length > 0) {
    const conn = await tdsPool.getConnection();
    try {
      await conn.beginTransaction();

      const [invRes] = await conn.execute(
        'INSERT INTO invoices (client_id, title, amount, status) VALUES (?, ?, ?, ?)',
        [client_id, title, totalAmount, status]
      );
      const invoiceId = invRes.insertId;

      for (const item of parsedItems) {
        const price = parseFloat(item.price || 0);
        const qty = parseInt(item.qty || 1);
        const itemTotal = price * qty;
        await conn.execute(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)',
          [invoiceId, item.desc, qty, price, itemTotal]
        );
      }

      await conn.commit();
      res.redirect('/Admin/admin/invoices.php');
    } catch (err) {
      await conn.rollback();
      const [clients] = await tdsPool.query('SELECT * FROM clients ORDER BY name ASC');
      res.render('admin/create_invoice', { clients, selected_client_id: client_id, msg: err.message });
    } finally {
      conn.release();
    }
  } else {
    const [clients] = await tdsPool.query('SELECT * FROM clients ORDER BY name ASC');
    res.render('admin/create_invoice', { clients, selected_client_id: client_id, msg: 'Please add at least one item.' });
  }
});

app.get('/Admin/admin/edit_invoice.php', requireAdmin, async (req, res) => {
  const id = req.query.id;
  try {
    const [invoices] = await tdsPool.execute('SELECT * FROM invoices WHERE id = ?', [id]);
    const invoice = invoices[0];
    if (!invoice) return res.status(404).send('Invoice not found');

    const [clients] = await tdsPool.query('SELECT * FROM clients ORDER BY name ASC');
    const [items] = await tdsPool.execute('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);

    res.render('admin/edit_invoice', {
      invoice,
      clients,
      items,
      msg: ''
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/admin/edit_invoice.php', requireAdmin, async (req, res) => {
  const id = req.query.id;
  const { client_id, title, status, items } = req.body;
  const parsedItems = items ? Object.values(items) : [];

  let totalAmount = 0;
  parsedItems.forEach(item => {
    totalAmount += parseFloat(item.price || 0) * parseInt(item.qty || 1);
  });

  const conn = await tdsPool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      'UPDATE invoices SET client_id = ?, title = ?, amount = ?, status = ? WHERE id = ?',
      [client_id, title, totalAmount, status, id]
    );

    // Delete existing items and re-insert
    await conn.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

    for (const item of parsedItems) {
      const price = parseFloat(item.price || 0);
      const qty = parseInt(item.qty || 1);
      const itemTotal = price * qty;
      await conn.execute(
        'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)',
        [id, item.desc, qty, price, itemTotal]
      );
    }

    await conn.commit();
    res.redirect('/Admin/admin/invoices.php');
  } catch (err) {
    await conn.rollback();
    const [invoices] = await tdsPool.execute('SELECT * FROM invoices WHERE id = ?', [id]);
    const [clients] = await tdsPool.query('SELECT * FROM clients ORDER BY name ASC');
    res.render('admin/edit_invoice', { invoice: invoices[0], clients, items: parsedItems, msg: err.message });
  } finally {
    conn.release();
  }
});

app.get('/Admin/admin/invoices.php', requireAdmin, async (req, res) => {
  try {
    const [invoices] = await tdsPool.query(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `);
    res.render('admin/invoices', { invoices });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// CLIENT ACTIONS
app.get('/Admin/client/login.php', (req, res) => {
  // Magic link login
  const code = req.query.code;
  if (code) {
    tdsPool.execute('SELECT * FROM clients WHERE gallery_code = ?', [code])
      .then(([rows]) => {
        const client = rows[0];
        if (client) {
          req.session.userId = client.id;
          req.session.role = 'client';
          req.session[`gallery_access_${client.id}`] = true;
          return res.redirect('/Admin/client/gallery.php');
        }
        res.render('client/login', { error: 'Invalid Access Code' });
      })
      .catch(err => {
        res.render('client/login', { error: err.message });
      });
  } else {
    if (req.session.userId && req.session.role === 'client') {
      return res.redirect('/Admin/client/dashboard.php');
    }
    res.render('client/login', { error: '' });
  }
});

app.post('/Admin/client/login.php', async (req, res) => {
  const { access_code, username, password } = req.body;
  try {
    if (access_code) {
      const [rows] = await tdsPool.execute('SELECT * FROM clients WHERE gallery_code = ?', [access_code]);
      const client = rows[0];
      if (client) {
        req.session.userId = client.id;
        req.session.role = 'client';
        req.session[`gallery_access_${client.id}`] = true;
        return res.redirect('/Admin/client/gallery.php');
      } else {
        res.render('client/login', { error: 'Invalid Access Code' });
      }
    } else if (username) {
      const [rows] = await tdsPool.execute('SELECT * FROM clients WHERE username = ?', [username]);
      const client = rows[0];
      if (client && password === client.password) {
        req.session.userId = client.id;
        req.session.role = 'client';
        return res.redirect('/Admin/client/dashboard.php');
      } else {
        res.render('client/login', { error: 'Invalid credentials' });
      }
    }
  } catch (err) {
    res.render('client/login', { error: err.message });
  }
});

app.get('/Admin/client/logout.php', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/Admin/client/login.php');
  });
});

app.get('/Admin/client/dashboard.php', requireClient, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [clients] = await tdsPool.execute('SELECT * FROM clients WHERE id = ?', [userId]);
    const client = clients[0];

    const [[{ unpaidCount }]] = await tdsPool.execute(
      "SELECT COUNT(*) as unpaidCount FROM invoices WHERE client_id = ? AND status = 'unpaid'",
      [userId]
    );

    res.render('client/dashboard', { client, unpaidCount });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/client/gallery.php', requireClient, async (req, res) => {
  const userId = req.session.userId;
  let folderId = req.query.folder || null;

  try {
    const [clients] = await tdsPool.execute('SELECT folder_id, gallery_code, name FROM clients WHERE id = ?', [userId]);
    const client = clients[0];

    // Check gallery lock code
    if (client.gallery_code) {
      if (!req.session[`gallery_access_${userId}`]) {
        return res.render('client/gallery_lock', { error: '', userId });
      }
    }

    // Selections
    const [selRows] = await tdsPool.execute('SELECT file_id FROM client_selections WHERE client_id = ?', [userId]);
    const selections = selRows.map(r => r.file_id);

    if (!folderId) {
      folderId = client.folder_id;
    }

    let files = [];
    let zipFileId = null;
    let error = '';

    if (folderId) {
      try {
        const drive = new GoogleDrive();
        const dFiles = await drive.getFiles(folderId);

        for (const file of dFiles) {
          const mime = file.getMimeType();
          if (mime === 'application/zip' || mime === 'application/x-zip-compressed') {
            zipFileId = file.getId();
            continue;
          }

          const isFolder = mime === 'application/vnd.google-apps.folder';
          let cover = null;
          if (isFolder) {
            cover = await drive.getFolderCover(file.getId());
          }

          files.push({
            id: file.getId(),
            name: file.getName(),
            type: isFolder ? 'folder' : 'image',
            src: isFolder ? '' : (file.getThumbnailLink() || '').replace('=s220', '=s600'),
            cover,
            link: isFolder ? `?folder=${file.getId()}` : '#'
          });
        }
      } catch (driveErr) {
        error = `Drive error: ${driveErr.message}`;
      }
    } else {
      error = 'No gallery linked.';
    }

    res.render('client/gallery', {
      folderId,
      rootFolderId: client.folder_id,
      error,
      files,
      selections,
      zipFileId,
      client
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/client/gallery.php', requireClient, async (req, res) => {
  const userId = req.session.userId;
  const { access_code } = req.body;
  try {
    const [clients] = await tdsPool.execute('SELECT gallery_code FROM clients WHERE id = ?', [userId]);
    if (clients[0] && access_code === clients[0].gallery_code) {
      req.session[`gallery_access_${userId}`] = true;
      res.redirect('/Admin/client/gallery.php');
    } else {
      res.render('client/gallery_lock', { error: 'Incorrect Access Code', userId });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/client/selections.php', requireClient, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [selRows] = await tdsPool.execute('SELECT file_id FROM client_selections WHERE client_id = ?', [userId]);
    const selections = selRows.map(r => r.file_id);

    let files = [];
    let error = '';

    if (selections.length > 0) {
      try {
        const drive = new GoogleDrive();
        for (const fileId of selections) {
          const file = await drive.getFileMetadata(fileId);
          if (file) {
            const mime = file.getMimeType();
            if (mime === 'application/vnd.google-apps.folder' || mime.includes('zip')) {
              continue;
            }
            files.push({
              id: file.getId(),
              name: file.getName(),
              src: (file.getThumbnailLink() || '').replace('=s220', '=s600')
            });
          }
        }
      } catch (driveErr) {
        error = `Drive error: ${driveErr.message}`;
      }
    }

    res.render('client/selections', { files, error });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/client/invoices.php', requireClient, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [invoices] = await tdsPool.execute('SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC', [userId]);
    res.render('client/invoices', { invoices });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/client/invoice_view.php', async (req, res) => {
  const id = req.query.id || 0;
  if (!id) return res.status(400).send('Invalid Invoice ID');

  try {
    const [invoices] = await tdsPool.execute('SELECT * FROM invoices WHERE id = ?', [id]);
    const invoice = invoices[0];
    if (!invoice) return res.status(404).send('Invoice not found');

    const [clients] = await tdsPool.execute('SELECT * FROM clients WHERE id = ?', [invoice.client_id]);
    const client = clients[0];

    const isAdmin = req.session.userId && req.session.role === 'admin';
    const isClient = req.session.userId && req.session.role === 'client';

    if (!isAdmin && !isClient) {
      return res.redirect('/Admin/client/login.php');
    }

    if (isClient && req.session.userId != invoice.client_id) {
      return res.status(403).send('Unauthorized access to this invoice.');
    }

    const [items] = await tdsPool.execute('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
    const cleanItems = items.length > 0 ? items : [{
      description: invoice.title,
      unit_price: invoice.amount,
      quantity: 1,
      total: invoice.amount
    }];

    const date = new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
    const invoiceNo = `INV-${String(invoice.id).padStart(5, '0')}`;

    res.render('client/invoice_view', {
      invoiceNo,
      date,
      invoice,
      client,
      items: cleanItems,
      total: invoice.amount
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/client/download.php', requireClient, async (req, res) => {
  const fileId = req.query.id;
  if (!fileId) return res.status(400).send('File ID required');

  try {
    const drive = new GoogleDrive();
    const meta = await drive.getFileMetadata(fileId);
    if (!meta) return res.status(404).send('File not found');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.getName()}"`);

    const stream = await drive.downloadFileStream(fileId);
    stream.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/Admin/client/download_zip.php', requireClient, async (req, res) => {
  const folderId = req.query.folder_id;
  const folderName = req.query.folder_name || 'gallery';
  if (!folderId) return res.status(400).send('Folder ID required');

  try {
    const zipName = `WhiteTake_${folderName.replace(/[^a-zA-Z0-9_\-]/g, '_')}.zip`;
    res.attachment(zipName);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const drive = new GoogleDrive();
    const dFiles = await drive.getFiles(folderId);
    
    for (const file of dFiles) {
      if (file.getMimeType() !== 'application/vnd.google-apps.folder') {
        const stream = await drive.downloadFileStream(file.getId());
        archive.append(stream, { name: file.getName() });
      }
    }
    await archive.finalize();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/Admin/client/ajax_selection.php', requireClient, async (req, res) => {
  const clientId = req.session.userId;
  const { file_id, action } = req.body;

  if (!file_id || !action) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    if (action === 'select') {
      const [existing] = await tdsPool.execute('SELECT id FROM client_selections WHERE client_id = ? AND file_id = ?', [clientId, file_id]);
      if (existing.length === 0) {
        await tdsPool.execute('INSERT INTO client_selections (client_id, file_id) VALUES (?, ?)', [clientId, file_id]);
      }
    } else if (action === 'deselect') {
      await tdsPool.execute('DELETE FROM client_selections WHERE client_id = ? AND file_id = ?', [clientId, file_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/Admin/client/ajax_rejection.php', requireClient, async (req, res) => {
  const clientId = req.session.userId;
  const { file_id, action } = req.body;

  if (!file_id || !action) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    if (action === 'reject') {
      const [existing] = await tdsPool.execute('SELECT id FROM client_rejections WHERE client_id = ? AND file_id = ?', [clientId, file_id]);
      if (existing.length === 0) {
        await tdsPool.execute('INSERT INTO client_rejections (client_id, file_id) VALUES (?, ?)', [clientId, file_id]);
      }
    } else if (action === 'restore') {
      await tdsPool.execute('DELETE FROM client_rejections WHERE client_id = ? AND file_id = ?', [clientId, file_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/Admin/client/get_files_json.php', requireClient, async (req, res) => {
  const folderId = req.query.folder_id;
  if (!folderId) return res.json({ error: 'No folder ID' });

  try {
    const drive = new GoogleDrive();
    const files = await drive.getFiles(folderId);
    
    const cleanFiles = [];
    for (const f of files) {
      if (f.getMimeType() !== 'application/vnd.google-apps.folder') {
        cleanFiles.push({
          id: f.getId(),
          name: f.getName(),
          mime: f.getMimeType()
        });
      }
    }
    res.json({ success: true, files: cleanFiles });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// PANNL ACTIONS (Home Page Editor)
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
  res.sendFile(path.join(__dirname, 'Image_admin'));
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


// API to get map pins
app.get('/api/map_pins', async (req, res) => {
  try {
    const [rows] = await panlePool.query('SELECT * FROM map_pins ORDER BY id DESC');
    res.json({ success: true, pins: rows });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Admin Add Map Pin
app.post('/pannl/add_map_pin', checkPannlAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, lat, lng } = req.body;
    let image_path = '';
    if (req.file) {
      image_path = 'pannl/uploads/' + req.file.filename;
    }
    await panlePool.query('INSERT INTO map_pins (title, description, image_path, lat, lng) VALUES (?, ?, ?, ?, ?)', [title, description, image_path, lat, lng]);
    res.json({ success: true, path: image_path });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Admin Delete Map Pin
app.post('/pannl/delete_map_pin', checkPannlAuth, express.json(), async (req, res) => {
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
    res.render('pannl/about', { grouped_images, feeds, map_pins });
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
    // Clear image_path for this slot in the database
    await panlePool.execute(
      'UPDATE section_images SET image_path = "" WHERE section_key = ?',
      [section_key]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

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
    // Sharp center crop resize based on section format and convert to buffer
    const buffer = await sharp(tempPath)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Clean up multer temp file
    fs.unlinkSync(tempPath);

    // Convert cropped buffer to base64 data URI
    const base64Data = buffer.toString('base64');
    const dbPath = `data:image/jpeg;base64,${base64Data}`;

    // Update DB
    await panlePool.execute(
      'UPDATE section_images SET image_path = ? WHERE section_key = ?',
      [dbPath, sectionKey]
    );

    res.json({ success: true, path: dbPath });
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.json({ success: false, message: err.message });
  }
});

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
        if (row.image_path.startsWith('http://') || row.image_path.startsWith('https://') || row.image_path.startsWith('data:')) {
          images[row.section_key] = row.image_path;
        } else {
          let relativePath = row.image_path;
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.slice(1);
          }
          const absolutePath = path.join(__dirname, relativePath);
          if (fs.existsSync(absolutePath) || 
              row.section_key.startsWith('story_names_') || 
              row.section_key.startsWith('story_subtitle_') || 
              row.section_key.startsWith('story_desc_') || 
              row.section_key.startsWith('story_link_')) {
            images[row.section_key] = row.image_path;
          }
        }
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

// Start Server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await initDatabases();
});
