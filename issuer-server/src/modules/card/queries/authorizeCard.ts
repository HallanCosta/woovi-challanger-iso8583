import type { ParsedIso8583Message } from '../../../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../../../../lib/iso8583/response.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../../../lib/iso8583/responseCodes.ts';

import { TPDU_RESPONSE } from '../../../utils/tpdu.ts';

import { toBigIntOrNull, isValidProcessingCode } from '../cardHelpers.ts';
import { findCard } from './findCard.ts';
import { getAccountsByIds } from '../../account/queries/getAccountsByIds.ts';

export type AuthorizationResponse = {
  rc: string;
  buffer: Buffer;
};

export const authorizeCard = async ({ iso }: { iso: ParsedIso8583Message }): Promise<AuthorizationResponse> => {
  const pan = iso.fields.get(2)?.value ?? '';
  const processingCode = iso.fields.get(3)?.value ?? '';
  const amountStr = iso.fields.get(4)?.value ?? '0';
  const card = findCard(pan);

  const responseMti = getResponseMti({ requestMti: iso.mti });
  const buildResponse = (rc: string) => {
    const response = buildIso8583Response({
      parsed: iso,
      mti: responseMti,
      rc,
      tpdu: TPDU_RESPONSE,
    });

    console.log(`[ISSUER][CARD->AUTHORIZATION] PAN=${pan} rc=${rc} MTI=${responseMti}`);

    return {
      rc,
      buffer: response.buffer,
    };
  };

  if (!card) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD);
  }

  if (!isValidProcessingCode(processingCode)) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_TRANSACTION);
  }

  const amount = toBigIntOrNull(amountStr);
  if (amount === null) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_AMOUNT);
  }

  const debitAccountOverride = iso.fields.get(102)?.value;
  const debitAccountId = toBigIntOrNull(debitAccountOverride ?? card.accountId.toString());
  if (!debitAccountId) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_TRANSACTION);
  }

  const [debitAccount] = await getAccountsByIds([debitAccountId]);
  if (!debitAccount) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE);
  }

  const available = debitAccount.credits_posted - debitAccount.debits_posted;
  const rc =
    amount > available
      ? ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS
      : ISO8583_RESPONSE_CODES_NAMES.APPROVED;

  return buildResponse(rc);
};
