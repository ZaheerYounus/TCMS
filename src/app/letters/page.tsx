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
  Truck,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Maximize2,
  Camera,
  SwitchCamera,
  RefreshCw
} from "lucide-react";
import companiesList from "@/data/companiesList.json";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  calculateDocumentGap, 
  CANONICAL_TRANSMISSION_DOCS, 
  DocumentGapAnalysis, 
  TransmissionDocRequirement 
} from "@/lib/gapAnalyzer";
import { parseLetterText, ParsedLetterResult } from "@/lib/letterParser";
import { runBrowserOCR } from "@/lib/clientOcr";
import { SharesDeliveryLetter } from "@/components/letters/SharesDeliveryLetter";
import { ChequesDeliveryLetter } from "@/components/letters/ChequesDeliveryLetter";
import { CdsAccountLetter } from "@/components/letters/CdsAccountLetter";
import { PhysicalApprovalLetter } from "@/components/letters/PhysicalApprovalLetter";
import { NoFolioFoundLetter } from "@/components/letters/NoFolioFoundLetter";

interface MultiFolioItem {
  folio: string;
  company: string;
  shares: string;
  certificates: string;
  scripts?: string;
}

interface ScrutinyDocItem {
  name: string;
  status: "valid" | "deficient" | "missing";
  objection: string;
}

export function MainLetterGenerator({ initialMode = "single" }: { initialMode?: "single" | "multi" } = {}) {
  const searchParams = useSearchParams();
  const letterStage = "first";
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    quickUpload: true,
    basicDetails: true,
    documentsReceived: true,
    documentsRequired: true,
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
  const [mode, setMode] = useState<"single" | "multi">(initialMode);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  const [copied, setCopied] = useState(false);
  const [syncToMis, setSyncToMis] = useState(true);
  const [searchingFolio, setSearchingFolio] = useState(false);
  const [includeStandardCertLine, setIncludeStandardCertLine] = useState(false); // Requirement 13
  const [cleanHeirNameOnly, setCleanHeirNameOnly] = useState(true); // Requirement 9
  const [stampDutyProvince, setStampDutyProvince] = useState<"Sindh" | "Punjab" | "Federal Capital" | "KPK" | "Balochistan">("Sindh"); // Requirement 12
  const [includeStampDutyTable, setIncludeStampDutyTable] = useState(false); // Requirement 18
  const [cdsAccountNo, setCdsAccountNo] = useState("03277-6959");
  const [noFolioComments, setNoFolioComments] = useState("");
  const [previewLayout, setPreviewLayout] = useState<"normal" | "wide" | "hidden">("wide");
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // File Upload & Smart Parsing State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [extractedDataSummary, setExtractedDataSummary] = useState<{
    folio?: string;
    company?: string;
    deceased?: string;
    legalHeir?: string;
    contactNo?: string;
    address?: string;
  } | null>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Live Scanner State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null);



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
  const [refNo, setRefNo] = useState(() => {
    return initialMode === "multi" ? "CDCSR/LTC/VAR/1207/26" : "CDCSR/LTC/OGDC/1207/26";
  });
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

  // Multi Folio Rows (No scripts column needed)
  const [multiFolios, setMultiFolios] = useState<MultiFolioItem[]>([
    { folio: "283", company: "Khyber Tobacco Company Limited", shares: "3", certificates: "02" },
    { folio: "8053", company: "K-Electric Limited", shares: "113", certificates: "01" },
    { folio: "14452", company: "PAK Suzuki Motor Company Limited", shares: "39", certificates: "04" },
    { folio: "I0151", company: "Pakistan International Airlines Corporation Limited", shares: "100", certificates: "01" },
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
    "Notarized Copy of Succession Certificate Issued by NADRA or Court attested copy of Succession Certificate along with it's petition and Court Order",
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
    const qMode = searchParams.get("mode");
    if (qMode === "multi") setMode("multi");
    else if (qMode === "single") setMode("single");

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

  // Smart File Upload Handler with real-time percentage progress and human-like auto-reflection
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingFile(true);
    setUploadProgressPercent(15);
    setUploadProgressText("Reading file and preparing analysis...");
    setUploadSuccessMsg("");
    setExtractedDataSummary(null);

    const applyParsedData = (p: ParsedLetterResult) => {
      if (initialMode === "single") {
        setMode("single");
      } else if (initialMode === "multi") {
        setMode("multi");
        if (p.multiFolios && p.multiFolios.length > 0) {
          setMultiFolios(p.multiFolios);
        }
      } else if (p.mode === "multi" && p.multiFolios && p.multiFolios.length > 1) {
        setMode("multi");
        setMultiFolios(p.multiFolios);
      } else {
        setMode("single");
      }

      setFolio(p.folio || "");
      setCompany(p.company || "");
      if (p.compSymbol) setCompSymbol(p.compSymbol);
      setDeceased(p.deceased || "");
      setLegalHeir(p.legalHeir || "");
      setRelation(p.relation || "Legal Heir");
      setAddress(p.address || ""); // If no address in document, reset to empty so user sees it is blank
      setContactNo(p.contactNo || "");
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


      setExtractedDataSummary({
        folio: p.folio || "",
        company: p.company || p.compSymbol || "",
        deceased: p.deceased || "",
        legalHeir: p.legalHeir || "",
        contactNo: p.contactNo || "",
        address: p.address || ""
      });

      setUploadSuccessMsg("Letter analyzed! 100% Completed — all data reflected into letter.");
    };

    try {
      const isImg = file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i);
      let parsedResult: any = null;

      // Priority 1: Multimodal AI Vision & Server Analysis (Human-like reasoning)
      setUploadProgressPercent(35);
      setUploadProgressText("Analyzing document with Multimodal Gemini AI Vision (Human-like reasoning)...");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/parse-letter", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.parsed) {
            parsedResult = data.parsed;
          }
        }
      } catch (serverErr) {
        console.warn("Server parse request failed, attempting browser fallback:", serverErr);
      }

      // Priority 2: In-browser OCR fallback for standard printed images if server is unreachable
      if (!parsedResult && isImg) {
        setUploadProgressPercent(50);
        setUploadProgressText("Running high-accuracy OCR fallback on letter image...");
        try {
          const ocrText = await runBrowserOCR(file, (pct, status) => {
            const mappedPct = Math.min(85, Math.max(50, pct));
            setUploadProgressPercent(mappedPct);
            setUploadProgressText(status);
          });

          if (ocrText && ocrText.trim().length > 20) {
            setUploadProgressPercent(90);
            setUploadProgressText("Extracting Folio, Deceased, Heir & Company details (90%)...");
            parsedResult = parseLetterText(ocrText);
          }
        } catch (ocrErr) {
          console.warn("Client OCR bypassed:", ocrErr);
        }
      }

      if (parsedResult) {
        setUploadProgressPercent(100);
        setUploadProgressText("100% Complete! Auto-reflecting all details into letter...");
        applyParsedData(parsedResult);
      } else {
        throw new Error("Could not extract text from document");
      }

    } catch (err: any) {
      console.error("Upload parse error:", err);
      alert(err.message || "Failed to analyze document. You can also paste letter text directly.");
    } finally {
      setTimeout(() => {
        setUploadingFile(false);
      }, 700);
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

  // Camera Live Scanning Functions
  const startCamera = async (facing: "environment" | "user" = cameraFacingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play error:", e));
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let msg = "Could not access camera. Please ensure permissions are granted in browser settings.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera permissions in your browser address bar.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera hardware detected on this device.";
      }
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCaptureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setCapturingPhoto(true);
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: "image/jpeg" });
          stopCamera();
          setCameraModalOpen(false);
          setCapturingPhoto(false);
          handleFileUpload(file);
        } else {
          setCapturingPhoto(false);
        }
      }, "image/jpeg", 0.95);
    } else {
      setCapturingPhoto(false);
    }
  };

  // Attach camera stream whenever modal opens and video element is mounted
  useEffect(() => {
    if (cameraModalOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn("Video play error:", e));
    }
  }, [cameraModalOpen, cameraStream]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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
    setMultiFolios(prev => [...prev, { folio: "", company: "", shares: "", certificates: "" }]);
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

    const bodyText = `${refNo}              ${date}

${legalHeir}
${cleanHeirNameOnly ? '' : `F/H: ${deceased} (Late)\n`}${address}
${contactNo ? 'Contact: ' + contactNo : ''}

Dear Concern,

${mode === "single" ? `${company}\nTransmission of Shares and Dividends – Late ${deceased} – Folio # ${folio}` : `Transmission of Shares & Dividends – Late ${deceased}`}

${scrutinyPosition === 'top' && plainRemark ? plainRemark + '\n' : ''}We refer to your letter regarding the captioned subject and acknowledge the receipt of:
${receivedDocs.map(d => '- ' + d).join('\n')}

${mode === "multi" 
  ? `Kindly note that following shares are registered in the name of subject deceased shareholder (details of shares attached):\n` + multiFolios.map((m, idx) => `   ${idx + 1}. Folio #${m.folio} | ${m.company} | Certs: ${m.certificates} | Shares: ${m.shares}`).join('\n')
  : `Kindly note that as per company's record total, ${certificates} share certificate for ${shares} shares under folio of ${company} is registered in name of deceased shareholder (details of shares attached).`
}${includeStandardCertLine ? '\n\nShare certificates shall be sent upon our further instructions.' : ''}${hasLostShares ? '\n\n' + duplicateIntro + '\n' + duplicateDocs.map((d, i) => '• ' + d).join('\n') : ''}
${scrutinyPosition === 'middle' && plainRemark ? plainRemark + '\n' : ''}
In order to enable us to process transmission of shares and dividends in favor of legal heir(s), following documents are required:
${requiredDocs.map((d, i) => `${i + 1}. ${d}`).join('\n')}
${scrutinyPosition === 'bottom' && plainRemark ? plainRemark + '\n' : ''}
Please ensure details are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.

Regards,

Authorized Signatory         Authorized Signatory
Encl.:  As stated above.`;

    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto pb-12">
      {/* Restore Banner if Preview is Hidden */}
      {previewLayout === "hidden" && (
        <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 px-4 shadow-xs no-print">
          <span className="text-xs font-medium text-emerald-800">
            A4 Letter Preview is hidden for full-width editing.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => setPreviewLayout("wide")}
            className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            Show A4 Live Preview
          </Button>
        </div>
      )}

      {/* 2-Column Working Layout: Left Form Inputs | Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Configuration Form with Clean Accordion Style */}
        <div className={`space-y-4 no-print transition-all duration-300 ${previewLayout === "hidden" ? "lg:col-span-12" : previewLayout === "wide" ? "lg:col-span-5" : "lg:col-span-7"}`}>

          {/* ACCORDION 1: SMART UPLOAD & AUTO-EXTRACTION (Optional for convenience) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleAccordion("quickUpload")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-100 text-[#F37021]">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Upload Incoming Request Letter
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Drop letter or scan (PDF, Image, Word) to auto-fill particulars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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

                {/* Native Device Camera Capture Input (Fallback & Mobile Support) */}
                <input 
                  type="file" 
                  ref={cameraCaptureInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      stopCamera();
                      setCameraModalOpen(false);
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden" 
                />

                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-all text-center">
                  <div 
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 mb-2 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="h-5 w-5 text-[#F37021]" />
                  </div>
                  <h4 
                    className="text-xs font-bold text-slate-800 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Drop incoming request letter or scan here
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-3">Supports Live Camera Snapshot, PDF, Word (.docx/.doc), Scanned Photos/Images (JPG, PNG)</p>
                  
                  {/* Real-time Percentage Progress Bar */}
                  {uploadingFile && (
                    <div className="mb-3 max-w-md mx-auto p-3 bg-white rounded-lg border border-orange-200 shadow-xs space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#0B2B5E] flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                          {uploadProgressText || "Analyzing letter..."}
                        </span>
                        <span className="text-[#F37021] font-mono text-xs">{uploadProgressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-500 via-amber-500 to-[#0B2B5E] h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.max(5, uploadProgressPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setCameraModalOpen(true);
                        startCamera("environment");
                      }}
                      disabled={uploadingFile}
                      className="h-8 bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs px-3.5 shadow-2xs flex items-center gap-1.5"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Live Camera Scan
                    </Button>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="h-8 bg-[#0B2B5E] hover:bg-[#103a7a] text-white font-bold text-xs px-3.5 shadow-2xs flex items-center gap-1.5"
                    >
                      <UploadCloud className="h-3.5 w-3.5 text-orange-400" />
                      {uploadingFile ? `Analyzing (${uploadProgressPercent}%)...` : "Select Letter / Scan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasteModalOpen(true)}
                      disabled={uploadingFile}
                      className="h-8 border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 shadow-2xs"
                    >
                      <ClipboardPaste className="mr-1.5 h-3.5 w-3.5 text-[#F37021]" />
                      Paste Text
                    </Button>
                  </div>
                </div>

                {/* 100% Completed Auto-Reflection Summary Card (The 6 Main Required Items) */}
                {extractedDataSummary && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-300 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">✓</span>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">
                            100% Completed! Data Auto-Reflected into Letter
                          </h4>
                          <span className="text-[10px] text-emerald-700">
                            All document data has been automatically reflected into the letter.
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                        100% Ready
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Folio Number</span>
                        <span className="font-bold font-mono text-[#0B2B5E] text-xs">
                          {extractedDataSummary.folio || "N/A"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">2. Company Name</span>
                        <span className="font-bold text-slate-800 text-xs line-clamp-1">
                          {extractedDataSummary.company || "N/A"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Deceased Name</span>
                        <span className="font-bold text-rose-700 text-xs line-clamp-1">
                          {extractedDataSummary.deceased || "N/A"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">4. Legal Heir Name</span>
                        <span className="font-bold text-emerald-800 text-xs line-clamp-1">
                          {extractedDataSummary.legalHeir || "N/A"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">5. Mobile / Contact</span>
                        <span className="font-bold font-mono text-slate-800 text-xs">
                          {extractedDataSummary.contactNo || "N/A"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">6. Address</span>
                        <span className="font-medium text-slate-700 text-[11px] line-clamp-1">
                          {extractedDataSummary.address || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {uploadSuccessMsg && !extractedDataSummary && (
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
                  {mode === "single" ? (company ? (company.length > 25 ? company.slice(0, 25) + '...' : company) : 'Select Company') : `${multiFolios.length} Folios Registered`}
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
                {/* Reference Number and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reference Number <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      value={refNo} 
                      onChange={(e) => setRefNo(e.target.value)} 
                      placeholder="e.g. CDCSR/LTC/OGDC/1207/26" 
                      className="text-xs h-9 font-mono font-bold text-[#0B2B5E]" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Letter Date <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      placeholder="DD/MM/YYYY" 
                      className="text-xs h-9 font-medium" 
                    />
                  </div>
                </div>

                {/* Company Name (for Single Folio) or Deceased Name (for Multiple Folios) */}
                {mode === "single" ? (
                  <>
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

                    {/* Single Folio Particulars */}
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
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Deceased Shareholder Name <span className="text-rose-500">*</span>
                      </label>
                      <Input 
                        value={deceased} 
                        onChange={(e) => setDeceased(e.target.value)}
                        placeholder="e.g. Saiyed Ali Imam Jafri" 
                        className="text-xs h-9 font-medium"
                      />
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Multiple Folios Breakdown</p>
                          <p className="text-[11px] text-slate-500">Each folio with respective company, share count &amp; cert count.</p>
                        </div>
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
                            <div className="w-24">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Folio #</span>
                              <Input 
                                placeholder="Folio #" 
                                value={row.folio} 
                                onChange={(e) => updateMultiFolioRow(idx, "folio", e.target.value)}
                                className="h-8 text-xs font-bold"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Company Name</span>
                              <Input 
                                placeholder="Company Name" 
                                value={row.company} 
                                onChange={(e) => updateMultiFolioRow(idx, "company", e.target.value)}
                                className="h-8 text-xs font-medium"
                              />
                            </div>
                            <div className="w-24">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Shares</span>
                              <Input 
                                placeholder="Shares" 
                                value={row.shares} 
                                onChange={(e) => updateMultiFolioRow(idx, "shares", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="w-20">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Certs</span>
                              <Input 
                                placeholder="Certs" 
                                value={row.certificates} 
                                onChange={(e) => updateMultiFolioRow(idx, "certificates", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            {multiFolios.length > 1 && (
                              <div className="pt-3">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeMultiFolioRow(idx)}
                                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                  title="Remove row"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
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

          {/* ACCORDIONS: DOCUMENTS RECEIVED, DOCUMENTS REQUIRED & OBSERVATIONS */}
              {/* ACCORDION 3A: DOCUMENTS RECEIVED (View/Hide Separately) */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
                <button
                  type="button"
                  onClick={() => toggleAccordion("documentsReceived")}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 hover:bg-emerald-50/90 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          3A. Documents Received
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          {receivedDocs.length} of {receivedDocOptions.length} Acknowledged
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Select documents received from legal heir(s) to acknowledge in the opening paragraph of letter
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
                      {openAccordion.documentsReceived ? "Collapse" : "Expand"}
                    </span>
                    {openAccordion.documentsReceived ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {openAccordion.documentsReceived && (
                  <div className="p-4 pt-3 border-t border-emerald-100 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Documents Received from Heir / Applicant
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReceivedDocs([...receivedDocOptions])}
                          className="text-[11px] text-emerald-700 hover:underline font-semibold"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setReceivedDocs([])}
                          className="text-[11px] text-slate-500 hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {receivedDocOptions.map((doc, i) => {
                        const isChecked = receivedDocs.includes(doc);
                        return (
                          <div 
                            key={i} 
                            onClick={() => toggleReceivedDoc(doc)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-emerald-50/90 border-emerald-400 font-medium text-emerald-950 shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0" 
                            />
                            <span className="leading-snug text-[11px]">{doc}</span>
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
                        className="text-xs h-8.5"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={addCustomReceivedDoc}
                        className="h-8.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 font-bold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Received Doc
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 3B: DOCUMENTS REQUIRED (View/Hide Separately) */}
              <div className="border border-blue-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all">
                <button
                  type="button"
                  onClick={() => toggleAccordion("documentsRequired")}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/70 via-white to-slate-50 hover:bg-blue-50/90 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#0B2B5E]/10 text-[#0B2B5E]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          3B. Documents Required
                        </h3>
                        <Badge className="bg-blue-100 text-[#0B2B5E] text-[10px] font-semibold">
                          {requiredDocs.length} Requirements Demanded
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Statutory documents required from legal heirs to complete transmission
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[#0B2B5E] font-medium hidden sm:inline">
                      {openAccordion.documentsRequired ? "Collapse" : "Expand"}
                    </span>
                    {openAccordion.documentsRequired ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {openAccordion.documentsRequired && (
                  <div className="p-4 pt-3 border-t border-blue-100 space-y-4 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2B5E] flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#F37021]" />
                        Requisite Documents Checklist
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRequiredDocs([...requiredDocOptions])}
                          className="text-[11px] text-[#0B2B5E] hover:underline font-semibold"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setRequiredDocs([])}
                          className="text-[11px] text-slate-500 hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {requiredDocOptions.map((doc, i) => {
                        const isChecked = requiredDocs.includes(doc);
                        const isSuccession = doc.includes("Succession Certificate");
                        return (
                          <div 
                            key={i} 
                            onClick={() => toggleRequiredDoc(doc)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isChecked 
                                ? isSuccession 
                                  ? 'bg-amber-50/90 border-amber-400 font-bold text-amber-950 shadow-xs' 
                                  : 'bg-blue-50/90 border-blue-400 font-medium text-[#0B2B5E] shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2B5E] focus:ring-[#0B2B5E] shrink-0" 
                            />
                            <div className="leading-snug flex-1 text-[11px]">
                              {isSuccession ? (
                                <div className="flex items-center gap-1.5">
                                  <Scale className="h-3.5 w-3.5 text-[#F37021] shrink-0" />
                                  <span className="text-[#0B2B5E] font-bold">{doc}</span>
                                </div>
                              ) : (
                                <span>{doc}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                      <Input 
                        placeholder="Add custom required document (e.g. Attested copy of Nikahnama)..." 
                        value={customRequiredInput}
                        onChange={(e) => setCustomRequiredInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomRequiredDoc()}
                        className="text-xs h-8.5"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={addCustomRequiredDoc}
                        className="h-8.5 text-xs bg-[#0B2B5E] hover:bg-[#103a7a] text-white shrink-0 font-bold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Requirement
                      </Button>
                    </div>
                  </div>
                )}
              </div>

          {/* ACCORDION 4: CUSTOM OBSERVATION & PLACEMENT */}
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
                      1st Intimation Letter Preview (A4)
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
                      onClick={() => window.print()}
                      className="h-7 text-xs px-2 text-slate-700"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      <span className="text-[10px]">Print</span>
                    </Button>
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
                      className="h-7 text-xs px-2.5 bg-[#F37021] hover:bg-[#D85B10] text-white font-bold shadow-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      <span className="text-[10px]">{downloading ? "Exporting..." : "Download Word (.docx)"}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 font-serif text-[12px] leading-relaxed text-slate-800 space-y-3.5 max-h-[750px] overflow-y-auto select-text bg-[#fcfcfc]" style={{ fontSize: `${(12 * previewZoom) / 100}px` }}>

              {/* Header Info */}
              <div className="font-sans text-xs pb-1 border-b space-y-0.5">
                <div className="font-bold text-[#0B2B5E]">{refNo}</div>
                <div className="text-slate-600 font-medium">{date}</div>
              </div>

              {/* Addressee Info */}
              <div className="font-sans space-y-0.5 text-xs">
                <p className="font-bold text-slate-900">{legalHeir} {cleanHeirNameOnly ? '' : (relation ? `(${relation})` : '')}</p>
                {!cleanHeirNameOnly && <p className="text-slate-600 font-medium">F/H: {deceased} (Late)</p>}
                <p className="text-slate-700">{address}</p>
                {contactNo && <p className="text-slate-600 text-[11px]">Contact: {contactNo}</p>}
              </div>

              <div className="font-sans text-xs pt-1">
                <p className="font-semibold text-slate-700">Dear Concern,</p>
              </div>

              {/* Subject */}
              <div className="font-sans text-xs space-y-0.5 border-l-2 border-l-[#F37021] pl-2.5 py-0.5 bg-orange-50/40">
                {mode === "single" ? (
                  <>
                    <p className="font-bold text-[#0B2B5E]">{company}</p>
                    <p className="font-bold text-slate-900 underline">
                      Transmission of Shares and Dividends – Late {deceased} – Folio # {folio}
                    </p>
                  </>
                ) : (
                  <p className="font-bold text-slate-900 underline">
                    Transmission of Shares &amp; Dividends – Late {deceased}
                  </p>
                )}
              </div>


                  {scrutinyPosition === "top" && includeScrutinyNote && scrutinyRemark.trim() && (
                    <p className="my-2 p-2 rounded bg-blue-50/70 border border-blue-200 text-[#0B2B5E] font-sans">
                      {scrutinyRemark}
                    </p>
                  )}

                  <p>
                    We refer to your letter regarding the captioned subject and acknowledge the receipt of:{" "}
                    <strong>{receivedDocs.length > 0 ? receivedDocs.join(", ") : "documents submitted"}</strong>.
                  </p>

                  {mode === "multi" ? (
                    <p>
                      Kindly note that following shares are registered in the name of subject deceased shareholder (details of shares attached). In case if share certificate is lost, please intimate us accordingly:
                    </p>
                  ) : (
                    <p>
                      Kindly note that as per company's record total, <strong>{certificates}</strong> share certificate for{" "}
                      <strong>{shares}</strong> shares under folio of <strong>{company}</strong> is registered in the name of subject deceased shareholder (details of shares attached). In case if share certificate is lost, please intimate us accordingly.
                    </p>
                  )}

                  {/* Multi Folio Table in preview if active */}
                  {mode === "multi" && multiFolios.length > 0 && (
                    <div className="border rounded overflow-hidden font-sans text-[11px] my-2">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                          <tr>
                            <th className="p-1.5">S #</th>
                            <th className="p-1.5">Company</th>
                            <th className="p-1.5">Folio #</th>
                            <th className="p-1.5"># of Certs</th>
                            <th className="p-1.5"># of Shares</th>
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

      {/* Live Camera Scanner Dialog */}
      <Dialog 
        open={cameraModalOpen} 
        onOpenChange={(open) => {
          if (!open) stopCamera();
          setCameraModalOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-slate-950 border-slate-800 text-white">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#F37021]/20 text-[#F37021]">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Document Camera Scanner
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AI Multimodal Vision
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Hold letter flat and clear in front of camera
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 px-2.5 flex items-center gap-1"
                title="Switch between front and back cameras"
              >
                <SwitchCamera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Switch Camera</span>
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="p-6 text-center max-w-md space-y-3">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
                <p className="text-xs text-slate-400">{cameraError}</p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    type="button"
                    onClick={() => startCamera(cameraFacingMode)}
                    className="h-8 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Try Again
                  </Button>
                  <Button
                    type="button"
                    onClick={() => cameraCaptureInputRef.current?.click()}
                    className="h-8 bg-[#F37021] hover:bg-[#D85B10] text-white text-xs font-bold"
                  >
                    <Camera className="h-3.5 w-3.5 mr-1" />
                    Use Device Camera
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Visual Viewfinder Overlay for Document Alignment */}
                <div className="absolute inset-4 sm:inset-8 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-3 bg-black/10">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-md shadow-sm" />
                    <span className="bg-black/60 text-white text-[10px] font-medium px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
                      Align entire letter inside frame
                    </span>
                    <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-md shadow-sm" />
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-md shadow-sm" />
                    <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-md shadow-sm" />
                  </div>
                </div>

                {/* Off-screen canvas for high-resolution photo capture */}
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopCamera();
                setCameraModalOpen(false);
              }}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white text-xs h-9 w-full sm:w-auto"
            >
              Cancel
            </Button>

            {!cameraError && (
              <Button
                type="button"
                onClick={handleCaptureCameraPhoto}
                disabled={capturingPhoto}
                className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs h-10 px-6 rounded-full shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="h-4 w-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                {capturingPhoto ? "Processing & Reading..." : "Capture & Scan Letter"}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => cameraCaptureInputRef.current?.click()}
              className="text-slate-400 hover:text-slate-200 text-xs h-9 flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <Camera className="h-3.5 w-3.5" />
              Use Native Phone Camera
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}

function LetterGenerationContent() {
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");

  if (queryType === "shares-delivery") {
    return <SharesDeliveryLetter />;
  }
  if (queryType === "cheques-delivery") {
    return <ChequesDeliveryLetter />;
  }
  if (queryType === "cds-account") {
    return <CdsAccountLetter />;
  }
  if (queryType === "physical-approval") {
    return <PhysicalApprovalLetter />;
  }
  if (queryType === "no-folio-found") {
    return <NoFolioFoundLetter />;
  }

  return <MainLetterGenerator />;
}

export default function LetterGenerationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-slate-500">Loading Letter Generator...</div>}>
      <LetterGenerationContent />
    </Suspense>
  );
}
