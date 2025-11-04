-- Add custom_placeholders column to deed_templates table
-- This stores the custom placeholders definition for each deed type
ALTER TABLE deed_templates 
ADD COLUMN IF NOT EXISTS custom_placeholders JSONB DEFAULT '{}'::jsonb;

-- Add custom_fields column to deeds table  
-- This stores the custom field values for each deed
ALTER TABLE deeds
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add table_type column to deeds table to support multiple independent tables
ALTER TABLE deeds
ADD COLUMN IF NOT EXISTS table_type TEXT DEFAULT 'table';

-- Add comments for documentation
COMMENT ON COLUMN deed_templates.custom_placeholders IS 'Custom placeholder definitions for this deed type (key: placeholder name, value: description)';
COMMENT ON COLUMN deeds.custom_fields IS 'Custom field values for this deed (key: field name, value: field value)';
COMMENT ON COLUMN deeds.table_type IS 'Table type identifier (table, table2, table3, table4) to support multiple independent deed tables';

-- Create drafts table to store work in progress
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.document_templates(id) ON DELETE CASCADE,
  draft_name TEXT NOT NULL,
  placeholders JSONB DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on drafts table
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Allow all access to drafts (adjust based on your auth requirements)
CREATE POLICY IF NOT EXISTS "Allow all access to drafts"
  ON public.drafts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS drafts_template_id_idx ON public.drafts(template_id);
CREATE INDEX IF NOT EXISTS drafts_created_at_idx ON public.drafts(created_at DESC);
