export type Account = {
  id: bigint;
  name: string;
};

export const ACCOUNTS: Account[] = [
  {
    id: 1001n,
    name: 'Hallan 1',
  },
  {
    id: 1002n,
    name: 'Hallan 2',
  },
];

export const CLEARING = { id: 9001n, name: 'Demo Clearing' };
