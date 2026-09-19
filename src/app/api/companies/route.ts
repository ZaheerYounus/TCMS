import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COMPANIES_FILE = path.join(process.cwd(), 'src', 'data', 'companies.json');

function getCompanies(): string[] {
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      return JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading companies.json:', e);
  }
  return [
    "Habib Bank Limited",
    "Oil & Gas Development Company Limited",
    "Pakistan State Oil Company Limited",
    "Allied Bank Limited",
    "Askari Bank Limited",
    "National Bank of Pakistan",
    "K-Electric Limited",
    "Engro Corporation Limited",
    "Lucky Cement Limited",
    "Fatima Fertilizer Company Limited"
  ];
}

function saveCompanies(list: string[]) {
  try {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving companies.json:', e);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const companies = getCompanies();

    if (!q) {
      return NextResponse.json({ companies });
    }

    const filtered = companies.filter(c => c.toLowerCase().includes(q));
    return NextResponse.json({ companies: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json();
    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const trimmed = companyName.trim();
    const companies = getCompanies();
    const exists = companies.some(c => c.toLowerCase() === trimmed.toLowerCase());

    if (!exists) {
      companies.push(trimmed);
      companies.sort((a, b) => a.localeCompare(b));
      saveCompanies(companies);
    }

    return NextResponse.json({ success: true, companyName: trimmed, total: companies.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
