import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedShareholders: any[] | null = null;
let folioIndex = new Map<string, any[]>();
let cnicIndex = new Map<string, any[]>();

function initData() {
  if (cachedShareholders) return;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'shareholdersSample.json');
    if (fs.existsSync(p)) {
      cachedShareholders = JSON.parse(fs.readFileSync(p, 'utf-8'));
      
      // Build O(1) indexed lookup tables in memory
      for (const item of (cachedShareholders || [])) {
        // Index by folio
        const fKey = String(item.folio).toLowerCase().trim();
        if (!folioIndex.has(fKey)) folioIndex.set(fKey, []);
        folioIndex.get(fKey)!.push(item);

        // Index by clean CNIC
        const cKey = String(item.cnic).replace(/[^0-9]/g, '');
        if (cKey) {
          if (!cnicIndex.has(cKey)) cnicIndex.set(cKey, []);
          cnicIndex.get(cKey)!.push(item);
        }
      }
    } else {
      cachedShareholders = [];
    }
  } catch (e) {
    console.error('Error loading shareholders data:', e);
    cachedShareholders = [];
  }
}

export async function GET(req: NextRequest) {
  initData();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'cnic';
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const data = cachedShareholders || [];

  if (!query) {
    return NextResponse.json({
      totalMatched: data.length,
      records: data.slice(0, 30),
    });
  }

  let results: any[] = [];

  if (type === 'folio') {
    // Fast direct O(1) map hit first
    if (folioIndex.has(query)) {
      results = folioIndex.get(query) || [];
    } else {
      // Substring scan capped at 100
      for (const item of data) {
        if (String(item.folio).toLowerCase().includes(query)) {
          results.push(item);
          if (results.length >= 100) break;
        }
      }
    }
  } else if (type === 'cnic') {
    const cleanQ = query.replace(/[^0-9]/g, '');
    if (cnicIndex.has(cleanQ)) {
      results = cnicIndex.get(cleanQ) || [];
    } else {
      // Prefix/substring scan
      for (const item of data) {
        const cnicClean = String(item.cnic).replace(/[^0-9]/g, '');
        if (cnicClean.includes(cleanQ) || String(item.cnic).toLowerCase().includes(query)) {
          results.push(item);
          if (results.length >= 100) break;
        }
      }
    }
  } else if (type === 'name') {
    for (const item of data) {
      if (String(item.name).toLowerCase().includes(query)) {
        results.push(item);
        if (results.length >= 100) break;
      }
    }
  } else {
    for (const item of data) {
      if (
        String(item.name).toLowerCase().includes(query) ||
        String(item.folio).toLowerCase().includes(query) ||
        String(item.cnic).toLowerCase().includes(query) ||
        String(item.company).toLowerCase().includes(query)
      ) {
        results.push(item);
        if (results.length >= 100) break;
      }
    }
  }

  // Cross-company folio aggregation: whenever records match, retrieve ALL folios for those CNICs
  if (results.length > 0 && (type === 'cnic' || type === 'name')) {
    const matchedCnics = new Set(results.map(r => String(r.cnic).replace(/[^0-9]/g, '')));
    const aggregated: any[] = [];
    Array.from(matchedCnics).forEach((cKey) => {
      if (cnicIndex.has(cKey)) {
        aggregated.push(...(cnicIndex.get(cKey) || []));
      }
    });
    results = aggregated.length > 0 ? aggregated : results;
  }

  return NextResponse.json({
    totalMatched: results.length,
    records: results.slice(0, 100),
  });
}
