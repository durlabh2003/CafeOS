-- SQL snippet to update the Supabase schema for the new CafeOS features

-- 1. Create the shift_logs table for Feature 6 (Shift Closure)
CREATE TABLE IF NOT EXISTS public.shift_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_name text NOT NULL,
    shift_start timestamptz NOT NULL,
    shift_end timestamptz NOT NULL,
    expected_cash numeric NOT NULL DEFAULT 0,
    actual_cash numeric NOT NULL DEFAULT 0,
    variance numeric NOT NULL DEFAULT 0,
    total_upi numeric NOT NULL DEFAULT 0,
    total_card numeric NOT NULL DEFAULT 0,
    total_transactions integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Optional: Enable Row Level Security (RLS) on shift_logs
-- ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all for authenticated users" ON public.shift_logs FOR ALL USING (true) WITH CHECK (true);

-- 2. Update the staff table for Feature 4 (Staff Management)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
