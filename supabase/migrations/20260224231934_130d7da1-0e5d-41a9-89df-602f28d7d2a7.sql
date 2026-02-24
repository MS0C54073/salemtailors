
-- Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'sub_admin', 'client');

-- Order status enum
CREATE TYPE public.order_status AS ENUM (
  'request_submitted', 'consultation_scheduled', 'measurement_taken',
  'in_progress', 'ready_for_fitting', 'adjustments_ongoing',
  'completed', 'ready_for_pickup'
);

-- Garment category enum
CREATE TYPE public.garment_category AS ENUM (
  'chitenge_men', 'chitenge_women', 'wedding_bride', 'wedding_groom',
  'bridesmaids_groomsmen', 'casual_wear', 'formal_wear', 'alterations', 'custom_designs'
);

-- Appointment type enum
CREATE TYPE public.appointment_type AS ENUM ('consultation', 'measurement', 'fitting', 'pickup');

-- Appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE(user_id, role)
);

-- Garment requests / orders
CREATE TABLE public.garment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  category garment_category NOT NULL,
  description TEXT NOT NULL,
  measurements JSONB,
  reference_images TEXT[] DEFAULT '{}',
  status order_status NOT NULL DEFAULT 'request_submitted',
  event_date DATE,
  notes TEXT,
  estimated_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  garment_request_id UUID REFERENCES public.garment_requests(id) ON DELETE SET NULL,
  appointment_type appointment_type NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  garment_request_id UUID REFERENCES public.garment_requests(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Helper: is staff (admin or above)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin', 'sub_admin')
  )
$$;

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_garment_requests_updated_at BEFORE UPDATE ON public.garment_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- USER_ROLES RLS
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Super admin can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- GARMENT_REQUESTS RLS
CREATE POLICY "Clients see own requests" ON public.garment_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Staff see all requests" ON public.garment_requests FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Sub-admins see assigned requests" ON public.garment_requests FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Clients can create requests" ON public.garment_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Staff can update requests" ON public.garment_requests FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Clients can update own requests" ON public.garment_requests FOR UPDATE USING (auth.uid() = client_id AND status = 'request_submitted');

-- APPOINTMENTS RLS
CREATE POLICY "Clients see own appointments" ON public.appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Staff see all appointments" ON public.appointments FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Clients can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Staff can manage appointments" ON public.appointments FOR ALL USING (public.is_staff(auth.uid()));

-- MESSAGES RLS
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Storage bucket for garment images
INSERT INTO storage.buckets (id, name, public) VALUES ('garment-images', 'garment-images', true);

CREATE POLICY "Anyone can view garment images" ON storage.objects FOR SELECT USING (bucket_id = 'garment-images');
CREATE POLICY "Authenticated users can upload garment images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'garment-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'garment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'garment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
