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
};

/**
 * Reverse mapping: Full company name to symbol
 */
export const FULL_NAME_TO_SYMBOL_MAP: Record<string, string> = {
  'magnum ice cream limited': 'MICL',
  'magnum ice cream company limited': 'MICL',
  'lipton tea pakistan limited': 'LTPL',
  'lipton pakistan limited': 'LTPL',
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
  const cleanName = name.trim().toLowerCase();
  
  if (FULL_NAME_TO_SYMBOL_MAP[cleanName]) {
    return FULL_NAME_TO_SYMBOL_MAP[cleanName];
  }

  // Check if already contains symbol in parentheses, e.g. "Oil & Gas Development Company Limited (OGDC)"
  const parenMatch = name.match(/\(([A-Za-z0-9]+)\)$/);
  if (parenMatch) {
    const sym = parenMatch[1].toUpperCase();
    if (EXACT_SYMBOL_MAP[sym]) {
      return sym;
    }
  }

  // Check exact symbol match if user passed a symbol in the name field
  const upper = name.trim().toUpperCase();
  if (EXACT_SYMBOL_MAP[upper]) {
    return upper;
  }

  return null;
}

/**
 * Formatter for multi-folio table rows.
 * Output must be: "Full Company Name (SYMBOL)"
 * If symbol is unknown: returns { fullName: "", displayName: rawSymbol, isFound: false }
 */
export function formatCompanyWithSymbol(rawInput: string): {
  symbol: string;
  fullName: string;
  displayName: string;
  isFound: boolean;
} {
  const trimmed = (rawInput || "").trim();
  if (!trimmed) {
    return { symbol: "", fullName: "", displayName: "", isFound: false };
  }

  // Check if string already has "(SYMBOL)" format
  const parenMatch = trimmed.match(/^(.*?)\s*\(([A-Za-z0-9]+)\)$/);
  if (parenMatch) {
    const extractedName = parenMatch[1].trim();
    const extractedSym = parenMatch[2].toUpperCase().trim();
    const matchedFull = lookupSymbol(extractedSym);
    if (matchedFull) {
      return {
        symbol: extractedSym,
        fullName: matchedFull,
        displayName: `${matchedFull} (${extractedSym})`,
        isFound: true
      };
    } else {
      // Unknown symbol inside parentheses (e.g. CCPL)
      return {
        symbol: extractedSym,
        fullName: "",
        displayName: extractedSym,
        isFound: false
      };
    }
  }

  // Check if rawInput is an exact symbol (e.g. "OGDC", "KEL", "CCPL")
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

  // Check if rawInput is a full company name that maps to a symbol
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

  // Check if rawInput matches any registered company without known symbol
  for (const c of canonicalCompanies) {
    if (c.toLowerCase() === trimmed.toLowerCase()) {
      return {
        symbol: "",
        fullName: c,
        displayName: c,
        isFound: true
      };
    }
  }

  // Unrecognized symbol/company (e.g. CCPL)
  return {
    symbol: upper,
    fullName: "",
    displayName: trimmed,
    isFound: false
  };
}
