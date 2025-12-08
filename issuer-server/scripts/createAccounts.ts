import { createCoreAccounts } from '../src/account/createAccounts.ts';
import { closeTbClient } from '../src/tigerbeetle/tbClient.ts';

async function main() {
  await createCoreAccounts();
  await closeTbClient();
  console.log('Contas básicas criadas/asseguradas no TigerBeetle.');
}

main().catch((err) => {
  console.error(err);
  throw err;
});
