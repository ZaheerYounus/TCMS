const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'src', 'data');

console.log('Re-building high-precision MIS and Transmission data...');

function excelDateToISO(serial) {
  if (!serial) return '';
  if (typeof serial === 'string') {
    const s = serial.trim();
    if (s.includes('-') || s.includes('/') || s.includes('.')) return s;
    const num = Number(s);
    if (!isNaN(num) && num > 20000 && num < 60000) serial = num;
    else return s;
  }
  if (typeof serial === 'number') {
    if (serial < 10000 || serial > 100000) return String(serial);
    try {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      if (isNaN(date_info.getTime())) return String(serial);
      return date_info.toISOString().split('T')[0];
    } catch {
      return String(serial);
    }
  }
  return String(serial);
}

// 1. Process MIS
const wbMis = XLSX.readFile(path.join(baseDir, 'MIS - Transmission.xlsx'));
const transSheet = wbMis.Sheets['Transmission'];
const transRows = XLSX.utils.sheet_to_json(transSheet, { header: 1 });

const misRecords = [];
let closedCount = 0;
let pendingCount = 0;
let waitingLegalHeirsCount = 0;
let coSigningCount = 0;
let inTransferCount = 0;
let coApprovalCount = 0;

for (let i = 1; i < transRows.length; i++) {
  const r = transRows[i];
  if (!r) continue;
  const company = (r[1] || 'Unknown Company').toString().trim();
  const folio = (r[2] !== undefined && r[2] !== null) ? String(r[2]).trim() : '';
  const deceased = (r[3] || '').toString().trim();
  const legalHeir = (r[4] || '').toString().trim();

  // All 23 authentic columns & chronological dates
  const reqRecDate = excelDateToISO(r[5]);
  const formSentDate = excelDateToISO(r[6]);
  const formRecDate = excelDateToISO(r[7]);
  const formSentAgain1 = excelDateToISO(r[8]);
  const formRecAgain1 = excelDateToISO(r[9]);
  const formSentAgain2 = excelDateToISO(r[10]);
  const formRecAgain2 = excelDateToISO(r[11]);
  const fwdCompDate = excelDateToISO(r[12]);
  const appRecDate = excelDateToISO(r[13]);
  const fwdTransDate = excelDateToISO(r[14]);
  const recTransDate = excelDateToISO(r[15]);
  const physAppFwdComp = excelDateToISO(r[16]);
  const sharesRecComp = excelDateToISO(r[17]);
  const sharesFwdDate = excelDateToISO(r[18]);
  const chqRecComp = excelDateToISO(r[19]);
  const chqFwdLegalHeir = excelDateToISO(r[20]);
  
  let rawStatus = (r[21] || r[22] || 'Under Process').toString().trim();
  const sLower = rawStatus.toLowerCase();

  // Unified Classification: Both 'Case Closed' and 'Partially Case Closed' mean shares have been transmitted!
  const isSharesTransmittedClosed = sLower.includes('closed');

  if (isSharesTransmittedClosed) {
    closedCount++;
  } else if (sLower.includes('waiting') || sLower.includes('awaiting')) {
    waitingLegalHeirsCount++;
  } else if (sLower.includes('signing')) {
    coSigningCount++;
  } else if (sLower.includes('transfer')) {
    inTransferCount++;
  } else if (sLower.includes('review') || sLower.includes('approval')) {
    coApprovalCount++;
  } else {
    pendingCount++;
  }

  const remarks = (r[22] || '').toString().trim();
  const caseId = `TR-${String(i).padStart(6, '0')}`;

  misRecords.push({
    caseId,
    company,
    folio,
    deceased,
    legalHeir,
    reqRecDate,
    formSentDate,
    formRecDate,
    formSentAgain1,
    formRecAgain1,
    formSentAgain2,
    formRecAgain2,
    fwdCompDate,
    appRecDate,
    fwdTransDate,
    recTransDate,
    physAppFwdComp,
    sharesRecComp,
    sharesFwdDate,
    chqRecComp,
    chqFwdLegalHeir,
    status: rawStatus,
    isClosed: isSharesTransmittedClosed,
    remarks
  });
}

console.log(`Total MIS cases: ${misRecords.length}`);
console.log(`Total Closed (Shares Transmitted): ${closedCount}`);
console.log(`Waiting Legal Heirs: ${waitingLegalHeirsCount}`);
console.log(`Co. - Signing: ${coSigningCount}`);
console.log(`In Transfer: ${inTransferCount}`);
console.log(`Co. Approval: ${coApprovalCount}`);
console.log(`Pending / Under Review: ${pendingCount}`);

fs.writeFileSync(path.join(outDir, 'misRecords.json'), JSON.stringify(misRecords));
fs.writeFileSync(path.join(outDir, 'misSummary.json'), JSON.stringify({
  totalCases: misRecords.length,
  totalClosed: closedCount,
  waitingLegalHeirs: waitingLegalHeirsCount,
  coSigning: coSigningCount,
  inTransfer: inTransferCount,
  coApproval: coApprovalCount,
  pendingReview: pendingCount,
}));

console.log('Re-compiled high-precision misRecords.json and misSummary.json successfully!');
