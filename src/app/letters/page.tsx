"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSignature, 
  Download, 
  Copy, 
  CheckCircle2, 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck,
  Check,
  ArrowUp,
  ArrowDown,
  GripVertical,
  X,
  MessageSquarePlus,
  Scale
} from "lucide-react";

interface MultiFolioItem {
  folio: string;
  company: string;
  shares: string;
  certificates: string;
  scripts: string;
}

export default function LetterGenerationPage() {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncToMis, setSyncToMis] = useState(true);
  const [searchingFolio, setSearchingFolio] = useState(false);

  // Single Folio Details
  const [folio, setFolio] = useState("44058");
  const [company, setCompany] = useState("Oil & Gas Development Company Limited");
  const [compSymbol, setCompSymbol] = useState("OGDC");
  const [deceased, setDeceased] = useState("Saiyed Ali");
  const [shares, setShares] = useState("=1,000=");
  const [certificates, setCertificates] = useState("=01=");
  const [scripts, setScripts] = useState("Cert # 10451 (Distinctive: 50001 - 51000)");

  // Legal Heir Details
  const [legalHeir, setLegalHeir] = useState("Mr. Muhammad Ahmed");
  const [relation, setRelation] = useState("Legal Heir / Son");
  const [address, setAddress] = useState("House # 14-B, Block 6, P.E.C.H.S, Karachi");
  const [contactNo, setContactNo] = useState("0300-1234567");
  const [cnic, setCnic] = useState("42201-1234567-1");

  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/OGDC/44058/26");
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));

  // Multi Folio Rows
  const [multiFolios, setMultiFolios] = useState<MultiFolioItem[]>([
    { folio: "44058", company: "OGDC", shares: "1,000", certificates: "1", scripts: "Cert # 10451" },
    { folio: "19316", company: "HBL", shares: "500", certificates: "2", scripts: "Cert # 9811-9812" },
  ]);

  // Documents Received (Step 1)
  const [receivedDocs, setReceivedDocs] = useState<string[]>([
    "Written transmission request application",
    "Attested copy of CNIC of deceased shareholder",
    "Attested copy of CNIC of legal heir / applicant"
  ]);

  const receivedDocOptions = [
    "Written transmission request application",
    "Attested copy of CNIC of deceased shareholder",
    "Attested copy of CNIC of legal heir / applicant",
    "Certified copy of computerized Death Certificate",
    "Original physical share certificate(s)",
    "Family Registration Certificate (FRC) issued by NADRA",
    "Succession Certificate / Letter of Administration",
    "Attested Affidavit / Indemnity Bond",
    "Newspaper publication notice"
  ];

  // Documents Required (Step 2) - Includes Succession Certificate!
  const [requiredDocs, setRequiredDocs] = useState<string[]>([
    "Succession Certificate (NADRA Digital or Civil Court Attested Copy along with Court Order)",
    "Certified copy of Computerized Death Certificate (issued by NADRA)",
    "Attested valid CNIC / NICOP copies of all legal heirs",
    "Family Registration Certificate (FRC) issued by NADRA",
    "Original Physical Share Certificate(s) for cancellation and re-issuance",
    "Attested Indemnity Bond on non-judicial stamp paper of prescribed value",
    "No Objection Certificate (NOC) / Affidavit from all legal heirs",
    "Bank Account verification (24-digit IBAN certificate) for electronic dividend transfer",
    "Specimen Signature Card duly verified by legal heir's bank manager",
    "Standard Transmission Application Form duly filled and signed by legal heir(s)"
  ]);

  const requiredDocOptions = [
    "Succession Certificate (NADRA Digital or Civil Court Attested Copy along with Court Order)",
    "Certified copy of Computerized Death Certificate (issued by NADRA)",
    "Attested valid CNIC / NICOP copies of all legal heirs",
    "Family Registration Certificate (FRC) issued by NADRA",
    "Original Physical Share Certificate(s) for cancellation and re-issuance",
    "Attested Indemnity Bond on non-judicial stamp paper of prescribed value",
    "No Objection Certificate (NOC) / Affidavit from all legal heirs",
    "Bank Account verification (24-digit IBAN certificate) for electronic dividend transfer",
    "Specimen Signature Card duly verified by legal heir's bank manager",
    "Standard Transmission Application Form duly filled and signed by legal heir(s)",
    "Letter of Administration / Probate of Will (if applicable)"
  ];

  // Custom additions
  const [customRequiredInput, setCustomRequiredInput] = useState("");
  const [customReceivedInput, setCustomReceivedInput] = useState("");

  // Reordering functions for Required Formalities
  const moveRequiredDoc = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= requiredDocs.length) return;
    const copy = [...requiredDocs];
    const item = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = item;
    setRequiredDocs(copy);
  };

  const handleRequiredDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleRequiredDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;
    const copy = [...requiredDocs];
    const [moved] = copy.splice(dragIndex, 1);
    copy.splice(dropIndex, 0, moved);
    setRequiredDocs(copy);
  };

  const addCustomRequiredDoc = () => {
    if (!customRequiredInput.trim()) return;
    setRequiredDocs(prev => [...prev, customRequiredInput.trim()]);
    setCustomRequiredInput("");
  };

  const removeRequiredDoc = (index: number) => {
    setRequiredDocs(prev => prev.filter((_, i) => i !== index));
  };

  // Reordering functions for Received Documents
  const moveReceivedDoc = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= receivedDocs.length) return;
    const copy = [...receivedDocs];
    const item = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = item;
    setReceivedDocs(copy);
  };

  const handleReceivedDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleReceivedDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;
    const copy = [...receivedDocs];
    const [moved] = copy.splice(dragIndex, 1);
    copy.splice(dropIndex, 0, moved);
    setReceivedDocs(copy);
  };

  const addCustomReceivedDoc = () => {
    if (!customReceivedInput.trim()) return;
    setReceivedDocs(prev => [...prev, customReceivedInput.trim()]);
    setCustomReceivedInput("");
  };

  const removeReceivedDoc = (index: number) => {
    setReceivedDocs(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-search Folio from API to prefill
  const handleLookupFolio = async () => {
    if (!folio.trim()) return;
    setSearchingFolio(true);
    try {
      const res = await fetch(`/api/mis?q=${encodeURIComponent(folio.trim())}&limit=1`);
      const data = await res.json();
      if (data && data.records && data.records.length > 0) {
        const r = data.records[0];
        if (r.company) setCompany(r.company);
        if (r.deceased) setDeceased(r.deceased);
        if (r.legalHeir) setLegalHeir(r.legalHeir);
        const sym = r.company.split(' ')[0].toUpperCase();
        setCompSymbol(sym);
        setRefNo(`CDCSR/LTC/${sym}/${folio}/26`);
      }
    } catch (e) {
      console.error("Folio lookup error:", e);
    } finally {
      setSearchingFolio(false);
    }
  };

  const toggleReceivedDoc = (doc: string) => {
    setReceivedDocs(prev => 
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const toggleRequiredDoc = (doc: string) => {
    setRequiredDocs(prev => 
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const addMultiFolioRow = () => {
    setMultiFolios(prev => [...prev, { folio: "", company: "", shares: "", certificates: "", scripts: "" }]);
  };

  const removeMultiFolioRow = (index: number) => {
    setMultiFolios(prev => prev.filter((_, i) => i !== index));
  };

  const updateMultiFolioRow = (index: number, field: keyof MultiFolioItem, val: string) => {
    setMultiFolios(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleGenerateWord = async () => {
    setDownloading(true);
    try {
      const payload = {
        refNo,
        date,
        legalHeir: `${legalHeir} (${relation})`,
        shareholder: deceased,
        address,
        contactNo: contactNo ? `Contact: ${contactNo} | CNIC: ${cnic}` : `CNIC: ${cnic}`,
        company: mode === "single" ? company : multiFolios.map(m => m.company).join(", "),
        folios: mode === "single" ? [folio] : multiFolios.map(m => m.folio).filter(Boolean),
        shareCertificates: certificates,
        noOfShares: shares,
        scripts,
        multiFolioTable: mode === "multi" ? multiFolios : [],
        receivedDocs,
        requiredDocs,
        isNADRA: true,
        isCourt: true
      };

      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileFolio = mode === "single" ? folio : "Multi_Folios";
      a.download = `CDCSR_Transmission_Letter_${compSymbol || 'COMP'}_${fileFolio}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (syncToMis && mode === "single" && folio) {
        try {
          await fetch("/api/mis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folio,
              formSentDate: new Date().toISOString().split('T')[0],
              remarks: `Letter sent to ${legalHeir} on ${date}`
            })
          });
        } catch (e) {
          console.error("MIS sync skipped:", e);
        }
      }
    } catch (err) {
      console.error("Failed to generate docx:", err);
      alert("Failed to generate Word document. Please verify inputs.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyText = () => {
    const text = `CDC SHARE REGISTRAR SERVICES LIMITED
${refNo}              ${date}

To:
${legalHeir} (${relation})
F/H: ${deceased} (Late)
${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,
${company}
Transmission of Shares and Dividends - Late ${deceased}
Folio # ${mode === 'single' ? folio : multiFolios.map(m => m.folio).join(', ')}

We refer to your letter regarding captioned subject and acknowledge receipt of:
${receivedDocs.map(d => '- ' + d).join('\n')}

Kindly note that as per company's record total, ${certificates} share certificate for ${shares} shares is registered in name of deceased shareholder.

In order to enable us to process transmission, following documents are required:
${requiredDocs.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Regards,
CDC Share Registrar Services Limited`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-6 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37021] via-orange-400 to-[#F37021]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#F37021] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                Official Correspondence Tool
              </span>
              <span className="text-xs text-orange-200">CDC Share Registrar Services Limited</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Transmission Letter Generator
            </h1>
            <p className="text-blue-100/80 text-xs mt-0.5">
              Flexible drafting tool with reorderable legal formalities, customizable Succession Certificate, and custom lines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateWord}
              disabled={downloading}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-md"
            >
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? "Generating Word..." : "Download Word (.docx)"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Letter Mode:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                mode === "single" ? "bg-[#0B2B5E] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Single Folio Letter (سنگل فولیو)
            </button>
            <button
              type="button"
              onClick={() => setMode("multi")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                mode === "multi" ? "bg-[#0B2B5E] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Multiple Folios Letter (ملٹیپل فولیوز)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox"
            id="syncMis" 
            checked={syncToMis} 
            onChange={(e) => setSyncToMis(e.target.checked)} 
            className="h-4 w-4 rounded border-slate-300 text-[#F37021] focus:ring-[#F37021]"
          />
          <label htmlFor="syncMis" className="text-xs text-slate-700 font-medium cursor-pointer">
            Auto-sync dispatch date in MIS correspondence
          </label>
        </div>
      </div>

      {/* 2-Column Working Layout: Left Form Inputs | Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Configuration Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Shareholder & Folio Information */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#F37021]" />
                    Folio & Company Particulars
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enter folio number and holding details
                  </CardDescription>
                </div>
                {mode === "single" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLookupFolio}
                    disabled={searchingFolio}
                    className="text-xs h-8 border-[#F37021] text-[#F37021] hover:bg-orange-50 font-semibold"
                  >
                    <Search className="mr-1 h-3 w-3" />
                    {searchingFolio ? "Searching..." : "Auto-Fetch Folio"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {mode === "single" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Folio Number</label>
                      <Input 
                        value={folio} 
                        onChange={(e) => {
                          setFolio(e.target.value);
                          setRefNo(`CDCSR/LTC/${compSymbol || 'COMP'}/${e.target.value}/26`);
                        }}
                        placeholder="e.g. 44058" 
                        className="text-xs h-8 font-bold text-[#0B2B5E]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
                      <Input 
                        value={company} 
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Oil & Gas Development Company Limited" 
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Deceased Shareholder Name</label>
                      <Input 
                        value={deceased} 
                        onChange={(e) => setDeceased(e.target.value)}
                        placeholder="e.g. Saiyed Ali" 
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Registered Shares</label>
                      <Input 
                        value={shares} 
                        onChange={(e) => setShares(e.target.value)}
                        placeholder="e.g. =1,000=" 
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Number of Certificates</label>
                      <Input 
                        value={certificates} 
                        onChange={(e) => setCertificates(e.target.value)}
                        placeholder="e.g. =01=" 
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Certificate Nos / Distinctive Scripts</label>
                    <Input 
                      value={scripts} 
                      onChange={(e) => setScripts(e.target.value)}
                      placeholder="e.g. Cert # 10451 (Distinctive: 50001 - 51000)" 
                      className="text-xs h-8 text-slate-600"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">Multiple Folios Breakdown</p>
                    <Button 
                      type="button" 
                      onClick={addMultiFolioRow} 
                      size="sm" 
                      className="h-7 text-xs bg-[#0B2B5E] hover:bg-[#103a7a] text-white"
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Folio
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {multiFolios.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Input 
                          placeholder="Folio #" 
                          value={row.folio} 
                          onChange={(e) => updateMultiFolioRow(idx, "folio", e.target.value)}
                          className="h-7 text-xs w-24 font-bold"
                        />
                        <Input 
                          placeholder="Company" 
                          value={row.company} 
                          onChange={(e) => updateMultiFolioRow(idx, "company", e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Input 
                          placeholder="Shares" 
                          value={row.shares} 
                          onChange={(e) => updateMultiFolioRow(idx, "shares", e.target.value)}
                          className="h-7 text-xs w-20"
                        />
                        <Input 
                          placeholder="Certs" 
                          value={row.certificates} 
                          onChange={(e) => updateMultiFolioRow(idx, "certificates", e.target.value)}
                          className="h-7 text-xs w-16"
                        />
                        <Input 
                          placeholder="Scripts / Dist #" 
                          value={row.scripts} 
                          onChange={(e) => updateMultiFolioRow(idx, "scripts", e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        {multiFolios.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeMultiFolioRow(idx)}
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Legal Heir & Recipient Information */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#F37021]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="h-4 w-4 text-[#F37021]" />
                Legal Heir / Addressee Particulars (مکتوب الیہ کی تفصیل)
              </CardTitle>
              <CardDescription className="text-xs">
                Enter recipient legal heir name, address, contact and relation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Legal Heir / Recipient Name</label>
                  <Input 
                    value={legalHeir} 
                    onChange={(e) => setLegalHeir(e.target.value)}
                    placeholder="e.g. Mr. Muhammad Ahmed" 
                    className="text-xs h-8 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Capacity / Relationship</label>
                  <Input 
                    value={relation} 
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="e.g. Legal Heir / Son / Widow" 
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Complete Mailing Address</label>
                <Input 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House # 14-B, Block 6, P.E.C.H.S, Karachi" 
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile / Contact Number</label>
                  <Input 
                    value={contactNo} 
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="e.g. 0300-1234567" 
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CNIC / NICOP Number</label>
                  <Input 
                    value={cnic} 
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="e.g. 42201-1234567-1" 
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Step 1 - Documents Received (With Reordering & Custom Item) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Step 1: Documents Received from Applicant (موصول شدہ دستاویزات)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select &amp; reorder documents already received to acknowledge in the letter
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                  {receivedDocs.length} Selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {/* Quick Select Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {receivedDocOptions.map((doc, i) => {
                  const isChecked = receivedDocs.includes(doc);
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleReceivedDoc(doc)}
                      className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/70 border-emerald-300 font-medium text-emerald-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {}} 
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                      />
                      <span className="leading-snug">{doc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Received Item */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <Input 
                  placeholder="Add custom received document (اگر کوئی دیگر دستاویز موصول ہوئی ہو)..." 
                  value={customReceivedInput}
                  onChange={(e) => setCustomReceivedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomReceivedDoc()}
                  className="text-xs h-8"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addCustomReceivedDoc}
                  className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              {/* Active Ordered Received List (Drag to reorder or use arrows) */}
              {receivedDocs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Order of Received Documents (ترتیب بدلنے کے لیے اوپر نیچے کریں):</span>
                    <span className="text-slate-400 font-normal text-[10px]">Drag or use ↑ ↓ buttons</span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {receivedDocs.map((item, idx) => (
                      <div 
                        key={idx}
                        draggable
                        onDragStart={(e) => handleReceivedDragStart(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleReceivedDrop(e, idx)}
                        className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-grab active:cursor-grabbing text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-emerald-800 font-mono text-[11px] w-5">#{idx + 1}</span>
                          <span className="truncate text-slate-800">{item}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            disabled={idx === 0}
                            onClick={() => moveReceivedDoc(idx, "up")}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            disabled={idx === receivedDocs.length - 1}
                            onClick={() => moveReceivedDoc(idx, "down")}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeReceivedDoc(idx)}
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Step 2 - Required Formalities (With Succession Certificate, Reordering & Custom Line) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#F37021]" />
                    Step 2: Required Formalities (مزید مطلوبہ دستاویزات و کارروائی)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select, reorder, or add custom instructions &amp; succession certificate requirements
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-[#0B2B5E] border-blue-200 text-[10px]">
                  {requiredDocs.length} Requirements
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {/* Checkbox Options including Succession Certificate */}
              <div className="space-y-1.5 text-xs">
                {requiredDocOptions.map((doc, i) => {
                  const isChecked = requiredDocs.includes(doc);
                  const isSuccession = doc.includes("Succession Certificate");
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleRequiredDoc(doc)}
                      className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        isChecked 
                          ? isSuccession 
                            ? 'bg-amber-50/80 border-amber-300 font-bold text-amber-950 shadow-2xs' 
                            : 'bg-blue-50/70 border-blue-300 font-medium text-[#0B2B5E]' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {}} 
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2B5E] focus:ring-[#0B2B5E]" 
                      />
                      <div className="leading-snug flex-1">
                        {isSuccession ? (
                          <div className="flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5 text-[#F37021]" />
                            <span className="text-[#0B2B5E] font-bold">{doc}</span>
                            <Badge className="bg-amber-200 text-amber-900 text-[9px] px-1 py-0 ml-1">Key Legal Req</Badge>
                          </div>
                        ) : (
                          <span>{doc}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Clause / Line / Comment */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MessageSquarePlus className="h-3.5 w-3.5 text-[#F37021]" />
                  Add Custom Line, Instruction or Remark (اپنی مرضی کی لائن / کمنٹ شامل کریں):
                </label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Note: Dividend warrants from 2021 to 2025 are withheld pending transmission..." 
                    value={customRequiredInput}
                    onChange={(e) => setCustomRequiredInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomRequiredDoc()}
                    className="text-xs h-8"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addCustomRequiredDoc}
                    className="h-8 text-xs bg-[#0B2B5E] hover:bg-[#103a7a] text-white shrink-0 font-bold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
                  </Button>
                </div>
              </div>

              {/* Active Ordered Formalities List with Drag & Drop and Move Up/Down */}
              {requiredDocs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Active Letter Sequence (آرڈر تبدیل کرنے کے لیے ڈریگ کریں یا ↑ ↓ دبائیں):</span>
                    <span className="text-slate-400 font-normal text-[10px]">Drag handle or click ↑ ↓</span>
                  </div>
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {requiredDocs.map((item, idx) => {
                      const isSuccession = item.includes("Succession Certificate");
                      return (
                        <div 
                          key={idx}
                          draggable
                          onDragStart={(e) => handleRequiredDragStart(e, idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleRequiredDrop(e, idx)}
                          className={`flex items-center justify-between gap-2 p-2 bg-white rounded-md border shadow-2xs cursor-grab active:cursor-grabbing text-xs transition-all ${
                            isSuccession ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <GripVertical className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-bold text-[#0B2B5E] font-mono text-xs w-6">{idx + 1}.</span>
                            <span className={`truncate ${isSuccession ? 'font-bold text-amber-950' : 'text-slate-800'}`}>
                              {item}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              disabled={idx === 0}
                              onClick={() => moveRequiredDoc(idx, "up")}
                              className="h-6 w-6 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Move Up (اوپر لے جائیں)"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              disabled={idx === requiredDocs.length - 1}
                              onClick={() => moveRequiredDoc(idx, "down")}
                              className="h-6 w-6 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Move Down (نیچے لے آئیں)"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeRequiredDoc(idx)}
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Realistic Live Letter Preview */}
        <div className="lg:col-span-5 sticky top-4">
          <Card className="border-slate-300 shadow-md bg-white">
            <CardHeader className="pb-3 border-b bg-slate-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Live Letter Preview
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Official CDCSR layout reflecting exact user order &amp; clauses
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyText} 
                    className="h-7 text-[11px] text-slate-700"
                  >
                    {copied ? <Check className="mr-1 h-3 w-3 text-emerald-600" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleGenerateWord}
                    disabled={downloading}
                    className="h-7 text-[11px] bg-[#F37021] hover:bg-[#D85B10] text-white font-bold shadow-sm"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Word
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 font-serif text-[12px] leading-relaxed text-slate-800 space-y-4 max-h-[750px] overflow-y-auto select-text bg-[#fcfcfc]">
              {/* Header Info */}
              <div className="flex justify-between items-start font-sans font-bold text-xs pb-1 border-b">
                <span className="text-[#0B2B5E]">{refNo}</span>
                <span className="text-slate-600">{date}</span>
              </div>

              {/* Addressee Info */}
              <div className="font-sans space-y-0.5 text-xs">
                <p className="font-bold text-slate-900">{legalHeir} ({relation})</p>
                <p className="text-slate-600 font-medium">F/H: {deceased} (Late)</p>
                <p className="text-slate-700">{address}</p>
                {contactNo && <p className="text-slate-500 text-[11px]">Contact: {contactNo}</p>}
                {cnic && <p className="text-slate-500 text-[11px]">CNIC: {cnic}</p>}
              </div>

              <div className="font-sans text-xs pt-1">
                <p className="font-semibold text-slate-700">Dear Concern,</p>
              </div>

              {/* Subject */}
              <div className="font-sans text-xs space-y-0.5 border-l-2 border-l-[#F37021] pl-2.5 py-0.5 bg-orange-50/50">
                <p className="font-bold text-[#0B2B5E]">{company}</p>
                <p className="font-bold text-slate-900 underline">
                  Transmission of Shares and Dividends - Late {deceased}
                </p>
                <p className="text-xs font-bold text-[#0B2B5E]">
                  Folio # {mode === "single" ? folio : multiFolios.map(m => m.folio).filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Body */}
              <p>
                We refer to your letter regarding the captioned subject and acknowledge receipt of:{" "}
                <strong>{receivedDocs.length > 0 ? receivedDocs.join(", ") : "documents submitted"}</strong>.
              </p>

              <p>
                Kindly note that as per company's record total, <strong>{certificates}</strong> share certificate for{" "}
                <strong>{shares}</strong> shares {scripts ? `(${scripts}) ` : ''}under folio of <strong>{company}</strong> is registered in the name of subject deceased shareholder (details of shares attached). In case if share certificate is lost, please intimate us accordingly.
              </p>

              {/* Multi Folio Table in preview if active */}
              {mode === "multi" && multiFolios.length > 0 && (
                <div className="border rounded overflow-hidden font-sans text-[11px] my-2">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                      <tr>
                        <th className="p-1.5">Folio</th>
                        <th className="p-1.5">Company</th>
                        <th className="p-1.5">Shares</th>
                        <th className="p-1.5">Certs</th>
                        <th className="p-1.5">Scripts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiFolios.map((m, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-1.5 font-bold text-[#0B2B5E]">{m.folio}</td>
                          <td className="p-1.5">{m.company}</td>
                          <td className="p-1.5">{m.shares}</td>
                          <td className="p-1.5">{m.certificates}</td>
                          <td className="p-1.5">{m.scripts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="font-semibold text-slate-900">
                In order to enable us to process the transmission of the shares and dividends of deceased shareholder in favor of legal heir(s), following documents are required:
              </p>

              {/* Numbered Required Docs in exact custom order */}
              <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                {requiredDocs.map((item, idx) => {
                  const isSuccession = item.includes("Succession Certificate");
                  if (isSuccession) {
                    return (
                      <li key={idx} className="leading-snug font-semibold text-slate-900">
                        <span>Succession Certificate:</span>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] space-y-1 font-normal text-slate-700 mt-1">
                          <p>
                            &bull; Notarized copy of Succession Certificate along with Family Registration Certificate (if issued by NADRA);
                          </p>
                          <p className="text-center font-bold text-slate-500 text-[10px]">OR</p>
                          <p>
                            &bull; Court attested copy of Succession Certificate along with its Application &amp; Court Order (if issued by Honorable Court).
                          </p>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={idx} className="leading-snug">
                      {item}
                    </li>
                  );
                })}
              </ol>

              <p className="text-[11px] text-slate-600 pt-1">
                Please ensure that details such as company name, folio number and number of shares are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.
              </p>

              {/* Signatures */}
              <div className="pt-4 font-sans space-y-1 border-t">
                <p className="text-slate-600">Regards,</p>
                <div className="flex justify-between items-end pt-4 pb-2 text-xs font-bold text-slate-700">
                  <span>Authorized Signatory</span>
                  <span>Authorized Signatory</span>
                </div>
                <p className="font-bold text-[#0B2B5E] text-xs">
                  CDC Share Registrar Services Limited
                </p>
                <p className="text-[10px] text-slate-400 italic">Encl.: As stated above.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
