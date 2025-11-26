import { SALES_RESPONSE_CODES } from '../../../lib/iso8583/enums/response.ts';
import type { LogicResponse } from './types.ts';

const VALID_VOID_PROCESSING_CODES = new Set(['020000', '220000']);

export const voidResponse = (expectedCode: string, processingCode: string): LogicResponse => {
  if (!VALID_VOID_PROCESSING_CODES.has(processingCode)) {
    return { mti: '0210', responseCode: '99' };
  }

  const mapped = SALES_RESPONSE_CODES.find((entry) => entry.req === expectedCode);
  return { mti: '0210', responseCode: mapped?.res ?? '00' };
};
