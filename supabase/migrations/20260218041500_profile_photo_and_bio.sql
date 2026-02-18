-- Migration to add profile photo and bio to users_profile
-- 1. Add columns to users_profile
ALTER TABLE IF EXISTS users_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS users_profile ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Create storage bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for avatars
-- Allow anyone to view avatars
DROP POLICY IF EXISTS "Public View Avatars" ON storage.objects;
CREATE POLICY "Public View Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Users Upload Own Avatar" ON storage.objects;
CREATE POLICY "Users Upload Own Avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Allow users to update/delete their own avatar
DROP POLICY IF EXISTS "Users Update Own Avatar" ON storage.objects;
CREATE POLICY "Users Update Own Avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users Delete Own Avatar" ON storage.objects;
CREATE POLICY "Users Delete Own Avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = owner);
