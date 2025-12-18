import { AccountFilterFlags, type Transfer } from 'tigerbeetle-node';

import { getTbClient } from '../../tigerbeetle/tbClient.ts';

export const getLatestDebit = async (accountId: bigint): Promise<Transfer | null> => {
  const tb = getTbClient();
  const [lastDebit] = (await tb.getAccountTransfers({
    account_id: accountId,
    user_data_128: 0n,
    user_data_64: 0n,
    user_data_32: 0,
    code: 0,
    timestamp_min: 0n,
    timestamp_max: 0n,
    limit: 1,
    flags: AccountFilterFlags.debits | AccountFilterFlags.reversed,
  })) as Transfer[];

  return lastDebit ?? null;
};
