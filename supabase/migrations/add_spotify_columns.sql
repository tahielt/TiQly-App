-- Add Spotify columns to events table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE events
ADD COLUMN IF NOT EXISTS spotify_artist TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS spotify_playlist TEXT DEFAULT NULL;
