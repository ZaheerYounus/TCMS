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
  BorderStyle,
  convertInchesToTwip
} from "docx";

// Helper to trigger browser file download
export async function downloadDocxBlob(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
};

// Common header: Reference No (Left) and Date (Right)
function makeHeaderTable(refNo: string, date: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                children: [new TextRun({ text: refNo, bold: true, font: "Calibri", size: 21 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: date, font: "Calibri", size: 21 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Common Dual Signatories footer table
function makeSignatoriesTable(signatory1 = "Authorized Signatory", signatory2 = "Authorized Signatory") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { before: 700, after: 80 },
                children: [
                  new TextRun({ 
                    text: "____________________________________", 
                    color: "64748B",
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: signatory1, bold: true, font: "Calibri", size: 20 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 700, after: 80 },
                children: [
                  new TextRun({ 
                    text: "____________________________________", 
                    color: "64748B",
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: signatory2, bold: true, font: "Calibri", size: 20 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

/* =========================================================================
   1. EXPORT: DELIVERY OF SHARES
   ========================================================================= */
export async function exportSharesDeliveryDocx(data: {
  refNo: string;
  date: string;
  recipientName: string;
  recipientAddress: string;
  recipientContact?: string;
  company: string;
  deceased: string;
  folio: string;
  certificatesCount: string;
  totalShares: string;
  heirRows: Array<{ folio: string; name: string; shares: string }>;
  signatory1?: string;
  signatory2?: string;
}) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: [
          makeHeaderTable(data.refNo, data.date),

          // Recipient Address
          new Paragraph({ spacing: { before: 240, after: 40 }, children: [new TextRun({ text: data.recipientName, bold: true, font: "Calibri", size: 22 })] }),
          ...data.recipientAddress.split("\n").filter(Boolean).map(line => 
            new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: line, font: "Calibri", size: 21 })] })
          ),
          ...(data.recipientContact ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Contact # ${data.recipientContact}`, font: "Calibri", size: 20, color: "334155" })] })] : []),

          // Subject Block
          new Paragraph({ spacing: { before: 180, after: 40 }, children: [new TextRun({ text: "Dear Sir / Madam,", font: "Calibri", size: 22 })] }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: data.company.toUpperCase(), bold: true, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "TRANSMISSION OF SHARES", bold: true, underline: {}, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `${data.deceased} - Folio # ${data.folio}`, bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          // Body text
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `We are pleased to forward herewith ${data.certificatesCount} Share Certificate(s) of ${data.company} totaling ${data.totalShares} shares duly transmitted / transferred in the name of following legal heirs, details are as follows:`,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Table of Legal Heirs
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "S.No", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Folio #", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Name of Legal Heir", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "No. of Shares", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                ],
              }),
              ...data.heirRows.map((row, idx) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: "Calibri", size: 20 })] })],
                    }),
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ children: [new TextRun({ text: row.folio, font: "Calibri", size: 20 })] })],
                    }),
                    new TableCell({
                      width: { size: 45, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ children: [new TextRun({ text: row.name, font: "Calibri", size: 20 })] })],
                    }),
                    new TableCell({
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: row.shares, font: "Calibri", size: 20 })] })],
                    }),
                  ],
                })
              ),
              // Total Row
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 80, type: WidthType.PERCENTAGE },
                    columnSpan: 3,
                    borders: cellBorder,
                    shading: { fill: "F8FAFC" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Total Shares:", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F8FAFC" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.totalShares, bold: true, font: "Calibri", size: 20 })] })],
                  }),
                ],
              }),
            ],
          }),

          // Acknowledgement Instruction
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: "Kindly acknowledge receipt of the Share Certificates by signing and returning the duplicate copy of this letter.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: "Should you have any queries, feel free to coordinate with us.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Signatures
          new Paragraph({
            spacing: { before: 180, after: 40 },
            children: [
              new TextRun({ text: "Yours faithfully,", font: "Calibri", size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "For CDC Share Registrar Services Limited", bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          makeSignatoriesTable(data.signatory1, data.signatory2),
        ],
      },
    ],
  });

  const filename = `CDCSR_Delivery_of_Shares_${data.folio || "Shares"}.docx`;
  await downloadDocxBlob(doc, filename);
}

/* =========================================================================
   2. EXPORT: DELIVERY OF CHEQUES
   ========================================================================= */
export async function exportChequesDeliveryDocx(data: {
  refNo: string;
  date: string;
  recipientName: string;
  recipientAddress: string;
  recipientContact?: string;
  company: string;
  deceased: string;
  folio: string;
  totalAmount: string;
  chequeRows: Array<{ beneficiary: string; instrumentNo: string; amount: string }>;
  signatory1?: string;
  signatory2?: string;
}) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: [
          makeHeaderTable(data.refNo, data.date),

          // Recipient Address
          new Paragraph({ spacing: { before: 240, after: 40 }, children: [new TextRun({ text: data.recipientName, bold: true, font: "Calibri", size: 22 })] }),
          ...data.recipientAddress.split("\n").filter(Boolean).map(line => 
            new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: line, font: "Calibri", size: 21 })] })
          ),
          ...(data.recipientContact ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Contact # ${data.recipientContact}`, font: "Calibri", size: 20, color: "334155" })] })] : []),

          // Subject Block
          new Paragraph({ spacing: { before: 180, after: 40 }, children: [new TextRun({ text: "Dear Sir / Madam,", font: "Calibri", size: 22 })] }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: data.company.toUpperCase(), bold: true, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "DELIVERY OF BANKER'S CHEQUES (UNPAID DIVIDENDS)", bold: true, underline: {}, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `${data.deceased} - Folio # ${data.folio}`, bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          // Body text
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `We are pleased to enclose herewith following Banker's Cheque(s) on account of unpaid dividend(s) pertaining to the captioned deceased shareholder, issued in favor of legal heirs as per their entitlement:`,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Table of Cheques
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "S.No", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Beneficiary / Legal Heir Name", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Instrument / Cheque #", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F1F5F9" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Amount (PKR)", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                ],
              }),
              ...data.chequeRows.map((row, idx) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: "Calibri", size: 20 })] })],
                    }),
                    new TableCell({
                      width: { size: 40, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ children: [new TextRun({ text: row.beneficiary, font: "Calibri", size: 20 })] })],
                    }),
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ children: [new TextRun({ text: row.instrumentNo, font: "Calibri", size: 20 })] })],
                    }),
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      borders: cellBorder,
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: row.amount, font: "Calibri", size: 20 })] })],
                    }),
                  ],
                })
              ),
              // Total Row
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    columnSpan: 3,
                    borders: cellBorder,
                    shading: { fill: "F8FAFC" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Total Dividend Amount (PKR):", bold: true, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: cellBorder,
                    shading: { fill: "F8FAFC" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.totalAmount, bold: true, font: "Calibri", size: 20 })] })],
                  }),
                ],
              }),
            ],
          }),

          // Zero Balance Note
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: "Please note that with the dispatch of above banker's cheques, all unpaid dividends lying against the subject folio have been fully settled and paid, and no further dividend remains outstanding.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: "Kindly acknowledge receipt by returning the duplicate counterfoil copy of this letter duly signed.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Signatures
          new Paragraph({
            spacing: { before: 180, after: 40 },
            children: [
              new TextRun({ text: "Yours faithfully,", font: "Calibri", size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "For CDC Share Registrar Services Limited", bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          makeSignatoriesTable(data.signatory1, data.signatory2),
        ],
      },
    ],
  });

  const filename = `CDCSR_Delivery_of_Cheques_${data.folio || "Cheques"}.docx`;
  await downloadDocxBlob(doc, filename);
}

/* =========================================================================
   3. EXPORT: PHYSICAL APPROVAL LETTER TO COMPANY SECRETARY
   ========================================================================= */
export async function exportPhysicalApprovalDocx(data: {
  refNo: string;
  date: string;
  company: string;
  companyAddress: string;
  deceased: string;
  folio: string;
  certificatesCount: string;
  totalShares: string;
  transferRegisterPages: string;
  transferReceipts: Array<{ receiptNo: string; name: string }>;
  includeLoss: boolean;
  lossReceiptNo?: string;
  lossRegisterPages?: string;
  includeSplit: boolean;
  splitReceiptNo?: string;
  splitRegisterPages?: string;
  approvalRemarks?: string;
  signatory1?: string;
  signatory2?: string;
}) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: [
          makeHeaderTable(data.refNo, data.date),

          // Addressee: Company Secretary
          new Paragraph({ spacing: { before: 240, after: 40 }, children: [new TextRun({ text: "The Company Secretary", bold: true, font: "Calibri", size: 22 })] }),
          new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: data.company, bold: true, font: "Calibri", size: 22 })] }),
          ...data.companyAddress.split("\n").filter(Boolean).map(line => 
            new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: line, font: "Calibri", size: 21 })] })
          ),

          // Subject Block
          new Paragraph({ spacing: { before: 180, after: 40 }, children: [new TextRun({ text: "Dear Sir / Madam,", font: "Calibri", size: 22 })] }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: data.company.toUpperCase(), bold: true, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "APPROVAL OF TRANSMISSION / TRANSFER OF SHARES", bold: true, underline: {}, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `${data.deceased} - Folio # ${data.folio}`, bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          // Body paragraph 1
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `We refer to the transmission case in respect of the above deceased shareholder. In this regard, we are pleased to enclose herewith ${data.certificatesCount} Share Certificate(s) for ${data.totalShares} shares along with the relevant Transfer Register${data.includeLoss ? ", Loss Register" : ""}${data.includeSplit ? ", Split Register" : ""} and other supporting documents being forwarded to you for approval of transfers thereon by the Directors / Authorized Signatories.`,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Details Header
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: "The details of transfers and registers sent to you are given below:", bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          // Receipts & Registers summary
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "• No. of Transfer Receipt(s): ", bold: true, font: "Calibri", size: 21 }),
              new TextRun({ text: `${String(data.transferReceipts.length).padStart(2, "0")}`, font: "Calibri", size: 21 }),
            ],
          }),
          ...data.transferReceipts.map(r => 
            new Paragraph({
              indent: { left: convertInchesToTwip(0.3) },
              spacing: { after: 30 },
              children: [
                new TextRun({ text: `Transfer Receipt # : ${r.receiptNo} `, bold: true, font: "Calibri", size: 20 }),
                new TextRun({ text: `(in the name of ${r.name})`, font: "Calibri", size: 20 }),
              ],
            })
          ),
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [
              new TextRun({ text: "• Transfer Register Page(s): ", bold: true, font: "Calibri", size: 21 }),
              new TextRun({ text: data.transferRegisterPages, font: "Calibri", size: 21 }),
            ],
          }),

          // Optional Loss Register Details
          ...(data.includeLoss ? [
            new Paragraph({
              spacing: { before: 60, after: 40 },
              children: [
                new TextRun({ text: "• Loss Receipt # : ", bold: true, font: "Calibri", size: 21 }),
                new TextRun({ text: `${data.lossReceiptNo || "LR-01"}`, font: "Calibri", size: 21 }),
              ],
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: "• Loss Register Page(s): ", bold: true, font: "Calibri", size: 21 }),
                new TextRun({ text: `${data.lossRegisterPages || "02 (02 Copies)"}`, font: "Calibri", size: 21 }),
              ],
            }),
          ] : []),

          // Optional Split Register Details
          ...(data.includeSplit ? [
            new Paragraph({
              spacing: { before: 60, after: 40 },
              children: [
                new TextRun({ text: "• Split Receipt # : ", bold: true, font: "Calibri", size: 21 }),
                new TextRun({ text: `${data.splitReceiptNo || "SR-01"}`, font: "Calibri", size: 21 }),
              ],
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: "• Split Register Page(s): ", bold: true, font: "Calibri", size: 21 }),
                new TextRun({ text: `${data.splitRegisterPages || "02 (02 Copies)"}`, font: "Calibri", size: 21 }),
              ],
            }),
          ] : []),

          // Required Actions from Company
          new Paragraph({
            spacing: { before: 160, after: 60 },
            children: [
              new TextRun({ text: "Following actions are requested for approval of the above transmission:", bold: true, font: "Calibri", size: 21 }),
            ],
          }),
          ...(data.includeLoss ? [
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: "1. Authorized Signatory's signatures on the face of duplicate share certificate(s).", font: "Calibri", size: 21 }),
              ],
            }),
          ] : []),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${data.includeLoss ? "2." : "1."} Authorized Signatory's signatures on the Memorandum of Transfers (on the back of each share certificate).`, font: "Calibri", size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${data.includeLoss ? "3." : "2."} Authorized Signatory's signature on the Transfer Register${data.includeLoss ? " & Loss Register" : ""}${data.includeSplit ? " & Split Register" : ""}.`, font: "Calibri", size: 21 }),
            ],
          }),

          // Closing Request
          new Paragraph({
            spacing: { before: 140, after: 120 },
            children: [
              new TextRun({
                text: "After approval of transfer / transmission of shares as requested above, kindly arrange to return transfer registers along with share certificates / documents related to this transmission case to enable us to complete the dispatch.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: "Further, please arrange to check whether any dividend warrant(s) pertaining to above deceased shareholder is/are still unpaid; if so, please arrange to issue cheque(s) / online payment in favor of above legal heirs as per their entitlement.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Signatures
          new Paragraph({
            spacing: { before: 180, after: 40 },
            children: [
              new TextRun({ text: "Yours faithfully,", font: "Calibri", size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "For CDC Share Registrar Services Limited", bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          makeSignatoriesTable(data.signatory1, data.signatory2),
        ],
      },
    ],
  });

  const filename = `CDCSR_Physical_Approval_${data.folio || "Approval"}.docx`;
  await downloadDocxBlob(doc, filename);
}

/* =========================================================================
   4. EXPORT: CDS ACCOUNT LETTER
   ========================================================================= */
export async function exportCdsAccountDocx(data: {
  refNo: string;
  date: string;
  recipientName: string;
  recipientAddress: string;
  recipientContact?: string;
  company: string;
  deceased: string;
  cdsAccountNo: string;
  receivedDocs: string[];
  requiredDocs: string[];
  accountStatusRemarks: string;
  signatory1?: string;
  signatory2?: string;
}) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: [
          makeHeaderTable(data.refNo, data.date),

          // Recipient Address
          new Paragraph({ spacing: { before: 240, after: 40 }, children: [new TextRun({ text: data.recipientName, bold: true, font: "Calibri", size: 22 })] }),
          ...data.recipientAddress.split("\n").filter(Boolean).map(line => 
            new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: line, font: "Calibri", size: 21 })] })
          ),
          ...(data.recipientContact ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Contact # ${data.recipientContact}`, font: "Calibri", size: 20, color: "334155" })] })] : []),

          // Subject Block
          new Paragraph({ spacing: { before: 180, after: 40 }, children: [new TextRun({ text: "Dear Sir / Madam,", font: "Calibri", size: 22 })] }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: data.company.toUpperCase(), bold: true, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "TRANSMISSION OF SHARES UNDER CDS ACCOUNT", bold: true, underline: {}, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `${data.deceased} - CDS Account # ${data.cdsAccountNo}`, bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          // Paragraph 1: Acknowledged Documents Received
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: "We refer to your application regarding the captioned subject and acknowledge the receipt of the following documents submitted by you:",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),
          ...data.receivedDocs.map(docItem =>
            new Paragraph({
              indent: { left: convertInchesToTwip(0.3) },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `• ${docItem}`, font: "Calibri", size: 21 }),
              ],
            })
          ),

          // CDS Status Remarks
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: data.accountStatusRemarks,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Documents Required / Pending Formalities
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({
                text: "In order to proceed with the transmission of book-entry securities under the Central Depository System (CDS), following formalities are still required:",
                bold: true,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),
          ...data.requiredDocs.map((reqItem, i) =>
            new Paragraph({
              indent: { left: convertInchesToTwip(0.3) },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${i + 1}. ${reqItem}`, font: "Calibri", size: 21 }),
              ],
            })
          ),

          // Standard Closing
          new Paragraph({
            spacing: { before: 160, after: 140 },
            children: [
              new TextRun({
                text: "Should you have any queries or require further guidance, feel free to coordinate with us.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Signatures
          new Paragraph({
            spacing: { before: 180, after: 40 },
            children: [
              new TextRun({ text: "Yours faithfully,", font: "Calibri", size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "For CDC Share Registrar Services Limited", bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          makeSignatoriesTable(data.signatory1, data.signatory2),
        ],
      },
    ],
  });

  const filename = `CDCSR_CDS_Account_${data.cdsAccountNo.replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
  await downloadDocxBlob(doc, filename);
}

/* =========================================================================
   5. EXPORT: NO FOLIO FOUND LETTER
   ========================================================================= */
export async function exportNoFolioFoundDocx(data: {
  refNo: string;
  date: string;
  recipientName: string;
  lawFirm?: string;
  recipientAddress: string;
  recipientContact?: string;
  deceasedName: string;
  deceasedCnic?: string;
  receivedDocs: string[];
  searchRemarks: string;
  evidenceRequest: string;
  signatory1?: string;
  signatory2?: string;
}) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: [
          makeHeaderTable(data.refNo, data.date),

          // Recipient Address
          new Paragraph({ spacing: { before: 240, after: 40 }, children: [new TextRun({ text: data.recipientName, bold: true, font: "Calibri", size: 22 })] }),
          ...(data.lawFirm ? [new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: data.lawFirm, bold: true, font: "Calibri", size: 21 })] })] : []),
          ...data.recipientAddress.split("\n").filter(Boolean).map(line => 
            new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: line, font: "Calibri", size: 21 })] })
          ),
          ...(data.recipientContact ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Contact # ${data.recipientContact}`, font: "Calibri", size: 20, color: "334155" })] })] : []),

          // Subject Block
          new Paragraph({ spacing: { before: 180, after: 40 }, children: [new TextRun({ text: "Dear Sir / Madam,", font: "Calibri", size: 22 })] }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: "TRANSMISSION OF SHARES", bold: true, underline: {}, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: data.deceasedName, bold: true, font: "Calibri", size: 21 }),
              ...(data.deceasedCnic ? [new TextRun({ text: ` (CNIC # ${data.deceasedCnic})`, font: "Calibri", size: 20 })] : []),
            ],
          }),

          // Paragraph 1: Acknowledgment
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: "We refer to your letter regarding the captioned subject and acknowledge the receipt of following documents:",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),
          ...data.receivedDocs.map(docItem =>
            new Paragraph({
              indent: { left: convertInchesToTwip(0.3) },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `• ${docItem}`, font: "Calibri", size: 21 }),
              ],
            })
          ),

          // Search remarks
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: data.searchRemarks,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Evidence request
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: data.evidenceRequest,
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Closing
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: "Should you have any query, feel free to coordinate with us.",
                font: "Calibri",
                size: 21,
              }),
            ],
          }),

          // Signatures
          new Paragraph({
            spacing: { before: 180, after: 40 },
            children: [
              new TextRun({ text: "Yours faithfully,", font: "Calibri", size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "For CDC Share Registrar Services Limited", bold: true, font: "Calibri", size: 21 }),
            ],
          }),

          makeSignatoriesTable(data.signatory1, data.signatory2),
        ],
      },
    ],
  });

  const filename = `CDCSR_No_Folio_Found_${data.deceasedName.replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
  await downloadDocxBlob(doc, filename);
}
