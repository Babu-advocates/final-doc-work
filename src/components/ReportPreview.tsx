import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { Deed } from "./DeedsTable";
import { DocumentDetail } from "./DocumentDetailsTable";
import { supabase } from "@/integrations/supabase/client";

interface ReportPreviewProps {
  placeholders: Record<string, string>;
  deeds: Deed[];
  deedsTable2?: Deed[];
  deedsTable3?: Deed[];
  deedsTable4?: Deed[];
  templateContent: string;
  documents?: DocumentDetail[];
}
const ReportPreview = ({
  placeholders,
  deeds,
  deedsTable2 = [],
  deedsTable3 = [],
  deedsTable4 = [],
  templateContent,
  documents = []
}: ReportPreviewProps) => {
  const [historyContent, setHistoryContent] = useState<string>("");
  useEffect(() => {
    generateHistoryOfTitle();
  }, [deeds]);
  const generateHistoryOfTitle = async () => {
    try {
      const deedsWithType = deeds.filter(d => d.deed_type);
      
      if (deedsWithType.length === 0) {
        setHistoryContent("");
        return;
      }

      // Fetch all templates once for efficiency
      const { data: templates, error } = await supabase
        .from("history_of_title_templates")
        .select("deed_type, template_content");

      if (error) {
        console.error("Error fetching history templates:", error);
        setHistoryContent("");
        return;
      }

      const templateMap = new Map<string, string>();
      (templates || []).forEach((t: any) => {
        if (t?.deed_type && t?.template_content) {
          templateMap.set(String(t.deed_type).trim().toLowerCase(), t.template_content);
        }
      });

      const historyParts: string[] = [];

      deedsWithType.forEach((deed) => {
        const key = String(deed.deed_type).trim().toLowerCase();
        const template = templateMap.get(key);

        if (template) {
          let historyText = template
            .replace(/{executedBy}/gi, deed.executed_by || "")
            .replace(/{inFavourOf}/gi, deed.in_favour_of || "")
            .replace(/{date}/gi, deed.date || "")
            .replace(/{documentNumber}/gi, deed.document_number || "")
            .replace(/{deedType}/gi, deed.deed_type || "")
            .replace(/{natureOfDoc}/gi, deed.nature_of_doc || "");

          // Replace custom field placeholders
          if (deed.custom_fields && typeof deed.custom_fields === "object") {
            Object.entries(deed.custom_fields).forEach(([key, value]) => {
              const regex = new RegExp(`\\{${key}\\}`, "gi");
              historyText = historyText.replace(regex, String(value ?? ""));
            });
          }

          historyParts.push(historyText.trim());
        } else {
          // Fallback: create a basic entry when no template exists
          const fallbackText = `${deed.deed_type.toUpperCase()}:\n` +
            `Deed executed by ${deed.executed_by || '[Executor]'} in favour of ${deed.in_favour_of || '[Beneficiary]'} ` +
            `dated ${deed.date || '[Date]'}, Document No: ${deed.document_number || '[Doc No]'}` +
            (deed.nature_of_doc ? `, Nature: ${deed.nature_of_doc}` : '');
          
          historyParts.push(fallbackText);
        }
      });

      setHistoryContent(historyParts.join("\n\n"));
    } catch (e) {
      console.error("Error building history:", e);
      setHistoryContent("");
    }
  };
  const replacePlaceholders = (text: string) => {
    let result = text;

    // Replace single-brace placeholders {key}
    Object.entries(placeholders).forEach(([key, value]) => {
      const val = value || '';
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    });

    // Replace {$history} with generated history content
    result = result.replace(/\{\$history\}/gi, historyContent || '(History of Title will appear here when deeds are added)');
    return result;
  };
  const generateDeedsTableForType = (deedsList: Deed[]) => {
    if (deedsList.length === 0) return null;
    const validDeeds = deedsList.filter(deed => deed.deed_type);
    if (validDeeds.length === 0) return null;
    return <div style={{ margin: '12pt 0' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          border: '1px solid #000',
          fontFamily: 'Cambria, Georgia, serif',
          fontSize: '12pt'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Sno</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>D.No</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Particulars of Deed</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Nature of Doc</th>
            </tr>
          </thead>
          <tbody>
            {validDeeds.map((deed, index) => <tr key={deed.id}>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{index + 1}</td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{deed.date || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{deed.document_number || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>
                  {deed.deed_type} executed by <strong>{deed.executed_by}</strong> in favour of <strong>{deed.in_favour_of}</strong>
                </td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{deed.nature_of_doc || '-'}</td>
              </tr>)}
          </tbody>
        </table>
      </div>;
  };

  const generateDeedsTable = () => {
    if (deeds.length === 0) return null;
    const validDeeds = deeds.filter(deed => deed.deed_type);
    if (validDeeds.length === 0) return null;
    return <div style={{ margin: '12pt 0' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          border: '1px solid #000',
          fontFamily: 'Cambria, Georgia, serif',
          fontSize: '12pt'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Sno</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>D.No</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Particulars of Deed</th>
              <th style={{ border: '1px solid #000', padding: '6pt', textAlign: 'left', fontWeight: 'bold' }}>Nature of Doc</th>
            </tr>
          </thead>
          <tbody>
            {validDeeds.map((deed, index) => <tr key={deed.id}>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{index + 1}</td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{deed.date || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{deed.document_number || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>
                  {deed.deed_type} executed by <strong>{deed.executed_by}</strong> in favour of <strong>{deed.in_favour_of}</strong>
                </td>
                <td style={{ border: '1px solid #000', padding: '6pt' }}>{deed.nature_of_doc || '-'}</td>
              </tr>)}
          </tbody>
        </table>
      </div>;
  };

  const generateDocumentDetailsTable = (sectionTitle: string, docsToShow: DocumentDetail[] = documents) => {
    
    const tableStyle = {
      width: '100%',
      borderCollapse: 'collapse' as const,
      border: '1px solid #000',
      fontFamily: 'Cambria, Georgia, serif',
      fontSize: '12pt',
      marginBottom: '12pt'
    };
    
    const cellStyle = {
      border: '1px solid #000',
      padding: '20pt 15pt',
      minHeight: '60pt',
      verticalAlign: 'top',
      lineHeight: '1.8'
    };
    
    return (
      <div style={{ margin: '18pt 0' }}>
        <h2 style={{ 
          fontWeight: 'bold', 
          fontSize: '14pt', 
          textAlign: 'center',
          marginBottom: '18pt',
          fontFamily: 'Cambria, Georgia, serif',
          textDecoration: 'underline'
        }}>
        {sectionTitle}
        </h2>
        {docsToShow.length === 0 ? (
          <div style={{ 
            margin: '12pt 0', 
            padding: '12pt', 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            backgroundColor: '#f9f9f9', 
            textAlign: 'center',
            fontFamily: 'Cambria, Georgia, serif',
            fontSize: '12pt',
            color: '#666'
          }}>
            <p style={{ fontStyle: 'italic' }}>Document details will appear here when you add them using the form above</p>
          </div>
        ) : (
          docsToShow.map((doc, docIndex) => (
          <div key={doc.id} style={{ marginBottom: docIndex < docsToShow.length - 1 ? '24pt' : '0' }}>
            <h3 style={{ 
              fontWeight: 'bold', 
              fontSize: '12pt', 
              textAlign: 'center',
              marginBottom: '12pt',
              fontFamily: 'Cambria, Georgia, serif'
            }}>
              As per Doc No : {doc.docNo || '(As per Doc.No)'}
            </h3>
            
            {/* Main Details Table - 3 columns */}
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, width: '48px' }}>i</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Survey No</td>
                  <td style={cellStyle}>{doc.surveyNo || '(Survey No)'}</td>
                </tr>
                <tr>
                  <td style={cellStyle}>ii</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>As per Revenue Record</td>
                  <td style={cellStyle}>{doc.asPerRevenueRecord || '(As per Revenue Record)'}</td>
                </tr>
                <tr>
                  <td style={cellStyle}>iii</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Total Extent</td>
                  <td style={cellStyle}>{doc.totalExtent || '(Total Extent)'}</td>
                </tr>
                <tr>
                  <td style={cellStyle}>iv</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Plot No</td>
                  <td style={cellStyle}>{doc.plotNo || '(Plot No)'}</td>
                </tr>
                <tr>
                  <td style={cellStyle}>v</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Location like name of the place, village, city, registration, sub-district etc.</td>
                  <td style={cellStyle}>{doc.location || '(Location like name of the place, village, city registration, sub-district etc.)'}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, padding: '20pt 15pt' }} colSpan={3}>
                    <div style={{ fontWeight: 'bold', marginBottom: '12pt', fontSize: '12pt' }}>i) <u>Boundaries for {doc.totalExtentSqFt || '(Total Extent)'} Sq.Ft of land</u></div>
                    <div style={{ marginBottom: '8pt', lineHeight: '1.5' }}><strong><u>North By</u></strong> - {doc.northBy || '(North By)'}</div>
                    <div style={{ marginBottom: '8pt', lineHeight: '1.5' }}><strong><u>South By</u></strong> - {doc.southBy || '(South By)'}</div>
                    <div style={{ marginBottom: '8pt', lineHeight: '1.5' }}><strong><u>East By</u></strong> - {doc.eastBy || '(East By)'}</div>
                    <div style={{ lineHeight: '1.5' }}><strong><u>West By</u></strong> - {doc.westBy || '(West By)'}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Measurement Details Table */}
            <h4 style={{ 
              fontWeight: 'bold', 
              fontSize: '12pt',
              marginBottom: '10pt',
              marginTop: '12pt',
              fontFamily: 'Cambria, Georgia, serif',
              textAlign: 'center',
              textDecoration: 'underline'
            }}>
              Measurement Details
            </h4>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', width: '50%', padding: '16pt 15pt' }}>North - East West</td>
                  <td style={{ ...cellStyle, textAlign: 'center', padding: '16pt 15pt' }}>{doc.northMeasurement || '30 ft'}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', padding: '16pt 15pt' }}>South - East West</td>
                  <td style={{ ...cellStyle, textAlign: 'center', padding: '16pt 15pt' }}>{doc.southMeasurement || '30 ft'}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', padding: '16pt 15pt' }}>East - South North</td>
                  <td style={{ ...cellStyle, textAlign: 'center', padding: '16pt 15pt' }}>{doc.eastMeasurement || '40 ft'}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', padding: '16pt 15pt' }}>West - South North</td>
                  <td style={{ ...cellStyle, textAlign: 'center', padding: '16pt 15pt' }}>{doc.westMeasurement || '40 ft'}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', padding: '16pt 15pt' }}>Total</td>
                  <td style={{ ...cellStyle, textAlign: 'center', padding: '16pt 15pt' }}>{doc.totalExtentSqFt || '1200 Sq.Ft'}</td>
                </tr>
                {doc.customMeasurements && Object.entries(doc.customMeasurements).map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', padding: '16pt 15pt' }}>{label}</td>
                    <td style={{ ...cellStyle, textAlign: 'center', padding: '16pt 15pt' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )))}
      </div>
    );
  };
  const previewContent = templateContent ? replacePlaceholders(templateContent) : "Upload a Word template to see the preview here...";
  
  const renderContentWithTables = () => {
    const lines = previewContent.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, lineIndex) => {
      // Check for table placeholders and insert tables
      if (line.includes('{table}') || line.includes('{{table}}')) {
        elements.push(
          <div key={`table-${lineIndex}`}>
            {generateDeedsTable()}
          </div>
        );
        return;
      }
      
      // {table1} - All documents
      if (line.includes('{table1}') || line.includes('{{table1}}')) {
        elements.push(
          <div key={`table1-${lineIndex}`}>
            {generateDocumentDetailsTable("Description of Property")}
          </div>
        );
        return;
      }
      
      // {table2} - First document only (or deeds from table2)
      if (line.includes('{table2}') || line.includes('{{table2}}')) {
        if (deedsTable2.length > 0) {
          // Show deeds table for table2
          elements.push(
            <div key={`table2-${lineIndex}`}>
              {generateDeedsTableForType(deedsTable2)}
            </div>
          );
        } else {
          // Fallback to first document
          const firstDoc = documents.length > 0 ? [documents[0]] : [];
          elements.push(
            <div key={`table2-${lineIndex}`}>
              {generateDocumentDetailsTable("Description of Documents Scrutinized 1", firstDoc)}
            </div>
          );
        }
        return;
      }
      
      // {table3} - Second document only (or deeds from table3)
      if (line.includes('{table3}') || line.includes('{{table3}}')) {
        if (deedsTable3.length > 0) {
          // Show deeds table for table3
          elements.push(
            <div key={`table3-${lineIndex}`}>
              {generateDeedsTableForType(deedsTable3)}
            </div>
          );
        } else {
          // Fallback to second document
          const secondDoc = documents.length > 1 ? [documents[1]] : [];
          elements.push(
            <div key={`table3-${lineIndex}`}>
              {generateDocumentDetailsTable("Description of Documents Scrutinized 2", secondDoc)}
            </div>
          );
        }
        return;
      }
      
      // {table4} - Third document only (or deeds from table4)
      if (line.includes('{table4}') || line.includes('{{table4}}')) {
        if (deedsTable4.length > 0) {
          // Show deeds table for table4
          elements.push(
            <div key={`table4-${lineIndex}`}>
              {generateDeedsTableForType(deedsTable4)}
            </div>
          );
        } else {
          // Fallback to third document
          const thirdDoc = documents.length > 2 ? [documents[2]] : [];
          elements.push(
            <div key={`table4-${lineIndex}`}>
              {generateDocumentDetailsTable("Description of Documents Scrutinized 3", thirdDoc)}
            </div>
          );
        }
        return;
      }

      // Regular line rendering
      const isHeading = /^(\d+\.?\s*)?[A-Z\s]+:/.test(line.trim());
      const isEmpty = !line.trim();
      
      if (isEmpty) {
        elements.push(<div key={lineIndex} style={{ height: '12pt' }} />);
        return;
      }
      
      if (isHeading) {
        elements.push(
          <h3 key={lineIndex} 
              style={{ 
                fontWeight: 'bold', 
                fontSize: '12pt',
                marginTop: '12pt',
                marginBottom: '6pt',
                fontFamily: 'Cambria, Georgia, serif',
                textDecoration: 'underline',
                color: '#000000'
              }}>
            {line}
          </h3>
        );
        return;
      }
      
      elements.push(
        <p key={lineIndex} 
           style={{ 
             fontSize: '12pt',
             lineHeight: '1.5',
             marginBottom: '6pt',
             fontFamily: 'Cambria, Georgia, serif',
             textAlign: 'justify',
             color: '#000000'
           }}>
          {line}
        </p>
      );
    });
    
    return elements;
  };
  
  return (
    <Card className="shadow-legal border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-legal-header">
          <Eye className="h-5 w-5 text-primary" />
          Document Preview
        </CardTitle>
        <CardDescription>
          Preview of the generated document with placeholders replaced
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-white p-12 rounded-lg min-h-[300px] border border-border shadow-inner" 
             style={{ 
               maxWidth: '210mm', 
               margin: '0 auto',
               fontFamily: 'Cambria, Georgia, serif',
               fontSize: '12pt',
               lineHeight: '1.5',
               color: '#000000'
             }}>
          {renderContentWithTables()}
        </div>
      </CardContent>
    </Card>
  );
};
export default ReportPreview;