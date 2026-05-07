CREATE TABLE public.wallet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  x_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_profiles_wallet_lower ON public.wallet_profiles (lower(wallet_address));

ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.wallet_profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can create a profile"
  ON public.wallet_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update a profile"
  ON public.wallet_profiles FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_wallet_profiles_updated_at
BEFORE UPDATE ON public.wallet_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();