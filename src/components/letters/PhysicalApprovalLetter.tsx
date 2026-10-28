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
  FileCheck2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";

export interface TransferReceiptItem {
  receiptNo: string;
  heirName: string;
}

export function PhysicalApprovalLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/PSO/1210/26");
  const [date, setDate] = useState("July 10, 2026");

  // Company Secretary (Recipient)
  const [secretaryName, setSecretaryName] = useState("Ms. Ambreen Ali");
  const [secretaryTitle, setSecretaryTitle] = useState("Company Secretary");
  const [company, setCompany] = useState("Pakistan State Oil Company Limited");
  const [compSymbol, setCompSymbol] = useState("PSO");
  const [companyAddress, setCompanyAddress] = useState(
    "PSO House,\nKhayaban-e-Iqbal, Clifton,\nKarachi-75600."
  );
  const [salutation, setSalutation] = useState("Dear Madam,");

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

  // Loss Receipts & Register
  const [lossReceiptNo, setLossReceiptNo] = useState("295");
  const [lossRegisterPages, setLossRegisterPages] = useState("02 (02 Copies)");

  // Split Receipts & Register
  const [splitReceiptNo, setSplitReceiptNo] = useState("403");
  const [splitRegisterPages, setSplitRegisterPages] = useState("02 (02 Copies)");

  // Actions Requested
  const [duplicateCertsCount, setDuplicateCertsCount] = useState("06");

  // Signatories
  const [signatory1Name, setSignatory1Name] = useState("Zohaib Jamal");
  const [signatory1Designation, setSignatory1Designation] = useState("Senior Officer");
  const [signatory2Name, setSignatory2Name] = useState("M. Riaz Akhtar");
  const [signatory2Designation, setSignatory2Designation] = useState("Assistant Manager");

  // UI States
  const [copied, setCopied] = useState(false);
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

  // AI Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("letterType", "physical_approval");

      const res = await fetch("/api/parse-letter", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.parsed) {
          const p = data.parsed;
          if (p.company) setCompany(p.company);
          if (p.folio) setFolio(p.folio);
          if (p.deceased) setDeceased(p.deceased.startsWith("Late") ? p.deceased : `Late ${p.deceased}`);
          if (p.certificates) setCertificatesCount(p.certificates.replace(/[=]/g, ""));
          if (p.shares) setSharesCount(p.shares.replace(/[=]/g, ""));

          setUploadSuccess("Approval letter details auto-filled.");
        }
      }
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopyText = () => {
    const text = `
${refNo}
${date}

${secretaryName}
${secretaryTitle}
${company}
${companyAddress}

${salutation}

${company} (${compSymbol})
Transmission of Shares & Dividends – ${deceased} – Folio # ${folio}

We refer to your office letter ref: ${companyLetterRef} dated ${companyLetterDate} regarding approval of transmission of shares in favor of legal heirs of above deceased shareholder.

In this regard we are pleased to enclose herewith =${certificatesCount}= share certificates for =${sharesCount}= shares along with their relevant Loss & Transfer registers and other supporting documents being forwarding to you for approval of transfers thereon by the Directors / Authorized Signatories.

The details of transfers being sent to you are given below:

No. of transfer receipt(s) : ${String(transferReceipts.length).padStart(2, '0')}
${transferReceipts.map(r => `Transfer receipt(s) # : ${r.receiptNo} (in the name of ${r.heirName})`).join("\n")}
Transfer register – no. of page(s) : ${transferPages}
Loss receipt(s) # : ${lossReceiptNo}
Loss register – no. of page(s) : ${lossRegisterPages}
Split receipt(s) # : ${splitReceiptNo}
Split register – no. of page(s) : ${splitRegisterPages}

Following actions are requested for approval of above transmission of shares:

1. Authorized Signatory’s signatures on the face of =${duplicateCertsCount}= duplicate shares certificates.
2. Authorized Signatory’s signatures on the Memorandum of Transfers (on the back of each share certificate).
3. Authorized Signatory’s signature on Loss & Transfer register.

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
                      {uploading ? "Analyzing document with Gemini AI..." : "Drop company letter image or PDF"}
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
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-xs font-bold text-[#0B2B5E]">
                Physical Approval Parameters (Company Secretary)
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

              {/* Company Secretary (Recipient) */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Company Secretary (Addressee)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Secretary Name (e.g. Ms. Ambreen Ali)"
                    value={secretaryName}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                  <Input 
                    placeholder="Title (Company Secretary)"
                    value={secretaryTitle}
                    onChange={(e) => setSecretaryTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input 
                    placeholder="Company Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-8 text-xs font-medium col-span-2"
                  />
                  <Input 
                    placeholder="Symbol (PSO)"
                    value={compSymbol}
                    onChange={(e) => setCompSymbol(e.target.value)}
                    className="h-8 text-xs uppercase"
                  />
                </div>
                <textarea 
                  rows={2}
                  placeholder="Secretary / Head Office Address..."
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full rounded-md border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Deceased & Company Reference */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Deceased Shareholder</label>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Company Ref Letter #</label>
                  <Input 
                    placeholder="e.g. MS/Transm/657"
                    value={companyLetterRef} 
                    onChange={(e) => setCompanyLetterRef(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Company Letter Date</label>
                  <Input 
                    placeholder="e.g. May 18, 2026"
                    value={companyLetterDate} 
                    onChange={(e) => setCompanyLetterDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Share & Certificate Counts */}
              <div className="grid grid-cols-3 gap-2">
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
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block"># Duplicate Certs</label>
                  <Input 
                    value={duplicateCertsCount} 
                    onChange={(e) => setDuplicateCertsCount(e.target.value)}
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
              </div>

              {/* Loss & Split Registers Controls */}
              <div className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 block">
                  Loss, Split & Transfer Register Pages
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Loss Receipt #</label>
                    <Input 
                      value={lossReceiptNo}
                      onChange={(e) => setLossReceiptNo(e.target.value)}
                      className="h-7 text-[11px] font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Loss Register Pages</label>
                    <Input 
                      value={lossRegisterPages}
                      onChange={(e) => setLossRegisterPages(e.target.value)}
                      className="h-7 text-[11px] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Split Receipt #</label>
                    <Input 
                      value={splitReceiptNo}
                      onChange={(e) => setSplitReceiptNo(e.target.value)}
                      className="h-7 text-[11px] font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Split Register Pages</label>
                    <Input 
                      value={splitRegisterPages}
                      onChange={(e) => setSplitRegisterPages(e.target.value)}
                      className="h-7 text-[11px] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 block">Transfer Register Pages</label>
                  <Input 
                    value={transferPages}
                    onChange={(e) => setTransferPages(e.target.value)}
                    className="h-7 text-[11px] bg-white"
                  />
                </div>
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
          
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-[#0B2B5E] border-blue-200 text-xs">
                Official Letter Preview (A4)
              </Badge>
              <span className="text-[11px] text-slate-500">Live preview</span>
            </div>
            <div className="flex items-center gap-2">
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
            </div>

            <div className="mb-6 font-medium text-slate-900">
              {date}
            </div>

            {/* Recipient Address */}
            <div className="mb-6 leading-snug">
              <div className="font-bold text-slate-900">{secretaryName}</div>
              <div className="text-slate-800">{secretaryTitle}</div>
              <div className="font-semibold text-slate-900">{company}</div>
              <div className="whitespace-pre-line text-slate-800">{companyAddress}</div>
            </div>

            {/* Salutation */}
            <div className="mb-4 font-medium">
              {salutation}
            </div>

            {/* Subject Header */}
            <div className="mb-5 leading-normal">
              <div className="font-bold text-slate-900 underline decoration-slate-900">
                {company} ({compSymbol})
              </div>
              <div className="font-bold text-slate-900 underline decoration-slate-900">
                Transmission of Shares & Dividends – {deceased} – Folio # {folio}
              </div>
            </div>

            {/* Body Paragraphs */}
            <p className="mb-4 text-justify leading-relaxed">
              We refer to your office letter ref: <span className="font-semibold">{companyLetterRef}</span> dated <span className="font-semibold">{companyLetterDate}</span> regarding approval of transmission of shares in favor of legal heirs of above deceased shareholder.
            </p>

            <p className="mb-4 text-justify leading-relaxed">
              In this regard we are pleased to enclose herewith <span className="font-bold">={certificatesCount}=</span> share certificates for <span className="font-bold">={sharesCount}=</span> shares along with their relevant Loss & Transfer registers and other supporting documents being forwarding to you for approval of transfers thereon by the Directors / Authorized Signatories.
            </p>

            {/* Details of Transfers */}
            <div className="mb-5 space-y-1">
              <div className="font-medium mb-1.5">The details of transfers being sent to you are given below:</div>
              <div className="grid grid-cols-12 gap-1 text-[13px] pl-1 font-mono">
                <span className="col-span-5 text-slate-700">No. of transfer receipt(s)</span>
                <span className="col-span-7">: {String(transferReceipts.length).padStart(2, '0')}</span>
                
                {transferReceipts.map((r, i) => (
                  <div key={i} className="col-span-12 grid grid-cols-12">
                    <span className="col-span-5 text-slate-700">Transfer receipt(s) #</span>
                    <span className="col-span-7">: {r.receiptNo} (in the name of {r.heirName})</span>
                  </div>
                ))}

                <span className="col-span-5 text-slate-700">Transfer register – no. of page(s)</span>
                <span className="col-span-7">: {transferPages}</span>

                <span className="col-span-5 text-slate-700">Loss receipt(s) #</span>
                <span className="col-span-7">: {lossReceiptNo}</span>

                <span className="col-span-5 text-slate-700">Loss register – no. of page(s)</span>
                <span className="col-span-7">: {lossRegisterPages}</span>

                <span className="col-span-5 text-slate-700">Split receipt(s) #</span>
                <span className="col-span-7">: {splitReceiptNo}</span>

                <span className="col-span-5 text-slate-700">Split register – no. of page(s)</span>
                <span className="col-span-7">: {splitRegisterPages}</span>
              </div>
            </div>

            {/* Actions Requested */}
            <div className="mb-5 space-y-2 text-justify">
              <p className="font-medium">Following actions are requested for approval of above transmission of shares:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Authorized Signatory’s signatures on the face of <span className="font-bold">={duplicateCertsCount}=</span> duplicate shares certificates.</li>
                <li>Authorized Signatory’s signatures on the Memorandum of Transfers (on the back of each share certificate).</li>
                <li>Authorized Signatory’s signature on Loss & Transfer register.</li>
              </ol>
            </div>

            {/* Closing Instructions */}
            <div className="space-y-3 mb-10 text-justify">
              <p>
                After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case.
              </p>
              <p>
                Further, please arrange to check whether any other dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid, if so, then please arrange to issue cheques(s) / online payment in favor of above legal heirs as per their entitlement.
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-8">
              <div className="font-medium mb-12">Regards,</div>
              <div className="flex justify-between items-end pt-4">
                <div className="w-56 text-left">
                  <div className="font-bold text-slate-900">{signatory1Name}</div>
                  <div className="text-xs text-slate-700 font-medium">{signatory1Designation}</div>
                </div>
                <div className="w-56 text-right">
                  <div className="font-bold text-slate-900">{signatory2Name}</div>
                  <div className="text-xs text-slate-700 font-medium">{signatory2Designation}</div>
                </div>
              </div>
              <div className="mt-8 text-xs font-medium text-slate-700">
                Encl.: As stated above.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
