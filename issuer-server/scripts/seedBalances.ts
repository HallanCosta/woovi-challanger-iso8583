import { seedInitialBalances } from '../src/modules/account/commands/seedCreateAccounts.ts';
import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';

async function main() {
  await seedInitialBalances();
  await closeTbClient();

  console.log('Balances seeded: contas recarregadas com 10.000,00 a partir da clearing.');
}

main()
