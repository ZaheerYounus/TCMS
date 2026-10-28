"use client";

import { useState, useRef } from "react";
import { 
  Stamp, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  UploadCloud, 
  Sparkles,
  Building2,
  FileCheck2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";
import { exportPhysicalApprovalDocx } from "@/lib/docxExport";

export interface TransferReceiptItem {
  receiptNo: string;
  heirName: string;
}

export function PhysicalApprovalLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/PSO/1210/26");
  const [date, setDate] = useState("July 10, 2026");

  // Company Secretary (Recipient)
  const [secretaryTitle, setSecretaryTitle] = useState("The Company Secretary");
  const [company, setCompany] = useState("Pakistan State Oil Company Limited");
  const [compSymbol, setCompSymbol] = useState("PSO");
  const [companyAddress, setCompanyAddress] = useState(
    "PSO House,\nKhayaban-e-Iqbal, Clifton,\nKarachi-75600."
  );
  const [salutation, setSalutation] = useState("Dear Sir / Madam,");

  // Corporate & Deceased Details
  const [deceased, setDeceased] = useState("Late Allah Bakhsh");
  const [folio, setFolio] = useState("607");
  const [companyLetterRef, setCompanyLetterRef] = useState("MS/Transm/657");
  const [companyLetterDate, setCompanyLetterDate] = useState("May 18, 2026");

  // Certificates & Shares
  const [certificatesCount, setCertificatesCount] = useState("24");
  const [sharesCount, setSharesCount] = useState("626");

  // Transfer Receipts (In the name of heirs)
  const [transferReceipts, setTransferReceipts] = useState<TransferReceiptItem[]>([
    { receiptNo: "469", heirName: "MRS. SARA KHALID" },
    { receiptNo: "470", heirName: "MRS. IMRANA NASIR" },
    { receiptNo: "471", heirName: "MRS. MOBINA AMAN" }
  ]);
  const [transferPages, setTransferPages] = useState("06 (02 Copies)");

  // OPTIONAL: Loss Register & Receipts
  const [includeLoss, setIncludeLoss] = useState(false);
  const [lossReceiptNo, setLossReceiptNo] = useState("295");
  const [lossRegisterPages, setLossRegisterPages] = useState("02 (02 Copies)");
  const [duplicateCertsCount, setDuplicateCertsCount] = useState("06");

  // OPTIONAL: Split Register & Receipts
  const [includeSplit, setIncludeSplit] = useState(false);
  const [splitReceiptNo, setSplitReceiptNo] = useState("403");
  const [splitRegisterPages, setSplitRegisterPages] = useState("02 (02 Copies)");

  // Signatories
  const [signatory1Name, setSignatory1Name] = useState("Authorized Signatory");
  const [signatory1Designation, setSignatory1Designation] = useState("Senior Officer");
  const [signatory2Name, setSignatory2Name] = useState("Authorized Signatory");
  const [signatory2Designation, setSignatory2Designation] = useState("Assistant Manager");

  // UI States
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddReceipt = () => {
    setTransferReceipts([...transferReceipts, { receiptNo: "", heirName: "" }]);
  };

  const handleRemoveReceipt = (idx: number) => {
    setTransferReceipts(transferReceipts.filter((_, i) => i !== idx));
  };

  const handleReceiptChange = (idx: number, field: keyof TransferReceiptItem, val: string) => {
    const updated = [...transferReceipts];
    updated[idx][field] = val;
    setTransferReceipts(updated);
  };

  // Word Document (.docx) Export
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await exportPhysicalApprovalDocx({
        refNo,
        date,
        company,
        companyAddress,
        deceased,
        folio,
        certificatesCount,
        totalShares: sharesCount,
        transferRegisterPages: transferPages,
        transferReceipts,
        includeLoss,
        lossReceiptNo,
        lossRegisterPages,
        includeSplit,
        splitReceiptNo,
        splitRegisterPages,
        signatory1: signatory1Name,
        signatory2: signatory2Name,
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
        if (d.company) setCompany(d.company);
        if (d.compSymbol) setCompSymbol(d.compSymbol);
        if (d.deceased) {
          const cleanDeceased = d.deceased.toLowerCase().startsWith("late") 
            ? d.deceased 
            : `Late ${d.deceased}`;
          setDeceased(cleanDeceased);
        }
        if (d.folio) setFolio(d.folio);
        if (d.refNo) setRefNo(d.refNo);
        if (d.shares) setSharesCount(d.shares);
        if (d.certificates) setCertificatesCount(d.certificates);

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

The Company Secretary
${company}
${companyAddress}

${salutation}

${company.toUpperCase()}
APPROVAL OF TRANSMISSION / TRANSFER OF SHARES
${deceased} - Folio # ${folio}

We refer to the transmission case in respect of the above deceased shareholder. In this regard we are pleased to enclose herewith =${certificatesCount}= share certificates for =${sharesCount}= shares along with the relevant Transfer Register${includeLoss ? ", Loss Register" : ""}${includeSplit ? ", Split Register" : ""} and other supporting documents being forwarded to you for approval of transfers thereon by the Directors / Authorized Signatories.

The details of transfers being sent to you are given below:

No. of transfer receipt(s) : ${String(transferReceipts.length).padStart(2, '0')}
${transferReceipts.map(r => `Transfer receipt(s) # : ${r.receiptNo} (in the name of ${r.heirName})`).join("\n")}
Transfer register – no. of page(s) : ${transferPages}
${includeLoss ? `Loss receipt(s) # : ${lossReceiptNo}\nLoss register – no. of page(s) : ${lossRegisterPages}\n` : ""}${includeSplit ? `Split receipt(s) # : ${splitReceiptNo}\nSplit register – no. of page(s) : ${splitRegisterPages}\n` : ""}
Following actions are requested for approval of above transmission of shares:

${includeLoss ? `1. Authorized Signatory’s signatures on the face of =${duplicateCertsCount}= duplicate shares certificates.\n` : ""}${includeLoss ? "2." : "1."} Authorized Signatory’s signatures on the Memorandum of Transfers (on the back of each share certificate).
${includeLoss ? "3." : "2."} Authorized Signatory’s signature on Transfer register${includeLoss ? " & Loss register" : ""}${includeSplit ? " & Split register" : ""}.

After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case.

Further, please arrange to check whether any other dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid, if so, then please arrange to issue cheques(s) / online payment in favor of above legal heirs as per their entitlement.

Regards,

${signatory1Name}\t\t\t${signatory2Name}
${signatory1Designation}\t\t\t${signatory2Designation}

Encl.: As stated above.
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
      <LetterNavTabs currentType="physical-approval" />

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
                      <span>Upload Approval Letter / Ref</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-[#F37021] border-orange-200 py-0">
                        AI Vision
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document with AI..." : "Drop company letter image or PDF"}
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
                Physical Approval Parameters (Company Secretary)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              
              {/* Reference & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Reference #</label>
                  <Input 
                    value={refNo} 
                    onChange={(e) => setRefNo(e.target.value)}
                    className="h-8 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Letter Date</label>
                  <Input 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Addressee: Company Secretary */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Addressee: Company Secretary
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Company Name</label>
                    <Input 
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="h-8 text-xs font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Company Symbol</label>
                    <Input 
                      value={compSymbol}
                      onChange={(e) => setCompSymbol(e.target.value)}
                      className="h-8 text-xs font-mono bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 block">Company Registered Address</label>
                  <textarea 
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Deceased & Folio */}
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
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Folio #</label>
                  <Input 
                    value={folio} 
                    onChange={(e) => setFolio(e.target.value)}
                    className="h-8 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Share & Certificate Counts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block"># Share Certificates</label>
                  <Input 
                    value={certificatesCount} 
                    onChange={(e) => setCertificatesCount(e.target.value)}
                    className="h-8 text-xs font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Total Shares</label>
                  <Input 
                    value={sharesCount} 
                    onChange={(e) => setSharesCount(e.target.value)}
                    className="h-8 text-xs font-mono text-center font-bold"
                  />
                </div>
              </div>

              {/* Transfer Receipts List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Transfer Receipts & Heirs</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddReceipt}
                    className="h-7 text-[11px] px-2 text-[#0B2B5E] border-slate-300"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Receipt
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {transferReceipts.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <Input 
                        placeholder="Receipt #" 
                        value={row.receiptNo} 
                        onChange={(e) => handleReceiptChange(idx, "receiptNo", e.target.value)}
                        className="h-7 text-[11px] w-20 font-mono"
                      />
                      <Input 
                        placeholder="In the name of (Legal Heir)" 
                        value={row.heirName} 
                        onChange={(e) => handleReceiptChange(idx, "heirName", e.target.value)}
                        className="h-7 text-[11px] flex-1 font-semibold"
                      />
                      {transferReceipts.length > 1 && (
                        <button 
                          onClick={() => handleRemoveReceipt(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 block mt-1">Transfer Register Pages</label>
                  <Input 
                    value={transferPages}
                    onChange={(e) => setTransferPages(e.target.value)}
                    className="h-7 text-[11px] bg-white"
                  />
                </div>
              </div>

              {/* OPTIONAL: Loss Register Toggle & Details */}
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeLoss} 
                      onChange={(e) => setIncludeLoss(e.target.checked)}
                      className="rounded border-amber-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      Include Loss Register & Receipts
                    </span>
                  </label>
                  <span className="text-[10px] text-amber-700">Optional</span>
                </div>

                {includeLoss && (
                  <div className="pt-2 border-t border-amber-200/80 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-700 block">Loss Receipt #</label>
                        <Input 
                          value={lossReceiptNo}
                          onChange={(e) => setLossReceiptNo(e.target.value)}
                          className="h-7 text-[11px] font-mono bg-white"
                          placeholder="e.g. 295"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-700 block">Loss Pages</label>
                        <Input 
                          value={lossRegisterPages}
                          onChange={(e) => setLossRegisterPages(e.target.value)}
                          className="h-7 text-[11px] bg-white"
                          placeholder="02 (02 Copies)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-700 block"># Duplicate Certs</label>
                        <Input 
                          value={duplicateCertsCount}
                          onChange={(e) => setDuplicateCertsCount(e.target.value)}
                          className="h-7 text-[11px] font-mono bg-white"
                          placeholder="06"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* OPTIONAL: Split Register Toggle & Details */}
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeSplit} 
                      onChange={(e) => setIncludeSplit(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-blue-900">
                      Include Split Register & Receipts
                    </span>
                  </label>
                  <span className="text-[10px] text-blue-700">Optional</span>
                </div>

                {includeSplit && (
                  <div className="pt-2 border-t border-blue-200/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-700 block">Split Receipt #</label>
                        <Input 
                          value={splitReceiptNo}
                          onChange={(e) => setSplitReceiptNo(e.target.value)}
                          className="h-7 text-[11px] font-mono bg-white"
                          placeholder="e.g. 403"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-700 block">Split Pages</label>
                        <Input 
                          value={splitRegisterPages}
                          onChange={(e) => setSplitRegisterPages(e.target.value)}
                          className="h-7 text-[11px] bg-white"
                          placeholder="02 (02 Copies)"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Signatories */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Signatory 1</label>
                  <Input 
                    value={signatory1Name}
                    onChange={(e) => setSignatory1Name(e.target.value)}
                    className="h-7 text-[11px] font-medium mb-1"
                  />
                  <Input 
                    value={signatory1Designation}
                    onChange={(e) => setSignatory1Designation(e.target.value)}
                    className="h-7 text-[10px] text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Signatory 2</label>
                  <Input 
                    value={signatory2Name}
                    onChange={(e) => setSignatory2Name(e.target.value)}
                    className="h-7 text-[11px] font-medium mb-1"
                  />
                  <Input 
                    value={signatory2Designation}
                    onChange={(e) => setSignatory2Designation(e.target.value)}
                    className="h-7 text-[10px] text-slate-600"
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
              <div className="font-medium text-slate-900">The Company Secretary</div>
              <div className="font-bold text-slate-900">{company}</div>
              <div className="whitespace-pre-line text-slate-800">{companyAddress}</div>
            </div>

            {/* Salutation */}
            <div className="mb-4 font-medium">
              {salutation}
            </div>

            {/* Subject */}
            <div className="mb-6 leading-tight">
              <div className="font-bold text-slate-900 uppercase">
                {company} {compSymbol ? `(${compSymbol})` : ""}
              </div>
              <div className="font-bold text-slate-900">
                APPROVAL OF TRANSMISSION / TRANSFER OF SHARES
              </div>
              <div className="font-bold text-slate-900">
                {deceased} - Folio # {folio}
              </div>
            </div>

            {/* Opening Paragraph */}
            <div className="mb-4 text-justify">
              We refer to the transmission case in respect of the above deceased shareholder. In this regard we are pleased to enclose herewith <strong>={certificatesCount}=</strong> share certificates for <strong>={sharesCount}=</strong> shares along with the relevant Transfer Register{includeLoss ? ", Loss Register" : ""}{includeSplit ? ", Split Register" : ""} and other supporting documents being forwarded to you for approval of transfers thereon by the Directors / Authorized Signatories.
            </div>

            {/* Transfer Details Header */}
            <div className="mb-3 font-semibold">
              The details of transfers being sent to you are given below:
            </div>

            {/* Details Block */}
            <div className="mb-6 pl-4 space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-64 font-sans font-medium text-slate-700">No. of transfer receipt(s) :</span>
                <span className="font-bold">{String(transferReceipts.length).padStart(2, '0')}</span>
              </div>

              {transferReceipts.map((r, i) => (
                <div key={i} className="flex">
                  <span className="w-64 font-sans font-medium text-slate-700">Transfer receipt(s) # :</span>
                  <span className="font-bold">{r.receiptNo}</span>
                  <span className="font-sans font-medium ml-2 text-slate-700">(in the name of {r.heirName})</span>
                </div>
              ))}

              <div className="flex">
                <span className="w-64 font-sans font-medium text-slate-700">Transfer register – no. of page(s) :</span>
                <span className="font-bold">{transferPages}</span>
              </div>

              {includeLoss && (
                <>
                  <div className="flex">
                    <span className="w-64 font-sans font-medium text-slate-700">Loss receipt(s) # :</span>
                    <span className="font-bold">{lossReceiptNo}</span>
                  </div>
                  <div className="flex">
                    <span className="w-64 font-sans font-medium text-slate-700">Loss register – no. of page(s) :</span>
                    <span className="font-bold">{lossRegisterPages}</span>
                  </div>
                </>
              )}

              {includeSplit && (
                <>
                  <div className="flex">
                    <span className="w-64 font-sans font-medium text-slate-700">Split receipt(s) # :</span>
                    <span className="font-bold">{splitReceiptNo}</span>
                  </div>
                  <div className="flex">
                    <span className="w-64 font-sans font-medium text-slate-700">Split register – no. of page(s) :</span>
                    <span className="font-bold">{splitRegisterPages}</span>
                  </div>
                </>
              )}
            </div>

            {/* Requested Actions */}
            <div className="mb-4 font-semibold">
              Following actions are requested for approval of above transmission of shares:
            </div>

            <ol className="list-decimal pl-6 mb-6 space-y-1.5 text-justify">
              {includeLoss && (
                <li>
                  Authorized Signatory’s signatures on the face of <strong>={duplicateCertsCount}=</strong> duplicate shares certificates.
                </li>
              )}
              <li>
                Authorized Signatory’s signatures on the Memorandum of Transfers (on the back of each share certificate).
              </li>
              <li>
                Authorized Signatory’s signature on Transfer register{includeLoss ? " & Loss register" : ""}{includeSplit ? " & Split register" : ""}.
              </li>
            </ol>

            {/* Return Instructions */}
            <div className="mb-4 text-justify">
              After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case.
            </div>

            {/* Dividend Inquiry */}
            <div className="mb-8 text-justify">
              Further, please arrange to check whether any other dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid, if so, then please arrange to issue cheques(s) / online payment in favor of above legal heirs as per their entitlement.
            </div>

            {/* Signatures */}
            <div className="mb-4">
              Yours faithfully,
              <div className="font-bold mt-1">For CDC Share Registrar Services Limited</div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10">
              <div>
                <div className="w-48 border-t border-slate-900 pt-1 font-bold text-xs">
                  {signatory1Name}
                </div>
                <div className="text-xs text-slate-600">{signatory1Designation}</div>
              </div>
              <div className="text-right">
                <div className="w-48 border-t border-slate-900 pt-1 font-bold text-xs ml-auto">
                  {signatory2Name}
                </div>
                <div className="text-xs text-slate-600">{signatory2Designation}</div>
              </div>
            </div>

            {/* Enclosures */}
            <div className="mt-6 text-xs text-slate-600">
              Encl.: As stated above.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
