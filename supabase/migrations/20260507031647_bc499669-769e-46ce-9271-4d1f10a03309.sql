CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, check_in_date)
);

CREATE INDEX idx_check_ins_wallet ON public.check_ins (lower(wallet_address), check_in_date DESC);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_public_read"
ON public.check_ins
FOR SELECT
USING (true);

CREATE POLICY "checkins_public_insert"
ON public.check_ins
FOR INSERT
WITH CHECK (length(wallet_address) >= 4 AND length(wallet_address) <= 100);