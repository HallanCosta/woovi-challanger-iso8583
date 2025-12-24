import { ACCOUNTS, CLEARING, MERCHANTS } from '../__fixtures__/accounts.ts';
import { findAccountMeta, mapAccountToLedgerView, type AccountLedgerView } from '../accountHelpers.ts';
import { getAccountsByIds } from './getAccountsByIds.ts';
import { getLatestDebit } from '../../ledger/queries/getLatestDebit.ts';

export const getAccountWithLatestDebit = async (
  accountId: bigint
): Promise<AccountLedgerView | null> => {
  const accountMeta = findAccountMeta(accountId, [...ACCOUNTS, ...MERCHANTS, CLEARING]);
  const type = accountMeta?.type ?? 'customer';

  const userMeta = accountMeta;
  if (!userMeta) {
    return null;
  }

  const [account] = await getAccountsByIds([accountId]);
  if (!account) {
    return null;
  }

  const lastDebit = await getLatestDebit(accountId);

  return mapAccountToLedgerView(account, userMeta.name, lastDebit, type);
};
