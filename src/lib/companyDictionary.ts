/**
 * Normalization dictionary for cleaning company name typos across TCMS
 */

export const COMPANY_TYPO_MAP: Record<string, string> = {
  "philip morriis": "Philip Morris (Pakistan) Limited",
  "philip morris": "Philip Morris (Pakistan) Limited",
  "philip morris pakistan": "Philip Morris (Pakistan) Limited",
  "philip morris (pakistan) limited": "Philip Morris (Pakistan) Limited",
  "attock petrileum": "Attock Petroleum Limited",
  "attock petroleum": "Attock Petroleum Limited",
  "power cenmet": "Power Cement Limited",
  "power cement": "Power Cement Limited",
  "searl": "The Searle Company Limited",
  "searle": "The Searle Company Limited",
  "searle pakistan": "The Searle Company Limited",
  "the searle company limited": "The Searle Company Limited",
  "kel": "K-Electric Limited",
  "k-electric": "K-Electric Limited",
  "k-electric limited": "K-Electric Limited",
  "ulever": "Unilever Pakistan Limited",
  "unilever": "Unilever Pakistan Limited",
  "unilever pakstian": "Unilever Pakistan Limited",
  "unilever pakistan": "Unilever Pakistan Limited",
  "pso": "Pakistan State Oil Company Limited",
  "pakistan state oil": "Pakistan State Oil Company Limited",
  "ogdc": "Oil & Gas Development Company Limited",
  "hbl": "Habib Bank Limited",
  "habib bank": "Habib Bank Limited",
  "abl": "Allied Bank Limited",
  "allied bank": "Allied Bank Limited",
  "nbp": "National Bank of Pakistan",
  "national bank": "National Bank of Pakistan",
  "sngp": "Sui Northern Gas Pipelines Limited",
  "sui northern": "Sui Northern Gas Pipelines Limited",
  "ssgc": "Sui Southern Gas Company Limited",
  "sui southern": "Sui Southern Gas Company Limited",
  "pnsc": "Pakistan National Shipping Corporation",
  "general / unknown portfolios": "Unassigned",
  "general/unknown portfolios": "Unassigned",
  "unknown portfolios": "Unassigned",
  "general": "Unassigned",
};

export function normalizeCompanyName(rawName: string = ""): string {
  if (!rawName) return "Unassigned";
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  if (COMPANY_TYPO_MAP[lower]) {
    return COMPANY_TYPO_MAP[lower];
  }

  // Check substring matches
  for (const [typo, clean] of Object.entries(COMPANY_TYPO_MAP)) {
    if (lower === typo || lower.includes(typo)) {
      return clean;
    }
  }

  return trimmed;
}

export function isValidDateString(val: any): boolean {
  if (!val || typeof val !== "string") return false;
  const s = val.trim().toUpperCase();
  if (s === "YES" || s === "NO" || s === "N/A" || s === "NOT RECORDED" || s === "-") {
    return false;
  }
  // Try date parse
  const d = new Date(val);
  return !isNaN(d.getTime());
}
