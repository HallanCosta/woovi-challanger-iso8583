// Create card number with code response expected
export const HALLAN_MASTERCARD_CARDS = {
  '5162000000000000': '00',
  '5162123400000000': '00',
  '5162555500000000': '00',
  '5162999900000000': '00',
  '5162333300000000': '00',
  '5162777700000000': '00',
  '5162111100000000': '00',
  '5162222200000000': '00',
  '5162999999999999': '00',
  '5162000000000003': '03',
  '5162000000000012': '12',
  '5162000000000014': '14',
  '5162000000000051': '51',
  '5162000000000057': '57',
  '5162000000000058': '00',
  '5162000000000091': '91',
  '5162000000000094': '94',
  '5162000000000095': '95',
} as const;

export const HALLAN_VISA_CARDS = {
  '4026000000000000': '00',
  '4761739001010119': '00',
} as const;

export const HALLAN_PIX_CARDS = {
  '3907000000000000': '00',
} as const;

// Array cards numbers
export const HALLAN_MASTERCARD_NUMBERS = Object.keys(HALLAN_MASTERCARD_CARDS) as readonly string[];
export const HALLAN_VISA_NUMBERS = Object.keys(HALLAN_VISA_CARDS) as readonly string[];
export const HALLAN_PIX_NUMBERS = Object.keys(HALLAN_PIX_CARDS) as readonly string[];

// Cards fails
export const HALLAN_MASTERCARD_CARDS_TEST_FAIL = Object.fromEntries(
  Object.entries(HALLAN_MASTERCARD_CARDS).filter(([, rc]) => rc !== '00')
) as Record<string, string>;

export const CARD_LIST_HALLAN = {
  mastercard: HALLAN_MASTERCARD_NUMBERS,
  visa: HALLAN_VISA_NUMBERS,
  pix: HALLAN_PIX_NUMBERS,
} as const;
