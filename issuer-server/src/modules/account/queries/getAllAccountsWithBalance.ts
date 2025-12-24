import { ACCOUNTS, CLEARING, MERCHANTS, type Account } from '../__fixtures__/accounts.ts';
import { getAccountsByIds } from './getAccountsByIds.ts';
import { getLatestDebit } from '../../ledger/queries/getLatestDebit.ts';
import { mapAccountToLedgerView, type AccountLedgerView } from '../accountHelpers.ts';

const ACCOUNT_META: Account[] = [...ACCOUNTS, ...MERCHANTS, CLEARING];

export const getAllAccountsWithBalance = async (): Promise<AccountLedgerView[]> => {
  const ids = ACCOUNT_META.map((account) => account.id);
  const [accounts, latestDebits] = await Promise.all([
    getAccountsByIds(ids),
    Promise.all(ids.map((id) => getLatestDebit(id))),
  ]);

  const latestDebitsById = new Map<bigint, (typeof latestDebits)[number]>(
    ids.map((id, index) => [id, latestDebits[index]])
  );

  return accounts
    .map((account) => {
      const meta = ACCOUNT_META.find((user) => user.id === account.id);
      if (!meta) {
        return null;
      }

      const lastDebit = latestDebitsById.get(account.id);
      const type: AccountLedgerView['type'] = meta.type ?? 'customer';

      return mapAccountToLedgerView(account, meta.name, lastDebit, type);
    })
    .filter((account): account is AccountLedgerView => account !== null);
};
