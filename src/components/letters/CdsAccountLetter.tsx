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
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LetterNavTabs } from "./LetterNavTabs";

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

  // Received Documents Checklist
  const [receivedDocs, setReceivedDocs] = useState<string[]>([
    "Notarized copy of death certificate of deceased shareholder;",
    "Notarized copy of CNICs of the deceased shareholder & yourself;",
    "Shareholder Information Form filled and signed by yourself."
  ]);
  const [newReceivedInput, setNewReceivedInput] = useState("");

  // Required Documents List
  const [requiredDocs, setRequiredDocs] = useState<string[]>([
    `Posted Account Report of subject CDS Accounts # 03277-6959 of the deceased shareholder with "Closed" status duly stamped by relevant participant;`,
    `Account Activity / Intra Account Movement Report under subject CDS Accounts # 03277-6959 of deceased showing transfer of shares of deceased shareholder to legal heir’s CDS Account along with the reason of transfer duly stamped by relevant participant;`,
    `Closing Account Report of CDS account of the deceased shareholder duly stamped by relevant participant.`
  ]);
  const [newRequiredInput, setNewRequiredInput] = useState("");

  // UI States
  const [copied, setCopied] = useState(false);
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

  // AI Document Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("letterType", "cds_account");

      const res = await fetch("/api/parse-letter", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.parsed) {
          const p = data.parsed;
          if (p.deceased) setDeceased(p.deceased.startsWith("Late") ? p.deceased : `Late ${p.deceased}`);
          if (p.legalHeir) setRecipientName(p.legalHeir);
          if (p.address) setRecipientAddress(p.address);
          if (p.contactNo) setRecipientContact(p.contactNo);
          if (p.folio) setCdsAccountNo(p.folio);

          if (p.multiFolios && p.multiFolios.length > 0) {
            setCompanies(p.multiFolios.map((m: any) => m.company));
          } else if (p.company) {
            setCompanies([p.company]);
          }

          setUploadSuccess("CDS details auto-filled into letter.");
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
${fatherHusbandName ? `F/H Name: ${fatherHusbandName}\n` : ""}${recipientAddress}
${recipientContact}

Dear Concern,

${companies.join("\n")}
Transmission of Dividends – ${deceased}– CDS A/C # ${cdsAccountNo}

We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents for each subject companies;

${receivedDocs.map((d, i) => `${i + 1}. ${d}`).join("\n")}

In order to transmit unpaid dividends under the account mentioned above, we would request you to please arrange to furnish us following documents:

${requiredDocs.map((d, i) => `${receivedDocs.length + i + 1}. ${d}`).join("\n")}

Please note that separate set of documents (one for each company) is required for the items mentioned above.

Once we receive the required documents in order, we shall proceed further accordingly.

Should you have any query, feel free to coordinate with us.

Regards,

Authorized Signatory        Authorized Signatory

Encl: as stated above.
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
                      <span>Upload / Scan CDS Document</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-[#F37021] border-orange-200 py-0">
                        AI Vision
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uploading ? "Analyzing document with Gemini AI..." : "Drop CDS letter image or PDF"}
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
                CDS Transmission Parameters
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
                    placeholder="Complete Postal Address..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                  />
                  <Button size="sm" variant="outline" onClick={handleAddCompany} className="h-7 text-[11px] px-2.5">
                    Add
                  </Button>
                </div>
              </div>

              {/* Required Documents List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">Required CDS Documents (Numbered)</span>
                <div className="space-y-1.5">
                  {requiredDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="font-mono text-slate-400 text-[10px] pt-1">{idx + 4}.</span>
                      <textarea
                        rows={2}
                        value={doc}
                        onChange={(e) => {
                          const cp = [...requiredDocs];
                          cp[idx] = e.target.value;
                          setRequiredDocs(cp);
                        }}
                        className="w-full text-[11px] p-1 border rounded bg-white"
                      />
                      <button onClick={() => handleRemoveRequiredDoc(idx)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
              {fatherHusbandName && (
                <div className="text-slate-800">F/H Name: {fatherHusbandName}</div>
              )}
              <div className="whitespace-pre-line text-slate-800">{recipientAddress}</div>
              {recipientContact && (
                <div className="text-slate-800 mt-1 font-medium">{recipientContact}</div>
              )}
            </div>

            {/* Salutation */}
            <div className="mb-4 font-medium">
              Dear Concern,
            </div>

            {/* Subject Companies Header */}
            <div className="mb-5 leading-snug">
              {companies.map((comp, idx) => (
                <div key={idx} className="font-bold text-slate-900">{comp}</div>
              ))}
              <div className="font-bold text-slate-900 underline decoration-slate-900 mt-1">
                Transmission of Dividends – {deceased}– CDS A/C # {cdsAccountNo}
              </div>
            </div>

            {/* Acknowledged Documents */}
            <div className="mb-5 space-y-3 text-justify">
              <p>
                We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents for each subject companies;
              </p>
              <ol className="list-none space-y-1 pl-1">
                {receivedDocs.map((doc, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-semibold">{idx + 1}.</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Required Documents Section */}
            <div className="mb-6 space-y-3 text-justify">
              <p>
                In order to <span className="underline font-semibold">transmit unpaid dividends</span> under the account mentioned above, we would request you to please arrange to furnish us following documents:
              </p>
              <ol className="list-none space-y-2 pl-1">
                {requiredDocs.map((doc, idx) => (
                  <li key={idx} className="flex gap-2 leading-relaxed">
                    <span className="font-semibold">{receivedDocs.length + idx + 1}.</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Note & Closing */}
            <div className="space-y-4 mb-14 text-justify">
              <p className="underline font-medium">
                Please note that separate set of documents (one for each company) is required for the items mentioned above.
              </p>
              <p>Once we receive the required documents in order, we shall proceed further accordingly.</p>
              <p>Should you have any query, feel free to coordinate with us.</p>
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
                Encl: as stated above.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
