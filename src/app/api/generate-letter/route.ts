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

    // 4. PHYSICAL APPROVAL COVERING LETTER (Sample format with flexible Transferees, Loss Register, Split Register)
    const activeTransferees = Array.isArray(transferees) && transferees.length > 0 ? transferees : [
      { name: cleanLegalHeir, cnic: "42101-XXXXXXXX-X", shares: noOfShares, folio: foliosStr, relation: "Son / Legal Heir" }
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
          new TextRun({ text: "Karachi, Pakistan.", size: 20, font: "Calibri" }),
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
          new TextRun({ text: "APPROVAL OF TRANSMISSION OF SHARES – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: `LATE ${shareholder.toUpperCase()}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: ` – FOLIO # ${foliosStr}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),
      ...(scrutinyPosition === 'top' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `We have received application along with requisite legal formalities for transmission of ${noOfShares} shares of ${companyName} standing in the name of subject deceased shareholder.`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `All submitted documents, including Succession Certificate, Death Certificate, Transmission Deed / Shareholder Information Form, and CNICs have been examined and found in order. The subject shares are proposed to be transmitted in favor of following legal heir(s) / transferee(s):`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),
      // Flexible Transferees Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S #", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name of Transferee / Legal Heir", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CNIC #", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Relationship", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Proposed Folio", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "# of Shares", bold: true, size: 20 })] })] }),
            ]
          }),
          ...activeTransferees.map((t: any, idx: number) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.name || ''), bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.cnic || '—'), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.relation || 'Legal Heir'), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.folio || 'NEW'), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(t.shares || ''), size: 20 })] })] }),
            ]
          }))
        ]
      }),
      // Loss & Split Registers flexibility
      ...(hasLossRegister || hasSplitRegister ? [
        new Paragraph({
          children: [
            new TextRun({ text: "Special Registers / Approvals Attached:", bold: true, size: 21, font: "Calibri" }),
          ],
          spacing: { before: 140, after: 60 },
        }),
        ...(hasLossRegister ? [
          new Paragraph({
            children: [
              new TextRun({ text: "•  Loss of Shares Register: ", bold: true, size: 20, font: "Calibri" }),
              new TextRun({ text: `Signed Loss Register attached. Receipt / Entry No: ${lossReceiptNo || 'N/A'}. Newspaper notices and indemnity verified.`, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 50 },
            indent: { left: 400 },
          })
        ] : []),
        ...(hasSplitRegister ? [
          new Paragraph({
            children: [
              new TextRun({ text: "•  Split of Certificates Register: ", bold: true, size: 20, font: "Calibri" }),
              new TextRun({ text: `Signed Split Register attached. Receipt / Entry No: ${splitReceiptNo || 'N/A'} for issuance of split certificates.`, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 50 },
            indent: { left: 400 },
          })
        ] : []),
      ] : []),
      ...(scrutinyPosition === 'middle' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: approvalCoveringNotes || "You are kindly requested to please accord your formal approval / sign the attached Transmission Register and return the same to us along with blank share certificates (if required) to enable us to execute the transfer.", 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 120, after: 180 },
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
          new TextRun({ text: "Encl.: Transmission file dossier, Succession Certificate copy & Verification Summary.", size: 19, italics: true, font: "Calibri" }),
        ],
      }),
    ];

    // 5. DELIVERY OF SHARES LETTER (Physical dispatch or by-hand delivery to Legal Heir)
    const deliverySharesChildren = [
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
          new TextRun({ text: "Dear Shareholder / Legal Heir,", size: 22, font: "Calibri" }),
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
          new TextRun({ text: "DELIVERY OF TRANSMITTED SHARE CERTIFICATE(S) – ", bold: true, underline: {}, size: 22, font: "Calibri" }),
          new TextRun({ text: `FOLIO # ${foliosStr}`, bold: true, underline: {}, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 180 },
      }),
      ...(scrutinyPosition === 'top' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `We are pleased to inform you that the transmission of ${noOfShares} shares of ${companyName} previously registered in the name of Late ${shareholder} has been completed and registered under Folio # ${foliosStr}.`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Enclosed please find the physical share certificate(s) as detailed below, dispatched / delivered via ${deliveryMode}${dispatchTrackingNo ? ` under Tracking # ${dispatchTrackingNo}` : ''}:`, 
            size: 21, 
            font: "Calibri" 
          }),
        ],
        spacing: { after: 120 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Company", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Folio #", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "# of Certificates", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "# of Shares", bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Certificate # / Distinctive", bold: true, size: 20 })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: companyName, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: foliosStr, bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: shareCertificates, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: noOfShares, bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: scripts || 'Attached', size: 20 })] })] }),
            ]
          })
        ]
      }),
      ...(scrutinyPosition === 'middle' ? scrutinyParagraphs : []),
      new Paragraph({
        children: [
          new TextRun({ 
            text: deliveryNotes || "Please acknowledge receipt of the share certificates by signing and returning the duplicate copy of this letter or counterfoil. In case of any query, please feel free to contact us.", 
            size: 20, 
            font: "Calibri" 
          }),
        ],
        spacing: { before: 140, after: 180 },
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
          new TextRun({ text: "Acknowledgement:", bold: true, size: 20, underline: {}, font: "Calibri" }),
        ],
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Received the above mentioned original share certificate(s) in good order.", size: 20, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Signature: ___________________________\t\tDate: ___________________________", size: 20, font: "Calibri" }),
        ],
      }),
    ];

    let selectedChildren = firstLetterChildren;
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
