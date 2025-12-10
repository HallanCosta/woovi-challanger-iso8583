import { ACCOUNTS, CLEARING } from '../src/modules/account/accounts.ts';
import { getAccounts } from '../src/modules/account/accountList.ts';
import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';

type WithBalance = {
  accountId: string;
  name: string;
  type: string;
  balance: string;
  credits_posted: string;
  debits_posted: string;
};

async function main() {
  const metas = [
    ...ACCOUNTS.map((account) => ({ id: account.id, name: account.name, type: 'user' })),
    { id: CLEARING.id, name: CLEARING.name, type: 'clearing' },
  ];

  const ids = metas.map((m) => m.id);
  const accounts = await getAccounts(ids);
  const map = new Map<bigint, any>();
  for (const acc of accounts) {
    map.set(acc.id, acc);
  }

  const rows: WithBalance[] = metas.map((m) => {
    const acc = map.get(m.id);
    const credits = acc?.credits_posted ?? 0n;
    const debits = acc?.debits_posted ?? 0n;
    const balance = credits - debits;

    return {
      accountId: m.id.toString(),
      name: m.name,
      type: m.type,
      balance: (balance / 100n).toString(),
      credits_posted: credits.toString(),
      debits_posted: debits.toString(),
    };
  });

  console.table(rows);
  await closeTbClient();
}

main();
