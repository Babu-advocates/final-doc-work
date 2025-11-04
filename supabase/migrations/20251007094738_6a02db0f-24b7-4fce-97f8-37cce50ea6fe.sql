-- Drop existing SELECT policy for deed_templates
DROP POLICY IF EXISTS "Anyone can view deed templates" ON public.deed_templates;

-- Create new policy that allows both anonymous and authenticated users to view deed templates
CREATE POLICY "Public can view deed templates"
ON public.deed_templates
FOR SELECT
TO public
USING (true);