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
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";

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
  const [companyName, setCompanyName] = useState(""); // Often general or blank for multi-company / GEN

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

  // Fast AI scan using backend route (Gemini 3.5 Flash-Lite)
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
        // If address is missing, set to empty string
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

        setUploadSuccess("AI Scan Successful! Letter fields updated.");
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
    <div className="min-h-screen bg-slate-50/70 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shadow-xs">
                <SearchX className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  No Folio Found Letter
                </h1>
                <p className="text-sm text-slate-500">
                  نو فولیو فاؤنڈ لیٹر — Intimation to Legal Heir / Advocate regarding physical records search
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadCloud className="h-4 w-4" />
              {uploading ? "Scanning with AI..." : "Auto-Fill with AI"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white"
              onClick={handleCopyText}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Text"}
            </Button>

            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Print (A4)
            </Button>
          </div>
        </div>

        {/* Global Tabs Switcher */}
        <LetterNavTabs currentType="no-folio-found" />

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            {uploadSuccess}
          </div>
        )}

        {/* 2-Column Responsive Workspace: Left Form (45%), Right A4 Preview (55%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT FORM CONTROLS (5 cols) ================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Reference & Date Card */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Reference & Date (ریفیرنس اور تاریخ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Reference Number (لیٹر نمبر)
                  </label>
                  <Input 
                    value={refNo} 
                    onChange={(e) => setRefNo(e.target.value)} 
                    placeholder="e.g. CDCSR/LTC/GEN/11535/26" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Letter Date (تاریخ)
                  </label>
                  <Input 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recipient Details (Advocate / Legal Heir) */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <User className="h-4 w-4 text-blue-600" />
                  Recipient Details (وکیل یا لیگل ہائیر کی تفصیلات)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Recipient name, law firm, address and contact number
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Recipient / Advocate Name
                  </label>
                  <Input 
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)} 
                    placeholder="e.g. Mr. Abdul Majeed Perhyar"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Law Firm / Organization (Optional)
                  </label>
                  <Input 
                    value={lawFirm} 
                    onChange={(e) => setLawFirm(e.target.value)} 
                    placeholder="e.g. Majeed Haroon Law Associates"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center justify-between">
                    <span>Postal Address (ایڈریس)</span>
                    <span className="text-[10px] text-amber-600 font-normal">Leave blank if missing</span>
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full text-sm rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-sans"
                    value={recipientAddress} 
                    onChange={(e) => setRecipientAddress(e.target.value)} 
                    placeholder="Enter complete postal address..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Mobile / Contact #
                  </label>
                  <Input 
                    value={recipientContact} 
                    onChange={(e) => setRecipientContact(e.target.value)} 
                    placeholder="e.g. 0333-2695165"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Deceased Shareholder Details */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Deceased Shareholder Searched (متوفی کی تفصیلات)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Deceased Name (متوفی کا نام)
                  </label>
                  <Input 
                    value={deceasedName} 
                    onChange={(e) => setDeceasedName(e.target.value)} 
                    placeholder="e.g. Late Abdul Rehman Memon"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Deceased CNIC # Searched
                  </label>
                  <Input 
                    value={deceasedCnic} 
                    onChange={(e) => setDeceasedCnic(e.target.value)} 
                    placeholder="e.g. 42301-0987654-3"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Target Company (Optional / General)
                  </label>
                  <Input 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="e.g. General Share Registry / Company Name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Documents Received Checklist */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Documents Acknowledged / Received
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Documents submitted by the applicant which were checked
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  {receivedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200 text-xs text-slate-700">
                      <span className="flex-1">{doc}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input 
                    placeholder="Add document (e.g. Death Certificate)..."
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDoc();
                      }
                    }}
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddDoc} className="gap-1 shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notice & Instructions */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  Search Remarks & Required Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    No Record Found Statement
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full text-xs rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-sans"
                    value={searchRemarks} 
                    onChange={(e) => setSearchRemarks(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Evidence Request Statement
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full text-xs rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-sans"
                    value={evidenceRequest} 
                    onChange={(e) => setEvidenceRequest(e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ================= RIGHT LIVE PREVIEW: OFFICIAL CDCSR A4 (7 cols) ================= */}
          <div className="lg:col-span-7">
            <div className="sticky top-6">
              
              {/* Preview Header Banner */}
              <div className="bg-slate-800 text-slate-100 px-4 py-2.5 rounded-t-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  CDCSR Official A4 Preview (نو فولیو فاؤنڈ لیٹر)
                </div>
                <div className="text-[11px] text-slate-300">
                  Standard Letter Format (11535/26)
                </div>
              </div>

              {/* The A4 Letter Page Container */}
              <div 
                id="printable-a4-letter"
                className="bg-white border-x border-b border-slate-300 rounded-b-xl shadow-lg p-10 sm:p-14 text-slate-900 font-serif leading-relaxed text-[13.5px] min-h-[850px] space-y-6"
              >
                
                {/* Official Letter Header / Reference & Date */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-700 tracking-wider">
                      {refNo}
                    </div>
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

                {/* Subject Block */}
                <div className="space-y-1 pt-2 font-sans">
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

                {/* Salutation & Opening */}
                <div className="space-y-4 pt-2 text-justify">
                  <p>Dear Sir / Madam,</p>
                  
                  <p>
                    We refer to your letter regarding the captioned subject and acknowledge the receipt of the following documents:
                  </p>

                  {/* Documents List */}
                  <ul className="list-disc pl-8 space-y-1 font-sans text-xs text-slate-800">
                    {receivedDocs.map((doc, idx) => (
                      <li key={idx} className="leading-tight">
                        {doc}
                      </li>
                    ))}
                  </ul>

                  {/* Search Statement */}
                  <p className="pt-2">
                    {searchRemarks}
                  </p>

                  {/* Evidence Request */}
                  <p>
                    {evidenceRequest}
                  </p>

                  {/* Standard Closing */}
                  <p>
                    Should you have any query, feel free to coordinate with us.
                  </p>
                </div>

                {/* Official Signatures Block */}
                <div className="pt-10 space-y-12">
                  <div className="text-xs font-sans text-slate-700">
                    Yours faithfully,
                    <div className="font-bold text-slate-900 mt-1">
                      For CDC Share Registrar Services Limited
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8">
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

      </div>
    </div>
  );
}
