import { SALES_RESPONSE_CODES } from '../lib/iso8583/enums/response.ts';
import type { LogicResponse } from './types.ts';

const APPROVED_RESPONSE = '00';
const INVALID_CARD = '14';

const VALID_SALE_PROCESSING_CODES = new Set(['000000', '200000', '900000']);

const cardLooksKnown = (cardNumber?: string): boolean => {
  if (!cardNumber) return true;
  return (
    cardNumber.startsWith('2') ||
    cardNumber.startsWith('4') ||
    cardNumber.startsWith('5') ||
    cardNumber.startsWith('3907') ||
    cardNumber.startsWith('3910')
  );
};

export const saleResponse = (
  expectedCode: string,
  processingCode: string,
  cardNumber?: string
): LogicResponse => {
  if (!cardLooksKnown(cardNumber) && expectedCode === APPROVED_RESPONSE) {
    return { mti: '0210', responseCode: INVALID_CARD };
  }

  if (!VALID_SALE_PROCESSING_CODES.has(processingCode)) {
    return { mti: '0210', responseCode: '99' };
  }

  const mapped = SALES_RESPONSE_CODES.find((entry) => entry.req === expectedCode);
  return { mti: '0210', responseCode: mapped?.res ?? APPROVED_RESPONSE };
};
