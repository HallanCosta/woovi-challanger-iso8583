import type { ParsedIso8583Message } from '../../../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../../../../lib/iso8583/response.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../../../lib/iso8583/responseCodes.ts';

import { createLedgerEntry } from '../../ledger/commands/createLedgerEntry.ts';

import { toBigIntOrNull } from '../cardHelpers.ts';
import { findCard } from '../queries/findCard.ts';
import { MERCHANTS } from '../../account/__fixtures__/accounts.ts';
import { getAccountsByIds } from '../../account/queries/getAccountsByIds.ts';

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
  const amount = toBigIntOrNull(amountStr);
  const card = findCard(pan);

  const buildResponse = (rc: string) => {
    const responseMti = getResponseMti({ requestMti: iso.mti });
    const response = buildIso8583Response({ parsed: iso, mti: responseMti, rc, tpdu: TPDU_RESPONSE });

    return {
      rc,
      buffer: response.buffer,
    };
  };

  if (!card) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD);
  }

  if (amount === null) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_AMOUNT);
  }

  const debitAccountOverride = iso.fields.get(102)?.value;
  const creditAccountOverride = iso.fields.get(103)?.value;

  const debitAccountId = toBigIntOrNull(debitAccountOverride ?? card.accountId.toString());
  const merchant = MERCHANTS[0];
  const creditAccountId = toBigIntOrNull(creditAccountOverride ?? merchant.id.toString());

  if (!debitAccountId || !creditAccountId) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.INVALID_TRANSACTION);
  }

  const [debitAccount] = await getAccountsByIds([debitAccountId]);
  if (!debitAccount) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE);
  }

  const available = debitAccount.credits_posted - debitAccount.debits_posted;
  if (amount > available) {
    return buildResponse(ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS);
  }

  const entry = await createLedgerEntry({
    debitAccountId,
    creditAccountId,
    amount,
  });
  const rc = entry.rc;

  const response = buildResponse(rc);

  console.log(
    `[ISSUER][CARD->TRANSACTION] PAN=${pan} debit=${debitAccountId.toString()} credit=${creditAccountId.toString()} amount=${amount.toString()} rc=${rc} MTI=${getResponseMti({ requestMti: iso.mti })}`
  );

  return {
    rc,
    buffer: response.buffer
  };
};
