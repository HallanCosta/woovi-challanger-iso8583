import { ACCOUNTS } from '../account/accounts.ts';

export type Card = {
  pan: string;
  expiry: string; // YYMM
  accountId: bigint;
};

const DEFAULT_EXPIRY = '2812';
export const CARD_BINS = ['5162', '4026', '3907'] as const;

const [hallan1, hallan2] = ACCOUNTS;

export const CARDS: Card[] = [
  {
    pan: '5162000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: hallan1.id,
  },
  {
    pan: '4026000000000000',
    expiry: DEFAULT_EXPIRY,
    accountId: hallan2.id,
  },
];
