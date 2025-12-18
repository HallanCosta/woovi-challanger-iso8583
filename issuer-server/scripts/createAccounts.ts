import { seedCreateAccounts } from '../src/modules/account/commands/seedCreateAccounts.ts';
import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';

async function main() {
  await seedCreateAccounts();
  await closeTbClient();
  console.log('Contas básicas criadas/asseguradas no TigerBeetle.');
}

main();
