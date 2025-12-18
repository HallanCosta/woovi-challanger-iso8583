import { getTbClient } from '../../tigerbeetle/tbClient.ts';

export type AccountResponse = {
  id: bigint;
  debits_posted: bigint;
  credits_posted: bigint;
};

export const getAccountsByIds = async (ids: readonly bigint[]): Promise<AccountResponse[]> => {
  const tb = getTbClient();
  const result = await tb.lookupAccounts(ids);
  return result as AccountResponse[];
};
