-- Appointment slots table
CREATE TABLE public.appointment_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_available BOOLEAN NOT NULL DEFAULT true,
  booked_by UUID,
  appointment_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX appointment_slots_slot_at_unique ON public.appointment_slots(slot_at);
CREATE INDEX appointment_slots_available_idx ON public.appointment_slots(slot_at) WHERE is_available = true AND booked_by IS NULL;

ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- Staff full management
CREATE POLICY "Staff manage slots"
ON public.appointment_slots
FOR ALL
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Authenticated users can view available slots (to pick one)
CREATE POLICY "Authenticated view available slots"
ON public.appointment_slots
FOR SELECT
TO authenticated
USING (is_available = true OR booked_by = auth.uid() OR public.is_staff(auth.uid()));

-- Clients can claim an available slot (only mark themselves as booker)
CREATE POLICY "Clients can claim available slots"
ON public.appointment_slots
FOR UPDATE
TO authenticated
USING (is_available = true AND booked_by IS NULL)
WITH CHECK (booked_by = auth.uid());

-- Updated-at trigger
CREATE TRIGGER update_appointment_slots_updated_at
BEFORE UPDATE ON public.appointment_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();