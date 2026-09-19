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
      scrutinyRemark = "",     // Independent scrutiny remark / custom observation
      scrutinyRemarkTitle = "Special Scrutiny Note / Observation",
      scrutinyPosition = "after_required", // 'after_received' | 'before_required' | 'after_required' | 'at_end'
      isNADRA = true,
      isCourt = false
    } = await req.json();

    const companyName = Array.isArray(company) ? company.join(' / ') : String(company || 'Company');
    const foliosStr = Array.isArray(folios) ? folios.join(', ') : String(folios || 'N/A');

    // Build the "acknowledge receipt of" text based on user selections
    let ackText = "copy of CNIC of subject deceased shareholder and yourself";
    if (receivedDocs && receivedDocs.length > 0) {
      ackText = receivedDocs.join(", ");
    }

    const hasScrutiny = Boolean(scrutinyRemark && scrutinyRemark.trim().length > 0);
    const scrutinyParagraphs = hasScrutiny ? [
      new Paragraph({
        children: [
          new TextRun({ 
            text: `${scrutinyRemarkTitle ? scrutinyRemarkTitle.trim() : 'Official Observation / Scrutiny Remark'}: `, 
            bold: true, 
            color: "0B2B5E", 
            size: 21, 
            font: "Calibri" 
          }),
          new TextRun({ 
            text: scrutinyRemark.trim(), 
            size: 21, 
            italics: true,
            font: "Calibri" 
          }),
        ],
        spacing: { before: 180, after: 180 },
        indent: { left: 400, right: 300 }
      })
    ] : [];

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
        children: [
          // 1. Ref & Date on same line with tab stops
          new Paragraph({
            children: [
              new TextRun({ text: refNo, bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: `\t\t\t\t\t\t${date}`, bold: true, size: 22, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          // 2. Addressee Info
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
                new TextRun({ text: contactNo, size: 20, font: "Calibri" }),
              ],
            })
          ] : []),

          // 3. Salutation
          new Paragraph({
            children: [
              new TextRun({ text: "Dear Concern,", size: 22, font: "Calibri" }),
            ],
            spacing: { before: 200, after: 150 },
          }),

          // 4. Company & Subject
          new Paragraph({
            children: [
              new TextRun({ text: companyName, bold: true, size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Transmission of Shares and Dividends - ", bold: true, underline: {}, size: 22, font: "Calibri" }),
              new TextRun({ text: `Late ${shareholder}`, bold: true, size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Folio # ", bold: true, size: 21, font: "Calibri" }),
              new TextRun({ text: foliosStr, bold: true, color: "0B2B5E", size: 21, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          // 5. Opening Body acknowledging receipt
          new Paragraph({
            children: [
              new TextRun({ 
                text: `We refer to your letter regarding the captioned subject and acknowledge the receipt of ${ackText}.`, 
                size: 21, 
                font: "Calibri" 
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Kindly note that as per company's record total, ${shareCertificates} share certificate for ${noOfShares} shares ${scripts ? `(Distinctive / Scripts: ${scripts}) ` : ''}under folio of ${companyName} is registered in the name of subject deceased shareholder (details of shares attached). In case if share certificate is lost, please intimate us accordingly.`, 
                size: 21, 
                font: "Calibri" 
              }),
            ],
            spacing: { after: 200 },
          }),

          ...(multiFolioTable && multiFolioTable.length > 0 ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Folio #", bold: true, size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Company", bold: true, size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Shares", bold: true, size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Certs", bold: true, size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Scripts / Distinctive #", bold: true, size: 20 })] })] }),
                  ]
                }),
                ...multiFolioTable.map((item: any) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.folio || ''), size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.company || ''), size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.shares || ''), size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.certificates || ''), size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.scripts || ''), size: 20 })] })] }),
                  ]
                }))
              ]
            }),
            new Paragraph({ spacing: { after: 150 } })
          ] : []),

          // Position A: After Received Documents
          ...(scrutinyPosition === 'after_received' ? scrutinyParagraphs : []),

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
            spacing: { after: 150 },
          }),

          // 6. Required Documents List (In exact user-defined sequence & position)
          ...requiredDocs.flatMap((item: string, idx: number) => {
            const isSuccession = item.toLowerCase().includes('succession certificate');
            if (isSuccession) {
              return [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true, size: 21, font: "Calibri" }),
                    new TextRun({ text: "Succession Certificate:", bold: true, underline: {}, size: 21, font: "Calibri" }),
                  ],
                  spacing: { before: 100, after: 60 },
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
                  spacing: { after: 40 },
                  indent: { left: 700 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "OR", bold: true, size: 20, font: "Calibri" }),
                  ],
                  spacing: { after: 40 },
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
                  spacing: { after: 100 },
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
                spacing: { after: 80 },
                indent: { left: 400 },
              })
            ];
          }),

          // Position C: After Required Documents (Recommended default)
          ...(scrutinyPosition === 'after_required' ? scrutinyParagraphs : []),

          // 8. Closing Reminder Note
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Please ensure that details such as company name, folio number and number of shares are clearly mentioned on the Succession Certificate. Should you have any query, feel free to coordinate with us.", 
                size: 20, 
                font: "Calibri" 
              }),
            ],
            spacing: { before: 150, after: 300 },
          }),

          // Position D: At End Before Signoff
          ...(scrutinyPosition === 'at_end' ? scrutinyParagraphs : []),

          // 9. Signoff
          new Paragraph({
            children: [
              new TextRun({ text: "Regards,", size: 21, font: "Calibri" }),
            ],
            spacing: { after: 450 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Authorized Signatory\t\t\t\t\t\tAuthorized Signatory", bold: true, size: 21, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "CDC Share Registrar Services Limited", bold: true, color: "0B2B5E", size: 21, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Encl.: As stated above.", size: 18, italics: true, font: "Calibri" }),
            ],
            spacing: { before: 100 },
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="CDCSR_Transmission_Letter_${companyName.split(' ')[0]}_Folio_${foliosStr.replace(/[^0-9]/g, '_')}.docx"`
      }
    });

  } catch (error) {
    console.error('Error generating official transmission docx:', error);
    return NextResponse.json({ error: 'Failed to generate Word document' }, { status: 500 });
  }
}
