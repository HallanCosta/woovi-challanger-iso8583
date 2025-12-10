import { ACCOUNTS, CLEARING } from '../src/account/accounts.ts';

const rows = [
  ...ACCOUNTS.map((account) => ({
    type: 'user',
    name: account.name,
    accountId: account.id.toString(),
    ledger: 1,
  })),
  {
    bank: '',
    type: 'clearing',
    name: CLEARING.name,
    accountId: CLEARING.id.toString(),
    ledger: 1,
  },
];

console.table(rows);
