-- Create user roles table with enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL, -- 'delete' or 'download'
    template_id UUID REFERENCES public.document_templates(id) ON DELETE CASCADE NOT NULL,
    template_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    requested_by TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on approval_requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Allow all access to approval_requests (adjust based on your auth requirements)
CREATE POLICY IF NOT EXISTS "Allow all access to approval_requests"
  ON public.approval_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS approval_requests_template_id_idx ON public.approval_requests(template_id);
CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);

COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for authorization';
COMMENT ON TABLE public.approval_requests IS 'Stores pending approval requests for template operations';
COMMENT ON COLUMN public.approval_requests.request_type IS 'Type of request: delete or download';
COMMENT ON COLUMN public.approval_requests.status IS 'Status of request: pending, approved, or rejected';
