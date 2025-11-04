-- Create drafts table to store work-in-progress reports
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  draft_name TEXT NOT NULL,
  placeholders JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Very permissive policy (adjust later if you add auth)
DROP POLICY IF EXISTS "Allow all access to drafts" ON public.drafts;
CREATE POLICY "Allow all access to drafts"
  ON public.drafts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS drafts_template_id_idx ON public.drafts(template_id);
CREATE INDEX IF NOT EXISTS drafts_created_at_idx ON public.drafts(created_at DESC);

-- Keep updated_at in sync on updates
DROP TRIGGER IF EXISTS set_drafts_updated_at ON public.drafts;
CREATE TRIGGER set_drafts_updated_at
BEFORE UPDATE ON public.drafts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();