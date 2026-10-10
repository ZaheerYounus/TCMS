// Utility for standardizing dates strictly as DD/MM/YYYY across TCMS

export function formatDateDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const str = String(dateInput).trim();
  if (!str || str === '-' || str.toLowerCase() === 'not recorded') return '-';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [_, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})/);
  if (dmyMatch) {
    const [_, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return str;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseDateDDMMYYYY(str: string): Date | null {
  if (!str) return null;
  const match = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [_, d, m, y] = match;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function toInputDateFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [_, d, m, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

export function calculateAgingDays(dateInput: string | Date | null | undefined): number {
  if (!dateInput) return 0;
  let date: Date | null = null;
  if (typeof dateInput === 'string') {
    date = parseDateDDMMYYYY(dateInput) || new Date(dateInput);
  } else {
    date = dateInput;
  }
  if (!date || isNaN(date.getTime())) return 0;

  const now = new Date('2026-10-10');
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
