import { ACCOUNTS } from '../../account/__fixtures__/accounts.ts';

export type Card = {
  pan: string;
  expiry: string; // YYMM
  accountId: bigint;
};

const DEFAULT_EXPIRY = '2812';
export const CARD_BINS = ['5162', '4026', '3907'] as const;

const [account1, account2] = ACCOUNTS;

export const CARDS: Card[] = [
  {
    pan: '5162000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: account1.id,
  },
  {
    pan: '5162000000002222',
    expiry: DEFAULT_EXPIRY,
    accountId: account2.id,
  },
  {
    pan: '4026000000001111',
    expiry: DEFAULT_EXPIRY,
    accountId: account1.id,
  },
  {
    pan: '4026000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: account2.id,
  },
  {
    pan: '3907000000001111',
    expiry: DEFAULT_EXPIRY,
    accountId: account1.id,
  },
  {
    pan: '3907000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: account2.id,
  },
];
