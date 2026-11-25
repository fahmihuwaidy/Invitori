-- =============================================
-- Invori Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'Pro Plan',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Invitation',
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Wedding',
  guest_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  primary_color TEXT DEFAULT '#565F34',
  background_color TEXT DEFAULT '#EDE9E7',
  font_family TEXT DEFAULT 'Playfair Display',
  music_url TEXT DEFAULT 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  total_views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RSVPs & Wishes table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  entry_type TEXT NOT NULL DEFAULT 'rsvp' CHECK (entry_type IN ('rsvp', 'wish')),
  attendance TEXT CHECK (attendance IN ('yes', 'no')),
  guest_count INT DEFAULT 1,
  session TEXT,
  dietary_note TEXT,
  message TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  group_name TEXT DEFAULT 'Regular',
  max_pax INT NOT NULL DEFAULT 2,
  table_name TEXT,
  pass_token TEXT UNIQUE,
  wa_sent_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_in_pax INT,
  souvenir_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Invitation Views table (Analytics)
CREATE TABLE IF NOT EXISTS invitation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_token TEXT,
  source TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Idempotent Column Upgrades for Existing DBs
-- =============================================
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'rsvp';
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS session TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS dietary_note TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'Regular';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS max_pax INT NOT NULL DEFAULT 2;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS table_name TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS pass_token TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS wa_sent_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checked_in_pax INT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS souvenir_claimed BOOLEAN NOT NULL DEFAULT false;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_blocks_invitation_id ON blocks(invitation_id);
CREATE INDEX IF NOT EXISTS idx_blocks_sort_order ON blocks(invitation_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON rsvps(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_entry_type ON rsvps(invitation_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_id ON guests(invitation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_pass_token ON guests(pass_token) WHERE pass_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitation_views_inv_id ON invitation_views(invitation_id, viewed_at DESC);

-- =============================================
-- RPC: Increment view count & record analytics view
-- =============================================
CREATE OR REPLACE FUNCTION increment_view(
  inv_id UUID,
  p_guest_token TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET total_views = COALESCE(total_views, 0) + 1
  WHERE id = inv_id;

  INSERT INTO invitation_views (invitation_id, guest_token, source)
  VALUES (inv_id, p_guest_token, p_source);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC: Check unique slug availability globally
-- =============================================
CREATE OR REPLACE FUNCTION is_slug_available(
  p_slug TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE LOWER(slug) = LOWER(TRIM(p_slug))
      AND (p_exclude_id IS NULL OR id <> p_exclude_id)
  ) INTO v_exists;

  RETURN NOT v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Row Level Security
-- =============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own invitations" ON invitations;
CREATE POLICY "Users can CRUD own invitations"
  ON invitations FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view published invitations" ON invitations;
CREATE POLICY "Public can view published invitations"
  ON invitations FOR SELECT
  USING (status = 'published');

-- Blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD blocks of own invitations" ON blocks;
CREATE POLICY "Users can CRUD blocks of own invitations"
  ON blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = blocks.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view blocks of published invitations" ON blocks;
CREATE POLICY "Public can view blocks of published invitations"
  ON blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = blocks.invitation_id
      AND invitations.status = 'published'
    )
  );

-- RSVPs & Wishes
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert RSVP" ON rsvps;
CREATE POLICY "Anyone can insert RSVP"
  ON rsvps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Public can view visible wishes of published invitations" ON rsvps;
CREATE POLICY "Public can view visible wishes of published invitations"
  ON rsvps FOR SELECT
  USING (
    is_hidden = false
    AND message IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Owners can view RSVPs" ON rsvps;
CREATE POLICY "Owners can view RSVPs"
  ON rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update RSVPs" ON rsvps;
CREATE POLICY "Owners can update RSVPs"
  ON rsvps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete RSVPs" ON rsvps;
CREATE POLICY "Owners can delete RSVPs"
  ON rsvps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- Guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD guests of own invitations" ON guests;
CREATE POLICY "Users can CRUD guests of own invitations"
  ON guests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = guests.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- Invitation Views
ALTER TABLE invitation_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views for published invitations" ON invitation_views;
CREATE POLICY "Anyone can insert views for published invitations"
  ON invitation_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_views.invitation_id
      AND invitations.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Owners can view invitation analytics" ON invitation_views;
CREATE POLICY "Owners can view invitation analytics"
  ON invitation_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_views.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- =============================================
-- Trigger: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invitations_updated_at ON invitations;
CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
