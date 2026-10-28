"use client";

import { useState, useRef } from "react";
import { 
  Building2, 
  Send, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  UploadCloud, 
  Sparkles,
  FileText,
  User,
  MapPin,
  Phone,
  Layers,
  ArrowRight,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";
import { exportSharesDeliveryDocx } from "@/lib/docxExport";

export interface LegalHeirShareRow {
  folio: string;
  name: string;
  shares: string;
}

export function SharesDeliveryLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/BAHL/1138/26");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });

  // Recipient (Legal Heir Representative)
  const [recipientName, setRecipientName] = useState("Ms. Samina Nazli");
  const [recipientAddress, setRecipientAddress] = useState(
    "House No. 3-A, Street No. 8,\nImran Street, Mohallah Chohan Road,\nIslampura,\nLahore."
  );
  const [recipientContact, setRecipientContact] = useState("0333-429-2705");

  // Corporate & Deceased Details
  const [company, setCompany] = useState("Bank AL Habib Limited (BAHL)");
  const [deceased, setDeceased] = useState("Late Mohammad Boota Bhatti");
  const [folio, setFolio] = useState("23927");

  // Certificate & Share Quantities
  const [certificatesCount, setCertificatesCount] = useState("20");
  const [totalShares, setTotalShares] = useState("3,963");

  // Legal Heirs Allocation Table
  const [heirRows, setHeirRows] = useState<LegalHeirShareRow[]>([
    { folio: "25247", name: "MS. SAMINA NAZLI", shares: "990" },
    { folio: "25248", name: "MS. SHABANA NAZLI", shares: "990" },
    { folio: "25249", name: "MR. FARRUKH AFTAB AHMED", shares: "1,983" }
  ]);

  // Signatories
  const [signatory1, setSignatory1] = useState("Authorized Signatory");
  const [signatory2, setSignatory2] = useState("Authorized Signatory");

  // UI States
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Recalculate total shares automatically when rows change
  const updateTotalFromRows = (rows: LegalHeirShareRow[]) => {
    let sum = 0;
    for (const r of rows) {
      const num = parseInt(r.shares.replace(/,/g, ""), 10);
      if (!isNaN(num)) sum += num;
    }
    if (sum > 0) {
      setTotalShares(sum.toLocaleString());
    }
  };

  const handleAddRow = () => {
    const updated = [...heirRows, { folio: "", name: "", shares: "" }];
    setHeirRows(updated);
  };

  const handleRemoveRow = (idx: number) => {
    const updated = heirRows.filter((_, i) => i !== idx);
    setHeirRows(updated);
    updateTotalFromRows(updated);
  };

  const handleRowChange = (idx: number, field: keyof LegalHeirShareRow, val: string) => {
    const updated = [...heirRows];
    updated[idx][field] = val;
    setHeirRows(updated);
    if (field === "shares") {
      updateTotalFromRows(updated);
    }
  };

  // Word Document (.docx) Export
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await exportSharesDeliveryDocx({
        refNo,
        date,
        recipientName,
        recipientAddress,
        recipientContact,
        company,
        deceased,
        folio,
        certificatesCount,
        totalShares,
        heirRows,
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
          setDeceased(cleanDeceased);
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
          setCompany(d.company);
        }
        if (d.folio) {
          setFolio(d.folio);
        }
        if (d.certificates) {
          setCertificatesCount(d.certificates);
        }
        if (d.shares) {
          setTotalShares(d.shares);
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
${recipientAddress}
Contact # ${recipientContact}

Dear Concern,

${company}
Transmission of Shares & Dividends – ${deceased}- Folio # ${folio}

We are pleased to forward herewith =${certificatesCount}= shares certificates for =${totalShares}= shares of above deceased shareholder of ${company} duly transmitted / transferred in the name following legal heirs, details are as follows:

Folio #\tName of Legal Heirs\t# of Shares
${heirRows.map(r => `${r.folio}\t${r.name}\t${r.shares}`).join("\n")}
Total\t\t${totalShares}

Kindly acknowledge the receipt.

Legal heirs are requested to always quote their above-mentioned folio numbers in correspondence with us.

Regards,

${signatory1}        ${signatory2}

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
      <LetterNavTabs currentType="shares-delivery" />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Dedicated Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick AI Upload / Camera Dropzone */}
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
                      <span>Upload / Scan Document</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-[#F37021] border-orange-200 py-0">
                        AI Vision
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document with AI..." : "Drop letter image or PDF for instant auto-fill"}
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

          {/* Letter Parameters Form */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-xs font-bold text-[#0B2B5E] flex items-center justify-between">
                <span>Delivery of Shares Details</span>
                <span className="text-[11px] font-normal text-slate-500">All fields auto-update preview</span>
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

              {/* Company & Folio */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Company Name</label>
                  <Input 
                    value={company} 
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Deceased Folio #</label>
                  <Input 
                    value={folio} 
                    onChange={(e) => setFolio(e.target.value)}
                    className="h-8 text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* Deceased Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Deceased Shareholder Name</label>
                <Input 
                  value={deceased} 
                  onChange={(e) => setDeceased(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              {/* Recipient Representative Info */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Addressee / Legal Heir Representative
                </span>
                <div>
                  <Input 
                    placeholder="Recipient Name (e.g. Ms. Samina Nazli)" 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-8 text-xs font-medium mb-1.5"
                  />
                  <textarea 
                    rows={3}
                    placeholder="Complete Postal Address (leave blank if missing)..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <Input 
                    placeholder="Contact # (e.g. 0333-429-2705)" 
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    className="h-8 text-xs font-mono mt-1.5"
                  />
                </div>
              </div>

              {/* Share & Certificate Counts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block"># Certificates</label>
                  <Input 
                    value={certificatesCount} 
                    onChange={(e) => setCertificatesCount(e.target.value)}
                    className="h-8 text-xs font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Total Transmitted Shares</label>
                  <Input 
                    value={totalShares} 
                    onChange={(e) => setTotalShares(e.target.value)}
                    className="h-8 text-xs font-mono text-center font-bold text-blue-900 bg-blue-50"
                  />
                </div>
              </div>

              {/* Legal Heirs Allocation Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">Legal Heirs Allocation Table</span>
                    <span className="text-[10px] text-slate-500">Folios & share quantities per heir</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddRow}
                    className="h-7 text-[11px] px-2 text-[#0B2B5E] border-slate-300"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Heir
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {heirRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <Input 
                        placeholder="Folio #" 
                        value={row.folio} 
                        onChange={(e) => handleRowChange(idx, "folio", e.target.value)}
                        className="h-7 text-[11px] w-20 font-mono"
                      />
                      <Input 
                        placeholder="Legal Heir Name" 
                        value={row.name} 
                        onChange={(e) => handleRowChange(idx, "name", e.target.value)}
                        className="h-7 text-[11px] flex-1 font-medium"
                      />
                      <Input 
                        placeholder="# Shares" 
                        value={row.shares} 
                        onChange={(e) => handleRowChange(idx, "shares", e.target.value)}
                        className="h-7 text-[11px] w-20 text-right font-mono"
                      />
                      {heirRows.length > 1 && (
                        <button 
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
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
              <span className="text-[11px] text-slate-500">Live reflection</span>
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

          {/* Authentic Official CDCSR Letter Preview Sheet */}
          <div className="bg-white border border-slate-300 shadow-md rounded-sm p-10 min-h-[840px] text-slate-900 font-sans text-[13.5px] leading-relaxed relative print:m-0 print:border-none print:shadow-none print:p-0">
            
            {/* Top Reference & Date Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="font-medium text-slate-900">{refNo}</div>
            </div>

            <div className="mb-6 font-medium text-slate-900">
              {date}
            </div>

            {/* Recipient Address */}
            <div className="mb-6 leading-snug">
              <div className="font-bold text-slate-900">{recipientName}</div>
              <div className="whitespace-pre-line text-slate-800">{recipientAddress}</div>
              {recipientContact && (
                <div className="text-slate-800 mt-1 font-medium">Contact # {recipientContact}</div>
              )}
            </div>

            {/* Salutation */}
            <div className="mb-4 font-medium">
              Dear Concern,
            </div>

            {/* Subject Line */}
            <div className="mb-6 leading-tight">
              <div className="font-bold text-slate-900 uppercase">
                {company}
              </div>
              <div className="font-bold text-slate-900">
                Transmission of Shares & Dividends – {deceased}- Folio # {folio}
              </div>
            </div>

            {/* Body Paragraph */}
            <div className="mb-6 text-justify">
              We are pleased to forward herewith <strong>={certificatesCount}=</strong> shares certificates for <strong>={totalShares}=</strong> shares of above deceased shareholder of {company} duly transmitted / transferred in the name following legal heirs, details are as follows:
            </div>

            {/* Allocation Table */}
            <div className="mb-6 overflow-hidden border border-slate-300 rounded-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <th className="py-2 px-3 border-r border-slate-300">Folio #</th>
                    <th className="py-2 px-3 border-r border-slate-300">Name of Legal Heirs</th>
                    <th className="py-2 px-3 text-right"># of Shares</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {heirRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-medium border-r border-slate-300">{r.folio}</td>
                      <td className="py-2 px-3 font-medium border-r border-slate-300">{r.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{r.shares}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider text-[11px] border-r border-slate-300">Total</td>
                    <td className="py-2 px-3 text-right font-mono text-sm">{totalShares}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Acknowledgement Instructions */}
            <div className="space-y-4 mb-10 text-justify">
              <div>Kindly acknowledge the receipt.</div>
              <div>
                Legal heirs are requested to always quote their above-mentioned folio numbers in correspondence with us.
              </div>
            </div>

            {/* Closing & Signatures */}
            <div className="mb-6">
              Regards,
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8">
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

            {/* Enclosures */}
            <div className="mt-8 text-xs text-slate-600">
              Encl.: As stated above.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
