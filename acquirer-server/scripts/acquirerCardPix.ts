import acquirer from '../src/acquirer.ts';
import { closeBrandConnection } from '../src/brandClient.ts';

const transaction = {
  amount: '000000005214',                  // Amount in cents
  transactionId: '000123',                 // Transaction ID (6 dígitos)
  acquirerInstitution: '01020000000',      // Code acquirer (LLVAR)
  merchantId: 'WOOVIMERCHANT001',          // ID do merchant (hex) - ajustado para length par
  currency: '986',                         // Currency (hex) - 764 = BRL
  cardNumber: '3907000000000000',          // Card number with brand pix (PAN)
};

// Execute test request success sale
(async function() {
  await acquirer(transaction);
  closeBrandConnection()
})()
