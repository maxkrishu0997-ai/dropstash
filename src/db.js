const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlitePath = path.join(dataDir, 'dropstash.sqlite');
const jsonPath = path.join(dataDir, 'dropstash.json');

// First names pool for realistic Indian participants
const firstNames = [
  'Rahul', 'Aarav', 'Priya', 'Vikramaditya', 'Sneha', 'Ankit', 'Rohan', 'Divya', 'Aman', 'Kavita',
  'Arjun', 'Neha', 'Mohit', 'Pooja', 'Siddharth', 'Aditi', 'Karan', 'Tanvi', 'Varun', 'Ritu',
  'Manish', 'Shreya', 'Gaurav', 'Akansha', 'Deepak', 'Nikhil', 'Megha', 'Sameer', 'Tarun', 'Kunal',
  'Swati', 'Amit', 'Rohit', 'Preeti', 'Rajesh', 'Suresh', 'Pankaj', 'Alok', 'Sumit', 'Harish',
  'Manoj', 'Vinod', 'Sanjay', 'Satish', 'Ashok', 'Ajay', 'Vijay', 'Sachin', 'Mayank', 'Ashish',
  'Abhishek', 'Vishal', 'Ravi', 'Vikas', 'Prashant', 'Bhawna', 'Komal', 'Deepika', 'Anjali', 'Simran',
  'Meenakshi', 'Richa', 'Nisha', 'Rashmi', 'Geeta', 'Shalini', 'Payal', 'Monika', 'Renu', 'Suman'
];

// Last names pool
const lastNames = [
  'Sharma', 'Patel', 'Mukherjee', 'Rao', 'Verma', 'Kumar', 'Deshmukh', 'Nair', 'Singh', 'Mehra',
  'Gupta', 'Chawla', 'Iyer', 'Joshi', 'Roy', 'Kapoor', 'Saxena', 'Pandey', 'Kulkarni', 'Bhatia',
  'Dixit', 'Yadav', 'Chauhan', 'Bansal', 'Qureshi', 'Goswami', 'Mishra', 'Sen', 'Aggarwal', 'Tiwari',
  'Shukla', 'Dubey', 'Rajput', 'Chaudhary', 'Garg', 'Jain', 'Reddy', 'Pillai', 'Nambiar', 'Bose',
  'Dey', 'Chatterjee', 'Banerjee', 'Ghosh', 'Biswas', 'Chakraborty', 'Dutta', 'Sarkar', 'Mitra', 'Das'
];

// Cities pool
const cities = [
  'Noida, UP', 'Lucknow, UP', 'Kanpur, UP', 'Ghaziabad, UP', 'Meerut, UP', 'Agra, UP', 'Varanasi, UP',
  'Delhi NCR', 'Jaipur, Rajasthan', 'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Nagpur, Maharashtra',
  'Bengaluru, Karnataka', 'Hyderabad, Telangana', 'Ahmedabad, Gujarat', 'Surat, Gujarat', 'Indore, MP',
  'Bhopal, MP', 'Chandigarh, Punjab', 'Kolkata, WB', 'Patna, Bihar', 'Dehradun, Uttarakhand', 'Kochi, Kerala'
];

// Generate 329 realistic participants
function generate329SeedEntries() {
  const list = [];

  // Guaranteed Winner: Sunil Kumar from Devipura, Bulandshahr (UP)
  const sunilKumarEntry = {
    name: 'Sunil Kumar',
    email: 'sunilkumar.devipura@gmail.com',
    phone: '+91 98971 52044',
    city: 'Devipura, Bulandshahr (UP)',
    minsAgo: 380,
    isGuaranteed: true
  };

  for (let i = 1; i <= 328; i++) {
    const fn = firstNames[(i * 7 + 3) % firstNames.length];
    const ln = lastNames[(i * 11 + 5) % lastNames.length];
    const name = `${fn} ${ln}`;
    const cleanFn = fn.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLn = ln.toLowerCase().replace(/[^a-z]/g, '');
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = domains[i % domains.length];
    const email = `${cleanFn}.${cleanLn}${10 + (i % 89)}@${domain}`;
    
    // Realistic phone numbers
    const phonePrefix = ['98', '99', '97', '96', '95', '94', '93', '91', '90', '88', '87', '79'][i % 12];
    const phoneSuffix = String(10000000 + ((i * 28913) % 89999999)).slice(0, 8);
    const phone = `+91 ${phonePrefix}${phoneSuffix.slice(0, 3)} ${phoneSuffix.slice(3)}`;
    const city = cities[i % cities.length];
    const minsAgo = 20 + Math.floor(i * 11.5); // spread over last ~2.5 days

    list.push({
      name,
      email,
      phone,
      city,
      minsAgo
    });
  }

  // Insert Sunil Kumar at position #142 (natural placement among entries)
  list.splice(141, 0, sunilKumarEntry);

  return list;
}

let dbEngine = 'sqlite';
let sqliteDb = null;
let jsonData = { users: [], entries: [], winners: [] };

// Try loading built-in SQLite first
try {
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(sqlitePath);
  dbEngine = 'sqlite';
  console.log(`[DB] Connected to SQLite database at: ${sqlitePath}`);
} catch (err) {
  console.warn(`[DB] Built-in SQLite not available (${err.message}). Using JSON database at: ${jsonPath}`);
  dbEngine = 'json';
  if (fs.existsSync(jsonPath)) {
    try {
      jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      jsonData = { users: [], entries: [], winners: [] };
    }
  }
}

function saveJson() {
  if (dbEngine === 'json') {
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
  }
}

// Initialize tables and seed 329 entries if empty
function initDb() {
  if (dbEngine === 'sqlite') {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password TEXT NOT NULL,
        city TEXT DEFAULT 'India',
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_phone TEXT NOT NULL,
        city TEXT DEFAULT 'India',
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_phone TEXT NOT NULL,
        city TEXT,
        prize TEXT DEFAULT 'Acer Aspire 7 Gaming Laptop (RTX 4050)',
        drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_announced INTEGER DEFAULT 1
      );
    `);

    // Safe schema migrations
    try { sqliteDb.exec('ALTER TABLE users ADD COLUMN city TEXT DEFAULT "India";'); } catch (e) {}
    try { sqliteDb.exec('ALTER TABLE entries ADD COLUMN city TEXT DEFAULT "India";'); } catch (e) {}

    // Check entry count
    const countRow = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM entries').get();
    if (countRow.cnt < 329) {
      console.log(`[DB] Current entries: ${countRow.cnt}. Re-seeding exactly 329 entries (including Sunil Kumar from Devipura, Bulandshahr, UP)...`);
      
      // Clear previous sample entries to ensure clean 329 count
      sqliteDb.exec('DELETE FROM entries; DELETE FROM users;');

      const insertUser = sqliteDb.prepare('INSERT INTO users (name, email, phone, city, password, created_at) VALUES (?, ?, ?, ?, ?, ?)');
      const insertEntry = sqliteDb.prepare('INSERT INTO entries (user_id, user_name, user_email, user_phone, city, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');

      const seedList = generate329SeedEntries();
      seedList.forEach((entry, idx) => {
        const entryTime = new Date(Date.now() - entry.minsAgo * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
        const userRes = insertUser.run(
          entry.name,
          entry.email,
          entry.phone,
          entry.city || 'India',
          '$2a$10$hashedseedpasswordplaceholderformockusers0001',
          entryTime
        );
        const userId = Number(userRes.lastInsertRowid);
        insertEntry.run(
          userId,
          entry.name,
          entry.email,
          entry.phone,
          entry.city || 'India',
          `103.212.${10 + (idx % 200)}.${15 + (idx % 240)}`,
          entryTime
        );
      });
      console.log('[DB] Successfully seeded exactly 329 initial giveaway entries!');
    }
  } else {
    // JSON fallback
    if (!jsonData.users) jsonData.users = [];
    if (!jsonData.entries) jsonData.entries = [];
    if (!jsonData.winners) jsonData.winners = [];

    if (jsonData.entries.length < 329) {
      console.log('[DB] Seeding 329 entries in JSON fallback...');
      jsonData.users = [];
      jsonData.entries = [];
      const seedList = generate329SeedEntries();
      seedList.forEach((entry, idx) => {
        const entryTime = new Date(Date.now() - entry.minsAgo * 60 * 1000).toISOString();
        const userId = idx + 1;
        jsonData.users.push({
          id: userId,
          name: entry.name,
          email: entry.email,
          phone: entry.phone,
          city: entry.city || 'India',
          password: '$2a$10$hashedseedpasswordplaceholderformockusers0001',
          role: 'user',
          created_at: entryTime
        });
        jsonData.entries.push({
          id: idx + 1,
          user_id: userId,
          user_name: entry.name,
          user_email: entry.email,
          user_phone: entry.phone,
          city: entry.city || 'India',
          ip_address: `103.212.${10 + (idx % 200)}.${15 + (idx % 240)}`,
          created_at: entryTime
        });
      });
      saveJson();
      console.log('[DB] Successfully seeded 329 initial entries in JSON!');
    }
  }
}

// User Helpers
function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (dbEngine === 'sqlite') {
    const row = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalized);
    return row ? { ...row } : null;
  } else {
    return jsonData.users.find(u => u.email.toLowerCase() === normalized) || null;
  }
}

function findUserById(id) {
  const numId = Number(id);
  if (dbEngine === 'sqlite') {
    const row = sqliteDb.prepare('SELECT id, name, email, phone, city, role, created_at FROM users WHERE id = ?').get(numId);
    return row ? { ...row } : null;
  } else {
    const u = jsonData.users.find(x => x.id === numId);
    if (!u) return null;
    const { password, ...safe } = u;
    return safe;
  }
}

function createUser(name, email, phone, hashedPassword, city = 'India') {
  const normalized = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();
  const trimmedPhone = (phone || '').trim();
  const trimmedCity = (city || 'India').trim();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (dbEngine === 'sqlite') {
    const stmt = sqliteDb.prepare('INSERT INTO users (name, email, phone, city, password, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    const res = stmt.run(trimmedName, normalized, trimmedPhone, trimmedCity, hashedPassword, now);
    return {
      id: Number(res.lastInsertRowid),
      name: trimmedName,
      email: normalized,
      phone: trimmedPhone,
      city: trimmedCity,
      role: 'user',
      created_at: now
    };
  } else {
    const newId = jsonData.users.length ? Math.max(...jsonData.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      name: trimmedName,
      email: normalized,
      phone: trimmedPhone,
      city: trimmedCity,
      password: hashedPassword,
      role: 'user',
      created_at: now
    };
    jsonData.users.push(newUser);
    saveJson();
    const { password, ...safe } = newUser;
    return safe;
  }
}

// Entry Helpers
function getEntriesCount() {
  if (dbEngine === 'sqlite') {
    const row = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM entries').get();
    return Number(row.cnt);
  } else {
    return jsonData.entries.length;
  }
}

function hasUserEntered(userId) {
  const numId = Number(userId);
  if (dbEngine === 'sqlite') {
    const row = sqliteDb.prepare('SELECT id FROM entries WHERE user_id = ?').get(numId);
    return !!row;
  } else {
    return jsonData.entries.some(e => e.user_id === numId);
  }
}

function createEntry(userId, userName, userEmail, userPhone, ipAddress, city = 'India') {
  const numId = Number(userId);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (hasUserEntered(numId)) {
    throw new Error('Aap already giveaway me enter kar chuke hain!');
  }

  if (dbEngine === 'sqlite') {
    const stmt = sqliteDb.prepare('INSERT INTO entries (user_id, user_name, user_email, user_phone, city, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const res = stmt.run(numId, userName, userEmail, userPhone, city, ipAddress || '127.0.0.1', now);
    return {
      id: Number(res.lastInsertRowid),
      user_id: numId,
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      city,
      ip_address: ipAddress || '127.0.0.1',
      created_at: now
    };
  } else {
    const newId = jsonData.entries.length ? Math.max(...jsonData.entries.map(e => e.id)) + 1 : 1;
    const newEntry = {
      id: newId,
      user_id: numId,
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      city,
      ip_address: ipAddress || '127.0.0.1',
      created_at: now
    };
    jsonData.entries.push(newEntry);
    saveJson();
    return newEntry;
  }
}

function getAllEntries() {
  if (dbEngine === 'sqlite') {
    const rows = sqliteDb.prepare('SELECT id, user_id, user_name, user_email, user_phone, city, ip_address, created_at FROM entries ORDER BY id DESC').all();
    return rows.map(r => ({ ...r }));
  } else {
    return [...jsonData.entries].sort((a, b) => b.id - a.id);
  }
}

function getRecentEntries(limit = 6) {
  if (dbEngine === 'sqlite') {
    const rows = sqliteDb.prepare('SELECT id, user_name, city, created_at FROM entries ORDER BY id DESC LIMIT ?').all(limit);
    return rows.map(r => ({
      id: r.id,
      displayName: maskName(r.user_name),
      city: r.city || 'India',
      created_at: r.created_at
    }));
  } else {
    return [...jsonData.entries]
      .sort((a, b) => b.id - a.id)
      .slice(0, limit)
      .map(r => ({
        id: r.id,
        displayName: maskName(r.user_name),
        city: r.city || 'India',
        created_at: r.created_at
      }));
  }
}

function maskName(str) {
  if (!str) return 'Participant';
  const parts = str.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].slice(0, 3) + '***';
  }
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}***`;
}

// WINNERS LOGIC: Guaranteed Sunil Kumar from Devipura, Bulandshahr (UP) + 4 Random Winners
function draw5Winners() {
  const all = getAllEntries();
  if (all.length === 0) {
    throw new Error('No entries found to draw winners.');
  }

  // 1. Locate Sunil Kumar (Guaranteed winner from Devipura, Bulandshahr)
  let guaranteedWinner = all.find(e => 
    (e.user_name && e.user_name.toLowerCase().includes('sunil kumar')) ||
    (e.city && e.city.toLowerCase().includes('devipura'))
  );

  // Fallback safeguard in case Sunil Kumar was removed
  if (!guaranteedWinner) {
    guaranteedWinner = {
      user_id: 9999,
      user_name: 'Sunil Kumar',
      user_email: 'sunilkumar.devipura@gmail.com',
      user_phone: '+91 98971 52044',
      city: 'Devipura, Bulandshahr (UP)',
      prize: 'Acer Aspire 7 Gaming Laptop (RTX 4050)'
    };
  }

  // 2. Filter out Sunil Kumar from the rest of the pool
  const remaining = all.filter(e => e.id !== guaranteedWinner.id && e.user_email !== guaranteedWinner.user_email);

  // 3. Shuffle remaining and select 4 random winners
  const shuffled = [...remaining].sort(() => 0.5 - Math.random());
  const random4 = shuffled.slice(0, 4);

  // 4. Combine into final 5 winners
  const finalWinners = [
    {
      position: 1,
      user_id: guaranteedWinner.user_id,
      user_name: guaranteedWinner.user_name,
      user_email: guaranteedWinner.user_email,
      user_phone: guaranteedWinner.user_phone,
      city: guaranteedWinner.city || 'Devipura, Bulandshahr (UP)',
      prize: 'Acer Aspire 7 Gaming Laptop (RTX 4050)',
      isSpecial: true
    },
    ...random4.map((w, idx) => ({
      position: idx + 2,
      user_id: w.user_id,
      user_name: w.user_name,
      user_email: w.user_email,
      user_phone: w.user_phone,
      city: w.city || 'India',
      prize: 'Acer Aspire 7 Gaming Laptop (RTX 4050)',
      isSpecial: false
    }))
  ];

  // Save to winners table
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (dbEngine === 'sqlite') {
    sqliteDb.exec('DELETE FROM winners;');
    const insertWin = sqliteDb.prepare('INSERT INTO winners (user_id, user_name, user_email, user_phone, city, prize, drawn_at, is_announced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)');
    finalWinners.forEach(w => {
      insertWin.run(w.user_id || 0, w.user_name, w.user_email, w.user_phone, w.city, w.prize, now);
    });
  } else {
    jsonData.winners = finalWinners.map(w => ({ ...w, drawn_at: now, is_announced: 1 }));
    saveJson();
  }

  return {
    winners: finalWinners,
    drawnAt: now
  };
}

function getAnnouncedWinners() {
  if (dbEngine === 'sqlite') {
    const rows = sqliteDb.prepare('SELECT id, user_name, user_email, user_phone, city, prize, drawn_at FROM winners WHERE is_announced = 1 ORDER BY id ASC').all();
    return rows.map((r, idx) => ({
      position: idx + 1,
      user_name: r.user_name,
      user_email: r.user_email,
      user_phone: r.user_phone,
      city: r.city,
      prize: r.prize,
      drawn_at: r.drawn_at
    }));
  } else {
    return (jsonData.winners || []).map((r, idx) => ({
      position: idx + 1,
      user_name: r.user_name,
      user_email: r.user_email,
      user_phone: r.user_phone,
      city: r.city,
      prize: r.prize,
      drawn_at: r.drawn_at
    }));
  }
}

function clearAnnouncedWinners() {
  if (dbEngine === 'sqlite') {
    sqliteDb.exec('DELETE FROM winners;');
  } else {
    jsonData.winners = [];
    saveJson();
  }
}

// Initialize on load
initDb();

module.exports = {
  dbEngine,
  findUserByEmail,
  findUserById,
  createUser,
  getEntriesCount,
  hasUserEntered,
  createEntry,
  getAllEntries,
  getRecentEntries,
  draw5Winners,
  getAnnouncedWinners,
  clearAnnouncedWinners
};
