import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedFilingSummary: any = null;
let cachedFilingRecords: any[] | null = null;
let filingFolioIndex = new Map<string, any[]>();
let filingFolderMap = new Map<string, any[]>();

function initFilingData() {
  if (cachedFilingSummary && cachedFilingRecords && cachedFilingSummary.capacityLimit === 50 && Array.isArray(cachedFilingSummary.fileCapacities)) return;
  try {
    filingFolioIndex.clear();
    filingFolderMap.clear();
    const summaryPath = path.join(process.cwd(), 'src', 'data', 'filingRecordsSummary.json');
    const recordsPath = path.join(process.cwd(), 'src', 'data', 'filingRecords.json');

    if (fs.existsSync(summaryPath)) {
      cachedFilingSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    } else {
      cachedFilingSummary = { totalFilingRecords: 0, totalPhysicalFiles: 0, fileCapacities: [] };
    }

    if (fs.existsSync(recordsPath)) {
      cachedFilingRecords = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
      for (const r of (cachedFilingRecords || [])) {
        // Folio index
        const fKey = String(r.folio).toLowerCase().trim();
        if (!filingFolioIndex.has(fKey)) filingFolioIndex.set(fKey, []);
        filingFolioIndex.get(fKey)!.push(r);

        // Folder ID index
        const folderKey = String(r.fileNo || 'UNASSIGNED').toUpperCase().trim();
        if (!filingFolderMap.has(folderKey)) filingFolderMap.set(folderKey, []);
        filingFolderMap.get(folderKey)!.push(r);
      }
    } else {
      cachedFilingRecords = [];
    }
  } catch (err) {
    console.error('Error reading filing data:', err);
    cachedFilingSummary = { totalFilingRecords: 0, totalPhysicalFiles: 0, fileCapacities: [] };
    cachedFilingRecords = [];
  }
}

export async function GET(req: NextRequest) {
  initFilingData();
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filter = searchParams.get('filter') || 'all';
  const company = (searchParams.get('company') || '').trim().toUpperCase();
  const inspectFile = searchParams.get('inspectFile') || '';

  // If user requested to inspect ALL real cases inside a specific physical file
  if (inspectFile) {
    const folderKey = inspectFile.toUpperCase().trim();
    const casesInFolder = filingFolderMap.get(folderKey) || [];
    return NextResponse.json({
      folderName: inspectFile,
      totalCases: casesInFolder.length,
      cases: casesInFolder,
    });
  }

  const summary = cachedFilingSummary || { totalFilingRecords: 0, totalPhysicalFiles: 0, fileCapacities: [] };
  let files: any[] = summary.fileCapacities || [];

  if (company && company !== 'ALL') {
    files = files.filter((f: any) => String(f.company).toUpperCase().includes(company));
  }

  if (filter === 'heavy' || filter === 'critical' || filter === 'full') {
    files = files.filter((f: any) => f.currentCases >= 50);
  } else if (filter === 'warning') {
    files = files.filter((f: any) => f.currentCases >= 40 && f.currentCases < 50);
  } else if (filter === 'healthy' || filter === 'available') {
    files = files.filter((f: any) => f.currentCases < 40);
  }

  let matchedRecords: any[] = [];

  if (query) {
    if (filingFolioIndex.has(query)) {
      matchedRecords = filingFolioIndex.get(query) || [];
    } else {
      const records = cachedFilingRecords || [];
      for (const r of records) {
        if (
          String(r.folio).toLowerCase().includes(query) ||
          String(r.deceased).toLowerCase().includes(query) ||
          String(r.fileNo).toLowerCase().includes(query) ||
          String(r.company).toLowerCase().includes(query)
        ) {
          matchedRecords.push(r);
          if (matchedRecords.length >= 100) break;
        }
      }
    }

    files = files.filter((f: any) => 
      String(f.fileNo).toLowerCase().includes(query) ||
      String(f.company).toLowerCase().includes(query)
    );
  }

  const allFiles = summary.fileCapacities || [];
  const criticalCount = allFiles.filter((f: any) => f.currentCases >= 50).length;
  const warningCount = allFiles.filter((f: any) => f.currentCases >= 40 && f.currentCases < 50).length;
  const healthyCount = allFiles.filter((f: any) => f.currentCases < 40).length;

  // Build comprehensive list of all companies with capacity metrics
  const companyStatsMap = new Map<string, { company: string; totalFiles: number; fullFiles: number; warningFiles: number; availableFiles: number; totalCases: number }>();
  for (const f of allFiles) {
    const c = (f.company || 'OTHER').trim();
    if (!companyStatsMap.has(c)) {
      companyStatsMap.set(c, { company: c, totalFiles: 0, fullFiles: 0, warningFiles: 0, availableFiles: 0, totalCases: 0 });
    }
    const st = companyStatsMap.get(c)!;
    st.totalFiles++;
    st.totalCases += (f.currentCases || 0);
    if (f.currentCases >= 50) st.fullFiles++;
    else if (f.currentCases >= 40) st.warningFiles++;
    else st.availableFiles++;
  }
  const companies = Array.from(companyStatsMap.values()).sort((a, b) => b.totalFiles - a.totalFiles);

  return NextResponse.json({
    totalPhysicalFiles: summary.totalPhysicalFiles,
    totalRecords: summary.totalFilingRecords,
    capacityLimit: 50,
    criticalCount,
    warningCount,
    healthyCount,
    files: files.slice(0, 200),
    matchedRecords,
    companies,
  });
}

// POST endpoint to assign new case / letter to physical file
export async function POST(req: NextRequest) {
  initFilingData();
  try {
    const { folio, company, fileNo, deceased, officer = 'ZA' } = await req.json();

    if (!folio || !fileNo) {
      return NextResponse.json({ error: 'Folio and File Number are required' }, { status: 400 });
    }

    const folderKey = String(fileNo).toUpperCase().trim();
    const summary = cachedFilingSummary;
    let targetFile: any = null;

    if (summary && summary.fileCapacities) {
      targetFile = summary.fileCapacities.find((f: any) => f.fileNo.toUpperCase().trim() === folderKey);
      // STRICT 50-CASES LIMIT VALIDATION: Prevent assignment to full folders
      if (targetFile && targetFile.currentCases >= 50) {
        return NextResponse.json({ 
          error: `Folder "${fileNo}" is already FULL (50/50 cases). Please select an available folder with remaining slots.` 
        }, { status: 400 });
      }
    }

    const records = cachedFilingRecords || [];
    const newRecord = {
      sNo: String(records.length + 1),
      folio: String(folio).trim(),
      company: company || (targetFile ? targetFile.company : 'CDCSR Issuer'),
      letterDate: new Date().toISOString().split('T')[0],
      deceased: deceased || '',
      fileNo: String(fileNo).trim(),
      officer,
      remarks: 'Filing entry assigned from Transmission system'
    };

    records.unshift(newRecord);

    // Update indexes
    const fKey = String(folio).toLowerCase().trim();
    if (!filingFolioIndex.has(fKey)) filingFolioIndex.set(fKey, []);
    filingFolioIndex.get(fKey)!.unshift(newRecord);

    if (!filingFolderMap.has(folderKey)) filingFolderMap.set(folderKey, []);
    filingFolderMap.get(folderKey)!.unshift(newRecord);

    // Update capacity count in summary
    if (summary && summary.fileCapacities) {
      if (targetFile) {
        targetFile.currentCases++;
      } else {
        summary.fileCapacities.unshift({
          fileNo: String(fileNo).trim(),
          company: company || 'General',
          capacity: 50,
          currentCases: 1,
          cases: [newRecord]
        });
        summary.totalPhysicalFiles = (summary.totalPhysicalFiles || 0) + 1;
      }
      summary.totalFilingRecords = (summary.totalFilingRecords || 0) + 1;
    }

    // Persist changes to disk
    try {
      const recordsPath = path.join(process.cwd(), 'src', 'data', 'filingRecords.json');
      const summaryPath = path.join(process.cwd(), 'src', 'data', 'filingRecordsSummary.json');
      fs.writeFileSync(recordsPath, JSON.stringify(records), 'utf-8');
      fs.writeFileSync(summaryPath, JSON.stringify(summary), 'utf-8');
    } catch (persistErr) {
      console.error('Disk persistence error for filing entry:', persistErr);
    }

    return NextResponse.json({
      success: true,
      message: `Folio ${folio} successfully registered in folder ${fileNo}`,
      record: newRecord
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
