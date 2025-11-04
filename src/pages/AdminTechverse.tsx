import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Save, FileText, History, ArrowLeft, LogOut, Trash2, Plus, CheckCircle2 } from "lucide-react";

interface DeedTemplate {
  deed_type: string;
  description: string;
  preview_template: string | null;
  custom_placeholders?: Record<string, string> | any;
}

interface HistoryTemplate {
  deed_type: string;
  template_content: string;
}

interface ApprovalRequest {
  id: string;
  request_type: string;
  template_id: string;
  template_name: string;
  file_name: string;
  requested_by: string | null;
  status: string;
  created_at: string;
}

const AdminTechverse = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deedTemplates, setDeedTemplates] = useState<DeedTemplate[]>([]);
  const [selectedDeedType, setSelectedDeedType] = useState<string>("");
  const [historyTemplate, setHistoryTemplate] = useState<string>("");
  const [previewTemplate, setPreviewTemplate] = useState<string>("");
  const [newDeedType, setNewDeedType] = useState<string>("");
  const [newDeedDescription, setNewDeedDescription] = useState<string>("");
  const [customPlaceholders, setCustomPlaceholders] = useState<Record<string, string>>({});
  const [newPlaceholderKey, setNewPlaceholderKey] = useState<string>("");
  const [newPlaceholderDesc, setNewPlaceholderDesc] = useState<string>("");
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [showApprovalsDialog, setShowApprovalsDialog] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to access admin panel");
        navigate("/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        toast.error("Error verifying admin access");
        navigate("/");
        return;
      }

      if (!roleData) {
        toast.error("Access denied: Admin privileges required");
        navigate("/auth");
        return;
      }

      setIsAdmin(true);
      await loadDeedTemplates();
      await loadApprovalRequests();
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      toast.error("Authentication error");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
      return;
    }
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const loadDeedTemplates = async () => {
    const { data, error } = await supabase
      .from("deed_templates")
      .select("*")
      .order("deed_type");

    if (error) {
      console.error("Error loading deed templates:", error);
      toast.error("Failed to load deed templates");
      return;
    }

    setDeedTemplates(data || []);
  };

  const loadHistoryTemplate = async (deedType: string) => {
    const { data, error } = await supabase
      .from("history_of_title_templates")
      .select("template_content")
      .eq("deed_type", deedType)
      .maybeSingle();

    if (error) {
      console.error("Error loading history template:", error);
      return;
    }

    setHistoryTemplate(data?.template_content || "");
  };

  const handleDeedTypeChange = (value: string) => {
    setSelectedDeedType(value);
    loadHistoryTemplate(value);
    
    const template = deedTemplates.find((t) => t.deed_type === value);
    setPreviewTemplate(template?.preview_template || "{deedType} executed by {executedBy} in favour of {inFavourOf}");
    setCustomPlaceholders(template?.custom_placeholders || {});
  };

  const handleSaveHistoryTemplate = async () => {
    if (!selectedDeedType) {
      toast.error("Please select a deed type first");
      return;
    }

    if (!historyTemplate.trim()) {
      toast.error("Template content cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("history_of_title_templates")
      .upsert({
        deed_type: selectedDeedType,
        template_content: historyTemplate,
      }, {
        onConflict: "deed_type"
      });

    if (error) {
      console.error("Error saving history template:", error);
      toast.error("Failed to save template");
      return;
    }

    toast.success("History of Title template saved successfully");
  };

  const handleSavePreviewTemplate = async () => {
    if (!selectedDeedType) {
      toast.error("Please select a deed type first");
      return;
    }

    if (!previewTemplate.trim()) {
      toast.error("Preview template cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("deed_templates")
      .update({ preview_template: previewTemplate })
      .eq("deed_type", selectedDeedType);

    if (error) {
      console.error("Error saving preview template:", error);
      toast.error("Failed to save preview template");
      return;
    }

    toast.success("Preview template saved successfully");
    await loadDeedTemplates();
  };

  const handleAddDeedType = async () => {
    if (!newDeedType.trim()) {
      toast.error("Deed type name cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("deed_templates")
      .insert({
        deed_type: newDeedType,
        description: newDeedDescription || null,
      });

    if (error) {
      console.error("Error adding deed type:", error);
      toast.error("Failed to add deed type");
      return;
    }

    toast.success("Deed type added successfully");
    setNewDeedType("");
    setNewDeedDescription("");
    await loadDeedTemplates();
  };

  const handleDeleteDeedType = async (deedType: string) => {
    if (!confirm(`Are you sure you want to delete "${deedType}"? This will also delete all associated templates and deeds.`)) {
      return;
    }

    // Delete associated history templates first
    const { error: historyError } = await supabase
      .from("history_of_title_templates")
      .delete()
      .eq("deed_type", deedType);

    if (historyError) {
      console.error("Error deleting history template:", historyError);
    }

    // Delete the deed template
    const { error } = await supabase
      .from("deed_templates")
      .delete()
      .eq("deed_type", deedType);

    if (error) {
      console.error("Error deleting deed type:", error);
      toast.error("Failed to delete deed type");
      return;
    }

    toast.success("Deed type deleted successfully");
    
    // Clear selection if the deleted type was selected
    if (selectedDeedType === deedType) {
      setSelectedDeedType("");
      setHistoryTemplate("");
      setPreviewTemplate("");
      setCustomPlaceholders({});
    }
    
    await loadDeedTemplates();
  };

  const handleAddCustomPlaceholder = () => {
    if (!newPlaceholderKey.trim()) {
      toast.error("Placeholder key cannot be empty");
      return;
    }

    if (customPlaceholders[newPlaceholderKey]) {
      toast.error("Placeholder key already exists");
      return;
    }

    setCustomPlaceholders(prev => ({
      ...prev,
      [newPlaceholderKey]: newPlaceholderDesc
    }));

    setNewPlaceholderKey("");
    setNewPlaceholderDesc("");
  };

  const handleRemoveCustomPlaceholder = (key: string) => {
    setCustomPlaceholders(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSaveCustomPlaceholders = async () => {
    if (!selectedDeedType) {
      toast.error("Please select a deed type first");
      return;
    }

    const { error } = await supabase
      .from("deed_templates")
      .update({ custom_placeholders: customPlaceholders })
      .eq("deed_type", selectedDeedType);

    if (error) {
      console.error("Error saving custom placeholders:", error);
      toast.error("Failed to save custom placeholders");
      return;
    }

    toast.success("Custom placeholders saved successfully");
    await loadDeedTemplates();
  };

  const loadApprovalRequests = async () => {
    const { data, error } = await supabase
      .from("approval_requests" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading approval requests:", error);
      return;
    }

    setApprovalRequests((data as unknown as ApprovalRequest[]) || []);
  };

  const handleApproveRequest = async (request: ApprovalRequest) => {
    try {
      if (request.request_type === "delete") {
        // Delete the template
        const { error: deleteError } = await supabase
          .from("document_templates")
          .delete()
          .eq("id", request.template_id);

        if (deleteError) throw deleteError;
        
        toast.success("Template deleted successfully");
      } else if (request.request_type === "download") {
        // For download, fetch and download the file
        const { data: template, error: fetchError } = await supabase
          .from("document_templates")
          .select("file_data, file_name")
          .eq("id", request.template_id)
          .single();

        if (fetchError) throw fetchError;

        // Convert hex string to binary and download
        if (template.file_data) {
          const hexString = template.file_data.replace('\\x', '');
          const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
          const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = template.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        
        toast.success("Download approved and file downloaded");
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("approval_requests" as any)
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", request.id);

      if (updateError) throw updateError;

      await loadApprovalRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("approval_requests" as any)
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request rejected");
      await loadApprovalRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary text-primary-foreground py-8 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="h-10 w-10" />
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight">Admin Panel - Techverse</h1>
                <p className="text-primary-foreground/90 mt-2">Manage Deed Templates & History of Title</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 relative"
                onClick={() => setShowApprovalsDialog(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approvals
                {approvalRequests.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 px-2 py-0.5 text-xs"
                  >
                    {approvalRequests.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* Add New Deed Type */}
        <Card className="shadow-legal border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Manage Deed Types
            </CardTitle>
            <CardDescription>
              Create and manage deed types that can be used in documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newDeedType">Deed Type Name</Label>
                <Input
                  id="newDeedType"
                  value={newDeedType}
                  onChange={(e) => setNewDeedType(e.target.value)}
                  placeholder="e.g., Trust Deed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDeedDescription">Description (Optional)</Label>
                <Input
                  id="newDeedDescription"
                  value={newDeedDescription}
                  onChange={(e) => setNewDeedDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
            </div>
            <Button onClick={handleAddDeedType} className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Add Deed Type
            </Button>

            {/* Existing Deed Types List */}
            {deedTemplates.length > 0 && (
              <div className="space-y-2 mt-6">
                <Label>Existing Deed Types</Label>
                <div className="border rounded-lg divide-y">
                  {deedTemplates.map((template) => (
                    <div key={template.deed_type} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{template.deed_type}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDeedType(template.deed_type)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deed Preview Template Editor */}
        <Card className="shadow-legal border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Deed Preview Template Editor
            </CardTitle>
            <CardDescription>
              Customize how deeds are displayed in the preview. Use placeholders like {"{deedType}"}, {"{executedBy}"}, {"{inFavourOf}"}, {"{date}"}, {"{documentNumber}"}, {"{natureOfDoc}"}, {"{extent}"}, {"{surveyNo}"} that will be replaced with actual deed data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="previewDeedTypeSelect">Select Deed Type</Label>
              <Select value={selectedDeedType} onValueChange={handleDeedTypeChange}>
                <SelectTrigger id="previewDeedTypeSelect">
                  <SelectValue placeholder="Choose a deed type to edit preview" />
                </SelectTrigger>
                <SelectContent>
                  {deedTemplates.map((template) => (
                    <SelectItem key={template.deed_type} value={template.deed_type}>
                      {template.deed_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDeedType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="previewTemplate">Preview Template</Label>
                  <Textarea
                    id="previewTemplate"
                    value={previewTemplate}
                    onChange={(e) => setPreviewTemplate(e.target.value)}
                    placeholder="{deedType} executed by {executedBy} in favour of {inFavourOf}"
                    className="min-h-[100px] font-mono"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Available Placeholders:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>{"{deedType}"}</code> - Type of the deed</li>
                    <li><code>{"{executedBy}"}</code> - Name of the person executing the deed</li>
                    <li><code>{"{inFavourOf}"}</code> - Name of the person in whose favor the deed is executed</li>
                    <li><code>{"{date}"}</code> - Date of the deed</li>
                    <li><code>{"{documentNumber}"}</code> - Document registration number</li>
                    <li><code>{"{natureOfDoc}"}</code> - Nature of the document</li>
                    <li><code>{"{extent}"}</code> - Extent/area of the property</li>
                    <li><code>{"{surveyNo}"}</code> - Survey number of the property</li>
                  </ul>
                </div>

                <Button onClick={handleSavePreviewTemplate} className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preview Template
                </Button>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Preview Example:</h4>
                  <p className="text-sm">
                    {previewTemplate
                      .replace(/{deedType}/g, selectedDeedType)
                      .replace(/{executedBy}/g, "John Doe")
                      .replace(/{inFavourOf}/g, "Jane Smith")
                      .replace(/{date}/g, "2025-01-15")
                      .replace(/{documentNumber}/g, "REG/2025/001")
                      .replace(/{natureOfDoc}/g, "Original")}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* History of Title Template Editor */}
        <Card className="shadow-legal">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              History of Title Template Editor
            </CardTitle>
            <CardDescription>
              Define template content for each deed type. Use placeholders like {"{executedBy}"}, {"{inFavourOf}"}, {"{date}"}, {"{documentNumber}"} that will be replaced with actual deed data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deedTypeSelect">Select Deed Type</Label>
              <Select value={selectedDeedType} onValueChange={handleDeedTypeChange}>
                <SelectTrigger id="deedTypeSelect">
                  <SelectValue placeholder="Choose a deed type to edit" />
                </SelectTrigger>
                <SelectContent>
                  {deedTemplates.map((template) => (
                    <SelectItem key={template.deed_type} value={template.deed_type}>
                      {template.deed_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDeedType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="historyTemplate">Template Content</Label>
                  <Textarea
                    id="historyTemplate"
                    value={historyTemplate}
                    onChange={(e) => setHistoryTemplate(e.target.value)}
                    placeholder={`Example:\nThis property was acquired through a ${selectedDeedType} executed by {executedBy} in favour of {inFavourOf} dated {date} with document number {documentNumber}.`}
                    className="min-h-[200px] font-mono"
                  />
                </div>

                {/* Custom Placeholders Section */}
                <div className="space-y-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Custom Placeholders for {selectedDeedType}</h4>
                    <Button onClick={handleSaveCustomPlaceholders} size="sm" className="bg-accent hover:bg-accent/90">
                      <Save className="mr-2 h-3 w-3" />
                      Save Placeholders
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="placeholderKey">Placeholder Key</Label>
                      <Input
                        id="placeholderKey"
                        value={newPlaceholderKey}
                        onChange={(e) => setNewPlaceholderKey(e.target.value)}
                        placeholder="e.g., saleAmount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeholderDesc">Description</Label>
                      <Input
                        id="placeholderDesc"
                        value={newPlaceholderDesc}
                        onChange={(e) => setNewPlaceholderDesc(e.target.value)}
                        placeholder="e.g., Sale amount in rupees"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleAddCustomPlaceholder} size="sm" variant="outline">
                    <Plus className="mr-2 h-3 w-3" />
                    Add Custom Placeholder
                  </Button>

                  {Object.keys(customPlaceholders).length > 0 && (
                    <div className="space-y-2">
                      <Label>Defined Custom Placeholders:</Label>
                      <div className="space-y-1">
                        {Object.entries(customPlaceholders).map(([key, desc]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-background rounded border">
                            <div>
                              <code className="text-sm font-mono">{`{${key}}`}</code>
                              {desc && <span className="text-xs text-muted-foreground ml-2">- {desc}</span>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCustomPlaceholder(key)}
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Available Standard Placeholders:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>{"{executedBy}"}</code> - Name of the person executing the deed</li>
                    <li><code>{"{inFavourOf}"}</code> - Name of the person in whose favor the deed is executed</li>
                    <li><code>{"{date}"}</code> - Date of the deed</li>
                    <li><code>{"{documentNumber}"}</code> - Document registration number</li>
                    <li><code>{"{deedType}"}</code> - Type of the deed (e.g., Sale Deed)</li>
                    <li><code>{"{natureOfDoc}"}</code> - Nature of the document</li>
                  </ul>
                </div>

                <Button onClick={handleSaveHistoryTemplate} className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  Save History of Title Template
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        {selectedDeedType && historyTemplate && (
          <Card className="shadow-legal border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Example output with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">
                  {historyTemplate
                    .replace(/{executedBy}/g, "John Doe")
                    .replace(/{inFavourOf}/g, "Jane Smith")
                    .replace(/{date}/g, "2025-01-15")
                    .replace(/{documentNumber}/g, "REG/2025/001")
                    .replace(/{deedType}/g, selectedDeedType)
                    .replace(/{natureOfDoc}/g, "Original")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Approvals Dialog */}
      <Dialog open={showApprovalsDialog} onOpenChange={setShowApprovalsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Approval Requests ({approvalRequests.length})
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject template operations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {approvalRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No pending approval requests</p>
              </div>
            ) : (
              approvalRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        request.request_type === "delete" 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {request.request_type.toUpperCase()}
                      </span>
                      <span className="font-semibold">{request.template_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      File: {request.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested by: {request.requested_by || "Unknown"} • {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTechverse;
