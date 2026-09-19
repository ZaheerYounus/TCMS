import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedMisSummary: any = null;
let cachedMisRecords: any[] | null = null;
let misFolioIndex = new Map<string, any[]>();
let misCaseIdIndex = new Map<string, any>();
let filingFolioMap = new Map<string, any[]>();

let lastRecordsMtime = 0;

function initMisData(force: boolean = false) {
  try {
    const summaryPath = path.join(process.cwd(), 'src', 'data', 'misSummary.json');
    const recordsPath = path.join(process.cwd(), 'src', 'data', 'misRecords.json');
    const filingRecordsPath = path.join(process.cwd(), 'src', 'data', 'filingRecords.json');

    const mtime = fs.existsSync(recordsPath) ? fs.statSync(recordsPath).mtimeMs : 0;
    if (cachedMisRecords && cachedMisSummary && !force && mtime === lastRecordsMtime) return;
    lastRecordsMtime = mtime;

    if (fs.existsSync(summaryPath)) {
      cachedMisSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    } else {
      cachedMisSummary = { totalCases: 13256, pending: 305, waitingLegalHeirs: 6322, coSigning: 24, coApproval: 95, inTransfer: 1, coDividend: 259, totalClosed: 3180, workedThisMonth: 97 };
    }

    if (fs.existsSync(filingRecordsPath)) {
      try {
        const filings = JSON.parse(fs.readFileSync(filingRecordsPath, 'utf-8'));
        filingFolioMap.clear();
        for (const fl of filings) {
          const fKey = String(fl.folio).toLowerCase().trim();
          if (fKey) {
            if (!filingFolioMap.has(fKey)) filingFolioMap.set(fKey, []);
            filingFolioMap.get(fKey)!.push(fl);
          }
        }
      } catch (fe) {
        console.error('Failed to load filing map in MIS API:', fe);
      }
    }

    if (fs.existsSync(recordsPath)) {
      cachedMisRecords = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
      misCaseIdIndex.clear();
      misFolioIndex.clear();
      for (const r of (cachedMisRecords || [])) {
        if (r.caseId) {
          misCaseIdIndex.set(String(r.caseId).toLowerCase().trim(), r);
        }
        const fKey = String(r.folio).toLowerCase().trim();
        if (fKey) {
          if (!misFolioIndex.has(fKey)) misFolioIndex.set(fKey, []);
          misFolioIndex.get(fKey)!.push(r);
        }
      }
    } else {
      cachedMisRecords = [];
    }
  } catch (err) {
    console.error('Error reading MIS data:', err);
    cachedMisSummary = { totalCases: 0, totalClosed: 0, waitingLegalHeirs: 0, pendingReview: 0 };
    cachedMisRecords = [];
  }
}

function getFilingInfoForRecord(r: any) {
  const fKey = String(r.folio).toLowerCase().trim();
  const allMatches = filingFolioMap.get(fKey) || [];
  if (allMatches.length <= 1) return allMatches;
  const rComp = (r.company || '').toLowerCase();
  const matched = allMatches.filter((fl: any) => {
    const flComp = (fl.company || '').toLowerCase();
    return rComp.includes(flComp) || flComp.includes(rComp);
  });
  return matched.length > 0 ? matched : allMatches;
}

function recalculateMisSummary() {
  const records = cachedMisRecords || [];
  let pending = 0;
  let waitingLegalHeirs = 0;
  let coSigning = 0;
  let coApproval = 0;
  let inTransfer = 0;
  let coDividend = 0;
  let totalClosed = 0;
  let partiallyClosed = 0;
  let workedThisMonth = 0;

  const compStats: Record<string, { company: string; total: number; closed: number; pending: number; waiting: number; coApproval: number; coSigning: number; inTransfer: number; partiallyClosed: number; workedThisMonth: number }> = {};

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.workedThisMonth) workedThisMonth++;

    const compName = (r.company || 'General Client Companies').trim();
    if (!compStats[compName]) {
      compStats[compName] = { company: compName, total: 0, closed: 0, pending: 0, waiting: 0, coApproval: 0, coSigning: 0, inTransfer: 0, partiallyClosed: 0, workedThisMonth: 0 };
    }
    compStats[compName].total++;
    if (r.workedThisMonth) compStats[compName].workedThisMonth++;

    const sc = (r.statusCode || '').toUpperCase().trim();
    const s = (r.status || '').toLowerCase().trim();

    if (sc === 'PARTIALLY_CLOSED' || s.includes('partially')) {
      partiallyClosed++;
      compStats[compName].partiallyClosed++;
    } else if (r.isClosed || sc === 'CLOSED' || s === 'case closed') {
      totalClosed++;
      compStats[compName].closed++;
      continue;
    } else if (sc === 'PENDING' || s === 'pending') {
      pending++;
      compStats[compName].pending++;
    } else if (sc === 'WAITING' || s.includes('waiting') || s.includes('awaiting') || s.includes('custody')) {
      waitingLegalHeirs++;
      compStats[compName].waiting++;
    } else if (sc === 'CO_SIGNING' || s.includes('signing')) {
      coSigning++;
      compStats[compName].coSigning++;
    } else if (sc === 'CO_APPROVAL' || s.includes('approval') || (s.includes('review') && !s.includes('under review'))) {
      coApproval++;
      compStats[compName].coApproval++;
    } else if (sc === 'IN_TRANSFER' || s.includes('transfer')) {
      inTransfer++;
      compStats[compName].inTransfer++;
    } else if (sc === 'CO_DIVIDEND' || s.includes('dividend')) {
      coDividend++;
    } else {
      compStats[compName].waiting++;
    }
  }

  const companyMisSummary = Object.values(compStats)
    .sort((a, b) => b.total - a.total);

  cachedMisSummary = {
    totalCases: records.length,
    pending,
    waitingLegalHeirs,
    coSigning,
    coApproval,
    inTransfer,
    coDividend,
    totalClosed,
    partiallyClosed,
    workedThisMonth,
    companyMisSummary
  };

  try {
    const summaryPath = path.join(process.cwd(), 'src', 'data', 'misSummary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(cachedMisSummary, null, 2));
  } catch (err) {
    console.error('Failed to write misSummary.json:', err);
  }

  return cachedMisSummary;
}

export async function GET(req: NextRequest) {
  initMisData();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const status = (searchParams.get('status') || '').trim();
  const company = (searchParams.get('company') || '').trim();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const summary = cachedMisSummary || { totalCases: 0 };
  const records = cachedMisRecords || [];

  const exact = searchParams.get('exact') === 'true';

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // Exact single case ID hit (Instant O(1))
  if (q && misCaseIdIndex.has(q)) {
    const singleRec = misCaseIdIndex.get(q);
    const filingInfo = getFilingInfoForRecord(singleRec);
    return NextResponse.json({
      total: 1,
      page: 1,
      limit,
      totalPages: 1,
      records: [{ ...singleRec, filingInfo }],
      summary,
    }, { headers: noCacheHeaders });
  }

  // Exact single folio hit (when explicitly requested with exact=true)
  if (exact && q && misFolioIndex.has(q) && (!status || status === 'ALL') && (!company || company === 'ALL')) {
    const matched = misFolioIndex.get(q) || [];
    const enriched = matched.map((rec: any) => {
      const filingInfo = getFilingInfoForRecord(rec);
      return { ...rec, filingInfo };
    });
    return NextResponse.json({
      total: matched.length,
      page: 1,
      limit,
      totalPages: Math.ceil(matched.length / limit) || 1,
      records: enriched.slice(0, limit),
      summary,
    }, { headers: noCacheHeaders });
  }

  let filtered: any[] = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];

    // Status Filter:
    if (searchParams.get('thisMonth') === 'true' || status === 'WORKED_THIS_MONTH') {
      if (!r.workedThisMonth) continue;
    } else if (status && status !== 'ALL') {
      const sLower = (r.status || '').toLowerCase();
      if (status === 'PARTIALLY_CLOSED' || status === 'Partially Closed') {
        if (r.statusCode !== 'PARTIALLY_CLOSED' && !sLower.includes('partially')) continue;
      } else if (status === 'CLOSED' || status === 'Case Closed') {
        if (!r.isClosed && r.statusCode !== 'CLOSED' && sLower !== 'case closed') continue;
      } else if (status === 'PENDING' || status === 'Pending') {
        if (r.statusCode !== 'PENDING' && sLower !== 'pending') continue;
      } else if (status === 'WAITING' || status === 'Waiting') {
        if (r.statusCode !== 'WAITING' && !sLower.includes('waiting') && !sLower.includes('awaiting')) continue;
      } else if (status === 'CO_SIGNING' || status === 'Co. - Signing') {
        if (r.statusCode !== 'CO_SIGNING' && !sLower.includes('signing')) continue;
      } else if (status === 'IN_TRANSFER' || status === 'In Transfer') {
        if (r.statusCode !== 'IN_TRANSFER' && sLower !== 'in transfer') continue;
      } else if (status === 'CO_APPROVAL' || status === 'Co. - Case Review & Approval') {
        if (r.statusCode !== 'CO_APPROVAL' && !sLower.includes('approval') && !sLower.includes('review')) continue;
      } else if (status === 'CO_DIVIDEND') {
        if (r.statusCode !== 'CO_DIVIDEND' && !sLower.includes('dividend')) continue;
      } else {
        if (!sLower.includes(status.toLowerCase())) continue;
      }
    }

    if (company && company !== 'ALL') {
      const compLower = company.toLowerCase().trim();
      const rCompLower = (r.company || '').toLowerCase().trim();
      
      let matchesComp = rCompLower.includes(compLower) || compLower.includes(rCompLower);
      if (!matchesComp) {
        // Acronym or fuzzy mapping
        if ((compLower === 'hbl' || compLower.includes('habib bank')) && rCompLower.includes('habib bank')) matchesComp = true;
        else if ((compLower === 'pso' || compLower.includes('state oil')) && rCompLower.includes('state oil')) matchesComp = true;
        else if ((compLower === 'ogdc' || compLower.includes('oil & gas')) && rCompLower.includes('oil & gas')) matchesComp = true;
        else if ((compLower === 'sngp' || compLower.includes('sui northern')) && rCompLower.includes('sui northern')) matchesComp = true;
        else if ((compLower === 'ssgc' || compLower.includes('sui southern')) && rCompLower.includes('sui southern')) matchesComp = true;
        else if ((compLower === 'abl' || compLower.includes('allied bank')) && rCompLower.includes('allied bank')) matchesComp = true;
        else if ((compLower === 'nbp' || compLower.includes('national bank')) && rCompLower.includes('national bank')) matchesComp = true;
        else if ((compLower === 'pnsc' || compLower.includes('shipping')) && rCompLower.includes('shipping')) matchesComp = true;
      }
      if (!matchesComp) continue;
    }

    if (q) {
      const fStr = String(r.folio).toLowerCase();
      const matchesQ = 
        fStr.includes(q) ||
        String(r.caseId).toLowerCase().includes(q) ||
        String(r.deceased).toLowerCase().includes(q) ||
        String(r.legalHeir).toLowerCase().includes(q) ||
        String(r.company).toLowerCase().includes(q) ||
        String(r.remarks).toLowerCase().includes(q);
      if (!matchesQ) continue;
    }

    filtered.push(r);
  }

  // Smart series sorting: exact match first, startsWith next, then numerical order
  if (q) {
    filtered.sort((a, b) => {
      const fA = String(a.folio).toLowerCase();
      const fB = String(b.folio).toLowerCase();
      if (fA === q && fB !== q) return -1;
      if (fB === q && fA !== q) return 1;
      const aStarts = fA.startsWith(q);
      const bStarts = fB.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return fA.localeCompare(fB, undefined, { numeric: true });
    });
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const pagedRecords = filtered.slice(startIndex, startIndex + limit);
  const enrichedRecords = pagedRecords.map((r: any) => {
    const filingInfo = getFilingInfoForRecord(r);
    return { ...r, filingInfo };
  });

  return NextResponse.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    records: enrichedRecords,
    summary,
  }, { headers: noCacheHeaders });
}

// POST endpoint for updating MIS correspondence, logging actions, and tracking user audit trail
export async function POST(req: NextRequest) {
  initMisData();
  try {
    const body = await req.json();
    const { 
      caseId, 
      folio, 
      company, 
      action, 
      status,
      remarks, 
      discussionNote,
      user = 'Zaheer Ahmed (ZA)',
      userId = 'ZA',
      actionTitle,
      updates = {},
      letterDate = new Date().toISOString().split('T')[0] 
    } = body;

    const targetKey = (caseId || folio || '').toString().trim().toLowerCase();
    if (!targetKey) {
      return NextResponse.json({ error: 'Case ID or Folio is required' }, { status: 400 });
    }

    const records = cachedMisRecords || [];
    let updatedRecord: any = null;

    // 1. Try finding by case ID
    if (caseId) {
      const cKey = String(caseId).trim().toLowerCase();
      if (misCaseIdIndex.has(cKey)) {
        updatedRecord = misCaseIdIndex.get(cKey);
      }
    }

    // 2. Try finding by folio + company match
    if (!updatedRecord && (folio || targetKey)) {
      const fKey = String(folio || targetKey).trim().toLowerCase();
      const compStr = company ? String(company).toLowerCase() : '';
      if (misFolioIndex.has(fKey)) {
        const matches = misFolioIndex.get(fKey) || [];
        if (matches.length === 1) {
          updatedRecord = matches[0];
        } else if (matches.length > 1 && compStr) {
          updatedRecord = matches.find((m: any) => String(m.company || '').toLowerCase().includes(compStr)) || matches[0];
        } else if (matches.length > 1) {
          updatedRecord = matches[0];
        }
      }
    }

    // 3. Fallback linear search across all records
    if (!updatedRecord) {
      const cKey = caseId ? String(caseId).trim().toLowerCase() : '';
      const fKey = (folio || targetKey) ? String(folio || targetKey).trim().toLowerCase() : '';
      const compStr = company ? String(company).toLowerCase() : '';

      updatedRecord = records.find((r: any) => {
        if (cKey && String(r.caseId || '').toLowerCase() === cKey) return true;
        if (fKey) {
          const rf = String(r.folio || '').toLowerCase();
          const matchesFolio = rf === fKey || rf.split(/[,;\s]+/).map((s: string) => s.trim()).includes(fKey);
          if (matchesFolio && compStr) {
            return String(r.company || '').toLowerCase().includes(compStr);
          }
          return matchesFolio;
        }
        return false;
      });
    }

    const nowFormatted = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (updatedRecord) {
      // Apply status if provided
      if (status) {
        updatedRecord.status = status;
        const sLower = status.toLowerCase();
        if (sLower.includes('partially')) {
          updatedRecord.statusCode = 'PARTIALLY_CLOSED';
          updatedRecord.status = 'Partially Closed';
          updatedRecord.isClosed = false;
        } else if (sLower === 'pending') {
          updatedRecord.statusCode = 'PENDING';
          updatedRecord.isClosed = false;
        } else if (sLower === 'waiting') {
          updatedRecord.statusCode = 'WAITING';
          updatedRecord.isClosed = false;
        } else if (sLower.includes('custody')) {
          updatedRecord.statusCode = 'WAITING_CUSTODY';
          updatedRecord.isClosed = false;
        } else if (sLower.includes('signing')) {
          updatedRecord.statusCode = 'CO_SIGNING';
          updatedRecord.isClosed = false;
        } else if (sLower.includes('review') || sLower.includes('approval')) {
          updatedRecord.statusCode = 'CO_APPROVAL';
          updatedRecord.isClosed = false;
        } else if (sLower.includes('transfer')) {
          updatedRecord.statusCode = 'IN_TRANSFER';
          updatedRecord.isClosed = false;
        } else if (sLower.includes('dividend')) {
          updatedRecord.statusCode = 'CO_DIVIDEND';
          updatedRecord.isClosed = false;
        } else if (sLower.includes('closed')) {
          updatedRecord.statusCode = 'CLOSED';
          updatedRecord.status = 'Case Closed';
          updatedRecord.isClosed = true;
        } else {
          updatedRecord.statusCode = 'OTHER';
        }
      }

      // Apply specific workflow action shortcuts
      if (action === 'LETTER_ISSUED') {
        updatedRecord.formSentDate = letterDate;
        updatedRecord.status = 'Waiting';
        updatedRecord.statusCode = 'WAITING';
        updatedRecord.isClosed = false;
      } else if (action === 'DOCUMENTS_RECEIVED') {
        updatedRecord.formRecDate = letterDate;
        updatedRecord.status = 'Pending';
        updatedRecord.statusCode = 'PENDING';
        updatedRecord.isClosed = false;
      } else if (action === 'SENT_TO_COMPANY') {
        updatedRecord.fwdCompDate = letterDate;
        updatedRecord.status = 'Co. - Case Review & Approval';
        updatedRecord.statusCode = 'CO_APPROVAL';
        updatedRecord.isClosed = false;
      } else if (action === 'APPROVED_BY_COMPANY') {
        updatedRecord.appRecDate = letterDate;
        updatedRecord.status = 'Approved case received from Company';
      } else if (action === 'FORWARD_TO_TRANSFER') {
        updatedRecord.fwdTransDate = letterDate;
        updatedRecord.status = 'In Transfer';
        updatedRecord.statusCode = 'IN_TRANSFER';
      } else if (action === 'RECEIVED_FROM_TRANSFER') {
        updatedRecord.recTransDate = letterDate;
        updatedRecord.status = 'Received From Transfer';
      } else if (action === 'SENT_FOR_SIGNING') {
        updatedRecord.physAppFwdComp = letterDate;
        updatedRecord.status = 'Co. - Signing';
        updatedRecord.statusCode = 'CO_SIGNING';
      } else if (action === 'DELIVERED_CLOSED') {
        updatedRecord.sharesFwdDate = letterDate;
        updatedRecord.status = 'Case Closed';
        updatedRecord.statusCode = 'CLOSED';
        updatedRecord.isClosed = true;
      }

      // Apply arbitrary field updates (dates, remarks, legalHeir, etc.)
      if (updates && typeof updates === 'object') {
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) updatedRecord[k] = v;
        }
      }

      if (remarks) {
        updatedRecord.remarks = (updatedRecord.remarks ? updatedRecord.remarks + ' | ' : '') + remarks;
      }

      // Append Audit Trail entry
      if (!Array.isArray(updatedRecord.auditTrail)) {
        updatedRecord.auditTrail = [];
      }

      const entryAction = actionTitle || (status ? `Status updated to ${status}` : action || 'Updated Case Data');
      updatedRecord.auditTrail.unshift({
        id: `AUD-${Date.now()}`,
        user: user || 'Zaheer Ahmed (ZA)',
        userId: userId || 'ZA',
        action: entryAction,
        note: discussionNote || remarks || '',
        timestamp: nowFormatted
      });

    } else {
      // Create brand new case in MIS
      const newCase: any = {
        caseId: `TR-${String(records.length + 1).padStart(6, '0')}`,
        company: company || 'CDCSR Client Company',
        folio: String(folio || targetKey),
        deceased: body.deceased || 'Subject Shareholder',
        legalHeir: body.legalHeir || 'Legal Heir',
        reqRecDate: letterDate,
        formSentDate: letterDate,
        formRecDate: '',
        formSentAgain1: '',
        formRecAgain1: '',
        formSentAgain2: '',
        formRecAgain2: '',
        fwdCompDate: '',
        appRecDate: '',
        fwdTransDate: '',
        recTransDate: '',
        physAppFwdComp: '',
        sharesRecComp: '',
        sharesFwdDate: '',
        chqRecComp: '',
        chqFwdLegalHeir: '',
        status: status || 'Waiting',
        statusCode: 'WAITING',
        isClosed: false,
        remarks: remarks || `1st Letter issued on ${letterDate}`,
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            user: user || 'Zaheer Ahmed (ZA)',
            userId: userId || 'ZA',
            action: 'Case Created in Transmission Register',
            note: discussionNote || remarks || '',
            timestamp: nowFormatted
          }
        ]
      };
      records.unshift(newCase);
      misCaseIdIndex.set(newCase.caseId.toLowerCase(), newCase);
      const fK = newCase.folio.toLowerCase().trim();
      if (!misFolioIndex.has(fK)) misFolioIndex.set(fK, []);
      misFolioIndex.get(fK)!.unshift(newCase);
      updatedRecord = newCase;
    }

    // Recalculate summary metrics immediately & persist misSummary.json
    const updatedSummary = recalculateMisSummary();

    // Persist records to disk
    try {
      const recordsPath = path.join(process.cwd(), 'src', 'data', 'misRecords.json');
      fs.writeFileSync(recordsPath, JSON.stringify(cachedMisRecords));
    } catch (saveErr) {
      console.error('Failed to write misRecords.json to disk:', saveErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Case status, remarks and audit log successfully saved',
      record: updatedRecord,
      summary: updatedSummary
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: any) {
    console.error('MIS update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
