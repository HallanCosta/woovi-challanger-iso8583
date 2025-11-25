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

export const BRAND_PREFIX_ALL = {
  PIX: [...BRAND_PREFIX.PIX.hallan, ...BRAND_PREFIX.PIX.woovi],
  MASTERCARD: [...BRAND_PREFIX.MASTERCARD.hallan, ...BRAND_PREFIX.MASTERCARD.woovi],
  VISA: [...BRAND_PREFIX.VISA.hallan, ...BRAND_PREFIX.VISA.woovi],
} as const;

export const BRAND_NAMES = {
  '3907': 'Pix - Hállan Bank',
  '3910': 'Pix - Woovi Bank',
  '5162': 'Mastercard - Hállan Bank',
  '2306': 'Mastercard - Woovi Bank',
  '4026': 'Visa - Hállan Bank',
  '4815': 'Visa - Woovi Bank',
} as const;
