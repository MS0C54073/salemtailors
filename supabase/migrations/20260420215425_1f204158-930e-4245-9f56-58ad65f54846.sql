-- Create a public bucket for client booking reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-images', 'booking-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (including unauthenticated visitors) to upload reference images
CREATE POLICY "Anyone can upload booking images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'booking-images');

-- Allow public read so the WhatsApp link works for the shop
CREATE POLICY "Booking images are publicly readable"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'booking-images');