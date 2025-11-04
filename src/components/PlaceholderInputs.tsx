import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderInputsProps {
  placeholders: Record<string, string>;
  onPlaceholderChange: (key: string, value: string) => void;
}

const PlaceholderInputs = ({ placeholders, onPlaceholderChange }: PlaceholderInputsProps) => {
  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <Card className="shadow-legal">
      <CardHeader>
        <CardTitle className="text-legal-header">Document Details</CardTitle>
        <CardDescription>Fill in the required information for the legal scrutiny report</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(placeholders).map(([key, value]) => {
            const inputId = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={inputId} className="text-sm font-medium">
                  {formatLabel(key)}
                </Label>
                <Input
                  id={inputId}
                  value={value}
                  onChange={(e) => onPlaceholderChange(key, e.target.value)}
                  placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                  className="transition-all duration-200 focus:ring-2 focus:ring-legal-header"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceholderInputs;
