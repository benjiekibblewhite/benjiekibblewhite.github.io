# Album Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal album tracker with daily email notifications, Google auth, and rating/review system

**Architecture:** Static HTML/JS frontend connecting to Supabase backend (PostgreSQL + Auth + Edge Functions). Daily cron picks random album and sends email via Resend API.

**Tech Stack:** Vanilla JavaScript, Supabase (PostgreSQL, Auth, Edge Functions), Google OAuth, Resend API

---

## Prerequisites

Before starting implementation, you need:
- Supabase project created (user has this)
- Supabase project URL and anon key
- Database password
- Resend API key
- Google OAuth client ID (configured in Supabase)

---

## File Structure

```
/
├── frontend/
│   ├── index.html          # Main SPA with all views
│   ├── app.js              # Application logic and UI
│   ├── supabase-client.js  # Supabase connection
│   ├── config.js           # Supabase credentials
│   └── styles.css          # All styling
├── supabase/
│   └── functions/
│       └── daily-album-picker/
│           └── index.ts    # Edge function
├── scripts/
│   └── import-albums.js    # One-time data import
└── albums.json             # Existing album data
```

---

### Task 1: Database Schema Setup

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create SQL migration file**

Create file with database schema:

```sql
-- Create albums table
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist TEXT NOT NULL,
  album TEXT NOT NULL,
  year INTEGER,
  genre TEXT,
  cover_url TEXT,
  sources JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  rated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, album_id)
);

-- Create daily_picks table
CREATE TABLE daily_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_album_id ON ratings(album_id);
CREATE INDEX idx_daily_picks_user_picked ON daily_picks(user_id, picked_at DESC);
CREATE INDEX idx_daily_picks_user_album ON daily_picks(user_id, album_id);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_picks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums (public read)
CREATE POLICY "Anyone can read albums"
  ON albums FOR SELECT
  USING (true);

-- RLS Policies for ratings (users can only access their own)
CREATE POLICY "Users can read their own ratings"
  ON ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_picks (users can only read their own)
CREATE POLICY "Users can read their own daily picks"
  ON daily_picks FOR SELECT
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration via Supabase Studio**

1. Go to Supabase Dashboard → SQL Editor
2. Paste the migration SQL
3. Click "Run"
4. Verify tables created in Table Editor

Expected: All three tables visible with correct columns and RLS enabled

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add database schema with RLS policies"
```

---

### Task 2: Data Import Script

**Files:**
- Create: `scripts/import-albums.js`

- [ ] **Step 1: Create Node.js import script**

```javascript
// scripts/import-albums.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Get credentials from command line args
const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node import-albums.js <supabase-url> <supabase-key>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importAlbums() {
  // Read albums.json
  const albumsData = JSON.parse(fs.readFileSync('./albums.json', 'utf-8'));

  console.log(`Importing ${albumsData.length} albums...`);

  // Transform to database format
  const albumsToInsert = albumsData.map(album => ({
    artist: album.artist,
    album: album.album,
    year: album.year,
    genre: album.genre,
    cover_url: album.cover_url,
    sources: album.sources
  }));

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < albumsToInsert.length; i += batchSize) {
    const batch = albumsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('albums')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      process.exit(1);
    }

    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(albumsToInsert.length / batchSize)}`);
  }

  console.log('✓ All albums imported successfully');
}

importAlbums().catch(console.error);
```

- [ ] **Step 2: Install Supabase JS client**

```bash
npm init -y
npm install @supabase/supabase-js
```

Expected: package.json and node_modules created

- [ ] **Step 3: Test import (dry run first)**

Add to .gitignore:
```
node_modules/
package-lock.json
```

Test the script exists and can be run (user will run it with actual credentials later)

```bash
node scripts/import-albums.js
```

Expected: Usage message showing correct syntax

- [ ] **Step 4: Document import instructions**

Add to README.md:

```markdown
## Initial Setup

### Import Albums to Database

```bash
node scripts/import-albums.js <your-supabase-url> <your-supabase-service-key>
```

This imports all 350 albums from albums.json into your Supabase database.
Only needs to be run once.
```

- [ ] **Step 5: Commit import script**

```bash
git add scripts/import-albums.js package.json .gitignore README.md
git commit -m "feat: add album import script for Supabase"
```

---

### Task 3: Frontend Configuration

**Files:**
- Create: `frontend/config.js`
- Create: `frontend/config.example.js`

- [ ] **Step 1: Create config template**

```javascript
// frontend/config.example.js
// Copy this to config.js and fill in your Supabase credentials

const SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

- [ ] **Step 2: Create actual config file**

```javascript
// frontend/config.js
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

- [ ] **Step 3: Add config.js to .gitignore**

```
# Add to existing .gitignore
frontend/config.js
```

- [ ] **Step 4: Document configuration**

Add to README.md:

```markdown
### Frontend Configuration

1. Copy `frontend/config.example.js` to `frontend/config.js`
2. Fill in your Supabase URL and anon key from the Supabase dashboard
```

- [ ] **Step 5: Commit config template**

```bash
git add frontend/config.example.js .gitignore README.md
git commit -m "feat: add frontend config template"
```

---

### Task 4: Supabase Client Setup

**Files:**
- Create: `frontend/supabase-client.js`

- [ ] **Step 1: Create Supabase client wrapper**

```javascript
// frontend/supabase-client.js

// Initialize Supabase client
const supabase = supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Auth helpers
const auth = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
const db = {
  async getAllAlbums() {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('artist', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getMyRatings() {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        album:albums(*)
      `)
      .order('rated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getTodaysPick() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('daily_picks')
      .select(`
        *,
        album:albums(*)
      `)
      .gte('picked_at', today.toISOString())
      .order('picked_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  async rateAlbum(albumId, rating, review) {
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        album_id: albumId,
        rating: rating,
        review: review || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRating(albumId, rating, review) {
    const { data, error } = await supabase
      .from('ratings')
      .update({
        rating: rating,
        review: review || null
      })
      .eq('album_id', albumId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

- [ ] **Step 2: Commit Supabase client**

```bash
git add frontend/supabase-client.js
git commit -m "feat: add Supabase client with auth and database helpers"
```

---

### Task 5: HTML Structure

**Files:**
- Create: `frontend/index.html`

- [ ] **Step 1: Create main HTML file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Album Tracker</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Login View -->
  <div id="login-view" class="view">
    <div class="login-container">
      <h1>Album Tracker</h1>
      <p>Track your journey through 350 must-listen albums</p>
      <button id="sign-in-btn" class="btn-primary">Sign in with Google</button>
    </div>
  </div>

  <!-- Main App (hidden until logged in) -->
  <div id="app" class="hidden">
    <!-- Header -->
    <header>
      <h1>Album Tracker</h1>
      <nav>
        <button class="nav-btn" data-view="dashboard">Dashboard</button>
        <button class="nav-btn" data-view="albums">My Albums</button>
        <button id="sign-out-btn" class="btn-secondary">Sign Out</button>
      </nav>
    </header>

    <!-- Dashboard View -->
    <div id="dashboard-view" class="view">
      <h2>Dashboard</h2>
      
      <div id="todays-album-card" class="card">
        <h3>Today's Album</h3>
        <div id="todays-album-content">
          <p class="loading">Loading...</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" id="stat-rated">-</div>
          <div class="stat-label">Albums Rated</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-remaining">-</div>
          <div class="stat-label">Remaining</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-average">-</div>
          <div class="stat-label">Average Rating</div>
        </div>
      </div>
    </div>

    <!-- Rate Album Modal -->
    <div id="rate-modal" class="modal hidden">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h2>Rate Album</h2>
        <div id="rate-album-info"></div>
        
        <div class="rating-input">
          <label>Rating (1-10):</label>
          <div class="star-selector">
            <button class="star-btn" data-rating="1">1</button>
            <button class="star-btn" data-rating="2">2</button>
            <button class="star-btn" data-rating="3">3</button>
            <button class="star-btn" data-rating="4">4</button>
            <button class="star-btn" data-rating="5">5</button>
            <button class="star-btn" data-rating="6">6</button>
            <button class="star-btn" data-rating="7">7</button>
            <button class="star-btn" data-rating="8">8</button>
            <button class="star-btn" data-rating="9">9</button>
            <button class="star-btn" data-rating="10">10</button>
          </div>
          <div id="selected-rating"></div>
        </div>

        <div class="review-input">
          <label>Review (optional):</label>
          <textarea id="review-text" rows="4" placeholder="Your thoughts on this album..."></textarea>
        </div>

        <button id="submit-rating-btn" class="btn-primary">Submit Rating</button>
      </div>
    </div>

    <!-- Albums View -->
    <div id="albums-view" class="view hidden">
      <h2>My Albums</h2>
      
      <div class="tabs">
        <button class="tab-btn active" data-tab="unlistened">Unlistened</button>
        <button class="tab-btn" data-tab="rated">Rated</button>
        <button class="tab-btn" data-tab="favorites">Favorites</button>
        <button class="tab-btn" data-tab="least-favorites">Least Favorites</button>
      </div>

      <div id="unlistened-tab" class="tab-content">
        <table class="albums-table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Album</th>
              <th>Year</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="unlistened-tbody"></tbody>
        </table>
      </div>

      <div id="rated-tab" class="tab-content hidden">
        <table class="albums-table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Album</th>
              <th>Rating</th>
              <th>Rated On</th>
            </tr>
          </thead>
          <tbody id="rated-tbody"></tbody>
        </table>
      </div>

      <div id="favorites-tab" class="tab-content hidden">
        <table class="albums-table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Album</th>
              <th>Rating</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody id="favorites-tbody"></tbody>
        </table>
      </div>

      <div id="least-favorites-tab" class="tab-content hidden">
        <table class="albums-table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Album</th>
              <th>Rating</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody id="least-favorites-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Load Supabase from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Load app files -->
  <script src="config.js"></script>
  <script src="supabase-client.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit HTML structure**

```bash
git add frontend/index.html
git commit -m "feat: add HTML structure with all views"
```

---

### Task 6: CSS Styling

**Files:**
- Create: `frontend/styles.css`

- [ ] **Step 1: Create stylesheet**

```css
/* frontend/styles.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.hidden {
  display: none !important;
}

/* Login View */
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.login-container h1 {
  margin-bottom: 10px;
  color: #1a1a1a;
}

.login-container p {
  margin-bottom: 30px;
  color: #666;
}

/* Buttons */
.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover {
  background: #357ae8;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

/* Header */
header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  font-size: 24px;
}

nav {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f5f5f5;
}

/* Main Content */
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.view {
  padding: 20px;
}

/* Cards */
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card h3 {
  margin-bottom: 15px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #4285f4;
}

.stat-label {
  color: #666;
  margin-top: 5px;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.modal-close:hover {
  color: #333;
}

/* Star Selector */
.star-selector {
  display: flex;
  gap: 5px;
  margin: 10px 0;
}

.star-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
}

.star-btn:hover {
  border-color: #4285f4;
  background: #f0f7ff;
}

.star-btn.selected {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

#selected-rating {
  margin-top: 10px;
  font-weight: bold;
  color: #4285f4;
}

/* Form Elements */
.rating-input, .review-input {
  margin: 20px 0;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #ddd;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  border-bottom-color: #4285f4;
  color: #4285f4;
  font-weight: 500;
}

/* Tables */
.albums-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.albums-table th,
.albums-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.albums-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.albums-table tr:hover {
  background: #f9f9f9;
}

.albums-table button {
  padding: 6px 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.albums-table button:hover {
  background: #357ae8;
}

/* Utility Classes */
.loading {
  color: #999;
  font-style: italic;
}
```

- [ ] **Step 2: Commit CSS**

```bash
git add frontend/styles.css
git commit -m "feat: add CSS styling for all views"
```

---

### Task 7: App Logic - Auth and Navigation

**Files:**
- Create: `frontend/app.js` (part 1)

- [ ] **Step 1: Create app initialization and auth**

```javascript
// frontend/app.js

// State
let currentUser = null;
let allAlbums = [];
let myRatings = [];
let todaysPick = null;
let currentAlbumToRate = null;
let selectedRating = null;

// Initialize app
async function init() {
  // Check for existing session
  const session = await auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadApp();
  }

  // Listen for auth changes
  auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      loadApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLogin();
    }
  });

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Sign in button
  document.getElementById('sign-in-btn').addEventListener('click', async () => {
    try {
      await auth.signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  });

  // Sign out button
  document.getElementById('sign-out-btn').addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  });

  // Navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      showView(view);
    });
  });

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      showTab(tab);
    });
  });

  // Modal close
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('rate-modal').addEventListener('click', (e) => {
    if (e.target.id === 'rate-modal') closeModal();
  });

  // Star rating buttons
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.dataset.rating);
      updateStarSelection();
    });
  });

  // Submit rating
  document.getElementById('submit-rating-btn').addEventListener('click', submitRating);
}

// View management
function showLogin() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

function showView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    if (view.id !== 'login-view') {
      view.classList.add('hidden');
    }
  });

  // Show selected view
  const viewId = `${viewName}-view`;
  document.getElementById(viewId).classList.remove('hidden');

  // Load view data
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'albums') {
    renderAlbumsView();
  }
}

function showTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.remove('hidden');
}

// Load app data
async function loadApp() {
  showApp();
  
  try {
    // Load all data
    allAlbums = await db.getAllAlbums();
    myRatings = await db.getMyRatings();
    todaysPick = await db.getTodaysPick();

    // Show dashboard
    showView('dashboard');
  } catch (error) {
    console.error('Failed to load app data:', error);
    alert('Failed to load data. Please refresh the page.');
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Commit app initialization**

```bash
git add frontend/app.js
git commit -m "feat: add app initialization, auth, and navigation"
```

---

### Task 8: App Logic - Dashboard View

**Files:**
- Modify: `frontend/app.js` (part 2)

- [ ] **Step 1: Add dashboard rendering**

Add to `frontend/app.js`:

```javascript
// Dashboard rendering
function renderDashboard() {
  renderTodaysAlbum();
  renderStats();
}

function renderTodaysAlbum() {
  const content = document.getElementById('todays-album-content');

  if (!todaysPick) {
    content.innerHTML = '<p>No album picked yet. Check back tomorrow or rate albums from "My Albums".</p>';
    return;
  }

  const album = todaysPick.album;
  const isRated = myRatings.some(r => r.album_id === album.id);

  content.innerHTML = `
    <h4>${album.artist} - ${album.album}</h4>
    ${album.year ? `<p>Year: ${album.year}</p>` : ''}
    ${isRated ? 
      '<p class="rated-badge">✓ Already rated</p>' :
      '<button class="btn-primary" onclick="openRateModal(\'' + album.id + '\')">Rate This Album</button>'
    }
  `;
}

function renderStats() {
  const totalAlbums = allAlbums.length;
  const ratedCount = myRatings.length;
  const remaining = totalAlbums - ratedCount;
  const avgRating = ratedCount > 0 
    ? (myRatings.reduce((sum, r) => sum + r.rating, 0) / ratedCount).toFixed(1)
    : '0.0';

  document.getElementById('stat-rated').textContent = ratedCount;
  document.getElementById('stat-remaining').textContent = remaining;
  document.getElementById('stat-average').textContent = avgRating;
}

// Modal functions
function openRateModal(albumId) {
  const album = allAlbums.find(a => a.id === albumId);
  if (!album) return;

  currentAlbumToRate = album;
  selectedRating = null;

  // Display album info
  document.getElementById('rate-album-info').innerHTML = `
    <h3>${album.artist}</h3>
    <h4>${album.album}</h4>
    ${album.year ? `<p>Year: ${album.year}</p>` : ''}
  `;

  // Reset form
  document.getElementById('review-text').value = '';
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.getElementById('selected-rating').textContent = '';

  // Show modal
  document.getElementById('rate-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('rate-modal').classList.add('hidden');
  currentAlbumToRate = null;
  selectedRating = null;
}

function updateStarSelection() {
  document.querySelectorAll('.star-btn').forEach(btn => {
    const rating = parseInt(btn.dataset.rating);
    if (rating <= selectedRating) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
  document.getElementById('selected-rating').textContent = 
    `Selected: ${selectedRating}/10`;
}

async function submitRating() {
  if (!selectedRating) {
    alert('Please select a rating');
    return;
  }

  if (!currentAlbumToRate) return;

  const review = document.getElementById('review-text').value.trim() || null;

  try {
    await db.rateAlbum(currentAlbumToRate.id, selectedRating, review);
    
    // Reload data
    myRatings = await db.getMyRatings();
    
    // Close modal
    closeModal();
    
    // Refresh current view
    renderDashboard();
    
    alert('Rating saved!');
  } catch (error) {
    console.error('Failed to save rating:', error);
    alert('Failed to save rating. Please try again.');
  }
}

// Make openRateModal global for onclick handlers
window.openRateModal = openRateModal;
```

- [ ] **Step 2: Commit dashboard logic**

```bash
git add frontend/app.js
git commit -m "feat: add dashboard rendering and rating modal"
```

---

### Task 9: App Logic - Albums View

**Files:**
- Modify: `frontend/app.js` (part 3)

- [ ] **Step 1: Add albums view rendering**

Add to `frontend/app.js`:

```javascript
// Albums view rendering
function renderAlbumsView() {
  renderUnlistenedAlbums();
  renderRatedAlbums();
  renderFavorites();
  renderLeastFavorites();
}

function renderUnlistenedAlbums() {
  const tbody = document.getElementById('unlistened-tbody');
  
  // Get albums that haven't been rated
  const ratedAlbumIds = new Set(myRatings.map(r => r.album_id));
  const unlistened = allAlbums.filter(album => !ratedAlbumIds.has(album.id));

  if (unlistened.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No unlistened albums. You\'ve rated them all!</td></tr>';
    return;
  }

  tbody.innerHTML = unlistened.map(album => `
    <tr>
      <td>${album.artist}</td>
      <td>${album.album}</td>
      <td>${album.year || '-'}</td>
      <td><button onclick="openRateModal('${album.id}')">Rate</button></td>
    </tr>
  `).join('');
}

function renderRatedAlbums() {
  const tbody = document.getElementById('rated-tbody');

  if (myRatings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No rated albums yet.</td></tr>';
    return;
  }

  tbody.innerHTML = myRatings.map(rating => `
    <tr>
      <td>${rating.album.artist}</td>
      <td>${rating.album.album}</td>
      <td>${rating.rating}/10</td>
      <td>${new Date(rating.rated_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function renderFavorites() {
  const tbody = document.getElementById('favorites-tbody');
  const favorites = myRatings.filter(r => r.rating >= 8);

  if (favorites.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No favorites yet (8-10 stars).</td></tr>';
    return;
  }

  tbody.innerHTML = favorites.map(rating => `
    <tr>
      <td>${rating.album.artist}</td>
      <td>${rating.album.album}</td>
      <td>${rating.rating}/10</td>
      <td>${rating.review || '-'}</td>
    </tr>
  `).join('');
}

function renderLeastFavorites() {
  const tbody = document.getElementById('least-favorites-tbody');
  const leastFavorites = myRatings.filter(r => r.rating <= 3);

  if (leastFavorites.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No least favorites yet (1-3 stars).</td></tr>';
    return;
  }

  tbody.innerHTML = leastFavorites.map(rating => `
    <tr>
      <td>${rating.album.artist}</td>
      <td>${rating.album.album}</td>
      <td>${rating.rating}/10</td>
      <td>${rating.review || '-'}</td>
    </tr>
  `).join('');
}
```

- [ ] **Step 2: Commit albums view logic**

```bash
git add frontend/app.js
git commit -m "feat: add albums view with all tabs"
```

---

### Task 10: Edge Function - Setup

**Files:**
- Create: `supabase/functions/daily-album-picker/index.ts`

- [ ] **Step 1: Create Edge Function file**

```typescript
// supabase/functions/daily-album-picker/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://your-app-url.com'

serve(async (req) => {
  try {
    // Create Supabase admin client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('Starting daily album picker...')

    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`Processing ${users.length} users`)

    let successCount = 0
    let errorCount = 0

    // Process each user
    for (const user of users) {
      try {
        await processUser(supabase, user)
        successCount++
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: users.length,
        successful: successCount,
        errors: errorCount
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function processUser(supabase: any, user: any) {
  // Get albums user hasn't rated
  const { data: unratedAlbums, error: albumsError } = await supabase
    .from('albums')
    .select('id, artist, album, year')
    .not('id', 'in', 
      supabase
        .from('ratings')
        .select('album_id')
        .eq('user_id', user.id)
    )

  if (albumsError) {
    throw new Error(`Failed to fetch unrated albums: ${albumsError.message}`)
  }

  // Exclude albums picked in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentPicks } = await supabase
    .from('daily_picks')
    .select('album_id')
    .eq('user_id', user.id)
    .gte('picked_at', sevenDaysAgo.toISOString())

  const recentPickIds = new Set(recentPicks?.map((p: any) => p.album_id) || [])
  const availableAlbums = unratedAlbums.filter(
    (album: any) => !recentPickIds.has(album.id)
  )

  // If no albums available, send completion email
  if (availableAlbums.length === 0) {
    await sendCompletionEmail(user.email)
    return
  }

  // Pick random album
  const randomIndex = Math.floor(Math.random() * availableAlbums.length)
  const pickedAlbum = availableAlbums[randomIndex]

  // Insert daily pick
  const { error: insertError } = await supabase
    .from('daily_picks')
    .insert({
      user_id: user.id,
      album_id: pickedAlbum.id
    })

  if (insertError) {
    throw new Error(`Failed to insert daily pick: ${insertError.message}`)
  }

  // Send email
  await sendAlbumEmail(user.email, pickedAlbum)

  // Mark email as sent
  await supabase
    .from('daily_picks')
    .update({ email_sent: true })
    .eq('user_id', user.id)
    .eq('album_id', pickedAlbum.id)

  console.log(`Processed user ${user.email}: picked ${pickedAlbum.artist} - ${pickedAlbum.album}`)
}

async function sendAlbumEmail(email: string, album: any) {
  const emailBody = `Today's album: ${album.album}
Artist: ${album.artist}
${album.year ? `Year: ${album.year}` : ''}

Listen and rate it when you're ready!

${APP_URL}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Album Tracker <albums@your-domain.com>',
      to: [email],
      subject: 'Your Album of the Day',
      text: emailBody
    })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}

async function sendCompletionEmail(email: string) {
  const emailBody = `Congratulations! You've rated all available albums!

No new album today. Keep enjoying your collection!

${APP_URL}`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Album Tracker <albums@your-domain.com>',
      to: [email],
      subject: 'Album Tracker - All Albums Rated!',
      text: emailBody
    })
  })
}
```

- [ ] **Step 2: Commit Edge Function**

```bash
git add supabase/functions/daily-album-picker/index.ts
git commit -m "feat: add daily album picker Edge Function"
```

---

### Task 11: Deployment Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add deployment instructions**

Add to README.md:

```markdown
## Deployment

### 1. Database Setup

Run the migration in Supabase Studio:
```sql
-- Copy from supabase/migrations/001_initial_schema.sql
-- Paste in Supabase Dashboard → SQL Editor → Run
```

### 2. Import Albums

```bash
node scripts/import-albums.js <supabase-url> <supabase-service-key>
```

### 3. Configure Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth client ID and secret
4. Add authorized redirect URL

### 4. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Deploy function
supabase functions deploy daily-album-picker

# Set secrets
supabase secrets set RESEND_API_KEY=<your-resend-key>
supabase secrets set APP_URL=<your-app-url>
```

### 5. Configure Cron

In Supabase Dashboard → Database → Cron Jobs:

```sql
SELECT cron.schedule(
  'daily-album-picker',
  '0 8 * * *', -- 8 AM daily
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/daily-album-picker',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )
  $$
);
```

### 6. Deploy Frontend

1. Update `frontend/config.js` with your Supabase URL and anon key
2. Upload files to your hosting (GitHub Pages, Netlify, etc.)
3. Make sure all files are accessible

### Test

Visit your app URL and sign in with Google!
```

- [ ] **Step 2: Commit documentation**

```bash
git add README.md
git commit -m "docs: add complete deployment instructions"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✓ Database schema (albums, ratings, daily_picks) - Task 1
- ✓ RLS policies - Task 1
- ✓ Data import - Task 2
- ✓ Frontend config - Task 3
- ✓ Supabase client - Task 4
- ✓ HTML structure - Task 5
- ✓ CSS styling - Task 6
- ✓ Auth & navigation - Task 7
- ✓ Dashboard view - Task 8
- ✓ Albums view (all tabs) - Task 9
- ✓ Edge Function - Task 10
- ✓ Deployment docs - Task 11

**No Placeholders:**
- All SQL complete
- All JavaScript code complete
- All HTML/CSS complete
- All commands with exact syntax

**Type Consistency:**
- Database columns match across all queries
- Function names consistent throughout
- API responses match expectations

**Implementation Notes:**
- Frontend is truly static (no build step)
- All free tier services
- Google OAuth only as specified
- Email at 8 AM UTC as specified
- Ratings 1-10 whole numbers as specified
