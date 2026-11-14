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

/**
 * Clean reference-matched canonical transmission documents list.
 * Note: FRC is strictly inside the Succession Certificate NADRA sub-option, never a separate line.
 * IBAN / Affidavit are not in default requirements.
 */
export const CANONICAL_TRANSMISSION_DOCS: TransmissionDocRequirement[] = [
  {
    id: "death_cert",
    title: "Death Certificate",
    formalText: "Legible notarized copy of death certificate of subject deceased shareholder;",
    category: "mandatory_legal",
    critical: true,
    notes: "Computerized NADRA death certificate.",
    matchKeywords: ["death certificate", "death cert", "computerized death", "nadra death"]
  },
  {
    id: "cnics",
    title: "Attested CNICs (Deceased & Legal Heirs)",
    formalText: "Legible notarized copy of CNICs of subject deceased shareholder & legal heir(s);",
    category: "mandatory_legal",
    critical: true,
    notes: "Valid CNIC copies of deceased and all legal heirs.",
    matchKeywords: ["cnic", "cnics", "cnic copy", "attested copy of cnic", "identity card"]
  },
  {
    id: "sif_form",
    title: "Shareholder Information Form (SIF)",
    formalText: "Shareholder Information Form (attached) duly filled and signed by all legal heir(s) separately",
    category: "statutory_form",
    critical: true,
    notes: "Standard KYC form signed by each heir.",
    matchKeywords: ["shareholder information", "sif", "kyc form"]
  },
  {
    id: "transmission_deed",
    title: "Transmission Deed",
    formalText: "Transmission deed (attached) duly filled and signed by all the legal heir(s) separately along with Notarized copy of CNIC of the persons witnessing the deed",
    category: "statutory_form",
    critical: true,
    notes: "Prescribed transmission deed attested with witnesses.",
    matchKeywords: ["transmission deed", "indemnity bond", "deed"]
  },
  {
    id: "transfer_stamps",
    title: "Shares Transfer Stamps",
    formalText: "Shares Transfer stamps of Rs. 25/- (@0.25% of face value of shares)",
    category: "financial",
    critical: false,
    notes: "Provincial revenue transfer duty.",
    matchKeywords: ["transfer stamp", "revenue stamp", "stamps of rs", "transfer stamps"]
  },
  {
    id: "dividend_warrants",
    title: "Original Dividend Warrants (if any)",
    formalText: "Original dividend warrants (if any) issued in the name of subject deceased shareholder; and",
    category: "financial",
    critical: false,
    notes: "Physical counterfoils/warrants for re-validation in favor of legal heirs.",
    matchKeywords: ["dividend warrant", "dividend warrants", "unpaid dividend", "unclaimed dividend"]
  },
  {
    id: "succession",
    title: "Succession Certificate",
    formalText: "Succession Certificate:\n• Notarized copy of Succession Certificate along with Family Registration Certificate (if issued by NADRA); OR\n• Court attested copy of Succession Certificate along with its Application & Court Order (if issued by Honorable Court).",
    category: "mandatory_legal",
    critical: true,
    notes: "NADRA Digital or Court decree with schedule of securities.",
    matchKeywords: ["succession", "succession cert", "court order", "letter of administration", "court decree"]
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

  // IMPORTANT: hasLostShares must be TRUE ONLY if the incoming letter explicitly states
  // that shares/certificates are reported lost or misplaced.
  // Missing physical certificates alone NEVER triggers lost status.
  const mentionsLost = (
    normText.includes("reported lost") ||
    normText.includes("is lost") ||
    normText.includes("are lost") ||
    normText.includes("shares lost") ||
    normText.includes("certificate lost") ||
    normText.includes("lost / misplaced") ||
    normText.includes("misplaced") ||
    normText.includes("duplicate share certificate") ||
    normText.includes("issuance of duplicate")
  );

  const hasLostShares = Boolean(mentionsLost);

  const hasSuccession = normText.includes("succession") || normText.includes("court order");
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
