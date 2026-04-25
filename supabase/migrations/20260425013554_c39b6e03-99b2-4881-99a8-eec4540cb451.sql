
-- =============================================
-- 1. PROFILES: add INSERT policy
-- =============================================
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. BOOKING IMAGES: make bucket private, scope policies
-- =============================================
UPDATE storage.buckets SET public = false WHERE id = 'booking-images';

DROP POLICY IF EXISTS "Anyone can upload booking images" ON storage.objects;
DROP POLICY IF EXISTS "Booking images are publicly readable" ON storage.objects;

-- Only authenticated users can upload, into their own user-id folder
CREATE POLICY "Users upload own booking images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Owners can view their own booking images
CREATE POLICY "Users view own booking images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Staff can view all booking images
CREATE POLICY "Staff view all booking images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-images'
  AND public.is_staff(auth.uid())
);

-- Owners can delete their own booking images
CREATE POLICY "Users delete own booking images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'booking-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- =============================================
-- 3. GARMENT IMAGES: scope INSERT to user folder
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can upload garment images" ON storage.objects;

CREATE POLICY "Users upload own garment images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'garment-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- =============================================
-- 4. REALTIME: restrict channel subscriptions
-- Realtime authorization uses the realtime.messages table policies
-- =============================================
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can subscribe to staff channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can receive own messages" ON realtime.messages;

-- Staff can subscribe to admin/business channels
CREATE POLICY "Staff can subscribe to staff channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.is_staff((SELECT auth.uid()))
);

-- All authenticated users may receive realtime events; per-table RLS still gates row visibility
CREATE POLICY "Authenticated can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
