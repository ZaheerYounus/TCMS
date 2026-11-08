const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = path.resolve(__dirname, '..');

function inspectFile(filename) {
  const filePath = path.join(baseDir, filename);
  console.log(`\n=== Inspecting: ${filename} ===`);
  try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`Sheet "${name}" has ${rows.length} rows.`);
      if (rows.length > 0) {
        console.log('Header Row:', rows[0]);
        if (rows.length > 1) {
          console.log('Sample Row 1:', rows[1]);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
  }
}

inspectFile('Client List.xlsb');
inspectFile('MIS - Transmission.xlsx');
inspectFile('Transmission Case Filing - Final Backup Version.xlsb');
