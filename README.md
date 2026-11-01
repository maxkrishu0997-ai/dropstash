# 🔥 DropStash - Professional Tech Giveaway Platform

DropStash ek modern, high-performance aur fully functional giveaway web application hai. Isme frontend, backend, SQLite database, authentication, real-time entry system aur password-protected admin dashboard shamil hai.

---

## 🚀 Features

- **Gaming / Cyber Dark Theme**: Sleek glassmorphism cards, glowing purple & gold gradients, responsive mobile-first UI.
- **Acer Aspire 7 Showcase**: 
  - Intel® Core™ i5-12450H (12th Gen)
  - NVIDIA® GeForce RTX™ 4050 (6GB GDDR6)
  - 16GB RAM, 512GB NVMe SSD, 144Hz FHD Display
  - High-res product render aur detailed specs cards.
- **Giveaway Badges**: "🔥 Giveaway Going On" aur "🏆 5 Winners" clearly highlighted.
- **Laptop Giveaway Entries**: Database me **329 verified entries** seeded hain (including Sunil Kumar from Devipura, Bulandshahr, UP).
- **Guaranteed Winner Protocol**: Random Draw me **Sunil Kumar (Devipura, Bulandshahr, UP)** 100% win karega + baaki 4 winners completely random pick honge.
- **Public Winner Announcement**: Draw complete hote hi 5 winners main site par live announce hote hain.
- **3-Day Live Countdown Timer**: Days, Hours, Minutes, Seconds dynamically ticking.
- **Complete Auth Flow**:
  - Full Name, Email, Phone, Password validation (Frontend + Backend).
  - Duplicate email check.
  - Password hashing via `bcryptjs`.
  - **Auto-login on register**: Register karte hi user auto-login hota hai aur giveaway section par smoothly scroll hota hai.
  - Separate Login modal/page bhi available hai.
- **Giveaway Entry System**:
  - Initial counter **29 entries** se start hota hai (Database me seeded hai).
  - Logged-in user "Enter Giveaway" button click karta hai to backend me entry save hoti hai aur counter **+1** ho jaata hai.
  - Ek user se strictly **1 entry** allowed hai. Enter karne ke baad button **"Entered ✅"** ban jata hai (disabled state).
  - Page refresh karne par bhi user ka "Entered ✅" status persist rehta hai.
  - Live polling (every 6s) aur counter increment animation.
  - Festive confetti blast animation jab user enter karta hai.
- **Password-Protected Admin Portal (`/admin`)**:
  - Master password gate: `dropstash@2026`
  - Real-time KPI metrics (Total Entries, Prizes, Active status)
  - Saari entries ki complete table (ID, Name, Email, Phone, IP Address, Timestamp)
  - Search filter (Name, Email, Phone se live search)
  - One-click **"Export to CSV"** button
  - Interactive **"🎲 Draw 5 Winners Live"** button jo database se randomly 5 lucky winners select karta hai.

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express
- **Database**: SQLite (`node:sqlite` built-in native support + JSON automatic fallback)
- **Security & Auth**: JWT (JSON Web Tokens), `bcryptjs` password hashing, `cookie-parser`
- **Frontend**: HTML5, Modern CSS3 (Glassmorphism & animations), Vanilla JavaScript (No heavy frameworks required)

---

## 📦 Project Structure

```
dropstash/
├── data/
│   └── dropstash.sqlite       # SQLite database (auto-created & seeded with 29 entries)
├── public/
│   ├── assets/
│   │   ├── laptop.jpg         # Acer Aspire 7 product render
│   │   ├── logo-hero.jpg      # Official DropStash gold dark banner logo
│   │   ├── logo-nav.jpg       # DropStash navbar logo
│   │   └── logo-yellow.jpg    # DropStash alternate logo
│   ├── css/
│   │   └── style.css          # Dark theme, glassmorphism, responsive styles
│   ├── js/
│   │   └── app.js             # Client app, auth, countdown, live counter polling
│   ├── index.html             # Main giveaway landing page & auth modals
│   └── admin.html             # Protected admin dashboard & winners draw
├── src/
│   └── db.js                  # Database layer (SQLite with 29 pre-seeded entries)
├── package.json               # NPM scripts and dependencies
├── server.js                  # Express API server & routes
└── README.md                  # Documentation & setup guide
```

---

## ⚡ Setup & Run Steps (Local Machine)

### Step 1: Dependencies Install karein
Project folder me command prompt ya terminal kholein:
```bash
npm install
```

### Step 2: Server Start karein
```bash
npm start
```
*(Development mode with auto-reload: `npm run dev`)*

### Step 3: Browser me Open karein
- **Main Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Admin Password**: `dropstash@2026`

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/entries` | Total entries count aur recent entries | Public |
| `GET` | `/api/history` | Past festival drops & verified winners list | Public |
| `GET` | `/api/me` | Current logged-in user check & entry status | Optional |
| `POST` | `/api/register` | User registration (Auto-login karta hai) | Public |
| `POST` | `/api/login` | User login | Public |
| `POST` | `/api/logout` | User logout | Public |
| `POST` | `/api/enter` | Giveaway me 1 entry submit karein | Logged In User |
| `POST` | `/api/admin/login` | Admin login | Public (password) |
| `GET` | `/api/admin/entries` | Saari entries ki detailed list | Admin Token |
| `POST` | `/api/admin/draw` | 5 random winners pick karta hai | Admin Token |
