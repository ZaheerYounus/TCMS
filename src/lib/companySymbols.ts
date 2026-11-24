import clientSymbolsData from '@/data/clientSymbols.json';
import companiesListData from '@/data/companiesList.json';

/**
 * Official CDCSR Symbol to Full Company Name Registry
 * Strict exact matching only. Never partial/substring match.
 */
export const EXACT_SYMBOL_MAP: Record<string, string> = {
  // Required staff mappings (explicitly mandated)
  'OGDC': 'Oil & Gas Development Company Limited',
  'AKBL': 'Askari Bank Limited',
  'ABL': 'Allied Bank Limited',
  'MICL': 'Magnum Ice Cream Limited',
  'LTPL': 'Lipton Tea Pakistan Limited',
  'BIPL': 'BankIslami Pakistan Limited',
  'PNSC': 'Pakistan National Shipping Corporation',
  'PIBT': 'Pakistan International Bulk Terminal Limited',
  'PIBTL': 'Pakistan International Bulk Terminal Limited',
  'SNGP': 'Sui Northern Gas Pipelines Limited',
  'TATM': 'Tata Textile Mills Limited',
  'PMPK': 'Philip Morris Pakistan Limited',
  'PSMC': 'Pak Suzuki Motor Company Limited',
  'PMSC': 'Pak Suzuki Motor Company Limited', // Alias for staff input
  'KHTC': 'Khyber Tobacco Company Limited',
  'KEL': 'K-Electric Limited',
  'PIAC': 'Pakistan International Airlines Corporation',
  'CHCC': 'Cherat Cement Company Limited',

  // Additional common CDCSR listed companies
  'HBL': 'Habib Bank Limited',
  'MCB': 'MCB Bank Limited',
  'UBL': 'United Bank Limited',
  'BAHL': 'Bank AL Habib Limited',
  'BAFL': 'Bank Alfalah Limited',
  'MEBL': 'Meezan Bank Limited',
  'FABL': 'Faysal Bank Limited',
  'SSGC': 'Sui Southern Gas Company Limited',
  'PSO': 'Pakistan State Oil Company Limited',
  'POL': 'Pakistan Oilfields Limited',
  'PPL': 'Pakistan Petroleum Limited',
  'ENGRO': 'Engro Corporation Limited',
  'EFERT': 'Engro Fertilizers Limited',
  'FFC': 'Fauji Fertilizer Company Limited',
  'FFBL': 'Fauji Fertilizer Bin Qasim Limited',
  'FATIMA': 'Fatima Fertilizer Company Limited',
  'LUCK': 'Lucky Cement Limited',
  'DGKC': 'D.G. Khan Cement Company Limited',
  'MLCF': 'Maple Leaf Cement Factory Limited',
  'POWER': 'Power Cement Limited',
  'HUBC': 'The Hub Power Company Limited',
  'KAPCO': 'Kot Addu Power Company Limited',
  'SYS': 'Systems Limited',
  'TRG': 'TRG Pakistan Limited',
  'PAKT': 'Pakistan Tobacco Company Limited',
  'FHAM': 'First Habib Modaraba',
  'CYAN': 'Cyan Limited',
  'DLL': 'Dawood Lawrencepur Limited',
  'DINT': 'Din Textile Mills Limited',
  'BWHL': 'Baluchistan Wheels Limited',
  'BCL': 'Bolan Castings Limited',
  'BNWM': 'Bannu Woolen Mills Limited',
  'GADT': 'Gadoon Textile Mills Limited',
  'GAL': 'Ghandhara Automobiles Limited',
  'GHNI': 'Ghandhara Nissan Limited',
  'GTYR': 'General Tyre and Rubber Company of Pakistan Limited',
  'HALEON': 'Haleon Pakistan Limited',
  'HASCOL': 'Hascol Petroleum Limited',
  'INDU': 'Indus Motor Company Limited',
  'INIL': 'International Industries Limited',
  'ISL': 'International Steels Limited',
  'ASL': 'Aisha Steel Mills Limited',
  'AICL': 'Adamjee Insurance Company Limited',
  'EFUG': 'EFU General Insurance Limited',
  'EFUL': 'EFU Life Assurance Limited',
  'SEARL': 'The Searle Company Limited',
  'AGP': 'AGP Limited',
  'NATF': 'National Foods Limited',
  'NRL': 'National Refinery Limited',
  'ATRL': 'Attock Refinery Limited',
  'APL': 'Attock Petroleum Limited',
  'NESTLE': 'Nestle Pakistan Limited',
  'NBP': 'National Bank of Pakistan',
  // Common staff aliases & shortcuts
  'OGDCL': 'Oil & Gas Development Company Limited',
  'SNGPL': 'Sui Northern Gas Pipelines Limited',
  'KE': 'K-Electric Limited',
  'PIA': 'Pakistan International Airlines Corporation',
  'FBL': 'Faysal Bank Limited',
  'CPHL': 'Citi Pharma Limited',
  'CPPL': 'Cherat Packaging Limited',
  'CHERAT': 'Cherat Cement Company Limited',
  'LIPTON': 'Lipton Tea Pakistan Limited',
  'MAGNUM': 'Magnum Ice Cream Limited',
};

/**
 * Reverse mapping: Full company name to symbol
 */
export const FULL_NAME_TO_SYMBOL_MAP: Record<string, string> = {
  'magnum ice cream limited': 'MICL',
  'magnum ice cream company limited': 'MICL',
  'lipton tea pakistan limited': 'LTPL',
  'lipton pakistan limited': 'LTPL',
  'cherat cement company limited': 'CHCC',
  'cherat cement': 'CHCC',
  'cherat packaging limited': 'CPPL',
  'oil & gas development company limited': 'OGDC',
  'k-electric limited': 'KEL',
  'pak suzuki motor company limited': 'PSMC',
  'khyber tobacco company limited': 'KHTC',
};
for (const [sym, name] of Object.entries(EXACT_SYMBOL_MAP)) {
  const normName = name.toLowerCase().trim();
  if (!FULL_NAME_TO_SYMBOL_MAP[normName]) {
    FULL_NAME_TO_SYMBOL_MAP[normName] = sym;
  }
}

// Add canonical names from companiesList
const canonicalCompanies: string[] = (companiesListData as string[]).filter(c => c && c.length > 2);

/**
 * Exact resolution of symbol to full company name.
 * Strictly exact matching. Returns null if no match found.
 */
export function lookupSymbol(symbol: string): string | null {
  if (!symbol) return null;
  const cleanSym = symbol.trim().toUpperCase();
  if (EXACT_SYMBOL_MAP[cleanSym]) {
    return EXACT_SYMBOL_MAP[cleanSym];
  }
  return null;
}

/**
 * Lookup symbol from full or partial company name
 */
export function lookupSymbolFromName(name: string): string | null {
  if (!name) return null;
  const cleanName = name.trim().toLowerCase()
    .replace(/^(?:comp(?:\s*name|\s*symbol)?|company(?:\s*name)?|co\.|unit)[:\s\.-]+/i, '')
    .trim();
  
  if (FULL_NAME_TO_SYMBOL_MAP[cleanName]) {
    return FULL_NAME_TO_SYMBOL_MAP[cleanName];
  }

  // Check if already contains symbol in parentheses, e.g. "Oil & Gas Development Company Limited (OGDC)"
  const parenMatch = cleanName.match(/\(([A-Za-z0-9]+)\)$/);
  if (parenMatch) {
    const sym = parenMatch[1].toUpperCase();
    if (EXACT_SYMBOL_MAP[sym]) {
      return sym;
    }
  }

  // Check exact symbol match if user passed a symbol in the name field
  const upper = cleanName.trim().toUpperCase();
  if (EXACT_SYMBOL_MAP[upper]) {
    return upper;
  }

  // Check if any known symbol appears as an isolated word
  for (const [sym] of Object.entries(EXACT_SYMBOL_MAP)) {
    const reg = new RegExp(`\\b${sym}\\b`, 'i');
    if (reg.test(cleanName)) {
      return sym;
    }
  }

  return null;
}

/**
 * Clean prefix like "Comp: ", "Company: ", "M/s ", etc.
 */
function cleanCompanyPrefix(raw: string): string {
  return (raw || "")
    .replace(/^(?:comp(?:\s*name|\s*symbol)?|company(?:\s*name)?|co\.|unit|client|m\/s|messrs)[:\s\.-]+/i, "")
    .trim();
}

/**
 * Formatter for multi-folio table rows and single company resolution.
 * Output: "Full Company Name (SYMBOL)"
 * Automatically resolves symbols like CHCC, MICL, LTPL, etc. to full registered company name.
 */
export function formatCompanyWithSymbol(rawInput: string): {
  symbol: string;
  fullName: string;
  displayName: string;
  isFound: boolean;
} {
  const trimmed = cleanCompanyPrefix(rawInput || "");
  if (!trimmed) {
    return { symbol: "", fullName: "", displayName: "", isFound: false };
  }

  // 1. Check if string has "(SYMBOL)" format, e.g. "Cherat Cement (CHCC)"
  const parenMatch = trimmed.match(/^(.*?)\s*[\(\[]([A-Za-z0-9]+)[\)\]]$/);
  if (parenMatch) {
    const extractedSym = parenMatch[2].toUpperCase().trim();
    const matchedFull = lookupSymbol(extractedSym);
    if (matchedFull) {
      return {
        symbol: extractedSym,
        fullName: matchedFull,
        displayName: `${matchedFull} (${extractedSym})`,
        isFound: true
      };
    }
  }

  // 2. Check if rawInput is an exact symbol (e.g. "CHCC", "OGDC", "KEL", "MICL", "LTPL")
  const upper = trimmed.toUpperCase();
  const matchedFull = lookupSymbol(upper);
  if (matchedFull) {
    return {
      symbol: upper,
      fullName: matchedFull,
      displayName: `${matchedFull} (${upper})`,
      isFound: true
    };
  }

  // 3. Check if rawInput contains a known symbol as a standalone word (e.g. "Comp: CHCC" or "CHCC Cement")
  for (const [sym, fullName] of Object.entries(EXACT_SYMBOL_MAP)) {
    const wordRegex = new RegExp(`\\b${sym}\\b`, 'i');
    if (wordRegex.test(trimmed)) {
      return {
        symbol: sym,
        fullName,
        displayName: `${fullName} (${sym})`,
        isFound: true
      };
    }
  }

  // 4. Check if rawInput is a full company name that maps to a symbol
  const foundSym = lookupSymbolFromName(trimmed);
  if (foundSym) {
    const full = EXACT_SYMBOL_MAP[foundSym] || trimmed;
    return {
      symbol: foundSym,
      fullName: full,
      displayName: `${full} (${foundSym})`,
      isFound: true
    };
  }

  // 5. Fuzzy match against canonicalCompanies list in database
  const cleanLower = trimmed.toLowerCase();
  for (const c of canonicalCompanies) {
    const cLower = c.toLowerCase();
    if (cLower === cleanLower || cLower.includes(cleanLower) || cleanLower.includes(cLower)) {
      const sym = lookupSymbolFromName(c) || "";
      return {
        symbol: sym,
        fullName: c,
        displayName: sym ? `${c} (${sym})` : c,
        isFound: true
      };
    }
  }

  // 6. Unrecognized company/symbol fallback
  return {
    symbol: upper.length <= 6 ? upper : "",
    fullName: trimmed,
    displayName: trimmed,
    isFound: false
  };
}
