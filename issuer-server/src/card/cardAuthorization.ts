import type { ParsedIso8583Message } from '../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../../lib/iso8583/response.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../lib/iso8583/responseCodes.ts';

import { TPDU_RESPONSE } from '../utils/tpdu.ts';

import { findCard } from '../card/cardHelpers.ts';

export type AuthorizationResponse = {
  rc: string;
  buffer: Buffer;
};

const VALID_PROCESSING_CODES = new Set(['000000', '200000', '900000']);

export const authorizeCard = async ({ iso }: { iso: ParsedIso8583Message }): Promise<AuthorizationResponse> => {
  const pan = iso.fields.get(2)?.value ?? '';
  const processingCode = iso.fields.get(3)?.value ?? '';
  const card = findCard(pan);

  let rc: string = ISO8583_RESPONSE_CODES_NAMES.APPROVED;

  if (!card) {
    rc = ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD;
  } else if (!VALID_PROCESSING_CODES.has(processingCode)) {
    rc = ISO8583_RESPONSE_CODES_NAMES.INVALID_TRANSACTION;
  }

  console.log(`[ISSUER][CARD->AUTHORIZATION] PAN=${pan} rc=${rc}`);

  const responseMti = getResponseMti({ requestMti: iso.mti });
  const response = buildIso8583Response({
    parsed: iso,
    mti: responseMti,
    rc,
    tpdu: TPDU_RESPONSE
  });

  return {
    rc,
    buffer: response.buffer
  };
};
