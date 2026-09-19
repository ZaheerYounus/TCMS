import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'dailyRegister.json');

function getDailyData(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading dailyRegister.json:', err);
  }
  return [];
}

function saveDailyData(data: any[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving dailyRegister.json:', err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get('date'); // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'YYYY-MM-DD'
    const typeFilter = searchParams.get('type'); // 'INWARD' | 'OUTWARD' | 'ALL'
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    const all = getDailyData();
    const todayStr = "2026-09-19"; // Synchronized system date

    let filtered = [...all];

    // Filter by type
    if (typeFilter && typeFilter !== 'ALL') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by date
    if (dateFilter) {
      if (dateFilter === 'today') {
        filtered = filtered.filter(item => item.date === todayStr);
      } else if (dateFilter === 'yesterday') {
        const yDate = new Date("2026-09-19");
        yDate.setDate(yDate.getDate() - 1);
        const yStr = yDate.toISOString().split('T')[0];
        filtered = filtered.filter(item => item.date === yStr);
      } else if (dateFilter === 'week') {
        filtered = filtered.filter(item => item.date >= '2026-09-13');
      } else if (dateFilter === 'month') {
        filtered = filtered.filter(item => item.date.startsWith('2026-09'));
      } else if (dateFilter !== 'all') {
        filtered = filtered.filter(item => item.date === dateFilter);
      }
    }

    // Filter by text search
    if (query) {
      filtered = filtered.filter(item => 
        String(item.folio || '').toLowerCase().includes(query) ||
        String(item.company || '').toLowerCase().includes(query) ||
        String(item.legalHeir || '').toLowerCase().includes(query) ||
        String(item.shareholder || '').toLowerCase().includes(query) ||
        String(item.refNo || '').toLowerCase().includes(query) ||
        String(item.officerName || '').toLowerCase().includes(query)
      );
    }

    // Sort by date and time descending
    filtered.sort((a, b) => {
      const dtA = `${a.date} ${a.time || ''}`;
      const dtB = `${b.date} ${b.time || ''}`;
      return dtB.localeCompare(dtA);
    });

    // Compute stats
    const todayEntries = all.filter(item => item.date === todayStr);
    const summary = {
      total: all.length,
      receivedToday: todayEntries.filter(i => i.type === 'INWARD').length,
      dispatchedToday: todayEntries.filter(i => i.type === 'OUTWARD').length,
      underReview: all.filter(i => i.status === 'UNDER_REVIEW' || i.status === 'RECEIVED').length,
      totalThisMonth: all.filter(i => i.date.startsWith('2026-09')).length
    };

    return NextResponse.json({
      success: true,
      records: filtered,
      summary
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch daily register', details: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const all = getDailyData();

    const now = new Date();
    const dateStr = body.date || "2026-09-19";
    const timeStr = body.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newId = `CORR-${dateStr.replace(/-/g, '')}-${String(all.length + 1).padStart(2, '0')}`;
    const newEntry = {
      id: newId,
      date: dateStr,
      time: timeStr,
      type: body.type || 'INWARD',
      refNo: body.refNo || (body.type === 'OUTWARD' ? `CDCSR/LTC/${(body.company || 'COMP').split(' ')[0].toUpperCase()}/${body.folio || '000'}/26` : `INW/${dateStr.replace(/-/g, '/')}/${body.folio || '000'}`),
      folio: body.folio || '',
      company: body.company || '',
      compSymbol: body.compSymbol || (body.company ? body.company.split(' ')[0].toUpperCase() : ''),
      shareholder: body.shareholder || '',
      legalHeir: body.legalHeir || '',
      relation: body.relation || 'Legal Heir',
      enclosures: body.enclosures || 'Standard transmission application',
      assignedTo: body.assignedTo || 'ZA',
      officerName: body.officerName || 'Zaheer Ahmed',
      status: body.status || (body.type === 'OUTWARD' ? 'DISPATCHED' : 'RECEIVED'),
      remarks: body.remarks || ''
    };

    all.unshift(newEntry);
    saveDailyData(all);

    return NextResponse.json({
      success: true,
      entry: newEntry
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record correspondence', details: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, remarks, officerName, assignedTo, syncMis } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const all = getDailyData();
    const itemIndex = all.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Correspondence entry not found' }, { status: 404 });
    }

    if (status !== undefined) all[itemIndex].status = status;
    if (remarks !== undefined) all[itemIndex].remarks = remarks;
    if (officerName !== undefined) all[itemIndex].officerName = officerName;
    if (assignedTo !== undefined) all[itemIndex].assignedTo = assignedTo;

    saveDailyData(all);

    // If requested or if status changed on a transmission folio, also update MIS case
    if (syncMis && all[itemIndex].folio) {
      try {
        const misUrl = new URL('/api/mis', req.url);
        await fetch(misUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folio: all[itemIndex].folio,
            company: all[itemIndex].company,
            status: status,
            remarks: `Status updated via Daily Register to "${status}" (${remarks || ''})`
          })
        });
      } catch (me) {
        console.error('MIS sync error from daily register PATCH:', me);
      }
    }

    return NextResponse.json({
      success: true,
      entry: all[itemIndex]
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update entry', details: err?.message }, { status: 500 });
  }
}

