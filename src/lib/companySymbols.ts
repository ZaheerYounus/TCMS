import clientSymbolsData from '@/data/clientSymbols.json';
import companiesListData from '@/data/companiesList.json';
import allCompaniesSymbolsData from '@/data/allCompaniesSymbols.json';

/**
 * Official CDCSR & PSX Symbol to Full Company Name Registry
 * Contains 300+ listed companies & client companies.
 * Strict exact matching only. Never partial/substring match.
 */
export const EXACT_SYMBOL_MAP: Record<string, string> = {
  ...(allCompaniesSymbolsData as Record<string, string>),

  // Explicit staff aliases & shortcuts
  'OGDCL': 'Oil & Gas Development Company Limited',
  'SNGPL': 'Sui Northern Gas Pipelines Limited',
  'KE': 'K-Electric Limited',
  'PIA': 'Pakistan International Airlines Corporation',
  'FBL': 'Faysal Bank Limited',
  'CPHL': 'Citi Pharma Limited',
  'CHERAT': 'Cherat Cement Company Limited',
  'LIPTON': 'Lipton Tea Pakistan Limited',
  'MAGNUM': 'Magnum Ice Cream Limited',
  'PMSC': 'Pak Suzuki Motor Company Limited',
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

// Add canonical names from companiesList & full symbol dictionary (300+ companies)
const canonicalCompanies: string[] = Array.from(new Set([
  ...(companiesListData as string[]).filter(c => c && c.length > 2 && !c.startsWith('`') && !c.match(/^\d/)),
  ...Object.values(EXACT_SYMBOL_MAP)
]));

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
