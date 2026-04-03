
ALTER TABLE public.subscription_settings
  ADD COLUMN price_zone_a NUMERIC NOT NULL DEFAULT 3000,
  ADD COLUMN price_zone_b NUMERIC NOT NULL DEFAULT 7000;

UPDATE public.subscription_settings SET price_zone_a = 3000, price_zone_b = 7000;
