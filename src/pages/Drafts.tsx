import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2, ArrowLeft, Scale, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Draft {
  id: string;
  draft_name: string;
  template_id: string;
  created_at: string;
  updated_at: string;
  placeholders: Record<string, string>;
  documents: any[];
  deeds: any[];
}

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("userLoggedIn");
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    
    loadDrafts();
  }, [navigate]);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDrafts((data as any) || []);
    } catch (error) {
      console.error("Error loading drafts:", error);
      toast.error("Failed to load drafts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDraft = (draft: Draft) => {
    navigate("/work", { 
      state: { 
        templateId: draft.template_id,
        draftId: draft.id,
        draftData: {
          placeholders: draft.placeholders,
          documents: draft.documents,
          deeds: draft.deeds || []
        }
      } 
    });
  };

  const handleDeleteDraft = async (draftId: string, draftName: string) => {
    if (!confirm(`Are you sure you want to delete "${draftName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;

      toast.success("Draft deleted successfully");
      loadDrafts();
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
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
            <Button 
              variant="outline"
              onClick={() => navigate("/templates")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Your Drafts</h2>
          <p className="text-muted-foreground mt-1">View and manage your saved drafts</p>
        </div>

        {/* Drafts Content */}
        <Card className="border-border">
          <CardContent className="p-12">
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="animate-pulse">Loading drafts...</div>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No drafts yet</h3>
                <p className="text-muted-foreground mb-6">Start working on a template and save it as a draft</p>
                <Button 
                  onClick={() => navigate("/templates")}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Templates
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{draft.draft_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {Object.keys(draft.placeholders || {}).length} fields filled
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Saved {format(new Date(draft.created_at), "PPP")}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDraft(draft)}
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open Draft
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id, draft.draft_name)}
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
      </main>
    </div>
  );
};

export default Drafts;
