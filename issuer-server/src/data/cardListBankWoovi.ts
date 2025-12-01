const WOOVI_MASTERCARD_CARDS = {
  '2306000000000000': '00',
  '2306123400000000': '00',
  '2306444400000000': '00',
  '2306777700000000': '00',
  '2306888800000000': '00',
} as const;

export const WOOVI_VISA_CARDS = {
  '4815000000000000': '00',
  '4815999900000000': '00',
} as const;

export const WOOVI_PIX_CARDS = {
  '3910000000000000': '00',
} as const;

export const WOOVI_MASTERCARD_NUMBERS = Object.keys(WOOVI_MASTERCARD_CARDS) as readonly string[];
export const WOOVI_VISA_NUMBERS = Object.keys(WOOVI_VISA_CARDS) as readonly string[];
export const WOOVI_PIX_NUMBERS = Object.keys(WOOVI_PIX_CARDS) as readonly string[];

export const CARD_LIST_WOOVI = {
  mastercard: WOOVI_MASTERCARD_CARDS,
  visa: WOOVI_VISA_NUMBERS,
  pix: WOOVI_PIX_NUMBERS,
} as const;
