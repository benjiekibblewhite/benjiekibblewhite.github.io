# Album Source Badges on Dashboard

## Overview

Add visual source badges to the "Today's Album" card on the dashboard, showing which publications featured the album and their rankings. When a source includes a list URL, the badge becomes a clickable link.

## Visual Design

### Badge Styling

- Compact inline badges with publication name and rank (e.g., "NPR #10")
- Color-coded by publication:
  - NPR = blue (`bg: #e3f2fd`, `color: #1976d2`)
  - Rolling Stone = purple (`bg: #f3e5f5`, `color: #7b1fa2`)
  - Pitchfork = green (`bg: #e8f5e9`, `color: #388e3c`)
  - Beehype = orange (`bg: #fff3e0`, `color: #f57c00`)
  - Default for unknown = gray (`bg: #f5f5f5`, `color: #616161`)
- Rounded corners (4px), subtle padding (0.25rem 0.5rem)
- Font size: 0.85rem
- Displayed as a horizontal row with flex-wrap

### Interactive Behavior

- Badges with `list_url` render as `<a>` tags opening in new tab (`target="_blank"`, `rel="noopener noreferrer"`)
- Hover state shows subtle border (1px solid, matching the text color) to indicate clickability
- Badges without URL render as `<span>` with same styling but non-interactive
- No underline on links (text-decoration: none)

### Placement

- Displayed on the "Today's Album" card on the dashboard
- Positioned between the album year and the rating button/badge
- Container uses flexbox with gap and wrap for responsive layout

## Data Flow

### Current State

- `todaysPick.album` already contains the full album object from database
- Album object includes `sources` JSONB field containing array of source objects
- Each source object has: `publication` (string), `rank` (number), `list_url` (string), `blurb` (string)

### Changes Required

- Add helper function `renderSourceBadges(sources)` to create badge elements
- Modify `renderTodaysAlbum()` in `frontend/app.js` to call badge renderer
- No database or API changes required

## Implementation Details

### Publication Color Map

Create a color mapping object in `frontend/app.js`:

```javascript
const PUBLICATION_COLORS = {
  'NPR': { bg: '#e3f2fd', color: '#1976d2' },
  'Rolling Stone': { bg: '#f3e5f5', color: '#7b1fa2' },
  'Rolling Stone (Top 50)': { bg: '#f3e5f5', color: '#7b1fa2' },
  'Pitchfork': { bg: '#e8f5e9', color: '#388e3c' },
  'Beehype': { bg: '#fff3e0', color: '#f57c00' }
};

const DEFAULT_PUBLICATION_COLOR = { bg: '#f5f5f5', color: '#616161' };
```

### Badge Rendering Function

Add new function to `frontend/app.js`:

```javascript
function renderSourceBadges(sources) {
  if (!sources || sources.length === 0) {
    return null; // No badges to render
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
      
      // Hover effects
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

### Modification to renderTodaysAlbum()

Update the `renderTodaysAlbum()` function in `frontend/app.js`:

- After creating and appending the year paragraph
- Before creating the rating badge/button
- Insert the source badges:

```javascript
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
  // ... existing code
}
```

## Files to Modify

- `frontend/app.js` - Add `PUBLICATION_COLORS`, `DEFAULT_PUBLICATION_COLOR`, `renderSourceBadges()` function, and update `renderTodaysAlbum()`

## Out of Scope

- Source display in rating modal
- Source display in "My Albums" tables (Unlistened, Rated, Favorites, Least Favorites)
- Backend or database schema changes
- Styling for publications not in the color map (uses default gray)

## Testing

### Manual Testing Steps

1. Load the dashboard with an authenticated user
2. Verify "Today's Album" shows source badges below the year
3. Verify badge colors match the publication
4. Hover over badges with URLs to verify border appears
5. Click badge links to verify they open source URL in new tab
6. Test with album that has no sources (badges should not appear)
7. Test with album that has sources without URLs (should render as non-clickable spans)
8. Test with album that has multiple sources (should wrap responsively)

### Edge Cases

- Album with empty sources array - should not render badges
- Album with null sources field - should not render badges
- Source with rank = 0 or null - should display publication name only
- Source with unknown publication name - should use default gray color
- Source without list_url - should render as non-interactive span
- Multiple sources - should wrap to multiple lines on narrow screens
