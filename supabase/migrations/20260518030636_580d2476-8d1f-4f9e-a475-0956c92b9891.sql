-- Add avatar_url to wallet_profiles
ALTER TABLE public.wallet_profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create public storage bucket for wallet avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallet-avatars', 'wallet-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage policies: public read, public write (upsert) for wallet-avatars
CREATE POLICY "wallet_avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'wallet-avatars');

CREATE POLICY "wallet_avatars_public_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wallet-avatars');

CREATE POLICY "wallet_avatars_public_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'wallet-avatars');
