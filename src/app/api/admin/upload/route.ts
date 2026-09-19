import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const targetType = (formData.get('targetType') as string) || 'mis'; // 'mis' | 'filing' | 'daily'
    const mode = (formData.get('mode') as string) || 'merge'; // 'merge' | 'replace'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: 'Uploaded file contains no data rows.' }, { status: 400 });
    }

    const nowStr = new Date().toISOString().split('T')[0];

    // TARGET 1: MIS RECORDS (Transmission Master Database)
    if (targetType === 'mis') {
      const recordsPath = path.join(process.cwd(), 'src', 'data', 'misRecords.json');
      const summaryPath = path.join(process.cwd(), 'src', 'data', 'misSummary.json');

      let existingRecords: any[] = [];
      if (fs.existsSync(recordsPath) && mode === 'merge') {
        try {
          existingRecords = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
        } catch (e) {
          existingRecords = [];
        }
      }

      // Map rows to canonical MIS record structure
      const parsedRecords: any[] = rawRows.map((row, idx) => {
        const folio = String(row['Folio'] || row['Folio #'] || row['folio'] || row['FOLIO'] || '').trim();
        const company = String(row['Company'] || row['Company Name'] || row['company'] || row['COMP'] || 'CDCSR Client Company').trim();
        const deceased = String(row['Deceased'] || row['Deceased Shareholder'] || row['Shareholder'] || row['deceased'] || '').trim();
        const legalHeir = String(row['Legal Heir'] || row['Applicant'] || row['legalHeir'] || '').trim();
        const status = String(row['Status'] || row['Case Status'] || row['status'] || 'Waiting').trim();
        const remarks = String(row['Remarks'] || row['remarks'] || row['Notes'] || '').trim();
        const formSentDate = String(row['Form Sent Date'] || row['formSentDate'] || row['Letter Date'] || '').trim();
        const formRecDate = String(row['Form Rec Date'] || row['formRecDate'] || '').trim();

        const sLower = status.toLowerCase();
        let statusCode = 'WAITING';
        let isClosed = false;

        if (sLower.includes('closed') || sLower.includes('complete')) {
          statusCode = 'CLOSED';
          isClosed = true;
        } else if (sLower.includes('pending')) {
          statusCode = 'PENDING';
        } else if (sLower.includes('signing')) {
          statusCode = 'CO_SIGNING';
        } else if (sLower.includes('approval') || sLower.includes('review')) {
          statusCode = 'CO_APPROVAL';
        } else if (sLower.includes('transfer')) {
          statusCode = 'IN_TRANSFER';
        } else if (sLower.includes('dividend')) {
          statusCode = 'CO_DIVIDEND';
        } else if (sLower.includes('partially')) {
          statusCode = 'PARTIALLY_CLOSED';
        }

        return {
          caseId: row['Case ID'] || row['caseId'] || `TR-${String(idx + 1).padStart(6, '0')}`,
          company,
          folio,
          deceased,
          legalHeir,
          status,
          statusCode,
          isClosed,
          reqRecDate: String(row['Req Rec Date'] || row['reqRecDate'] || ''),
          formSentDate,
          formRecDate,
          fwdCompDate: String(row['Fwd Comp Date'] || row['fwdCompDate'] || ''),
          appRecDate: String(row['App Rec Date'] || row['appRecDate'] || ''),
          remarks,
          workedThisMonth: row['Worked This Month'] === true || row['Worked This Month'] === 'true' || row['workedThisMonth'] === true || false
        };
      }).filter(r => r.folio);

      let finalRecords: any[] = [];
      if (mode === 'merge') {
        const existingMap = new Map<string, any>();
        existingRecords.forEach(r => existingMap.set(`${String(r.folio).trim()}_${String(r.company).trim().toLowerCase()}`, r));
        parsedRecords.forEach(r => existingMap.set(`${String(r.folio).trim()}_${String(r.company).trim().toLowerCase()}`, r));
        finalRecords = Array.from(existingMap.values());
      } else {
        finalRecords = parsedRecords;
      }

      // Compute updated summary
      let pending = 0, waitingLegalHeirs = 0, coSigning = 0, coApproval = 0, inTransfer = 0, coDividend = 0, totalClosed = 0, partiallyClosed = 0, workedThisMonth = 0;
      const compStats: Record<string, any> = {};

      for (const r of finalRecords) {
        if (r.workedThisMonth) workedThisMonth++;
        const s = (r.status || '').toLowerCase();
        if (s.includes('closed')) totalClosed++;
        else if (s.includes('partially')) partiallyClosed++;
        else if (s.includes('signing')) coSigning++;
        else if (s.includes('approval') || s.includes('review')) coApproval++;
        else if (s.includes('transfer')) inTransfer++;
        else if (s.includes('dividend')) coDividend++;
        else if (s.includes('pending')) pending++;
        else waitingLegalHeirs++;

        const comp = r.company || 'CDCSR Client Company';
        if (!compStats[comp]) compStats[comp] = { company: comp, total: 0, closed: 0, pending: 0, waiting: 0, coApproval: 0, coSigning: 0, inTransfer: 0, partiallyClosed: 0, workedThisMonth: 0 };
        compStats[comp].total++;
        if (s.includes('closed')) compStats[comp].closed++;
        else if (s.includes('pending')) compStats[comp].pending++;
        else compStats[comp].waiting++;
      }

      const summary = {
        totalCases: finalRecords.length,
        pending,
        waitingLegalHeirs,
        coSigning,
        coApproval,
        inTransfer,
        coDividend,
        totalClosed,
        partiallyClosed,
        workedThisMonth,
        companyMisSummary: Object.values(compStats).sort((a: any, b: any) => b.total - a.total)
      };

      fs.writeFileSync(recordsPath, JSON.stringify(finalRecords), 'utf-8');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

      // Update companies list automatically
      const companiesPath = path.join(process.cwd(), 'src', 'data', 'companies.json');
      const companiesSet = new Set<string>();
      finalRecords.forEach(r => { if (r.company) companiesSet.add(r.company.trim()); });
      fs.writeFileSync(companiesPath, JSON.stringify(Array.from(companiesSet).sort(), null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        targetType: 'mis',
        mode,
        recordsProcessed: parsedRecords.length,
        totalRecords: finalRecords.length,
        summary
      });
    }

    // TARGET 2: PHYSICAL FILING ARCHIVE
    if (targetType === 'filing') {
      const recordsPath = path.join(process.cwd(), 'src', 'data', 'filingRecords.json');
      const summaryPath = path.join(process.cwd(), 'src', 'data', 'filingRecordsSummary.json');

      const parsedFiling: any[] = rawRows.map((row, idx) => ({
        sNo: String(row['S No'] || row['sNo'] || idx + 1),
        folio: String(row['Folio'] || row['Folio #'] || row['folio'] || '').trim(),
        company: String(row['Company'] || row['Company Name'] || row['company'] || 'CDCSR Issuer').trim(),
        letterDate: String(row['Letter Date'] || row['letterDate'] || nowStr),
        deceased: String(row['Deceased'] || row['Shareholder'] || row['deceased'] || '').trim(),
        fileNo: String(row['File #'] || row['File No'] || row['fileNo'] || 'BOX-01').trim(),
        officer: String(row['Officer'] || row['officer'] || 'ZA').trim(),
        remarks: String(row['Remarks'] || row['remarks'] || '').trim()
      })).filter(r => r.folio);

      let finalFiling = parsedFiling;
      if (mode === 'merge' && fs.existsSync(recordsPath)) {
        try {
          const old = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
          const map = new Map<string, any>();
          old.forEach((r: any) => map.set(`${r.folio}_${r.fileNo}`, r));
          parsedFiling.forEach(r => map.set(`${r.folio}_${r.fileNo}`, r));
          finalFiling = Array.from(map.values());
        } catch (e) {}
      }

      // Group into file capacities
      const folderMap = new Map<string, any[]>();
      for (const r of finalFiling) {
        const fn = r.fileNo || 'UNASSIGNED';
        if (!folderMap.has(fn)) folderMap.set(fn, []);
        folderMap.get(fn)!.push(r);
      }

      const fileCapacities = Array.from(folderMap.entries()).map(([fileNo, cases]) => ({
        fileNo,
        company: cases[0]?.company || 'General',
        capacity: 50,
        currentCases: cases.length,
        cases
      }));

      const summary = {
        totalFilingRecords: finalFiling.length,
        totalPhysicalFiles: fileCapacities.length,
        capacityLimit: 50,
        fileCapacities
      };

      fs.writeFileSync(recordsPath, JSON.stringify(finalFiling), 'utf-8');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        targetType: 'filing',
        mode,
        recordsProcessed: parsedFiling.length,
        totalRecords: finalFiling.length,
        totalPhysicalFiles: fileCapacities.length
      });
    }

    return NextResponse.json({ error: 'Unsupported target type' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin upload error:', err);
    return NextResponse.json({ error: err.message || 'File processing failed' }, { status: 500 });
  }
}
