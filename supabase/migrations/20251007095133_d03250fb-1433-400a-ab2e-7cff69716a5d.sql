-- Drop existing SELECT policy for history_of_title_templates
DROP POLICY IF EXISTS "Anyone can view history templates" ON public.history_of_title_templates;

-- Create new policy that allows both anonymous and authenticated users to view history templates
CREATE POLICY "Public can view history templates"
ON public.history_of_title_templates
FOR SELECT
TO public
USING (true);