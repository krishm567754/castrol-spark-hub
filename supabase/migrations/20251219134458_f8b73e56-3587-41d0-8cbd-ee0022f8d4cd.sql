-- Create table for WBC customer agreements
CREATE TABLE IF NOT EXISTS public.wbc_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text NOT NULL,
  customer_name text,
  agreement_start_date date NOT NULL,
  agreement_end_date date NOT NULL,
  target_volume numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wbc_agreements ENABLE ROW LEVEL SECURITY;

-- Policy: admins can do full CRUD on agreements
CREATE POLICY "Admins can manage WBC agreements"
ON public.wbc_agreements
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: all authenticated users can view agreements
CREATE POLICY "Users can view WBC agreements"
ON public.wbc_agreements
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Optional: simple trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.update_wbc_agreements_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_wbc_agreements_updated_at ON public.wbc_agreements;

CREATE TRIGGER trg_wbc_agreements_updated_at
BEFORE UPDATE ON public.wbc_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_wbc_agreements_updated_at();
