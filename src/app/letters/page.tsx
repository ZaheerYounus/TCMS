"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Scale,
  UploadCloud,
  FileUp,
  ClipboardPaste,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface MultiFolioItem {
  folio: string;
  company: string;
  shares: string;
  certificates: string;
  scripts: string;
}

function LetterGenerationContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncToMis, setSyncToMis] = useState(true);
  const [searchingFolio, setSearchingFolio] = useState(false);

  // File Upload & Smart Parsing State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Single Folio Details
  const [folio, setFolio] = useState("44058");
  const [company, setCompany] = useState("Oil & Gas Development Company Limited");
  const [compSymbol, setCompSymbol] = useState("OGDC");
  const [deceased, setDeceased] = useState("Saiyed Ali");
  const [shares, setShares] = useState("=1,000=");
  const [certificates, setCertificates] = useState("=01=");
  const [scripts, setScripts] = useState("Cert # 10451 (Distinctive: 50001 - 51000)");

  // Prefill from URL query params if provided (e.g. from Daily Register)
  useEffect(() => {
    if (!searchParams) return;
    const qFolio = searchParams.get("folio");
    const qCompany = searchParams.get("company");
    const qHeir = searchParams.get("legalHeir");
    if (qFolio) {
      setFolio(qFolio);
      if (qCompany) {
        setCompany(qCompany);
        const sym = qCompany.split(' ')[0].toUpperCase();
        setCompSymbol(sym);
        setRefNo(`CDCSR/LTC/${sym}/${qFolio}/26`);
      } else {
        setRefNo(`CDCSR/LTC/COMP/${qFolio}/26`);
      }
    }
    if (qHeir) {
      setLegalHeir(qHeir);
    }
  }, [searchParams]);

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

  // Documents Required (Step 2)
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

  // Custom additions for formalities & received
  const [customRequiredInput, setCustomRequiredInput] = useState("");
  const [customReceivedInput, setCustomReceivedInput] = useState("");

  // Independent Scrutiny Observation / Review Note
  const [includeScrutinyNote, setIncludeScrutinyNote] = useState(true);
  const [scrutinyRemarkTitle, setScrutinyRemarkTitle] = useState("Official Scrutiny Note / Special Observation");
  const [scrutinyRemark, setScrutinyRemark] = useState(
    "Note: Upon preliminary scrutiny of submitted documents, a variation in the deceased shareholder's name has been observed between CNIC and Share Register. This matter is being taken up with the issuer company for necessary verification and clearance."
  );
  const [scrutinyPosition, setScrutinyPosition] = useState<"after_received" | "before_required" | "after_required" | "at_end">("after_required");

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

  // Smart File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingFile(true);
    setUploadSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-letter", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse letter file");

      const p = data.parsed;
      if (p.folio) setFolio(p.folio);
      if (p.company) setCompany(p.company);
      if (p.compSymbol) setCompSymbol(p.compSymbol);
      if (p.deceased) setDeceased(p.deceased);
      if (p.legalHeir) setLegalHeir(p.legalHeir);
      if (p.relation) setRelation(p.relation);
      if (p.address) setAddress(p.address);
      if (p.contactNo) setContactNo(p.contactNo);
      if (p.cnic) setCnic(p.cnic);
      if (p.shares) setShares(p.shares);
      if (p.certificates) setCertificates(p.certificates);
      if (p.scripts) setScripts(p.scripts);
      if (p.refNo) setRefNo(p.refNo);
      if (p.receivedDocs && p.receivedDocs.length > 0) {
        setReceivedDocs(p.receivedDocs);
      }

      setUploadSuccessMsg(
        `Letter analyzed successfully! Detected Folio: ${p.folio || 'N/A'}, Company: ${p.compSymbol || 'N/A'}, Legal Heir: ${p.legalHeir || 'N/A'}, Enclosed Docs: ${p.receivedDocs?.length || 0}.`
      );
    } catch (err: any) {
      console.error("Upload parse error:", err);
      alert(err.message || "Failed to analyze letter file. Please check file format.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Smart Pasted Text Handler
  const handleParsePastedText = async () => {
    if (!pastedText.trim()) return;
    setUploadingFile(true);
    setUploadSuccessMsg("");
    try {
      const res = await fetch("/api/parse-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse text");

      const p = data.parsed;
      if (p.folio) setFolio(p.folio);
      if (p.company) setCompany(p.company);
      if (p.compSymbol) setCompSymbol(p.compSymbol);
      if (p.deceased) setDeceased(p.deceased);
      if (p.legalHeir) setLegalHeir(p.legalHeir);
      if (p.relation) setRelation(p.relation);
      if (p.address) setAddress(p.address);
      if (p.contactNo) setContactNo(p.contactNo);
      if (p.cnic) setCnic(p.cnic);
      if (p.shares) setShares(p.shares);
      if (p.certificates) setCertificates(p.certificates);
      if (p.scripts) setScripts(p.scripts);
      if (p.refNo) setRefNo(p.refNo);
      if (p.receivedDocs && p.receivedDocs.length > 0) {
        setReceivedDocs(p.receivedDocs);
      }

      setUploadSuccessMsg(
        `Letter text analyzed successfully! Extracted Folio: ${p.folio || 'N/A'}, Company: ${p.compSymbol || 'N/A'}, Legal Heir: ${p.legalHeir || 'N/A'}.`
      );
      setPasteModalOpen(false);
      setPastedText("");
    } catch (err: any) {
      console.error("Parse pasted text error:", err);
      alert(err.message || "Failed to parse pasted text.");
    } finally {
      setUploadingFile(false);
    }
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
        scrutinyRemark: includeScrutinyNote ? scrutinyRemark : "",
        scrutinyRemarkTitle,
        scrutinyPosition,
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
    let remarkText = "";
    if (includeScrutinyNote && scrutinyRemark.trim()) {
      remarkText = `\n\n${scrutinyRemarkTitle || 'Special Note'}:\n${scrutinyRemark}\n`;
    }

    let bodyText = `CDC SHARE REGISTRAR SERVICES LIMITED
${refNo}              ${date}

To:
${legalHeir} (${relation})
F/H: ${deceased} (Late)
${address}
${contactNo ? 'Contact: ' + contactNo : ''}
${cnic ? 'CNIC: ' + cnic : ''}

Dear Concern,
${company}
Transmission of Shares and Dividends - Late ${deceased}
Folio # ${mode === 'single' ? folio : multiFolios.map(m => m.folio).join(', ')}

We refer to your letter regarding captioned subject and acknowledge receipt of:
${receivedDocs.map(d => '- ' + d).join('\n')}
${scrutinyPosition === 'after_received' ? remarkText : ''}
Kindly note that as per company's record total, ${certificates} share certificate for ${shares} shares is registered in name of deceased shareholder.
${scrutinyPosition === 'before_required' ? remarkText : ''}
In order to enable us to process transmission, following documents are required:
${requiredDocs.map((d, i) => `${i + 1}. ${d}`).join('\n')}
${scrutinyPosition === 'after_required' ? remarkText : ''}
Please ensure details are clearly mentioned on Succession Certificate.
${scrutinyPosition === 'at_end' ? remarkText : ''}
Regards,
CDC Share Registrar Services Limited`;

    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-5 sm:p-6 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37021] via-orange-400 to-[#F37021]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#F37021] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                Official Correspondence Tool
              </span>
              <span className="text-xs text-orange-200">CDC Share Registrar Services Limited</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Transmission Letter Generator
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-0.5">
              Draft official transmission response letters with smart upload, flexible scrutiny notes, and MIS auto-sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateWord}
              disabled={downloading}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-md h-9 px-4"
            >
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? "Generating Word..." : "Download Word (.docx)"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mode Switcher & Sync Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
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
              Single Folio Letter
            </button>
            <button
              type="button"
              onClick={() => setMode("multi")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                mode === "multi" ? "bg-[#0B2B5E] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Multiple Folios Letter
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

          {/* CARD 0: SMART LETTER UPLOAD & AUTO-EXTRACTION */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#F37021] bg-gradient-to-br from-orange-50/40 via-white to-blue-50/30">
            <CardHeader className="pb-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#F37021]" />
                    Smart Letter Upload &amp; Auto-Extraction
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Upload incoming request letter (.docx, .doc, .pdf, .txt) or paste text to auto-fill folio, company &amp; received documents
                  </CardDescription>
                </div>
                <Badge className="bg-orange-100 text-[#D85B10] border-orange-200 text-[10px] font-bold">
                  AI &amp; Heuristic OCR
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                accept=".docx,.doc,.pdf,.txt,image/*" 
                className="hidden" 
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="h-10 border-dashed border-2 border-[#F37021]/60 hover:border-[#F37021] hover:bg-orange-50/60 text-[#D85B10] font-bold text-xs"
                >
                  <FileUp className="mr-2 h-4 w-4 text-[#F37021]" />
                  {uploadingFile ? "Analyzing Document..." : "Upload Incoming Letter"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasteModalOpen(true)}
                  disabled={uploadingFile}
                  className="h-10 border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  <ClipboardPaste className="mr-2 h-4 w-4 text-blue-700" />
                  Paste Letter Text
                </Button>
              </div>

              {uploadSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-start gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{uploadSuccessMsg}</p>
                    <span className="text-[10px] text-emerald-700">All fields below have been updated. You can review or make manual edits.</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setUploadSuccessMsg("")}
                    className="text-emerald-700 hover:text-emerald-950"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 1: Shareholder & Folio Information */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#F37021]" />
                    Folio &amp; Company Particulars
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
                        className="text-xs h-9 font-bold text-[#0B2B5E]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
                      <Input 
                        value={company} 
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Oil & Gas Development Company Limited" 
                        className="text-xs h-9"
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
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Registered Shares</label>
                      <Input 
                        value={shares} 
                        onChange={(e) => setShares(e.target.value)}
                        placeholder="e.g. =1,000=" 
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Number of Certificates</label>
                      <Input 
                        value={certificates} 
                        onChange={(e) => setCertificates(e.target.value)}
                        placeholder="e.g. =01=" 
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Certificate Nos / Distinctive Scripts</label>
                    <Input 
                      value={scripts} 
                      onChange={(e) => setScripts(e.target.value)}
                      placeholder="e.g. Cert # 10451 (Distinctive: 50001 - 51000)" 
                      className="text-xs h-9 text-slate-600"
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
                      className="h-8 text-xs bg-[#0B2B5E] hover:bg-[#103a7a] text-white"
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
                          className="h-8 text-xs w-24 font-bold"
                        />
                        <Input 
                          placeholder="Company" 
                          value={row.company} 
                          onChange={(e) => updateMultiFolioRow(idx, "company", e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        <Input 
                          placeholder="Shares" 
                          value={row.shares} 
                          onChange={(e) => updateMultiFolioRow(idx, "shares", e.target.value)}
                          className="h-8 text-xs w-20"
                        />
                        <Input 
                          placeholder="Certs" 
                          value={row.certificates} 
                          onChange={(e) => updateMultiFolioRow(idx, "certificates", e.target.value)}
                          className="h-8 text-xs w-16"
                        />
                        <Input 
                          placeholder="Scripts / Dist #" 
                          value={row.scripts} 
                          onChange={(e) => updateMultiFolioRow(idx, "scripts", e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        {multiFolios.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeMultiFolioRow(idx)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
                Legal Heir / Addressee Particulars
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
                    className="text-xs h-9 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Capacity / Relationship</label>
                  <Input 
                    value={relation} 
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="e.g. Legal Heir / Son / Widow" 
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Complete Mailing Address</label>
                <Input 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House # 14-B, Block 6, P.E.C.H.S, Karachi" 
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile / Contact Number</label>
                  <Input 
                    value={contactNo} 
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="e.g. 0300-1234567" 
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CNIC / NICOP Number</label>
                  <Input 
                    value={cnic} 
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="e.g. 42201-1234567-1" 
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Step 1 - Documents Received from Applicant */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Step 1: Documents Received from Applicant
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
                  placeholder="Add custom received document..." 
                  value={customReceivedInput}
                  onChange={(e) => setCustomReceivedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomReceivedDoc()}
                  className="text-xs h-9"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addCustomReceivedDoc}
                  className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              {/* Active Ordered Received List */}
              {receivedDocs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Order of Received Documents:</span>
                    <span className="text-slate-400 font-normal text-[10px]">Drag or use arrow buttons</span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
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

          {/* Card 4: Step 2 - Required Formalities Checklist */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#F37021]" />
                    Step 2: Required Formalities (Numbered Checklist)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select &amp; reorder required documents to process the transmission
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-[#0B2B5E] border-blue-200 text-[10px]">
                  {requiredDocs.length} Requirements
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
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

              {/* Add Custom Requirement */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5 text-[#F37021]" />
                  Add Additional Required Document (will be numbered in list):
                </label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Original Marriage Certificate attested by Union Council..." 
                    value={customRequiredInput}
                    onChange={(e) => setCustomRequiredInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomRequiredDoc()}
                    className="text-xs h-9"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addCustomRequiredDoc}
                    className="h-9 text-xs bg-[#0B2B5E] hover:bg-[#103a7a] text-white shrink-0 font-bold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                  </Button>
                </div>
              </div>

              {/* Active Ordered Formalities List */}
              {requiredDocs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Active Letter Sequence:</span>
                    <span className="text-slate-400 font-normal text-[10px]">Drag handle or click arrow buttons</span>
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
                              title="Move Up"
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
                              title="Move Down"
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

          {/* CARD 5: INDEPENDENT SCRUTINY OBSERVATIONS & SPECIAL REMARKS */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-indigo-600 bg-gradient-to-br from-indigo-50/20 via-white to-slate-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-indigo-600" />
                    Scrutiny Observations &amp; Special Remarks (Independent Note)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Add official scrutiny notes (e.g. name discrepancy, succession clarification, company referral) without adding to the numbered checklist
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="incScrutiny"
                    checked={includeScrutinyNote}
                    onChange={(e) => setIncludeScrutinyNote(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="incScrutiny" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Note
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1 text-xs">
              {includeScrutinyNote && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Note Title / Header</label>
                      <Input 
                        value={scrutinyRemarkTitle}
                        onChange={(e) => setScrutinyRemarkTitle(e.target.value)}
                        placeholder="e.g. Official Observation / Scrutiny Remark"
                        className="h-9 text-xs font-bold text-[#0B2B5E]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Letter Placement Position</label>
                      <select
                        value={scrutinyPosition}
                        onChange={(e: any) => setScrutinyPosition(e.target.value)}
                        className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E] focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="after_received">1. After Received Documents (Under Acknowledgement)</option>
                        <option value="before_required">2. Before Required Formalities (Above Checklist)</option>
                        <option value="after_required">3. After Required Formalities (Recommended)</option>
                        <option value="at_end">4. At End of Letter (Before Signatures)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Remark / Scrutiny Finding Content</label>
                    <textarea 
                      rows={3}
                      value={scrutinyRemark}
                      onChange={(e) => setScrutinyRemark(e.target.value)}
                      placeholder="Enter specific observation or remarks (e.g. discrepancy in deceased name between CNIC and shares, succession court order matter, etc.)..."
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Quick Standard Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScrutinyRemarkTitle("Name Discrepancy Observation");
                          setScrutinyRemark("Note: Upon preliminary scrutiny of submitted documents, a variation in the deceased shareholder's name has been observed between CNIC and Share Register. This matter is being taken up with the issuer company for necessary verification.");
                        }}
                        className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900"
                      >
                        Name Discrepancy
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScrutinyRemarkTitle("Succession Certificate Clarification");
                          setScrutinyRemark("Note: The submitted Succession Certificate does not clearly specify distinctive numbers for subject share certificates. An amended schedule or certified court order specifying distinctive share numbers is required to execute transmission.");
                        }}
                        className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900"
                      >
                        Succession Order Issue
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScrutinyRemarkTitle("Lost Share Certificates Procedure");
                          setScrutinyRemark("Note: As intimated, the original share certificates are misplaced/lost. Formal duplicate share certificates issuance procedure must be completed prior to execution of transmission.");
                        }}
                        className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900"
                      >
                        Lost Certificates Note
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScrutinyRemarkTitle("Dividend Clearance Notice");
                          setScrutinyRemark("Note: Accumulated unpaid dividend warrants are currently withheld pending transmission and will be released in accordance with the Succession Certificate.");
                        }}
                        className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900"
                      >
                        Withheld Dividends
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Realistic Live Letter Preview */}
        <div className="lg:col-span-5 sticky top-4">
          <Card className="border-slate-300 shadow-md bg-white">
            <CardHeader className="p-4 border-b bg-slate-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Live Letter Preview
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Official CDCSR layout with independent scrutiny block &amp; exact sequence
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyText} 
                    className="h-8 text-xs text-slate-700"
                  >
                    {copied ? <Check className="mr-1 h-3 w-3 text-emerald-600" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleGenerateWord}
                    disabled={downloading}
                    className="h-8 text-xs bg-[#F37021] hover:bg-[#D85B10] text-white font-bold shadow-sm"
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
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

              {/* Position A: After Received Documents */}
              {includeScrutinyNote && scrutinyPosition === 'after_received' && scrutinyRemark.trim() && (
                <div className="p-3 rounded-lg bg-indigo-50/70 border-l-4 border-l-indigo-600 border border-indigo-200 text-xs my-2 font-sans">
                  <p className="font-bold text-indigo-950 mb-0.5">{scrutinyRemarkTitle || "Official Scrutiny Note"}:</p>
                  <p className="text-slate-800 italic">{scrutinyRemark}</p>
                </div>
              )}

              {/* Position B: Before Required Formalities */}
              {includeScrutinyNote && scrutinyPosition === 'before_required' && scrutinyRemark.trim() && (
                <div className="p-3 rounded-lg bg-indigo-50/70 border-l-4 border-l-indigo-600 border border-indigo-200 text-xs my-2 font-sans">
                  <p className="font-bold text-indigo-950 mb-0.5">{scrutinyRemarkTitle || "Official Scrutiny Note"}:</p>
                  <p className="text-slate-800 italic">{scrutinyRemark}</p>
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

              {/* Position C: After Required Formalities (Recommended Default) */}
              {includeScrutinyNote && scrutinyPosition === 'after_required' && scrutinyRemark.trim() && (
                <div className="p-3 rounded-lg bg-indigo-50/70 border-l-4 border-l-indigo-600 border border-indigo-200 text-xs my-2 font-sans">
                  <p className="font-bold text-indigo-950 mb-0.5">{scrutinyRemarkTitle || "Official Scrutiny Note"}:</p>
                  <p className="text-slate-800 italic">{scrutinyRemark}</p>
                </div>
              )}

              <p className="text-[11px] text-slate-600 pt-1">
                Please ensure that details such as company name, folio number and number of shares are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.
              </p>

              {/* Position D: At End of Letter */}
              {includeScrutinyNote && scrutinyPosition === 'at_end' && scrutinyRemark.trim() && (
                <div className="p-3 rounded-lg bg-indigo-50/70 border-l-4 border-l-indigo-600 border border-indigo-200 text-xs my-2 font-sans">
                  <p className="font-bold text-indigo-950 mb-0.5">{scrutinyRemarkTitle || "Official Scrutiny Note"}:</p>
                  <p className="text-slate-800 italic">{scrutinyRemark}</p>
                </div>
              )}

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

      {/* Paste Letter Text Dialog */}
      <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
        <DialogContent className="max-w-lg border-t-4 border-t-[#0B2B5E]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-[#F37021]" />
              Paste Incoming Letter Text
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paste the text of the legal heir request letter or previous correspondence to auto-extract particulars.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste request letter text here (including folio number, company name, legal heir, address, etc.)..."
              className="w-full p-3 text-xs rounded-lg border border-slate-300 font-mono focus:ring-[#F37021] focus:border-[#F37021]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasteModalOpen(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleParsePastedText}
              disabled={!pastedText.trim() || uploadingFile}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white text-xs font-bold h-8 px-4"
            >
              {uploadingFile ? "Analyzing..." : "Analyze & Extract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LetterGenerationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-slate-500">Loading Letter Generator...</div>}>
      <LetterGenerationContent />
    </Suspense>
  );
}
