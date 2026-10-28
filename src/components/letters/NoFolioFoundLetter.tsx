"use client";

import { useState, useRef } from "react";
import { 
  Building2, 
  SearchX, 
  Printer, 
  Copy, 
  Check, 
  UploadCloud, 
  Sparkles,
  FileText,
  User,
  MapPin,
  Phone,
  ShieldAlert,
  HelpCircle,
  Plus,
  Trash2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";
import { exportNoFolioFoundDocx } from "@/lib/docxExport";

export function NoFolioFoundLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/GEN/11535/26");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });

  // Recipient (Advocate / Legal Heir Representative)
  const [recipientName, setRecipientName] = useState("Mr. Abdul Majeed Perhyar");
  const [lawFirm, setLawFirm] = useState("Majeed Haroon Law Associates");
  const [recipientAddress, setRecipientAddress] = useState(
    "Office No M8, Mezzanine Floor,\nAl Fatima Chambers, Near Passport Office,\nSaddar,\nKarachi."
  );
  const [recipientContact, setRecipientContact] = useState("0333-2695165");

  // Deceased Shareholder Details
  const [deceasedName, setDeceasedName] = useState("Late Abdul Rehman Memon");
  const [deceasedCnic, setDeceasedCnic] = useState("42301-0987654-3");
  const [companyName, setCompanyName] = useState("");

  // Documents received
  const [receivedDocs, setReceivedDocs] = useState<string[]>([
    "Copy of death certificate of subject deceased shareholder",
    "ID cancellation / CNIC cancellation slip of subject deceased shareholder",
    "Family Registration Certificate (FRC)"
  ]);
  const [newDocText, setNewDocText] = useState("");

  // Letter Body Text customizations
  const [searchRemarks, setSearchRemarks] = useState(
    "Please be advised that we have conducted a thorough search of our physical shareholder records based on the name and provided CNIC # of the deceased shareholder. However, we have been unable to trace any shares held in the name of the deceased in our records."
  );
  const [evidenceRequest, setEvidenceRequest] = useState(
    "You are therefore requested to kindly provide any documentary evidence, such as copy of physical share certificate(s), dividend warrant counterfoil, or any past correspondence with the company to enable us to check for any shares registered in the name of deceased shareholder and let you know the formalities for transmission of shares and dividends (if any)."
  );

  // Signatories
  const [signatory1, setSignatory1] = useState("Authorized Signatory");
  const [signatory2, setSignatory2] = useState("Authorized Signatory");

  // UI States
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddDoc = () => {
    if (newDocText.trim()) {
      setReceivedDocs([...receivedDocs, newDocText.trim()]);
      setNewDocText("");
    }
  };

  const handleRemoveDoc = (idx: number) => {
    setReceivedDocs(receivedDocs.filter((_, i) => i !== idx));
  };

  // Word Document (.docx) Export
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await exportNoFolioFoundDocx({
        refNo,
        date,
        recipientName,
        lawFirm,
        recipientAddress,
        recipientContact,
        deceasedName,
        deceasedCnic,
        receivedDocs,
        searchRemarks,
        evidenceRequest,
        signatory1,
        signatory2
      });
    } catch (err) {
      console.error("Failed to generate docx:", err);
      alert("Failed to generate Word document. Please verify inputs.");
    } finally {
      setDownloading(false);
    }
  };

  // AI scan using backend route (Gemini 3.5 Flash-Lite)
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-letter", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.deceased) {
          const cleanDeceased = d.deceased.toLowerCase().startsWith("late") 
            ? d.deceased 
            : `Late ${d.deceased}`;
          setDeceasedName(cleanDeceased);
        }
        if (d.legalHeir) {
          setRecipientName(d.legalHeir);
        }
        setRecipientAddress(d.address || "");
        if (d.contactNo) {
          setRecipientContact(d.contactNo);
        }
        if (d.refNo) {
          setRefNo(d.refNo);
        }
        if (d.company) {
          setCompanyName(d.company);
        }

        setUploadSuccess("Document analyzed successfully. Letter fields updated.");
        setTimeout(() => setUploadSuccess(""), 4000);
      } else {
        throw new Error(json.error || "Failed to parse document");
      }
    } catch (err: any) {
      console.error("AI Upload Error:", err);
      alert(`AI Extraction note: ${err.message || "Could not extract data"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyText = () => {
    const text = `
${refNo}
${date}

${recipientName}
${lawFirm ? lawFirm + "\n" : ""}${recipientAddress}
${recipientContact ? "Contact # " + recipientContact : ""}

Dear Sir / Madam,

Transmission of Shares
${deceasedName}

We refer to your letter regarding the captioned subject and acknowledge the receipt of the following documents:
${receivedDocs.map(d => `• ${d}`).join("\n")}

${searchRemarks}

${evidenceRequest}

Should you have any query, feel free to coordinate with us.

Yours faithfully,
For CDC Share Registrar Services Limited

${signatory1}                      ${signatory2}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <LetterNavTabs currentType="no-folio-found" />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT FORM CONTROLS (5 cols) ================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick AI Upload Dropzone */}
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-all">
            <CardContent className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-100 text-[#F37021] group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Upload Letter / Inquiry</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-[#F37021] border-orange-200 py-0">
                        AI Vision
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document with AI..." : "Drop letter image or PDF to auto-detect particulars"}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs text-[#0B2B5E] font-semibold">
                  Browse
                </Button>
              </div>

              {uploadSuccess && (
                <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-1.5 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-[#0B2B5E]">
                No Folio Found Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              
              {/* Reference & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Reference #
                  </label>
                  <Input 
                    value={refNo} 
                    onChange={(e) => setRefNo(e.target.value)} 
                    placeholder="e.g. CDCSR/LTC/GEN/11535/26" 
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Letter Date
                  </label>
                  <Input 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Recipient Details */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Addressee / Advocate Details
                </span>
                <div>
                  <Input 
                    placeholder="Recipient / Advocate Name"
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)} 
                    className="h-8 text-xs font-medium mb-1.5"
                  />
                  <Input 
                    placeholder="Law Firm / Organization (Optional)"
                    value={lawFirm} 
                    onChange={(e) => setLawFirm(e.target.value)} 
                    className="h-8 text-xs mb-1.5"
                  />
                  <textarea 
                    rows={3}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 focus:ring-1 focus:ring-blue-500 bg-white"
                    value={recipientAddress} 
                    onChange={(e) => setRecipientAddress(e.target.value)} 
                    placeholder="Complete Postal Address (leave blank if missing)..."
                  />
                  <Input 
                    placeholder="Contact # (e.g. 0333-2695165)"
                    value={recipientContact} 
                    onChange={(e) => setRecipientContact(e.target.value)} 
                    className="h-8 text-xs font-mono mt-1.5"
                  />
                </div>
              </div>

              {/* Deceased Shareholder Searched */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Deceased Name
                  </label>
                  <Input 
                    value={deceasedName} 
                    onChange={(e) => setDeceasedName(e.target.value)} 
                    placeholder="e.g. Late Abdul Rehman Memon"
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Deceased CNIC #
                  </label>
                  <Input 
                    value={deceasedCnic} 
                    onChange={(e) => setDeceasedCnic(e.target.value)} 
                    placeholder="e.g. 42301-0987654-3"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Documents Acknowledged / Received */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Documents Acknowledged / Received
                </span>
                <div className="space-y-1.5">
                  {receivedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200 text-xs">
                      <span className="flex-1 text-slate-700">{doc}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input 
                    placeholder="Add document (e.g. Death Certificate)..."
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    className="h-7 text-[11px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDoc();
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddDoc} className="h-7 text-[11px] px-2.5">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Record Search Finding
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white"
                    value={searchRemarks} 
                    onChange={(e) => setSearchRemarks(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Evidence Request
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white"
                    value={evidenceRequest} 
                    onChange={(e) => setEvidenceRequest(e.target.value)} 
                  />
                </div>
              </div>

              {/* Signatories */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Signatory 1</label>
                  <Input 
                    value={signatory1}
                    onChange={(e) => setSignatory1(e.target.value)}
                    className="h-7 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Signatory 2</label>
                  <Input 
                    value={signatory2}
                    onChange={(e) => setSignatory2(e.target.value)}
                    className="h-7 text-[11px]"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT LIVE PREVIEW: OFFICIAL CDCSR A4 (7 cols) ================= */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs print:hidden">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-[#0B2B5E] border-blue-200 text-xs">
                Official Letter Preview (A4)
              </Badge>
              <span className="text-[11px] text-slate-500">Live preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleDownloadDocx}
                disabled={downloading}
                className="h-8 text-xs bg-[#F37021] hover:bg-[#D85B10] text-white font-semibold shadow-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {downloading ? "Exporting..." : "Download Word (.docx)"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCopyText}
                className="h-8 text-xs text-slate-700"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Copied" : "Copy Text"}
              </Button>
              <Button 
                size="sm" 
                onClick={() => window.print()}
                className="h-8 text-xs bg-[#0B2B5E] hover:bg-[#153a73] text-white"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print (A4)
              </Button>
            </div>
          </div>

          {/* Letter Paper Preview Sheet */}
          <div 
            id="printable-a4-letter"
            className="bg-white border border-slate-300 shadow-md rounded-sm p-10 min-h-[840px] text-slate-900 font-serif leading-relaxed text-[13.5px] relative print:m-0 print:border-none print:shadow-none print:p-0 space-y-5"
          >
            {/* Header Reference & Date */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div className="font-mono text-xs font-bold text-slate-700 tracking-wider">
                {refNo}
              </div>
              <div className="text-right text-xs font-sans text-slate-600 font-medium">
                {date}
              </div>
            </div>

            {/* Recipient Block */}
            <div className="space-y-0.5 font-sans text-xs text-slate-800">
              <div className="font-bold text-[13px] text-slate-950">{recipientName}</div>
              {lawFirm && <div className="font-semibold text-slate-700">{lawFirm}</div>}
              {recipientAddress ? (
                <div className="whitespace-pre-line text-slate-600 leading-snug">
                  {recipientAddress}
                </div>
              ) : (
                <div className="text-slate-400 italic text-[11px] py-0.5">
                  [Address to be inserted / missing in record]
                </div>
              )}
              {recipientContact && (
                <div className="text-slate-600 pt-1 font-mono text-[11.5px]">
                  Contact # {recipientContact}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1 pt-1 font-sans">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Subject:
              </div>
              <div className="text-sm font-bold text-slate-950 underline underline-offset-4">
                TRANSMISSION OF SHARES
              </div>
              <div className="text-xs font-bold text-slate-800">
                {deceasedName}
                {deceasedCnic && <span className="font-normal text-slate-600"> (CNIC # {deceasedCnic})</span>}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-3.5 pt-1 text-justify">
              <p>Dear Sir / Madam,</p>
              
              <p>
                We refer to your letter regarding the captioned subject and acknowledge the receipt of the following documents:
              </p>

              <ul className="list-disc pl-8 space-y-1 font-sans text-xs text-slate-800">
                {receivedDocs.map((doc, idx) => (
                  <li key={idx} className="leading-tight">
                    {doc}
                  </li>
                ))}
              </ul>

              <p className="pt-1">
                {searchRemarks}
              </p>

              <p>
                {evidenceRequest}
              </p>

              <p>
                Should you have any query, feel free to coordinate with us.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-8 space-y-10">
              <div className="text-xs font-sans text-slate-700">
                Yours faithfully,
                <div className="font-bold text-slate-900 mt-1">
                  For CDC Share Registrar Services Limited
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6">
                <div>
                  <div className="w-48 border-t border-slate-900 pt-1 text-center font-sans text-xs font-bold text-slate-800">
                    {signatory1}
                  </div>
                </div>
                <div>
                  <div className="w-48 border-t border-slate-900 pt-1 text-center font-sans text-xs font-bold text-slate-800 ml-auto">
                    {signatory2}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
