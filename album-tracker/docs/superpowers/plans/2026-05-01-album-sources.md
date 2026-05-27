# Album Source Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display color-coded source badges on the dashboard's "Today's Album" card showing which publications featured the album and their rankings, with clickable links where available.

**Architecture:** Extend the existing `renderTodaysAlbum()` function in frontend/app.js with a new helper function `renderSourceBadges()` that creates DOM elements from the album's sources JSONB array. No backend or database changes required.

**Tech Stack:** Vanilla JavaScript, DOM manipulation

---

## File Structure

**Files to modify:**
- `frontend/app.js` - Add publication color constants, `renderSourceBadges()` helper function, and integrate into `renderTodaysAlbum()`

**No new files required.**

---

### Task 1: Add Publication Color Constants

**Files:**
- Modify: `frontend/app.js:1-10` (top of file, after initial comments)

- [ ] **Step 1: Add color mapping constants**

Add these constants at the top of `frontend/app.js`, after the initial comment and before the `// State` comment:

```javascript
// frontend/app.js

// Publication color scheme for source badges
const PUBLICATION_COLORS = {
  'NPR': { bg: '#e3f2fd', color: '#1976d2' },
  'Rolling Stone': { bg: '#f3e5f5', color: '#7b1fa2' },
  'Rolling Stone (Top 50)': { bg: '#f3e5f5', color: '#7b1fa2' },
  'Pitchfork': { bg: '#e8f5e9', color: '#388e3c' },
  'Beehype': { bg: '#fff3e0', color: '#f57c00' }
};

const DEFAULT_PUBLICATION_COLOR = { bg: '#f5f5f5', color: '#616161' };

// State
let currentUser = null;
```

- [ ] **Step 2: Verify syntax**

Run: `open frontend/index.html` in browser and check console for errors
Expected: No JavaScript errors in console

- [ ] **Step 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: add publication color constants for source badges

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Implement renderSourceBadges Function

**Files:**
- Modify: `frontend/app.js` (add new function after `openRateModal`, before `window.openRateModal = openRateModal`)

- [ ] **Step 1: Add renderSourceBadges function**

Add this function in `frontend/app.js` after the `openRateModal()` function (around line 324) and before the `window.openRateModal = openRateModal;` line:

```javascript
function renderSourceBadges(sources) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '0.5rem';
  container.style.flexWrap = 'wrap';
  container.style.marginBottom = '1rem';

  sources.forEach(source => {
    const colors = PUBLICATION_COLORS[source.publication] || DEFAULT_PUBLICATION_COLOR;
    const label = source.rank ? `${source.publication} #${source.rank}` : source.publication;
    
    const badge = source.list_url 
      ? document.createElement('a')
      : document.createElement('span');
    
    if (source.list_url) {
      badge.href = source.list_url;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.style.textDecoration = 'none';
      badge.style.border = '1px solid transparent';
      badge.style.transition = 'border-color 0.2s';
      
      badge.addEventListener('mouseenter', () => {
        badge.style.borderColor = colors.color;
      });
      badge.addEventListener('mouseleave', () => {
        badge.style.borderColor = 'transparent';
      });
    }
    
    badge.textContent = label;
    badge.style.display = 'inline-block';
    badge.style.padding = '0.25rem 0.5rem';
    badge.style.background = colors.bg;
    badge.style.color = colors.color;
    badge.style.borderRadius = '4px';
    badge.style.fontSize = '0.85rem';
    
    container.appendChild(badge);
  });

  return container;
}
```

- [ ] **Step 2: Verify syntax**

Run: `open frontend/index.html` in browser and check console for errors
Expected: No JavaScript errors in console

- [ ] **Step 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: add renderSourceBadges helper function

Renders color-coded badges for album sources with clickable links
when list_url is present.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Integrate Source Badges into Dashboard

**Files:**
- Modify: `frontend/app.js:212-260` (renderTodaysAlbum function)

- [ ] **Step 1: Add source badges to renderTodaysAlbum**

Modify the `renderTodaysAlbum()` function to include source badges. Find the section where the year is added (around line 235-239) and add the badge rendering after it:

```javascript
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
```

- [ ] **Step 2: Test with authenticated user**

Run: `open frontend/index.html` in browser
Steps:
1. Sign in with your test account
2. Navigate to Dashboard
3. Verify "Today's Album" card shows source badges below the year
4. Verify badges are color-coded (NPR = blue, Rolling Stone = purple, etc.)
5. Hover over badges to verify border appears on hover
6. Click badge to verify it opens the source URL in new tab

Expected: Source badges display correctly with proper colors and links

- [ ] **Step 3: Test edge cases**

Test these scenarios:
1. Album with no sources - badges should not appear
2. Album with source but no rank - badge shows publication name only
3. Album with source but no list_url - badge is non-clickable span
4. Album with multiple sources - badges wrap to multiple lines on narrow screens

Expected: All edge cases handled gracefully

- [ ] **Step 4: Commit**

```bash
git add frontend/app.js
git commit -m "feat: display source badges on Today's Album card

Integrates renderSourceBadges into dashboard to show publication
sources with rankings and clickable links.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Final Testing and Verification

**Files:**
- No file changes

- [ ] **Step 1: Full end-to-end test**

Run: `open frontend/index.html` in browser
Test checklist:
1. Sign in to the app
2. Navigate to Dashboard
3. Verify "Today's Album" shows source badges
4. Verify badge colors match publications:
   - NPR badges are blue
   - Rolling Stone badges are purple
   - Pitchfork badges are green
   - Beehype badges are orange
   - Unknown publications are gray
5. Verify hover state shows border
6. Click multiple badge links and verify they open correct URLs in new tabs
7. Verify badges display rank numbers correctly (e.g., "NPR #10")
8. Verify responsive wrapping on narrow screen (resize browser)
9. Request new album and verify badges update correctly
10. Navigate to "My Albums" and verify badges only appear on Dashboard

Expected: All features working as specified

- [ ] **Step 2: Browser console check**

With Dashboard open, check browser console for:
- No JavaScript errors
- No warnings
- No network errors

Expected: Clean console with no errors

- [ ] **Step 3: Cross-browser verification (optional)**

Test in different browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Expected: Consistent appearance and behavior across browsers

- [ ] **Step 4: Document completion**

All tasks complete. Feature is ready for use.

---

## Testing Summary

**Manual Test Cases:**

1. **Happy path:** Album with multiple sources, all with ranks and URLs
   - Verify badges display with correct colors
   - Verify badges are clickable and open correct URLs
   - Verify hover effects work

2. **No sources:** Album with empty or null sources array
   - Verify no badges appear
   - Verify no errors in console

3. **Partial data:** Album with sources missing rank or list_url
   - Verify badge shows publication name only (no rank)
   - Verify badge is non-clickable span when URL missing

4. **Unknown publication:** Album with source not in color map
   - Verify badge uses default gray color
   - Verify badge still functions correctly

5. **Responsive layout:** Album with many sources on narrow screen
   - Verify badges wrap to multiple lines
   - Verify spacing remains consistent

**Edge Cases Covered:**
- Null/undefined sources
- Empty sources array
- Missing rank field
- Missing list_url field
- Unknown publication names
- Multiple sources
- Responsive wrapping

---

## Implementation Notes

**No tests written because:**
- This is a frontend-only feature using vanilla JavaScript and DOM manipulation
- The codebase has no existing test framework for frontend code
- Manual testing in browser is the established testing approach for this project
- Adding a test framework (Jest, Playwright, etc.) would be out of scope for this feature

**Accessibility considerations:**
- Links use proper `rel="noopener noreferrer"` for security
- Badge text provides clear context (publication name + rank)
- Color is not the only indicator (text labels present)
- Interactive elements have visible hover states

**Browser compatibility:**
- Uses standard DOM APIs (createElement, style properties, addEventListener)
- CSS values (rem, flex, border-radius) have wide browser support
- No polyfills required for modern browsers

**Performance:**
- Minimal performance impact (creates ~2-4 DOM elements per page load)
- No API calls or heavy computation
- Hover effects use CSS transitions for smooth animation
