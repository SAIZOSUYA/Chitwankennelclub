const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data & uploads directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'ckc.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Async wrapper helpers
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize Database Schema & Initial Data
async function initDatabase() {
  // 1. Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default admin if missing
  const adminUser = await dbGet(`SELECT * FROM users WHERE username = ?`, ['admin']);
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('1234', salt);
    await dbRun(
      `INSERT INTO users (username, pin, password_hash) VALUES (?, ?, ?)`,
      ['admin', '1234', hash]
    );
    console.log('Default Admin Account created (Username: admin, PIN: 1234)');
  }

  // 2. Media Overrides Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS media_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      media_type TEXT DEFAULT 'image',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Puppies Table
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

  // Seed default puppies if empty
  const puppyCount = await dbGet(`SELECT COUNT(*) as count FROM puppies`);
  if (puppyCount.count === 0) {
    const seedPuppies = [
      {
        puppy_id: '1',
        name: 'Rottweiler',
        breed: 'Rottweiler',
        gender: 'Male & Female',
        category: 'guard large',
        age: '8 Weeks Old',
        tag: 'Champion Bloodline',
        specs: 'Dewormed, 1st Vet Shot, KCI Registered',
        desc: 'Loyal, highly trainable, powerful guard dog with confident temperament.',
        status: 'Available in Kennel',
        image_url: 'images/rottweiler_puppy.jpg'
      },
      {
        puppy_id: '2',
        name: 'German Shepherd',
        breed: 'German Shepherd',
        gender: 'Male & Female',
        category: 'guard large',
        age: '7 Weeks Old',
        tag: 'Heavy Bone Line',
        specs: 'Parvo Vaccinated, Microchipped, Show Line',
        desc: 'Intelligent, protective, and agile companion ideal for families and security.',
        status: 'Available in Kennel',
        image_url: 'images/german_shepherd_puppy.jpg'
      },
      {
        puppy_id: '3',
        name: 'Golden Retriever',
        breed: 'Golden Retriever',
        gender: 'Female',
        category: 'family large',
        age: '9 Weeks Old',
        tag: 'Super Gentle',
        specs: 'Fully Vaccinated, Vet Certified, Playful',
        desc: 'Extremely friendly, gentle with kids, plush cream-golden coat.',
        status: 'Available in Kennel',
        image_url: 'images/golden_retriever_puppy.jpg'
      },
      {
        puppy_id: '4',
        name: 'Beagle (Tricolor)',
        breed: 'Beagle',
        gender: 'Male',
        category: 'family medium',
        age: '8 Weeks Old',
        tag: 'Compact & Energetic',
        specs: 'Dewormed, Active, Socialized',
        desc: 'Curious scent hound, compact size, fantastic for apartment or home living.',
        status: 'Available in Kennel',
        image_url: 'images/beagle_puppy.jpg'
      },
      {
        puppy_id: '5',
        name: 'Labrador Retriever',
        breed: 'Labrador Retriever',
        gender: 'Male & Female',
        category: 'family large',
        age: '7 Weeks Old',
        tag: 'Rare Chocolate Coat',
        specs: 'First Vaccination, Pedigree Parent',
        desc: 'High energy, eager to please, loving family dog with athletic build.',
        status: 'Available in Kennel',
        image_url: 'images/labrador_puppy.jpg'
      },
      {
        puppy_id: '6',
        name: 'Siberian Husky',
        breed: 'Siberian Husky',
        gender: 'Female',
        category: 'guard large',
        age: '9 Weeks Old',
        tag: 'Blue Eyes',
        specs: 'Vaccinated, Dewormed, Show Quality',
        desc: 'Stunning thick double coat, striking blue eyes, and vocal charismatic personality.',
        status: 'Available in Kennel',
        image_url: 'images/husky_puppy.jpg'
      }
    ];

    for (const p of seedPuppies) {
      await dbRun(
        `INSERT INTO puppies (puppy_id, name, breed, gender, category, age, tag, specs, desc, status, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.puppy_id, p.name, p.breed, p.gender, p.category, p.age, p.tag, p.specs, p.desc, p.status, p.image_url]
      );
    }
    console.log('Seeded 6 featured puppies into SQLite database.');
  }

  // 4. Inquiries & Bookings Table
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

  // Seed sample inquiry if empty
  const inquiryCount = await dbGet(`SELECT COUNT(*) as count FROM inquiries`);
  if (inquiryCount.count === 0) {
    await dbRun(
      `INSERT INTO inquiries (type, name, phone, email, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'breed_inquiry',
        'Sujan Shrestha',
        '+977 9845012345',
        'sujan@gmail.com',
        'Rottweiler',
        'Interested in visiting Gautam Chowk kennel to view Rottweiler male puppies.',
        'New'
      ]
    );
  }

  // 5. Testimonials Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote TEXT NOT NULL,
      author TEXT NOT NULL,
      location TEXT NOT NULL
    )
  `);

  const testCount = await dbGet(`SELECT COUNT(*) as count FROM testimonials`);
  if (testCount.count === 0) {
    const seedTestimonials = [
      {
        quote: "I got my Rottweiler puppy from Chitwan Kennel Club 6 months ago. The puppy arrived healthy, fully vaccinated, and extremely well-socialized. Dr. Kamala and the team at Gautam Chowk are always available whenever I need advice!",
        author: "Sujan Shrestha",
        location: "Bharatpur-10, Chitwan"
      },
      {
        quote: "The best veterinary clinic and kennel in Bharatpur! They performed minor ear care surgery on my German Shepherd with utmost precision and tender loving care. Highly recommend to all pet owners in Nepal.",
        author: "Aakriti Gurung",
        location: "Narayangarh, Chitwan"
      },
      {
        quote: "Finding purebred, ethically raised Golden Retrievers in Nepal used to be tough. Chitwan Kennel Club provided full vaccination records, microchip details, and genuine care. My dog Bruno is the joy of our family!",
        author: "Rohan Pokharel",
        location: "Gaindakot, Nawalpur"
      },
      {
        quote: "Outstanding boarding and dog training service! Left my Beagle for 10 days while traveling to Kathmandu, and he was returned clean, happy, and well-exercised.",
        author: "Deepak Karki",
        location: "Bharatpur-7, Chitwan"
      }
    ];
    for (const t of seedTestimonials) {
      await dbRun(`INSERT INTO testimonials (quote, author, location) VALUES (?, ?, ?)`, [t.quote, t.author, t.location]);
    }
  }
}

// Auto-run init
initDatabase().catch(err => console.error('Database initialization failed:', err));

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};
