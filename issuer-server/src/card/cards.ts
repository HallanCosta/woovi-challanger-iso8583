import { ACCOUNTS } from '../account/accounts.ts';

export type Card = {
  pan: string;
  expiry: string; // YYMM
  accountId: bigint;
  merchantAccountId: bigint;
  bank: 'HallanBank';
};

const DEFAULT_EXPIRY = '2812';

export const CARDS: Card[] = [
  {
    pan: '5162000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: ACCOUNTS.hallanUser1,
    merchantAccountId: ACCOUNTS.hallanMerchant,
    bank: 'HallanBank',
  },
  {
    pan: '4026000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: ACCOUNTS.hallanUser2,
    merchantAccountId: ACCOUNTS.hallanMerchant,
    bank: 'HallanBank',
  },
  // Woovi cards commented out to keep issuer focused on Hallan only.
  // {
  //   pan: '2306000000000000',
  //   expiry: DEFAULT_EXPIRY,
  //   accountId: ACCOUNTS.wooviUser1,
  //   merchantAccountId: ACCOUNTS.wooviMerchant,
  //   bank: 'Woovi',
  // },
  // {
  //   pan: '4815000000000000',
  //   expiry: DEFAULT_EXPIRY,
  //   accountId: ACCOUNTS.wooviUser2,
  //   merchantAccountId: ACCOUNTS.wooviMerchant,
  //   bank: 'Woovi',
  // },
];
