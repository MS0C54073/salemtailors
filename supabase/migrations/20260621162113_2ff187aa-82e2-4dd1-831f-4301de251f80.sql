
DROP POLICY IF EXISTS "Garment images owner read" ON storage.objects;
DROP POLICY IF EXISTS "Garment images staff read" ON storage.objects;
DROP POLICY IF EXISTS "Garment images owner write" ON storage.objects;
DROP POLICY IF EXISTS "Garment images owner delete" ON storage.objects;

CREATE POLICY "Garment images owner read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'garment-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Garment images staff read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'garment-images'
  AND public.is_staff(auth.uid())
);

CREATE POLICY "Garment images owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'garment-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Garment images owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'garment-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
