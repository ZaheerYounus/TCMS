// Stamp Duty and Revenue Stamp calculation engine for Pakistan share transmission

export type ProvinceJurisdiction = 'Sindh' | 'Punjab' | 'Federal Capital' | 'KPK' | 'Balochistan';

export interface StampDutyRate {
  province: ProvinceJurisdiction;
  ratePercentage: number;
  description: string;
}

export const STAMP_DUTY_RATES: Record<ProvinceJurisdiction, number> = {
  'Sindh': 1.5,             // 1.5% of face value of shares
  'Punjab': 0.25,           // 0.25% of face value of shares
  'Federal Capital': 0.25,  // 0.25% of face value of shares
  'KPK': 0.50,              // 0.50% of face value of shares
  'Balochistan': 1.5,       // Standard rate
};

export interface FolioStampCalculation {
  folio: string;
  company: string;
  shares: number;
  faceValuePerShare: number; // typically Rs. 10
  totalFaceValue: number;
  stampDutyAmount: number;
  paymentMode: 'Revenue Stamps' | 'Treasury Challan (National Bank)';
}

export interface StampDutySummary {
  province: ProvinceJurisdiction;
  ratePercentage: number;
  totalShares: number;
  totalFaceValue: number;
  totalDutyAmount: number;
  numberOfLegalHeirs: number;
  exceedsThreshold: boolean; // > Rs. 500
  paymentMethod: string;
  details: FolioStampCalculation[];
}

export function calculateStampDuty(
  folios: Array<{ folio: string; company: string; shares: number | string; faceValue?: number }>,
  province: ProvinceJurisdiction = 'Sindh',
  numberOfLegalHeirs: number = 1
): StampDutySummary {
  const rate = STAMP_DUTY_RATES[province] ?? 1.5;

  let totalShares = 0;
  let totalFaceValue = 0;
  let totalDutyAmount = 0;

  const details: FolioStampCalculation[] = folios.map(item => {
    const sCount = typeof item.shares === 'string' 
      ? parseInt(item.shares.replace(/[^0-9]/g, '') || '0', 10) 
      : (item.shares || 0);
    const fv = item.faceValue || 10; // Default Rs. 10 per share face value
    const totalFv = sCount * fv;
    const duty = (totalFv * rate) / 100;

    totalShares += sCount;
    totalFaceValue += totalFv;
    totalDutyAmount += duty;

    return {
      folio: item.folio,
      company: item.company,
      shares: sCount,
      faceValuePerShare: fv,
      totalFaceValue: totalFv,
      stampDutyAmount: Math.round(duty * 100) / 100,
      paymentMode: duty > 500 ? 'Treasury Challan (National Bank)' : 'Revenue Stamps'
    };
  });

  const roundedTotalDuty = Math.round(totalDutyAmount * 100) / 100;
  const exceedsThreshold = roundedTotalDuty > 500;

  return {
    province,
    ratePercentage: rate,
    totalShares,
    totalFaceValue,
    totalDutyAmount: roundedTotalDuty,
    numberOfLegalHeirs: Math.max(1, numberOfLegalHeirs),
    exceedsThreshold,
    paymentMethod: exceedsThreshold
      ? 'Payment through Government Treasury Challan (Exceeds Rs. 500 limit)'
      : 'Physical Share Transfer Revenue Stamps affixed on Transmission Deed / Form',
    details
  };
}
