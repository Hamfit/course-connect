-- 1. Enforce file size and type restrictions for materials bucket
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY[
      'application/pdf', 
      'video/mp4', 
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'materials';

-- 2. Enforce file size and type restrictions for avatars bucket
UPDATE storage.buckets
SET file_size_limit = 2097152, -- 2MB
    allowed_mime_types = ARRAY[
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ]
WHERE id = 'avatars';

-- 3. Restrict materials upload INSERT policy to only own directory path matching auth.uid()
DROP POLICY IF EXISTS "Authenticated users can upload materials files" ON storage.objects;

CREATE POLICY "Authenticated users can upload materials files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'materials' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Clean up loose/duplicate avatar bucket policies to fallback onto strict folder matching policies from migration 20260301113717
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
