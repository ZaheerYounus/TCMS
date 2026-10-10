// Company-specific classification, custody registry, and statutory requirements

export type FormType = 'SIF' | 'TD';

export interface CompanyPolicy {
  company: string;
  symbol: string;
  formType: FormType; // SIF (Shareholder Information Form) vs TD (Transmission Deed)
  custodyAvailable: boolean; // Does CDCSR have custody of shares or not
  stampPaperValue?: number; // e.g. Rs. 500, Rs. 200
  specificRequirements: string[];
}

export const COMPANY_POLICIES: Record<string, CompanyPolicy> = {
  'Sui Northern Gas Pipelines Limited': {
    company: 'Sui Northern Gas Pipelines Limited',
    symbol: 'SNGPL',
    formType: 'TD',
    custodyAvailable: true,
    stampPaperValue: 200,
    specificRequirements: [
      'Verified Transmission Deed required',
      'NADRA Verisys verification of all legal heirs matching provided CNICs',
      'Indemnity on Stamp Paper Rs. 200 along with attested copies of witnesses CNICs'
    ]
  },
  'Allied Bank Limited': {
    company: 'Allied Bank Limited',
    symbol: 'ABL',
    formType: 'TD',
    custodyAvailable: true,
    stampPaperValue: 200,
    specificRequirements: [
      'If market value/shareholding is less than 500 shares, waiver indemnity accepted on plain paper',
      'Obtain indemnity in favor of company on stamp paper of Rs. 200 with CNICs of 2 witnesses'
    ]
  },
  'Bank AL Habib Limited': {
    company: 'Bank AL Habib Limited',
    symbol: 'BAHL',
    formType: 'SIF',
    custodyAvailable: true,
    specificRequirements: [
      'If more than one legal heir, separate written request mentioning transmission of shares and dividend from each legal heir is required'
    ]
  },
  'Faysal Bank Limited': {
    company: 'Faysal Bank Limited',
    symbol: 'FABL',
    formType: 'TD',
    custodyAvailable: false,
    stampPaperValue: 500,
    specificRequirements: [
      'Transmission Deed on non-judicial stamp paper of Rs. 500',
      'Deed of Relinquishment (DoR) / Indemnity on Rs. 500 stamp paper if court authorized single heir'
    ]
  },
  'First Habib Modaraba': {
    company: 'First Habib Modaraba',
    symbol: 'FHBM',
    formType: 'SIF',
    custodyAvailable: true,
    specificRequirements: [
      'Ensure case is not earlier reported to SECP',
      'Verify outstanding dividend amount reflecting against folio',
      'Proceed only after written approval from Section Head and Manager'
    ]
  },
  'GlaxoSmithKline Pakistan Limited': {
    company: 'GlaxoSmithKline Pakistan Limited',
    symbol: 'GLAXO',
    formType: 'TD',
    custodyAvailable: true,
    stampPaperValue: 500,
    specificRequirements: [
      'For more than one heir where court authorized one, obtain DoR / Indemnity on Rs. 500 stamp paper'
    ]
  },
  'Oil & Gas Development Company Limited': {
    company: 'Oil & Gas Development Company Limited',
    symbol: 'OGDC',
    formType: 'SIF',
    custodyAvailable: true,
    specificRequirements: [
      'Standard Shareholder Information Form (SIF) separately for each legal heir'
    ]
  },
  'Habib Bank Limited': {
    company: 'Habib Bank Limited',
    symbol: 'HBL',
    formType: 'SIF',
    custodyAvailable: true,
    specificRequirements: [
      'Separate SIF and verified 24-digit IBAN certificate for each legal heir'
    ]
  },
  'Pakistan State Oil Company Limited': {
    company: 'Pakistan State Oil Company Limited',
    symbol: 'PSO',
    formType: 'TD',
    custodyAvailable: false,
    specificRequirements: [
      'Transmission Deed with witness CNIC and verification'
    ]
  },
  'Pakistan International Airlines Corporation': {
    company: 'Pakistan International Airlines Corporation',
    symbol: 'PIAA',
    formType: 'SIF',
    custodyAvailable: true,
    specificRequirements: [
      'Shareholder Information Form and verified succession decree'
    ]
  }
};

export function getCompanyPolicy(companyName: string): CompanyPolicy {
  if (!companyName) {
    return {
      company: 'General Listed Company',
      symbol: 'COMP',
      formType: 'SIF',
      custodyAvailable: false,
      specificRequirements: ['Standard transmission formalities apply']
    };
  }

  const clean = companyName.toLowerCase();
  for (const [key, policy] of Object.entries(COMPANY_POLICIES)) {
    if (clean.includes(key.toLowerCase()) || clean.includes(policy.symbol.toLowerCase())) {
      return policy;
    }
  }

  // Default fallback
  const firstWord = companyName.split(' ')[0].toUpperCase();
  return {
    company: companyName,
    symbol: firstWord,
    formType: 'SIF',
    custodyAvailable: false,
    specificRequirements: ['Standard statutory transmission documents required']
  };
}
