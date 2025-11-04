-- Create table for storing document templates
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_data BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for template access (publicly accessible for now)
CREATE POLICY "Anyone can view templates" 
ON public.document_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create templates" 
ON public.document_templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update templates" 
ON public.document_templates 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete templates" 
ON public.document_templates 
FOR DELETE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_document_templates_created_at ON public.document_templates(created_at DESC);