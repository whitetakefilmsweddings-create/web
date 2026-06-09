const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { panlePool } = require('../../config/db');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3001;

app.use(express.json());

// Serves Static Files/Directories
app.use('/assets', express.static(path.join(__dirname, '../../assets')));
app.use('/pic', express.static(path.join(__dirname, '../../pic')));

// API to get map pins
app.get('/api/map_pins', async (req, res) => {
  try {
    const [rows] = await panlePool.query('SELECT * FROM map_pins ORDER BY id DESC');
    
    // Check if images exist, otherwise use fallback, or let Asset API URLs pass through
    const pins = rows.map(pin => {
      let p = pin.image_path;
      if (p) {
        if (p.startsWith('/api/assets/file/') || p.startsWith('data:image/') || p.startsWith('http://') || p.startsWith('https://')) {
          // Valid dynamic URL or Base64, leave as is
        } else {
          const absolutePath = path.join(__dirname, '../../', p.startsWith('/') ? p.slice(1) : p);
          if (!fs.existsSync(absolutePath)) {
            pin.image_path = 'assets/images/about.jpg';
          }
        }
      } else {
        pin.image_path = 'assets/images/about.jpg';
      }
      
      // Map database lat/lng coordinates to pos_x/pos_y percentages for the frontend vector map
      return {
        id: pin.id,
        title: pin.title,
        description: pin.description,
        image_path: pin.image_path,
        pos_x: pin.lat,
        pos_y: pin.lng,
        created_at: pin.created_at
      };
    });

    res.json({ success: true, pins: pins });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Serve Root Static HTML Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

app.get('/:page.html', (req, res, next) => {
  const filePath = path.join(__dirname, `../../${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next();
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`Frontend Microservice running on http://localhost:${PORT}`);
});
