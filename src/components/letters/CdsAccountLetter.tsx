"use client";

import { useState, useRef } from "react";
import { 
  Building, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  UploadCloud, 
  Sparkles,
  Layers,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";
import { exportCdsAccountDocx } from "@/lib/docxExport";

export function CdsAccountLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/GEN/FFC/11533/26");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });

  // Recipient (Legal Heir)
  const [recipientName, setRecipientName] = useState("Mr. Shahid Qadri");
  const [fatherHusbandName, setFatherHusbandName] = useState("Mr. Muhammad Asghar Qadri (Late)");
  const [recipientAddress, setRecipientAddress] = useState(
    "R-15, 10th East Street\nPhase I, DHA\nKarachi South."
  );
  const [recipientContact, setRecipientContact] = useState("0301-8284039");

  // Deceased & CDS Account
  const [deceased, setDeceased] = useState("Late Muhammad Asghar Qadri");
  const [cdsAccountNo, setCdsAccountNo] = useState("03277-6959");

  // Companies List
  const [companies, setCompanies] = useState<string[]>([
    "Fauji Fertilizer Company Limited (FFC)",
    "First Habib Modaraba (FHAM)",
    "National Bank of Pakistan (NBP)",
    "Oil & Gas Development Company Limited (OGDC)"
  ]);
  const [newCompanyInput, setNewCompanyInput] = useState("");

  // Documents Received Checklist (Fully Editable)
  const [receivedDocs, setReceivedDocs] = useState<string[]>([
    "Notarized copy of death certificate of deceased shareholder;",
    "Notarized copy of CNICs of the deceased shareholder & yourself;",
    "Shareholder Information Form filled and signed by yourself."
  ]);
  const [newReceivedInput, setNewReceivedInput] = useState("");

  // Account Status Remarks
  const [accountStatusRemarks, setAccountStatusRemarks] = useState(
    `Kindly note that as per CDC records, subject CDS Account # ${cdsAccountNo} of deceased shareholder is still active / open with book-entry securities.`
  );

  // Documents Required / Pending Formalities (Fully Editable)
  const [requiredDocs, setRequiredDocs] = useState<string[]>([
    `Posted Account Report of subject CDS Accounts # ${cdsAccountNo} of the deceased shareholder with "Closed" status duly stamped by relevant participant;`,
    `Account Activity / Intra Account Movement Report under subject CDS Accounts # ${cdsAccountNo} of deceased showing transfer of shares of deceased shareholder to legal heir’s CDS Account along with the reason of transfer duly stamped by relevant participant;`,
    `Closing Account Report of CDS account of the deceased shareholder duly stamped by relevant participant.`
  ]);
  const [newRequiredInput, setNewRequiredInput] = useState("");

  // Signatories
  const [signatory1, setSignatory1] = useState("Authorized Signatory");
  const [signatory2, setSignatory2] = useState("Authorized Signatory");

  // UI States
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add/remove company
  const handleAddCompany = () => {
    if (!newCompanyInput.trim()) return;
    setCompanies([...companies, newCompanyInput.trim()]);
    setNewCompanyInput("");
  };
  const handleRemoveCompany = (idx: number) => {
    setCompanies(companies.filter((_, i) => i !== idx));
  };

  // Add/remove received doc
  const handleAddReceivedDoc = () => {
    if (!newReceivedInput.trim()) return;
    setReceivedDocs([...receivedDocs, newReceivedInput.trim()]);
    setNewReceivedInput("");
  };
  const handleRemoveReceivedDoc = (idx: number) => {
    setReceivedDocs(receivedDocs.filter((_, i) => i !== idx));
  };

  // Add/remove required doc
  const handleAddRequiredDoc = () => {
    if (!newRequiredInput.trim()) return;
    setRequiredDocs([...requiredDocs, newRequiredInput.trim()]);
    setNewRequiredInput("");
  };
  const handleRemoveRequiredDoc = (idx: number) => {
    setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
  };

  // Word Document (.docx) Export
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await exportCdsAccountDocx({
        refNo,
        date,
        recipientName,
        recipientAddress,
        recipientContact,
        company: companies.join(" / "),
        deceased,
        cdsAccountNo,
        receivedDocs,
        requiredDocs,
        accountStatusRemarks,
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

  // AI Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-letter", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        if (d.legalHeir) setRecipientName(d.legalHeir);
        if (d.address) setRecipientAddress(d.address);
        if (d.contactNo) setRecipientContact(d.contactNo);
        if (d.deceased) {
          const cleanDeceased = d.deceased.toLowerCase().startsWith("late") 
            ? d.deceased 
            : `Late ${d.deceased}`;
          setDeceased(cleanDeceased);
        }
        if (d.folio) setCdsAccountNo(d.folio);
        if (d.refNo) setRefNo(d.refNo);
        if (d.company) {
          setCompanies([d.company]);
        }

        setUploadSuccess("Document analyzed successfully. Letter fields updated.");
        setTimeout(() => setUploadSuccess(""), 4000);
      } else {
        throw new Error(json.error || "Could not extract data");
      }
    } catch (err: any) {
      console.error("AI Upload error:", err);
      alert(`AI Extraction note: ${err.message || "Could not read file"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyText = () => {
    const text = `
${refNo}
${date}

${recipientName}
F/H Name: ${fatherHusbandName}
${recipientAddress}
${recipientContact ? `Contact: ${recipientContact}` : ""}

Dear Sir / Madam,

${companies.join("\n")}

Transmission of Shares
${deceased} - CDS Account # ${cdsAccountNo}

We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents:
${receivedDocs.map(d => `• ${d}`).join("\n")}

${accountStatusRemarks}

In order to proceed further, following formalities / documents are still required:
${requiredDocs.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Should you have any query, feel free to coordinate with us.

Yours faithfully,
For CDC Share Registrar Services Limited

${signatory1}                      ${signatory2}
Authorized Signatory             Authorized Signatory
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <LetterNavTabs currentType="cds-account" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Dedicated Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick AI Upload Dropzone */}
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-all">
            <CardContent className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
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
                      <span>Upload CDS Letter / Request</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-[#F37021] border-orange-200 py-0">
                        AI Vision
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document with AI..." : "Drop CDS letter or PDF to auto-fill"}
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
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-xs font-bold text-[#0B2B5E]">
                CDS Account Letter Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              
              {/* Ref No & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Reference #</label>
                  <Input 
                    value={refNo} 
                    onChange={(e) => setRefNo(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Letter Date</label>
                  <Input 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Deceased & CDS A/C */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Deceased Name</label>
                  <Input 
                    value={deceased} 
                    onChange={(e) => setDeceased(e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">CDS Account #</label>
                  <Input 
                    value={cdsAccountNo} 
                    onChange={(e) => setCdsAccountNo(e.target.value)}
                    className="h-8 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Recipient Details */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Addressee Details
                </span>
                <div>
                  <Input 
                    placeholder="Recipient Name (e.g. Mr. Shahid Qadri)"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-8 text-xs font-medium mb-1.5"
                  />
                  <Input 
                    placeholder="F/H Name: Mr. Muhammad Asghar Qadri (Late)"
                    value={fatherHusbandName}
                    onChange={(e) => setFatherHusbandName(e.target.value)}
                    className="h-8 text-xs mb-1.5"
                  />
                  <textarea 
                    rows={3}
                    placeholder="Complete Postal Address (leave blank if missing)..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <Input 
                    placeholder="Contact # (e.g. 0301-8284039)"
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    className="h-8 text-xs font-mono mt-1.5"
                  />
                </div>
              </div>

              {/* Subject Companies List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">Subject Companies List</span>
                <div className="space-y-1">
                  {companies.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded border border-slate-200 text-xs">
                      <span className="font-medium text-slate-800">{c}</span>
                      {companies.length > 1 && (
                        <button onClick={() => handleRemoveCompany(i)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input 
                    placeholder="Add company name..."
                    value={newCompanyInput}
                    onChange={(e) => setNewCompanyInput(e.target.value)}
                    className="h-7 text-[11px]"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCompany())}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddCompany} className="h-7 text-[11px] px-2.5">
                    Add
                  </Button>
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
                        onClick={() => handleRemoveReceivedDoc(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input 
                    placeholder="Add received document..."
                    value={newReceivedInput}
                    onChange={(e) => setNewReceivedInput(e.target.value)}
                    className="h-7 text-[11px]"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddReceivedDoc())}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddReceivedDoc} className="h-7 text-[11px] px-2.5">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Status Remarks */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  CDS Account Status Finding
                </label>
                <textarea 
                  rows={2}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white"
                  value={accountStatusRemarks} 
                  onChange={(e) => setAccountStatusRemarks(e.target.value)} 
                />
              </div>

              {/* Pending Documents / Formalities Required */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Pending Formalities / Documents Required
                </span>
                <div className="space-y-1.5">
                  {requiredDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200 text-xs">
                      <span className="font-mono text-slate-400 mt-0.5">{idx + 1}.</span>
                      <span className="flex-1 text-slate-700">{doc}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveRequiredDoc(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input 
                    placeholder="Add required document / formality..."
                    value={newRequiredInput}
                    onChange={(e) => setNewRequiredInput(e.target.value)}
                    className="h-7 text-[11px]"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequiredDoc())}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddRequiredDoc} className="h-7 text-[11px] px-2.5">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
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

        {/* Right Preview: Official CDCSR A4 Letter Preview (7 cols) */}
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
                onClick={handlePrint}
                className="h-8 text-xs bg-[#0B2B5E] hover:bg-[#153a73] text-white"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print (A4)
              </Button>
            </div>
          </div>

          {/* Letter Paper Preview Sheet */}
          <div className="bg-white border border-slate-300 shadow-md rounded-sm p-10 min-h-[840px] text-slate-900 font-sans text-[13.5px] leading-relaxed relative print:m-0 print:border-none print:shadow-none print:p-0">
            
            {/* Reference & Date */}
            <div className="flex justify-between items-start mb-6">
              <div className="font-medium text-slate-900">{refNo}</div>
              <div className="font-medium text-slate-900">{date}</div>
            </div>

            {/* Recipient Address */}
            <div className="mb-6 leading-snug">
              <div className="font-bold text-slate-900">{recipientName}</div>
              {fatherHusbandName && (
                <div className="text-slate-800">F/H Name: {fatherHusbandName}</div>
              )}
              <div className="whitespace-pre-line text-slate-800">{recipientAddress}</div>
              {recipientContact && (
                <div className="text-slate-800 mt-1 font-medium">Contact: {recipientContact}</div>
              )}
            </div>

            {/* Salutation */}
            <div className="mb-4 font-medium">
              Dear Sir / Madam,
            </div>

            {/* Subject Companies */}
            <div className="mb-4 font-bold text-slate-900 leading-tight space-y-0.5">
              {companies.map((c, i) => (
                <div key={i}>{c}</div>
              ))}
            </div>

            {/* Subject Line */}
            <div className="mb-6 leading-tight">
              <div className="font-bold text-slate-900">
                Transmission of Shares
              </div>
              <div className="font-bold text-slate-900">
                {deceased} - CDS Account # {cdsAccountNo}
              </div>
            </div>

            {/* Opening Paragraph */}
            <div className="mb-3 text-justify">
              We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents:
            </div>

            {/* Documents List */}
            <ul className="list-disc pl-6 mb-4 space-y-1 text-justify">
              {receivedDocs.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>

            {/* Status Remark */}
            <div className="mb-4 text-justify">
              {accountStatusRemarks}
            </div>

            {/* Required Formalities */}
            <div className="mb-3 font-semibold">
              In order to proceed further, following formalities / documents are still required:
            </div>

            <ol className="list-decimal pl-6 mb-6 space-y-2 text-justify">
              {requiredDocs.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ol>

            {/* Closing Note */}
            <div className="mb-8 text-justify">
              Should you have any query, feel free to coordinate with us.
            </div>

            {/* Signatures */}
            <div className="mb-4">
              Yours faithfully,
              <div className="font-bold mt-1">For CDC Share Registrar Services Limited</div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-12">
              <div>
                <div className="w-48 border-t border-slate-900 pt-1 font-bold text-xs">
                  {signatory1}
                </div>
              </div>
              <div className="text-right">
                <div className="w-48 border-t border-slate-900 pt-1 font-bold text-xs ml-auto">
                  {signatory2}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
