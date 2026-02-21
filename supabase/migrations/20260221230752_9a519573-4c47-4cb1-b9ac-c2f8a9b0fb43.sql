
-- Create contest submissions table
CREATE TABLE public.contest_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  x_handle TEXT NOT NULL,
  post_link TEXT NOT NULL,
  token_balance NUMERIC DEFAULT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_wallet UNIQUE (wallet_address),
  CONSTRAINT unique_x_handle UNIQUE (x_handle)
);

-- Enable RLS
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Submissions are publicly readable"
ON public.contest_submissions
FOR SELECT
USING (true);

-- Public insert (no auth required for contest)
CREATE POLICY "Anyone can submit"
ON public.contest_submissions
FOR INSERT
WITH CHECK (true);

-- Public update for token balance updates only (via edge function)
CREATE POLICY "Allow token balance updates"
ON public.contest_submissions
FOR UPDATE
USING (true);
