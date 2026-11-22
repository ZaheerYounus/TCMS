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
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { exportCdsAccountDocx } from "@/lib/docxExport";

export function CdsAccountLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/GEN/FFC/11533/26");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    basicDetails: true,
    recipient: true,
    companies: true,
    receivedDocs: true,
    requiredDocs: true,
    statusAndSignatories: true,
  });

  const toggleAccordion = (name: string) => {
    setOpenAccordion(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Recipient (Legal Heir)
  const [recipientName, setRecipientName] = useState("Mr. Shahid Qadri");
  const [fatherHusbandName, setFatherHusbandName] = useState("Mr. Muhammad Asghar Qadri (Late)");
  const [recipientAddress, setRecipientAddress] = useState(
    "R-15, 10th East Street\nPhase I, DHA\nKarachi South."
  );
  const [recipientContact, setRecipientContact] = useState("0301-8284039");

  // Deceased & CDS Account
  const [deceased, setDeceased] = useState("Late Muhammad Asghar Qadri");
  const [folio, setFolio] = useState("0000");
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
  const [includeReceivedDocs, setIncludeReceivedDocs] = useState(true);
  const [receivedDocs, setReceivedDocs] = useState<string[]>([
    "Notarized copy of death certificate of deceased shareholder;",
    "Notarized copy of CNICs of the deceased shareholder & yourself;",
    "Shareholder Information Form filled and signed by yourself."
  ]);
  const [newReceivedInput, setNewReceivedInput] = useState("");

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

  // Auto-record to Letter History
  const recordToHistory = async () => {
    try {
      await fetch("/api/letters/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterType: "CDS Account",
          refNo,
          date,
          company: companies.join(" / "),
          deceasedName: deceased,
          folio: folio || "",
          legalHeir: recipientName,
          formData: {
            refNo,
            date,
            recipientName,
            fatherHusbandName,
            recipientAddress,
            recipientContact,
            companies,
            deceased,
            folio,
            cdsAccountNo,
            includeReceivedDocs,
            receivedDocs,
            requiredDocs,
            signatory1,
            signatory2,
          },
        }),
      });
    } catch (e) {
      console.warn("Letter history logging note:", e);
    }
  };

  // Word Document (.docx) Export
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await exportCdsAccountDocx({
        refNo,
        date,
        recipientName,
        fatherHusbandName,
        recipientAddress,
        recipientContact,
        company: companies.join(" / "),
        deceased,
        folio,
        cdsAccountNo,
        receivedDocs: includeReceivedDocs ? receivedDocs : [],
        requiredDocs,
        accountStatusRemarks: "",
        signatory1,
        signatory2
      });
      recordToHistory();
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

      if (json.success && (json.parsed || json.data)) {
        const d = json.parsed || json.data;
        if (d.legalHeir) setRecipientName(d.legalHeir);
        if (d.applicantFather) setFatherHusbandName(d.applicantFather);
        if (d.address) setRecipientAddress(d.address);
        if (d.contactNo) setRecipientContact(d.contactNo);
        if (d.deceased) {
          const cleanDeceased = d.deceased.toLowerCase().startsWith("late") 
            ? d.deceased 
            : `Late ${d.deceased}`;
          setDeceased(cleanDeceased);
        }
        if (d.folio) {
          setFolio(d.folio);
          setCdsAccountNo(d.folio);
        }
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
    const openingText = includeReceivedDocs && receivedDocs.length > 0
      ? `We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents:\n${receivedDocs.map(d => `• ${d}`).join("\n")}`
      : `We refer to your letter regarding the captioned subject.`;

    const text = `
${refNo}
${date}

${recipientName}
${fatherHusbandName ? `F/H Name: ${fatherHusbandName}\n` : ""}${recipientAddress}
${recipientContact ? `Contact: ${recipientContact}` : ""}

Dear Sir / Madam,

${companies.map(c => c.toUpperCase()).join("\n")}
Transmission of Dividends – ${deceased} – Folio # ${folio || "N/A"} / CDS Account # ${cdsAccountNo}

${openingText}

In order to enable us to proceed with the transmission of unpaid dividends, if any, of the subject deceased shareholder, please arrange to furnish us following required documents:
${requiredDocs.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Upon receipt of above documents in order, we shall proceed further accordingly.

Should you have any query or concerns, please feel free to contact us.

Regards,

Authorized Signatory                    Authorized Signatory
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    recordToHistory();
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-8">
      {/* Left Form: Dedicated Inputs (5 cols) */}
      <div className="xl:col-span-5 space-y-4">
          
          {/* Quick AI Upload Dropzone */}
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-all">
            <CardContent className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
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
                        AI Vision &amp; Docx
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document..." : "Drop letter (Word .docx/.doc, PDF, or image) to auto-fill details"}
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

          {/* Accordion 1: Basic Particulars */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("basicDetails")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#0B2B5E] uppercase tracking-wide">
                1. Basic Details (Ref, Date, Folio &amp; CDS A/C)
              </span>
              {openAccordion.basicDetails ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {openAccordion.basicDetails && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-3 text-xs bg-white">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Reference #</label>
                    <Input 
                      value={refNo} 
                      onChange={(e) => setRefNo(e.target.value)}
                      className="h-8 text-xs font-mono font-bold text-[#0B2B5E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Letter Date</label>
                    <Input 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      className="h-8 text-xs font-normal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Deceased Name</label>
                    <Input 
                      value={deceased} 
                      onChange={(e) => setDeceased(e.target.value)}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Folio #</label>
                    <Input 
                      value={folio} 
                      onChange={(e) => setFolio(e.target.value)}
                      className="h-8 text-xs font-mono font-semibold"
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
              </div>
            )}
          </div>

          {/* Accordion 2: Recipient / Addressee */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("recipient")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#0B2B5E] uppercase tracking-wide">
                2. Addressee / Legal Heir Particulars
              </span>
              {openAccordion.recipient ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {openAccordion.recipient && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-2 text-xs bg-white">
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
            )}
          </div>

          {/* Accordion 3: Subject Companies List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("companies")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#0B2B5E] uppercase tracking-wide">
                3. Subject Companies List ({companies.length})
              </span>
              {openAccordion.companies ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {openAccordion.companies && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-2 text-xs bg-white">
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
            )}
          </div>

          {/* Accordion 4: Documents Acknowledged / Received */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("receivedDocs")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#0B2B5E] uppercase tracking-wide">
                4. Documents Acknowledged / Received ({receivedDocs.length})
              </span>
              {openAccordion.receivedDocs ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {openAccordion.receivedDocs && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-2 text-xs bg-white">
                <label className="flex items-center gap-2 pb-1 text-[11px] font-semibold text-slate-700 cursor-pointer border-b border-slate-100">
                  <input
                    type="checkbox"
                    checked={includeReceivedDocs}
                    onChange={(e) => setIncludeReceivedDocs(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0B2B5E]"
                  />
                  Acknowledge Received Documents in Opening Paragraph
                </label>

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
            )}
          </div>

          {/* Accordion 5: Pending Formalities Required */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("requiredDocs")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#0B2B5E] uppercase tracking-wide">
                5. Pending Formalities / Documents Required ({requiredDocs.length})
              </span>
              {openAccordion.requiredDocs ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {openAccordion.requiredDocs && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-2 text-xs bg-white">
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
            )}
          </div>

          {/* Accordion 6: Signatories */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("statusAndSignatories")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#0B2B5E] uppercase tracking-wide">
                6. Signatories
              </span>
              {openAccordion.statusAndSignatories ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {openAccordion.statusAndSignatories && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-3 text-xs bg-white">
                <div className="grid grid-cols-2 gap-2">
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
              </div>
            )}
          </div>
        </div>

        {/* Right Preview: Official CDCSR A4 Letter Preview (7 cols) */}
        <div className="xl:col-span-7 space-y-3 sticky top-4">
          
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
            <div className="mb-6 space-y-1">
              <div className="font-normal text-slate-900">{refNo}</div>
              <div className="font-normal text-slate-700">{date}</div>
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
            <div className="mb-2 font-bold text-slate-900 leading-tight space-y-0.5 uppercase">
              {companies.map((c, i) => (
                <div key={i}>{c}</div>
              ))}
            </div>

            {/* Subject Line */}
            <div className="mb-6 leading-tight">
              <div className="font-bold text-slate-900 underline underline-offset-4">
                Transmission of Dividends – {deceased} – Folio # {folio || "N/A"} / CDS Account # {cdsAccountNo}
              </div>
            </div>

            {/* Opening Paragraph */}
            {includeReceivedDocs && receivedDocs.length > 0 ? (
              <>
                <div className="mb-3 text-justify">
                  We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents:
                </div>
                <ul className="list-disc pl-6 mb-4 space-y-1 text-justify">
                  {receivedDocs.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mb-4 text-justify">
                We refer to your letter regarding the captioned subject.
              </div>
            )}

            {/* Required Formalities Lead-in */}
            <div className="mb-3 text-justify font-normal">
              In order to enable us to proceed with the transmission of unpaid dividends, if any, of the subject deceased shareholder, please arrange to furnish us following required documents:
            </div>

            <ol className="list-decimal pl-6 mb-6 space-y-2 text-justify">
              {requiredDocs.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ol>

            {/* Closing Notes */}
            <div className="mb-3 text-justify">
              Upon receipt of above documents in order, we shall proceed further accordingly.
            </div>

            <div className="mb-8 text-justify">
              Should you have any query or concerns, please feel free to contact us.
            </div>

            {/* Signatures */}
            <div className="mb-4 text-slate-900">
              Regards,
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8">
              <div>
                <div className="w-48 border-t border-slate-900 pt-1 font-bold text-xs">
                  {signatory1}
                </div>
              </div>
              <div>
                <div className="w-48 border-t border-slate-900 pt-1 font-bold text-xs">
                  {signatory2}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
}
