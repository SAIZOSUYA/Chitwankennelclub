const path = require('path');
const fs = require('fs');

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

let db = null;
let useFallback = false;

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isVercel ? '/tmp' : path.join(__dirname, 'data');
const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const stateFilePath = path.join(isVercel ? '/tmp' : path.join(__dirname, 'data'), 'ckc_state.json');

try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
} catch (e) {}

try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {}

const defaultPuppies = [
  { id: 1, puppy_id: '1', name: 'Rottweiler', breed: 'Rottweiler', gender: 'Male & Female', category: 'guard large', age: '8 Weeks Old', tag: 'Champion Bloodline', specs: 'Dewormed, 1st Vet Shot, KCI Registered', desc: 'Loyal, highly trainable, powerful guard dog with confident temperament.', status: 'Available in Kennel', image_url: 'images/rottweiler_puppy.jpg' },
  { id: 2, puppy_id: '2', name: 'German Shepherd', breed: 'German Shepherd', gender: 'Male & Female', category: 'guard large', age: '7 Weeks Old', tag: 'Heavy Bone Line', specs: 'Parvo Vaccinated, Microchipped, Show Line', desc: 'Intelligent, protective, and agile companion ideal for families and security.', status: 'Available in Kennel', image_url: 'images/german_shepherd_puppy.jpg' },
  { id: 3, puppy_id: '3', name: 'Golden Retriever', breed: 'Golden Retriever', gender: 'Female', category: 'family large', age: '9 Weeks Old', tag: 'Super Gentle', specs: 'Fully Vaccinated, Vet Certified, Playful', desc: 'Extremely friendly, gentle with kids, plush cream-golden coat.', status: 'Available in Kennel', image_url: 'images/golden_retriever_puppy.jpg' },
  { id: 4, puppy_id: '4', name: 'Beagle (Tricolor)', breed: 'Beagle', gender: 'Male', category: 'family medium', age: '8 Weeks Old', tag: 'Compact & Energetic', specs: 'Dewormed, Active, Socialized', desc: 'Curious scent hound, compact size, fantastic for apartment or home living.', status: 'Available in Kennel', image_url: 'images/beagle_puppy.jpg' },
  { id: 5, puppy_id: '5', name: 'Labrador Retriever', breed: 'Labrador Retriever', gender: 'Male & Female', category: 'family large', age: '7 Weeks Old', tag: 'Rare Chocolate Coat', specs: 'First Vaccination, Pedigree Parent', desc: 'High energy, eager to please, loving family dog with athletic build.', status: 'Available in Kennel', image_url: 'images/labrador_puppy.jpg' },
  { id: 6, puppy_id: '6', name: 'Siberian Husky', breed: 'Siberian Husky', gender: 'Female', category: 'guard large', age: '9 Weeks Old', tag: 'Blue Eyes', specs: 'Vaccinated, Dewormed, Show Quality', desc: 'Stunning thick double coat, striking blue eyes, and vocal charismatic personality.', status: 'Available in Kennel', image_url: 'images/husky_puppy.jpg' }
];

const defaultTestimonials = [
  { id: 1, quote: "I got my Rottweiler puppy from Chitwan Kennel Club 6 months ago. The puppy arrived healthy, fully vaccinated, and extremely well-socialized. Dr. Kamala and the team at Srijana Chowk are always available whenever I need advice!", author: "Sujan Shrestha", location: "Srijana Chowk, Bharatpur 44200" },
  { id: 2, quote: "The best veterinary clinic and kennel in Bharatpur! They performed minor ear care surgery on my German Shepherd with utmost precision and tender loving care. Highly recommend to all pet owners in Nepal.", author: "Aakriti Gurung", location: "Narayangarh, Chitwan" },
  { id: 3, quote: "Finding purebred, ethically raised Golden Retrievers in Nepal used to be tough. Chitwan Kennel Club provided full vaccination records, microchip details, and genuine care. My dog Bruno is the joy of our family!", author: "Rohan Pokharel", location: "Gaindakot, Nawalpur" },
  { id: 4, quote: "Outstanding boarding and dog training service! Left my Beagle for 10 days while traveling to Kathmandu, and he was returned clean, happy, and well-exercised.", author: "Deepak Karki", location: "Bharatpur-7, Chitwan" }
];

let memoryInquiries = [];
let memoryMedia = {};
let memoryPuppies = JSON.parse(JSON.stringify(defaultPuppies));

// Load fallback state if stored on disk/tmp
function loadFallbackState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      if (data.inquiries) memoryInquiries = data.inquiries;
      if (data.media) memoryMedia = data.media;
      if (data.puppies) memoryPuppies = data.puppies;
    }
  } catch (e) {}
}

function saveFallbackState() {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify({
      inquiries: memoryInquiries,
      media: memoryMedia,
      puppies: memoryPuppies
    }, null, 2));
  } catch (e) {}
}

loadFallbackState();

// SQLite Connection Attempt
try {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(dataDir, 'ckc.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.warn('SQLite connection notice, using high-speed serverless store:', err.message);
      useFallback = true;
    } else {
      console.log('Connected to SQLite database at:', dbPath);
    }
  });
} catch (e) {
  console.warn('SQLite native module unavailable in serverless environment. Using persistent JSON store.');
  useFallback = true;
}

// Async wrapper helpers
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (useFallback || !db) {
      if (sql.includes('INSERT INTO inquiries')) {
        memoryInquiries.push({
          id: memoryInquiries.length + 1,
          type: params[0] || 'inquiry',
          name: params[1] || 'Anonymous',
          phone: params[2] || '',
          email: params[3] || '',
          subject: params[4] || '',
          message: params[5] || '',
          status: 'New',
          created_at: new Date().toISOString()
        });
        saveFallbackState();
      } else if (sql.includes('media_overrides')) {
        if (params && params.length >= 2) {
          memoryMedia[params[0]] = {
            media_id: params[0],
            url: params[1],
            media_type: params[2] || 'image',
            updated_at: new Date().toISOString()
          };
          saveFallbackState();
        }
      } else if (sql.includes('DELETE FROM media_overrides')) {
        if (params && params.length >= 1) {
          delete memoryMedia[params[0]];
          saveFallbackState();
        }
      } else if (sql.includes('UPDATE puppies')) {
        const puppy = memoryPuppies.find(p => String(p.puppy_id) === String(params[1]) || String(p.id) === String(params[2]));
        if (puppy) {
          puppy.image_url = params[0];
          saveFallbackState();
        }
      }
      return resolve({ lastID: Date.now(), changes: 1 });
    }

    db.run(sql, params, function (err) {
      if (err) {
        console.error('dbRun error:', err.message, 'SQL:', sql);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (useFallback || !db) {
      if (sql.includes('users')) {
        const adminUser = process.env.ADMIN_USERNAME || 'Kennelrosan';
        const adminPassHash = process.env.ADMIN_PASSWORD_HASH || '$2a$10$5jugWnspb3aCq0/cYM7/8OPlQmTC/DNhGEC8OjxRaoPQCEaynwAWC';
        if (params && params[0] && params[0] !== adminUser) return resolve(null);
        return resolve({ id: 1, username: adminUser, password_hash: adminPassHash });
      }
      if (sql.includes('COUNT')) return resolve({ count: memoryPuppies.length });
      return resolve(null);
    }
    db.get(sql, params, (err, row) => {
      if (err) resolve(null);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (useFallback || !db) {
      if (sql.includes('puppies')) return resolve(memoryPuppies);
      if (sql.includes('testimonials')) return resolve(defaultTestimonials);
      if (sql.includes('media_overrides')) return resolve(Object.values(memoryMedia));
      if (sql.includes('inquiries')) return resolve(memoryInquiries);
      return resolve([]);
    }
    db.all(sql, params, (err, rows) => {
      if (err || !rows) {
        if (sql.includes('puppies')) return resolve(memoryPuppies);
        if (sql.includes('testimonials')) return resolve(defaultTestimonials);
        return resolve([]);
      }
      resolve(rows);
    });
  });
};

async function initDatabase() {
  if (useFallback || !db) return;
  try {
    try {
      const tableInfo = await dbAll(`PRAGMA table_info(users)`);
      if (tableInfo && tableInfo.some(col => col.name === 'pin')) {
        await dbRun(`DROP TABLE users`);
      }
    } catch (e) {}

    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const adminUsername = process.env.ADMIN_USERNAME || 'Kennelrosan';
    const adminHash = process.env.ADMIN_PASSWORD_HASH || '$2a$10$5jugWnspb3aCq0/cYM7/8OPlQmTC/DNhGEC8OjxRaoPQCEaynwAWC';

    await dbRun(`DELETE FROM users`);
    await dbRun(
      `INSERT INTO users (username, password_hash) VALUES (?, ?)`,
      [adminUsername, adminHash]
    );

    await dbRun(`
      CREATE TABLE IF NOT EXISTS media_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_id TEXT UNIQUE NOT NULL,
        url TEXT NOT NULL,
        media_type TEXT DEFAULT 'image',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS puppies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puppy_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        breed TEXT NOT NULL,
        gender TEXT NOT NULL,
        category TEXT NOT NULL,
        age TEXT NOT NULL,
        tag TEXT NOT NULL,
        specs TEXT NOT NULL,
        desc TEXT NOT NULL,
        status TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const puppyCount = await dbGet(`SELECT COUNT(*) as count FROM puppies`);
    if (!puppyCount || puppyCount.count === 0) {
      for (const p of defaultPuppies) {
        await dbRun(
          `INSERT INTO puppies (puppy_id, name, breed, gender, category, age, tag, specs, desc, status, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.puppy_id, p.name, p.breed, p.gender, p.category, p.age, p.tag, p.specs, p.desc, p.status, p.image_url]
        );
      }
    }

    await dbRun(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT DEFAULT 'inquiry',
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        subject TEXT,
        message TEXT,
        status TEXT DEFAULT 'New',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT NOT NULL,
        author TEXT NOT NULL,
        location TEXT NOT NULL
      )
    `);

    const testCount = await dbGet(`SELECT COUNT(*) as count FROM testimonials`);
    if (!testCount || testCount.count === 0) {
      for (const t of defaultTestimonials) {
        await dbRun(`INSERT INTO testimonials (quote, author, location) VALUES (?, ?, ?)`, [t.quote, t.author, t.location]);
      }
    }
  } catch (err) {
    console.error('DB init warning:', err.message);
  }
}

initDatabase().catch(() => {});

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};
