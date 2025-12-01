
export const BANK_NAMES = {
  hallan: 'Hallan Bank',
  woovi: 'Woovi Bank',
} as const;

export type BankKey = keyof typeof BANK_NAMES;
