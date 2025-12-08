import type { ParsedIsoMessage } from '../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../../lib/iso8583/response.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../lib/iso8583/responseCodes.ts';

import { createLedgerEntry } from '../ledger/ledgerTransaction.ts';

import { TPDU_RESPONSE } from '../utils/tpdu.ts';
import { findCard } from '../utils/cards.ts';

import type { CaptureResult } from './cardTypes.ts';

type CreateCardTransaction = {
  iso: ParsedIsoMessage;
};

export const createCardTransaction = async ({ iso }: CreateCardTransaction): Promise<CaptureResult> => {
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

  const entry = await createLedgerEntry(card.accountId, card.merchantAccountId, amount);
  const rc = entry.rc;

  console.log(
    `[ISSUER][CARD->TRANSACTION] PAN=${pan} debit=${card.accountId} merchant=${card.merchantAccountId} amount=${amount.toString()} rc=${rc}`
  );

  const responseMti = getResponseMti({ requestMti: iso.mti, fallback: '0210' });
  const response = buildIso8583Response({ parsed: iso, mti: responseMti, rc, tpdu: TPDU_RESPONSE });

  return {
    rc,
    buffer: response.buffer
  };
};
