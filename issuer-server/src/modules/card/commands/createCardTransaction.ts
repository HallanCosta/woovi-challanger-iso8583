import type { ParsedIso8583Message } from '../../../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../../../../lib/iso8583/response.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../../../lib/iso8583/responseCodes.ts';

import { createLedgerEntry } from '../../ledger/commands/createLedgerEntry.ts';

import { findCard } from '../queries/findCard.ts';
import { CLEARING } from '../../account/__fixtures__/accounts.ts';

import { TPDU_RESPONSE } from '../../../utils/tpdu.ts';

type CreateCardTransaction = {
  iso: ParsedIso8583Message;
};

export type CreateCardTransactionResponse = {
  rc: string;
  buffer: Buffer;
};

export const createCardTransaction = async ({ iso }: CreateCardTransaction): Promise<CreateCardTransactionResponse> => {
  const pan = iso.fields.get(2)?.value ?? '';
  const amountStr = iso.fields.get(4)?.value ?? '0';
  const amount = BigInt(amountStr);
  const card = findCard(pan);

  if (!card) {
    const responseMti = getResponseMti({ requestMti: iso.mti });
    const response = buildIso8583Response({
      parsed: iso,
      mti: responseMti,
      rc: '14',
      tpdu: TPDU_RESPONSE
    });

    return {
      rc: ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD,
      buffer: response.buffer
    };
  }

  const entry = await createLedgerEntry({
    debitAccountId: card.accountId,
    creditAccountId: CLEARING.id,
    amount
  });
  const rc = entry.rc;

  const responseMti = getResponseMti({ requestMti: iso.mti });
  const response = buildIso8583Response({ parsed: iso, mti: responseMti, rc, tpdu: TPDU_RESPONSE });

  console.log(
    `[ISSUER][CARD->TRANSACTION] PAN=${pan} debit=${card.accountId} credit=${CLEARING.id} amount=${amount.toString()} rc=${rc} MTI=${responseMti}`
  );

  return {
    rc,
    buffer: response.buffer
  };
};
