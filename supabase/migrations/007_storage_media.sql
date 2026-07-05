-- Medya bucket: blog kapak ve içe aktarılan görseller

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'media');
