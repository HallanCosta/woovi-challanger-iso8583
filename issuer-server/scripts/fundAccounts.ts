import { resetAndFundAccounts, fundUserAccounts } from '../src/account/accountAdmin.ts';

const mode = process.argv[2] ?? 'fund';

async function main() {
  if (mode === 'reset') {
    await resetAndFundAccounts();
    console.log('Contas zeradas e usuários financiados com 10.000,00.');

  } else {
    await fundUserAccounts();
    console.log('Usuários financiados com 10.000,00.');
  }
}

main().catch((err) => {
  console.error(err);
  throw err;
});
