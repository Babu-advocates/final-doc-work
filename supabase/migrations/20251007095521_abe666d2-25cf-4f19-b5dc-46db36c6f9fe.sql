-- Update Sale Deed template to remove the "SALE DEED:" heading
UPDATE public.history_of_title_templates
SET template_content = 'Whereas registered sale deed executed by {executedBy} in favour of {inFavourOf} through a registered Sale deed in document No.{documentNumber} dated {date} regarding the property in Survey No. {sd survey no} to an extent of {sd extent}. From the date of purchase of the said Sale deed, {possession} was in possession and enjoyment of the same. The above details traced from document No.1'
WHERE deed_type = 'Sale Deed';