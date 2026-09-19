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

export async function POST(req: NextRequest) {
  try {
    const { 
      letterStage = "first",   // 'first' | 'second'
      refNo = "CDCSR/LTC/GEN/01/26",
      date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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
      scrutinyPosition = "after_required", // 'after_received' | 'before_required' | 'after_required' | 'at_end'
      hasLostShares = false,   // Whether duplicate share formalities are required
      lostSharesDetail = "",   // e.g. "Cert # 10451 for 1,000 shares"
      duplicatePosition = "before_required", // 'before_required' | 'after_required' | 'at_end'
      duplicateDocs = [],      // Array of duplicate requirements
      duplicateIntro = "",     // Custom intro paragraph for duplicate shares
      deficiencies = [],       // Array of specific objections / missing items for Second Letter
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

    // 1. FIRST LETTER: Standard Transmission Response & Requisition Letter
    const firstLetterChildren = [
      // 1. Ref & Date on same line with tab stops
      new Paragraph({
        children: [
          new TextRun({ text: refNo, bold: true, size: 22, font: "Calibri" }),
          new TextRun({ text: `\t\t\t\t\t\t${date}`, bold: true, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),

      // 2. Addressee Info (NO CNIC here as per official CDCSR letterhead practice)
      new Paragraph({
        children: [
          new TextRun({ text: legalHeir, bold: true, size: 22, font: "Calibri" }),
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
      new Paragraph({
        children: [
          new TextRun({ text: refNo, bold: true, size: 22, font: "Calibri" }),
          new TextRun({ text: `\t\t\t\t\t\t${date}`, bold: true, size: 22, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),

      new Paragraph({
        children: [
          new TextRun({ text: legalHeir, bold: true, size: 22, font: "Calibri" }),
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
        children: letterStage === "second" ? secondLetterChildren : firstLetterChildren
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="CDCSR_Transmission_${letterStage === 'second' ? 'Second_Letter' : 'Letter'}_${companyName.split(' ')[0]}_Folio_${foliosStr.replace(/[^0-9]/g, '_')}.docx"`
      }
    });

  } catch (error) {
    console.error('Error generating official transmission docx:', error);
    return NextResponse.json({ error: 'Failed to generate Word document' }, { status: 500 });
  }
}
