import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
interface TemplateUploadProps {
  onTemplateUpload: (file: File) => void;
  isUploaded: boolean;
}
const TemplateUpload = ({
  onTemplateUpload,
  isUploaded
}: TemplateUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      onTemplateUpload(file);
    }
  };
  return (
    <Card className="shadow-legal border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-legal-header">
          <Upload className="h-5 w-5 text-primary" />
          Upload Template
        </CardTitle>
        <CardDescription>
          Upload a Word document template (.docx) with placeholders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Word Template File</Label>
            <Input
              id="template"
              type="file"
              accept=".docx,.doc"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          {isUploaded && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Template uploaded successfully
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default TemplateUpload;