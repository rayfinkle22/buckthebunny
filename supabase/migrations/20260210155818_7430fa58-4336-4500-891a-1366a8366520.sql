
-- Create the update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create contest_settings table
CREATE TABLE public.contest_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  countdown_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  fee_percentage NUMERIC NOT NULL DEFAULT 10,
  submission_start DATE NOT NULL DEFAULT CURRENT_DATE,
  submission_end DATE NOT NULL DEFAULT (CURRENT_DATE + 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contest settings are publicly readable"
ON public.contest_settings FOR SELECT USING (true);

CREATE POLICY "Contest settings are publicly updatable"
ON public.contest_settings FOR UPDATE USING (true);

CREATE POLICY "Contest settings are publicly insertable"
ON public.contest_settings FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_contest_settings_updated_at
BEFORE UPDATE ON public.contest_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.contest_settings (countdown_end, fee_percentage, submission_start, submission_end)
VALUES ((now() + interval '7 days'), 10, CURRENT_DATE, CURRENT_DATE + 7);
