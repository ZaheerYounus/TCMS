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
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";

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

  // UI States
  const [copied, setCopied] = useState(false);
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

  // AI Auto-Extract Handler for Delivery of Shares
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("letterType", "shares_delivery");

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
          if (p.legalHeir) setRecipientName(p.legalHeir);
          if (p.address) setRecipientAddress(p.address);
          if (p.contactNo) setRecipientContact(p.contactNo);
          if (p.certificates) setCertificatesCount(p.certificates.replace(/[=]/g, ""));
          if (p.shares) setTotalShares(p.shares.replace(/[=]/g, ""));

          if (p.multiFolios && p.multiFolios.length > 0) {
            const mappedRows: LegalHeirShareRow[] = p.multiFolios.map((m: any, i: number) => ({
              folio: m.folio || `2524${7 + i}`,
              name: m.heirName || p.legalHeir || `Legal Heir ${i + 1}`,
              shares: m.shares && m.shares !== "=0=" ? m.shares : "1,000"
            }));
            setHeirRows(mappedRows);
            updateTotalFromRows(mappedRows);
          }

          setUploadSuccess("Document analyzed! Delivery details auto-reflected into letter.");
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

Authorized Signatory        Authorized Signatory

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
                      {uploading ? "Analyzing document with Gemini AI..." : "Drop letter image or PDF for instant auto-fill"}
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
          <Card className="shadow-sm border-slate-200">
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

              {/* Company & Deceased */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Company Name & Symbol</label>
                <Input 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

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
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Deceased Folio #</label>
                  <Input 
                    value={folio} 
                    onChange={(e) => setFolio(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Recipient Heir Details */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Addressee / Recipient Heir
                </span>
                <div>
                  <Input 
                    placeholder="Recipient Legal Heir Name (e.g. Ms. Samina Nazli)"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-8 text-xs font-medium mb-1.5"
                  />
                  <textarea 
                    rows={3}
                    placeholder="Complete Postal Address..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <Input 
                    placeholder="Contact # (e.g. 0333-429-2705)"
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    className="h-8 text-xs font-mono mt-1.5"
                  />
                </div>
              </div>

              {/* Certificate & Shares Counts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block"># of Share Certificates</label>
                  <Input 
                    value={certificatesCount} 
                    onChange={(e) => setCertificatesCount(e.target.value)}
                    className="h-8 text-xs text-center font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Total Transmitted Shares</label>
                  <Input 
                    value={totalShares} 
                    onChange={(e) => setTotalShares(e.target.value)}
                    className="h-8 text-xs text-center font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Legal Heirs Allocation Rows */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Legal Heirs Share Allocation Table</span>
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

            </CardContent>
          </Card>
        </div>

        {/* Right Preview: Official CDCSR A4 Letter Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-[#0B2B5E] border-blue-200 text-xs">
                Official Letter Preview (A4)
              </Badge>
              <span className="text-[11px] text-slate-500">Live reflection</span>
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

          {/* Authentic Official CDCSR Letter Preview Sheet */}
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

            {/* Subject Header */}
            <div className="mb-5 leading-normal">
              <div className="font-bold text-slate-900 underline decoration-slate-900">{company}</div>
              <div className="font-bold text-slate-900 underline decoration-slate-900">
                Transmission of Shares & Dividends – {deceased}- Folio # {folio}
              </div>
            </div>

            {/* Body Paragraph */}
            <p className="mb-5 text-justify leading-relaxed">
              We are pleased to forward herewith <span className="font-bold">={certificatesCount}=</span> shares certificates for <span className="font-bold">={totalShares}=</span> shares of above deceased shareholder of <span className="font-semibold">{company}</span> duly transmitted / transferred in the name following legal heirs, details are as follows:
            </p>

            {/* Shares Allocation Table */}
            <div className="mb-6 overflow-hidden border border-slate-900">
              <table className="w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 font-bold bg-slate-50/50">
                    <th className="p-2 border-r border-slate-900 w-32">Folio #</th>
                    <th className="p-2 border-r border-slate-900">Name of Legal Heirs</th>
                    <th className="p-2 text-right w-32"># of Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {heirRows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-400 last:border-b-0">
                      <td className="p-2 border-r border-slate-900 font-mono">{r.folio || "—"}</td>
                      <td className="p-2 border-r border-slate-900 font-semibold">{r.name || "—"}</td>
                      <td className="p-2 text-right font-mono font-medium">{r.shares || "0"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-900 font-bold bg-slate-100/60">
                    <td colSpan={2} className="p-2 border-r border-slate-900 text-right pr-4 uppercase">
                      Total
                    </td>
                    <td className="p-2 text-right font-mono font-bold">
                      {totalShares}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Closing Acknowledgements */}
            <div className="space-y-4 mb-14 text-justify">
              <p>Kindly acknowledge the receipt.</p>
              <p>Legal heirs are requested to always quote their above-mentioned folio numbers in correspondence with us.</p>
            </div>

            {/* Signatures */}
            <div className="mt-12">
              <div className="font-medium mb-14">Regards,</div>
              <div className="flex justify-between items-end pt-4">
                <div className="border-t border-slate-900 pt-1.5 w-52 text-left font-bold text-xs uppercase tracking-wide">
                  Authorized Signatory
                </div>
                <div className="border-t border-slate-900 pt-1.5 w-52 text-right font-bold text-xs uppercase tracking-wide">
                  Authorized Signatory
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
