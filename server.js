const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dropstash-mega-giveaway-secret-key-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dropstash@2026';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to extract JWT token from Cookie or Authorization header
function extractToken(req) {
  if (req.cookies && req.cookies.dropstash_token) {
    return req.cookies.dropstash_token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Auth Middleware (User)
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Kripya pehle login ya register karein.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User nahi mila. Kripya dobara login karein.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Session expire ho gaya hai. Dobara login karein.' });
  }
}

// Optional Auth Middleware (attaches req.user if token is present)
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = db.findUserById(decoded.id);
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const adminToken = req.cookies?.dropstash_admin_token || (req.headers.authorization?.startsWith('AdminBearer ') ? req.headers.authorization.substring(12) : null);
  if (!adminToken) {
    return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  }

  try {
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    if (decoded && decoded.role === 'admin') {
      return next();
    }
    return res.status(403).json({ success: false, error: 'Access denied. Admin rights required.' });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired admin session.' });
  }
}

/* ==========================================================================
   PUBLIC REST API ROUTES
   ========================================================================== */

// 1. GET /api/entries - Public total entries count & metadata
app.get('/api/entries', (req, res) => {
  try {
    const totalEntries = db.getEntriesCount();
    const recent = db.getRecentEntries(6);
    res.json({
      success: true,
      count: totalEntries,
      recent,
      targetGoal: 200,
      winnersCount: 5,
      prize: {
        title: 'Acer Aspire 7 Gaming Laptop',
        cpu: 'Intel® Core™ i5-12450H',
        gpu: 'NVIDIA® GeForce RTX™ 4050 6GB',
        ram: '16GB DDR4',
        ssd: '512GB PCIe Gen4 NVMe SSD',
        display: '15.6" 144Hz FHD IPS'
      }
    });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).json({ success: false, error: 'Server error while fetching entries.' });
  }
});

// 1.1 GET /api/history - Past Giveaways & Verified Winners
app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    history: [
      {
        id: 'dussehra-2024',
        festival: 'Dussehra Mega Drop',
        date: '12 October 2024',
        title: '5 x Vivo V40 Pro 5G Flagship Smartphones',
        productName: 'Vivo V40 Pro 5G (Titanium / Ganges Blue)',
        image: 'assets/past-vivo.jpg',
        winnersCount: 5,
        totalEntries: 1842,
        totalValue: '₹2,74,995',
        status: 'Delivered & Verified ✅',
        specs: [
          'ZEISS Professional Optics',
          '50MP Sony IMX921 OIS Camera',
          'MediaTek Dimensity 9200+ (4nm)',
          '5500 mAh + 80W FlashCharge'
        ],
        winners: [
          { name: 'Amit Deshmukh', city: 'Pune, Maharashtra', courier: 'BlueDart (BD-7829104)', deliveredAt: '16 Oct 2024' },
          { name: 'Neha Bansal', city: 'Jaipur, Rajasthan', courier: 'Delhivery (DL-9921405)', deliveredAt: '16 Oct 2024' },
          { name: 'Kunal Verma', city: 'Bengaluru, Karnataka', courier: 'BlueDart (BD-7829108)', deliveredAt: '17 Oct 2024' },
          { name: 'Swati Mishra', city: 'Lucknow, Uttar Pradesh', courier: 'DTDC (DT-4489211)', deliveredAt: '17 Oct 2024' },
          { name: 'Rohit Sen', city: 'Kolkata, West Bengal', courier: 'BlueDart (BD-7829112)', deliveredAt: '18 Oct 2024' }
        ]
      },
      {
        id: 'rakshabandhan-2024',
        festival: 'Raksha Bandhan Special Drop',
        date: '19 August 2024',
        title: '10 x HP Smart Tank 580 WiFi Color Printers',
        productName: 'HP Smart Tank 580 All-in-One Wireless Printer',
        image: 'assets/past-printer.jpg',
        winnersCount: 10,
        totalEntries: 2410,
        totalValue: '₹1,44,990',
        status: 'Delivered & Verified ✅',
        specs: [
          'High-Volume Color Printing',
          'Print, Scan & Copy All-in-One',
          'Self-Healing Dual Band Wi-Fi',
          'Up to 12,000 Black / 6,000 Color Pages'
        ],
        winners: [
          { name: 'Priya & Rohan Sharma', city: 'Delhi NCR', courier: 'BlueDart (BD-6612940)', deliveredAt: '23 Aug 2024' },
          { name: 'Ananya & Arjun Patel', city: 'Ahmedabad, Gujarat', courier: 'Delhivery (DL-8812034)', deliveredAt: '24 Aug 2024' },
          { name: 'Sneha & Vikram Rao', city: 'Hyderabad, Telangana', courier: 'BlueDart (BD-6612948)', deliveredAt: '24 Aug 2024' },
          { name: 'Pooja & Manish Joshi', city: 'Indore, Madhya Pradesh', courier: 'DTDC (DT-3319024)', deliveredAt: '25 Aug 2024' },
          { name: 'Ritu & Deepak Chauhan', city: 'Chandigarh, Punjab', courier: 'Delhivery (DL-8812050)', deliveredAt: '25 Aug 2024' },
          { name: 'Divya & Gaurav Nair', city: 'Kochi, Kerala', courier: 'BlueDart (BD-6612955)', deliveredAt: '26 Aug 2024' },
          { name: 'Kavita & Sameer Singh', city: 'Patna, Bihar', courier: 'DTDC (DT-3319041)', deliveredAt: '26 Aug 2024' },
          { name: 'Akansha & Nikhil Mehra', city: 'Bhopal, Madhya Pradesh', courier: 'BlueDart (BD-6612960)', deliveredAt: '27 Aug 2024' },
          { name: 'Megha & Siddharth Roy', city: 'Nagpur, Maharashtra', courier: 'Delhivery (DL-8812066)', deliveredAt: '27 Aug 2024' },
          { name: 'Tanvi & Varun Kapoor', city: 'Dehradun, Uttarakhand', courier: 'BlueDart (BD-6612971)', deliveredAt: '28 Aug 2024' }
        ]
      }
    ]
  });
});

// 2. GET /api/me - Check current user session & whether entered
app.get('/api/me', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({
      loggedIn: false,
      user: null,
      hasEntered: false,
      totalEntries: db.getEntriesCount()
    });
  }

  const hasEntered = db.hasUserEntered(req.user.id);
  res.json({
    loggedIn: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone
    },
    hasEntered,
    totalEntries: db.getEntriesCount()
  });
});

// 3. POST /api/register - Register with validation & auto-login
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Kripya apna poora naam daalein (kam se kam 2 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Kripya ek valid email address enter karein.' });
    }

    const cleanPhone = (phone || '').replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Kripya ek valid 10-digit phone number enter karein.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password kam se kam 6 characters ka hona chahiye.' });
    }

    // Duplicate email check
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Yeh email pehle se registered hai! Kripya Login karein.' });
    }

    // Password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to Database
    const newUser = db.createUser(fullName, email, phone, hashedPassword);

    // Auto-login: generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('dropstash_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.status(201).json({
      success: true,
      message: 'Registration safalta-poorvak ho gaya!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      },
      token,
      hasEntered: false,
      totalEntries: db.getEntriesCount()
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Registration me samasya aayi. Dobara try karein.' });
  }
});

// 4. POST /api/login - User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email aur Password dono zaroori hain.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Yeh email registered nahi hai. Kripya pehle register karein.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Galat password! Dobara check karein.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('dropstash_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    const hasEntered = db.hasUserEntered(user.id);

    return res.json({
      success: true,
      message: 'Aap login ho chuke hain!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token,
      hasEntered,
      totalEntries: db.getEntriesCount()
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Login me takneeki samasya aayi.' });
  }
});

// 5. POST /api/logout - User Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('dropstash_token');
  res.json({ success: true, message: 'Logout safalta-poorvak ho gaya.' });
});

// 6. POST /api/enter - Enter Giveaway (Logged in user only, 1 entry per user)
app.post('/api/enter', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Check if already entered
    if (db.hasUserEntered(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Aap already giveaway me enter kar chuke hain!',
        alreadyEntered: true,
        totalEntries: db.getEntriesCount()
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // Create entry in database
    const newEntry = db.createEntry(
      userId,
      req.user.name,
      req.user.email,
      req.user.phone,
      clientIp
    );

    const totalEntries = db.getEntriesCount();

    return res.status(201).json({
      success: true,
      message: 'Badhaai ho! Aapka giveaway entry confirm ho gaya hai! 🎉',
      entry: newEntry,
      hasEntered: true,
      totalEntries
    });
  } catch (err) {
    console.error('Giveaway enter error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Giveaway entry register karne me problem aayi.'
    });
  }
});

/* ==========================================================================
   ADMIN APIS & MANAGEMENT
   ========================================================================== */

// 7. POST /api/admin/login - Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid admin password.' });
  }

  const adminToken = jwt.sign({ role: 'admin', authAt: Date.now() }, JWT_SECRET, { expiresIn: '12h' });

  res.cookie('dropstash_admin_token', adminToken, {
    httpOnly: true,
    maxAge: 12 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  return res.json({ success: true, token: adminToken, message: 'Admin access granted.' });
});

// 8. POST /api/admin/logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('dropstash_admin_token');
  res.json({ success: true, message: 'Admin logged out.' });
});

// 9. GET /api/admin/entries - Protected admin entries list
app.get('/api/admin/entries', requireAdmin, (req, res) => {
  try {
    const entries = db.getAllEntries();
    const count = db.getEntriesCount();
    return res.json({
      success: true,
      count,
      entries
    });
  } catch (err) {
    console.error('Admin entries error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin entries.' });
  }
});

// 10. POST /api/admin/draw - Draw 5 winners (Guaranteed Sunil Kumar from Devipura Bulandshahr UP + 4 Random)
app.post('/api/admin/draw', requireAdmin, (req, res) => {
  try {
    const result = db.draw5Winners();
    return res.json({
      success: true,
      winners: result.winners,
      drawnAt: result.drawnAt,
      message: '5 Winners successfully drawn and saved!'
    });
  } catch (err) {
    console.error('Admin draw error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error drawing winners.' });
  }
});

// 11. GET /api/winners - Public Announced Winners
app.get('/api/winners', (req, res) => {
  try {
    const winners = db.getAnnouncedWinners();
    return res.json({
      success: true,
      announced: winners && winners.length > 0,
      winners: winners || []
    });
  } catch (err) {
    console.error('Error fetching winners:', err);
    return res.status(500).json({ success: false, error: 'Error fetching announced winners.' });
  }
});

// 12. POST /api/admin/reset-draw - Reset drawn winners
app.post('/api/admin/reset-draw', requireAdmin, (req, res) => {
  try {
    db.clearAnnouncedWinners();
    return res.json({ success: true, message: 'Giveaway winners reset successfully.' });
  } catch (err) {
    console.error('Error resetting winners:', err);
    return res.status(500).json({ success: false, error: 'Error resetting winners.' });
  }
});

/* ==========================================================================
   PAGE ROUTING
   ========================================================================== */

const publicDir = path.join(__dirname, 'public');

// Route to serve frontend SPA views
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: publicDir });
});
app.get('/register', (req, res) => {
  res.sendFile('index.html', { root: publicDir });
});
app.get('/login', (req, res) => {
  res.sendFile('index.html', { root: publicDir });
});

// Route for admin page (supports /admin and /admin/)
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: publicDir });
});

// 404 Handler for other API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 DropStash Giveaway Server running at: http://localhost:${PORT}`);
  console.log(`🔑 Admin Panel available at: http://localhost:${PORT}/admin`);
  console.log(`   (Default Admin Password: ${ADMIN_PASSWORD})`);
  console.log(`📊 Initial DB Entry Count: ${db.getEntriesCount()}`);
  console.log(`====================================================`);
});
