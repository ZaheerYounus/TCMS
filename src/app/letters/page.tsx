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
  RotateCcw,
  AlertCircle,
  Files,
  Layers,
  FileCheck2,
  Printer
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  calculateDocumentGap, 
  CANONICAL_TRANSMISSION_DOCS, 
  DocumentGapAnalysis, 
  TransmissionDocRequirement 
} from "@/lib/gapAnalyzer";

interface MultiFolioItem {
  folio: string;
  company: string;
  shares: string;
  certificates: string;
  scripts: string;
}

interface ScrutinyDocItem {
  name: string;
  status: "valid" | "deficient" | "missing";
  objection: string;
}

function LetterGenerationContent() {
  const searchParams = useSearchParams();

  // Stage Switcher: First Letter (Initial Request) vs Second Letter (Dossier Scrutiny & Objections)
  const [letterStage, setLetterStage] = useState<"first" | "second">("first");
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

  // Multi-document upload for Second Letter
  const [dossierFiles, setDossierFiles] = useState<string[]>([]);
  const dossierInputRef = useRef<HTMLInputElement | null>(null);

  // Single Folio Details
  const [folio, setFolio] = useState("44058");
  const [company, setCompany] = useState("Oil & Gas Development Company Limited");
  const [compSymbol, setCompSymbol] = useState("OGDC");
  const [deceased, setDeceased] = useState("Saiyed Ali Imam Jafri");
  const [shares, setShares] = useState("=1,000=");
  const [certificates, setCertificates] = useState("=01=");
  const [scripts, setScripts] = useState("Cert # 10451 (Distinctive: 50001 - 51000)");

  // Legal Heir Details (NO CNIC displayed in letter addressee block as per CDCSR standard)
  const [legalHeir, setLegalHeir] = useState("Syed Sajjad Imam Jafri");
  const [relation, setRelation] = useState("Legal Heir / Son");
  const [address, setAddress] = useState("D-231, Street 24, South Navy Housing scheme, Clifton, Karachi.");
  const [contactNo, setContactNo] = useState("0333-3535404");

  // Reference & Date
  const [refNo, setRefNo] = useState("CDCSR/LTC/OGDC/1207/26");
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));

  // Multi Folio Rows
  const [multiFolios, setMultiFolios] = useState<MultiFolioItem[]>([
    { folio: "283", company: "Khyber Tobacco Company Limited", shares: "3", certificates: "02", scripts: "Cert # 2110-2111" },
    { folio: "8053", company: "K-Electric Limited", shares: "113", certificates: "01", scripts: "Cert # 9401" },
    { folio: "14452", company: "PAK Suzuki Motor Company Limited", shares: "39", certificates: "04", scripts: "Cert # 8011-8014" },
    { folio: "I0151", company: "Pakistan International Airlines Corporation Limited", shares: "100", certificates: "01", scripts: "Cert # 15201" },
  ]);

  // Documents Received (Step 1)
  const [receivedDocs, setReceivedDocs] = useState<string[]>([
    "Copy of CNIC of subject deceased shareholder and yourself",
    "Written transmission request application"
  ]);

  const receivedDocOptions = [
    "Copy of CNIC of subject deceased shareholder and yourself",
    "Written transmission request application",
    "Copy of death certificate of subject deceased shareholder",
    "Copy of Family Registration Certificate (FRC)",
    "Original physical share certificate(s)",
    "Succession Certificate / Letter of Administration",
    "Attested Affidavit / Indemnity Bond",
    "Account maintenance certificate / IBAN details"
  ];

  // Intelligent Transmission Gap Analysis State
  const [gapAnalysis, setGapAnalysis] = useState<DocumentGapAnalysis>(() => 
    calculateDocumentGap([
      "Copy of CNIC of subject deceased shareholder and yourself",
      "Written transmission request application"
    ])
  );
  const [autoSyncGap, setAutoSyncGap] = useState(true);

  const syncLetterToGap = () => {
    const gap = calculateDocumentGap(receivedDocs);
    setGapAnalysis(gap);
    if (gap.missingDocs.length > 0) {
      setRequiredDocs(gap.missingDocs);
    }
    if (gap.hasLostShares) {
      setHasLostShares(true);
    }
  };

  const resetToAllRequirements = () => {
    setRequiredDocs(CANONICAL_TRANSMISSION_DOCS.map(d => d.formalText));
  };

  // Documents Required (Step 2)
  const [requiredDocs, setRequiredDocs] = useState<string[]>([
    "Legible notarized copy of death certificate of subject deceased shareholder",
    "Legible notarized copy of CNICs of subject deceased shareholder & legal heir(s)",
    "Shareholder Information Form (attached) duly filled and signed by all legal heir(s) separately",
    "Shares Transfer stamps of Rs. 25/- (@0.25% of face value of shares)",
    "Original dividend warrants (if any) issued in the name of subject deceased shareholder",
    "Succession Certificate (NADRA Digital or Civil Court Attested Copy along with Court Order)"
  ]);

  const requiredDocOptions = [
    "Legible notarized copy of death certificate of subject deceased shareholder",
    "Legible notarized copy of CNICs of subject deceased shareholder & legal heir(s)",
    "Shareholder Information Form (attached) duly filled and signed by all legal heir(s) separately",
    "Transmission deed (attached) duly filled and signed by all the legal heir(s) along with witness CNIC",
    "Shares Transfer stamps of Rs. 25/- (@0.25% of face value of shares)",
    "Original dividend warrants (if any) issued in the name of subject deceased shareholder",
    "Succession Certificate (NADRA Digital or Civil Court Attested Copy along with Court Order)",
    "Bank Account verification (24-digit IBAN certificate) in name of legal heir",
    "Specimen Signature Card duly verified by legal heir's bank manager",
    "Family Registration Certificate (FRC) issued by NADRA"
  ];

  // Custom additions
  const [customRequiredInput, setCustomRequiredInput] = useState("");
  const [customReceivedInput, setCustomReceivedInput] = useState("");

  // Duplicate / Lost Share Formalities Option & Customization
  const [hasLostShares, setHasLostShares] = useState(false);
  const [lostSharesDetail, setLostSharesDetail] = useState("Share Certificate # 10451 for 1,000 shares");
  const [duplicatePosition, setDuplicatePosition] = useState<"before_required" | "after_required" | "at_end">("before_required");
  const [duplicateIntro, setDuplicateIntro] = useState(
    "Kindly note that as intimated, the subject share certificate(s) are reported lost / misplaced. In order to process the issuance of duplicate share certificate(s) in favor of legal heir(s), following duplicate formalities are required:"
  );
  const [duplicateDocs, setDuplicateDocs] = useState<string[]>([
    "Draft Letter of Indemnity on non-judicial stamp paper of prescribed value (Rs. 500/-) duly attested by Oath Commissioner / Notary Public along with two solvent sureties.",
    "Specimen of newspaper publication notice of loss of shares published in one English and one Urdu daily national newspaper (approved specimen attached).",
    "Original full-page newspaper cuttings of both publications after expiry of 7-day notice period.",
    "Duplicate share certificate issuance fee of Rs. 200/- per certificate."
  ]);
  const [customDuplicateInput, setCustomDuplicateInput] = useState("");

  const addDuplicateDoc = () => {
    if (!customDuplicateInput.trim()) return;
    setDuplicateDocs(prev => [...prev, customDuplicateInput.trim()]);
    setCustomDuplicateInput("");
  };

  const removeDuplicateDoc = (index: number) => {
    setDuplicateDocs(prev => prev.filter((_, i) => i !== index));
  };

  const moveDuplicateDoc = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= duplicateDocs.length) return;
    const copy = [...duplicateDocs];
    const item = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = item;
    setDuplicateDocs(copy);
  };

  const resetDuplicateDocs = () => {
    setDuplicateDocs([
      "Draft Letter of Indemnity on non-judicial stamp paper of prescribed value (Rs. 500/-) duly attested by Oath Commissioner / Notary Public along with two solvent sureties.",
      "Specimen of newspaper publication notice of loss of shares published in one English and one Urdu daily national newspaper (approved specimen attached).",
      "Original full-page newspaper cuttings of both publications after expiry of 7-day notice period.",
      "Duplicate share certificate issuance fee of Rs. 200/- per certificate."
    ]);
  };

  // Plain Text Custom Observation / Remark (Seamless letter paragraph, not a loud box)
  const [includeScrutinyNote, setIncludeScrutinyNote] = useState(false);
  const [scrutinyRemark, setScrutinyRemark] = useState(
    "Upon scrutiny of submitted documents, a variation in the deceased shareholder's name has been observed between CNIC and Share Register. This matter is being taken up with the issuer company for necessary verification."
  );
  const [scrutinyPosition, setScrutinyPosition] = useState<"after_received" | "before_required" | "after_required" | "at_end">("after_required");

  // Second Letter: Document Scrutiny Checklist with Objections
  const [dossierScrutiny, setDossierScrutiny] = useState<ScrutinyDocItem[]>([
    { 
      name: "Succession Certificate / Letter of Administration", 
      status: "deficient", 
      objection: "Distinctive numbers of subject share certificates are not mentioned in the Succession Certificate / schedule; certified court order or amended decree is required." 
    },
    { 
      name: "Computerized Death Certificate (NADRA)", 
      status: "valid", 
      objection: "" 
    },
    { 
      name: "CNIC Copies of All Legal Heirs", 
      status: "deficient", 
      objection: "Attestation missing on CNIC copy of applicant." 
    },
    { 
      name: "Family Registration Certificate (FRC)", 
      status: "valid", 
      objection: "" 
    },
    { 
      name: "Original Physical Share Certificates", 
      status: "missing", 
      objection: "Original share certificate(s) not received. If lost, duplicate share formalities are required." 
    },
    { 
      name: "Indemnity Bond / Transmission Deed", 
      status: "valid", 
      objection: "" 
    },
    { 
      name: "Bank Account IBAN Verification", 
      status: "valid", 
      objection: "" 
    }
  ]);

  // Prefill from URL query params (e.g. from Daily Register)
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
      if (p.shares) setShares(p.shares);
      if (p.certificates) setCertificates(p.certificates);
      if (p.scripts) setScripts(p.scripts);
      if (p.refNo) setRefNo(p.refNo);
      
      const currentRec = p.receivedDocs && p.receivedDocs.length > 0 ? p.receivedDocs : receivedDocs;
      setReceivedDocs(currentRec);

      const gap = p.gapAnalysis || calculateDocumentGap(currentRec);
      setGapAnalysis(gap);

      if (gap.missingDocs && gap.missingDocs.length > 0) {
        setRequiredDocs(gap.missingDocs);
      }
      if (gap.hasLostShares) {
        setHasLostShares(true);
      }
      if (gap.suggestedStage) {
        setLetterStage(gap.suggestedStage);
      }

      setUploadSuccessMsg(
        `Automated Gap Analysis complete! Detected Folio: ${p.folio || 'N/A'}, Company: ${p.compSymbol || 'N/A'}. Received ${gap.receivedCount} of ${gap.totalRequirementsCount} statutory documents (${gap.completionPercentage}% complete). Response letter auto-prepared with the ${gap.missingDocs.length} remaining requirements!`
      );
    } catch (err: any) {
      console.error("Upload parse error:", err);
      alert(err.message || "Failed to analyze letter file. Please check file format.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Pasted Text Handler
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
      if (p.shares) setShares(p.shares);
      if (p.certificates) setCertificates(p.certificates);
      if (p.scripts) setScripts(p.scripts);
      if (p.refNo) setRefNo(p.refNo);
      
      const currentRec = p.receivedDocs && p.receivedDocs.length > 0 ? p.receivedDocs : receivedDocs;
      setReceivedDocs(currentRec);

      const gap = p.gapAnalysis || calculateDocumentGap(currentRec, pastedText);
      setGapAnalysis(gap);

      if (gap.missingDocs && gap.missingDocs.length > 0) {
        setRequiredDocs(gap.missingDocs);
      }
      if (gap.hasLostShares) {
        setHasLostShares(true);
      }
      if (gap.suggestedStage) {
        setLetterStage(gap.suggestedStage);
      }

      setUploadSuccessMsg(
        `Letter text analyzed! Extracted Folio: ${p.folio || 'N/A'}, Company: ${p.compSymbol || 'N/A'}. Received ${gap.receivedCount} of ${gap.totalRequirementsCount} documents. Response letter auto-prepared for the ${gap.missingDocs.length} remaining requirements!`
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

  // Multi-document Dossier Upload Handler for Second Letter
  const handleDossierUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map(f => f.name);
      setDossierFiles(prev => [...prev, ...names]);
    }
  };

  // Update scrutiny item status
  const updateScrutinyStatus = (index: number, status: "valid" | "deficient" | "missing") => {
    setDossierScrutiny(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status };
      return copy;
    });
  };

  const updateScrutinyObjection = (index: number, objection: string) => {
    setDossierScrutiny(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], objection };
      return copy;
    });
  };

  // Active deficiencies for Second Letter
  const activeDeficiencies = dossierScrutiny
    .filter(d => d.status === "deficient" || d.status === "missing")
    .map(d => d.objection ? `${d.name}: ${d.objection}` : `${d.name} is missing or incomplete.`);

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
    setReceivedDocs(prev => {
      const next = prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc];
      if (autoSyncGap) {
        const gap = calculateDocumentGap(next);
        setGapAnalysis(gap);
        if (gap.missingDocs.length > 0) {
          setRequiredDocs(gap.missingDocs);
        }
        if (gap.hasLostShares) {
          setHasLostShares(true);
        }
      }
      return next;
    });
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
        letterStage,
        refNo: letterStage === "second" ? `${refNo}-SEC` : refNo,
        date,
        legalHeir: relation ? `${legalHeir} (${relation})` : legalHeir,
        shareholder: deceased,
        address,
        contactNo: contactNo ? `Contact: ${contactNo}` : "",
        company: mode === "single" ? company : multiFolios.map(m => m.company).join(", "),
        folios: mode === "single" ? [folio] : multiFolios.map(m => m.folio).filter(Boolean),
        shareCertificates: certificates,
        noOfShares: shares,
        scripts,
        multiFolioTable: mode === "multi" ? multiFolios : [],
        receivedDocs,
        requiredDocs,
        scrutinyRemark: includeScrutinyNote ? scrutinyRemark : "",
        scrutinyPosition,
        hasLostShares,
        lostSharesDetail,
        duplicatePosition,
        duplicateDocs,
        duplicateIntro,
        deficiencies: activeDeficiencies
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
      a.download = `CDCSR_Transmission_${letterStage === 'second' ? 'Second_Letter' : 'Letter'}_${compSymbol || 'COMP'}_${fileFolio}.docx`;
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
              remarks: `${letterStage === 'second' ? 'Second Deficiency Letter' : 'First Response Letter'} sent to ${legalHeir} on ${date}`
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
    let plainRemark = "";
    if (includeScrutinyNote && scrutinyRemark.trim()) {
      plainRemark = `\n${scrutinyRemark}\n`;
    }

    let duplicateText = "";
    if (hasLostShares) {
      const intro = duplicateIntro || `Kindly note that as intimated, the subject share certificate(s) (${lostSharesDetail}) are reported lost / misplaced. In order to process issuance of duplicate share certificates, following duplicate formalities are required:`;
      const docsList = duplicateDocs.map((d, i) => `   ${i + 1}. ${d}`).join('\n');
      duplicateText = `\n${intro}\n${docsList}\n`;
    }

    let bodyText = "";
    if (letterStage === "second") {
      bodyText = `${refNo}-SEC              ${date}

${legalHeir}
F/H: ${deceased} (Late)
${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${company}
Transmission of Shares and Dividends – Late ${deceased} – Folio # ${folio} (Scrutiny Observations & Rectification)

We refer to the transmission dossier and documents submitted in our office regarding the transmission of shares of subject deceased shareholder in favor of legal heir(s).

Upon preliminary scrutiny and legal examination of the submitted documents, following deficiencies / discrepancies have been observed:
${activeDeficiencies.map((d, i) => `${i + 1}. ${d}`).join('\n')}
${plainRemark}
You are requested to please rectify the above discrepancies and furnish the amended / required documents at your earliest to enable us to proceed with the transmission of shares.

Regards,

Authorized Signatory         Authorized Signatory
Encl.:  As stated above.`;
    } else {
      bodyText = `${refNo}              ${date}

${legalHeir}
F/H: ${deceased} (Late)
${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${company}
Transmission of Shares and Dividends – Late ${deceased} – Folio # ${mode === 'single' ? folio : multiFolios.map(m => m.folio).join(', ')}

We refer to your letter regarding the captioned subject and acknowledge the receipt of:
${receivedDocs.map(d => '- ' + d).join('\n')}
${scrutinyPosition === 'after_received' ? plainRemark : ''}
Kindly note that as per company's record total, ${certificates} share certificate for ${shares} shares ${scripts ? `(${scripts}) ` : ''}is registered in name of deceased shareholder. In case if share certificate is lost, please intimate us accordingly.
${duplicatePosition === 'before_required' ? duplicateText : ''}
${scrutinyPosition === 'before_required' ? plainRemark : ''}
In order to enable us to process transmission of shares and dividends in favor of legal heir(s), following documents are required:
${requiredDocs.map((d, i) => `${i + 1}. ${d}`).join('\n')}
${duplicatePosition === 'after_required' ? duplicateText : ''}
${scrutinyPosition === 'after_required' ? plainRemark : ''}
Please ensure details are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.
${duplicatePosition === 'at_end' ? duplicateText : ''}
${scrutinyPosition === 'at_end' ? plainRemark : ''}
Regards,

Authorized Signatory         Authorized Signatory
Encl.:  As stated above.`;
    }

    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-5 sm:p-6 shadow-lg border border-blue-900/40 no-print">
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
              Refined draft templates matching CDCSR letterhead format with smart upload, lost share formalities, and second letter scrutiny.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateWord}
              disabled={downloading}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-md h-9 px-4"
            >
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? "Generating Word..." : `Download Word (${letterStage === 'second' ? '2nd Letter' : '1st Letter'})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Stage Switcher: First Letter vs Second Letter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setLetterStage("first")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                letterStage === "first" 
                  ? "bg-[#0B2B5E] text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              First Letter (Formalities Request)
            </button>
            <button
              type="button"
              onClick={() => setLetterStage("second")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                letterStage === "second" 
                  ? "bg-rose-700 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Second Letter (Dossier Scrutiny / Deficiency)
            </button>
          </div>

          {letterStage === "first" && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  mode === "single" ? "bg-white text-[#0B2B5E] shadow-xs" : "text-slate-600"
                }`}
              >
                Single Folio
              </button>
              <button
                type="button"
                onClick={() => setMode("multi")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  mode === "multi" ? "bg-white text-[#0B2B5E] shadow-xs" : "text-slate-600"
                }`}
              >
                Multiple Folios
              </button>
            </div>
          )}
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
        <div className="lg:col-span-7 space-y-5 no-print">

          {/* CARD 0: SMART LETTER UPLOAD & AUTO-EXTRACTION */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#F37021] bg-gradient-to-br from-orange-50/40 via-white to-blue-50/30">
            <CardHeader className="pb-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#F37021]" />
                    {letterStage === "first" ? "Smart First Letter Upload & Auto-Extraction" : "Multi-Document Scrutiny Dossier Upload"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {letterStage === "first" 
                      ? "Upload incoming request letter (.docx, .doc, .pdf, .txt) or paste text to auto-fill folio, company, legal heir & address" 
                      : "Upload returned documents (Succession, Death Cert, CNICs, FRC, Shares) to inspect & draft objection letter"}
                  </CardDescription>
                </div>
                <Badge className="bg-orange-100 text-[#D85B10] border-orange-200 text-[10px] font-bold">
                  OCR &amp; Auto-Fill
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
                  {uploadingFile ? "Analyzing Document..." : "Upload Incoming Letter (.docx/.doc)"}
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
                    <span className="text-[10px] text-emerald-700">Particulars and address populated below. You can review and adjust any field.</span>
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

          {/* AUTOMATED DOCUMENT GAP ANALYSIS & TRANSMISSION READINESS CARD */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-indigo-600 bg-indigo-50/15">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Automated Document Gap Analysis &amp; Transmission Readiness
                    </CardTitle>
                    <Badge className="bg-indigo-100 text-indigo-900 border-indigo-200 text-[10px] font-bold">
                      Intelligent Engine
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-indigo-900/80">
                    Auto-evaluates submitted documents against mandatory SECP &amp; CDCSR statutory transmission prerequisites
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const gap = calculateDocumentGap(receivedDocs);
                      setGapAnalysis(gap);
                      if (gap.missingDocs.length > 0) setRequiredDocs(gap.missingDocs);
                    }}
                    className="h-7 text-[11px] bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50 font-semibold"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Re-evaluate Gap
                  </Button>
                  <label className="flex items-center gap-1.5 text-xs text-indigo-950 font-medium cursor-pointer bg-white px-2 py-1 rounded border border-indigo-200">
                    <input
                      type="checkbox"
                      checked={autoSyncGap}
                      onChange={(e) => {
                        setAutoSyncGap(e.target.checked);
                        if (e.target.checked) {
                          const gap = calculateDocumentGap(receivedDocs);
                          setGapAnalysis(gap);
                          if (gap.missingDocs.length > 0) setRequiredDocs(gap.missingDocs);
                        }
                      }}
                      className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Auto-Sync to Letter</span>
                  </label>
                </div>
              </div>

              {/* Progress Bar & Readiness Status */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-indigo-950 flex items-center gap-1.5">
                    {gapAnalysis?.isComplete ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> 100% Complete &ndash; Ready for Share Transmission Execution
                      </span>
                    ) : (
                      <span className="text-amber-800 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> Transmission Incomplete &ndash; Formalities Pending ({gapAnalysis?.receivedCount || 0} of {gapAnalysis?.totalRequirementsCount || 10} Received)
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-indigo-900">{gapAnalysis?.completionPercentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      gapAnalysis?.isComplete ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-indigo-600'
                    }`}
                    style={{ width: `${gapAnalysis?.completionPercentage || 0}%` }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Column 1: Received Documents (آ چکے ہیں) */}
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Documents Received (آ چکے ہیں)
                    </span>
                    <Badge className="bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                      {receivedDocs.length} On Record
                    </Badge>
                  </div>
                  
                  {receivedDocs.length === 0 ? (
                    <p className="text-[11px] text-emerald-700 italic">No documents registered yet. Upload letter or tick items below.</p>
                  ) : (
                    <ul className="space-y-1">
                      {receivedDocs.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-emerald-900 leading-snug">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Column 2: Pending Statutory Requirements (مزید کیا رہتے ہیں) */}
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Pending Transmission Requirements (مزید کیا رہتے ہیں)
                    </span>
                    <Badge className="bg-amber-200/80 text-amber-950 text-[10px] font-bold">
                      {gapAnalysis?.missingDocs?.length || 0} Remaining
                    </Badge>
                  </div>

                  {gapAnalysis?.missingDocs?.length === 0 ? (
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      All required transmission formalities fulfilled! No pending legal requisites.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {gapAnalysis?.missingItemsDetailed?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-800 leading-snug">
                          <span className="text-amber-600 font-bold shrink-0 mt-0.5">&bull;</span>
                          <div className="text-[11px]">
                            <strong className="text-slate-900">{item.title}:</strong>{" "}
                            <span className="text-slate-600">{item.notes}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Auto-Letter Ready Notification Banner */}
              <div className="p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F37021] shrink-0" />
                  <div>
                    <p className="font-bold">
                      Response Letter Auto-Ready!
                    </p>
                    <p className="text-[11px] text-indigo-900">
                      Draft on the right is customized to request ONLY the {gapAnalysis?.missingDocs?.length || 0} pending items.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={syncLetterToGap}
                    className="h-7 text-[11px] bg-[#0B2B5E] hover:bg-[#071E43] text-white font-bold px-2.5"
                  >
                    Apply Gap to Letter
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={resetToAllRequirements}
                    className="h-7 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-100 px-2"
                  >
                    Include All 10
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECOND LETTER: DOSSIER SCRUTINY & DEFICIENCY CHECKLIST */}
          {letterStage === "second" && (
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-rose-600 bg-rose-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-rose-950 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-rose-600" />
                      Returned Documents Scrutiny &amp; Discrepancy Checklist
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Mark each returned legal document as valid, deficient, or missing. Deficiencies will be numbered in the Second Letter.
                    </CardDescription>
                  </div>
                  <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-[10px] font-bold">
                    {activeDeficiencies.length} Objections Found
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-1 text-xs">
                {/* Upload scanned images / photos of returned documents */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Files className="h-3.5 w-3.5 text-rose-600" />
                      Upload Returned Dossier Scans / Photos:
                    </span>
                    <input 
                      type="file" 
                      multiple 
                      ref={dossierInputRef} 
                      onChange={handleDossierUpload} 
                      className="hidden" 
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => dossierInputRef.current?.click()}
                      className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Scans / Photos
                    </Button>
                  </div>
                  {dossierFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dossierFiles.map((fn, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] bg-slate-100 text-slate-800">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 8-Point Scrutiny Items */}
                <div className="space-y-2">
                  {dossierScrutiny.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateScrutinyStatus(idx, "valid")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "valid" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ✓ Valid
                          </button>
                          <button
                            type="button"
                            onClick={() => updateScrutinyStatus(idx, "deficient")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "deficient" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ⚠ Deficient
                          </button>
                          <button
                            type="button"
                            onClick={() => updateScrutinyStatus(idx, "missing")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "missing" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ✗ Missing
                          </button>
                        </div>
                      </div>

                      {item.status !== "valid" && (
                        <div className="pt-1">
                          <Input
                            value={item.objection}
                            onChange={(e) => updateScrutinyObjection(idx, e.target.value)}
                            placeholder="Specify exact discrepancy or legal objection..."
                            className="h-8 text-xs font-sans text-rose-950 border-rose-200 bg-rose-50/30"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                        placeholder="e.g. Saiyed Ali Imam Jafri" 
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

          {/* Card 2: Legal Heir & Recipient Information (NO CNIC printed in letter) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#F37021]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="h-4 w-4 text-[#F37021]" />
                Legal Heir / Addressee Particulars
              </CardTitle>
              <CardDescription className="text-xs">
                Recipient information for letterhead dispatch (CNIC is kept for records only and omitted from letter)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Legal Heir / Recipient Name</label>
                  <Input 
                    value={legalHeir} 
                    onChange={(e) => setLegalHeir(e.target.value)}
                    placeholder="e.g. Syed Sajjad Imam Jafri" 
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Complete Mailing Address (Auto-Fetched from Document)</label>
                <Input 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. D-231, Street 24, South Navy Housing scheme, Clifton, Karachi." 
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile / Contact Number</label>
                <Input 
                  value={contactNo} 
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="e.g. 0333-3535404" 
                  className="text-xs h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: DUPLICATE / LOST SHARE FORMALITIES (NEW FEATURE) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-amber-600 bg-amber-50/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Duplicate / Lost Share Formalities
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enable if the applicant reported original share certificate(s) as lost or misplaced
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="lostSharesToggle"
                    checked={hasLostShares}
                    onChange={(e) => setHasLostShares(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="lostSharesToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Shares Reported Lost
                  </label>
                </div>
              </div>
            </CardHeader>
            {hasLostShares && (
              <CardContent className="space-y-3 pt-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Position in Letter (لیٹر میں ڈپلیکیٹ فارمیلٹیز کی جگہ)
                    </label>
                    <select
                      value={duplicatePosition}
                      onChange={(e) => setDuplicatePosition(e.target.value as any)}
                      className="w-full p-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800"
                    >
                      <option value="before_required">1. Before Required Formalities (Above Transmission Checklist)</option>
                      <option value="after_required">2. After Required Formalities (Middle - Recommended)</option>
                      <option value="at_end">3. At End of Letter (Bottom - Before Signatures)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Details of Lost Shares (Certificate &amp; Distinctive Nos)
                    </label>
                    <Input 
                      value={lostSharesDetail}
                      onChange={(e) => setLostSharesDetail(e.target.value)}
                      placeholder="e.g. Cert # 10451 for 1,000 shares (Distinctive: 50001 - 51000)"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Introductory Clause Text (ڈپلیکیٹ کا تعارفی پیراگراف)
                  </label>
                  <textarea
                    rows={2}
                    value={duplicateIntro}
                    onChange={(e) => setDuplicateIntro(e.target.value)}
                    placeholder="Enter introductory clause text..."
                    className="w-full p-2 text-xs rounded border border-slate-300 font-sans bg-white"
                  />
                </div>

                {/* Customizable Formalities Checklist */}
                <div className="space-y-2 pt-1 border-t border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">
                      Duplicate Formalities Requirements ({duplicateDocs.length} items)
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={resetDuplicateDocs}
                      className="h-6 text-[10px] text-amber-800 hover:text-amber-950 hover:bg-amber-100/60"
                    >
                      Reset Defaults
                    </Button>
                  </div>

                  {/* List of items */}
                  <div className="space-y-1.5">
                    {duplicateDocs.map((doc, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-amber-200 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <span className="font-bold text-amber-700 font-mono text-[11px] shrink-0">#{idx + 1}</span>
                          <span className="text-slate-800 text-[11px] leading-snug">{doc}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => moveDuplicateDoc(idx, "up")}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === duplicateDocs.length - 1}
                            onClick={() => moveDuplicateDoc(idx, "down")}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDuplicateDoc(idx)}
                            className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Remove Requirement"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add custom item */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Add custom duplicate requirement (e.g. Police FIR copy, Bank Guarantee, etc.)..."
                      value={customDuplicateInput}
                      onChange={(e) => setCustomDuplicateInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDuplicateDoc()}
                      className="text-xs h-8 bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addDuplicateDoc}
                      className="h-8 text-xs bg-amber-700 hover:bg-amber-800 text-white shrink-0 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Requirement
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* CARD 4: STEP 1 & 2 FOR FIRST LETTER */}
          {letterStage === "first" && (
            <>
              {/* Step 1: Documents Received */}
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

                  {receivedDocs.length > 0 && (
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
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Required Formalities Checklist */}
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

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5 text-[#F37021]" />
                      Add Additional Required Document (will be numbered in list):
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. Attested copy of Nikahnama / Marriage Certificate..." 
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

                  {requiredDocs.length > 0 && (
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
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* CARD 5: NATURAL OBSERVATION / SCRUTINY REMARK (SEAMLESS BODY PARAGRAPH) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-blue-700" />
                    Special Scrutiny Observation (Seamless Letter Paragraph)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adds natural letter paragraph text (e.g. name discrepancy, company referral, succession tally) without loud banners or numbering
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="incScrutiny"
                    checked={includeScrutinyNote}
                    onChange={(e) => setIncludeScrutinyNote(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0B2B5E] focus:ring-[#0B2B5E]"
                  />
                  <label htmlFor="incScrutiny" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Include Remark
                  </label>
                </div>
              </div>
            </CardHeader>
            {includeScrutinyNote && (
              <CardContent className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Placement Position in Letter</label>
                  <select
                    value={scrutinyPosition}
                    onChange={(e: any) => setScrutinyPosition(e.target.value)}
                    className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E]"
                  >
                    <option value="after_received">1. After Received Documents (Under Acknowledgement)</option>
                    <option value="before_required">2. Before Required Formalities (Above Checklist)</option>
                    <option value="after_required">3. After Required Formalities (Recommended)</option>
                    <option value="at_end">4. At End of Letter (Before Signatures)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plain Text Observation / Paragraph</label>
                  <textarea 
                    rows={3}
                    value={scrutinyRemark}
                    onChange={(e) => setScrutinyRemark(e.target.value)}
                    placeholder="Type natural observation text to include in letter..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 font-sans"
                  />
                </div>

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
                        setScrutinyRemark("Upon scrutiny of submitted documents, a variation in the deceased shareholder's name has been observed between CNIC and Share Register. This matter is being taken up with the issuer company for necessary verification and confirmation.");
                      }}
                      className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-[#0B2B5E]"
                    >
                      Name Discrepancy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScrutinyRemark("The submitted Succession Certificate does not clearly specify distinctive numbers for subject share certificates. An amended schedule or certified court order specifying distinctive share numbers is required to complete transmission.");
                      }}
                      className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-[#0B2B5E]"
                    >
                      Succession Script Discrepancy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScrutinyRemark("We have forwarded the case documents to the management of the issuer company for necessary approval and confirmation. Upon receipt of advice, further proceedings shall be initiated accordingly.");
                      }}
                      className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-[#0B2B5E]"
                    >
                      Company Takeover / Advice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScrutinyRemark("Accumulated unpaid dividend warrants are currently withheld pending transmission and will be released in favor of legal heir(s) in accordance with the Succession Certificate.");
                      }}
                      className="h-6 text-[10px] px-2 py-0 border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-[#0B2B5E]"
                    >
                      Withheld Dividends
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Realistic Live Letter Preview */}
        <div className="lg:col-span-5 sticky top-4">
          <Card className="border-slate-300 shadow-md bg-white">
            <CardHeader className="p-4 border-b bg-slate-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700">
                    {letterStage === "first" ? "Live Letter Preview (1st Letter)" : "Live Letter Preview (2nd Letter)"}
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Official CDCSR layout reflecting exact statutory requirements
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

            <CardContent className="p-5 font-serif text-[12px] leading-relaxed text-slate-800 space-y-3.5 max-h-[750px] overflow-y-auto select-text bg-[#fcfcfc]">

              {/* Header Info */}
              <div className="flex justify-between items-start font-sans font-bold text-xs pb-1 border-b">
                <span className="text-[#0B2B5E]">{letterStage === "second" ? `${refNo}-SEC` : refNo}</span>
                <span className="text-slate-600">{date}</span>
              </div>

              {/* Addressee Info (NO CNIC - As requested) */}
              <div className="font-sans space-y-0.5 text-xs">
                <p className="font-bold text-slate-900">{legalHeir} {relation ? `(${relation})` : ''}</p>
                <p className="text-slate-600 font-medium">F/H: {deceased} (Late)</p>
                <p className="text-slate-700">{address}</p>
                {contactNo && <p className="text-slate-600 text-[11px]">Contact: {contactNo}</p>}
              </div>

              <div className="font-sans text-xs pt-1">
                <p className="font-semibold text-slate-700">Dear Concern,</p>
              </div>

              {/* Subject */}
              <div className="font-sans text-xs space-y-0.5 border-l-2 border-l-[#F37021] pl-2.5 py-0.5 bg-orange-50/40">
                <p className="font-bold text-[#0B2B5E]">{company}</p>
                <p className="font-bold text-slate-900 underline">
                  Transmission of Shares and Dividends – Late {deceased} – Folio # {mode === "single" ? folio : multiFolios.map(m => m.folio).filter(Boolean).join(", ")}
                  {letterStage === "second" ? " (Scrutiny Observations & Rectification)" : ""}
                </p>
              </div>

              {/* STAGE 1: FIRST LETTER BODY */}
              {letterStage === "first" && (
                <>
                  <p>
                    We refer to your letter regarding the captioned subject and acknowledge the receipt of:{" "}
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
                            <th className="p-1.5">S #</th>
                            <th className="p-1.5">Company</th>
                            <th className="p-1.5">Folio</th>
                            <th className="p-1.5">Certs</th>
                            <th className="p-1.5">Shares</th>
                            <th className="p-1.5">Scripts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {multiFolios.map((m, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                              <td className="p-1.5 font-bold text-slate-500">{i + 1}</td>
                              <td className="p-1.5 font-semibold text-[#0B2B5E]">{m.company}</td>
                              <td className="p-1.5 font-bold">{m.folio}</td>
                              <td className="p-1.5">{m.certificates}</td>
                              <td className="p-1.5">{m.shares}</td>
                              <td className="p-1.5">{m.scripts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Position A: After Received Documents */}
                  {includeScrutinyNote && scrutinyPosition === 'after_received' && scrutinyRemark.trim() && (
                    <p className="my-2">{scrutinyRemark}</p>
                  )}

                  {/* Duplicate Formalities - Position: Before Required */}
                  {hasLostShares && duplicatePosition === 'before_required' && (
                    <div className="my-2 p-2.5 rounded bg-amber-50/60 border border-amber-200 text-slate-800 space-y-1">
                      <p className="font-semibold text-amber-950">
                        {duplicateIntro || `Kindly note that as intimated, the subject share certificate(s) (${lostSharesDetail}) are reported lost / misplaced. In order to process the issuance of duplicate share certificate(s) in favor of legal heir(s), following duplicate formalities are required:`}
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {duplicateDocs.map((doc, dIdx) => (
                          <li key={dIdx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Position B: Before Required Formalities */}
                  {includeScrutinyNote && scrutinyPosition === 'before_required' && scrutinyRemark.trim() && (
                    <p className="my-2">{scrutinyRemark}</p>
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

                  {/* Duplicate Formalities - Position: After Required (Default/Middle) */}
                  {hasLostShares && duplicatePosition === 'after_required' && (
                    <div className="my-2 p-2.5 rounded bg-amber-50/60 border border-amber-200 text-slate-800 space-y-1">
                      <p className="font-semibold text-amber-950">
                        {duplicateIntro || `Kindly note that as intimated, the subject share certificate(s) (${lostSharesDetail}) are reported lost / misplaced. In order to process the issuance of duplicate share certificate(s) in favor of legal heir(s), following duplicate formalities are required:`}
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {duplicateDocs.map((doc, dIdx) => (
                          <li key={dIdx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Position C: After Required Formalities (Recommended) */}
                  {includeScrutinyNote && scrutinyPosition === 'after_required' && scrutinyRemark.trim() && (
                    <p className="my-2">{scrutinyRemark}</p>
                  )}

                  <p className="text-[11px] text-slate-600 pt-1">
                    Please ensure that details such as company name, folio number and number of shares are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.
                  </p>

                  {/* Duplicate Formalities - Position: At End of Letter */}
                  {hasLostShares && duplicatePosition === 'at_end' && (
                    <div className="my-2 p-2.5 rounded bg-amber-50/60 border border-amber-200 text-slate-800 space-y-1">
                      <p className="font-semibold text-amber-950">
                        {duplicateIntro || `Kindly note that as intimated, the subject share certificate(s) (${lostSharesDetail}) are reported lost / misplaced. In order to process the issuance of duplicate share certificate(s) in favor of legal heir(s), following duplicate formalities are required:`}
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {duplicateDocs.map((doc, dIdx) => (
                          <li key={dIdx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Position D: At End of Letter */}
                  {includeScrutinyNote && scrutinyPosition === 'at_end' && scrutinyRemark.trim() && (
                    <p className="my-2">{scrutinyRemark}</p>
                  )}
                </>
              )}

              {/* STAGE 2: SECOND LETTER BODY (DEFICIENCY / OBJECTION) */}
              {letterStage === "second" && (
                <>
                  <p>
                    We refer to the transmission dossier and documents submitted in our office regarding the transmission of shares of subject deceased shareholder in favor of legal heir(s).
                  </p>

                  <p className="font-semibold text-slate-900">
                    Upon preliminary scrutiny and legal examination of the submitted documents, following deficiencies / discrepancies have been observed:
                  </p>

                  <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                    {activeDeficiencies.map((def, idx) => (
                      <li key={idx} className="leading-snug font-medium text-slate-900">
                        {def}
                      </li>
                    ))}
                  </ol>

                  {includeScrutinyNote && scrutinyRemark.trim() && (
                    <p className="my-2">{scrutinyRemark}</p>
                  )}

                  <p className="text-[11px] text-slate-600 pt-1">
                    You are requested to please rectify the above discrepancies and furnish the amended / required documents at your earliest to enable us to proceed with the transmission of shares.
                  </p>
                </>
              )}

              {/* Signatures (NO CDCSR printed below signatures as per official letterhead practice) */}
              <div className="pt-4 font-sans space-y-1 border-t">
                <p className="text-slate-600">Regards,</p>
                <div className="flex justify-between items-end pt-4 pb-2 text-xs font-bold text-slate-700">
                  <span>Authorized Signatory</span>
                  <span>Authorized Signatory</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">Encl.:  As stated above.</p>
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
