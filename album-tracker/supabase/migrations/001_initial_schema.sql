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
CREATE INDEX idx_albums_artist ON albums(artist);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_picks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums (public read, service role write only)
-- Note: Albums are populated via import script using service role key
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

CREATE POLICY "Users can delete their own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_picks (users can only read their own)
-- Note: Daily picks are created by Edge Function using service role key
CREATE POLICY "Users can read their own daily picks"
  ON daily_picks FOR SELECT
  USING (auth.uid() = user_id);
