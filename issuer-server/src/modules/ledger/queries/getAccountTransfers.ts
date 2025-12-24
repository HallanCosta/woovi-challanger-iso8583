import { AccountFilterFlags, type Transfer } from 'tigerbeetle-node';

import { getTbClient } from '../../tigerbeetle/tbClient.ts';

export const getAccountTransfers = async (
  accountId: bigint,
  limit = 50
): Promise<Transfer[]> => {
  const tb = getTbClient();

  const transfers = (await tb.getAccountTransfers({
    account_id: accountId,
    user_data_128: 0n,
    user_data_64: 0n,
    user_data_32: 0,
    code: 0,
    timestamp_min: 0n,
    timestamp_max: 0n,
    limit,
    flags: AccountFilterFlags.debits | AccountFilterFlags.credits | AccountFilterFlags.reversed,
  })) as Transfer[];

  return transfers;
};
