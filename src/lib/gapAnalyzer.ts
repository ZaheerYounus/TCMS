export interface TransmissionDocRequirement {
  id: string;
  title: string;
  formalText: string;
  category: "mandatory_legal" | "statutory_form" | "financial";
  critical: boolean;
  notes: string;
  matchKeywords: string[];
}

export interface DocumentGapAnalysis {
  receivedCount: number;
  totalRequirementsCount: number;
  completionPercentage: number;
  isComplete: boolean;
  receivedDocs: string[];
  missingDocs: string[];
  missingItemsDetailed: TransmissionDocRequirement[];
  hasLostShares: boolean;
  lostSharesDetail?: string;
  suggestedStage: "first" | "second";
  summaryText: string;
}

export const CANONICAL_TRANSMISSION_DOCS: TransmissionDocRequirement[] = [
  {
    id: "succession",
    title: "Succession Certificate / Court Decree",
    formalText: "Succession Certificate (NADRA Digital or Civil Court Attested Copy along with Court Order)",
    category: "mandatory_legal",
    critical: true,
    notes: "Mandatory for transferring legal title of shares and unpaid dividends.",
    matchKeywords: ["succession", "succession cert", "court order", "letter of administration", "court decree"]
  },
  {
    id: "death_cert",
    title: "NADRA Computerized Death Certificate",
    formalText: "Legible notarized copy of death certificate of subject deceased shareholder",
    category: "mandatory_legal",
    critical: true,
    notes: "Computerized NADRA QR-code death certificate required.",
    matchKeywords: ["death certificate", "death cert", "computerized death"]
  },
  {
    id: "cnics",
    title: "Attested CNICs (Deceased & All Legal Heirs)",
    formalText: "Legible notarized copy of CNICs of subject deceased shareholder & legal heir(s)",
    category: "mandatory_legal",
    critical: true,
    notes: "Valid CNIC copies with clear photos and signatures.",
    matchKeywords: ["cnic of subject", "cnic of deceased", "cnics", "cnic copy", "attested copy of cnic"]
  },
  {
    id: "frc",
    title: "Family Registration Certificate (FRC)",
    formalText: "Family Registration Certificate (FRC) issued by NADRA",
    category: "mandatory_legal",
    critical: true,
    notes: "NADRA, Family tree certificate verifying all surviving heirs.",
    matchKeywords: ["family registration", "frc", "nadra frc", "family tree"]
  },
  {
    id: "share_certs",
    title: "Original Physical Share Certificate(s)",
    formalText: "Original physical share certificate(s)",
    category: "mandatory_legal",
    critical: true,
    notes: "Physical scripts for cancellation and reissuance. If lost, duplicate procedure applies.",
    matchKeywords: ["original physical", "original share", "physical share certificate", "share certificates enclosed"]
  },
  {
    id: "transmission_deed",
    title: "Transmission Deed / Indemnity Bond",
    formalText: "Transmission deed (attached) duly filled and signed by all the legal heir(s) along with witness CNIC",
    category: "statutory_form",
    critical: true,
    notes: "Judicial stamp paper of Rs. 500/- attested by Oath Commissioner.",
    matchKeywords: ["transmission deed", "indemnity bond", "stamp paper", "affidavit", "sureties"]
  },
  {
    id: "sif_form",
    title: "Shareholder Information Form (SIF)",
    formalText: "Shareholder Information Form (attached) duly filled and signed by all legal heir(s) separately",
    category: "statutory_form",
    critical: true,
    notes: "Standard KYC–bio-data form signed by each heir.",
    matchKeywords: ["shareholder information", "sif", "kyc form", "specimen signature"]
  },
  {
    id: "iban_verification",
    title: "Bank Account IBAN Verification",
    formalText: "Bank Account verification (24-digit IBAN certificate) in name of legal heir",
    category: "financial",
    critical: false,
    notes: "Required for electronic credit of withheld and future dividends.",
    matchKeywords: ["iban", "bank account", "bank certificate", "account maintenance", "bank verification"]
  },
  {
    id: "transfer_stamps",
    title: "Share Transfer Stamps (@ 0.25%)",
    formalText: "Shares Transfer stamps of Rs. 25/- (@0.25% of face value of shares)",
    category: "financial",
    critical: false,
    notes: "Provincial revenue transfer duty.",
    matchKeywords: ["transfer stamp", "revenue stamp", "stamps of rs", "transfer stamps"]
  },
  {
    id: "dividend_warrants",
    title: "Original Dividend Warrants (if any)",
    formalText: "Original dividend warrants (if any) issued in the name of subject deceased shareholder",
    category: "financial",
    critical: false,
    notes: "Physical counterfoils/warrants for re-validation in favor of legal heirs.",
    matchKeywords: ["dividend warrant", "dividend warrants", "unpaid dividend", "unclaimed dividend"]
  }
];

export function calculateDocumentGap(receivedList: string[] = [], rawText: string = ""): DocumentGapAnalysis {
  const normText = (rawText + " " + (receivedList || []).join(" ")).toLowerCase();

  const missingItemsDetailed: TransmissionDocRequirement[] = [];
  const missingDocs: string[] = [];
  let receivedCount = 0;

  for (const req of CANONICAL_TRANSMISSION_DOCS) {
    const isMatched = req.matchKeywords.some(kw => normText.includes(kw));
    if (isMatched) {
      receivedCount++;
    } else {
      missingItemsDetailed.push(req);
      missingDocs.push(req.formalText);
    }
  }

  const total = CANONICAL_TRANSMISSION_DOCS.length;
  const completionPercentage = Math.min(100, Math.round((receivedCount / total) * 100));
  const isComplete = missingDocs.length === 0;

  const mentionsLost = normText.includes("lost") || 
                       normText.includes("misplace") || 
                       normText.includes("duplicate") || 
                       normText.includes("untraceable") ||
                       normText.includes("not trace");
  const sharesReceived = CANONICAL_TRANSMISSION_DOCS
    .find(r => r.id === "share_certs")
    ?.matchKeywords.some(kw => normText.includes(kw));

  const hasLostShares = Boolean(mentionsLost || (!sharesReceived && (normText.includes("transmission") || receivedCount > 0)));

  const hasSuccession = normText.includes("succession") || normText.includes("vourt order");
  const suggestedStage: "first" | "second" = (hasSuccession && receivedCount >= 3) ? "second" : "first";

  const summaryText = isComplete
    ? "Transmission Dossier 100% Complete. All statutory documents received. Ready for transfer execution."
    : `Dossier Status: ${receivedCount} of ${total} Documents Received (${completionPercentage}% Complete). ${missingDocs.length} Requirements Remaining.`;

  return {
    receivedCount,
    totalRequirementsCount: total,
    completionPercentage,
    isComplete,
    receivedDocs: receivedList || [],
    missingDocs,
    missingItemsDetailed,
    hasLostShares,
    suggestedStage,
    summaryText
  };
}
