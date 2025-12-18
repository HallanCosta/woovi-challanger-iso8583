export const BRAND_PREFIX = {
  PIX: {
    hallan: ['3907'],
    woovi: ['3910'],
  },
  MASTERCARD: {
    hallan: ['5162'],
    woovi: ['2306'],
  },
  VISA: {
    hallan: ['4026'],
    woovi: ['4815'],
  },
} as const;

export const BRANDS_PREFIX_ALL = {
  PIX: [...BRAND_PREFIX.PIX.hallan, ...BRAND_PREFIX.PIX.woovi],
  MASTERCARD: [...BRAND_PREFIX.MASTERCARD.hallan, ...BRAND_PREFIX.MASTERCARD.woovi],
  VISA: [...BRAND_PREFIX.VISA.hallan, ...BRAND_PREFIX.VISA.woovi],
} as const;

export const BRAND_NAMES = {
  PIX: 'Pix',
  MASTERCARD: 'Mastercard',
  VISA: 'Visa',
} as const;

export type BrandKey = keyof typeof BRAND_PREFIX;
export type BankKey = keyof (typeof BRAND_PREFIX)[BrandKey];
