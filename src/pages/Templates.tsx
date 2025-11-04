import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Download, Plus, LogOut, Scale, LogIn, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Template {
  id: string;
  template_name: string;
  file_name: string;
  created_at: string;
  updated_at: string;
}

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("userLoggedIn");
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    
    loadTemplates();
  }, [navigate]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("document_templates")
        .select("id, template_name, file_name, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      setUploadedFile(file);
    } else if (file) {
      toast.error("Please upload a .doc or .docx file");
    }
  };

  const handleUploadTemplate = async () => {
    if (!uploadedFile || !templateName.trim()) {
      toast.error("Please provide a template name and upload a file");
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert file to ArrayBuffer and then to hex string for PostgreSQL bytea
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));
      const hexString = '\\x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from("document_templates")
        .insert({
          template_name: templateName.trim(),
          file_name: uploadedFile.name,
          file_data: hexString,
        });

      if (error) throw error;

      toast.success("Template uploaded successfully");
      setShowUploadDialog(false);
      setTemplateName("");
      setUploadedFile(null);
      loadTemplates();
    } catch (error) {
      console.error("Error uploading template:", error);
      toast.error("Failed to upload template");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async (templateId: string, fileName: string, templateName: string) => {
    try {
      // Create approval request
      const { error } = await supabase
        .from("approval_requests" as any)
        .insert({
          request_type: "download",
          template_id: templateId,
          template_name: templateName,
          file_name: fileName,
          requested_by: localStorage.getItem("userLoggedIn") || "Unknown User",
          status: "pending"
        });

      if (error) throw error;

      toast.success("Download request sent for admin approval");
    } catch (error) {
      console.error("Error creating download request:", error);
      toast.error("Failed to create download request");
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string, fileName: string) => {
    try {
      // Create approval request
      const { error } = await supabase
        .from("approval_requests" as any)
        .insert({
          request_type: "delete",
          template_id: templateId,
          template_name: templateName,
          file_name: fileName,
          requested_by: localStorage.getItem("userLoggedIn") || "Unknown User",
          status: "pending"
        });

      if (error) throw error;

      toast.success("Delete request sent for admin approval");
    } catch (error) {
      console.error("Error creating delete request:", error);
      toast.error("Failed to create delete request");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userLoggedIn");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Blue Header */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Scale className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Legal Scrutiny Report Generator</h1>
                <p className="text-blue-100 text-sm">Professional Document Generation System</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/drafts")}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Drafts
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Your Templates</h2>
              <p className="text-muted-foreground mt-1">Select a template or create a new one</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload Word
              </Button>
              <Button 
                onClick={() => setShowNewTemplateDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </div>
          </div>
        </div>

        {/* Templates Content */}
        <Card className="border-border">
          <CardContent className="p-12">
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="animate-pulse">Loading templates...</div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-6">Create your first template to get started</p>
                <Button 
                  onClick={() => setShowNewTemplateDialog(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{template.template_name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{template.file_name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Created {format(new Date(template.created_at), "PPP")}
                      </p>
                       <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate("/work", { state: { templateId: template.id, templateName: template.template_name } })}
                        >
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadTemplate(template.id, template.file_name, template.template_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.template_name, template.file_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Word Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Word Template
              </DialogTitle>
              <DialogDescription>
                Upload an existing Word document as a template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="upload-name">Template Name</Label>
                <Input
                  id="upload-name"
                  placeholder="e.g., Legal Scrutiny Report"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-file">Word File (.docx)</Label>
                <Input
                  id="upload-file"
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileChange}
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setTemplateName("");
                  setUploadedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUploadTemplate} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Template Dialog */}
        <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Template
              </DialogTitle>
              <DialogDescription>
                Upload a Word document to create a new template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-template-name">Template Name</Label>
                <Input
                  id="new-template-name"
                  placeholder="e.g., Legal Scrutiny Report"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-template-file">Word File (.docx)</Label>
                <Input
                  id="new-template-file"
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileChange}
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewTemplateDialog(false);
                  setTemplateName("");
                  setUploadedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUploadTemplate} disabled={isUploading}>
                {isUploading ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Templates;
