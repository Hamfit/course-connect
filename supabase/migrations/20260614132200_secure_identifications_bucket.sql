-- 1. Secure the identifications storage bucket (make private, enforce size and type restrictions)
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760, -- 10MB in bytes
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'identifications';

-- 2. Restrict read access to only the student who uploaded the document or administrative moderation accounts
DROP POLICY IF EXISTS "Anyone can read identification documents" ON storage.objects;
DROP POLICY IF EXISTS "Only admins and owners can read identification documents" ON storage.objects;

CREATE POLICY "Only admins and owners can read identification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'identifications' AND 
    (
      public.has_role(auth.uid(), 'admin') OR 
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- 3. Restrict insert access to only the authenticated user uploading to their own user directory path
DROP POLICY IF EXISTS "Users can upload own identification documents" ON storage.objects;

CREATE POLICY "Users can upload own identification documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'identifications' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
