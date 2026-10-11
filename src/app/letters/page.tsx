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
  Printer,
  ChevronDown,
  ChevronUp,
  Send,
  CheckSquare,
  Truck
} from "lucide-react";
import companiesList from "@/data/companiesList.json";
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

  // Template Switcher: First Letter, No Folio Found, Physical Approval Covering, Delivery of Shares
  const [letterStage, setLetterStage] = useState<"first" | "no_folio" | "physical_approval" | "delivery_shares" | "delivery_cheques">("first");
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    quickUpload: true,
    basicDetails: true,
    documentsChecklist: true,
    observations: true,
    transferees: true,
    deliveryDetails: true,
  });
  const toggleAccordion = (name: string) => {
    setOpenAccordion(prev => ({ ...prev, [name]: !prev[name] }));
  };
  const [transferees, setTransferees] = useState<Array<{ id: string; name: string; cnic: string; shares: string; folio: string; relation: string }>>([
    { id: "1", name: "Syed Sajjad Imam Jafri", cnic: "42101-1234567-1", shares: "=500=", folio: "NEW-01", relation: "Son / Legal Heir" },
    { id: "2", name: "Syeda Fatima Jafri", cnic: "42101-7654321-2", shares: "=500=", folio: "NEW-02", relation: "Daughter / Legal Heir" }
  ]);
  const [transferReceipts, setTransferReceipts] = useState<Array<{ id: string; receiptNo: string; name: string }>>([
    { id: "1", receiptNo: "469", name: "MRS. SARA KHALID" },
    { id: "2", receiptNo: "470", name: "MRS. IMRANA NASIR" },
    { id: "3", receiptNo: "471", name: "MRS. MOBINA AMAN" }
  ]);
  const [transferRegisterPages, setTransferRegisterPages] = useState("06 (02 Copies)");
  const [lossRegisterPages, setLossRegisterPages] = useState("02 (02 Copies)");
  const [hasLossRegister, setHasLossRegister] = useState(true);
  const [lossReceiptNo, setLossReceiptNo] = useState("LR-2026/089");
  const [hasSplitRegister, setHasSplitRegister] = useState(false);
  const [splitRegisterPages, setSplitRegisterPages] = useState("02 (02 Copies)");
  const [splitReceiptNo, setSplitReceiptNo] = useState("SR-2026/044");
  const [approvalCoveringNotes, setApprovalCoveringNotes] = useState(
    "You are kindly requested to please accord your formal approval / sign the attached Transmission Register and return the same to us along with blank share certificates to enable us to execute the transfer."
  );
  const [deliveryMode, setDeliveryMode] = useState<string>("By Hand");
  const [dispatchTrackingNo, setDispatchTrackingNo] = useState("TCS-789012345");
  const [deliveryNotes, setDeliveryNotes] = useState(
    "Please acknowledge receipt of the share certificates by signing and returning the duplicate copy of this letter or counterfoil. In case of any query, please feel free to contact us."
  );
  const [allCompanies, setAllCompanies] = useState<string[]>(companiesList);
  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [cheques, setCheques] = useState<Array<{ id: string; beneficiary: string; instrumentNo: string; amount: string }>>([
    { id: "1", beneficiary: "Farrukh Aftab Ahmed", instrumentNo: "13519474", amount: "4,160.99/-" },
    { id: "2", beneficiary: "Samina Nazli", instrumentNo: "13519475", amount: "2,080.49/-" },
    { id: "3", beneficiary: "Shabana Nazli", instrumentNo: "13519476", amount: "2,080.49/-" }
  ]);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncToMis, setSyncToMis] = useState(true);
  const [searchingFolio, setSearchingFolio] = useState(false);
  const [includeStandardCertLine, setIncludeStandardCertLine] = useState(false); // Requirement 13
  const [cleanHeirNameOnly, setCleanHeirNameOnly] = useState(true); // Requirement 9
  const [stampDutyProvince, setStampDutyProvince] = useState<"Sindh" | "Punjab" | "Federal Capital" | "KPK" | "Balochistan">("Sindh"); // Requirement 12
  const [includeStampDutyTable, setIncludeStampDutyTable] = useState(false); // Requirement 18
  const [cdsAccountNo, setCdsAccountNo] = useState("03277-6959");
  const [noFolioComments, setNoFolioComments] = useState("");

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

  // Legal Heir Details
  const [legalHeir, setLegalHeir] = useState("Syed Sajjad Imam Jafri");
  const [relation, setRelation] = useState("Legal Heir / Son");
  const [address, setAddress] = useState("D-231, Street 24, South Navy Housing scheme, Clifton, Karachi.");
  const [contactNo, setContactNo] = useState("0333-3535404");

  // Reference & Date (Requirement 4: Standard DD/MM/YYYY)
  const [refNo, setRefNo] = useState("CDCSR/LTC/OGDC/1207/26");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

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
  const [scrutinyPosition, setScrutinyPosition] = useState<"top" | "middle" | "bottom" | "after_received" | "before_required" | "after_required" | "at_end">("middle");

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
        refNo: refNo,
        date,
        legalHeir: cleanHeirNameOnly ? legalHeir : (relation ? `${legalHeir} (${relation})` : legalHeir),
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
        includeStandardCertLine,
        includeStampDutyTable,
        stampDutyProvince,
        // Physical Approval parameters
        transferees,
        hasLossRegister,
        lossReceiptNo,
        hasSplitRegister,
        splitReceiptNo,
        approvalCoveringNotes,
        // Delivery parameters
        deliveryMode,
        dispatchTrackingNo,
        deliveryNotes,
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
      a.download = `CDCSR_Transmission_${'Letter'}_${compSymbol || 'COMP'}_${fileFolio}.docx`;
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
              remarks: `${'Transmission Response Letter'} sent to ${legalHeir} on ${date}`
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
    if (letterStage === "no_folio") {
      bodyText = `${refNo}              ${date}

${legalHeir}
F/H: ${deceased} (Late)
${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${company}
Transmission of Shares & Verification of Title – Late ${deceased} – Folio # ${folio}

We refer to your query / communication regarding transmission of shares of the subject deceased shareholder.

Please be advised that upon thorough scrutiny and search of the share register / records of ${company}, no shareholding or folio exists in the name of the deceased shareholder under the provided folio / particulars (${folio}).

${noFolioComments ? noFolioComments + '\n\n' : ''}In order to enable us to investigate further, please furnish:
1. Legible copies of original share certificates / counterfoils (if available).
2. Dividend counterfoils / warrants previously issued by the Company.
3. Complete CNIC of the deceased shareholder along with previous aliases / addresses.

Regards,

Authorized Signatory         Authorized Signatory
Encl.:  As stated above.`;
    } else if (letterStage === "physical_approval") {
      bodyText = `${refNo}              ${date}

The Company Secretary
${company}
${approvalCompanyAddress || ''}

${approvalSalutation || 'Dear Sir / Madam,'}

${company} (${approvalSymbol || 'SYM'}) Transmission of Shares & Dividends – Late ${deceased} – Folio # ${folio}

We refer to your office letter ref: ${approvalOfficeRef || 'nil'} dated ${approvalOfficeDate || 'nil'} regarding approval of transmission of shares in favor of legal heirs of above deceased shareholder. In this regard we are pleased to enclose herewith =${approvalCertificatesCount || certificates || '01'}= share certificates for =${shares || '0'}= shares along with their relevant Loss & Transfer registers and other supporting documents being forwarded to you for approval of transfers thereon by the Directors / Authorized Signatories.

No. of transfer receipt(s) : ${approvalTransferReceiptsCount || transferReceiptList.length || '01'}
${transferReceiptList.map(r => `Transfer receipt(s) # : ${r.receiptNo} (in the name of ${r.name})`).join('\n')}
Transfer register no. of page(s) : ${approvalTransferRegisterPages || '02'} (02 Copies)
Loss receipt(s) # : ${approvalLossReceiptNo || 'nil'}
Loss register no. of page(s) : ${approvalLossRegisterPages || 'nil'} (02 Copies)

In view of above you are requested to kindly return the enclosed following documents duly approved / signed by the Directors / Authorized Signatories of the Company at your earliest:

${approvalSignDuplicates ? `1. Authorized Signatory's signatures on the face of =${approvalCertificatesCount || '01'}= duplicate shares certificates (if applicable).\n` : ''}2. Authorized Signatory's signatures on the Memorandum of Transfers (on the back of each share certificate).
3. Authorized Signatory's signature on Loss & Transfer register.

After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case.

Further, please arrange to check whether any other dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid, if so, then please arrange to issue cheque(s) / online payment in favor of above legal heirs as per their entitlement.

Yours faithfully,
For CDC Share Registrar Services Limited

Authorized Signatory         Authorized Signatory
Encl.:  As stated above.`;
    } else if (letterStage === "delivery_cheques") {
      bodyText = `${refNo}              ${date}

${legalHeir}
${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${company}
Transmission of Shares & Dividends – Late ${deceased} – Folio # ${folio}

We refer to transmission of shares of the captioned deceased shareholder.

Please find enclosed herewith following dividend cheque(s) / instrument(s) in respect of deceased shareholder:

${chequeList.map((c, i) => `${i + 1}. Beneficiary: ${c.beneficiary} | Instrument #: ${c.instrumentNo} | Amount (PKR): ${c.amount}`).join('\n')}

Please acknowledge receipt of the cheque(s) / instrument(s).

Yours faithfully,
For CDC Share Registrar Services Limited

Authorized Signatory         Authorized Signatory
Encl.:  As stated above.`;
    } else if (letterStage === "delivery_shares") {
      bodyText = `${refNo}              ${date}

${legalHeir}
F/H: ${deceased} (Late)
${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${company}
Dispatch / Handover of Share Certificates – Folio # ${folio} (Transmission Completed)

We are pleased to inform you that transmission of shares in respect of late ${deceased} has been successfully completed in accordance with the Succession Certificate.

Accordingly, please find enclosed herewith the fresh physical share certificate(s) totaling ${shares} shares (${scripts || 'as attached'}) dispatched via ${deliveryMode} ${dispatchTrackingNo ? `(Consignment / Tracking #: ${dispatchTrackingNo})` : ''}.

${deliveryNotes || 'Please acknowledge receipt of the share certificates by signing and returning the duplicate copy of this letter or counterfoil. In case of any query, please feel free to contact us.'}

Regards,

Authorized Signatory         Authorized Signatory
Encl.: Share Certificates & Acknowledgement Slip`;
    } else {
      bodyText = `${refNo}              ${date}

${legalHeir}
${cleanHeirNameOnly ? '' : `F/H: ${deceased} (Late)\n`}${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${company}
Transmission of Shares and Dividends – Late ${deceased} – Folio # ${mode === 'single' ? folio : multiFolios.map(m => m.folio).join(', ')}

${scrutinyPosition === 'top' && plainRemark ? plainRemark + '\n' : ''}We refer to your letter regarding the captioned subject and acknowledge the receipt of:
${receivedDocs.map(d => '- ' + d).join('\n')}

Kindly note that as per company's record total, ${certificates} share certificate for ${shares} shares under folio of ${company} is registered in name of deceased shareholder (details of shares attached).${includeStandardCertLine ? '\n\nShare certificates shall be sent upon our further instructions.' : ''}${hasLostShares ? '\n\n' + duplicateIntro + '\n' + duplicateDocs.map((d, i) => '• ' + d).join('\n') : ''}
${scrutinyPosition === 'middle' && plainRemark ? plainRemark + '\n' : ''}
In order to enable us to process transmission of shares and dividends in favor of legal heir(s), following documents are required:
${requiredDocs.map((d, i) => `${i + 1}. ${d}`).join('\n')}
${scrutinyPosition === 'bottom' && plainRemark ? plainRemark + '\n' : ''}
Please ensure details are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.

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
              {downloading ? "Generating Word..." : `Download Word (${
                letterStage === 'first' ? '1st Letter' :
                letterStage === 'no_folio' ? 'No Folio Found' :
                letterStage === 'physical_approval' ? 'Approval Covering' :
                'Delivery of Shares'
              })`}
            </Button>
          </div>
        </div>
      </div>

      {/* Template Stage Switcher Tabs */}
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
              1. First Letter
            </button>
            <button
              type="button"
              onClick={() => setLetterStage("no_folio")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                letterStage === "no_folio" 
                  ? "bg-amber-600 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. No Folio Found
            </button>
            <button
              type="button"
              onClick={() => setLetterStage("physical_approval" as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                letterStage === ("physical_approval" as any) 
                  ? "bg-emerald-700 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3. Physical Approval Covering
            </button>
            <button
              type="button"
              onClick={() => setLetterStage("delivery_shares" as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                letterStage === ("delivery_shares" as any) 
                  ? "bg-indigo-700 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              4. Delivery of Shares
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {previewLayout === "hidden" && (
            <button
              type="button"
              onClick={() => setPreviewLayout("normal")}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Show Live Preview
            </button>
          )}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="syncMis" 
              checked={syncToMis} 
              onChange={(e) => setSyncToMis(e.target.checked)} 
              className="h-4 w-4 rounded border-slate-300 text-[#F37021] focus:ring-[#F37021]"
            />
            <label htmlFor="syncMis" className="text-xs text-slate-700 font-medium cursor-pointer">
              Auto-sync dispatch in MIS correspondence
            </label>
          </div>
        </div>
      </div>

      {/* 2-Column Working Layout: Left Form Inputs | Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Configuration Form with Clean Accordion Style */}
        <div className={`space-y-4 no-print transition-all duration-300 ${previewLayout === "hidden" ? "lg:col-span-12" : previewLayout === "wide" ? "lg:col-span-5" : "lg:col-span-7"}`}>

          {/* ACCORDION 1: SMART UPLOAD & AUTO-EXTRACTION (Optional for convenience) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("quickUpload")}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 via-white to-blue-50/30 hover:bg-orange-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#F37021]/10 text-[#F37021]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    1. Smart Letter Upload &amp; Auto-Fill
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Upload incoming shareholder request (PDF, Word, or Photo/Scanned Image) to auto-fill details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className="bg-orange-100 text-[#D85B10] border-orange-200 text-[10px] font-bold">
                  OCR &amp; Auto-Fill
                </Badge>
                {openAccordion.quickUpload ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </button>

            {openAccordion.quickUpload && (
              <div className="p-4 pt-2 border-t border-slate-100 space-y-3 bg-white">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,image/*" 
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
                    {uploadingFile ? "Analyzing Document..." : "Upload Letter / Application Document (PDF, Word, JPG, PNG)"}
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
              </div>
            )}
          </div>

          {/* ACCORDION 2: BASIC DETAILS (Company Dropdown, Folio, Legal Heir, Contact, Deceased) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("basicDetails")}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/60 via-white to-slate-50 hover:bg-blue-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#0B2B5E]/10 text-[#0B2B5E]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    2. Shareholder &amp; Legal Heir Particulars
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Company selectable list, Folio auto-lookup, Deceased &amp; Legal Heir info with mobile &amp; address
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-[#0B2B5E] bg-blue-100 px-2 py-0.5 rounded">
                  {company ? (company.length > 25 ? company.slice(0, 25) + '...' : company) : 'Select Company'}
                </span>
                {openAccordion.basicDetails ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </button>

            {openAccordion.basicDetails && (
              <div className="p-4 pt-3 border-t border-slate-100 space-y-4 bg-white">
                {/* Mode switcher (Single vs Multi Folio) */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Holding Mode:</span>
                    <button
                      type="button"
                      onClick={() => setMode("single")}
                      className={`px-2.5 py-1 text-xs rounded font-bold transition-all ${
                        mode === "single" ? "bg-[#0B2B5E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Single Folio
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("multi")}
                      className={`px-2.5 py-1 text-xs rounded font-bold transition-all ${
                        mode === "multi" ? "bg-[#0B2B5E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Multiple Folios
                    </button>
                  </div>
                  {mode === "single" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLookupFolio}
                      disabled={searchingFolio}
                      className="text-xs h-7 border-[#F37021] text-[#F37021] hover:bg-orange-50 font-bold"
                    >
                      <Search className="mr-1 h-3 w-3" />
                      {searchingFolio ? "Searching..." : "Auto-Fetch Folio"}
                    </Button>
                  )}
                </div>

                {/* Company Name with Full Selectable List / Autocomplete Dropdown */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCompanyModal(true)}
                      className="text-[11px] font-bold text-[#F37021] hover:text-[#D85B10] flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      + Add New Company
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setCompanySearchQuery(e.target.value);
                        setIsCompanyDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setCompanySearchQuery(company);
                        setIsCompanyDropdownOpen(true);
                      }}
                      placeholder="Search and select from 175+ registered companies..." 
                      className="text-xs h-9 pr-8 font-semibold text-[#0B2B5E]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-700"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Autocomplete Dropdown Menu */}
                  {isCompanyDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-xl py-1 text-xs">
                      <div 
                        onClick={() => {
                          setShowAddCompanyModal(true);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className="px-3 py-2 bg-orange-50 hover:bg-orange-100 cursor-pointer font-bold text-[#D85B10] border-b border-orange-200 flex items-center justify-between"
                      >
                        <span>+ Add New Company</span>
                        <span className="text-[10px] bg-[#F37021] text-white px-1.5 py-0.5 rounded font-mono">Custom</span>
                      </div>
                      {allCompanies
                        .filter(c => c.toLowerCase().includes((companySearchQuery || "").toLowerCase()))
                        .slice(0, 35)
                        .map((comp, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setCompany(comp);
                              const sym = comp.split(' ')[0].toUpperCase();
                              setCompSymbol(sym);
                              setRefNo(`CDCSR/LTC/${sym}/${folio || '0000'}/26`);
                              setIsCompanyDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer font-medium text-slate-800 border-b border-slate-50 last:border-0 flex items-center justify-between"
                          >
                            <span>{comp}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{comp.split(' ')[0]}</span>
                          </div>
                        ))}
                      {allCompanies.filter(c => c.toLowerCase().includes((companySearchQuery || "").toLowerCase())).length === 0 && (
                        <div className="p-3 text-slate-500 text-center text-xs">
                          <p>No existing company matches "{companySearchQuery}".</p>
                          <button
                            type="button"
                            onClick={() => {
                              const newName = companySearchQuery.trim();
                              if (newName) {
                                setAllCompanies(prev => [newName, ...prev]);
                                setCompany(newName);
                                const sym = newName.split(' ')[0].toUpperCase();
                                setCompSymbol(sym);
                                setRefNo(`CDCSR/LTC/${sym}/${folio || '0000'}/26`);
                                setIsCompanyDropdownOpen(false);
                              }
                            }}
                            className="mt-1 text-xs font-bold text-[#F37021] hover:underline"
                          >
                            Use "{companySearchQuery}" as company &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Folio & Shareholding */}
                {mode === "single" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Deceased Shareholder</label>
                      <Input 
                        value={deceased} 
                        onChange={(e) => setDeceased(e.target.value)}
                        placeholder="e.g. Saiyed Ali Imam Jafri" 
                        className="text-xs h-9 font-medium"
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
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Certificates Count</label>
                      <Input 
                        value={certificates} 
                        onChange={(e) => setCertificates(e.target.value)}
                        placeholder="e.g. =01=" 
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Multiple Folios Breakdown</p>
                      <Button 
                        type="button" 
                        onClick={addMultiFolioRow} 
                        size="sm" 
                        className="h-7 text-xs bg-[#0B2B5E] text-white"
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

                {/* Certificate Distinctive Scripts (Hidden for First Letter) */}
                {letterStage !== "first" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Certificate Numbers &amp; Distinctive Range
                  </label>
                  <Input 
                    value={scripts} 
                    onChange={(e) => setScripts(e.target.value)}
                    placeholder="e.g. Cert # 10451 (Distinctive: 50001 - 51000)" 
                    className="text-xs h-9 text-slate-600"
                  />
                </div>
                )}

                {/* Legal Heir Details (Name, Contact/Mobile, Mailing Address) */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Legal Heir Name <span className="text-rose-500">*</span>
                      </label>
                      <Input 
                        value={legalHeir} 
                        onChange={(e) => setLegalHeir(e.target.value)}
                        placeholder="e.g. Syed Sajjad Imam Jafri" 
                        className="text-xs h-9 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Capacity / Relationship (Optional)
                      </label>
                      <Input 
                        value={relation} 
                        onChange={(e) => setRelation(e.target.value)}
                        placeholder="e.g. Legal Heir / Son / Widow" 
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Mobile / Contact Number
                      </label>
                      <Input 
                        value={contactNo} 
                        onChange={(e) => setContactNo(e.target.value)}
                        placeholder="e.g. 0333-3535404" 
                        className="text-xs h-9 font-semibold text-[#0B2B5E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Complete Mailing Address
                    </label>
                    <Input 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. D-231, Street 24, South Navy Housing scheme, Clifton, Karachi." 
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TEMPLATE-SPECIFIC ACCORDIONS */}

          {/* --- CASE A: FIRST LETTER (Checklists: Received vs Required) --- */}
          {letterStage === "first" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
              <button
                type="button"
                onClick={() => toggleAccordion("documentsChecklist")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/60 via-white to-blue-50/40 hover:bg-emerald-50/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-700">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      3. Documents Received &amp; Required Checklist
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Acknowledge received documents and specify statutory requirements demanded from heirs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {receivedDocs.length} Recv / {requiredDocs.length} Req
                  </Badge>
                  {openAccordion.documentsChecklist ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {openAccordion.documentsChecklist && (
                <div className="p-4 pt-3 border-t border-slate-100 space-y-4 bg-white">
                  {/* Step 1: Documents Received */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Step 1: Documents Received (Acknowledged in Letter)
                      </span>
                      <span className="text-[11px] text-slate-400">{receivedDocs.length} selected</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {receivedDocOptions.map((doc, i) => {
                        const isChecked = receivedDocs.includes(doc);
                        return (
                          <div 
                            key={i} 
                            onClick={() => toggleReceivedDoc(doc)}
                            className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                              isChecked ? 'bg-emerald-50/80 border-emerald-300 font-medium text-emerald-950' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                            />
                            <span className="leading-snug text-[11px]">{doc}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Input 
                        placeholder="Add custom received document..." 
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
                  </div>

                  {/* Step 2: Documents Required */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2B5E] flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#F37021]" />
                        Step 2: Documents Required (Requisite Documents List)
                      </span>
                      <span className="text-[11px] text-slate-400">{requiredDocs.length} items</span>
                    </div>

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
                                  ? 'bg-amber-50/80 border-amber-300 font-bold text-amber-950' 
                                  : 'bg-blue-50/80 border-blue-300 font-medium text-[#0B2B5E]' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#0B2B5E] focus:ring-[#0B2B5E]" 
                            />
                            <div className="leading-snug flex-1 text-[11px]">
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

                    <div className="flex gap-2 pt-1">
                      <Input 
                        placeholder="Add custom required document (e.g. Attested copy of Nikahnama)..." 
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
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- CASE B: PHYSICAL APPROVAL (Transferees Distribution & Special Registers) --- */}
          {letterStage === "physical_approval" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
              <button
                type="button"
                onClick={() => toggleAccordion("transferees")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/60 via-white to-slate-50 hover:bg-emerald-50/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-800">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      3. Transferees Breakdown &amp; Registers
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Add/remove transferees (1, 2, 4, 6+), set shares/CNIC, Loss Register #, Split Register #
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                    {transferees.length} Transferee(s)
                  </Badge>
                  {openAccordion.transferees ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {openAccordion.transferees && (
                <div className="p-4 pt-3 border-t border-slate-100 space-y-4 bg-white">
                  {/* Dynamic Transferees Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Legal Heirs / Transferees List:
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const nextNum = transferees.length + 1;
                          setTransferees(prev => [
                            ...prev,
                            { id: Date.now().toString(), name: `Legal Heir ${nextNum}`, cnic: "", shares: "=0=", folio: `NEW-0${nextNum}`, relation: "Legal Heir" }
                          ]);
                        }}
                        className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Transferee
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {transferees.map((t, idx) => (
                        <div key={t.id || idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 items-center text-xs">
                          <div className="col-span-1 text-center font-bold text-slate-500">
                            #{idx + 1}
                          </div>
                          <div className="col-span-4">
                            <Input
                              placeholder="Transferee Name"
                              value={t.name}
                              onChange={(e) => {
                                const copy = [...transferees];
                                copy[idx].name = e.target.value;
                                setTransferees(copy);
                              }}
                              className="h-8 text-xs font-semibold"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="CNIC (e.g. 42101-...)"
                              value={t.cnic}
                              onChange={(e) => {
                                const copy = [...transferees];
                                copy[idx].cnic = e.target.value;
                                setTransferees(copy);
                              }}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Shares (=500=)"
                              value={t.shares}
                              onChange={(e) => {
                                const copy = [...transferees];
                                copy[idx].shares = e.target.value;
                                setTransferees(copy);
                              }}
                              className="h-8 text-xs font-bold text-emerald-800"
                            />
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <Input
                              placeholder="Folio"
                              value={t.folio}
                              onChange={(e) => {
                                const copy = [...transferees];
                                copy[idx].folio = e.target.value;
                                setTransferees(copy);
                              }}
                              className="h-8 text-xs"
                            />
                            {transferees.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setTransferees(prev => prev.filter((_, i) => i !== idx))}
                                className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Registers Options */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-amber-950 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasLossRegister}
                            onChange={(e) => setHasLossRegister(e.target.checked)}
                            className="h-4 w-4 rounded text-amber-600"
                          />
                          <span>Loss of Shares Register Entry</span>
                        </label>
                      </div>
                      {hasLossRegister && (
                        <div>
                          <label className="text-[11px] text-amber-900 block mb-1">Receipt Entry / Serial #:</label>
                          <Input
                            value={lossReceiptNo}
                            onChange={(e) => setLossReceiptNo(e.target.value)}
                            placeholder="e.g. LR-2026/089"
                            className="h-8 text-xs bg-white font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-blue-950 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasSplitRegister}
                            onChange={(e) => setHasSplitRegister(e.target.checked)}
                            className="h-4 w-4 rounded text-blue-600"
                          />
                          <span>Split of Certificates Register Entry</span>
                        </label>
                      </div>
                      {hasSplitRegister && (
                        <div>
                          <label className="text-[11px] text-blue-900 block mb-1">Split Receipt Entry #:</label>
                          <Input
                            value={splitReceiptNo}
                            onChange={(e) => setSplitReceiptNo(e.target.value)}
                            placeholder="e.g. SR-2026/044"
                            className="h-8 text-xs bg-white font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Covering Closing Instruction to Company Secretary:
                    </label>
                    <textarea
                      rows={2}
                      value={approvalCoveringNotes}
                      onChange={(e) => setApprovalCoveringNotes(e.target.value)}
                      className="w-full p-2.5 text-xs rounded border border-slate-300 font-sans"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- CASE C: DELIVERY OF SHARES (Dispatch Mode & Tracking) --- */}
          {letterStage === "delivery_shares" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
              <button
                type="button"
                onClick={() => toggleAccordion("deliveryDetails")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50 hover:bg-indigo-50/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-700/10 text-indigo-700">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      3. Share Delivery &amp; Dispatch Mode
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Delivery mode (By Hand, TCS, Registered Post), Tracking Consignment #, Receipt counterfoil
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-indigo-100 text-indigo-900 text-[10px] font-bold">
                    {deliveryMode}
                  </Badge>
                  {openAccordion.deliveryDetails ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {openAccordion.deliveryDetails && (
                <div className="p-4 pt-3 border-t border-slate-100 space-y-3 bg-white text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Delivery / Dispatch Mode:</label>
                      <select
                        value={deliveryMode}
                        onChange={(e) => setDeliveryMode(e.target.value)}
                        className="w-full h-9 rounded border border-slate-300 px-2 font-bold text-slate-800 bg-white"
                      >
                        <option value="By Hand">By Hand (Deliver across counter with CNIC verification)</option>
                        <option value="TCS Courier">TCS Courier Services</option>
                        <option value="Registered Post">Registered Post A/D (Pakistan Post)</option>
                        <option value="Leopard Courier">Leopard Courier Services</option>
                        <option value="M&P Express">M&amp;P Express Logistics</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Consignment / Tracking Number:</label>
                      <Input
                        value={dispatchTrackingNo}
                        onChange={(e) => setDispatchTrackingNo(e.target.value)}
                        placeholder="e.g. TCS-789012345 or POD-1122"
                        className="h-9 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Acknowledgement Instructions Note:</label>
                    <textarea
                      rows={2}
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full p-2.5 text-xs rounded border border-slate-300 font-sans"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- CASE D: NO FOLIO FOUND LETTER COMMENTS --- */}
          {letterStage === "no_folio" && (
            <div className="border border-amber-200 rounded-xl overflow-hidden shadow-xs bg-amber-50/20 p-4 space-y-2">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Additional Comments / Advice for No Folio Response (Optional):
              </label>
              <textarea
                rows={3}
                value={noFolioComments}
                onChange={(e) => setNoFolioComments(e.target.value)}
                placeholder="e.g. We have also searched computerized records against CNIC 42101-xxxxxxx-x and old manual registers, however no active holding was traced..."
                className="w-full p-2.5 text-xs rounded border border-slate-300 font-sans bg-white"
              />
            </div>
          )}

          {/* --- CASE E: DELIVERY OF CHEQUES ACCORDION --- */}
          {letterStage === "delivery_cheques" && (
            <div className="border border-teal-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
              <div className="p-4 bg-gradient-to-r from-teal-50/70 via-white to-slate-50 border-b border-teal-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-700" />
                    3. Dividend Cheques Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Enter Beneficiary name, Banker's cheque / Instrument #, and Amount for each legal heir
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const nextId = (cheques.length + 1).toString();
                    setCheques(prev => [
                      ...prev,
                      { id: nextId, beneficiary: legalHeir || `Beneficiary ${nextId}`, instrumentNo: "1351947" + nextId, amount: "2,000.00/-" }
                    ]);
                  }}
                  className="h-7 text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Cheque
                </Button>
              </div>

              <div className="p-4 space-y-2 bg-white">
                {cheques.map((chk, idx) => (
                  <div key={chk.id || idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 items-center text-xs">
                    <div className="col-span-1 text-center font-bold text-slate-500">
                      #{idx + 1}
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="Beneficiary Name"
                        value={chk.beneficiary}
                        onChange={(e) => {
                          const copy = [...cheques];
                          copy[idx].beneficiary = e.target.value;
                          setCheques(copy);
                        }}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Instrument #"
                        value={chk.instrumentNo}
                        onChange={(e) => {
                          const copy = [...cheques];
                          copy[idx].instrumentNo = e.target.value;
                          setCheques(copy);
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Amount (PKR)"
                        value={chk.amount}
                        onChange={(e) => {
                          const copy = [...cheques];
                          copy[idx].amount = e.target.value;
                          setCheques(copy);
                        }}
                        className="h-8 text-xs font-bold text-teal-800"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {cheques.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCheques(prev => prev.filter((_, i) => i !== idx))}
                          className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* ACCORDION 4: CUSTOM OBSERVATION & PLACEMENT (Only active on First Letter / General) */}
          {letterStage === "first" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
              <button
                type="button"
                onClick={() => toggleAccordion("observations")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 hover:bg-blue-50/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-700">
                    <MessageSquarePlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      4. Custom Observation &amp; Flexible Placement
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Add any custom observation line and choose its position (Top / Middle / Bottom)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <input 
                      type="checkbox"
                      id="incObs"
                      checked={includeScrutinyNote}
                      onChange={(e) => {
                        e.stopPropagation();
                        setIncludeScrutinyNote(e.target.checked);
                      }}
                      className="h-4 w-4 rounded text-[#0B2B5E]"
                    />
                    <label htmlFor="incObs" className="cursor-pointer text-slate-700">Enable</label>
                  </div>
                  {openAccordion.observations ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {openAccordion.observations && includeScrutinyNote && (
                <div className="p-4 pt-3 border-t border-slate-100 space-y-3 bg-white text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Placement in Letter:
                    </label>
                    <select
                      value={scrutinyPosition}
                      onChange={(e: any) => setScrutinyPosition(e.target.value)}
                      className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E]"
                    >
                      <option value="top">1. Top / Introductory (Above acknowledgment paragraph)</option>
                      <option value="middle">2. Middle (Between acknowledgment and required checklist)</option>
                      <option value="bottom">3. Bottom / Closing (Below required checklist)</option>
                      <option value="at_end">4. Very End of Letter (Before Signatures)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Observation Text:
                    </label>
                    <textarea 
                      rows={3}
                      value={scrutinyRemark}
                      onChange={(e) => setScrutinyRemark(e.target.value)}
                      placeholder="Type custom officer note or observation (e.g. Loss of share certificates reported; duplicate formalities required)..."
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
                        Company Advice
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
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Flexible Live Letter Preview */}
        {previewLayout !== "hidden" && (
          <div className={`sticky top-4 transition-all duration-300 ${previewLayout === "wide" ? "lg:col-span-7" : "lg:col-span-5"}`}>
            <Card className="border-slate-300 shadow-md bg-white">
              <CardHeader className="p-3.5 border-b bg-slate-50 rounded-t-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileSignature className="h-3.5 w-3.5 text-[#F37021]" />
                      Live Letter Preview ({
                        letterStage === 'first' ? '1st Letter' :
                        letterStage === 'no_folio' ? 'No Folio Found' :
                        letterStage === 'physical_approval' ? 'Approval Covering' :
                        'Delivery of Shares'
                      })
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Standard transmission draft reflecting exact statutory requirements
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Zoom in/out */}
                    <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(prev => Math.max(80, prev - 10))}
                        title="Zoom out"
                        className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </button>
                      <span className="text-[10px] font-mono font-semibold px-1 text-slate-700 min-w-[32px] text-center">
                        {previewZoom}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(prev => Math.min(140, prev + 10))}
                        title="Zoom in"
                        className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Width Toggle: Normal vs Wide */}
                    <button
                      type="button"
                      onClick={() => setPreviewLayout(prev => prev === "wide" ? "normal" : "wide")}
                      title={previewLayout === "wide" ? "Default width" : "Enlarge preview"}
                      className={`p-1.5 text-xs font-semibold rounded border flex items-center gap-1 transition-all ${
                        previewLayout === "wide"
                          ? "bg-[#0B2B5E] text-white border-[#0B2B5E]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {previewLayout === "wide" ? (
                        <>
                          <Minimize2 className="h-3 w-3" />
                          <span className="text-[10px] hidden sm:inline">Normal</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3 w-3" />
                          <span className="text-[10px] hidden sm:inline">Enlarge</span>
                        </>
                      )}
                    </button>

                    {/* Hide Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewLayout("hidden")}
                      title="Hide preview for full-width editor"
                      className="p-1.5 text-xs font-semibold rounded border bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-1"
                    >
                      <EyeOff className="h-3 w-3" />
                      <span className="text-[10px] hidden sm:inline">Hide</span>
                    </button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyText} 
                      className="h-7 text-xs px-2 text-slate-700"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span className="text-[10px] ml-1">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleGenerateWord}
                      disabled={downloading}
                      className="h-7 text-xs px-2 bg-[#F37021] hover:bg-[#D85B10] text-white font-bold shadow-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      <span className="text-[10px]">Word</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 font-serif text-[12px] leading-relaxed text-slate-800 space-y-3.5 max-h-[750px] overflow-y-auto select-text bg-[#fcfcfc]" style={{ fontSize: `${(12 * previewZoom) / 100}px` }}>

              {/* Header Info */}
              <div className="flex justify-between items-start font-sans font-bold text-xs pb-1 border-b">
                <span className="text-[#0B2B5E]">{refNo}</span>
                <span className="text-slate-600">{date}</span>
              </div>

              {/* Addressee Info */}
              {letterStage === "physical_approval" ? (
                <div className="font-sans space-y-0.5 text-xs">
                  <p className="font-bold text-slate-900">The Company Secretary</p>
                  <p className="text-slate-700 font-bold text-[#0B2B5E]">{company}</p>
                </div>
              ) : (
                <div className="font-sans space-y-0.5 text-xs">
                  <p className="font-bold text-slate-900">{legalHeir} {cleanHeirNameOnly ? '' : (relation ? `(${relation})` : '')}</p>
                  {!cleanHeirNameOnly && <p className="text-slate-600 font-medium">F/H: {deceased} (Late)</p>}
                  <p className="text-slate-700">{address}</p>
                  {contactNo && <p className="text-slate-600 text-[11px]">Contact: {contactNo}</p>}
                </div>
              )}

              <div className="font-sans text-xs pt-1">
                <p className="font-semibold text-slate-700">
                  {letterStage === "physical_approval" ? "Dear Sir / Madam," : "Dear Concern,"}
                </p>
              </div>

              {/* Subject */}
              <div className="font-sans text-xs space-y-0.5 border-l-2 border-l-[#F37021] pl-2.5 py-0.5 bg-orange-50/40">
                <p className="font-bold text-[#0B2B5E]">{company}</p>
                <p className="font-bold text-slate-900 underline">
                  {letterStage === "first" && `Transmission of Shares and Dividends – Late ${deceased} – Folio # ${mode === "single" ? folio : multiFolios.map(m => m.folio).filter(Boolean).join(", ")}`}
                  {letterStage === "no_folio" && `Transmission of Shares & Verification of Title – Late ${deceased} – Folio # ${folio}`}
                  {letterStage === "physical_approval" && `Transmission of Shares & Dividends – Late ${deceased} – Folio # ${folio}`}
                  {letterStage === "delivery_shares" && `Transmission of Shares & Dividends – Late ${deceased} – Folio # ${folio}`}
                  {letterStage === "delivery_cheques" && `Transmission of Dividends – Late ${deceased} – Folio # ${folio}`}
                </p>
              </div>

              {/* TEMPLATE 1: FIRST LETTER PREVIEW */}
              {letterStage === "first" && (
                <>
                  {scrutinyPosition === "top" && includeScrutinyNote && scrutinyRemark.trim() && (
                    <p className="my-2 p-2 rounded bg-blue-50/70 border border-blue-200 text-[#0B2B5E] font-sans">
                      {scrutinyRemark}
                    </p>
                  )}

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

                  {scrutinyPosition === "middle" && includeScrutinyNote && scrutinyRemark.trim() && (
                    <p className="my-2 p-2 rounded bg-blue-50/70 border border-blue-200 text-[#0B2B5E] font-sans">
                      {scrutinyRemark}
                    </p>
                  )}

                  <p className="font-semibold text-slate-900">
                    In order to enable us to process the transmission of the shares and dividends of deceased shareholder in favor of legal heir(s), following documents are required:
                  </p>

                  {/* Numbered Required Docs */}
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

                  {scrutinyPosition === "bottom" && includeScrutinyNote && scrutinyRemark.trim() && (
                    <p className="my-2 p-2 rounded bg-blue-50/70 border border-blue-200 text-[#0B2B5E] font-sans">
                      {scrutinyRemark}
                    </p>
                  )}

                  <p className="text-[11px] text-slate-600 pt-1">
                    Please ensure that details such as company name, folio number and number of shares are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.
                  </p>
                </>
              )}

              {/* TEMPLATE 2: NO FOLIO FOUND PREVIEW */}
              {letterStage === "no_folio" && (
                <>
                  <p>
                    We refer to your query / communication regarding transmission of shares of the subject deceased shareholder.
                  </p>

                  <p>
                    Please be advised that upon thorough scrutiny and search of the share register / computerized records of <strong>{company}</strong>, no shareholding or folio exists in the name of the deceased shareholder under the provided folio / particulars (<strong>{folio}</strong>).
                  </p>

                  {noFolioComments && (
                    <p className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-950 font-sans">
                      {noFolioComments}
                    </p>
                  )}

                  <p className="font-semibold text-slate-900">
                    In order to enable us to investigate further, please furnish:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                    <li>Legible copies of original share certificates / counterfoils (if available).</li>
                    <li>Dividend counterfoils / warrants previously issued by the Company.</li>
                    <li>Complete CNIC of the deceased shareholder along with previous aliases / residential addresses.</li>
                  </ol>
                </>
              )}

              {/* TEMPLATE 3: PHYSICAL APPROVAL COVERING PREVIEW (Exact match: Late Allah Bakhsh) */}
              {letterStage === "physical_approval" && (
                <>
                  <p>
                    We refer to the transmission case in respect of the above deceased shareholder. In this regard we are pleased to enclose herewith <strong>{certificates}</strong> share certificates for <strong>{shares}</strong> shares along with their relevant Loss & Transfer registers and other supporting documents being forwarded to you for approval of transfers thereon by the Directors / Authorized Signatories.
                  </p>

                  <p className="font-bold text-slate-900 pt-1">
                    The details of transfers being sent to you are given below:
                  </p>

                  <div className="font-sans text-[11px] space-y-1 p-2 rounded bg-slate-50 border border-slate-200">
                    <p><strong>No. of transfer receipt(s) :</strong> {String(transferReceipts.length).padStart(2, '0')}</p>
                    {transferReceipts.map((tr, i) => (
                      <p key={i}><strong>Transfer receipt(s) # :</strong> {tr.receiptNo} (in the name of {tr.name})</p>
                    ))}
                    <p><strong>Transfer register no. of page(s) :</strong> {transferRegisterPages}</p>
                    {hasLossRegister && (
                      <>
                        <p><strong>Loss receipt(s) # :</strong> {lossReceiptNo || '295'}</p>
                        <p><strong>Loss register no. of page(s) :</strong> {lossRegisterPages}</p>
                      </>
                    )}
                  </div>

                  <p className="font-bold text-slate-900 pt-1">
                    Following actions are requested for approval of above transmission of shares:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700">
                    <li>Authorized Signatory's signatures on the face of duplicate shares certificates (if applicable).</li>
                    <li>Authorized Signatory's signatures on the Memorandum of Transfers (on the back of each share certificate).</li>
                    <li>Authorized Signatory's signature on Loss & Transfer register.</li>
                  </ul>

                  <p className="pt-1">
                    After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case.
                  </p>
                  <p>
                    Further, please arrange to check whether any other dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid, if so, then please arrange to issue cheque(s) / online payment in favor of above legal heirs as per their entitlement.
                  </p>
                </>
              )}

              {/* TEMPLATE 4: DELIVERY OF SHARES PREVIEW (Exact match: Late Muhammad Boota Bhatti) */}
              {letterStage === "delivery_shares" && (
                <>
                  <p>
                    We are pleased to forward herewith <strong>{certificates}</strong> shares certificates for <strong>{shares}</strong> shares of above deceased shareholder of {company} duly transmitted / transferred in the name following legal heirs, details are as follows:
                  </p>

                  <div className="border rounded overflow-hidden font-sans text-[11px] my-2">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                        <tr>
                          <th className="p-1.5">Folio #</th>
                          <th className="p-1.5">Name of Legal Heirs</th>
                          <th className="p-1.5 text-right"># of Shares</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferees.map((t, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="p-1.5 font-bold text-slate-700">{t.folio}</td>
                            <td className="p-1.5 font-bold text-slate-900">{t.name}</td>
                            <td className="p-1.5 font-bold text-emerald-800 text-right">{t.shares}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t">
                          <td className="p-1.5">Total</td>
                          <td className="p-1.5"></td>
                          <td className="p-1.5 text-right text-emerald-900">{shares}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>Kindly acknowledge the receipt.</p>
                  <p>Legal heirs are requested to always quote their above-mentioned folio numbers in correspondence with us.</p>
                </>
              )}

              {/* TEMPLATE 5: DELIVERY OF CHEQUES PREVIEW (Exact match: Folio 23927_ Delivery of Cheques) */}
              {letterStage === "delivery_cheques" && (
                <>
                  <p>
                    We are pleased to forward herewith <strong>={cheques.length}=</strong> Banker's cheques against unpaid dividend warrants of above deceased shareholder of {company} duly issued in the name of following legal heirs, details are as follows:
                  </p>

                  <div className="border rounded overflow-hidden font-sans text-[11px] my-2">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                        <tr>
                          <th className="p-1.5">Beneficiary</th>
                          <th className="p-1.5">Instrument #</th>
                          <th className="p-1.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cheques.map((c, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="p-1.5 font-bold text-slate-900">{c.beneficiary}</td>
                            <td className="p-1.5 font-mono text-slate-700">{c.instrumentNo}</td>
                            <td className="p-1.5 font-bold text-teal-800 text-right">{c.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p>Please note that there is no outstanding dividend remaining in the name of deceased shareholder.</p>
                  <p>Kindly acknowledge the receipt.</p>
                </>
              )}

              {/* Signatures */}
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
        )}
      </div>


      {/* Add New Company Modal */}
      <Dialog open={showAddCompanyModal} onOpenChange={setShowAddCompanyModal}>
        <DialogContent className="max-w-md border-t-4 border-t-[#F37021]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#F37021]" />
              Add New Client Company
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the full official name of the company. It will be immediately selectable and saved in your active list.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company Full Legal Name:</label>
              <Input
                value={newCompanyInput}
                onChange={(e) => setNewCompanyInput(e.target.value)}
                placeholder="e.g. Ferozsons Laboratories Limited"
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddCompanyModal(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const name = newCompanyInput.trim();
                if (name) {
                  setAllCompanies(prev => [name, ...prev]);
                  setCompany(name);
                  const sym = name.split(' ')[0].toUpperCase();
                  setCompSymbol(sym);
                  setRefNo(`CDCSR/LTC/${sym}/${folio || '0000'}/26`);
                  setNewCompanyInput("");
                  setShowAddCompanyModal(false);
                }
              }}
              disabled={!newCompanyInput.trim()}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white text-xs font-bold h-8 px-4"
            >
              Add &amp; Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
