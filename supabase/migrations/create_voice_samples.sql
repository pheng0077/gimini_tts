-- Create voice_samples table to track cached voice previews
CREATE TABLE IF NOT EXISTS voice_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_name TEXT NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE voice_samples ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read voice samples (public cache)
CREATE POLICY "Anyone can view voice samples"
  ON voice_samples
  FOR SELECT
  USING (true);

-- Only authenticated users can insert voice samples
CREATE POLICY "Auth users can insert voice samples"
  ON voice_samples
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for fast lookups
CREATE INDEX idx_voice_samples_name ON voice_samples(voice_name);
