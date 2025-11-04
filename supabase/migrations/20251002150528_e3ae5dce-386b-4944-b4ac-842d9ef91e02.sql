-- Add custom_placeholders column to deed_templates table
-- This stores the custom placeholders definition for each deed type
ALTER TABLE deed_templates 
ADD COLUMN IF NOT EXISTS custom_placeholders JSONB DEFAULT '{}'::jsonb;

-- Add custom_fields column to deeds table  
-- This stores the custom field values for each deed
ALTER TABLE deeds
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN deed_templates.custom_placeholders IS 'Custom placeholder definitions for this deed type (key: placeholder name, value: description)';
COMMENT ON COLUMN deeds.custom_fields IS 'Custom field values for this deed (key: field name, value: field value)';