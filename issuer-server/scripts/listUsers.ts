import { ACCOUNTS } from '../src/account/accounts.ts';

const rows = ACCOUNTS.map((account) => ({
  name: account.name,
  accountId: account.id.toString(),
  ledger: 1,
}));

console.table(rows);
