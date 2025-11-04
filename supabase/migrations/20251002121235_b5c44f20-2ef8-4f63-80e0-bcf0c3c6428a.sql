-- Create deeds table to store actual deed documents
CREATE TABLE public.deeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deed_type TEXT NOT NULL,
  executed_by TEXT NOT NULL,
  in_favour_of TEXT NOT NULL,
  date DATE NOT NULL,
  document_number TEXT NOT NULL,
  nature_of_doc TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deeds ENABLE ROW LEVEL SECURITY;

-- Create policies for user access to their own deeds
CREATE POLICY "Users can view their own deeds" 
ON public.deeds 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deeds" 
ON public.deeds 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deeds" 
ON public.deeds 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deeds" 
ON public.deeds 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deeds_updated_at
BEFORE UPDATE ON public.deeds
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add preview_template column to deed_templates for editable preview format
ALTER TABLE public.deed_templates 
ADD COLUMN preview_template TEXT DEFAULT '{deedType} executed by {executedBy} in favour of {inFavourOf}';

-- Enable realtime for deeds table
ALTER TABLE public.deeds REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deeds;