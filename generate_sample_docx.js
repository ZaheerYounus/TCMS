const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "CDC SHARE REGISTRAR SERVICES LIMITED",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: "TRANSMISSION OF SHARES",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun(`Date: ${new Date().toLocaleDateString()}`),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "To the Legal Heirs of: ", bold: true }),
          new TextRun("Late SM Ferozuddin"),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Company: ", bold: true }),
          new TextRun("ABC Limited"),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Folio No(s): ", bold: true }),
          new TextRun("240920"),
        ],
      }),
      new Paragraph({
        text: "Subject: Formalities required for Transmission of Shares",
        bold: true,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: "Dear Sir/Madam,",
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: "With reference to the intimation of demise of the above-named shareholder, we request you to kindly complete and submit the following formalities to process the transmission of shares:",
        spacing: { after: 200 },
      }),
      new Paragraph({ text: "1. Death Certificate", bullet: { level: 0 } }),
      new Paragraph({ text: "2. Succession Certificate", bullet: { level: 0 } }),
      new Paragraph({ text: "3. CNIC Copies", bullet: { level: 0 } }),
      new Paragraph({
        text: "Upon receipt of the above documents, we shall proceed with the transmission process.",
        spacing: { before: 400, after: 400 },
      }),
      new Paragraph({
        text: "Yours truly,",
      }),
      new Paragraph({
        text: "CDC Share Registrar Services Limited",
        bold: true,
      })
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('../Sample_Transmission_Letter.docx', buffer);
  console.log('Document created successfully');
});
