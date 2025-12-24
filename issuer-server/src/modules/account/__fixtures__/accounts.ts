export type Account = {
  id: bigint;
  name: string;
  type?: 'customer' | 'clearing' | 'merchant';
};

export const ACCOUNTS: Account[] = [
  {
    id: 1001n,
    name: 'Hallan 1',
    type: 'customer',
  },
  {
    id: 1002n,
    name: 'Hallan 2',
    type: 'customer',
  },
];

export const MERCHANTS: Account[] = [{ id: 2001n, name: 'Merchant (Loja)', type: 'merchant' }];

export const CLEARING: Account = { id: 9001n, name: 'Demo Clearing', type: 'clearing' };
