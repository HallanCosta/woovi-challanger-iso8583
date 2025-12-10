import { seedCreateAccounts } from '../src/modules/account/createAccounts.ts';
import { closeTbClient } from '../src/modules/tigerbeetle/tbClient.ts';

async function main() {
  await seedCreateAccounts();
  await closeTbClient();
  console.log('Contas básicas criadas/asseguradas no TigerBeetle.');
}

main();
