"use client";

import { useState, useRef } from "react";
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  UploadCloud, 
  Sparkles,
  Building2,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";

export interface ChequeRow {
  beneficiary: string;
  instrumentNo: string;
  amount: string;
}

export function ChequesDeliveryLetter() {
  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/BAHL/1141/26");
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
  const [company, setCompany] = useState("Bank AL-Habib Limited (BAHL)");
  const [deceased, setDeceased] = useState("Late Ms. Munnaza Nazli");
  const [deceasedDetailNote, setDeceasedDetailNote] = useState("Legal heir of Late Mohammad Boota Bhatti");
  const [folio, setFolio] = useState("23927");

  // Banker's Cheques Rows
  const [chequeCount, setChequeCount] = useState("3");
  const [cheques, setCheques] = useState<ChequeRow[]>([
    { beneficiary: "Farrukh Aftab Ahmed", instrumentNo: "13519474", amount: "4,160.99/-" },
    { beneficiary: "Samina Nazli", instrumentNo: "13519475", amount: "2,080.49/-" },
    { beneficiary: "Shabana Nazli", instrumentNo: "13519476", amount: "2,080.49/-" }
  ]);

  // UI States
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddRow = () => {
    const updated = [...cheques, { beneficiary: "", instrumentNo: "", amount: "" }];
    setCheques(updated);
    setChequeCount(updated.length.toString());
  };

  const handleRemoveRow = (idx: number) => {
    const updated = cheques.filter((_, i) => i !== idx);
    setCheques(updated);
    setChequeCount(updated.length.toString());
  };

  const handleRowChange = (idx: number, field: keyof ChequeRow, val: string) => {
    const updated = [...cheques];
    updated[idx][field] = val;
    setCheques(updated);
  };

  // AI Document Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("letterType", "cheques_delivery");

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

          setUploadSuccess("Document analyzed! Cheques details auto-reflected into letter.");
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
Transmission of Dividends – ${deceased}${deceasedDetailNote ? ` (${deceasedDetailNote})` : ""} – Folio # ${folio}

We are pleased to forward herewith =${chequeCount}= Banker’s cheques against unpaid dividend warrants of above deceased shareholder of ${company} duly issued in the name of following legal heirs, details are as follows:

Beneficiary\tInstrument #\tAmount
${cheques.map(c => `${c.beneficiary}\t${c.instrumentNo}\t${c.amount}`).join("\n")}

Please note that there is no outstanding dividend remaining in the name of deceased shareholder.

Kindly acknowledge the receipt.

Regards,

Authorized Signatory        Authorized Signatory

Encl.: As Stated Above
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
      <LetterNavTabs currentType="cheques-delivery" />

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

          {/* Form Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-xs font-bold text-[#0B2B5E] flex items-center justify-between">
                <span>Delivery of Cheques Parameters</span>
                <span className="text-[11px] font-normal text-slate-500">Auto-reflected in preview</span>
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

              {/* Company & Deceased Details */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Company Name</label>
                <Input 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

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
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Relationship / Sub-note (Optional)</label>
                <Input 
                  placeholder="e.g. Legal heir of Late Mohammad Boota Bhatti"
                  value={deceasedDetailNote} 
                  onChange={(e) => setDeceasedDetailNote(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Recipient Heir Details */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Addressee / Recipient Details
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

              {/* Banker's Cheques Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">Banker&apos;s Cheques Table</span>
                    <Badge variant="secondary" className="text-[10px] font-mono py-0">
                      ={chequeCount}= Cheques
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddRow}
                    className="h-7 text-[11px] px-2 text-[#0B2B5E] border-slate-300"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Cheque
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {cheques.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <Input 
                        placeholder="Beneficiary Name" 
                        value={row.beneficiary} 
                        onChange={(e) => handleRowChange(idx, "beneficiary", e.target.value)}
                        className="h-7 text-[11px] flex-1 font-medium"
                      />
                      <Input 
                        placeholder="Instrument #" 
                        value={row.instrumentNo} 
                        onChange={(e) => handleRowChange(idx, "instrumentNo", e.target.value)}
                        className="h-7 text-[11px] w-24 font-mono"
                      />
                      <Input 
                        placeholder="Amount" 
                        value={row.amount} 
                        onChange={(e) => handleRowChange(idx, "amount", e.target.value)}
                        className="h-7 text-[11px] w-24 text-right font-mono font-medium"
                      />
                      {cheques.length > 1 && (
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
                Transmission of Dividends – {deceased}{deceasedDetailNote ? ` (${deceasedDetailNote})` : ""} – Folio # {folio}
              </div>
            </div>

            {/* Body Paragraph */}
            <p className="mb-5 text-justify leading-relaxed">
              We are pleased to forward herewith <span className="font-bold">={chequeCount}=</span> Banker’s cheques against unpaid dividend warrants of above deceased shareholder of <span className="font-semibold">{company}</span> duly issued in the name of following legal heirs, details are as follows:
            </p>

            {/* Cheques Table */}
            <div className="mb-6 overflow-hidden border border-slate-900">
              <table className="w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 font-bold bg-slate-50/50">
                    <th className="p-2 border-r border-slate-900">Beneficiary</th>
                    <th className="p-2 border-r border-slate-900 w-36">Instrument #</th>
                    <th className="p-2 text-right w-36">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cheques.map((c, i) => (
                    <tr key={i} className="border-b border-slate-400 last:border-b-0">
                      <td className="p-2 border-r border-slate-900 font-semibold">{c.beneficiary || "—"}</td>
                      <td className="p-2 border-r border-slate-900 font-mono">{c.instrumentNo || "—"}</td>
                      <td className="p-2 text-right font-mono font-medium">{c.amount || "0/-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statement of Dividend Status */}
            <div className="space-y-4 mb-14 text-justify">
              <p>Please note that there is no outstanding dividend remaining in the name of deceased shareholder.</p>
              <p>Kindly acknowledge the receipt.</p>
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
                Encl.: As Stated Above
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
