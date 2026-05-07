
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tips_created ON public.tips(created_at DESC);
CREATE INDEX idx_tips_recipient ON public.tips(lower(recipient_address));
CREATE INDEX idx_tips_sender ON public.tips(lower(sender_address));

CREATE TABLE public.gas_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  fulfilled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gas_created ON public.gas_requests(created_at DESC);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tips_public_read" ON public.tips FOR SELECT USING (true);
CREATE POLICY "tips_public_insert" ON public.tips FOR INSERT WITH CHECK (
  length(sender_address) BETWEEN 4 AND 100
  AND length(recipient_address) BETWEEN 4 AND 100
  AND amount > 0
  AND (message IS NULL OR length(message) <= 500)
);

CREATE POLICY "gas_public_read" ON public.gas_requests FOR SELECT USING (true);
CREATE POLICY "gas_public_insert" ON public.gas_requests FOR INSERT WITH CHECK (
  length(wallet_address) BETWEEN 4 AND 100
  AND length(reason) BETWEEN 1 AND 500
);
