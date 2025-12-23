-- Migration to align events table with Map & App requirements
-- This checks if columns exist and adds them if missing

-- 1. Rename columns to standard names if they exist in the old format
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'name') THEN
    ALTER TABLE events RENAME COLUMN "name" TO "title";
  END IF;
  
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_date') THEN
    ALTER TABLE events RENAME COLUMN "event_date" TO "start_date";
  END IF;
END $$;

-- 2. Add missing columns for Map & Status
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS location_name text, -- Friendly name "Club X"
ADD COLUMN IF NOT EXISTS location_address text, -- Full address
ADD COLUMN IF NOT EXISTS location_lat double precision, -- For Map Marker
ADD COLUMN IF NOT EXISTS location_lng double precision, -- For Map Marker
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Fiesta',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published', -- published/draft/cancelled
ADD COLUMN IF NOT EXISTS capacity int,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS cover_image text,
ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES auth.users(id);

-- 3. If 'location' existed as text, try to migrate it to location_name (optional cleanup)
-- ALTER TABLE events DROP COLUMN IF EXISTS location;

-- 4. Insert dummy data ONLY if table is empty, so the map isn't empty
INSERT INTO events (title, description, category, start_date, location_name, location_lat, location_lng, status, capacity)
SELECT 'Fiesta Inauguración (Demo)', 'Evento de prueba automática.', 'Fiesta', NOW() + interval '1 day', 'Centro Cívico', -41.1334, -71.3103, 'published', 500
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1);
