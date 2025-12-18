-- Create table for per-page access control
CREATE TABLE IF NOT EXISTS public.user_page_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key text NOT NULL
);

ALTER TABLE public.user_page_access ENABLE ROW LEVEL SECURITY;

-- Admins can view all page access
CREATE POLICY "Admins can view all page access"
ON public.user_page_access
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert page access
CREATE POLICY "Admins can insert page access"
ON public.user_page_access
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update page access
CREATE POLICY "Admins can update page access"
ON public.user_page_access
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete page access
CREATE POLICY "Admins can delete page access"
ON public.user_page_access
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own page access
CREATE POLICY "Users can view own page access"
ON public.user_page_access
FOR SELECT
USING (auth.uid() = user_id);