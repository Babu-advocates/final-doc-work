-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create deed_templates table
CREATE TABLE public.deed_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_type TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deed_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for deed_templates
CREATE POLICY "Anyone can view deed templates"
ON public.deed_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage deed templates"
ON public.deed_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create history_of_title_templates table
CREATE TABLE public.history_of_title_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_type TEXT NOT NULL UNIQUE REFERENCES public.deed_templates(deed_type) ON DELETE CASCADE,
  template_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.history_of_title_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for history_of_title_templates
CREATE POLICY "Anyone can view history templates"
ON public.history_of_title_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage history templates"
ON public.history_of_title_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_deed_templates_updated_at
  BEFORE UPDATE ON public.deed_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_history_templates_updated_at
  BEFORE UPDATE ON public.history_of_title_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default deed types
INSERT INTO public.deed_templates (deed_type, description) VALUES
  ('Sale Deed', 'Document for property sale'),
  ('Land Deed', 'Document for land transfer'),
  ('Mortgage Deed', 'Document for property mortgage'),
  ('Gift Deed', 'Document for property gifting'),
  ('Lease Deed', 'Document for property lease'),
  ('Will', 'Testament document'),
  ('Power of Attorney', 'Authorization document'),
  ('Agreement to Sell', 'Pre-sale agreement'),
  ('Partition Deed', 'Property partition document');