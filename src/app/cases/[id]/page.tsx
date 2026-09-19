"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertCircle, 
  Download, 
  Printer, 
  Send,
  MessageSquare,
  Plus,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const defaultWorkflowSteps = [
  { name: "Death Intimation Received", completed: true, date: "Intimation Stage" },
  { name: "Transmission Letter Issued", completed: true, date: "Formalities Dispatched" },
  { name: "Awaiting Succession Certificate", completed: true, date: "Legal Heirs Notified" },
  { name: "Documents Received", completed: true, date: "NADRA & Court Verified" },
  { name: "Under Review & Scrutiny", completed: false, current: true },
  { name: "Sent To Issuer Company", completed: false },
  { name: "Issuer Approval Pending", completed: false },
  { name: "Shares Transferred (Transaction Team)", completed: false },
  { name: "Delivered to Legal Heirs & Closed", completed: false },
];

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formalities, setFormalities] = useState([
    { id: 1, name: "Original Death Certificate issued by NADRA / Union Council", verified: true },
    { id: 2, name: "Succession Certificate issued by Competent Court / NADRA Letter of Administration", verified: true },
    { id: 3, name: "Attested CNIC Copies of all surviving legal heirs", verified: true },
    { id: 4, name: "Transmission Form duly executed & attested", verified: false },
    { id: 5, name: "Affidavit / Declaration on Rs. 100/- stamp paper", verified: false },
    { id: 6, name: "Indemnity Bond with two solvent sureties", verified: false },
    { id: 7, name: "Original physical share certificates", verified: false }
  ]);
  
  const [newFormality, setNewFormality] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await fetch(`/api/mis?q=${encodeURIComponent(params.id)}`);
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setCaseData(data.records[0]);
        }
      } catch (err) {
        console.error("Failed to fetch case detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [params.id]);

  const deceasedName = caseData?.deceased || "Late Shareholder";
  const companyName = caseData?.company || "Habib Bank Limited";
  const folioNo = caseData?.folio || "44058";
  const currentStatus = caseData?.status || "Under Review";

  const handleAddFormality = () => {
    if (newFormality.trim() !== "") {
      setFormalities([...formalities, { id: Date.now(), name: newFormality.trim(), verified: false }]);
      setNewFormality("");
    }
  };

  const handleRemoveFormality = (id: number) => {
    setFormalities(formalities.filter(f => f.id !== id));
  };

  const toggleVerification = (id: number) => {
    setFormalities(formalities.map(f => f.id === id ? { ...f, verified: !f.verified } : f));
  };

  const handleGenerateWord = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: params.id,
          shareholder: deceasedName,
          company: companyName,
          folios: [folioNo],
          formalities: formalities.map(f => f.name)
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Transmission_Letter_${params.id}_${deceasedName.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Failed to generate letter", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/cases">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Case Dossier: {params.id}</h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">{currentStatus}</Badge>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Shareholder: <strong>{deceasedName}</strong> | Company: <strong>{companyName}</strong> | Folio: <span className="font-mono font-bold text-slate-800">{folioNo}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-[#0B2B5E] text-xs h-9">
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print Checklist
          </Button>
          <Button className="bg-[#1A365D] hover:bg-[#0B2B5E] text-xs h-9">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Proceed to Next Workflow Step
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Workflow */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Institutional Workflow Journey</CardTitle>
              <CardDescription>Live audit-tracked progress from death intimation to final share credit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 pb-2">
                {defaultWorkflowSteps.map((step, index) => (
                  <div key={index} className="relative pl-6">
                    <span className={`absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-8 ring-white ${step.completed ? 'bg-emerald-600' : step.current ? 'bg-[#0B2B5E] animate-pulse' : 'bg-slate-300'}`}>
                      {step.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : step.current ? <Clock className="h-3 w-3 text-white" /> : null}
                    </span>
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-semibold ${step.completed || step.current ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.name}
                      </h4>
                      {step.date && <span className="text-[11px] font-mono text-slate-500">{step.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Letter Generator Widget */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Customized Transmission Letter (Word Document)</CardTitle>
              <CardDescription>
                Generates official CDCSR correspondence reflecting the specific verified/unverified formalities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-slate-50 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-[#0B2B5E]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{companyName} – Intimation Letter</h4>
                    <p className="text-xs text-slate-500">Includes {formalities.length} statutory requirements in downloadable Microsoft Word (.docx) format.</p>
                  </div>
                </div>
                
                <Button 
                  className="bg-[#F37021] hover:bg-[#D85B10] text-white shrink-0 h-9 text-xs font-bold shadow-sm" 
                  onClick={handleGenerateWord}
                  disabled={isGenerating}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {isGenerating ? "Preparing Word File..." : "Download Word (.docx)"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Formalities & Requirements */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Document Scrutiny</CardTitle>
                <span className="text-xs text-slate-500">{formalities.filter(f => f.verified).length}/{formalities.length} Verified</span>
              </div>
              <CardDescription>Click checkmark to toggle verified status or trash to remove.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {formalities.map((req) => (
                  <li key={req.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-slate-100 text-xs group">
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1 mr-2"
                      onClick={() => toggleVerification(req.id)}
                    >
                      {req.verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className={req.verified ? "text-slate-900 font-medium" : "text-slate-500"}>
                        {req.name}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveFormality(req.id)}
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Input 
                  placeholder="Add custom company formality..." 
                  value={newFormality}
                  onChange={(e) => setNewFormality(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFormality())}
                  className="h-8 text-xs"
                />
                <Button size="sm" onClick={handleAddFormality} className="bg-[#1A365D] hover:bg-[#0B2B5E] h-8 px-2.5">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* MIS Auto-Update Notification */}
          <Card className="bg-blue-50/50 border-blue-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-blue-700" />
                Automated MIS Sync Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-xs">
                <p><strong>Last Action:</strong> Formalities requirement letter prepared</p>
                <p><strong>Suggested MIS Status:</strong> Transmission Letter Issued</p>
                <p className="text-[11px] text-slate-500">Remarks: "Letter dispatched with statutory checklists"</p>
                <Button className="w-full mt-2.5 bg-[#38A169] hover:bg-green-700 text-white h-8 text-xs font-semibold">
                  Confirm &amp; Log to MIS Register
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
