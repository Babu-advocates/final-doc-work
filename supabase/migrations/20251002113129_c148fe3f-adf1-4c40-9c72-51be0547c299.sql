-- Fix function search path by setting search_path on handle_updated_at function
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER set_deed_templates_updated_at
  BEFORE UPDATE ON public.deed_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_history_templates_updated_at
  BEFORE UPDATE ON public.history_of_title_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();