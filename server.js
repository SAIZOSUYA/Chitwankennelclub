const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  } catch (e) {}
}

const { dbRun, dbGet, dbAll } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'chitwan_kennel_club_secret_key_2026';
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Multer Storage for Uploads
const uploadPath = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
} catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'ckc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Serve static directories
app.use(express.static(__dirname));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (isVercel) {
  app.use('/uploads', express.static('/tmp/uploads'));
}

// Auth Helper Middleware
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Admin token missing.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }
}

// Master list of all default media items on the website
const defaultMediaSlots = [
  { id: 'hero-img', name: 'Hero Banner Showcase Photo/Video', section: 'Home Hero Banner', defaultUrl: 'images/hero_puppies.jpg', type: 'image' },
  { id: 'nav-logo', name: 'Header Navigation Logo', section: 'Header Logo', defaultUrl: 'images/official_logo.png', type: 'image' },
  { id: 'reel-img-2', name: 'Facebook Reel 2 (German Shepherd Frisbee)', section: 'Facebook Media Feed', defaultUrl: 'images/facebook_reel_3.jpg', type: 'image' },
  { id: 'reel-video-1', name: 'Viral TikTok & Kennel Video Clip', section: 'TikTok & Video Feed', defaultUrl: 'videos/viral_tiktok.mp4', type: 'video' },
  { id: 'puppy-img-1', name: 'Rottweiler Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/rottweiler_puppy.jpg', type: 'image', puppyId: '1' },
  { id: 'puppy-img-2', name: 'German Shepherd Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/german_shepherd_puppy.jpg', type: 'image', puppyId: '2' },
  { id: 'puppy-img-3', name: 'Golden Retriever Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/golden_retriever_puppy.jpg', type: 'image', puppyId: '3' },
  { id: 'puppy-img-4', name: 'Beagle Tricolor Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/beagle_puppy.jpg', type: 'image', puppyId: '4' },
  { id: 'puppy-img-5', name: 'Labrador Retriever Photo/Video', section: 'Available Puppies', defaultUrl: 'images/labrador_puppy.jpg', type: 'image', puppyId: '5' },
  { id: 'puppy-img-6', name: 'Siberian Husky Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/husky_puppy.jpg', type: 'image', puppyId: '6' },
  { id: 'gallery-img-1', name: 'Gallery Photo 1 (Playtime at Kennel)', section: 'Moments Gallery', defaultUrl: 'images/hero_puppies.jpg', type: 'image' },
  { id: 'gallery-img-2', name: 'Gallery Photo 2 (Champion Rottweiler)', section: 'Moments Gallery', defaultUrl: 'images/rottweiler_puppy.jpg', type: 'image' },
  { id: 'gallery-img-3', name: 'Gallery Photo 3 (Routine Vet Checkup)', section: 'Moments Gallery', defaultUrl: 'images/vet_care.jpg', type: 'image' },
  { id: 'gallery-img-4', name: 'Gallery Photo 4 (Golden Retriever Joy)', section: 'Moments Gallery', defaultUrl: 'images/golden_retriever_puppy.jpg', type: 'image' },
  { id: 'about-img', name: 'About Us Facility Photo/Video', section: 'About Us Section', defaultUrl: 'images/about_kennel.jpg', type: 'image' }
];

/* ==========================================
 * API ROUTER DEFINITION
 * ========================================== */
const apiRouter = express.Router();

// 1. ADMIN AUTHENTICATION
apiRouter.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Please enter both username and password.' });
    }

    const trimmedUsername = String(username).trim();
    const user = await dbGet(`SELECT * FROM users WHERE username = ?`, [trimmedUsername]);

    if (user && user.password_hash) {
      const isMatch = bcrypt.compareSync(String(password), user.password_hash);
      if (isMatch) {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({
          success: true,
          token,
          user: { username: user.username, role: 'admin' }
        });
      }
    }

    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server authentication error.' });
  }
});

apiRouter.get('/admin/verify', verifyAdminToken, (req, res) => {
  res.json({ success: true, user: req.admin });
});

// 2. MEDIA UPLOAD & PERSISTENCE
apiRouter.post('/admin/upload', verifyAdminToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No media file provided.' });
    }

    let relativeUrl = `uploads/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.mov', '.ogg', '.mkv'].includes(ext);
    const mediaType = isVideo ? 'video' : 'image';

    if (isVercel && !isVideo) {
      try {
        const fileData = fs.readFileSync(req.file.path);
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
        relativeUrl = `data:${mimeType};base64,${fileData.toString('base64')}`;
      } catch (e) {}
    }

    res.json({
      success: true,
      url: relativeUrl,
      mediaType,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/admin/media', verifyAdminToken, async (req, res) => {
  try {
    const { media_id, url, media_type } = req.body;
    if (!media_id || !url) {
      return res.status(400).json({ success: false, error: 'media_id and url are required.' });
    }

    const isVideo = url.match(/\.(mp4|webm|mov|ogg|mkv)$/i) || media_type === 'video';
    const finalMediaType = isVideo ? 'video' : (media_type || 'image');

    await dbRun(
      `INSERT INTO media_overrides (media_id, url, media_type, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(media_id) DO UPDATE SET
         url = excluded.url,
         media_type = excluded.media_type,
         updated_at = CURRENT_TIMESTAMP`,
      [media_id, url, finalMediaType]
    );

    if (media_id.startsWith('puppy-img-')) {
      const puppyId = media_id.replace('puppy-img-', '');
      await dbRun(
        `UPDATE puppies SET image_url = ? WHERE puppy_id = ? OR id = ?`,
        [url, puppyId, puppyId]
      );
    }

    res.json({
      success: true,
      message: 'Media successfully saved to Chitwan Kennel Club database!',
      media_id,
      url,
      media_type: finalMediaType
    });
  } catch (err) {
    console.error('Save media error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/admin/media/reset', verifyAdminToken, async (req, res) => {
  try {
    const { media_id } = req.body;
    if (!media_id) {
      return res.status(400).json({ success: false, error: 'media_id is required.' });
    }

    await dbRun(`DELETE FROM media_overrides WHERE media_id = ?`, [media_id]);

    const slot = defaultMediaSlots.find(s => s.id === media_id);
    if (slot && media_id.startsWith('puppy-img-')) {
      const puppyId = media_id.replace('puppy-img-', '');
      await dbRun(
        `UPDATE puppies SET image_url = ? WHERE puppy_id = ? OR id = ?`,
        [slot.defaultUrl, puppyId, puppyId]
      );
    }

    res.json({
      success: true,
      message: 'Media reset to original default successfully.',
      media_id,
      defaultUrl: slot ? slot.defaultUrl : null
    });
  } catch (err) {
    console.error('Reset media error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/admin/media/list', verifyAdminToken, async (req, res) => {
  try {
    const rows = await dbAll(`SELECT media_id, url, media_type, updated_at FROM media_overrides`);
    const overrideMap = {};
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        if (r && r.media_id) overrideMap[r.media_id] = r;
      });
    }

    const slots = defaultMediaSlots.map(slot => {
      const override = overrideMap[slot.id];
      return {
        ...slot,
        currentUrl: override ? override.url : slot.defaultUrl,
        currentType: override ? override.media_type : slot.type,
        isOverridden: !!override,
        updatedAt: override ? override.updated_at : null
      };
    });

    res.json({ success: true, slots });
  } catch (err) {
    console.error('List media slots error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. PUBLIC MEDIA & CONTENT ENDPOINTS
apiRouter.get('/media', async (req, res) => {
  try {
    const rows = await dbAll(`SELECT media_id, url, media_type FROM media_overrides`);
    const mediaMap = {};
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        if (r && r.media_id && r.url) mediaMap[r.media_id] = r.url;
      });
    }
    res.json({ success: true, media: mediaMap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUPPIES ENDPOINTS
apiRouter.get('/puppies', async (req, res) => {
  try {
    const puppies = await dbAll(`SELECT * FROM puppies ORDER BY id ASC`);
    res.json({ success: true, puppies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. INQUIRIES & BOOKINGS ENDPOINTS
apiRouter.post('/inquiries', async (req, res) => {
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

apiRouter.get('/inquiries', verifyAdminToken, async (req, res) => {
  try {
    const inquiries = await dbAll(`SELECT * FROM inquiries ORDER BY id DESC`);
    res.json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. TESTIMONIALS ENDPOINTS
apiRouter.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await dbAll(`SELECT * FROM testimonials ORDER BY id ASC`);
    res.json({ success: true, testimonials });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount router on both '/api' and '/' for complete path resolution compatibility
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback route to serve main website index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server locally or export for Vercel
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`🐾 Chitwan Kennel Club Server running live at http://localhost:${PORT}`);
  });
}

module.exports = app;
