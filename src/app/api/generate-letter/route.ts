import { NextRequest, NextResponse } from 'next/server';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle 
} from 'docx';

import { formatDateDDMMYYYY } from '@/lib/dateUtils';

export async function POST(req: NextRequest) {
  try {
    const { 
      letterStage = "first",   // 'first' | 'no_folio' | 'physical_approval' | 'delivery_shares' | 'cds_account'
      refNo = "CDCSR/LTC/GEN/01/26",
      date = new Date().toISOString(),
      legalHeir = "Legal Heir",
      shareholder = "Subject Deceased Shareholder",
      address = "Karachi, Pakistan",
      contactNo = "",
      company = "Client Company Limited", 
      folios = [], 
      shareCertificates = "=01=",
      noOfShares = "=1,000=",
      scripts = "",            // Distinctive numbers / scripts
      multiFolioTable = [],    // Optional array of folios: [{ folio, company, shares, certificates, scripts }]
      receivedDocs = [],       // Documents already received from applicant
      requiredDocs = [],       // Documents still required from legal heirs
      scrutinyRemark = "",     // Natural plain text custom observation
      scrutinyPosition = "after_required", // 'top' | 'middle' | 'bottom' | 'after_received' | 'before_required' | 'after_required' | 'at_end'
      hasLostShares = false,   // Whether duplicate share formalities are required
      lostSharesDetail = "",   // e.g. "Cert # 10451 for 1,000 shares"
      duplicatePosition = "before_required", // 'before_required' | 'after_required' | 'at_end'
      duplicateDocs = [],      // Array of duplicate requirements
      duplicateIntro = "",     // Custom intro paragraph for duplicate shares
      // Physical Approval & Transferees Flexibility
      transferees = [],        // Array of { name, cnic, shares, folio, relation }
      hasLossRegister = false,
      lossReceiptNo = "",
      hasSplitRegister = false,
      splitReceiptNo = "",
      approvalCoveringNotes = "",
      cheques = [],            // Banker's cheques: [{ beneficiary, instrumentNo, amount }]
      transferReceipts = [],     // [{ receiptNo, name }] for Physical Approval
      transferRegisterPages = "06 (02 Copies)",
      lossRegisterPages = "02 (02 Copies)",
      // Delivery of shares
      deliveryMode = "By Hand", // 'By Hand' | 'Registered Post' | 'Courier'
      dispatchTrackingNo = "",
      deliveryNotes = "",
      deficiencies = [],
    } = await req.json();

    const companyName = Array.isArray(company) ? company.join(' / ') : String(company || 'Company');
    const foliosStr = Array.isArray(folios) ? folios.join(', ') : String(folios || 'N/A');

    // Build natural paragraph for scrutiny remark (plain text matching letter body, no loud headers)
    const hasScrutiny = Boolean(scrutinyRemark && scrutinyRemark.trim().length > 0);
    const scrutinyParagraphs = hasScrutiny ? [
      new Paragraph({
        children: [
          new TextRun({ 
            text: scrutinyRemark.trim(), 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 140 },
      })
    ] : [];

    // Duplicate share formalities documents (user customizable)
    const defaultLostDocs = [
      "Draft Letter of Indemnity on non-judicial stamp paper of prescribed value (Rs. 500/-) duly attested by Oath Commissioner / Notary Public along with two solvent sureties.",
      "Specimen of newspaper publication notice of loss of shares published in one English and one Urdu daily national newspaper (approved specimen attached).",
      "Original full-page newspaper cuttings of both publications after expiry of 7-day notice period.",
      "Duplicate share certificate issuance fee of Rs. 200/- per certificate."
    ];

    const activeLostDocs = (Array.isArray(duplicateDocs) && duplicateDocs.length > 0)
      ? duplicateDocs
      : defaultLostDocs;

    const introText = duplicateIntro.trim().length > 0
      ? duplicateIntro.trim()
      : `Kindly note that as intimated, the subject share certificate(s) ${lostSharesDetail ? `(${lostSharesDetail}) ` : ''}are reported lost / misplaced. In order to process the issuance of duplicate share certificate(s) in favor of legal heir(s), following duplicate formalities are also required:`;

    const duplicateShareParagraphs = hasLostShares ? [
      new Paragraph({
        children: [
          new TextRun({ 
            text: introText, 
            size: 21, 
            bold: true,
            font: "Calibri" 
          }),
        ],
        spacing: { before: 150, after: 80 },
      }),
      ...activeLostDocs.map((doc: string) => new Paragraph({
        children: [
          new TextRun({ text: `•  `, bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: doc, size: 20, font: "Calibri" }),
        ],
        spacing: { after: 60 },
        indent: { left: 400 },
      }))
    ] : [];

    const cleanLegalHeir = String(legalHeir || 'Legal Heir').replace(/\s*\([^)]*\)\s*$/, '').trim();

    const formattedDate = formatDateDDMMYYYY(date);

    // 1. Ref & Date below reference section (Requirement 7)
    const headerRefAndDateParagraphs = [
      new Paragraph({
        children: [
          new TextRun({ text: refNo, bold: true, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: formattedDate, bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),
    ];

    // 1. FIRST LETTER: Standard Transmission Response & Requisition Letter
    const firstLetterChildren = [
      ...headerRefAndDateParagraphs,

      // 2. Addressee Info (NO CNIC here as per official CDCSR letterhead practice, Requirement 9: Clean Heir Name)
      new Paragraph({
        children: [
          new TextRun({ text: cleanLegalHeir, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "F/H: ", bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: `${shareholder} (Late)`, size: 20, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: address, size: 20, font: "Calibri" }),
        ],
      }),
      ...(contactNo ? [
        new Paragraph({
          children: [
            new TextRun({ 
              text: contactNo.startsWith('Contact') ? contactNo : `Contact: ${contactNo}`, 
              size: 20, 
              font: "Calibri" 
            }),
          ],
        })
      ] : []),

      // 3. Salutation
      new Paragraph({
        children: [
          new TextRun({ text: "Dear Concern,", size: 22, font: "Calibri" }),
        ],
        spacing: { before: 180, after: 140 },
      }),

      // 4. Company & Subject (Refined standard single-line with dashes)
      ...(multiFolioTable && multiFolioTable.length > 0 ? [
        new Paragraph({
          children: [
            new TextRun({ text: "Transmission of Shares & Dividends – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
            new TextRun({ text: `Late ${shareholder}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
          ],
          spacing: { after: 180 },
        })
      ] : [
        new Paragraph({
          children: [
            new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Transmission of Shares and Dividends – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
            new TextRun({ text: `Late ${shareholder}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
            new TextRun({ text: " – Folio # ", bold: true, underline: {}, size: 22, font: "Calibri" }),
            new TextRun({ text: foliosStr, bold: true, underline: {}, size: 22, font: "Calibri" }),
          ],
          spacing: { after: 180 },
        })
      ]),

      // 5. Opening Body acknowledging receipt
      new Paragraph({
        children: [
          new TextRun({ 
            text: `We refer to your letter regarding the captioned subject and acknowledge the receipt of: ${receivedDocs.length > 0 ? receivedDocs.join(", ") : "documents submitted"}.`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),

      ...(multiFolioTable && multiFolioTable.length > 0 ? [
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Please note that following shares are registered in the name of subject deceased shareholder:`, 
              size: 21, 
              font: "Calibri" 
            }),
          ],
          spacing: { after: 100 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S #", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Company", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Folio #", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "# of Certs", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "# of Shares", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Scripts / Distinctive #", bold: true, size: 20 })] })] }),
              ]
            }),
            ...multiFolioTable.map((item: any, idx: number) => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.company || ''), size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.folio || ''), size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.certificates || ''), size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.shares || ''), size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.scripts || ''), size: 20 })] })] }),
              ]
            }))
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `For your convenience, we are also attaching complete details of shares. In case if any share certificate(s) is/are lost, please intimate us accordingly.`, 
              size: 20, 
              font: "Calibri" 
            }),
          ],
          spacing: { before: 100, after: 150 },
        })
      ] : [
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Kindly note that as per company's record total, ${shareCertificates} share certificate for ${noOfShares} shares ${scripts ? `(${scripts}) ` : ''}under folio of ${companyName} is registered in the name of subject deceased shareholder (details of shares attached). In case if share certificate is lost, please intimate us accordingly.`, 
              size: 21, 
              font: "Calibri" 
            }),
          ],
          spacing: { after: 180 },
        })
      ]),

      // Requirement 13: Standard wording
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Share certificates shall be sent upon our further instructions.", 
            bold: true,
            size: 20, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),

      // Position A: After Received Documents
      ...(scrutinyPosition === 'after_received' ? scrutinyParagraphs : []),

      // Lost Share Formalities (Position: before_required)
      ...(duplicatePosition === 'before_required' ? duplicateShareParagraphs : []),

      // Position B: Before Required Formalities
      ...(scrutinyPosition === 'before_required' ? scrutinyParagraphs : []),

      new Paragraph({
        children: [
          new TextRun({ 
            text: `In order to enable us to process the transmission of the shares and dividends of deceased shareholder in favor of legal heir(s), following documents are required:`, 
            size: 21, 
            bold: true,
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),

      // 6. Required Documents List (Numbered)
      ...requiredDocs.flatMap((item: string, idx: number) => {
        const isSuccession = item.toLowerCase().includes('succession certificate');
        if (isSuccession) {
          return [
            new Paragraph({
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 21, font: "Calibri" }),
                new TextRun({ text: "Succession Certificate:", bold: true, underline: {}, size: 21, font: "Calibri" }),
              ],
              spacing: { before: 80, after: 50 },
              indent: { left: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "•  Notarized copy of Succession Certificate along with Family Registration Certificate (if issued by NADRA);", 
                  size: 20, 
                  font: "Calibri" 
                }),
              ],
              spacing: { after: 30 },
              indent: { left: 700 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "OR", bold: true, size: 20, font: "Calibri" }),
              ],
              spacing: { after: 30 },
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "•  Court attested copy of Succession Certificate along with its Application & Court Order (if issued by Honorable Court).", 
                  size: 20, 
                  font: "Calibri" 
                }),
              ],
              spacing: { after: 80 },
              indent: { left: 700 },
            })
          ];
        }
        return [
          new Paragraph({
            children: [
              new TextRun({ text: `${idx + 1}. `, bold: true, size: 20, font: "Calibri" }),
              new TextRun({ text: item, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 70 },
            indent: { left: 400 },
          })
        ];
      }),

      // Position C: After Required Documents
      ...(scrutinyPosition === 'after_required' ? scrutinyParagraphs : []),

      // Lost Share Formalities (Position: after_required)
      ...(duplicatePosition === 'after_required' ? duplicateShareParagraphs : []),

      // 7. Closing Clarification Note
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Please ensure that details such as company name, folio number and number of shares are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.", 
            size: 20, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 250 },
      }),

      // Position D: At End Before Signatures
      ...(scrutinyPosition === 'at_end' ? scrutinyParagraphs : []),

      // Lost Share Formalities (Position: at_end)
      ...(duplicatePosition === 'at_end' ? duplicateShareParagraphs : []),

      // 8. Signoff (NO CDCSR printed below signatures because it's printed on official letterhead!)
      new Paragraph({
        children: [
          new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 120 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Encl.:  As stated above.", size: 19, italics: true, font: "Calibri" }),
        ],
      }),
    ];

    // 2. SECOND LETTER: Scrutiny Objection & Deficiency Rectification Letter
    const secondLetterChildren = [
      ...headerRefAndDateParagraphs,

      new Paragraph({
        children: [
          new TextRun({ text: cleanLegalHeir, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "F/H: ", bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: `${shareholder} (Late)`, size: 20, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: address, size: 20, font: "Calibri" }),
        ],
      }),
      ...(contactNo ? [
        new Paragraph({
          children: [
            new TextRun({ 
              text: contactNo.startsWith('Contact') ? contactNo : `Contact: ${contactNo}`, 
              size: 20, 
              font: "Calibri" 
            }),
          ],
        })
      ] : []),

      new Paragraph({
        children: [
          new TextRun({ text: "Dear Concern,", size: 22, font: "Calibri" }),
        ],
        spacing: { before: 180, after: 140 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Transmission of Shares and Dividends – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: `Late ${shareholder}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: " – Folio # ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: foliosStr, bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: " (Scrutiny Observations & Rectification)", bold: true, underline: {}, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),

      new Paragraph({
        children: [
          new TextRun({ 
            text: `We refer to the transmission dossier and documents submitted in our office regarding the transmission of shares of subject deceased shareholder in favor of legal heir(s).`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Upon preliminary scrutiny and legal examination of the submitted documents, following deficiencies / discrepancies have been observed:`, 
            size: 21, 
            bold: true,
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),

      // Deficiencies List
      ...(deficiencies.length > 0 ? deficiencies : [
        "Discrepancy in deceased shareholder's name between CNIC and Share Register.",
        "Succession Certificate schedule does not specify the distinctive script numbers.",
        "Attestation / verification missing on legal heirs' signature card."
      ]).map((def: string, idx: number) => new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: def, size: 20, font: "Calibri" }),
        ],
        spacing: { after: 80 },
        indent: { left: 400 }
      })),

      ...(scrutinyRemark ? [
        new Paragraph({
          children: [
            new TextRun({ text: scrutinyRemark.trim(), size: 21, font: "Calibri" })
          ],
          spacing: { before: 140, after: 140 }
        })
      ] : []),

      new Paragraph({
        children: [
          new TextRun({ 
            text: `You are requested to please rectify the above discrepancies and furnish the amended / required documents at your earliest to enable us to proceed with the transmission of shares.`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 250 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 120 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Encl.:  As stated above.", size: 19, italics: true, font: "Calibri" }),
        ],
      }),
    ];

    // 3. NO FOLIO FOUND LETTER
    const noFolioChildren = [
      ...headerRefAndDateParagraphs,
      new Paragraph({
        children: [
          new TextRun({ text: cleanLegalHeir, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "F/H: ", bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: `${shareholder} (Late)`, size: 20, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: address, size: 20, font: "Calibri" }),
        ],
      }),
      ...(contactNo ? [
        new Paragraph({
          children: [
            new TextRun({ 
              text: contactNo.startsWith('Contact') ? contactNo : `Contact: ${contactNo}`, 
              size: 20, 
              font: "Calibri" 
            }),
          ],
        })
      ] : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Dear Concern,", size: 22, font: "Calibri" }),
        ],
        spacing: { before: 180, after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Transmission of Shares – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: `Late ${shareholder}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
          ...(foliosStr && foliosStr !== 'N/A' ? [
            new TextRun({ text: " – Folio # ", bold: true, underline: {}, size: 22, font: "Calibri" }),
            new TextRun({ text: foliosStr, bold: true, underline: {}, size: 22, font: "Calibri" }),
          ] : []),
        ],
        spacing: { after: 180 },
      }),
      ...(scrutinyPosition === 'top' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "We refer to your letter regarding the captioned subject and acknowledge the receipt of copy of death certificate & identification documents of subject deceased shareholder.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Please be advised that we have conducted a thorough search of our physical shareholder records based on the name and provided CNIC of the deceased. However, we have been unable to trace any shares held in the name of the deceased in our available records.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),
      ...(scrutinyPosition === 'middle' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "You are therefore requested to kindly provide any documentary evidence, such as copy of share certificate, dividend warrant counterfoil, or any correspondence with the company to enable us to check for any shares registered in the name of deceased shareholder and advise you the formalities for transmission of shares and dividends (if any).", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),
      ...((scrutinyPosition === 'bottom' || scrutinyPosition === 'after_required' || scrutinyPosition === 'at_end') ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Should you have any query, feel free to coordinate with us.", 
            size: 20, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 250 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 120 },
      }),
    ];

        // 4. PHYSICAL APPROVAL COVERING LETTER (Exact match: Late Allah Bakhsh – Folio # 607 physical approval.doc)
    const activeTransferReceipts = (Array.isArray(transferReceipts) && transferReceipts.length > 0)
      ? transferReceipts
      : [
          { receiptNo: "469", name: cleanLegalHeir }
        ];

    const physicalApprovalChildren = [
      ...headerRefAndDateParagraphs,
      new Paragraph({
        children: [
          new TextRun({ text: "The Company Secretary", bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: address.includes("Karachi") ? address : address + ", Karachi.", size: 20, font: "Calibri" }),
        ],
        spacing: { after: 160 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Dear Sir / Madam,", size: 22, font: "Calibri" }),
        ],
        spacing: { after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Transmission of Shares & Dividends – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: ("Late " + shareholder), bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: " – Folio # ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: foliosStr, bold: true, underline: {}, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),
      ...(scrutinyPosition === 'top' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: ("We refer to the transmission case in respect of the above deceased shareholder. In this regard we are pleased to enclose herewith " + shareCertificates + " share certificates for " + noOfShares + " shares along with their relevant Loss & Transfer registers and other supporting documents being forwarded to you for approval of transfers thereon by the Directors / Authorized Signatories."), 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "The details of transfers being sent to you are given below:", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "No. of transfer receipt(s)          : ", bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: String(activeTransferReceipts.length).padStart(2, '0'), size: 20, font: "Calibri" }),
        ],
        spacing: { after: 40 },
        indent: { left: 300 },
      }),
      ...activeTransferReceipts.map((tr) => new Paragraph({
        children: [
          new TextRun({ text: "Transfer receipt(s) #              : ", bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: (tr.receiptNo + " (in the name of " + tr.name + ")"), size: 20, font: "Calibri" }),
        ],
        spacing: { after: 40 },
        indent: { left: 300 },
      })),
      new Paragraph({
        children: [
          new TextRun({ text: "Transfer register no. of page(s)  : ", bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: transferRegisterPages, size: 20, font: "Calibri" }),
        ],
        spacing: { after: 40 },
        indent: { left: 300 },
      }),
      ...(hasLossRegister ? [
        new Paragraph({
          children: [
            new TextRun({ text: "Loss receipt(s) #                   : ", bold: true, size: 20, font: "Calibri" }),
            new TextRun({ text: lossReceiptNo || "295", size: 20, font: "Calibri" }),
          ],
          spacing: { after: 40 },
          indent: { left: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Loss register no. of page(s)     : ", bold: true, size: 20, font: "Calibri" }),
            new TextRun({ text: lossRegisterPages, size: 20, font: "Calibri" }),
          ],
          spacing: { after: 40 },
          indent: { left: 300 },
        })
      ] : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Following actions are requested for approval of above transmission of shares:", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { before: 120, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "•  Authorized Signatory's signatures on the face of duplicate shares certificates (if applicable).", size: 20, font: "Calibri" }),
        ],
        spacing: { after: 40 },
        indent: { left: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "•  Authorized Signatory's signatures on the Memorandum of Transfers (on the back of each share certificate).", size: 20, font: "Calibri" }),
        ],
        spacing: { after: 40 },
        indent: { left: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "•  Authorized Signatory's signature on Loss & Transfer register.", size: 20, font: "Calibri" }),
        ],
        spacing: { after: 120 },
        indent: { left: 400 },
      }),
      ...(scrutinyPosition === 'middle' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Further, please arrange to check whether any other dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid, if so, then please arrange to issue cheque(s) / online payment in favor of above legal heirs as per their entitlement.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 200 },
      }),
      ...((scrutinyPosition === 'bottom' || scrutinyPosition === 'after_required' || scrutinyPosition === 'at_end') ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Encl.: As stated above.", size: 20, font: "Calibri" }),
        ],
      }),
    ];

    // 5. DELIVERY OF SHARES LETTER (Exact match: Late Muhammad Boota Bhatti - Folio 23927_ Delivery of shares.doc)
    const activeShareTransferees = Array.isArray(transferees) && transferees.length > 0 ? transferees : [
      { folio: foliosStr, name: cleanLegalHeir, shares: noOfShares }
    ];

    const deliverySharesExactChildren = [
      ...headerRefAndDateParagraphs,
      new Paragraph({
        children: [
          new TextRun({ text: cleanLegalHeir, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: address, size: 20, font: "Calibri" }),
        ],
      }),
      ...(contactNo ? [
        new Paragraph({
          children: [
            new TextRun({ 
              text: contactNo.startsWith('Contact') ? contactNo : ("Contact # " + contactNo), 
              size: 20, 
              font: "Calibri" 
            }),
          ],
        })
      ] : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Dear Concern,", size: 22, font: "Calibri" }),
        ],
        spacing: { before: 180, after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Transmission of Shares & Dividends – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: ("Late " + shareholder), bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: " – Folio # ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: foliosStr, bold: true, underline: {}, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),
      ...(scrutinyPosition === 'top' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: ("We are pleased to forward herewith " + shareCertificates + " shares certificates for " + noOfShares + " shares of above deceased shareholder of " + companyName + " duly transmitted / transferred in the name following legal heirs, details are as follows:"), 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Folio #", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name of Legal Heirs", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "# of Shares", bold: true, size: 20 })] })] }),
            ]
          }),
          ...activeShareTransferees.map((t) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.folio || foliosStr), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.name || ''), bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.shares || ''), size: 20 })] })] }),
            ]
          })),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: noOfShares, bold: true, size: 20 })] })] }),
            ]
          })
        ]
      }),
      ...(scrutinyPosition === 'middle' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Kindly acknowledge the receipt.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Legal heirs are requested to always quote their above-mentioned folio numbers in correspondence with us.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 200 },
      }),
      ...((scrutinyPosition === 'bottom' || scrutinyPosition === 'after_required' || scrutinyPosition === 'at_end') ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Encl.: As stated above.", size: 20, font: "Calibri" }),
        ],
      }),
    ];

    // 6. DELIVERY OF CHEQUES LETTER (Exact match: Folio 23927_ Delivery of Cheques_09-10-26.doc)
    const activeCheques = Array.isArray(cheques) && cheques.length > 0 ? cheques : [
      { beneficiary: cleanLegalHeir, instrumentNo: "13519474", amount: "4,160.99/-" }
    ];

    const deliveryChequesChildren = [
      ...headerRefAndDateParagraphs,
      new Paragraph({
        children: [
          new TextRun({ text: cleanLegalHeir, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: address, size: 20, font: "Calibri" }),
        ],
      }),
      ...(contactNo ? [
        new Paragraph({
          children: [
            new TextRun({ 
              text: contactNo.startsWith('Contact') ? contactNo : ("Contact # " + contactNo), 
              size: 20, 
              font: "Calibri" 
            }),
          ],
        })
      ] : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Dear Concern,", size: 22, font: "Calibri" }),
        ],
        spacing: { before: 180, after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Transmission of Dividends – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: ("Late " + shareholder), bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: " – Folio # ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: foliosStr, bold: true, underline: {}, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),
      ...(scrutinyPosition === 'top' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: ("We are pleased to forward herewith =" + activeCheques.length + "= Banker's cheques against unpaid dividend warrants of above deceased shareholder of " + companyName + " duly issued in the name of following legal heirs, details are as follows:"), 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 140 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Beneficiary", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Instrument #", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true, size: 20 })] })] }),
            ]
          }),
          ...activeCheques.map((c) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(c.beneficiary || ''), bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(c.instrumentNo || ''), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(c.amount || ''), bold: true, size: 20 })] })] }),
            ]
          }))
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Please note that there is no outstanding dividend remaining in the name of deceased shareholder.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Kindly acknowledge the receipt.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 200 },
      }),
      ...((scrutinyPosition === 'bottom' || scrutinyPosition === 'after_required' || scrutinyPosition === 'at_end') ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Encl.: As Stated Above.", size: 20, font: "Calibri" }),
        ],
      }),
    ];

    let selectedChildren = firstLetterChildren;
    if (letterStage === "no_folio") {
      selectedChildren = noFolioChildren;
    } else if (letterStage === "physical_approval") {
      selectedChildren = physicalApprovalChildren;
    } else if (letterStage === "delivery_shares") {
      selectedChildren = deliverySharesExactChildren;
    } else if (letterStage === "delivery_cheques") {
      selectedChildren = deliveryChequesChildren;
    }
    if (letterStage === "no_folio") {
      selectedChildren = noFolioChildren;
    } else if (letterStage === "physical_approval") {
      selectedChildren = physicalApprovalChildren;
    } else if (letterStage === "delivery_shares") {
      selectedChildren = deliverySharesChildren;
    } else if (letterStage === "cds_account") {
      selectedChildren = firstLetterChildren;
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1100,
              right: 1100,
            }
          }
        },
        children: selectedChildren
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="CDCSR_Transmission_${letterStage}_${companyName.split(' ')[0]}_Folio_${foliosStr.replace(/[^0-9]/g, '_')}.docx"`
      }
    });

  } catch (error) {
    console.error('Error generating official transmission docx:', error);
    return NextResponse.json({ error: 'Failed to generate Word document' }, { status: 500 });
  }
}
