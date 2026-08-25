const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'chitwan_kennel_club_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer Storage for Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'ckc-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Serve static directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

/* ==========================================
 * 1. PUBLIC MEDIA & CONTENT ENDPOINTS
 * ========================================== */

// Get all media overrides
app.get('/api/media', async (req, res) => {
  try {
    const rows = await dbAll(`SELECT media_id, url, media_type FROM media_overrides`);
    const mediaMap = {};
    rows.forEach(r => {
      mediaMap[r.media_id] = r.url;
    });
    res.json({ success: true, media: mediaMap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================
 * 2. PUPPIES ENDPOINTS
 * ========================================== */

// Get all puppies
app.get('/api/puppies', async (req, res) => {
  try {
    const puppies = await dbAll(`SELECT * FROM puppies ORDER BY id ASC`);
    res.json({ success: true, puppies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================
 * 3. INQUIRIES & BOOKINGS ENDPOINTS
 * ========================================== */

// Submit Contact / Breed Inquiry / Service Booking / Newsletter
app.post('/api/inquiries', async (req, res) => {
  try {
    const { type = 'inquiry', name, phone, email, subject, message } = req.body;
    if (!name && !email) {
      return res.status(400).json({ success: false, error: 'Name or email is required.' });
    }

    await dbRun(
      `INSERT INTO inquiries (type, name, phone, email, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'New')`,
      [type, name || 'Anonymous', phone || '', email || '', subject || 'General Inquiry', message || '']
    );

    res.json({ success: true, message: 'Thank you! Your request has been recorded into Chitwan Kennel Club database.' });
  } catch (err) {
    console.error('Inquiry submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================
 * 4. TESTIMONIALS ENDPOINTS
 * ========================================== */

app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await dbAll(`SELECT * FROM testimonials ORDER BY id ASC`);
    res.json({ success: true, testimonials });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback route to serve main website index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server locally or export for Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🐾 Chitwan Kennel Club Server running live at http://localhost:${PORT}`);
  });
}

module.exports = app;
