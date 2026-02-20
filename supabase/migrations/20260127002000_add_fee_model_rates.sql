-- Store fee model pricing details per lawyer
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS fee_model_rates JSONB;
