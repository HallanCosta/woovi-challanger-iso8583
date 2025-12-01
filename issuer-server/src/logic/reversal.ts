import { ISO8583_RESPONSE_CODES } from '../../../lib/iso8583/responseCodes.ts';
import type { LogicResponse } from './types.ts';

export const reversalResponse = (expectedCode: string): LogicResponse => {
  const mapped = ISO8583_RESPONSE_CODES.find((entry) => entry.req === expectedCode);
  return { mti: '0410', responseCode: mapped?.res ?? '00' };
};
