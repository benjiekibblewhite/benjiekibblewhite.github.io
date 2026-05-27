# Album Tracker App Design

**Date:** 2026-04-27  
**Purpose:** Daily album listening tracker with ratings, reviews, and email notifications

## Overview

A personal album tracking application inspired by 1001albumsgenerator.com. Each day at 8 AM, the system picks a random unlistened album and sends an email notification. User can rate albums (1-10 stars) with optional text reviews and view their listening history.

## Architecture

### High-Level Components

1. **Static Frontend** - Single-page vanilla JavaScript application
2. **Supabase Backend** - Database, authentication, and Edge Functions
3. **Email Service** - Resend API for daily notifications

### Technology Stack

**Frontend:**
- Vanilla JavaScript (no framework/build step)
- Supabase JS Client Library (CDN)
- HTML/CSS (static files)

**Backend:**
- Supabase PostgreSQL database
- Supabase Auth (Google OAuth only)
- Supabase Edge Functions (Deno/TypeScript)
- Resend API for email

**Hosting:**
- Frontend: User's existing GitHub Pages site (or any static host)
- Backend: Supabase (free tier)

## Database Schema

### Table: `albums`

Stores the 350 albums imported from albums.json.

```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist TEXT NOT NULL,
  album TEXT NOT NULL,
  year INTEGER,
  genre TEXT,
  cover_url TEXT,
  sources JSONB NOT NULL, -- Array of {publication, rank, blurb, list_url}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policy:** Public read access (all users can see all albums)

### Table: `ratings`

User ratings and reviews for albums.

```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  rated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, album_id)
);
```

**RLS Policies:**
- Users can only SELECT/INSERT/UPDATE their own ratings (WHERE user_id = auth.uid())
- Users cannot DELETE ratings (preserve history)

### Table: `daily_picks`

Tracks which album was picked for each user on each day.

```sql
CREATE TABLE daily_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE
);
```

**RLS Policy:** Users can only SELECT their own daily picks

**Indexes:**
- `(user_id, picked_at DESC)` for fetching latest pick
- `(user_id, album_id)` for checking if album was recently picked

## Authentication

**Google OAuth Only:**
- Supabase Auth handles OAuth flow
- No email/password authentication
- No user registration required (auth happens on first Google sign-in)

**Frontend Auth Flow:**
1. User clicks "Sign in with Google"
2. Supabase redirects to Google OAuth
3. After approval, user redirected back to app
4. Supabase session stored in localStorage
5. Frontend checks session on load

## Frontend Structure

### File Organization

```
/
├── index.html          # Main page with all views
├── app.js              # Main application logic
├── supabase-client.js  # Supabase connection and helpers
├── styles.css          # All styling
└── config.js           # Supabase URL/key (public anon key)
```

### Pages/Views

All views contained in single HTML page with conditional rendering:

**1. Login View**
- Google sign-in button
- Shown when user not authenticated

**2. Home/Dashboard View**
- Shows today's album of the day (if picked)
- Quick stats: total rated, total remaining, average rating
- "Rate Album" button for today's album

**3. Rate Album View**
- Album details (artist, album, year, sources)
- Star selector (1-10 whole numbers)
- Optional text review textarea
- Submit button

**4. My Albums View**

Four tabs:

- **Unlistened:** Simple table of albums not yet rated (artist, album, year)
- **Rated:** Table with rating column, sortable by rating or date rated
- **Favorites:** Auto-filtered rated albums with rating >= 8
- **Least Favorites:** Auto-filtered rated albums with rating <= 3

### State Management

Simple JavaScript object for application state:
- `currentUser` - Supabase user object
- `todaysPick` - Today's album (if exists)
- `albums` - Array of all albums
- `ratings` - Array of user's ratings
- `currentView` - Which view is active

No complex state management library needed.

## Edge Function: Daily Album Picker

### Function Name
`daily-album-picker`

### Scheduling
Runs daily at 8:00 AM UTC via Supabase cron job

### Logic Flow

```typescript
1. Fetch all users from auth.users
2. For each user:
   a. Get albums user has NOT rated (LEFT JOIN with ratings)
   b. Exclude albums picked in last 7 days (to avoid recent repeats)
   c. If pool is empty:
      - Send "congratulations, you've rated everything!" email
      - Continue to next user
   d. Pick random album from pool
   e. Insert into daily_picks table
   f. Send email via Resend API
   g. Mark email_sent = true
3. Log summary (users processed, emails sent, errors)
```

### Email Content

**Subject:** Your Album of the Day

**Body (plain text):**
```
Today's album: [Album Name]
Artist: [Artist Name]
Year: [Year if available]

Listen and rate it when you're ready!

[Link to app]
```

### Resend API Integration

- API key stored in Supabase Edge Function secrets
- Sender email: configured in Resend (must be verified domain or use Resend's test domain)
- Recipient: User's email from auth.users.email

**API Request:**
```typescript
POST https://api.resend.com/emails
Headers:
  Authorization: Bearer [API_KEY]
  Content-Type: application/json
Body:
  {
    "from": "Album Tracker <albums@yourdomain.com>",
    "to": [user.email],
    "subject": "Your Album of the Day",
    "text": "[email body]"
  }
```

### Error Handling

- Log errors to Supabase Edge Function logs
- Continue processing other users if one fails
- Don't retry failed emails (will pick again tomorrow)
- If Resend API fails, mark email_sent = false

## Data Import

### One-Time Setup

Import albums.json into Supabase database:

**Method:** SQL script or Supabase Studio import

**Script:**
```sql
-- Read albums.json and insert
INSERT INTO albums (artist, album, year, genre, cover_url, sources)
VALUES
  ('Carole King', 'Tapestry', 1971, NULL, NULL, '[{"publication":"NPR","rank":10,"blurb":"","list_url":"..."}]'::jsonb),
  -- ... repeat for all 350 albums
```

**Alternative:** Use Supabase Studio's CSV import feature (convert JSON to CSV first)

## User Flows

### First-Time User Flow

1. User visits app
2. Sees login screen
3. Clicks "Sign in with Google"
4. Supabase redirects to Google OAuth
5. User approves permissions
6. Redirected back to app (now authenticated)
7. Sees dashboard (no album picked yet, shows "Check back tomorrow")
8. Can browse unlistened albums

### Daily Flow

1. 8 AM: Edge Function runs, picks album, sends email
2. User receives email notification
3. User listens to album throughout the day
4. User opens app
5. Sees today's album on dashboard
6. Clicks "Rate Album"
7. Selects rating (1-10) and optionally writes review
8. Clicks Submit
9. Album marked as rated
10. Returns to dashboard

### Viewing Albums Flow

1. User clicks "My Albums"
2. Sees four tabs
3. Clicks between tabs to view:
   - Unlistened: All albums not yet rated
   - Rated: All rated albums with ratings
   - Favorites: Rated albums 8-10
   - Least Favorites: Rated albums 1-3
4. Can sort rated albums by rating or date

## Edge Cases & Constraints

### What if user has rated all albums?
- Edge Function detects empty pool
- Sends congratulations email instead
- No new daily pick created
- Dashboard shows completion message

### What if user doesn't rate today's album?
- No action taken
- Tomorrow, new album is picked (old one goes back to unlistened pool)
- User can still rate old albums from "Unlistened" tab

### What if Edge Function fails?
- Error logged to Supabase logs
- Will retry next day
- User doesn't receive email that day

### Can user rate albums out of order?
- Yes, "Unlistened" tab shows all albums
- User can click any album to rate it
- Daily email is just a suggestion

### Database cleanup
- No cleanup needed
- Keep all daily_picks for history
- Keep all ratings forever

## Success Criteria

1. User can log in with Google
2. User receives daily album email at 8 AM
3. User can rate albums (1-10) with optional review
4. User can view unlistened, rated, favorites, and least favorites
5. Frontend is deployable as static files
6. All functionality works within Supabase free tier

## Free Tier Constraints

**Supabase Free Tier:**
- Database: 500 MB (plenty for 350 albums + ratings)
- Auth: Unlimited users
- Edge Functions: 500,000 invocations/month (30/month for daily cron = safe)

**Resend Free Tier:**
- 3,000 emails/month (30/month for daily emails = safe)
- 100 emails/day (only sending 1/day = safe)

**GitHub Pages:**
- Free for public repos
- Static files only (perfect fit)

## Future Enhancements (Out of Scope)

These are explicitly NOT part of the initial design:

- Multiple users (designed for single user but schema supports it)
- Social features (sharing ratings)
- Album cover image fetching
- Spotify/Apple Music integration
- Mobile app
- Advanced filtering/search
- Export ratings to CSV
- Album recommendations based on ratings
