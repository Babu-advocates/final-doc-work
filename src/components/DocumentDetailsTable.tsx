import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface DocumentDetail {
  id: string;
  docNo: string;
  surveyNo: string;
  asPerRevenueRecord: string;
  totalExtent: string;
  plotNo: string;
  location: string;
  northBy: string;
  southBy: string;
  eastBy: string;
  westBy: string;
  northMeasurement: string;
  southMeasurement: string;
  eastMeasurement: string;
  westMeasurement: string;
  totalExtentSqFt: string;
  customMeasurements?: Record<string, string>;
}

interface DocumentDetailsTableProps {
  documents: DocumentDetail[];
  onDocumentsChange: (documents: DocumentDetail[]) => void;
}

const DocumentDetailsTable = ({ documents, onDocumentsChange }: DocumentDetailsTableProps) => {
  const [currentDoc, setCurrentDoc] = useState<Partial<DocumentDetail>>({
    docNo: "",
    surveyNo: "",
    asPerRevenueRecord: "",
    totalExtent: "",
    plotNo: "",
    location: "",
    northBy: "",
    southBy: "",
    eastBy: "",
    westBy: "",
    northMeasurement: "",
    southMeasurement: "",
    eastMeasurement: "",
    westMeasurement: "",
    totalExtentSqFt: "",
    customMeasurements: {},
  });
  
  const [customFields, setCustomFields] = useState<Array<{ id: string; label: string; value: string }>>([]);

  const handleInputChange = (field: keyof DocumentDetail, value: string) => {
    setCurrentDoc(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { id: crypto.randomUUID(), label: "", value: "" }]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  const handleCustomFieldChange = (id: string, type: 'label' | 'value', value: string) => {
    setCustomFields(prev => prev.map(field => 
      field.id === id ? { ...field, [type]: value } : field
    ));
  };

  const handleAddDocument = () => {
    if (!currentDoc.surveyNo) {
      toast.error("Survey No is required");
      return;
    }

    // Build custom measurements from customFields
    const customMeasurements: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.label && field.value) {
        customMeasurements[field.label] = field.value;
      }
    });

    const newDoc: DocumentDetail = {
      id: crypto.randomUUID(),
      docNo: currentDoc.docNo || "",
      surveyNo: currentDoc.surveyNo || "",
      asPerRevenueRecord: currentDoc.asPerRevenueRecord || "",
      totalExtent: currentDoc.totalExtent || "",
      plotNo: currentDoc.plotNo || "",
      location: currentDoc.location || "",
      northBy: currentDoc.northBy || "",
      southBy: currentDoc.southBy || "",
      eastBy: currentDoc.eastBy || "",
      westBy: currentDoc.westBy || "",
      northMeasurement: currentDoc.northMeasurement || "",
      southMeasurement: currentDoc.southMeasurement || "",
      eastMeasurement: currentDoc.eastMeasurement || "",
      westMeasurement: currentDoc.westMeasurement || "",
      totalExtentSqFt: currentDoc.totalExtentSqFt || "",
      customMeasurements,
    };

    onDocumentsChange([...documents, newDoc]);
    setCurrentDoc({
      docNo: "",
      surveyNo: "",
      asPerRevenueRecord: "",
      totalExtent: "",
      plotNo: "",
      location: "",
      northBy: "",
      southBy: "",
      eastBy: "",
      westBy: "",
      northMeasurement: "",
      southMeasurement: "",
      eastMeasurement: "",
      westMeasurement: "",
      totalExtentSqFt: "",
      customMeasurements: {},
    });
    setCustomFields([]);
    toast.success("Document added successfully");
  };

  const handleDeleteDocument = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id));
    toast.success("Document removed");
  };

  return (
    <Card className="shadow-legal border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-legal-header">
          <FileText className="h-5 w-5 text-primary" />
          Description of Property ({documents.length})
        </CardTitle>
        <CardDescription>
          Add property details including survey information, boundaries, and measurements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="docNo">As per Doc No</Label>
            <Input
              id="docNo"
              placeholder="Enter Document Number"
              value={currentDoc.docNo}
              onChange={(e) => handleInputChange("docNo", e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surveyNo">Survey No *</Label>
              <Input
                id="surveyNo"
                placeholder="Enter Survey No"
                value={currentDoc.surveyNo}
                onChange={(e) => handleInputChange("surveyNo", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="asPerRevenueRecord">As per Revenue Record</Label>
              <Input
                id="asPerRevenueRecord"
                placeholder="Enter Revenue Record"
                value={currentDoc.asPerRevenueRecord}
                onChange={(e) => handleInputChange("asPerRevenueRecord", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalExtent">Total Extent</Label>
              <Input
                id="totalExtent"
                placeholder="Enter Total Extent"
                value={currentDoc.totalExtent}
                onChange={(e) => handleInputChange("totalExtent", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plotNo">Plot No</Label>
              <Input
                id="plotNo"
                placeholder="Enter Plot No"
                value={currentDoc.plotNo}
                onChange={(e) => handleInputChange("plotNo", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location (name of place, village, city, registration, sub-district etc.)</Label>
              <Input
                id="location"
                placeholder="Enter location details"
                value={currentDoc.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 space-y-6">
            <div>
              <h4 className="font-semibold mb-3">i) Boundaries for {"{Total Extent}"} Sq.Ft of land</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="northBy">North By - ({currentDoc.northBy || "North By"})</Label>
                  <Input
                    id="northBy"
                    placeholder="Enter North boundary"
                    value={currentDoc.northBy}
                    onChange={(e) => handleInputChange("northBy", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="southBy">South By - ({currentDoc.southBy || "South By"})</Label>
                  <Input
                    id="southBy"
                    placeholder="Enter South boundary"
                    value={currentDoc.southBy}
                    onChange={(e) => handleInputChange("southBy", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eastBy">East By - ({currentDoc.eastBy || "East By"})</Label>
                  <Input
                    id="eastBy"
                    placeholder="Enter East boundary"
                    value={currentDoc.eastBy}
                    onChange={(e) => handleInputChange("eastBy", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="westBy">West By - ({currentDoc.westBy || "West By"})</Label>
                  <Input
                    id="westBy"
                    placeholder="Enter West boundary"
                    value={currentDoc.westBy}
                    onChange={(e) => handleInputChange("westBy", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Measurement Details</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Label>North</Label>
                  <Input
                    id="northMeasurement"
                    placeholder="Enter measurement"
                    value={currentDoc.northMeasurement}
                    onChange={(e) => handleInputChange("northMeasurement", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Label>South</Label>
                  <Input
                    id="southMeasurement"
                    placeholder="Enter measurement"
                    value={currentDoc.southMeasurement}
                    onChange={(e) => handleInputChange("southMeasurement", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Label>East</Label>
                  <Input
                    id="eastMeasurement"
                    placeholder="Enter measurement"
                    value={currentDoc.eastMeasurement}
                    onChange={(e) => handleInputChange("eastMeasurement", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Label>West</Label>
                  <Input
                    id="westMeasurement"
                    placeholder="Enter measurement"
                    value={currentDoc.westMeasurement}
                    onChange={(e) => handleInputChange("westMeasurement", e.target.value)}
                  />
                </div>

                {/* Custom Measurement Fields */}
                {customFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
                    <Input
                      placeholder="Enter label (e.g., Southwest)"
                      value={field.label}
                      onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter measurement"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Custom Field Button */}
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomField}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Field
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Label>Total</Label>
                  <Input
                    id="totalExtentSqFt"
                    placeholder="Enter Total Extent in Sq.Ft"
                    value={currentDoc.totalExtentSqFt}
                    onChange={(e) => handleInputChange("totalExtentSqFt", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleAddDocument} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Added Documents</h3>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg bg-background hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">Document {index + 1}</span>
                      <span className="text-sm text-muted-foreground">Survey No: {doc.surveyNo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {doc.asPerRevenueRecord && <div>Revenue: {doc.asPerRevenueRecord}</div>}
                      {doc.totalExtent && <div>Extent: {doc.totalExtent}</div>}
                      {doc.plotNo && <div>Plot: {doc.plotNo}</div>}
                      {doc.location && <div className="col-span-2">Location: {doc.location}</div>}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteDocument(doc.id)}
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
  );
};

export default DocumentDetailsTable;
