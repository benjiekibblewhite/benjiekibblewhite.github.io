# Album Data Collection

Scrapes album data from multiple music publication "best of" lists and outputs a deduplicated JSON file.

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
```

## Usage

```bash
python scraper.py
```

Output will be written to `albums.json`.

## Data Sources

- NPR Music: "The 150 Greatest Albums Made By Women" (top 50)
- Rolling Stone: "2023 Best Albums of All Time" (top 50)
- Beehype: "SPECIAL: Classic Albums from Around the World" (all)
- Pitchfork: "Best Albums of the Last 25 Years" (top 50)

## Initial Setup

### Import Albums to Database

```bash
node scripts/import-albums.js <your-supabase-url> <your-supabase-service-key>
```

This imports all 350 albums from albums.json into your Supabase database.
Only needs to be run once.

## Frontend Configuration

The frontend requires Supabase credentials to connect to your database.

### Setup Steps

1. Copy the configuration template:
   ```bash
   cp frontend/config.example.js frontend/config.js
   ```

2. Edit `frontend/config.js` and add your Supabase credentials:
   - `url`: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
   - `anonKey`: Your Supabase anonymous key (found in Supabase Project Settings > API)

3. The `frontend/config.js` file is automatically ignored by git and will not be committed.

Example configuration:
```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

## Deployment

### Prerequisites

Before deploying, ensure you have:
- Supabase account (free tier works)
- Node.js and npm installed
- Resend account for email notifications (free tier: 3,000 emails/month)
- albums.json file (generated from data collection step)

### 1. Database Setup

Run the migration in Supabase Studio:
```sql
-- Copy from supabase/migrations/001_initial_schema.sql
-- Paste in Supabase Dashboard → SQL Editor → Run
```

### 2. Import Albums

Install dependencies first:
```bash
npm install
```

Then run the import:
```bash
node scripts/import-albums.js <supabase-url> <supabase-service-key>
```

### 3. Configure Email Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider (should be enabled by default)
3. Optionally configure email templates under Authentication → Email Templates

### 4. Deploy Edge Function

Install Supabase CLI using one of these methods:

**Option A - Homebrew (macOS/Linux, recommended):**
```bash
brew install supabase/tap/supabase
```

**Option B - npx (no install needed):**
```bash
# Just prefix all supabase commands with 'npx supabase' instead
npx supabase login
```

**Option C - npm local install:**
```bash
npm install supabase --save-dev
# Then use: npx supabase <command>
```

Once installed, deploy the Edge Function:

```bash
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

Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available to Edge Functions.

### 5. Configure Cron

**First, enable required extensions:**

In Supabase Dashboard → SQL Editor, run:

```sql
-- Enable pg_net extension (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Then, set up the cron job:**

In Supabase Dashboard → SQL Editor, run:

```sql
SELECT cron.schedule(
  'daily-album-picker',
  '0 8 * * *', -- 8 AM UTC daily
  $$
  SELECT net.http_post(
    url:='https://<your-project-ref>.supabase.co/functions/v1/daily-album-picker',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <your-anon-key>"}'::jsonb
  ) AS request_id
  $$
);
```

Note: The cron job runs at 8 AM UTC. Adjust the schedule if you want a different time.

### 6. Deploy Frontend

1. Update `frontend/config.js` with your Supabase URL and anon key
2. Upload files to your hosting (GitHub Pages, Netlify, etc.)
3. Make sure all files are accessible

### Test

Visit your app URL and create an account with your email and password!
