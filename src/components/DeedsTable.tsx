import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DeedCustomFields from "./DeedCustomFields";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
export interface Deed {
  id: string;
  deed_type: string;
  executed_by: string;
  in_favour_of: string;
  date: string;
  document_number: string;
  nature_of_doc: string;
  custom_fields?: Record<string, string> | any;
  table_type?: string;
}

interface DeedTemplate {
  deed_type: string;
  preview_template: string | null;
  custom_placeholders?: Record<string, string> | any;
}

interface DeedsTableProps {
  sectionTitle?: string;
  tableType?: string;
  copyFromTableType?: string; // Table type to copy from
}

const DeedsTable = ({ sectionTitle = "Description of Documents Scrutinized", tableType = "table", copyFromTableType }: DeedsTableProps) => {
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [deedTemplates, setDeedTemplates] = useState<DeedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const updateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize auth state and subscribe to changes
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user ?? null));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Load data and subscribe for current user OR anonymous
  useEffect(() => {
    const userId = currentUser?.id || '00000000-0000-0000-0000-000000000000';
    loadDeedTemplates();
    loadDeeds();
    const cleanup = setupRealtimeSubscription(userId);
    return cleanup;
  }, [currentUser]);
  const loadDeeds = async () => {
    // Ensure we only load deeds for current user and table type
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || '00000000-0000-0000-0000-000000000000';

    const query = supabase
      .from("deeds")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    
    // Only the first table (tableType="table") should include null values for backward compatibility
    // All other tables should only show their specific table_type
    let data, error;
    if (tableType === "table") {
      ({ data, error } = await query.or(`table_type.eq.${tableType},table_type.is.null`));
    } else {
      ({ data, error } = await query.eq("table_type", tableType));
    }

    if (error) {
      console.error("Error loading deeds:", error);
      toast.error("Failed to load deeds");
      return;
    }

    // For the first table, filter to include both 'table' and null values
    // For other tables, only include the specific table_type
    const filteredData = (data || []).filter(deed => {
      if (tableType === "table") {
        return (deed as any).table_type === tableType || !(deed as any).table_type;
      }
      return (deed as any).table_type === tableType;
    });

    setDeeds(filteredData);
    setLoading(false);
  };

  const loadDeedTemplates = async () => {
    const { data, error } = await supabase
      .from("deed_templates")
      .select("deed_type, preview_template, custom_placeholders")
      .order("deed_type");

    if (error) {
      console.error("Error loading deed templates:", error);
      return;
    }

    setDeedTemplates(data || []);
  };

  const setupRealtimeSubscription = (userId: string) => {
    const channel = supabase
      .channel(`deeds-changes-${tableType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deeds",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deed = payload.new as Deed;
          const deedTableType = (deed as any).table_type;
          
          // Only process events for deeds that belong to this table
          // For the main table, accept both 'table' and null values
          // For other tables, only accept exact matches
          const shouldInclude = tableType === "table" 
            ? (deedTableType === tableType || !deedTableType)
            : deedTableType === tableType;

          if (!shouldInclude && payload.eventType !== "DELETE") {
            return;
          }

          if (payload.eventType === "INSERT") {
            if (shouldInclude) {
              setDeeds((prev) => [...prev, deed]);
            }
          } else if (payload.eventType === "UPDATE") {
            setDeeds((prev) =>
              prev.map((d) =>
                d.id === deed.id ? deed : d
              ).filter(d => {
                const tableTypeCheck = (d as any).table_type;
                return tableType === "table" 
                  ? (tableTypeCheck === tableType || !tableTypeCheck)
                  : tableTypeCheck === tableType;
              })
            );
          } else if (payload.eventType === "DELETE") {
            setDeeds((prev) => prev.filter((deed) => deed.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddDeed = async () => {
    // Get current user or use anonymous user ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    const newDeed = {
      deed_type: "",
      executed_by: "",
      in_favour_of: "",
      date: new Date().toISOString().split("T")[0],
      document_number: "",
      nature_of_doc: "",
      table_type: tableType,
      user_id: userId,
      custom_fields: {
        extent: "",
        surveyNo: ""
      }
    };

    const { error } = await supabase.from("deeds").insert(newDeed);

    if (error) {
      console.error("Error adding deed:", error);
      toast.error(`Failed to add deed: ${error.message}`);
    } else {
      toast.success("Deed added");
    }
  };
  const handleRemoveDeed = async (id: string) => {
    const { error } = await supabase.from("deeds").delete().eq("id", id);

    if (error) {
      console.error("Error removing deed:", error);
      toast.error("Failed to remove deed");
    }
  };

  const handleCopyFromPreviousTable = async () => {
    if (!copyFromTableType) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      // Fetch deeds from the source table
      // Handle the main table which can have null or 'table' as table_type
      let query = supabase
        .from("deeds")
        .select("*")
        .eq("user_id", userId);
      
      if (copyFromTableType === 'table') {
        query = query.or(`table_type.eq.${copyFromTableType},table_type.is.null`);
      } else {
        query = query.eq("table_type", copyFromTableType);
      }
      
      const { data: sourceDeedsData, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!sourceDeedsData || sourceDeedsData.length === 0) {
        toast.info("No deeds found in the source table to copy");
        return;
      }
      
      // Create new deeds with the current table_type
      const newDeeds = sourceDeedsData.map(deed => ({
        deed_type: deed.deed_type,
        executed_by: deed.executed_by,
        in_favour_of: deed.in_favour_of,
        date: deed.date,
        document_number: deed.document_number,
        nature_of_doc: deed.nature_of_doc,
        custom_fields: deed.custom_fields,
        table_type: tableType,
        user_id: userId
      }));
      
      const { error: insertError } = await supabase
        .from("deeds")
        .insert(newDeeds);
      
      if (insertError) throw insertError;
      
      toast.success(`Copied ${newDeeds.length} deed(s) successfully`);
    } catch (error) {
      console.error("Error copying deeds:", error);
      toast.error("Failed to copy deeds from previous table");
    }
  };



  const handleUpdateDeed = useCallback((id: string, field: keyof Deed, value: string | Record<string, string>) => {
    // Update local state immediately for responsive UI
    setDeeds((prev) =>
      prev.map((deed) =>
        deed.id === id ? { ...deed, [field]: value } : deed
      )
    );

    // Clear any existing timeout for this field
    const timeoutKey = `${id}-${field}`;
    if (updateTimeouts.current[timeoutKey]) {
      clearTimeout(updateTimeouts.current[timeoutKey]);
    }

    // Debounce the database update
    updateTimeouts.current[timeoutKey] = setTimeout(async () => {
      const { error } = await supabase
        .from("deeds")
        .update({ [field]: value })
        .eq("id", id);

      if (error) {
        console.error("Error updating deed:", error);
        toast.error("Failed to update deed");
      }
    }, 500); // Wait 500ms after user stops typing
  }, []);

  const handleCustomFieldChange = useCallback((deedId: string, fieldKey: string, value: string) => {
    // Update local state immediately
    setDeeds((prev) =>
      prev.map((deed) =>
        deed.id === deedId
          ? { ...deed, custom_fields: { ...(deed.custom_fields as Record<string, string> || {}), [fieldKey]: value } }
          : deed
      )
    );

    // Debounce the database update
    const timeoutKey = `${deedId}-custom_fields`;
    if (updateTimeouts.current[timeoutKey]) {
      clearTimeout(updateTimeouts.current[timeoutKey]);
    }

    updateTimeouts.current[timeoutKey] = setTimeout(async () => {
      // Get the updated deed's custom fields
      const deed = deeds.find(d => d.id === deedId);
      if (!deed) return;

      const updatedCustomFields = { ...(deed.custom_fields as Record<string, string> || {}), [fieldKey]: value };

      const { error } = await supabase
        .from("deeds")
        .update({ custom_fields: updatedCustomFields })
        .eq("id", deedId);

      if (error) {
        console.error("Error updating custom field:", error);
        toast.error("Failed to update custom field");
      }
    }, 500);
  }, [deeds]);

  const getPreviewTemplate = (deedType: string): string => {
    const template = deedTemplates.find((t) => t.deed_type === deedType);
    return template?.preview_template || "{deedType} executed by {executedBy} in favour of {inFavourOf}";
  };

  const generatePreview = (deed: Deed): string => {
    const template = getPreviewTemplate(deed.deed_type);
    let preview = template
      .replace(/{deedType}/g, deed.deed_type)
      .replace(/{executedBy}/g, deed.executed_by)
      .replace(/{inFavourOf}/g, deed.in_favour_of)
      .replace(/{date}/g, deed.date)
      .replace(/{documentNumber}/g, deed.document_number)
      .replace(/{natureOfDoc}/g, deed.nature_of_doc)
      .replace(/{extent}/g, deed.custom_fields?.extent || "")
      .replace(/{surveyNo}/g, deed.custom_fields?.surveyNo || "");
    
    // Replace any other custom fields
    if (deed.custom_fields && typeof deed.custom_fields === 'object') {
      Object.entries(deed.custom_fields).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        preview = preview.replace(regex, String(value || ""));
      });
    }
    
    return preview;
  };

  const deedTypes = deedTemplates.map((t) => t.deed_type);

  return (
    <Card className="shadow-legal">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <CardTitle className="text-legal-header">{sectionTitle}</CardTitle>
          </div>
          {copyFromTableType && (
            <Button
              onClick={handleCopyFromPreviousTable}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Copy from Previous Table
            </Button>
          )}
        </div>
        <CardDescription>Add deeds dynamically - each will generate: &quot;[Deed Type] executed by [Name] in favour of [Name]&quot;</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading deeds...</p>
          </div>
        ) : deeds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No deeds added yet. Click "Add New Deed" to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-sm font-semibold bg-muted">Sno</th>
                  <th className="p-3 text-left text-sm font-semibold bg-muted">Date</th>
                  <th className="p-3 text-left text-sm font-semibold bg-muted">D.No</th>
                  <th className="p-3 text-left text-sm font-semibold bg-muted">Particulars of Deed</th>
                  <th className="p-3 text-left text-sm font-semibold bg-muted">Nature of Doc</th>
                  <th className="p-3 text-center text-sm font-semibold bg-muted w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {deeds.map((deed, index) => (
                  <tr key={deed.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm font-medium">{index + 1}</td>
                    <td className="p-3">
                      <Input
                        type="date"
                        value={deed.date}
                        onChange={(e) => handleUpdateDeed(deed.id, "date", e.target.value)}
                        className="transition-all duration-200"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={deed.document_number}
                        onChange={(e) => handleUpdateDeed(deed.id, "document_number", e.target.value)}
                        placeholder="Document Number"
                        className="transition-all duration-200"
                      />
                    </td>
                    <td className="p-3">
                      <div className="space-y-3">
                        <Select value={deed.deed_type} onValueChange={(value) => handleUpdateDeed(deed.id, "deed_type", value)}>
                          <SelectTrigger className="transition-all duration-200">
                            <SelectValue placeholder="Select deed type" />
                          </SelectTrigger>
                          <SelectContent>
                            {deedTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={deed.executed_by}
                            onChange={(e) => handleUpdateDeed(deed.id, "executed_by", e.target.value)}
                            placeholder="Executed by"
                            className="transition-all duration-200"
                          />
                          <Input
                            value={deed.in_favour_of}
                            onChange={(e) => handleUpdateDeed(deed.id, "in_favour_of", e.target.value)}
                            placeholder="In favour of"
                            className="transition-all duration-200"
                          />
                        </div>
                        {deed.deed_type && deed.executed_by && deed.in_favour_of && (
                          <div className="p-2 bg-muted rounded text-sm">
                            <strong>Preview:</strong> {generatePreview(deed)}
                          </div>
                        )}
                        <DeedCustomFields
                          customPlaceholders={deed.deed_type ? (deedTemplates.find(t => t.deed_type === deed.deed_type)?.custom_placeholders || {}) : {}}
                          customValues={deed.custom_fields || {}}
                          onCustomValueChange={(key, value) => handleCustomFieldChange(deed.id, key, value)}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <Select 
                        value={deed.nature_of_doc} 
                        onValueChange={(value) => handleUpdateDeed(deed.id, "nature_of_doc", value)}
                      >
                        <SelectTrigger className="transition-all duration-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Original">Original</SelectItem>
                          <SelectItem value="Xerox">Xerox</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDeed(deed.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Button
          onClick={handleAddDeed}
          className="w-full bg-primary hover:bg-primary/90 shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Deed
        </Button>
      </CardContent>
    </Card>
  );
};

export default DeedsTable;
