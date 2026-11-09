-- =============================================
-- Invitori Database Schema
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

-- 4. RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  attendance TEXT CHECK (attendance IN ('yes', 'no')),
  guest_count INT DEFAULT 1,
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_blocks_invitation_id ON blocks(invitation_id);
CREATE INDEX IF NOT EXISTS idx_blocks_sort_order ON blocks(invitation_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON rsvps(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_id ON guests(invitation_id);

-- =============================================
-- RPC: Increment view count
-- =============================================
CREATE OR REPLACE FUNCTION increment_view(inv_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET total_views = total_views + 1
  WHERE id = inv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Row Level Security
-- =============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own invitations"
  ON invitations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published invitations"
  ON invitations FOR SELECT
  USING (status = 'published');

-- Blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD blocks of own invitations"
  ON blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = blocks.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view blocks of published invitations"
  ON blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = blocks.invitation_id
      AND invitations.status = 'published'
    )
  );

-- RSVPs
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert RSVP"
  ON rsvps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.status = 'published'
    )
  );

CREATE POLICY "Owners can view RSVPs"
  ON rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can CRUD guests of own invitations"
  ON guests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = guests.invitation_id
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

CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
