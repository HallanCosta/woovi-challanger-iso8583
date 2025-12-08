import { ACCOUNTS } from '../account/accounts.ts';

export type BankUser = {
  name: string;
  accountId: bigint;
};

export type Bank = {
  name: string;
  binPrefixes: readonly string[];
  users: BankUser[];
  merchant: { name: string; accountId: bigint };
};

export const BANKS: Bank[] = [
  {
    name: 'HallanBank',
    binPrefixes: ['5162', '4026', '3907'],
    users: [
      { name: 'Hallan User 1', accountId: ACCOUNTS.hallanUser1 },
      { name: 'Hallan User 2', accountId: ACCOUNTS.hallanUser2 },
    ],
    merchant: { name: 'Hallan Merchant', accountId: ACCOUNTS.hallanMerchant },
  },
  // Woovi bank left commented out to keep issuer focused only on Hallan.
  // {
  //   name: 'Woovi',
  //   binPrefixes: ['2306', '4815', '3910'],
  //   users: [
  //     { name: 'Woovi User 1', accountId: ACCOUNTS.wooviUser1 },
  //     { name: 'Woovi User 2', accountId: ACCOUNTS.wooviUser2 },
  //   ],
  //   merchant: { name: 'Woovi Merchant', accountId: ACCOUNTS.wooviMerchant },
  // },
];

export const CLEARING = { name: 'Demo Clearing', accountId: ACCOUNTS.clearing };
