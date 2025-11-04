-- Create approval_requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL,
    template_id UUID REFERENCES public.document_templates(id) ON DELETE CASCADE NOT NULL,
    template_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    requested_by TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on approval_requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all access to approval_requests" ON public.approval_requests;

-- Create policy to allow all access
CREATE POLICY "Allow all access to approval_requests"
  ON public.approval_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS approval_requests_template_id_idx ON public.approval_requests(template_id);
CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON public.approval_requests(status);

-- Add comments
COMMENT ON TABLE public.approval_requests IS 'Stores pending approval requests for template operations';
COMMENT ON COLUMN public.approval_requests.request_type IS 'Type of request: delete or download';
COMMENT ON COLUMN public.approval_requests.status IS 'Status of request: pending, approved, or rejected';