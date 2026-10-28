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
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";
import { exportChequesDeliveryDocx } from "@/lib/docxExport";

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
  const [company, setCompany] = useState("Bank AL Habib Limited (BAHL)");
  const [deceased, setDeceased] = useState("Mohammad Boota Bhatti");
  const [folio, setFolio] = useState("23927");

  // Cheque Rows
  const [chequeRows, setChequeRows] = useState<ChequeRow[]>([
    { beneficiary: "Farrukh Aftab Ahmed", instrumentNo: "13519474", amount: "4,160.99" },
    { beneficiary: "Samina Nazli", instrumentNo: "13519475", amount: "2,080.49" },
    { beneficiary: "Shabana Nazli", instrumentNo: "13519476", amount: "2,080.49" }
  ]);
  const [totalAmount, setTotalAmount] = useState("8,321.97");

  // Signatories
  const [signatory1, setSignatory1] = useState("Authorized Signatory");
  const [signatory2, setSignatory2] = useState("Authorized Signatory");

  // UI States
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Recalculate total amount when rows change
  const updateTotalAmount = (rows: ChequeRow[]) => {
    let sum = 0;
    for (const r of rows) {
      const num = parseFloat(r.amount.replace(/,/g, ""));
      if (!isNaN(num)) sum += num;
    }
    if (sum > 0) {
      setTotalAmount(sum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  const handleAddRow = () => {
    const updated = [...chequeRows, { beneficiary: "", instrumentNo: "", amount: "" }];
    setChequeRows(updated);
  };

  const handleRemoveRow = (idx: number) => {
    const updated = chequeRows.filter((_, i) => i !== idx);
    setChequeRows(updated);
    updateTotalAmount(updated);
  };

  const handleRowChange = (idx: number, field: keyof ChequeRow, val: string) => {
    const updated = [...chequeRows];
    updated[idx][field] = val;
    setChequeRows(updated);
    if (field === "amount") {
      updateTotalAmount(updated);
    }
  };

  // Word Document (.docx) Export
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await exportChequesDeliveryDocx({
        refNo,
        date,
        recipientName,
        recipientAddress,
        recipientContact,
        company,
        deceased,
        folio,
        totalAmount,
        chequeRows,
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
          const cleanDeceased = d.deceased.replace(/^Late\s+/i, "");
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
Transmission of Shares & Dividends – Late ${deceased} – Folio # ${folio}

We are pleased to forward herewith following Banker's Cheques for unpaid dividend(s) pertaining to the captioned deceased shareholder, issued in favor of legal heirs as per their entitlement:

S.No\tBeneficiary Name\tInstrument #\tAmount (PKR)
${chequeRows.map((r, i) => `${i + 1}\t${r.beneficiary}\t${r.instrumentNo}\t${r.amount}/-`).join("\n")}
Total Dividend Amount\t\t\t${totalAmount}/-

Please note that with the dispatch of above banker's cheques, all unpaid dividends lying against the subject folio have been fully settled and paid, and no further dividend remains outstanding.

Kindly acknowledge receipt by returning the duplicate counterfoil copy of this letter duly signed.

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
      <LetterNavTabs currentType="cheques-delivery" />

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
                      <span>Upload Cheques Letter / Ref</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-[#F37021] border-orange-200 py-0">
                        AI Vision
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document with AI..." : "Drop letter image or PDF to auto-fill details"}
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
                <span>Delivery of Cheques Details</span>
                <span className="text-[11px] font-normal text-slate-500">Unpaid Dividend Cheques</span>
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
                    className="w-full rounded-md border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <Input 
                    placeholder="Contact # (e.g. 0333-429-2705)" 
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    className="h-8 text-xs font-mono mt-1.5"
                  />
                </div>
              </div>

              {/* Total Dividend Amount */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Total Dividend Amount (PKR)
                </label>
                <Input 
                  value={totalAmount} 
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="h-8 text-xs font-mono font-bold text-emerald-800 bg-emerald-50"
                />
              </div>

              {/* Banker's Cheques Allocation Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">Banker's Cheques Table</span>
                    <span className="text-[10px] text-slate-500">Beneficiary & instrument details</span>
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
                  {chequeRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <Input 
                        placeholder="Beneficiary Legal Heir" 
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
                        className="h-7 text-[11px] w-24 text-right font-mono"
                      />
                      {chequeRows.length > 1 && (
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

            {/* Subject */}
            <div className="mb-6 leading-tight">
              <div className="font-bold text-slate-900 uppercase">
                {company}
              </div>
              <div className="font-bold text-slate-900">
                Transmission of Shares & Dividends – Late {deceased} – Folio # {folio}
              </div>
            </div>

            {/* Opening Paragraph */}
            <div className="mb-6 text-justify">
              We refer to transmission of shares of the captioned deceased shareholder.
              <br /><br />
              Please find enclosed herewith following dividend cheque(s) / instrument(s) in respect of deceased shareholder:
            </div>

            {/* Cheques Table */}
            <div className="mb-6 overflow-hidden border border-slate-300 rounded-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <th className="py-2 px-3 border-r border-slate-300 w-12 text-center">S.No</th>
                    <th className="py-2 px-3 border-r border-slate-300">Beneficiary</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-32 font-mono">Instrument #</th>
                    <th className="py-2 px-3 text-right w-36">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {chequeRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-medium border-r border-slate-300">{r.beneficiary}</td>
                      <td className="py-2 px-3 font-mono border-r border-slate-300">{r.instrumentNo}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{r.amount}/-</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-wider text-[11px] border-r border-slate-300">
                      Total
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-sm text-emerald-900">{totalAmount}/-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Closing Instructions */}
            <div className="space-y-4 mb-8 text-justify">
              <div>Please acknowledge receipt of the cheque(s) / instrument(s).</div>
            </div>

            {/* Signatures */}
            <div className="mb-4">
              Yours faithfully,
              <div className="font-bold mt-1">For CDC Share Registrar Services Limited</div>
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
