import type { ParsedIsoMessage } from '../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../../lib/iso8583/response.ts';
import { TPDU_RESPONSE } from '../utils/tpdu.ts';
import { findCard } from '../utils/cards.ts';
import type { AuthorizationResult } from './cardTypes.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../lib/iso8583/responseCodes.ts';

const VALID_PROCESSING_CODES = new Set(['000000', '200000', '900000']);

export const authorizeCard = async ({ iso }: { iso: ParsedIsoMessage }): Promise<AuthorizationResult> => {
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
