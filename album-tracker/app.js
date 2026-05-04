// frontend/app.js

// Publication to CSS class mapping for source badges
const PUBLICATION_CLASS_MAP = {
  'NPR': 'source-badge-npr',
  'Rolling Stone': 'source-badge-rolling-stone',
  'Rolling Stone (Top 50)': 'source-badge-rolling-stone',
  'Pitchfork': 'source-badge-pitchfork',
  'Beehype': 'source-badge-beehype'
};

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
  const { data: authListener } = auth.onAuthStateChange((event, session) => {
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
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('auth-message');

    if (!email || !password) {
      messageEl.textContent = 'Please enter email and password';
      messageEl.className = 'auth-message error';
      return;
    }

    try {
      messageEl.textContent = 'Signing in...';
      messageEl.className = 'auth-message';
      await auth.signIn(email, password);
      messageEl.textContent = '';
    } catch (error) {
      console.error('Sign in error:', error);
      messageEl.textContent = error.message || 'Failed to sign in. Please try again.';
      messageEl.className = 'auth-message error';
    }
  });

  // Sign up button
  document.getElementById('sign-up-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('auth-message');

    if (!email || !password) {
      messageEl.textContent = 'Please enter email and password';
      messageEl.className = 'auth-message error';
      return;
    }

    if (password.length < 6) {
      messageEl.textContent = 'Password must be at least 6 characters';
      messageEl.className = 'auth-message error';
      return;
    }

    try {
      messageEl.textContent = 'Creating account...';
      messageEl.className = 'auth-message';
      await auth.signUp(email, password);
      messageEl.textContent = 'Account created! Check your email to verify, then sign in.';
      messageEl.className = 'auth-message success';
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
    } catch (error) {
      console.error('Sign up error:', error);
      messageEl.textContent = error.message || 'Failed to create account. Please try again.';
      messageEl.className = 'auth-message error';
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

  // Request new album
  document.getElementById('request-new-album-btn').addEventListener('click', requestNewAlbum);
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

// Dashboard rendering
function renderDashboard() {
  renderTodaysAlbum();
  renderStats();
}

function renderTodaysAlbum() {
  const content = document.getElementById('todays-album-content');
  const requestBtn = document.getElementById('request-new-album-btn');
  if (!content) return;

  if (!todaysPick) {
    content.innerHTML = '<p>No album picked yet. Check back tomorrow or rate albums from "My Albums".</p>';
    if (requestBtn) requestBtn.classList.add('hidden');
    return;
  }

  const album = todaysPick.album;
  const isRated = myRatings.some(r => r.album_id === album.id);

  // Clear first
  content.innerHTML = '';

  // Create title
  const h4 = document.createElement('h4');
  h4.textContent = `${album.artist} - ${album.album}`;
  content.appendChild(h4);

  // Add year if present
  if (album.year) {
    const yearP = document.createElement('p');
    yearP.textContent = `Year: ${album.year}`;
    content.appendChild(yearP);
  }

  // Add source badges
  const badges = renderSourceBadges(album.sources);
  if (badges) {
    content.appendChild(badges);
  }

  // Add rating badge or button
  if (isRated) {
    const badge = document.createElement('p');
    badge.className = 'rated-badge';
    badge.textContent = '✓ Already rated';
    content.appendChild(badge);

    // Show "Request New Album" button
    if (requestBtn) requestBtn.classList.remove('hidden');
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = 'Rate This Album';
    btn.addEventListener('click', () => openRateModal(album.id));
    content.appendChild(btn);

    // Hide "Request New Album" button
    if (requestBtn) requestBtn.classList.add('hidden');
  }
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
  const info = document.getElementById('rate-album-info');
  if (!info) return;

  info.innerHTML = '';

  const h3 = document.createElement('h3');
  h3.textContent = album.artist;
  info.appendChild(h3);

  const h4 = document.createElement('h4');
  h4.textContent = album.album;
  info.appendChild(h4);

  if (album.year) {
    const yearP = document.createElement('p');
    yearP.textContent = `Year: ${album.year}`;
    info.appendChild(yearP);
  }

  // Reset form
  const reviewText = document.getElementById('review-text');
  if (reviewText) {
    reviewText.value = '';
  }

  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  const selectedRatingEl = document.getElementById('selected-rating');
  if (selectedRatingEl) {
    selectedRatingEl.textContent = '';
  }

  // Show modal
  const modal = document.getElementById('rate-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
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

  // Disable submit button during async operation
  const submitBtn = document.getElementById('submit-rating-btn');
  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const review = document.getElementById('review-text').value.trim() || null;

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
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Rating';
  }
}

function renderSourceBadges(sources) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'source-badges';

  sources.forEach(source => {
    const publicationClass = PUBLICATION_CLASS_MAP[source.publication] || 'source-badge-default';
    const label = source.rank ? `${source.publication} #${source.rank}` : source.publication;

    const badge = source.list_url
      ? document.createElement('a')
      : document.createElement('span');

    badge.className = `source-badge ${publicationClass}`;

    if (source.list_url) {
      badge.href = source.list_url;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.classList.add('source-badge-link');
    }

    badge.textContent = label;
    container.appendChild(badge);
  });

  return container;
}

// Make openRateModal global for onclick handlers
window.openRateModal = openRateModal;

// Albums view rendering
function renderAlbumsView() {
  renderUnlistenedAlbums();
  renderRatedAlbums();
  renderFavorites();
  renderLeastFavorites();
}

function renderUnlistenedAlbums() {
  const tbody = document.getElementById('unlistened-tbody');
  if (!tbody) return;

  // Get albums that haven't been rated
  const ratedAlbumIds = new Set(myRatings.map(r => r.album_id));
  const unlistened = allAlbums.filter(album => !ratedAlbumIds.has(album.id));

  // Clear existing content
  tbody.innerHTML = '';

  if (unlistened.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No unlistened albums. You\'ve rated them all!';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  unlistened.forEach(album => {
    const tr = document.createElement('tr');

    const artistTd = document.createElement('td');
    artistTd.textContent = album.artist;
    tr.appendChild(artistTd);

    const albumTd = document.createElement('td');
    albumTd.textContent = album.album;
    tr.appendChild(albumTd);

    const yearTd = document.createElement('td');
    yearTd.textContent = album.year || '-';
    tr.appendChild(yearTd);

    const actionTd = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Rate';
    btn.addEventListener('click', () => openRateModal(album.id));
    actionTd.appendChild(btn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
}

function renderRatedAlbums() {
  const tbody = document.getElementById('rated-tbody');
  if (!tbody) return;

  // Clear existing content
  tbody.innerHTML = '';

  if (myRatings.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No rated albums yet.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  myRatings.forEach(rating => {
    const tr = document.createElement('tr');

    const artistTd = document.createElement('td');
    artistTd.textContent = rating.album.artist;
    tr.appendChild(artistTd);

    const albumTd = document.createElement('td');
    albumTd.textContent = rating.album.album;
    tr.appendChild(albumTd);

    const ratingTd = document.createElement('td');
    ratingTd.textContent = `${rating.rating}/10`;
    tr.appendChild(ratingTd);

    const dateTd = document.createElement('td');
    dateTd.textContent = new Date(rating.rated_at).toLocaleDateString();
    tr.appendChild(dateTd);

    tbody.appendChild(tr);
  });
}

function renderFavorites() {
  const tbody = document.getElementById('favorites-tbody');
  if (!tbody) return;

  const favorites = myRatings.filter(r => r.rating >= 8);

  // Clear existing content
  tbody.innerHTML = '';

  if (favorites.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No favorites yet (8-10 stars).';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  favorites.forEach(rating => {
    const tr = document.createElement('tr');

    const artistTd = document.createElement('td');
    artistTd.textContent = rating.album.artist;
    tr.appendChild(artistTd);

    const albumTd = document.createElement('td');
    albumTd.textContent = rating.album.album;
    tr.appendChild(albumTd);

    const ratingTd = document.createElement('td');
    ratingTd.textContent = `${rating.rating}/10`;
    tr.appendChild(ratingTd);

    const reviewTd = document.createElement('td');
    reviewTd.textContent = rating.review || '-';
    tr.appendChild(reviewTd);

    tbody.appendChild(tr);
  });
}

function renderLeastFavorites() {
  const tbody = document.getElementById('least-favorites-tbody');
  if (!tbody) return;

  const leastFavorites = myRatings.filter(r => r.rating <= 3);

  // Clear existing content
  tbody.innerHTML = '';

  if (leastFavorites.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No least favorites yet (1-3 stars).';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  leastFavorites.forEach(rating => {
    const tr = document.createElement('tr');

    const artistTd = document.createElement('td');
    artistTd.textContent = rating.album.artist;
    tr.appendChild(artistTd);

    const albumTd = document.createElement('td');
    albumTd.textContent = rating.album.album;
    tr.appendChild(albumTd);

    const ratingTd = document.createElement('td');
    ratingTd.textContent = `${rating.rating}/10`;
    tr.appendChild(ratingTd);

    const reviewTd = document.createElement('td');
    reviewTd.textContent = rating.review || '-';
    tr.appendChild(reviewTd);

    tbody.appendChild(tr);
  });
}

// Request new album
async function requestNewAlbum() {
  const btn = document.getElementById('request-new-album-btn');
  if (!btn) return;

  // Disable button and show loading state
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Loading...';

  try {
    // Call the edge function
    const session = await auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/request-new-album`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request new album');
    }

    const data = await response.json();

    // Reload today's pick
    todaysPick = await db.getTodaysPick();

    // Re-render dashboard
    renderDashboard();

    // Show success message
    alert(`New album picked: ${data.album.artist} - ${data.album.album}`);

  } catch (error) {
    console.error('Failed to request new album:', error);
    alert(error.message || 'Failed to request new album. Please try again.');

    // Re-enable button
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
