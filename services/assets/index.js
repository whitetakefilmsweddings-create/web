const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { panlePool } = require('../../config/db');

const app = express();
const PORT = process.env.ASSETS_PORT || 3004;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup temporary upload directory
const tempUploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}
const upload = multer({ dest: tempUploadDir });

// Setup cache directory
const cacheDir = path.join(__dirname, '../../uploads/cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Ensure database table exists
async function initDb() {
  try {
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
    console.log('Asset Microservice: database initialized.');
  } catch (err) {
    console.error('Asset Microservice: DB init error:', err);
  }
}

// Helper to calculate SHA-256 hash of a buffer
function getBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload Asset
 * POST /api/assets/upload
 */
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const tempPath = req.file.path;
  const originalName = req.file.originalname;

  try {
    // Read upload config options
    const width = req.body.width ? parseInt(req.body.width) : null;
    const height = req.body.height ? parseInt(req.body.height) : null;
    const quality = req.body.quality ? parseInt(req.body.quality) : 90;
    const format = req.body.format || 'webp';

    let sharpInstance = sharp(tempPath);

    // Apply resizing if requested
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    }

    // Convert format and compress
    let processedBuffer;
    let mimeType;
    let ext;

    if (format === 'png') {
      processedBuffer = await sharpInstance.png({ quality }).toBuffer();
      mimeType = 'image/png';
      ext = 'png';
    } else if (format === 'jpeg' || format === 'jpg') {
      processedBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
      mimeType = 'image/jpeg';
      ext = 'jpg';
    } else {
      // Default to WebP for maximum compression/fast loading
      processedBuffer = await sharpInstance.webp({ quality }).toBuffer();
      mimeType = 'image/webp';
      ext = 'webp';
    }

    // Generate deterministic hash ID based on optimized content
    const hash = getBufferHash(processedBuffer);
    const filename = `${hash}.${ext}`;

    // Save binary data to MySQL database
    await panlePool.query(
      `INSERT IGNORE INTO assets (id, filename, mime_type, data, size_bytes) VALUES (?, ?, ?, ?, ?)`,
      [hash, filename, mimeType, processedBuffer, processedBuffer.length]
    );

    // Write to local cache immediately to avoid database trip on first request
    const cachePath = path.join(cacheDir, filename);
    fs.writeFileSync(cachePath, processedBuffer);

    // Clean up temporary uploaded file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    res.json({
      success: true,
      url: `/api/assets/file/${filename}`,
      hash: hash,
      size: processedBuffer.length
    });
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.error('Asset Microservice: Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Serve Asset with High Performance Cache and Dynamic Resizing
 * GET /api/assets/file/:filename
 */
app.get('/file/:filename', async (req, res) => {
  const filename = req.params.filename;
  
  // Extract hash ID and extension
  const match = filename.match(/^([a-f0-9]{64})\.([a-z0-9]+)$/i);
  if (!match) {
    return res.status(400).send('Invalid file format.');
  }

  const hash = match[1];
  const ext = match[2];

  // Read dynamic query parameters
  const w = req.query.w ? parseInt(req.query.w) : null;
  const h = req.query.h ? parseInt(req.query.h) : null;
  const q = req.query.q ? parseInt(req.query.q) : null;

  // Formulate cached filename based on sizing parameters
  let cachedFilename = filename;
  if (w || h || q) {
    cachedFilename = `${hash}_${w || 'auto'}x${h || 'auto'}_q${q || 'def'}.${ext}`;
  }

  const cachePath = path.join(cacheDir, cachedFilename);

  // Send cache hit immediately
  if (fs.existsSync(cachePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${hash}"`);
    return res.sendFile(cachePath);
  }

  try {
    // Cache miss: Fetch from MySQL Database
    const [rows] = await panlePool.query('SELECT data, mime_type FROM assets WHERE id = ?', [hash]);
    if (rows.length === 0) {
      // Fallback if asset is missing (e.g. broken reference)
      const fallbackPath = path.join(__dirname, '../../assets/images/about.jpg');
      if (fs.existsSync(fallbackPath)) {
        return res.sendFile(fallbackPath);
      }
      return res.status(404).send('Asset not found.');
    }

    const dbRecord = rows[0];
    let imageBuffer = dbRecord.data;
    const originalMime = dbRecord.mime_type;

    // Apply dynamic resizing on cache miss if requested
    if (w || h || q) {
      let sharpInstance = sharp(imageBuffer);
      if (w || h) {
        sharpInstance = sharpInstance.resize(w, h, { fit: 'cover', position: 'center' });
      }
      
      if (ext === 'webp') {
        sharpInstance = sharpInstance.webp({ quality: q || 90 });
      } else if (ext === 'png') {
        sharpInstance = sharpInstance.png({ quality: q || 90 });
      } else {
        sharpInstance = sharpInstance.jpeg({ quality: q || 90 });
      }
      imageBuffer = await sharpInstance.toBuffer();
    }

    // Write processed asset to local cache directory
    fs.writeFileSync(cachePath, imageBuffer);

    // Serve asset
    res.setHeader('Content-Type', originalMime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${hash}"`);
    res.send(imageBuffer);
  } catch (err) {
    console.error('Asset Microservice: Serving error:', err);
    res.status(500).send('Error loading asset.');
  }
});

// Run server
app.listen(PORT, async () => {
  console.log(`Asset Microservice (AIP) running on http://localhost:${PORT}`);
  await initDb();
});
