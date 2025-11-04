-- Make user_id nullable to support anonymous users
ALTER TABLE public.deeds ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Users can create their own deeds" ON public.deeds;
DROP POLICY IF EXISTS "Users can view their own deeds" ON public.deeds;
DROP POLICY IF EXISTS "Users can update their own deeds" ON public.deeds;
DROP POLICY IF EXISTS "Users can delete their own deeds" ON public.deeds;

-- Create new public policies that allow anyone to manage deeds
CREATE POLICY "Anyone can create deeds"
ON public.deeds
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view deeds"
ON public.deeds
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update deeds"
ON public.deeds
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Anyone can delete deeds"
ON public.deeds
FOR DELETE
TO public
USING (true);