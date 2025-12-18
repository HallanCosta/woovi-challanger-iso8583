import { getTbClient } from '../../tigerbeetle/tbClient.ts';
import { newId } from '../../../utils/id.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../../../../lib/iso8583/responseCodes.ts';
import { mapTbErrorToResponseCodeIso8583 } from '../ledgerHelpers.ts';

type CreateLedgerEntryResponse = {
  rc: string;
};

type CreateLedgerEntryParams = {
  debitAccountId: bigint;
  creditAccountId: bigint;
  amount: bigint;
};

export const createLedgerEntry = async ({
  debitAccountId,
  creditAccountId,
  amount
}: CreateLedgerEntryParams): Promise<CreateLedgerEntryResponse> => {
  const transferId = newId();
  const tb = getTbClient();

  try {
    const transfer_errors = await tb.createTransfers([
      {
        id: transferId,
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        amount,
        pending_id: 0n,
        user_data_128: 0n,
        user_data_64: 0n,
        user_data_32: 0,
        timeout: 0,
        flags: 0,
        ledger: 1,
        code: 1,
        timestamp: 0n,
      },
    ]);

    if (transfer_errors.length > 0) {
      for (const error of transfer_errors) {
        const responseCodeError = mapTbErrorToResponseCodeIso8583(error.result);

        return { rc: responseCodeError };
      }
    }

    return {
      rc: ISO8583_RESPONSE_CODES_NAMES.APPROVED
    };
  } catch (err: any) {
    console.error(`[TB][LEDGER][${transferId}] exception=${err?.message ?? err}`);

    return {
      rc: ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE
    };
  }
};
